import { supabase } from './supabase';

export interface AllocationParams {
  alloc_unit_area: number | null;
  alloc_total_area: number | null;
  alloc_unit_persons: number | null;
  alloc_total_persons: number | null;
  alloc_total_units: number | null;
  alloc_unit_mea: number | null;
  alloc_total_mea: number | null;
}

export interface OperatingCostStatement {
  id: string;
  user_id: string;
  property_id: string;
  unit_id?: string | null;
  year: number;
  status: 'draft' | 'ready' | 'sent';
  total_costs: number;
  alloc_unit_area?: number | null;
  alloc_total_area?: number | null;
  alloc_unit_persons?: number | null;
  alloc_total_persons?: number | null;
  alloc_total_units?: number | null;
  alloc_unit_mea?: number | null;
  alloc_total_mea?: number | null;
  created_at: string;
  updated_at: string;
}

export interface OperatingCostLineItem {
  id: string;
  statement_id: string;
  cost_type: string;
  allocation_key: 'area' | 'persons' | 'units' | 'consumption' | 'mea' | 'direct' | 'consumption_billing';
  amount: number;
  is_section_35a?: boolean;
  section_35a_category?: 'haushaltsnahe_dienstleistungen' | 'handwerkerleistungen' | null;
  group_label?: string | null;
  custom_unit_mea?: number | null;
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

export interface TemplateItem {
  cost_type: string;
  allocation_key: string;
  is_section_35a?: boolean;
  section_35a_category?: string | null;
  group_label?: string | null;
}

export interface OperatingCostTemplate {
  id: string;
  user_id: string;
  property_id: string;
  unit_id: string | null;
  name: string;
  alloc_unit_area: number | null;
  alloc_total_area: number | null;
  alloc_unit_persons: number | null;
  alloc_total_persons: number | null;
  alloc_total_units: number | null;
  alloc_unit_mea: number | null;
  alloc_total_mea: number | null;
  operating_cost_template_items: TemplateItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateStatementParams {
  property_id: string;
  year: number;
  unit_id?: string | null;
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
    allocation_key: 'area' | 'persons' | 'units' | 'consumption' | 'mea' | 'direct' | 'consumption_billing';
    amount: number;
    is_section_35a?: boolean;
    section_35a_category?: 'haushaltsnahe_dienstleistungen' | 'handwerkerleistungen' | null;
    group_label?: string | null;
    custom_unit_mea?: number | null;
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
          unit_id: params.unit_id || null,
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
      await supabase
        .from('operating_cost_line_items')
        .delete()
        .eq('statement_id', params.statement_id);

      const itemsToInsert = params.items.map((item) => ({
        statement_id: params.statement_id,
        cost_type: item.cost_type,
        allocation_key: item.allocation_key,
        amount: item.amount,
        is_section_35a: item.is_section_35a || false,
        section_35a_category: item.section_35a_category || null,
        group_label: item.group_label || null,
        custom_unit_mea: item.custom_unit_mea ?? null,
      }));

      const { data, error } = await supabase
        .from('operating_cost_line_items')
        .insert(itemsToInsert)
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

      const periodStartStr = `${statement.year}-01-01`;
      const periodEndStr = `${statement.year}-12-31`;
      const periodStart = new Date(periodStartStr);
      const periodEnd = new Date(periodEndStr);
      const totalDaysInYear = 365 + (new Date(statement.year, 1, 29).getMonth() === 1 ? 1 : 0);

      console.log('DEBUG: Loading contracts for property:', statement.property_id);
      console.log('DEBUG: Unit ID from statement:', statement.unit_id);
      console.log('DEBUG: Period:', {
        start: periodStartStr,
        end: periodEndStr,
        year: statement.year
      });

      const { data: allContractsDebug } = await supabase
        .from('rental_contracts')
        .select('id, tenant_id, unit_id, status, contract_start, contract_end')
        .eq('property_id', statement.property_id);

      console.log('DEBUG: All contracts for property (before filtering):', allContractsDebug);

      let contractsQuery = supabase
        .from('rental_contracts')
        .select('*')
        .eq('property_id', statement.property_id)
        .or(`contract_end.is.null,contract_end.gte.${periodStartStr}`)
        .lte('contract_start', periodEndStr);

      if (statement.unit_id) {
        contractsQuery = contractsQuery.eq('unit_id', statement.unit_id);
      }

      const { data: contracts, error: contractsError } = await contractsQuery;

      if (contractsError) {
        console.error('Error loading contracts:', contractsError);
        throw contractsError;
      }

      console.log(`Found ${contracts?.length || 0} contracts matching period for property ${statement.property_id} in year ${statement.year}`);
      if (statement.unit_id) {
        console.log(`Filtered for unit_id: ${statement.unit_id}`);
      }
      console.log('DEBUG: Contracts after period filter:', contracts);

      if (!contracts || contracts.length === 0) {
        const unitInfo = statement.unit_id ? ` and unit ${statement.unit_id}` : '';
        console.warn(`No contracts found for this property${unitInfo} and period`);
        console.warn('Check the following:');
        console.warn('1. Does the property have rental contracts?');
        if (statement.unit_id) {
          console.warn('2. Is the contract assigned to the correct unit_id?');
        }
        console.warn('3. Do the contracts overlap with the billing year?');
        console.warn('4. Are the contract_start and contract_end dates correct?');
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

        const unitArea = statement.alloc_unit_area != null
          ? Number(statement.alloc_unit_area)
          : Number(unit?.area_sqm || 0);

        const hasStoredAlloc = statement.alloc_total_area != null || statement.alloc_total_units != null;

        let costShare = 0;

        if (lineItems && lineItems.length > 0) {
          for (const lineItem of lineItems) {
            let share = 0;
            const amt = Number(lineItem.amount);

            if (hasStoredAlloc) {
              if (lineItem.allocation_key === 'area') {
                const uArea = Number(statement.alloc_unit_area || 0);
                const tArea = Number(statement.alloc_total_area || 0);
                share = tArea > 0 ? (uArea / tArea) * amt : 0;
              } else if (lineItem.allocation_key === 'units') {
                const tUnits = Number(statement.alloc_total_units || 0);
                share = tUnits > 0 ? amt / tUnits : 0;
              } else if (lineItem.allocation_key === 'persons') {
                const uPers = Number(statement.alloc_unit_persons || 0);
                const tPers = Number(statement.alloc_total_persons || 0);
                share = tPers > 0 ? (uPers / tPers) * amt : 0;
              } else if (lineItem.allocation_key === 'consumption') {
                const tUnits = Number(statement.alloc_total_units || 0);
                share = tUnits > 0 ? amt / tUnits : 0;
              } else if (lineItem.allocation_key === 'mea') {
                const uMea = lineItem.custom_unit_mea != null ? Number(lineItem.custom_unit_mea) : Number(statement.alloc_unit_mea || 0);
                const tMea = Number(statement.alloc_total_mea || 0);
                share = tMea > 0 ? (uMea / tMea) * amt : 0;
              } else if (lineItem.allocation_key === 'direct' || lineItem.allocation_key === 'consumption_billing') {
                share = amt;
              }
            } else {
              if (lineItem.allocation_key === 'area') {
                const { data: allUnits } = await supabase
                  .from('property_units')
                  .select('area_sqm')
                  .eq('property_id', statement.property_id);
                const totalArea = allUnits?.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0) || 1;
                share = (Number(unit?.area_sqm || 0) / totalArea) * amt;
              } else if (lineItem.allocation_key === 'units') {
                const { count } = await supabase
                  .from('property_units')
                  .select('*', { count: 'exact', head: true })
                  .eq('property_id', statement.property_id);
                share = amt / (count || 1);
              } else if (lineItem.allocation_key === 'persons') {
                const { count } = await supabase
                  .from('property_units')
                  .select('*', { count: 'exact', head: true })
                  .eq('property_id', statement.property_id);
                share = amt / (count || 1);
              } else if (lineItem.allocation_key === 'consumption') {
                const { count } = await supabase
                  .from('property_units')
                  .select('*', { count: 'exact', head: true })
                  .eq('property_id', statement.property_id);
                share = amt / (count || 1);
              } else if (lineItem.allocation_key === 'mea') {
                const { data: allUnitsWithMea } = await supabase
                  .from('property_units')
                  .select('id, mea')
                  .eq('property_id', statement.property_id);
                const parseMea = (mea: string | null): number => {
                  if (!mea) return 0;
                  const parts = mea.split('/').map(s => Number(s.trim()));
                  if (parts.length === 2 && !isNaN(parts[0]) && parts[1] > 0) return parts[0];
                  return 0;
                };
                const unitMeaVal = parseMea(unit?.mea);
                const totalMeaNumerator = allUnitsWithMea?.reduce((sum, u) => sum + parseMea(u.mea), 0) || 1;
                if (totalMeaNumerator > 0) {
                  share = (unitMeaVal / totalMeaNumerator) * amt;
                }
              } else if (lineItem.allocation_key === 'direct' || lineItem.allocation_key === 'consumption_billing') {
                share = amt;
              }
            }

            const proRatedShare = (share * daysInPeriod) / totalDaysInYear;
            costShare += proRatedShare;
          }
        }

        const monthlyPrepayment = Number(contract.additional_costs || 0);
        const prepayments = monthlyPrepayment * 12 * (daysInPeriod / totalDaysInYear);

        const balance = costShare - prepayments;

        const resultData = {
          statement_id: statementId,
          unit_id: contract.unit_id,
          tenant_id: contract.tenant_id,
          days_in_period: daysInPeriod,
          area_sqm: unitArea,
          cost_share: Math.round(costShare * 100) / 100,
          prepayments: Math.round(prepayments * 100) / 100,
          balance: Math.round(balance * 100) / 100,
        };

        const { data: existingResult } = await supabase
          .from('operating_cost_results')
          .select('id')
          .eq('statement_id', statementId)
          .eq('tenant_id', contract.tenant_id)
          .eq('unit_id', contract.unit_id || null)
          .maybeSingle();

        let result;
        if (existingResult) {
          const { data: updated } = await supabase
            .from('operating_cost_results')
            .update(resultData)
            .eq('id', existingResult.id)
            .select()
            .single();
          result = updated;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('operating_cost_results')
            .insert(resultData)
            .select()
            .single();
          if (insertError && !insertError.message?.includes('duplicate')) {
            throw insertError;
          }
          result = inserted;
        }

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

  async loadAllocationDefaults(
    propertyId: string,
    unitId: string | null,
    year: number
  ): Promise<{ data: AllocationParams | null; error: any }> {
    try {
      const { data: allUnits } = await supabase
        .from('property_units')
        .select('id, area_sqm, mea')
        .eq('property_id', propertyId);

      let unitArea = 0;
      let totalArea = 0;
      let totalUnits = allUnits?.length || 0;
      let unitMea = 0;
      let totalMea = 0;

      const parseMea = (mea: string | null): number => {
        if (!mea) return 0;
        const parts = mea.split('/').map(s => Number(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && parts[1] > 0) {
          return parts[0];
        }
        return 0;
      };

      if (allUnits) {
        totalArea = allUnits.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0);
        totalMea = allUnits.reduce((sum, u) => sum + parseMea(u.mea), 0);

        if (unitId) {
          const unit = allUnits.find(u => u.id === unitId);
          if (unit) {
            unitArea = Number(unit.area_sqm || 0);
            unitMea = parseMea(unit.mea);
          }
        }
      }

      const periodStart = `${year}-01-01`;
      const periodEnd = `${year}-12-31`;

      let contractsQuery = supabase
        .from('rental_contracts')
        .select('tenant_id, unit_id')
        .eq('property_id', propertyId)
        .or(`contract_end.is.null,contract_end.gte.${periodStart}`)
        .lte('contract_start', periodEnd);

      const { data: contracts } = await contractsQuery;

      let unitPersons = 0;
      let totalPersons = 0;

      if (contracts && contracts.length > 0) {
        const tenantIds = [...new Set(contracts.map(c => c.tenant_id))];
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id, household_size')
          .in('id', tenantIds);

        if (tenants) {
          totalPersons = tenants.reduce((sum, t) => sum + Number(t.household_size || 1), 0);

          if (unitId) {
            const unitContracts = contracts.filter(c => c.unit_id === unitId);
            const unitTenantIds = unitContracts.map(c => c.tenant_id);
            const unitTenants = tenants.filter(t => unitTenantIds.includes(t.id));
            unitPersons = unitTenants.reduce((sum, t) => sum + Number(t.household_size || 1), 0);
          }
        }
      }

      return {
        data: {
          alloc_unit_area: unitArea || null,
          alloc_total_area: totalArea || null,
          alloc_unit_persons: unitPersons || null,
          alloc_total_persons: totalPersons || null,
          alloc_total_units: totalUnits || null,
          alloc_unit_mea: unitMea || null,
          alloc_total_mea: totalMea || null,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error loading allocation defaults:', error);
      return { data: null, error };
    }
  },

  async saveAllocationParams(
    statementId: string,
    params: AllocationParams
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('operating_cost_statements')
        .update(params)
        .eq('id', statementId);

      return { error };
    } catch (error) {
      console.error('Error saving allocation params:', error);
      return { error };
    }
  },

  async getTemplate(
    userId: string,
    propertyId: string,
    unitId: string | null
  ): Promise<{ data: OperatingCostTemplate | null; error: any }> {
    try {
      let query = supabase
        .from('operating_cost_templates')
        .select('*, operating_cost_template_items(*)')
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (unitId) {
        query = query.eq('unit_id', unitId);
      } else {
        query = query.is('unit_id', null);
      }

      const { data, error } = await query.maybeSingle();
      return { data, error };
    } catch (error) {
      console.error('Error loading template:', error);
      return { data: null, error };
    }
  },

  async saveTemplate(
    userId: string,
    propertyId: string,
    unitId: string | null,
    allocParams: AllocationParams,
    items: TemplateItem[]
  ): Promise<{ error: any }> {
    try {
      let existingQuery = supabase
        .from('operating_cost_templates')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (unitId) {
        existingQuery = existingQuery.eq('unit_id', unitId);
      } else {
        existingQuery = existingQuery.is('unit_id', null);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      let templateId: string;

      if (existing) {
        templateId = (existing as any).id;
        await supabase
          .from('operating_cost_templates')
          .update({
            ...allocParams,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId);
      } else {
        const { data: created, error: createError } = await supabase
          .from('operating_cost_templates')
          .insert({
            user_id: userId,
            property_id: propertyId,
            unit_id: unitId || null,
            name: 'Vorlage',
            ...allocParams,
          })
          .select('id')
          .single();

        if (createError || !created) throw createError || new Error('Failed to create template');
        templateId = created.id;
      }

      await supabase
        .from('operating_cost_template_items')
        .delete()
        .eq('template_id', templateId);

      if (items.length > 0) {
        const rows = items.map(item => ({
          template_id: templateId,
          cost_type: item.cost_type,
          allocation_key: item.allocation_key,
          is_section_35a: item.is_section_35a || false,
          section_35a_category: item.section_35a_category || null,
          group_label: item.group_label || null,
        }));

        const { error: insertError } = await supabase
          .from('operating_cost_template_items')
          .insert(rows);

        if (insertError) throw insertError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error saving template:', error);
      return { error };
    }
  },
};
