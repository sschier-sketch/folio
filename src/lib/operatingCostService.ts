import { supabase } from './supabase';

export interface OperatingCostStatement {
  id: string;
  user_id: string;
  property_id: string;
  year: number;
  status: 'draft' | 'ready' | 'sent';
  total_costs: number;
  created_at: string;
  updated_at: string;
}

export interface OperatingCostLineItem {
  id: string;
  statement_id: string;
  cost_type: string;
  allocation_key: 'area' | 'persons' | 'units' | 'consumption';
  amount: number;
  created_at: string;
}

export interface OperatingCostResult {
  id: string;
  statement_id: string;
  unit_id: string | null;
  tenant_id: string | null;
  days_in_period: number;
  area_sqm: number;
  cost_share: number;
  prepayments: number;
  balance: number;
  created_at: string;
}

export interface OperatingCostPdf {
  id: string;
  statement_id: string;
  tenant_id: string | null;
  unit_id: string | null;
  file_path: string;
  generated_at: string;
}

export interface OperatingCostSendLog {
  id: string;
  statement_id: string;
  tenant_id: string | null;
  email: string;
  sent_at: string;
  status: 'success' | 'failed';
  error_message: string | null;
}

export interface CreateStatementParams {
  property_id: string;
  year: number;
}

export interface ListStatementsParams {
  year?: number;
  property_id?: string;
  search?: string;
}

export interface UpsertLineItemParams {
  statement_id: string;
  items: Array<{
    id?: string;
    cost_type: string;
    allocation_key: 'area' | 'persons' | 'units' | 'consumption';
    amount: number;
  }>;
}

export const operatingCostService = {
  async createStatement(
    userId: string,
    params: CreateStatementParams
  ): Promise<{ data: OperatingCostStatement | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_statements')
        .insert({
          user_id: userId,
          property_id: params.property_id,
          year: params.year,
          status: 'draft',
          total_costs: 0,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating statement:', error);
      return { data: null, error };
    }
  },

  async updateStatementStatus(
    statementId: string,
    status: 'draft' | 'ready' | 'sent'
  ): Promise<{ data: OperatingCostStatement | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_statements')
        .update({ status })
        .eq('id', statementId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating statement status:', error);
      return { data: null, error };
    }
  },

  async upsertLineItems(
    params: UpsertLineItemParams
  ): Promise<{ data: OperatingCostLineItem[] | null; error: any }> {
    try {
      const itemsToUpsert = params.items.map((item) => {
        const baseItem: any = {
          statement_id: params.statement_id,
          cost_type: item.cost_type,
          allocation_key: item.allocation_key,
          amount: item.amount,
        };

        if (item.id) {
          baseItem.id = item.id;
        }

        return baseItem;
      });

      const { data, error } = await supabase
        .from('operating_cost_line_items')
        .upsert(itemsToUpsert, { onConflict: 'id' })
        .select();

      if (!error && data) {
        const totalCosts = data.reduce((sum, item) => sum + Number(item.amount), 0);

        await supabase
          .from('operating_cost_statements')
          .update({ total_costs: totalCosts })
          .eq('id', params.statement_id);
      }

      return { data, error };
    } catch (error) {
      console.error('Error upserting line items:', error);
      return { data: null, error };
    }
  },

  async computeResults(
    statementId: string
  ): Promise<{ data: OperatingCostResult[] | null; error: any }> {
    try {
      const { data: statement, error: statementError } = await supabase
        .from('operating_cost_statements')
        .select('*')
        .eq('id', statementId)
        .single();

      if (statementError || !statement) {
        throw statementError || new Error('Statement not found');
      }

      const { data: lineItems, error: lineItemsError } = await supabase
        .from('operating_cost_line_items')
        .select('*')
        .eq('statement_id', statementId);

      if (lineItemsError) throw lineItemsError;

      const periodStart = new Date(statement.year, 0, 1);
      const periodEnd = new Date(statement.year, 11, 31);
      const totalDaysInYear = 365 + (new Date(statement.year, 1, 29).getMonth() === 1 ? 1 : 0);

      const { data: contracts, error: contractsError } = await supabase
        .from('rental_contracts')
        .select('*')
        .eq('property_id', statement.property_id)
        .or(`contract_end.is.null,contract_end.gte.${periodStart.toISOString().split('T')[0]}`)
        .lte('contract_start', periodEnd.toISOString().split('T')[0]);

      if (contractsError) {
        console.error('Error loading contracts:', contractsError);
        throw contractsError;
      }

      console.log(`Found ${contracts?.length || 0} contracts for property ${statement.property_id} in year ${statement.year}`);

      if (!contracts || contracts.length === 0) {
        console.warn('No contracts found for this property and period');
        return { data: [], error: null };
      }

      await supabase
        .from('operating_cost_results')
        .delete()
        .eq('statement_id', statementId);

      const results: OperatingCostResult[] = [];

      for (const contract of contracts) {
        console.log(`Processing contract ${contract.id}:`, {
          tenant_id: contract.tenant_id,
          unit_id: contract.unit_id,
          contract_start: contract.contract_start,
          contract_end: contract.contract_end
        });

        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', contract.tenant_id)
          .maybeSingle();

        const { data: unit } = contract.unit_id ? await supabase
          .from('property_units')
          .select('*')
          .eq('id', contract.unit_id)
          .maybeSingle() : { data: null };

        console.log(`Loaded tenant: ${tenant ? `${tenant.first_name} ${tenant.last_name}` : 'NOT FOUND'}`);
        console.log(`Loaded unit: ${unit ? unit.unit_number : 'NONE'}`);

        if (!tenant) {
          console.warn(`Tenant with id ${contract.tenant_id} not found for contract ${contract.id}`);
          continue;
        }

        const contractStart = new Date(contract.contract_start);
        const contractEnd = contract.contract_end ? new Date(contract.contract_end) : periodEnd;

        const effectiveStart = contractStart > periodStart ? contractStart : periodStart;
        const effectiveEnd = contractEnd < periodEnd ? contractEnd : periodEnd;

        const daysInPeriod = Math.floor(
          (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        const unitArea = unit?.area_sqm || 0;

        let costShare = 0;

        if (lineItems && lineItems.length > 0) {
          for (const lineItem of lineItems) {
            let share = 0;

            if (lineItem.allocation_key === 'area') {
              const { data: allUnits } = await supabase
                .from('property_units')
                .select('area_sqm')
                .eq('property_id', statement.property_id);

              const totalArea = allUnits?.reduce(
                (sum, u) => sum + Number(u.area_sqm || 0),
                0
              ) || 1;

              share = (Number(unitArea) / totalArea) * Number(lineItem.amount);
            } else if (lineItem.allocation_key === 'units') {
              const { count } = await supabase
                .from('property_units')
                .select('*', { count: 'exact', head: true })
                .eq('property_id', statement.property_id);

              share = Number(lineItem.amount) / (count || 1);
            } else if (lineItem.allocation_key === 'persons') {
              const { count } = await supabase
                .from('property_units')
                .select('*', { count: 'exact', head: true })
                .eq('property_id', statement.property_id);

              share = Number(lineItem.amount) / (count || 1);
            }

            const proRatedShare = (share * daysInPeriod) / totalDaysInYear;
            costShare += proRatedShare;
          }
        }

        const monthlyPrepayment = Number(contract.additional_costs || 0);
        const prepayments = monthlyPrepayment * 12 * (daysInPeriod / totalDaysInYear);

        const balance = costShare - prepayments;

        const { data: result, error: insertError } = await supabase
          .from('operating_cost_results')
          .insert({
            statement_id: statementId,
            unit_id: contract.unit_id,
            tenant_id: contract.tenant_id,
            days_in_period: daysInPeriod,
            area_sqm: unitArea,
            cost_share: Math.round(costShare * 100) / 100,
            prepayments: Math.round(prepayments * 100) / 100,
            balance: Math.round(balance * 100) / 100,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (result) results.push(result);
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error computing results:', error);
      return { data: null, error };
    }
  },

  async listStatements(
    userId: string,
    params?: ListStatementsParams
  ): Promise<{ data: OperatingCostStatement[] | null; error: any }> {
    try {
      let query = supabase
        .from('operating_cost_statements')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false });

      if (params?.year) {
        query = query.eq('year', params.year);
      }

      if (params?.property_id) {
        query = query.eq('property_id', params.property_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data;
      if (params?.search && data) {
        const searchLower = params.search.toLowerCase();
        filteredData = data.filter((statement) =>
          statement.year.toString().includes(searchLower)
        );
      }

      return { data: filteredData, error: null };
    } catch (error) {
      console.error('Error listing statements:', error);
      return { data: null, error };
    }
  },

  async getStatementDetail(
    statementId: string
  ): Promise<{
    statement: OperatingCostStatement | null;
    lineItems: OperatingCostLineItem[] | null;
    results: OperatingCostResult[] | null;
    error: any;
  }> {
    try {
      const [statementRes, lineItemsRes, resultsRes] = await Promise.all([
        supabase
          .from('operating_cost_statements')
          .select('*')
          .eq('id', statementId)
          .single(),
        supabase
          .from('operating_cost_line_items')
          .select('*')
          .eq('statement_id', statementId)
          .order('created_at', { ascending: true }),
        supabase
          .from('operating_cost_results')
          .select('*')
          .eq('statement_id', statementId)
          .order('created_at', { ascending: true }),
      ]);

      return {
        statement: statementRes.data,
        lineItems: lineItemsRes.data,
        results: resultsRes.data,
        error: statementRes.error || lineItemsRes.error || resultsRes.error,
      };
    } catch (error) {
      console.error('Error getting statement detail:', error);
      return {
        statement: null,
        lineItems: null,
        results: null,
        error,
      };
    }
  },

  async deleteStatement(
    statementId: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('operating_cost_statements')
        .delete()
        .eq('id', statementId);

      return { error };
    } catch (error) {
      console.error('Error deleting statement:', error);
      return { error };
    }
  },

  async deleteLineItem(
    lineItemId: string
  ): Promise<{ error: any }> {
    try {
      const { data: lineItem, error: fetchError } = await supabase
        .from('operating_cost_line_items')
        .select('statement_id')
        .eq('id', lineItemId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('operating_cost_line_items')
        .delete()
        .eq('id', lineItemId);

      if (error) throw error;

      if (lineItem) {
        const { data: remainingItems } = await supabase
          .from('operating_cost_line_items')
          .select('amount')
          .eq('statement_id', lineItem.statement_id);

        const totalCosts = remainingItems?.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        ) || 0;

        await supabase
          .from('operating_cost_statements')
          .update({ total_costs: totalCosts })
          .eq('id', lineItem.statement_id);
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting line item:', error);
      return { error };
    }
  },

  async createResult(
    params: Omit<OperatingCostResult, 'id' | 'created_at'>
  ): Promise<{ data: OperatingCostResult | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_results')
        .insert(params)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating result:', error);
      return { data: null, error };
    }
  },

  async createPdf(
    params: Omit<OperatingCostPdf, 'id' | 'generated_at'>
  ): Promise<{ data: OperatingCostPdf | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_pdfs')
        .insert(params)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating pdf:', error);
      return { data: null, error };
    }
  },

  async createSendLog(
    params: Omit<OperatingCostSendLog, 'id' | 'sent_at'>
  ): Promise<{ data: OperatingCostSendLog | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_send_logs')
        .insert(params)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating send log:', error);
      return { data: null, error };
    }
  },

  async getSendLogs(
    statementId: string
  ): Promise<{ data: OperatingCostSendLog[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_send_logs')
        .select('*')
        .eq('statement_id', statementId)
        .order('sent_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting send logs:', error);
      return { data: null, error };
    }
  },

  async getPdfs(
    statementId: string
  ): Promise<{ data: OperatingCostPdf[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('operating_cost_pdfs')
        .select('*')
        .eq('statement_id', statementId)
        .order('generated_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting pdfs:', error);
      return { data: null, error };
    }
  },
};
