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
  cashflow: number;
}

export default function CashflowView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "last3">("current");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (user) {
      loadCashflowData();
    }
  }, [user, timePeriod, startDate, endDate]);

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

      const [paymentsRes, expensesRes] = await Promise.all([
        supabase
          .from("rent_payments")
          .select("*")
          .gte("due_date", filterStartDate)
          .lte("due_date", filterEndDate)
          .eq("payment_status", "paid"),
        supabase
          .from("expenses")
          .select("*")
          .gte("expense_date", filterStartDate)
          .lte("expense_date", filterEndDate)
          .eq("is_cashflow_relevant", true)
          .in("status", ["open", "paid"]),
      ]);

      const payments = paymentsRes.data || [];
      const expenses = expensesRes.data || [];

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
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      for (let month = 0; month < 12; month++) {
        const monthIncome = payments
          .filter((p) => {
            const date = new Date(p.due_date);
            return date.getMonth() === month && date >= start && date <= end;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const monthExpenses = expenses
          .filter((e) => {
            const date = new Date(e.expense_date);
            return date.getMonth() === month && date >= start && date <= end;
          })
          .reduce((sum, e) => sum + e.amount, 0);

        data.push({
          month: monthNames[month],
          income: monthIncome,
          expenses: monthExpenses,
          cashflow: monthIncome - monthExpenses,
        });
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
  const totalCashflow = totalIncome - totalExpenses;

  const averageIncome = totalIncome / 12;
  const averageExpenses = totalExpenses / 12;
  const averageCashflow = totalCashflow / 12;

  const maxValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expenses))
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={timePeriod}
            onChange={(e) => {
              setTimePeriod(e.target.value as "current" | "last" | "last3");
              setStartDate("");
              setEndDate("");
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="current">Aktuelles Jahr</option>
            <option value="last">Letztes Jahr</option>
            <option value="last3">Letzte 3 Monate</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Von:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Bis:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setTimePeriod("current");
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span
                    className={`font-semibold ${
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
