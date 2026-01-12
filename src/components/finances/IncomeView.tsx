import { useState, useEffect } from "react";
import { TrendingUp, Calendar, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface RentPayment {
  id: string;
  amount: number;
  due_date: string;
  payment_status: string;
  paid_date: string | null;
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

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

interface Contract {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  base_rent: number;
}

export default function IncomeView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [timePeriod, setTimePeriod] = useState<"current" | "last" | "all">("current");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    tenant_id: "",
    contract_id: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    description: "",
    recipient: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadProperties();
      loadRentPayments();
    }
  }, [user, timePeriod, selectedProperty, selectedUnit, startDate, endDate]);

  async function loadProperties() {
    try {
      const [propertiesRes, unitsRes, tenantsRes, contractsRes] = await Promise.all([
        supabase.from("properties").select("id, name").eq("user_id", user!.id).order("name"),
        supabase.from("property_units").select("id, unit_number, property_id").eq("user_id", user!.id).order("unit_number"),
        supabase.from("tenants").select("id, first_name, last_name").eq("user_id", user!.id).eq("is_active", true).order("last_name"),
        supabase.from("rental_contracts").select("id, tenant_id, property_id, unit_id, base_rent").eq("user_id", user!.id),
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (unitsRes.data) setUnits(unitsRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
      if (contractsRes.data) setContracts(contractsRes.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadRentPayments() {
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
        }
      }

      let query = supabase
        .from("rent_payments")
        .select(`
          *,
          rental_contracts!inner(
            user_id,
            property_id,
            unit_id,
            tenants!inner(first_name, last_name),
            properties!inner(name)
          )
        `)
        .eq("rental_contracts.user_id", user.id)
        .eq("payment_status", "paid")
        .order("paid_date", { ascending: false });

      if (selectedProperty) {
        query = query.eq("rental_contracts.property_id", selectedProperty);
      }

      if (selectedUnit) {
        query = query.eq("rental_contracts.unit_id", selectedUnit);
      }

      if (timePeriod !== "all" && filterStartDate && filterEndDate) {
        query = query
          .gte("paid_date", filterStartDate)
          .lte("paid_date", filterEndDate);
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

  async function handleAddIncome() {
    if (!user || !formData.property_id || !formData.amount || !formData.description) return;

    try {
      const insertData: any = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date || formData.paid_date,
        paid_date: formData.paid_date,
        payment_status: "paid",
        payment_method: formData.payment_method,
        notes: formData.notes,
        description: formData.description,
        recipient: formData.recipient,
      };

      if (formData.contract_id) {
        insertData.contract_id = formData.contract_id;
      }

      const { error } = await supabase.from("rent_payments").insert(insertData);

      if (error) throw error;

      alert("Einnahme erfolgreich gespeichert!");
      setShowAddModal(false);
      setFormData({
        property_id: "",
        unit_id: "",
        tenant_id: "",
        contract_id: "",
        amount: "",
        due_date: new Date().toISOString().split("T")[0],
        paid_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        description: "",
        recipient: "",
        notes: "",
      });
      loadRentPayments();
    } catch (error) {
      console.error("Error adding income:", error);
      alert("Fehler beim Speichern der Einnahme: " + (error as Error).message);
    }
  }

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
                setTimePeriod(e.target.value as "current" | "last" | "all");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="last">Letztes Jahr</option>
              <option value="all">Alle</option>
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
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">Mieteingänge</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Einnahme hinzufügen
          </button>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(payment.paid_date || payment.due_date).toLocaleDateString("de-DE", {
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Einnahme hinzufügen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      property_id: e.target.value,
                      unit_id: "",
                      tenant_id: "",
                      contract_id: "",
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Objekt wählen...</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einheit (optional)
                </label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      unit_id: e.target.value,
                      tenant_id: "",
                      contract_id: "",
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  disabled={!formData.property_id}
                >
                  <option value="">Keine Einheit</option>
                  {units
                    .filter((u) => u.property_id === formData.property_id)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Einheit {unit.unit_number}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mieter (optional)
                </label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => {
                    const selectedTenantId = e.target.value;
                    const contract = contracts.find(
                      c => c.tenant_id === selectedTenantId &&
                      c.property_id === formData.property_id &&
                      (!formData.unit_id || c.unit_id === formData.unit_id)
                    );
                    setFormData({
                      ...formData,
                      tenant_id: selectedTenantId,
                      contract_id: contract?.id || "",
                      amount: contract ? contract.base_rent.toString() : formData.amount,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  disabled={!formData.property_id}
                >
                  <option value="">Kein Mieter</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Miete Januar 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahler (optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Name des Zahlers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eingangsdatum *
                </label>
                <input
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) =>
                    setFormData({ ...formData, paid_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fälligkeitsdatum (optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsart
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="bank_transfer">Überweisung</option>
                  <option value="cash">Bar</option>
                  <option value="debit">Lastschrift</option>
                  <option value="credit_card">Kreditkarte</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddIncome}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={!formData.property_id || !formData.amount || !formData.description}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
