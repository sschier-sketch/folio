import { useState, useEffect } from "react";
import { TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface RentPayment {
  id: string;
  amount: number;
  due_date: string;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  rental_contracts: {
    tenants: {
      first_name: string;
      last_name: string;
    };
    properties: {
      name: string;
    };
  };
}

export default function IncomeView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "all">("current");

  useEffect(() => {
    if (user) {
      loadRentPayments();
    }
  }, [user, timePeriod]);

  async function loadRentPayments() {
    try {
      setLoading(true);

      let filterStartDate = "";
      let filterEndDate = "";

      const now = new Date();
      const currentYear = now.getFullYear();

      if (timePeriod === "current") {
        filterStartDate = `${currentYear}-01-01`;
        filterEndDate = `${currentYear}-12-31`;
      } else if (timePeriod === "last") {
        filterStartDate = `${currentYear - 1}-01-01`;
        filterEndDate = `${currentYear - 1}-12-31`;
      }

      let query = supabase
        .from("rent_payments")
        .select(`
          *,
          rental_contracts!inner(
            tenants!inner(first_name, last_name),
            properties!inner(name)
          )
        `)
        .eq("payment_status", "paid")
        .order("payment_date", { ascending: false });

      if (timePeriod !== "all") {
        query = query
          .gte("payment_date", filterStartDate)
          .lte("payment_date", filterEndDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRentPayments(data || []);
    } catch (error) {
      console.error("Error loading rent payments:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalIncome = rentPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const averageIncome = rentPayments.length > 0 ? totalIncome / rentPayments.length : 0;

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return "Nicht angegeben";
    const methods: { [key: string]: string } = {
      bank_transfer: "Überweisung",
      cash: "Bar",
      debit: "Lastschrift",
      credit_card: "Kreditkarte",
      other: "Sonstiges"
    };
    return methods[method] || method;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">Einnahmen</h2>
          <p className="text-gray-400 mt-1">
            Übersicht aller Mieteingänge
          </p>
        </div>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as "current" | "last" | "all")}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
        >
          <option value="current">Aktuelles Jahr</option>
          <option value="last">Letztes Jahr</option>
          <option value="all">Alle</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Einnahmen gesamt</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {rentPayments.length}
          </div>
          <div className="text-sm text-gray-400">Zahlungseingänge</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {averageIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Durchschnitt pro Zahlung</div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Mieteingänge</h3>
        </div>

        {rentPayments.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">
              Keine Einnahmen
            </h3>
            <p className="text-gray-400">
              Im ausgewählten Zeitraum wurden keine Mieteingänge erfasst.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mieter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objekt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zahlungsart
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(payment.payment_date || payment.due_date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.rental_contracts.tenants.first_name}{" "}
                      {payment.rental_contracts.tenants.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {payment.rental_contracts.properties.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                      +{parseFloat(payment.amount.toString()).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
