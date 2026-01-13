import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  loanPayments: number;
  cashflow: number;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
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

  useEffect(() => {
    if (user) {
      loadProperties();
      loadCashflowData();
    }
  }, [user, timePeriod, selectedProperty, selectedUnit, startDate, endDate]);

  async function loadProperties() {
    try {
      const [propertiesRes, unitsRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", user!.id).order("name"),
        supabase.from("property_units").select("id, unit_number, property_id").eq("user_id", user!.id).order("unit_number"),
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

      const [contractsRes, manualIncomeRes, expensesRes, loansRes] = await Promise.all([
        contractsQuery,
        manualIncomeQuery,
        expensesQuery,
        loansQuery,
      ]);

      const contracts = contractsRes.data || [];
      const manualIncomes = manualIncomeRes.data || [];
      const expenses = expensesRes.data || [];
      const loans = loansRes.data || [];

      const monthNames = [
        "Jan",
        "Feb",
        "Mär",
        "Apr",
        "Mai",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dez",
      ];

      const data: MonthlyData[] = [];

      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);

      const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfPeriod = new Date(end.getFullYear(), end.getMonth(), 1);

      while (currentDate <= endOfPeriod) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const rentIncome = contracts
          .filter((contract) => {
            if (!contract.start_date) return false;
            const contractStart = new Date(contract.start_date);
            const contractEnd = contract.end_date ? new Date(contract.end_date) : new Date(2099, 11, 31);
            const currentMonthDate = new Date(year, month, 1);
            return currentMonthDate >= contractStart && currentMonthDate <= contractEnd;
          })
          .reduce((sum, contract) => {
            return sum + parseFloat(contract.total_rent?.toString() || '0');
          }, 0);

        const manualIncome = manualIncomes
          .filter((i) => {
            const date = new Date(i.entry_date);
            return date.getFullYear() === year && date.getMonth() === month;
          })
          .reduce((sum, i) => sum + parseFloat(i.amount?.toString() || '0'), 0);

        const monthIncome = rentIncome + manualIncome;

        const monthExpenses = expenses
          .filter((e) => {
            const date = new Date(e.expense_date);
            return date.getFullYear() === year && date.getMonth() === month;
          })
          .reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0);

        const monthLoanPayments = loans
          .filter((l) => {
            if (!l.start_date) return false;
            const loanStart = new Date(l.start_date);
            const loanEnd = l.end_date ? new Date(l.end_date) : new Date(2099, 11, 31);
            const currentMonthDate = new Date(year, month, 1);
            return currentMonthDate >= loanStart && currentMonthDate <= loanEnd && l.loan_status === 'active';
          })
          .reduce((sum, l) => sum + parseFloat(l.monthly_payment?.toString() || '0'), 0);

        data.push({
          month: monthNames[month],
          income: monthIncome,
          expenses: monthExpenses,
          loanPayments: monthLoanPayments,
          cashflow: monthIncome - monthExpenses - monthLoanPayments,
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

  const maxValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expenses + m.loanPayments))
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objekt
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSelectedUnit("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Objekte</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Einheit
            </label>
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
                  <option key={unit.id} value={unit.id}>
                    Einheit {unit.unit_number}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zeitraum
            </label>
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value as "current" | "last" | "last3");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="last">Letztes Jahr</option>
              <option value="last3">Letzte 3 Monate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400 mb-2">Einnahmen gesamt</div>
          <div className="text-xs text-gray-400">
            Ø {averageIncome.toFixed(2)} € / Monat
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalExpenses.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400 mb-2">Ausgaben gesamt</div>
          <div className="text-xs text-gray-400">
            Ø {averageExpenses.toFixed(2)} € / Monat
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <ArrowDown className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalLoanPayments.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400 mb-2">Kreditzahlungen gesamt</div>
          <div className="text-xs text-gray-400">
            Ø {averageLoanPayments.toFixed(2)} € / Monat
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              totalCashflow >= 0 ? "bg-blue-100" : "bg-red-100"
            }`}
          >
            <BarChart3
              className={`w-6 h-6 ${
                totalCashflow >= 0 ? "text-primary-blue" : "text-red-600"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold mb-1 ${
              totalCashflow >= 0 ? "text-dark" : "text-red-600"
            }`}
          >
            {totalCashflow >= 0 ? "+" : ""}
            {totalCashflow.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400 mb-2">Cashflow gesamt</div>
          <div className="text-xs text-gray-400">
            Ø {averageCashflow.toFixed(2)} € / Monat
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-6">
          Cashflow-Übersicht {new Date().getFullYear()}
        </h3>

        <div className="space-y-4">
          {monthlyData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {data.month}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-600 font-medium">
                    +{data.income.toFixed(2)} €
                  </span>
                  <span className="text-red-600 font-medium">
                    -{data.expenses.toFixed(2)} €
                  </span>
                  <span className="text-orange-600 font-medium">
                    -{data.loanPayments.toFixed(2)} €
                  </span>
                  <span
                    className={`font-semibold min-w-[100px] text-right ${
                      data.cashflow >= 0 ? "text-primary-blue" : "text-red-600"
                    }`}
                  >
                    {data.cashflow >= 0 ? "+" : ""}
                    {data.cashflow.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-emerald-500 opacity-50"
                  style={{
                    width: `${(data.income / maxValue) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-red-500 opacity-50"
                  style={{
                    width: `${(data.expenses / maxValue) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-orange-500 opacity-50"
                  style={{
                    width: `${((data.expenses + data.loanPayments) / maxValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-primary-blue mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Cashflow-Analyse:</p>
            <p>
              Im ausgewählten Zeitraum haben Sie einen{" "}
              {totalCashflow >= 0 ? "positiven" : "negativen"} Cashflow von{" "}
              <span className="font-semibold">
                {totalCashflow.toFixed(2)} €
              </span>
              . Das entspricht durchschnittlich{" "}
              <span className="font-semibold">
                {averageCashflow.toFixed(2)} €
              </span>{" "}
              pro Monat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
