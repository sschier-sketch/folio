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
  allocation_key: 'area' | 'persons' | 'units';
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
    allocation_key: 'area' | 'persons' | 'units';
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
      const itemsToUpsert = params.items.map((item) => ({
        id: item.id,
        statement_id: params.statement_id,
        cost_type: item.cost_type,
        allocation_key: item.allocation_key,
        amount: item.amount,
      }));

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
    console.log('computeResults stub called for statement:', statementId);
    return { data: [], error: null };
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
