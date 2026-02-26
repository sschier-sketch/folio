import { supabase } from './supabase';
import { type AfaSettings, type AfaCalculationResult, calculateAfaForYear } from './afaService';

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
  afa_total: number;
  result_total: number;
  income_breakdown: IncomeBreakdown;
  expense_breakdown: ExpenseBreakdown;
  afa: AfaCalculationResult;
  afa_settings: AfaSettings | null;
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
    let afaSettings: AfaSettings | null = null;
    let propertyIdForAfa = '';

    if (scopeType === 'unit') {
      const { data: unitData } = await supabase
        .from('property_units')
        .select('unit_number, property_id, properties(name, address, afa_settings)')
        .eq('id', scopeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (unitData) {
        const prop = (unitData as any).properties;
        scopeLabel = `${prop?.name || ''} - Einheit ${unitData.unit_number}`;
        scopeAddress = prop?.address || '';
        afaSettings = prop?.afa_settings || null;
        propertyIdForAfa = unitData.property_id;
      }
    } else {
      const { data: propData } = await supabase
        .from('properties')
        .select('name, address, afa_settings')
        .eq('id', scopeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (propData) {
        scopeLabel = propData.name;
        scopeAddress = propData.address || '';
        afaSettings = (propData as any).afa_settings || null;
        propertyIdForAfa = scopeId;
      }
    }

    const incomes = await fetchIncomes(userId, year, scopeType, scopeId, startDate, endDate);
    const expenses = await fetchExpenses(userId, year, scopeType, scopeId, startDate, endDate);

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

    const afaResult = calculateAfaForYear(afaSettings, year);
    const afaTotal = round2(afaResult.afa_amount * shareFactor);

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
        afa_total: afaTotal,
        result_total: round2(incomeTotal - expenseTotal - afaTotal),
        income_breakdown: incomeBreakdown,
        expense_breakdown: expenseBreakdown,
        afa: afaResult,
        afa_settings: afaSettings,
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
  year: number,
  scopeType: 'property' | 'unit',
  scopeId: string,
  startDate: string,
  endDate: string
): Promise<AnlageVIncomeRow[]> {
  const rows: AnlageVIncomeRow[] = [];

  const propertyIds = scopeType === 'property' ? [scopeId] : await getPropertyIdsForUnit(userId, scopeId);

  let rentQuery = supabase
    .from('rent_payments')
    .select(`
      id, due_date, paid_date, paid_amount, amount, payment_status, partial_payments, contract_id,
      property:properties(name),
      tenant:tenants(first_name, last_name),
      rental_contract:rental_contracts(unit_id, cold_rent, additional_costs, total_rent, unit:property_units(unit_number))
    `)
    .eq('user_id', userId)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .in('property_id', propertyIds);

  const { data: rentPayments } = await rentQuery;

  const coveredMonths = new Map<string, Set<string>>();

  for (const rp of rentPayments || []) {
    const contract = rp.rental_contract as any;
    const contractUnitId = contract?.unit_id;

    if (scopeType === 'unit' && contractUnitId !== scopeId) continue;

    const contractId = rp.contract_id as string;
    if (contractId) {
      const dueMonth = (rp.due_date as string).substring(0, 7);
      if (!coveredMonths.has(contractId)) coveredMonths.set(contractId, new Set());
      coveredMonths.get(contractId)!.add(dueMonth);
    }

    const effectiveDate = rp.paid_date || rp.due_date;
    const totalAmount = Number(rp.amount);
    if (totalAmount === 0) continue;

    const coldRent = Number(contract?.cold_rent || 0);
    const nkAdvance = Number(contract?.additional_costs || 0);
    const contractTotal = Number(contract?.total_rent || 0);

    const propName = (rp.property as any)?.name || '';
    const unitNum = contract?.unit?.unit_number || '';
    const tenantName = formatTenantName(rp.tenant);
    const contractInfo = unitNum ? `Einheit ${unitNum}` : '';

    if (coldRent > 0 && nkAdvance > 0 && contractTotal > 0) {
      const coldRentShare = coldRent / contractTotal;
      const nkShare = nkAdvance / contractTotal;
      const rentPortion = round2(totalAmount * coldRentShare);
      const nkPortion = round2(totalAmount * nkShare);

      rows.push({
        id: `${rp.id}_rent`,
        date: effectiveDate,
        amount: rentPortion,
        source_type: 'Miete',
        tenant_name: tenantName,
        contract_info: contractInfo,
        property_name: propName,
        unit_number: unitNum,
      });

      if (nkPortion > 0) {
        rows.push({
          id: `${rp.id}_nk`,
          date: effectiveDate,
          amount: nkPortion,
          source_type: 'Nebenkosten-Vorauszahlung',
          tenant_name: tenantName,
          contract_info: contractInfo,
          property_name: propName,
          unit_number: unitNum,
        });
      }
    } else {
      rows.push({
        id: rp.id,
        date: effectiveDate,
        amount: totalAmount,
        source_type: 'Miete',
        tenant_name: tenantName,
        contract_info: contractInfo,
        property_name: propName,
        unit_number: unitNum,
      });
    }
  }

  await backfillFromContracts(rows, coveredMonths, userId, year, scopeType, scopeId, propertyIds);

  let incomeQuery = supabase
    .from('income_entries')
    .select('id, entry_date, amount, description, recipient, status, property_id, unit_id, properties(name)')
    .eq('user_id', userId)
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
  year: number,
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

  const propertyId = scopeType === 'property'
    ? scopeId
    : (await getPropertyIdsForUnit(userId, scopeId))[0] || null;

  if (propertyId) {
    const { data: loans } = await supabase
      .from('loans')
      .select('id, lender_name, monthly_payment, monthly_principal, interest_rate, loan_status, property_id, properties(name)')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .eq('loan_status', 'active');

    for (const loan of loans || []) {
      const monthlyPayment = Number(loan.monthly_payment || 0);
      const monthlyPrincipal = Number(loan.monthly_principal || 0);
      const monthlyInterest = round2(monthlyPayment - monthlyPrincipal);

      if (monthlyInterest <= 0) continue;

      for (let m = 0; m < 12; m++) {
        const monthDate = `${year}-${String(m + 1).padStart(2, '0')}-01`;
        rows.push({
          id: `loan_${loan.id}_${m + 1}`,
          date: monthDate,
          amount: monthlyInterest,
          category: 'Darlehenszinsen',
          anlage_v_group: 'Schuldzinsen',
          vendor: loan.lender_name || '',
          note: `${Number(loan.interest_rate)}% Zinssatz`,
          property_name: (loan.properties as any)?.name || '',
          unit_number: '',
          document_id: null,
        });
      }
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

async function backfillFromContracts(
  rows: AnlageVIncomeRow[],
  coveredMonths: Map<string, Set<string>>,
  userId: string,
  year: number,
  scopeType: 'property' | 'unit',
  scopeId: string,
  propertyIds: string[]
): Promise<void> {
  const { data: contracts } = await supabase
    .from('rental_contracts')
    .select(`
      id, cold_rent, additional_costs, total_rent, start_date, contract_start, contract_end, end_date, status, unit_id, property_id,
      tenant:tenants(first_name, last_name),
      property:properties(name),
      unit:property_units(unit_number)
    `)
    .eq('user_id', userId)
    .in('property_id', propertyIds)
    .in('status', ['active', 'terminated']);

  if (!contracts || contracts.length === 0) return;

  const rentHistoryMap = new Map<string, { effective_date: string; cold_rent: number; utilities: number }[]>();
  const contractIds = contracts.map(c => c.id);
  const { data: rentHistoryRows } = await supabase
    .from('rent_history')
    .select('contract_id, effective_date, cold_rent, utilities')
    .in('contract_id', contractIds)
    .order('effective_date', { ascending: true });

  for (const rh of rentHistoryRows || []) {
    const key = rh.contract_id;
    if (!rentHistoryMap.has(key)) rentHistoryMap.set(key, []);
    rentHistoryMap.get(key)!.push({
      effective_date: rh.effective_date,
      cold_rent: Number(rh.cold_rent || 0),
      utilities: Number(rh.utilities || 0),
    });
  }

  for (const contract of contracts) {
    const contractStart = new Date(contract.contract_start || contract.start_date);
    const contractEnd = contract.contract_end || contract.end_date
      ? new Date(contract.contract_end || contract.end_date)
      : null;

    if (scopeType === 'unit' && contract.unit_id !== scopeId) continue;

    const covered = coveredMonths.get(contract.id) || new Set<string>();
    const tenantName = formatTenantName(contract.tenant);
    const propName = (contract.property as any)?.name || '';
    const unitNum = (contract.unit as any)?.unit_number || '';
    const contractInfo = unitNum ? `Einheit ${unitNum}` : '';
    const history = rentHistoryMap.get(contract.id) || [];

    for (let m = 0; m < 12; m++) {
      const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
      if (covered.has(monthStr)) continue;

      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 0);

      if (contractStart > monthEnd) continue;
      if (contractEnd && contractEnd < monthStart) continue;

      let coldRent = Number(contract.cold_rent || 0);
      let nkAdvance = Number(contract.additional_costs || 0);

      if (history.length > 0) {
        for (const rh of history) {
          if (rh.effective_date <= `${monthStr}-28`) {
            coldRent = rh.cold_rent;
            nkAdvance = rh.utilities;
          }
        }
      }

      const totalRent = coldRent + nkAdvance;
      if (totalRent <= 0) continue;

      const dateStr = `${monthStr}-01`;

      if (coldRent > 0) {
        rows.push({
          id: `backfill_${contract.id}_${monthStr}_rent`,
          date: dateStr,
          amount: round2(coldRent),
          source_type: 'Miete',
          tenant_name: tenantName,
          contract_info: contractInfo,
          property_name: propName,
          unit_number: unitNum,
        });
      }

      if (nkAdvance > 0) {
        rows.push({
          id: `backfill_${contract.id}_${monthStr}_nk`,
          date: dateStr,
          amount: round2(nkAdvance),
          source_type: 'Nebenkosten-Vorauszahlung',
          tenant_name: tenantName,
          contract_info: contractInfo,
          property_name: propName,
          unit_number: unitNum,
        });
      }
    }
  }
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
