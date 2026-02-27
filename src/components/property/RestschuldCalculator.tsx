import { useState, useMemo } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts";
import { Button } from "../ui/Button";

interface Loan {
  id: string;
  lender_name: string;
  loan_amount: number;
  remaining_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  loan_type: string;
  fixed_interest_start_date?: string;
  fixed_interest_end_date?: string;
  fixed_interest_equals_loan_end?: boolean;
  loan_status?: string;
}

interface RestschuldCalculatorProps {
  loans: Loan[];
  onBack: () => void;
}

interface MonthRow {
  month: string;
  monthLabel: string;
  balance: number;
  principal: number;
  interest: number;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);

const formatCompact = (value: number): string =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

function calculateAmortization(loan: Loan): MonthRow[] {
  const rows: MonthRow[] = [];
  let balance = loan.remaining_balance;
  const monthlyRate = loan.interest_rate / 100 / 12;
  const monthlyPayment = loan.monthly_payment;

  const endDate = loan.fixed_interest_end_date || loan.end_date;
  if (!endDate) return rows;

  const end = new Date(endDate);
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let current = new Date(startMonth);

  while (current <= end && balance > 0) {
    const interest = balance * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, balance);

    if (principal <= 0 && monthlyPayment <= interest) {
      balance = Math.max(0, balance - (monthlyPayment - interest));
      rows.push({
        month: current.toISOString().slice(0, 7),
        monthLabel: current.toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
        balance: Math.max(0, balance),
        principal: Math.max(0, monthlyPayment - interest),
        interest,
      });
    } else {
      balance = Math.max(0, balance - principal);
      rows.push({
        month: current.toISOString().slice(0, 7),
        monthLabel: current.toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
        balance,
        principal: Math.max(0, principal),
        interest,
      });
    }

    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return rows;
}

export default function RestschuldCalculator({ loans, onBack }: RestschuldCalculatorProps) {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || "");

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);

  const rows = useMemo(() => {
    if (!selectedLoan) return [];
    return calculateAmortization(selectedLoan);
  }, [selectedLoan]);

  const chartData = useMemo(() => {
    if (rows.length <= 24) return rows;
    const step = Math.max(1, Math.floor(rows.length / 60));
    const sampled = rows.filter((_, i) => i % step === 0 || i === rows.length - 1);
    return sampled;
  }, [rows]);

  const finalBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
  const totalInterest = rows.reduce((sum, r) => sum + r.interest, 0);
  const totalPrincipal = rows.reduce((sum, r) => sum + r.principal, 0);

  const endDateLabel = selectedLoan
    ? new Date(selectedLoan.fixed_interest_end_date || selectedLoan.end_date).toLocaleDateString("de-DE", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-dark">Restschuld berechnen</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Tilgungsplan und Restschuld-Entwicklung bis zum Ende der Zinsbindung
          </p>
        </div>
      </div>

      {loans.length > 1 && (
        <div className="bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kredit auswählen
          </label>
          <div className="relative">
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full md:w-96 appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            >
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.lender_name} — {formatCurrency(loan.remaining_balance)} Restschuld, {loan.interest_rate}%
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!selectedLoan ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-400">Kein Kredit ausgewählt.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-400">
            Für diesen Kredit kann kein Tilgungsplan berechnet werden.
            Bitte prüfen Sie das Enddatum oder die Zinsbindung.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Aktuelle Restschuld
              </div>
              <div className="text-xl font-bold text-dark">
                {formatCurrency(selectedLoan.remaining_balance)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Restschuld am Ende
              </div>
              <div className="text-xl font-bold text-dark">
                {formatCurrency(finalBalance)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{endDateLabel}</div>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Getilgt (gesamt)
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalPrincipal)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Zinsen (gesamt)
              </div>
              <div className="text-xl font-bold text-amber-600">
                {formatCurrency(totalInterest)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-dark mb-1">
              Restschuld & Tilgungsverlauf
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {selectedLoan.lender_name} — {rows.length} Monate bis {endDateLabel}
            </p>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={chartData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  stroke="#999"
                  interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#999"
                  tickFormatter={(v: number) => formatCompact(v)}
                  width={85}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name,
                  ]}
                  labelFormatter={(label: string) => label}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Legend
                  content={() => (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Restschuld
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Tilgung
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Zinsen
                      </span>
                    </div>
                  )}
                />
                <Bar
                  dataKey="balance"
                  name="Restschuld"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="principal"
                  name="Tilgung"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="interest"
                  name="Zinsen"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-dark">
                Tilgungsplan
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Monatliche Aufschlüsselung von Restschuld, Tilgung und Zinsen
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monat
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restschuld
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tilgung
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zinsen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, idx) => (
                    <tr
                      key={row.month}
                      className={`transition-colors hover:bg-gray-50 ${
                        idx === rows.length - 1 ? "bg-blue-50/40 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-6 text-sm text-gray-700">
                        {row.monthLabel}
                      </td>
                      <td className="py-3 px-6 text-sm text-right font-medium text-dark">
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="py-3 px-6 text-sm text-right text-emerald-600">
                        {formatCurrency(row.principal)}
                      </td>
                      <td className="py-3 px-6 text-sm text-right text-amber-600">
                        {formatCurrency(row.interest)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="py-3 px-6 text-sm text-gray-700">Gesamt</td>
                    <td className="py-3 px-6 text-sm text-right text-dark">
                      {formatCurrency(finalBalance)}
                    </td>
                    <td className="py-3 px-6 text-sm text-right text-emerald-600">
                      {formatCurrency(totalPrincipal)}
                    </td>
                    <td className="py-3 px-6 text-sm text-right text-amber-600">
                      {formatCurrency(totalInterest)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
