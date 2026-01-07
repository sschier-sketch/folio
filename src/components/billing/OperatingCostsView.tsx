import { useState, useEffect } from "react";
import { Plus, Calculator, Trash2, Users, Home } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface BillingPeriod {
  id: string;
  name: string;
  property_id: string;
}

interface CostType {
  id: string;
  name: string;
  default_allocation_key: string;
  is_allocable: boolean;
}

interface OperatingCost {
  id: string;
  cost_type_id: string;
  amount: number;
  allocation_key: string;
  notes: string;
}

export default function OperatingCostsView() {
  const { user } = useAuth();
  const [billingPeriods, setBillingPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [costTypes, setCostTypes] = useState<CostType[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCost[]>([]);
  const [showAddCostModal, setShowAddCostModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);

  const [costFormData, setCosteFormData] = useState({
    cost_type_id: "",
    amount: "",
    allocation_key: "sqm",
    notes: "",
  });

  const [typeFormData, setTypeFormData] = useState({
    name: "",
    description: "",
    is_allocable: true,
    default_allocation_key: "sqm",
  });

  useEffect(() => {
    if (user) {
      loadBillingPeriods();
      loadCostTypes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPeriod) {
      loadOperatingCosts();
    }
  }, [selectedPeriod]);

  async function loadBillingPeriods() {
    const { data } = await supabase
      .from("billing_periods")
      .select("id, name, property_id")
      .order("created_at", { ascending: false });

    if (data) {
      setBillingPeriods(data);
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].id);
      }
    }
  }

  async function loadCostTypes() {
    const { data } = await supabase
      .from("cost_types")
      .select("*")
      .order("name");

    if (data) setCostTypes(data);
  }

  async function loadOperatingCosts() {
    const { data } = await supabase
      .from("operating_costs")
      .select("*")
      .eq("billing_period_id", selectedPeriod);

    if (data) setOperatingCosts(data);
  }

  async function handleAddCost() {
    if (!user || !selectedPeriod || !costFormData.cost_type_id) return;

    try {
      const { error } = await supabase.from("operating_costs").insert({
        billing_period_id: selectedPeriod,
        cost_type_id: costFormData.cost_type_id,
        amount: parseFloat(costFormData.amount) || 0,
        allocation_key: costFormData.allocation_key,
        notes: costFormData.notes,
      });

      if (error) throw error;

      setShowAddCostModal(false);
      setCosteFormData({
        cost_type_id: "",
        amount: "",
        allocation_key: "sqm",
        notes: "",
      });
      loadOperatingCosts();
    } catch (error) {
      console.error("Error adding cost:", error);
    }
  }

  async function handleAddType() {
    if (!user || !typeFormData.name) return;

    try {
      const { error } = await supabase.from("cost_types").insert({
        user_id: user.id,
        name: typeFormData.name,
        description: typeFormData.description,
        is_allocable: typeFormData.is_allocable,
        default_allocation_key: typeFormData.default_allocation_key,
      });

      if (error) throw error;

      setShowAddTypeModal(false);
      setTypeFormData({
        name: "",
        description: "",
        is_allocable: true,
        default_allocation_key: "sqm",
      });
      loadCostTypes();
    } catch (error) {
      console.error("Error adding cost type:", error);
    }
  }

  async function handleDeleteCost(id: string) {
    if (!confirm("Kosten wirklich löschen?")) return;

    const { error } = await supabase
      .from("operating_costs")
      .delete()
      .eq("id", id);

    if (!error) loadOperatingCosts();
  }

  const getAllocationKeyLabel = (key: string) => {
    switch (key) {
      case "sqm":
        return "m²";
      case "persons":
        return "Personen";
      case "consumption":
        return "Verbrauch";
      case "fixed":
        return "Fixbetrag";
      default:
        return key;
    }
  };

  const getCostTypeName = (costTypeId: string) => {
    const type = costTypes.find((t) => t.id === costTypeId);
    return type?.name || "Unbekannt";
  };

  const totalCosts = operatingCosts.reduce(
    (sum, cost) => sum + cost.amount,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abrechnungszeitraum
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              {billingPeriods.length === 0 && (
                <option value="">Keine Abrechnungen vorhanden</option>
              )}
              {billingPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Kostenart verwalten
          </button>
        </div>

        {selectedPeriod && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-primary-blue" />
                  <span className="text-sm font-medium text-gray-700">
                    Gesamtkosten
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {totalCosts.toFixed(2)} €
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Kostenpositionen
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {operatingCosts.length}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Kostenarten
                  </span>
                </div>
                <div className="text-2xl font-bold text-dark">
                  {costTypes.length}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">
                Umlagefähige Kosten
              </h3>
              <button
                onClick={() => setShowAddCostModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
              >
                <Plus className="w-4 h-4" />
                Kosten hinzufügen
              </button>
            </div>

            {operatingCosts.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  Keine Betriebskosten erfasst
                </p>
                <button
                  onClick={() => setShowAddCostModal(true)}
                  className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                >
                  Erste Kosten hinzufügen
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Kostenart
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Betrag
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Umlageschlüssel
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Notizen
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatingCosts.map((cost) => (
                      <tr key={cost.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {getCostTypeName(cost.cost_type_id)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-dark">
                          {cost.amount.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {getAllocationKeyLabel(cost.allocation_key)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {cost.notes || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCost(cost.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td className="py-3 px-4 text-sm font-semibold text-dark">
                        Gesamt
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-dark">
                        {totalCosts.toFixed(2)} €
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showAddCostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Kosten hinzufügen
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kostenart
                </label>
                <select
                  value={costFormData.cost_type_id}
                  onChange={(e) =>
                    setCosteFormData({
                      ...costFormData,
                      cost_type_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Kostenart wählen...</option>
                  {costTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Betrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costFormData.amount}
                  onChange={(e) =>
                    setCosteFormData({
                      ...costFormData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umlageschlüssel
                </label>
                <select
                  value={costFormData.allocation_key}
                  onChange={(e) =>
                    setCosteFormData({
                      ...costFormData,
                      allocation_key: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="sqm">m² (Quadratmeter)</option>
                  <option value="persons">Personen</option>
                  <option value="consumption">Verbrauch</option>
                  <option value="fixed">Fixbetrag</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen (optional)
                </label>
                <textarea
                  value={costFormData.notes}
                  onChange={(e) =>
                    setCosteFormData({
                      ...costFormData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddCostModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddCost}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={
                  !costFormData.cost_type_id || !costFormData.amount
                }
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Neue Kostenart
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bezeichnung
                </label>
                <input
                  type="text"
                  value={typeFormData.name}
                  onChange={(e) =>
                    setTypeFormData({ ...typeFormData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Heizkosten, Wasser, Müllabfuhr"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={typeFormData.description}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={2}
                  placeholder="Weitere Details zur Kostenart..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard-Umlageschlüssel
                </label>
                <select
                  value={typeFormData.default_allocation_key}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      default_allocation_key: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="sqm">m² (Quadratmeter)</option>
                  <option value="persons">Personen</option>
                  <option value="consumption">Verbrauch</option>
                  <option value="fixed">Fixbetrag</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_allocable"
                  checked={typeFormData.is_allocable}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      is_allocable: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
                />
                <label
                  htmlFor="is_allocable"
                  className="text-sm text-gray-700"
                >
                  Umlagefähig
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddType}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                disabled={!typeFormData.name}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
