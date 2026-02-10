export interface HausgeldUnit {
  id: string;
  unit_number: string;
  property_id: string;
  housegeld_monthly_cents: number;
}

export function getMonthlyHausgeldEur(
  units: HausgeldUnit[],
  filters?: { propertyId?: string; unitId?: string }
): number {
  return units
    .filter((u) => {
      if (!u.housegeld_monthly_cents || u.housegeld_monthly_cents <= 0) return false;
      if (filters?.propertyId && u.property_id !== filters.propertyId) return false;
      if (filters?.unitId && u.id !== filters.unitId) return false;
      return true;
    })
    .reduce((sum, u) => sum + u.housegeld_monthly_cents / 100, 0);
}

export function getPropertyIdsWithSystemHausgeld(units: HausgeldUnit[]): Set<string> {
  const ids = new Set<string>();
  for (const u of units) {
    if (u.housegeld_monthly_cents && u.housegeld_monthly_cents > 0) {
      ids.add(u.property_id);
    }
  }
  return ids;
}

export function getUnitIdsWithSystemHausgeld(units: HausgeldUnit[]): Set<string> {
  const ids = new Set<string>();
  for (const u of units) {
    if (u.housegeld_monthly_cents && u.housegeld_monthly_cents > 0) {
      ids.add(u.id);
    }
  }
  return ids;
}

const HAUSGELD_PATTERN = /hausgeld/i;

export function isManualHausgeldExpense(expense: {
  description?: string;
  category_name?: string;
}): boolean {
  if (expense.description && HAUSGELD_PATTERN.test(expense.description)) return true;
  if (expense.category_name && HAUSGELD_PATTERN.test(expense.category_name)) return true;
  return false;
}

export function isExpenseSupersededBySystemHausgeld(
  expense: {
    description?: string;
    category_name?: string;
    property_id?: string;
    unit_id?: string | null;
  },
  units: HausgeldUnit[]
): boolean {
  if (!isManualHausgeldExpense(expense)) return false;

  const unitIdsWithHausgeld = getUnitIdsWithSystemHausgeld(units);
  const propertyIdsWithHausgeld = getPropertyIdsWithSystemHausgeld(units);

  if (expense.unit_id && unitIdsWithHausgeld.has(expense.unit_id)) return true;
  if (expense.property_id && propertyIdsWithHausgeld.has(expense.property_id) && !expense.unit_id) return true;

  return false;
}

export interface HausgeldDisplayRow {
  id: string;
  amount: number;
  expense_date: string;
  description: string;
  notes: string;
  status: string;
  category_id: string;
  category_name: string;
  property_id: string;
  unit_id: string;
  document_id: null;
  is_system: true;
  system_unit_number: string;
}

export function generateHausgeldRows(
  units: HausgeldUnit[],
  rangeStart: Date,
  rangeEnd: Date,
  filters?: { propertyId?: string; unitId?: string }
): HausgeldDisplayRow[] {
  const rows: HausgeldDisplayRow[] = [];
  const filtered = units.filter((u) => {
    if (!u.housegeld_monthly_cents || u.housegeld_monthly_cents <= 0) return false;
    if (filters?.propertyId && u.property_id !== filters.propertyId) return false;
    if (filters?.unitId && u.id !== filters.unitId) return false;
    return true;
  });

  if (filtered.length === 0) return rows;

  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

  while (cur <= endMonth) {
    const y = cur.getFullYear();
    const m = cur.getMonth();
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-01`;

    for (const unit of filtered) {
      rows.push({
        id: `hausgeld-${unit.id}-${dateStr}`,
        amount: unit.housegeld_monthly_cents / 100,
        expense_date: dateStr,
        description: `Hausgeld \u2013 Einheit ${unit.unit_number}`,
        notes: "",
        status: "paid",
        category_id: "",
        category_name: "Hausgeld",
        property_id: unit.property_id,
        unit_id: unit.id,
        document_id: null,
        is_system: true,
        system_unit_number: unit.unit_number,
      });
    }

    cur.setMonth(cur.getMonth() + 1);
  }

  return rows;
}

export const HAUSGELD_UNIT_FIELDS = "id, unit_number, property_id, housegeld_monthly_cents";
