import { supabase } from './supabase';

export interface AnlageVIncomeRow {
  id: string;
  date: string;
  amount: number;
  source_type: string;
  tenant_name: string;
  contract_info: string;
  property_name: string;
  unit_number: string;
}

export interface AnlageVExpenseRow {
  id: string;
  date: string;
  amount: number;
  category: string;
  anlage_v_group: string;
  vendor: string;
  note: string;
  property_name: string;
  unit_number: string;
  document_id: string | null;
}

export interface IncomeBreakdown {
  rent: number;
  nk_prepay: number;
  other: number;
}

export interface ExpenseBreakdown {
  grundsteuer: number;
  versicherungen: number;
  verwaltung: number;
  reparaturen: number;
  zinsen: number;
  betriebskosten: number;
  fahrtkosten: number;
  sonstiges: number;
}

export interface AnlageVSummary {
  year: number;
  scope_type: 'property' | 'unit';
  scope_id: string;
  scope_label: string;
  scope_address: string;
  ownership_share: number;
  income_total: number;
  expense_total: number;
  result_total: number;
  income_breakdown: IncomeBreakdown;
  expense_breakdown: ExpenseBreakdown;
  missing_receipts_count: number;
  total_expenses_count: number;
  incomes: AnlageVIncomeRow[];
  expenses: AnlageVExpenseRow[];
}

const EXPENSE_GROUP_MAP: Record<string, string> = {
  'Grundsteuer': 'Grundsteuer',
  'Versicherungen': 'Versicherungen',
  'Gebäudeversicherung': 'Versicherungen',
  'Wohngebäudeversicherung': 'Versicherungen',
  'Haftpflichtversicherung': 'Versicherungen',
  'Hausratversicherung': 'Versicherungen',
  'Elementarversicherung': 'Versicherungen',
  'Rechtsschutzversicherung': 'Versicherungen',
  'Glasversicherung': 'Versicherungen',
  'Mietausfallversicherung': 'Versicherungen',
  'Zinsen': 'Schuldzinsen',
  'Darlehenszinsen': 'Schuldzinsen',
  'Kreditzinsen': 'Schuldzinsen',
  'Hausverwaltung': 'Verwaltungskosten',
  'Verwaltung': 'Verwaltungskosten',
  'Verwaltungskosten': 'Verwaltungskosten',
  'Steuerberatung': 'Verwaltungskosten',
  'Buchhaltung': 'Verwaltungskosten',
  'Kontoführungsgebühren': 'Verwaltungskosten',
  'Reparaturen': 'Instandhaltung / Reparatur',
  'Wartung': 'Instandhaltung / Reparatur',
  'Instandhaltung': 'Instandhaltung / Reparatur',
  'Sanierung': 'Instandhaltung / Reparatur',
  'Renovierung': 'Instandhaltung / Reparatur',
  'Modernisierung': 'Instandhaltung / Reparatur',
  'Handwerkerkosten': 'Instandhaltung / Reparatur',
  'Fahrtkosten': 'Fahrtkosten',
  'Wasser': 'Betriebskosten',
  'Strom': 'Betriebskosten',
  'Gas': 'Betriebskosten',
  'Heizung': 'Betriebskosten',
  'Müllabfuhr': 'Betriebskosten',
  'Straßenreinigung': 'Betriebskosten',
  'Schornsteinfeger': 'Betriebskosten',
  'Hauswart': 'Betriebskosten',
  'Gartenpflege': 'Betriebskosten',
  'Aufzug': 'Betriebskosten',
  'Gebäudereinigung': 'Betriebskosten',
  'Allgemeinstrom': 'Betriebskosten',
  'Kabelanschluss': 'Betriebskosten',
  'Winterdienst': 'Betriebskosten',
};

function mapToAnlageVGroup(categoryName: string | null): string {
  if (!categoryName) return 'Sonstiges';
  for (const [key, group] of Object.entries(EXPENSE_GROUP_MAP)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) return group;
  }
  return 'Sonstiges';
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export async function getAnlageVSummary(
  userId: string,
  year: number,
  scopeType: 'property' | 'unit',
  scopeId: string,
  ownershipShare: number = 100
): Promise<{ data: AnlageVSummary | null; error: string | null }> {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const shareFactor = ownershipShare / 100;

    let scopeLabel = '';
    let scopeAddress = '';

    if (scopeType === 'unit') {
      const { data: unitData } = await supabase
        .from('property_units')
        .select('unit_number, property_id, properties(name, address)')
        .eq('id', scopeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (unitData) {
        const prop = (unitData as any).properties;
        scopeLabel = `${prop?.name || ''} - Einheit ${unitData.unit_number}`;
        scopeAddress = prop?.address || '';
      }
    } else {
      const { data: propData } = await supabase
        .from('properties')
        .select('name, address')
        .eq('id', scopeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (propData) {
        scopeLabel = propData.name;
        scopeAddress = propData.address || '';
      }
    }

    const incomes = await fetchIncomes(userId, year, scopeType, scopeId, startDate, endDate);
    const expenses = await fetchExpenses(userId, scopeType, scopeId, startDate, endDate);

    const incomeRows: AnlageVIncomeRow[] = incomes.map(row => ({
      ...row,
      amount: round2(row.amount * shareFactor),
    }));

    const expenseRows: AnlageVExpenseRow[] = expenses.map(row => ({
      ...row,
      amount: round2(row.amount * shareFactor),
    }));

    const incomeTotal = round2(incomeRows.reduce((s, r) => s + r.amount, 0));
    const expenseTotal = round2(expenseRows.reduce((s, r) => s + r.amount, 0));

    const incomeBreakdown: IncomeBreakdown = { rent: 0, nk_prepay: 0, other: 0 };
    for (const row of incomeRows) {
      if (row.source_type === 'Miete') {
        incomeBreakdown.rent = round2(incomeBreakdown.rent + row.amount);
      } else if (row.source_type.toLowerCase().includes('nebenkosten') || row.source_type.toLowerCase().includes('vorauszahlung')) {
        incomeBreakdown.nk_prepay = round2(incomeBreakdown.nk_prepay + row.amount);
      } else {
        incomeBreakdown.other = round2(incomeBreakdown.other + row.amount);
      }
    }

    const expenseBreakdown: ExpenseBreakdown = {
      grundsteuer: 0, versicherungen: 0, verwaltung: 0,
      reparaturen: 0, zinsen: 0, betriebskosten: 0,
      fahrtkosten: 0, sonstiges: 0,
    };
    const groupKeyMap: Record<string, keyof ExpenseBreakdown> = {
      'Grundsteuer': 'grundsteuer',
      'Versicherungen': 'versicherungen',
      'Verwaltungskosten': 'verwaltung',
      'Instandhaltung / Reparatur': 'reparaturen',
      'Schuldzinsen': 'zinsen',
      'Betriebskosten': 'betriebskosten',
      'Fahrtkosten': 'fahrtkosten',
      'Sonstiges': 'sonstiges',
    };
    for (const row of expenseRows) {
      const key = groupKeyMap[row.anlage_v_group] || 'sonstiges';
      expenseBreakdown[key] = round2(expenseBreakdown[key] + row.amount);
    }

    const missingReceipts = expenseRows.filter(e => !e.document_id).length;

    return {
      data: {
        year,
        scope_type: scopeType,
        scope_id: scopeId,
        scope_label: scopeLabel,
        scope_address: scopeAddress,
        ownership_share: ownershipShare,
        income_total: incomeTotal,
        expense_total: expenseTotal,
        result_total: round2(incomeTotal - expenseTotal),
        income_breakdown: incomeBreakdown,
        expense_breakdown: expenseBreakdown,
        missing_receipts_count: missingReceipts,
        total_expenses_count: expenseRows.length,
        incomes: incomeRows,
        expenses: expenseRows,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('AnlageV error:', err);
    return { data: null, error: err.message || 'Fehler beim Laden der Daten' };
  }
}

async function fetchIncomes(
  userId: string,
  _year: number,
  scopeType: 'property' | 'unit',
  scopeId: string,
  startDate: string,
  endDate: string
): Promise<AnlageVIncomeRow[]> {
  const rows: AnlageVIncomeRow[] = [];

  let rentQuery = supabase
    .from('rent_payments')
    .select(`
      id, paid_date, paid_amount, amount, payment_status, partial_payments,
      property:properties(name),
      tenant:tenants(first_name, last_name),
      rental_contract:rental_contracts(unit_id, unit:property_units(unit_number))
    `)
    .eq('user_id', userId)
    .gte('paid_date', startDate)
    .lte('paid_date', endDate);

  if (scopeType === 'property') {
    rentQuery = rentQuery.eq('property_id', scopeId);
  } else {
    rentQuery = rentQuery.in('property_id', await getPropertyIdsForUnit(userId, scopeId));
  }

  const { data: rentPayments } = await rentQuery;

  for (const rp of rentPayments || []) {
    if (rp.payment_status === 'unpaid') continue;

    const contract = rp.rental_contract as any;
    const contractUnitId = contract?.unit_id;

    if (scopeType === 'unit' && contractUnitId !== scopeId) continue;

    const paidAmount = rp.payment_status === 'paid'
      ? Number(rp.amount)
      : Number(rp.paid_amount || 0);

    if (paidAmount === 0) continue;

    const partials = (rp.partial_payments as any[]) || [];
    if (partials.length > 0) {
      for (const p of partials) {
        const pDate = p.date as string;
        if (pDate >= startDate && pDate <= endDate) {
          rows.push({
            id: `${rp.id}_partial_${pDate}`,
            date: pDate,
            amount: Number(p.amount),
            source_type: 'Miete',
            tenant_name: formatTenantName(rp.tenant),
            contract_info: contract?.unit?.unit_number ? `Einheit ${contract.unit.unit_number}` : '',
            property_name: (rp.property as any)?.name || '',
            unit_number: contract?.unit?.unit_number || '',
          });
        }
      }
    } else if (rp.payment_status === 'paid' && rp.paid_date) {
      rows.push({
        id: rp.id,
        date: rp.paid_date,
        amount: paidAmount,
        source_type: 'Miete',
        tenant_name: formatTenantName(rp.tenant),
        contract_info: contract?.unit?.unit_number ? `Einheit ${contract.unit.unit_number}` : '',
        property_name: (rp.property as any)?.name || '',
        unit_number: contract?.unit?.unit_number || '',
      });
    }
  }

  let incomeQuery = supabase
    .from('income_entries')
    .select('id, entry_date, amount, description, recipient, status, property_id, unit_id, properties(name)')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);

  if (scopeType === 'property') {
    incomeQuery = incomeQuery.eq('property_id', scopeId);
  } else {
    incomeQuery = incomeQuery.eq('unit_id', scopeId);
  }

  const { data: incomeEntries } = await incomeQuery;

  for (const ie of incomeEntries || []) {
    rows.push({
      id: ie.id,
      date: ie.entry_date,
      amount: Number(ie.amount),
      source_type: ie.description || 'Sonstige Einnahme',
      tenant_name: ie.recipient || '',
      contract_info: '',
      property_name: (ie.properties as any)?.name || '',
      unit_number: '',
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

async function fetchExpenses(
  userId: string,
  scopeType: 'property' | 'unit',
  scopeId: string,
  startDate: string,
  endDate: string
): Promise<AnlageVExpenseRow[]> {
  const rows: AnlageVExpenseRow[] = [];

  let query = supabase
    .from('expenses')
    .select('id, expense_date, amount, description, recipient, notes, status, category_id, property_id, unit_id, document_id, properties(name), expense_categories:category_id(name)')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (scopeType === 'property') {
    query = query.eq('property_id', scopeId);
  } else {
    query = query.or(`unit_id.eq.${scopeId},and(property_id.in.(${(await getPropertyIdsForUnit(userId, scopeId)).join(',')}),unit_id.is.null)`);
  }

  const { data: expenseData } = await query;

  for (const ex of expenseData || []) {
    const catName = (ex.expense_categories as any)?.name || null;

    rows.push({
      id: ex.id,
      date: ex.expense_date,
      amount: Number(ex.amount),
      category: catName || ex.description || 'Sonstiges',
      anlage_v_group: mapToAnlageVGroup(catName),
      vendor: ex.recipient || '',
      note: ex.notes || '',
      property_name: (ex.properties as any)?.name || '',
      unit_number: '',
      document_id: ex.document_id,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

async function getPropertyIdsForUnit(userId: string, unitId: string): Promise<string[]> {
  const { data } = await supabase
    .from('property_units')
    .select('property_id')
    .eq('id', unitId)
    .eq('user_id', userId)
    .maybeSingle();
  return data ? [data.property_id] : [];
}

function formatTenantName(tenant: any): string {
  if (!tenant) return '';
  return [tenant.first_name, tenant.last_name].filter(Boolean).join(' ');
}
