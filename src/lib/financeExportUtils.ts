import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import {
  generateHausgeldRows,
  isExpenseSupersededBySystemHausgeld,
  getMonthlyHausgeldEur,
  type HausgeldUnit,
  HAUSGELD_UNIT_FIELDS,
} from './hausgeldUtils';

const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('de-DE');
};

interface IncomeRow {
  entry_date: string;
  description: string;
  property_name: string;
  status: string;
  amount: number;
  recipient: string | null;
  category_name: string | null;
}

interface ExpenseRow {
  expense_date: string;
  description: string;
  category_name: string;
  property_name: string;
  amount: number;
  status: string;
  recipient: string | null;
}

interface CashflowRow {
  month: string;
  income: number;
  rent_income: number;
  manual_income: number;
  expenses: number;
  loan_payments: number;
  cashflow: number;
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Bezahlt',
  open: 'Offen',
  pending: 'Offen',
  overdue: 'Überfällig',
  active: 'Aktiv',
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

async function loadHausgeldUnits(userId: string): Promise<HausgeldUnit[]> {
  const { data } = await supabase
    .from('property_units')
    .select(HAUSGELD_UNIT_FIELDS)
    .eq('user_id', userId);
  return (data || []) as HausgeldUnit[];
}

export async function loadIncomeExportData(userId: string): Promise<IncomeRow[]> {
  const [manualRes, contractsRes, propRes, catRes] = await Promise.all([
    supabase
      .from('income_entries')
      .select('entry_date, description, amount, status, recipient, category_id, properties(name)')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false }),
    supabase
      .from('rental_contracts')
      .select('id, total_rent, base_rent, additional_costs, start_date, contract_start, contract_end, status, property_id')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('properties')
      .select('id, name')
      .eq('user_id', userId),
    supabase
      .from('expense_categories')
      .select('id, name'),
  ]);

  const catMap = new Map((catRes.data || []).map((c: any) => [c.id, c.name]));
  const propMap = new Map((propRes.data || []).map((p: any) => [p.id, p.name]));

  const rows: IncomeRow[] = [];

  for (const row of (manualRes.data || []) as any[]) {
    rows.push({
      entry_date: row.entry_date,
      description: row.description,
      property_name: row.properties?.name || '-',
      status: row.status,
      amount: parseFloat(row.amount?.toString() || '0'),
      recipient: row.recipient,
      category_name: catMap.get(row.category_id) || null,
    });
  }

  const today = new Date();
  for (const c of (contractsRes.data || []) as any[]) {
    const startDate = new Date(c.contract_start || c.start_date);
    const endDate = c.contract_end ? new Date(c.contract_end) : null;
    if (startDate > today) continue;
    if (endDate && endDate < today) continue;

    rows.push({
      entry_date: today.toISOString().split('T')[0],
      description: 'Mieteinnahmen (monatlich)',
      property_name: propMap.get(c.property_id) || '-',
      status: 'active',
      amount: parseFloat(c.base_rent?.toString() || c.total_rent?.toString() || '0'),
      recipient: null,
      category_name: 'Mieteinnahmen',
    });
  }

  return rows;
}

export async function loadExpenseExportData(userId: string): Promise<ExpenseRow[]> {
  const [expenseRes, catRes, propRes, units] = await Promise.all([
    supabase
      .from('expenses')
      .select('expense_date, description, amount, status, recipient, category_id, property_id, unit_id')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false }),
    supabase.from('expense_categories').select('id, name'),
    supabase.from('properties').select('id, name').eq('user_id', userId),
    loadHausgeldUnits(userId),
  ]);

  const catMap = new Map((catRes.data || []).map((c: any) => [c.id, c.name]));
  const propMap = new Map((propRes.data || []).map((p: any) => [p.id, p.name]));

  const rows: ExpenseRow[] = [];

  for (const row of (expenseRes.data || []) as any[]) {
    const catName = catMap.get(row.category_id) || '-';
    const superseded = isExpenseSupersededBySystemHausgeld(
      { description: row.description, category_name: catName, property_id: row.property_id, unit_id: row.unit_id },
      units,
    );
    if (superseded) continue;

    rows.push({
      expense_date: row.expense_date,
      description: row.description,
      category_name: catName,
      property_name: propMap.get(row.property_id) || '-',
      amount: parseFloat(row.amount?.toString() || '0'),
      status: row.status,
      recipient: row.recipient,
    });
  }

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const hausgeldRows = generateHausgeldRows(units, rangeStart, rangeEnd);

  for (const h of hausgeldRows) {
    rows.push({
      expense_date: h.expense_date,
      description: h.description,
      category_name: 'Hausgeld',
      property_name: propMap.get(h.property_id) || '-',
      amount: h.amount,
      status: 'paid',
      recipient: null,
    });
  }

  return rows;
}

export async function loadCashflowExportData(userId: string): Promise<CashflowRow[]> {
  const now = new Date();
  const year = now.getFullYear();
  const filterStart = `${year}-01-01`;
  const filterEnd = `${year}-12-31`;

  const [contractsRes, incomeRes, expensesRes, loansRes, units] = await Promise.all([
    supabase
      .from('rental_contracts')
      .select('total_rent, start_date, end_date, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('income_entries')
      .select('entry_date, amount')
      .eq('user_id', userId)
      .eq('is_cashflow_relevant', true)
      .gte('entry_date', filterStart)
      .lte('entry_date', filterEnd),
    supabase
      .from('expenses')
      .select('expense_date, amount, description, category_id, property_id, unit_id')
      .eq('user_id', userId)
      .eq('is_cashflow_relevant', true)
      .gte('expense_date', filterStart)
      .lte('expense_date', filterEnd),
    supabase
      .from('loans')
      .select('monthly_payment, start_date, end_date, loan_status')
      .eq('user_id', userId),
    loadHausgeldUnits(userId),
  ]);

  const contracts = contractsRes.data || [];
  const incomes = incomeRes.data || [];
  const expenses = (expensesRes.data || []) as any[];
  const loans = loansRes.data || [];

  const { data: categories } = await supabase.from('expense_categories').select('id, name');
  const catMap = new Map((categories || []).map((c: any) => [c.id, c.name]));

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const rows: CashflowRow[] = [];

  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);

    const rentIncome = contracts
      .filter((c: any) => {
        if (!c.start_date) return false;
        const s = new Date(c.start_date);
        const e = c.end_date ? new Date(c.end_date) : new Date(2099, 11, 31);
        return s <= lastDay && e >= firstDay;
      })
      .reduce((sum: number, c: any) => sum + parseFloat(c.total_rent?.toString() || '0'), 0);

    const manualIncome = incomes
      .filter((i: any) => {
        const d = new Date(i.entry_date);
        return d.getFullYear() === year && d.getMonth() === m;
      })
      .reduce((sum: number, i: any) => sum + parseFloat(i.amount?.toString() || '0'), 0);

    const dbExpenses = expenses
      .filter((e: any) => {
        const d = new Date(e.expense_date);
        if (d.getFullYear() !== year || d.getMonth() !== m) return false;
        const catName = catMap.get(e.category_id) || '';
        if (isExpenseSupersededBySystemHausgeld(
          { description: e.description, category_name: catName, property_id: e.property_id, unit_id: e.unit_id },
          units,
        )) return false;
        return true;
      })
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount?.toString() || '0'), 0);

    const monthHausgeld = getMonthlyHausgeldEur(units);
    const monthExpenses = dbExpenses + monthHausgeld;

    const loanPayments = loans
      .filter((l: any) => {
        if (l.loan_status && l.loan_status !== 'active') return false;
        const cur = new Date(year, m, 1);
        if (l.start_date && cur < new Date(l.start_date)) return false;
        if (l.end_date && cur > new Date(l.end_date)) return false;
        return true;
      })
      .reduce((sum: number, l: any) => sum + parseFloat(l.monthly_payment?.toString() || '0'), 0);

    const income = rentIncome + manualIncome;

    rows.push({
      month: `${monthNames[m]} ${year}`,
      income,
      rent_income: rentIncome,
      manual_income: manualIncome,
      expenses: monthExpenses,
      loan_payments: loanPayments,
      cashflow: income - monthExpenses - loanPayments,
    });
  }

  return rows;
}

export function exportIncomeToCSV(data: IncomeRow[]) {
  const header = ['Datum', 'Beschreibung', 'Kategorie', 'Objekt', 'Empfänger', 'Status', 'Betrag (€)'];
  const rows = data.map(r => [
    formatDate(r.entry_date),
    r.description,
    r.category_name || '-',
    r.property_name,
    r.recipient || '-',
    getStatusLabel(r.status),
    r.amount.toFixed(2),
  ]);

  downloadCSV([header, ...rows], 'Rentably_Einnahmen');
}

export function exportIncomeToExcel(data: IncomeRow[]) {
  const header = ['Datum', 'Beschreibung', 'Kategorie', 'Objekt', 'Empfänger', 'Status', 'Betrag (€)'];
  const rows: any[][] = [header, ...data.map(r => [
    formatDate(r.entry_date),
    r.description,
    r.category_name || '-',
    r.property_name,
    r.recipient || '-',
    getStatusLabel(r.status),
    r.amount,
  ])];

  downloadExcel(rows, 'Einnahmen', 'Rentably_Einnahmen');
}

export function exportExpensesToCSV(data: ExpenseRow[]) {
  const header = ['Datum', 'Beschreibung', 'Kategorie', 'Objekt', 'Empfänger', 'Status', 'Betrag (€)'];
  const rows = data.map(r => [
    formatDate(r.expense_date),
    r.description,
    r.category_name,
    r.property_name,
    r.recipient || '-',
    getStatusLabel(r.status),
    r.amount.toFixed(2),
  ]);

  downloadCSV([header, ...rows], 'Rentably_Ausgaben');
}

export function exportExpensesToExcel(data: ExpenseRow[]) {
  const header = ['Datum', 'Beschreibung', 'Kategorie', 'Objekt', 'Empfänger', 'Status', 'Betrag (€)'];
  const rows: any[][] = [header, ...data.map(r => [
    formatDate(r.expense_date),
    r.description,
    r.category_name,
    r.property_name,
    r.recipient || '-',
    getStatusLabel(r.status),
    r.amount,
  ])];

  downloadExcel(rows, 'Ausgaben', 'Rentably_Ausgaben');
}

export function exportCashflowToCSV(data: CashflowRow[]) {
  const header = ['Monat', 'Mieteinnahmen (€)', 'Sonst. Einnahmen (€)', 'Einnahmen gesamt (€)', 'Ausgaben (€)', 'Kreditzahlungen (€)', 'Cashflow (€)'];
  const rows = data.map(r => [
    r.month,
    r.rent_income.toFixed(2),
    r.manual_income.toFixed(2),
    r.income.toFixed(2),
    r.expenses.toFixed(2),
    r.loan_payments.toFixed(2),
    r.cashflow.toFixed(2),
  ]);

  const totalIncome = data.reduce((s, r) => s + r.income, 0);
  const totalExpenses = data.reduce((s, r) => s + r.expenses, 0);
  const totalLoans = data.reduce((s, r) => s + r.loan_payments, 0);
  const totalCashflow = data.reduce((s, r) => s + r.cashflow, 0);
  const totalRent = data.reduce((s, r) => s + r.rent_income, 0);
  const totalManual = data.reduce((s, r) => s + r.manual_income, 0);

  rows.push([
    'Gesamt',
    totalRent.toFixed(2),
    totalManual.toFixed(2),
    totalIncome.toFixed(2),
    totalExpenses.toFixed(2),
    totalLoans.toFixed(2),
    totalCashflow.toFixed(2),
  ]);

  downloadCSV([header, ...rows], 'Rentably_Cashflow');
}

export function exportCashflowToExcel(data: CashflowRow[]) {
  const header = ['Monat', 'Mieteinnahmen (€)', 'Sonst. Einnahmen (€)', 'Einnahmen gesamt (€)', 'Ausgaben (€)', 'Kreditzahlungen (€)', 'Cashflow (€)'];
  const rows: any[][] = [header, ...data.map(r => [
    r.month,
    r.rent_income,
    r.manual_income,
    r.income,
    r.expenses,
    r.loan_payments,
    r.cashflow,
  ])];

  const totalIncome = data.reduce((s, r) => s + r.income, 0);
  const totalExpenses = data.reduce((s, r) => s + r.expenses, 0);
  const totalLoans = data.reduce((s, r) => s + r.loan_payments, 0);
  const totalCashflow = data.reduce((s, r) => s + r.cashflow, 0);
  const totalRent = data.reduce((s, r) => s + r.rent_income, 0);
  const totalManual = data.reduce((s, r) => s + r.manual_income, 0);

  rows.push([
    'Gesamt',
    totalRent,
    totalManual,
    totalIncome,
    totalExpenses,
    totalLoans,
    totalCashflow,
  ]);

  downloadExcel(rows, 'Cashflow', 'Rentably_Cashflow');
}

function downloadCSV(rows: string[][], filePrefix: string) {
  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadExcel(rows: any[][], sheetName: string, filePrefix: string) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
