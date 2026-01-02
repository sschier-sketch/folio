import { useState, useEffect } from "react";
import {
  TrendingUp,
  Building,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface RentPayment {
  id: string;
  due_date: string;
  amount: number;
  status: string;
  tenant_id: string;
  tenants?: {
    name: string;
    property_id: string;
  };
}

interface Property {
  id: string;
  name: string;
}

export default function IncomeView() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    property_id: "",
    tenant_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filters]);

  async function loadData() {
    try {
      setLoading(true);

      let query = supabase
        .from("rent_payments")
        .select(`
          *,
          tenants (
            name,
            property_id
          )
        `)
        .order("due_date", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.start_date) {
        query = query.gte("due_date", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("due_date", filters.end_date);
      }

      const { data: paymentsData } = await query;
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      if (paymentsData) {
        let filteredPayments = paymentsData;

        if (filters.property_id) {
          filteredPayments = filteredPayments.filter(
            (p) => p.tenants?.property_id === filters.property_id
          );
        }

        setPayments(filteredPayments);
      }

      if (propertiesData) setProperties(propertiesData);
    } catch (error) {
      console.error("Error loading income data:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidIncome = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingIncome = payments
    .filter((p) => p.status === "outstanding")
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "outstanding":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Bezahlt";
      case "outstanding":
        return "Offen";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "outstanding":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Gesamt-Soll</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {paidIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Bezahlt</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {outstandingIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Offen</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Filter</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objekt
            </label>
            <select
              value={filters.property_id}
              onChange={(e) =>
                setFilters({ ...filters, property_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Objekte</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">Alle Status</option>
              <option value="paid">Bezahlt</option>
              <option value="outstanding">Offen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  property_id: "",
                  tenant_id: "",
                  status: "",
                  start_date: "",
                  end_date: "",
                })
              }
              className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Mieteingänge</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Keine Einnahmen gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Fälligkeitsdatum
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Mieter
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                    Betrag
                  </th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(payment.due_date).toLocaleDateString("de-DE")}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {payment.tenants?.name || "Unbekannt"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-right font-medium text-dark">
                      {payment.amount.toFixed(2)} €
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
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
