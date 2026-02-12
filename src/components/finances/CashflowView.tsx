import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowDown,
  Info,
  ChevronDown,
  ChevronRight,
  Equal,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  getMonthlyHausgeldEur,
  isExpenseSupersededBySystemHausgeld,
  type HausgeldUnit,
  HAUSGELD_UNIT_FIELDS,
} from "../../lib/hausgeldUtils";

interface MonthlyData {
  month: string;
  rentIncome: number;
  manualIncome: number;
  income: number;
  expenses: number;
  loanPayments: number;
  cashflow: number;
  hausgeld: number;
  dbExpenses: number;
}

interface Property {
  id: string;
  name: string;
}

type Unit = HausgeldUnit;

const COLORS = {
  income: { bg: "bg-emerald-500", text: "text-emerald-600", hex: "#10b981", light: "bg-emerald-50", border: "border-emerald-200" },
  expenses: { bg: "bg-red-500", text: "text-red-600", hex: "#ef4444", light: "bg-red-50", border: "border-red-200" },
  loans: { bg: "bg-amber-500", text: "text-amber-600", hex: "#f59e0b", light: "bg-amber-50", border: "border-amber-200" },
  cashflow: { bg: "bg-sky-500", text: "text-sky-600", hex: "#0ea5e9", light: "bg-sky-50", border: "border-sky-200" },
};

function formatEur(value: number) {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="text-gray-300 hover:text-gray-500 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  icon,
  color,
  value,
  label,
  average,
  tooltip,
}: {
  icon: React.ReactNode;
  color: typeof COLORS.income;
  value: number;
  label: string;
  average: number;
  tooltip: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-6 border-l-4 ${color.border}`} style={{ borderLeftColor: color.hex }}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color.light} rounded-full flex items-center justify-center border ${color.border}`}>
          <span className={color.text}>{icon}</span>
        </div>
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`text-2xl font-bold mt-4 mb-1 ${color.text}`}>
        {formatEur(value)}
      </div>
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-xs text-gray-400">
        {"\u00d8"} {formatEur(average)} / Monat
      </div>
    </div>
  );
}

export default function CashflowView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "last3">("current");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      loadProperties();
      loadCashflowData();
    }
  }, [user, timePeriod, selectedProperty, selectedUnit, startDate, endDate]);

  function toggleMonth(index: number) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function loadProperties() {
    try {
      const [propertiesRes, unitsRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", user!.id).order("name"),
        supabase.from("property_units").select(HAUSGELD_UNIT_FIELDS).eq("user_id", user!.id).order("unit_number"),
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (unitsRes.data) setUnits(unitsRes.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadCashflowData() {
    try {
      setLoading(true);

      let filterStartDate = startDate;
      let filterEndDate = endDate;

      if (!startDate || !endDate) {
        const now = new Date();
        const currentYear = now.getFullYear();

        if (timePeriod === "current") {
          filterStartDate = `${currentYear}-01-01`;
          filterEndDate = `${currentYear}-12-31`;
        } else if (timePeriod === "last") {
          filterStartDate = `${currentYear - 1}-01-01`;
          filterEndDate = `${currentYear - 1}-12-31`;
        } else if (timePeriod === "last3") {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          filterStartDate = threeMonthsAgo.toISOString().split("T")[0];
          filterEndDate = now.toISOString().split("T")[0];
        }
      }

      let contractsQuery = supabase
        .from("rental_contracts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active");

      if (selectedProperty) {
        contractsQuery = contractsQuery.eq("property_id", selectedProperty);
      }
      if (selectedUnit) {
        contractsQuery = contractsQuery.eq("unit_id", selectedUnit);
      }

      let manualIncomeQuery = supabase
        .from("income_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_cashflow_relevant", true)
        .gte("entry_date", filterStartDate)
        .lte("entry_date", filterEndDate);

      if (selectedProperty) {
        manualIncomeQuery = manualIncomeQuery.eq("property_id", selectedProperty);
      }
      if (selectedUnit) {
        manualIncomeQuery = manualIncomeQuery.eq("unit_id", selectedUnit);
      }

      let expensesQuery = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_cashflow_relevant", true)
        .gte("expense_date", filterStartDate)
        .lte("expense_date", filterEndDate);

      if (selectedProperty) {
        expensesQuery = expensesQuery.eq("property_id", selectedProperty);
      }
      if (selectedUnit) {
        expensesQuery = expensesQuery.eq("unit_id", selectedUnit);
      }

      let loansQuery = supabase
        .from("loans")
        .select("*")
        .eq("user_id", user!.id);

      if (selectedProperty) {
        loansQuery = loansQuery.eq("property_id", selectedProperty);
      }

      const unitsQuery = supabase
        .from("property_units")
        .select(HAUSGELD_UNIT_FIELDS)
        .eq("user_id", user!.id);

      const [contractsRes, manualIncomeRes, expensesRes, loansRes, unitsRes] = await Promise.all([
        contractsQuery,
        manualIncomeQuery,
        expensesQuery,
        loansQuery,
        unitsQuery,
      ]);

      const contracts = contractsRes.data || [];
      const manualIncomes = manualIncomeRes.data || [];
      const expenses = expensesRes.data || [];
      const loans = loansRes.data || [];
      const freshUnits: Unit[] = unitsRes.data || [];

      const monthNames = [
        "Jan", "Feb", "M\u00e4r", "Apr", "Mai", "Jun",
        "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
      ];

      const data: MonthlyData[] = [];
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfPeriod = new Date(end.getFullYear(), end.getMonth(), 1);

      while (currentDate <= endOfPeriod) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const monthRentIncome = contracts
          .filter((contract) => {
            if (!contract.start_date) return false;
            const contractStart = new Date(contract.start_date);
            const contractEnd = contract.end_date ? new Date(contract.end_date) : new Date(2099, 11, 31);
            return contractStart <= lastDayOfMonth && contractEnd >= firstDayOfMonth;
          })
          .reduce((sum, contract) => sum + parseFloat(contract.total_rent?.toString() || "0"), 0);

        const monthManualIncome = manualIncomes
          .filter((i) => {
            const date = new Date(i.entry_date);
            return date.getFullYear() === year && date.getMonth() === month;
          })
          .reduce((sum, i) => sum + parseFloat(i.amount?.toString() || "0"), 0);

        const monthIncome = monthRentIncome + monthManualIncome;

        const monthDbExpenses = expenses
          .filter((e) => {
            const date = new Date(e.expense_date);
            if (date.getFullYear() !== year || date.getMonth() !== month) return false;
            if (isExpenseSupersededBySystemHausgeld(e, freshUnits)) return false;
            return true;
          })
          .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);

        const monthHausgeld = getMonthlyHausgeldEur(freshUnits, {
          propertyId: selectedProperty || undefined,
          unitId: selectedUnit || undefined,
        });

        const monthExpenses = monthDbExpenses + monthHausgeld;

        const monthLoanPayments = loans
          .filter((l) => {
            if (l.loan_status && l.loan_status !== "active") return false;
            const currentMonthDate = new Date(year, month, 1);
            if (l.start_date) {
              const loanStart = new Date(l.start_date);
              if (currentMonthDate < loanStart) return false;
            }
            if (l.end_date) {
              const loanEnd = new Date(l.end_date);
              if (currentMonthDate > loanEnd) return false;
            }
            return true;
          })
          .reduce((sum, l) => sum + parseFloat(l.monthly_payment?.toString() || "0"), 0);

        data.push({
          month: monthNames[month],
          rentIncome: monthRentIncome,
          manualIncome: monthManualIncome,
          income: monthIncome,
          expenses: monthExpenses,
          loanPayments: monthLoanPayments,
          cashflow: monthIncome - monthExpenses - monthLoanPayments,
          hausgeld: monthHausgeld,
          dbExpenses: monthDbExpenses,
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      setMonthlyData(data);
    } catch (error) {
      console.error("Error loading cashflow data:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const totalLoanPayments = monthlyData.reduce((sum, m) => sum + m.loanPayments, 0);
  const totalCashflow = totalIncome - totalExpenses - totalLoanPayments;

  const monthCount = monthlyData.length || 1;
  const averageIncome = totalIncome / monthCount;
  const averageExpenses = totalExpenses / monthCount;
  const averageLoanPayments = totalLoanPayments / monthCount;
  const averageCashflow = totalCashflow / monthCount;

  const maxBarTotal = Math.max(
    ...monthlyData.map((m) => m.income + m.expenses + m.loanPayments + Math.abs(m.cashflow)),
    1
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{"L\u00e4dt..."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objekt</label>
            <select
              value={selectedProperty}
              onChange={(e) => { setSelectedProperty(e.target.value); setSelectedUnit(""); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Objekte</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Einheit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              disabled={!selectedProperty}
            >
              <option value="">Alle Einheiten</option>
              {units
                .filter((u) => !selectedProperty || u.property_id === selectedProperty)
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>{"Einheit "}{unit.unit_number}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <select
              value={timePeriod}
              onChange={(e) => { setTimePeriod(e.target.value as "current" | "last" | "last3"); setStartDate(""); setEndDate(""); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="last">Letztes Jahr</option>
              <option value="last3">Letzte 3 Monate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Von</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); if (e.target.value) setTimePeriod("current"); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bis</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); if (e.target.value) setTimePeriod("current"); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryTile
          icon={<TrendingUp className="w-6 h-6" />}
          color={COLORS.income}
          value={totalIncome}
          label="Einnahmen gesamt"
          average={averageIncome}
          tooltip={"Mieteinnahmen + sonstige Einnahmen (z.B. Nebenkosten-Nachzahlungen, Stellplatzmieten)"}
        />
        <SummaryTile
          icon={<TrendingDown className="w-6 h-6" />}
          color={COLORS.expenses}
          value={totalExpenses}
          label="Ausgaben gesamt"
          average={averageExpenses}
          tooltip={"Alle Hausgelder + sonstige Ausgaben (z.B. Reparaturen, Versicherungen, Verwaltungskosten)"}
        />
        <SummaryTile
          icon={<ArrowDown className="w-6 h-6" />}
          color={COLORS.loans}
          value={totalLoanPayments}
          label="Kreditzahlungen gesamt"
          average={averageLoanPayments}
          tooltip={"Monatliche Raten aller aktiven Darlehen (Zins + Tilgung)"}
        />
        <div className={`bg-white rounded-lg p-6 border-l-4 ${totalCashflow >= 0 ? "border-l-sky-500" : "border-l-red-500"}`}>
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 ${COLORS.cashflow.light} rounded-full flex items-center justify-center border ${COLORS.cashflow.border}`}>
              <BarChart3 className={`w-6 h-6 ${COLORS.cashflow.text}`} />
            </div>
            <InfoTooltip text={"Einnahmen \u2212 Ausgaben \u2212 Kreditzahlungen = Netto-Cashflow"} />
          </div>
          <div className={`text-2xl font-bold mt-4 mb-1 ${totalCashflow >= 0 ? "text-sky-600" : "text-red-600"}`}>
            {totalCashflow >= 0 ? "+" : ""}{formatEur(totalCashflow)}
          </div>
          <div className="text-sm text-gray-400 mb-2">Cashflow gesamt</div>
          <div className="text-xs text-gray-400">
            {"\u00d8"} {formatEur(averageCashflow)} / Monat
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg px-6 py-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-sm text-gray-600">Einnahmen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-sm text-gray-600">Ausgaben</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-sm text-gray-600">Kreditzahlungen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-sky-500" />
            <span className="text-sm text-gray-600">Cashflow</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-6">
          {"Cashflow-\u00dcbersicht"}
        </h3>

        <div className="space-y-1">
          {monthlyData.map((data, index) => {
            const isExpanded = expandedMonths.has(index);
            const incomeWidth = maxBarTotal > 0 ? (data.income / maxBarTotal) * 100 : 0;
            const expenseWidth = maxBarTotal > 0 ? (data.expenses / maxBarTotal) * 100 : 0;
            const loanWidth = maxBarTotal > 0 ? (data.loanPayments / maxBarTotal) * 100 : 0;
            const cashflowWidth = maxBarTotal > 0 ? (Math.abs(data.cashflow) / maxBarTotal) * 100 : 0;

            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => toggleMonth(index)}
                  className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 shrink-0 w-20">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap flex-1">
                      <span className={`${COLORS.income.text} font-medium`}>
                        +{formatEur(data.income)}
                      </span>
                      <span className={`${COLORS.expenses.text} font-medium`}>
                        -{formatEur(data.expenses)}
                      </span>
                      <span className={`${COLORS.loans.text} font-medium`}>
                        -{formatEur(data.loanPayments)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold shrink-0 ${data.cashflow >= 0 ? COLORS.cashflow.text : "text-red-600"}`}>
                      <Equal className="w-3.5 h-3.5" />
                      {data.cashflow >= 0 ? "+" : ""}{formatEur(data.cashflow)}
                    </span>
                  </div>

                  <div className="flex gap-0.5 h-7 ml-6 rounded overflow-hidden bg-gray-100">
                    {data.income > 0 && (
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300 first:rounded-l last:rounded-r"
                        style={{ width: `${incomeWidth}%`, minWidth: 2 }}
                      />
                    )}
                    {data.expenses > 0 && (
                      <div
                        className="bg-red-500 h-full transition-all duration-300 first:rounded-l last:rounded-r"
                        style={{ width: `${expenseWidth}%`, minWidth: 2 }}
                      />
                    )}
                    {data.loanPayments > 0 && (
                      <div
                        className="bg-amber-500 h-full transition-all duration-300 first:rounded-l last:rounded-r"
                        style={{ width: `${loanWidth}%`, minWidth: 2 }}
                      />
                    )}
                    {data.cashflow !== 0 && (
                      <div
                        className={`h-full transition-all duration-300 first:rounded-l last:rounded-r ${data.cashflow >= 0 ? "bg-sky-500" : "bg-sky-300"}`}
                        style={{ width: `${cashflowWidth}%`, minWidth: 2 }}
                      />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-12 mr-3 mb-3 border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="bg-emerald-50/50">
                          <td className="px-4 py-2.5 font-medium text-emerald-700" colSpan={2}>Einnahmen</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2 pl-8 text-gray-600">Mieteinnahmen</td>
                          <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatEur(data.rentIncome)}</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2 pl-8 text-gray-600">Sonstige Einnahmen</td>
                          <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatEur(data.manualIncome)}</td>
                        </tr>
                        <tr className="border-t border-gray-100 bg-emerald-50/30">
                          <td className="px-4 py-2 pl-8 font-medium text-emerald-700">Summe Einnahmen</td>
                          <td className="px-4 py-2 text-right font-semibold text-emerald-700">{formatEur(data.income)}</td>
                        </tr>

                        <tr className="bg-red-50/50 border-t-2 border-gray-200">
                          <td className="px-4 py-2.5 font-medium text-red-700" colSpan={2}>Ausgaben</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2 pl-8 text-gray-600">Hausgeld</td>
                          <td className="px-4 py-2 text-right font-medium text-red-600">{formatEur(data.hausgeld)}</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2 pl-8 text-gray-600">Sonstige Ausgaben</td>
                          <td className="px-4 py-2 text-right font-medium text-red-600">{formatEur(data.dbExpenses)}</td>
                        </tr>
                        <tr className="border-t border-gray-100 bg-red-50/30">
                          <td className="px-4 py-2 pl-8 font-medium text-red-700">Summe Ausgaben</td>
                          <td className="px-4 py-2 text-right font-semibold text-red-700">{formatEur(data.expenses)}</td>
                        </tr>

                        <tr className="bg-amber-50/50 border-t-2 border-gray-200">
                          <td className="px-4 py-2.5 font-medium text-amber-700" colSpan={2}>Kreditzahlungen</td>
                        </tr>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-2 pl-8 text-gray-600">Monatliche Kreditraten</td>
                          <td className="px-4 py-2 text-right font-medium text-amber-600">{formatEur(data.loanPayments)}</td>
                        </tr>

                        <tr className="border-t-2 border-gray-200 bg-sky-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-2">
                            <Equal className="w-4 h-4 text-sky-600" />
                            Cashflow
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${data.cashflow >= 0 ? "text-sky-600" : "text-red-600"}`}>
                            {data.cashflow >= 0 ? "+" : ""}{formatEur(data.cashflow)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Cashflow-Analyse:</p>
        <p className="text-sm text-blue-900">
          {"Im ausgew\u00e4hlten Zeitraum haben Sie einen "}
          {totalCashflow >= 0 ? "positiven" : "negativen"}{" Cashflow von "}
          <span className="font-semibold">{formatEur(totalCashflow)}</span>
          {". Das entspricht durchschnittlich "}
          <span className="font-semibold">{formatEur(averageCashflow)}</span>
          {" pro Monat."}
        </p>
      </div>
    </div>
  );
}
