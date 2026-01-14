import { useState, useEffect } from "react";
import { TrendingUp, Calendar, CheckCircle2, Plus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface ManualIncome {
  id: string;
  property_id: string;
  description: string;
  amount: number;
  entry_date: string;
  properties: {
    name: string;
  };
}

interface RentalContract {
  id: string;
  total_rent: number;
  base_rent: number;
  additional_costs: number;
  start_date: string;
  contract_start: string;
  contract_end: string | null;
  status: string;
  tenants?: {
    first_name: string;
    last_name: string;
  } | null;
  properties?: {
    name: string;
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
  const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>([]);
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
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
  const [editingIncome, setEditingIncome] = useState<ManualIncome | null>(null);
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
      loadData();
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

  async function loadData() {
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

      let manualQuery = supabase
        .from("income_entries")
        .select("id, property_id, description, amount, entry_date, properties(name)")
        .eq("user_id", user!.id)
        .eq("category", "income")
        .order("entry_date", { ascending: false });

      if (selectedProperty) {
        manualQuery = manualQuery.eq("property_id", selectedProperty);
      }

      if (timePeriod !== "all" && filterStartDate && filterEndDate) {
        manualQuery = manualQuery
          .gte("entry_date", filterStartDate)
          .lte("entry_date", filterEndDate);
      }

      let contractsQuery = supabase
        .from("rental_contracts")
        .select(`
          id,
          total_rent,
          base_rent,
          additional_costs,
          start_date,
          contract_start,
          contract_end,
          status,
          tenant_id,
          property_id
        `)
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("start_date", { ascending: false });

      if (selectedProperty) {
        contractsQuery = contractsQuery.eq("property_id", selectedProperty);
      }

      const [manualRes, contractsRes] = await Promise.all([manualQuery, contractsQuery]);

      if (manualRes.error) throw manualRes.error;
      if (contractsRes.error) throw contractsRes.error;

      setManualIncomes(manualRes.data || []);

      const contractsWithRelations = await Promise.all(
        (contractsRes.data || []).map(async (contract: any) => {
          const [tenantRes, propertyRes] = await Promise.all([
            supabase
              .from("tenants")
              .select("first_name, last_name")
              .eq("id", contract.tenant_id)
              .maybeSingle(),
            supabase
              .from("properties")
              .select("name")
              .eq("id", contract.property_id)
              .maybeSingle(),
          ]);

          return {
            ...contract,
            tenants: tenantRes.data,
            properties: propertyRes.data,
          };
        })
      );

      setRentalContracts(contractsWithRelations);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const activeStartedContracts = rentalContracts.filter(c => {
    const startDate = new Date(c.contract_start);
    const endDate = c.contract_end ? new Date(c.contract_end) : null;
    return startDate <= today && (!endDate || endDate >= today);
  });

  const totalManualIncome = manualIncomes.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const totalRentIncome = activeStartedContracts.reduce((sum, contract) => {
    return sum + parseFloat(contract.base_rent.toString());
  }, 0);
  const totalIncome = totalManualIncome + totalRentIncome;
  const totalCount = manualIncomes.length + rentalContracts.length;
  const averageIncome = totalCount > 0 ? totalIncome / totalCount : 0;

  async function handleSaveIncome() {
    if (!user || !formData.property_id || !formData.amount || !formData.description) return;

    try {
      const insertData = {
        user_id: user.id,
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        entry_date: formData.paid_date,
        amount: parseFloat(formData.amount),
        category: "income",
        description: formData.description,
        status: "verbucht",
        notes: formData.notes || null,
      };

      let error;

      if (editingIncome) {
        const res = await supabase
          .from("income_entries")
          .update(insertData)
          .eq("id", editingIncome.id);
        error = res.error;
      } else {
        const res = await supabase.from("income_entries").insert(insertData);
        error = res.error;
      }

      if (error) throw error;

      alert(editingIncome ? "Einnahme aktualisiert!" : "Einnahme gespeichert!");
      setShowAddModal(false);
      setEditingIncome(null);
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
      loadData();
    } catch (error) {
      console.error("Error saving income:", error);
      alert("Fehler beim Speichern: " + (error as Error).message);
    }
  }

  async function handleDeleteIncome(id: string) {
    if (!confirm("Möchten Sie diese Einnahme wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("income_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("Einnahme gelöscht!");
      loadData();
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("Fehler beim Löschen: " + (error as Error).message);
    }
  }

  function handleEditIncome(income: ManualIncome) {
    setEditingIncome(income);
    setFormData({
      property_id: income.property_id,
      unit_id: "",
      tenant_id: "",
      contract_id: "",
      amount: income.amount.toString(),
      due_date: income.entry_date,
      paid_date: income.entry_date,
      payment_method: "bank_transfer",
      description: income.description,
      recipient: "",
      notes: "",
    });
    setShowAddModal(true);
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
            {totalManualIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Sonstige Einnahmen</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-primary-blue" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {rentalContracts.length}
          </div>
          <div className="text-sm text-gray-400">Aktive Mietverträge</div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-dark mb-1">
            {totalRentIncome.toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">Monatliche Mieteinnahmen</div>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark">Sonstige Einnahmen</h3>
          <button
            onClick={() => {
              setEditingIncome(null);
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
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Einnahme hinzufügen
          </button>
        </div>

        {manualIncomes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Keine manuellen Einnahmen erfasst.
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
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objekt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {manualIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(income.entry_date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {income.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {income.properties.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                      +{parseFloat(income.amount.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleEditIncome(income)}
                        className="text-primary-blue hover:text-primary-blue mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIncome(income.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-dark">Aktuelle Mietverträge</h3>
        </div>

        {rentalContracts.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">
              Keine aktiven Mietverträge
            </h3>
            <p className="text-gray-400">
              Es wurden keine aktiven Mietverträge gefunden.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertragsbeginn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mieter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objekt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kaltmiete
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NK
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentalContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(contract.start_date).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {contract.tenants && contract.tenants.first_name && contract.tenants.last_name
                        ? `${contract.tenants.first_name} ${contract.tenants.last_name}`
                        : "-"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {contract.properties?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {parseFloat(contract.base_rent.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {parseFloat(contract.additional_costs.toString()).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 text-right">
                      {parseFloat(contract.total_rent.toString()).toFixed(2)} €
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
              {editingIncome ? "Einnahme bearbeiten" : "Einnahme hinzufügen"}
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
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Keine Einheit</option>
                  {units
                    .filter(u => !formData.property_id || u.property_id === formData.property_id)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Einheit {unit.unit_number}
                      </option>
                    ))}
                </select>
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
                  Datum *
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
                  Beschreibung *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Parkplatzmiete Januar 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsempfänger (optional)
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Name des Zahlungsempfängers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsmethode
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="bank_transfer">Banküberweisung</option>
                  <option value="cash">Bar</option>
                  <option value="direct_debit">Lastschrift</option>
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
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIncome(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveIncome}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={!formData.property_id || !formData.amount || !formData.description}
              >
                {editingIncome ? "Aktualisieren" : "Hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
