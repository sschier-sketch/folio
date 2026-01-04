import { useState, useEffect } from "react";
import { TrendingUp, Plus, Lock, Calendar, Edit, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

interface TenantRentHistoryTabProps {
  tenantId: string;
}

interface RentHistory {
  id: string;
  effective_date: string;
  cold_rent: number;
  utilities: number;
  reason: string;
  notes: string;
  created_at: string;
}

interface Contract {
  id: string;
  rent_type: string;
  flat_rate_amount: number;
  cold_rent: number;
  total_advance: number;
  operating_costs: number;
  heating_costs: number;
  monthly_rent: number;
  utilities_advance: number;
  total_rent: number;
}

export default function TenantRentHistoryTab({
  tenantId,
}: TenantRentHistoryTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<RentHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    rent_type: "flat_rate",
    flat_rate_amount: "",
    cold_rent: "",
    total_advance: "",
    operating_costs: "",
    heating_costs: "",
  });

  useEffect(() => {
    if (user && tenantId) {
      loadData();
    }
  }, [user, tenantId]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contractData) {
        setContract(contractData);
        setEditData({
          rent_type: contractData.rent_type || "flat_rate",
          flat_rate_amount: contractData.flat_rate_amount?.toString() || "0",
          cold_rent: contractData.cold_rent?.toString() || "0",
          total_advance: contractData.total_advance?.toString() || "0",
          operating_costs: contractData.operating_costs?.toString() || "0",
          heating_costs: contractData.heating_costs?.toString() || "0",
        });

        const { data: historyData } = await supabase
          .from("rent_history")
          .select("*")
          .eq("contract_id", contractData.id)
          .order("effective_date", { ascending: false });

        if (historyData) setHistory(historyData);
      }
    } catch (error) {
      console.error("Error loading rent history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRent() {
    if (!contract || !user) return;

    try {
      let monthlyRent = 0;
      let utilitiesAdvance = 0;

      if (editData.rent_type === "flat_rate") {
        monthlyRent = parseFloat(editData.flat_rate_amount) || 0;
      } else if (editData.rent_type === "cold_rent_advance") {
        monthlyRent = parseFloat(editData.cold_rent) || 0;
        utilitiesAdvance = parseFloat(editData.total_advance) || 0;
      } else if (editData.rent_type === "cold_rent_utilities_heating") {
        monthlyRent = parseFloat(editData.cold_rent) || 0;
        utilitiesAdvance = (parseFloat(editData.operating_costs) || 0) + (parseFloat(editData.heating_costs) || 0);
      }

      const totalRent = monthlyRent + utilitiesAdvance;

      const { error } = await supabase
        .from("rental_contracts")
        .update({
          rent_type: editData.rent_type,
          flat_rate_amount: editData.rent_type === "flat_rate" ? parseFloat(editData.flat_rate_amount) || 0 : 0,
          cold_rent: editData.rent_type !== "flat_rate" ? parseFloat(editData.cold_rent) || 0 : 0,
          total_advance: editData.rent_type === "cold_rent_advance" ? parseFloat(editData.total_advance) || 0 : 0,
          operating_costs: editData.rent_type === "cold_rent_utilities_heating" ? parseFloat(editData.operating_costs) || 0 : 0,
          heating_costs: editData.rent_type === "cold_rent_utilities_heating" ? parseFloat(editData.heating_costs) || 0 : 0,
          base_rent: monthlyRent,
          monthly_rent: monthlyRent,
          additional_costs: utilitiesAdvance,
          utilities_advance: utilitiesAdvance,
          total_rent: totalRent,
        })
        .eq("id", contract.id);

      if (error) throw error;

      setIsEditing(false);
      await loadData();
      alert("Mietdaten erfolgreich aktualisiert");
    } catch (error) {
      console.error("Error updating rent:", error);
      alert("Fehler beim Aktualisieren der Mietdaten");
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "initial":
        return "Anfangsmiete";
      case "increase":
        return "Mieterhöhung";
      case "index":
        return "Indexmiete";
      case "stepped":
        return "Staffelmiete";
      default:
        return reason;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-400">Kein Mietvertrag vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">
            Aktuelle Miete
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadData();
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Abbrechen
              </button>
              <button
                onClick={handleSaveRent}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mietart *
              </label>
              <select
                value={editData.rent_type}
                onChange={(e) =>
                  setEditData({ ...editData, rent_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="flat_rate">Pauschalmiete (Warmmiete)</option>
                <option value="cold_rent_advance">
                  Kaltmiete + Vorauszahlung
                </option>
                <option value="cold_rent_utilities_heating">
                  Kaltmiete + Betriebskosten + Heizkosten
                </option>
              </select>
            </div>

            {editData.rent_type === "flat_rate" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pauschalmiete *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.flat_rate_amount}
                  onChange={(e) =>
                    setEditData({ ...editData, flat_rate_amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0.00"
                />
              </div>
            )}

            {editData.rent_type === "cold_rent_advance" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kaltmiete *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.cold_rent}
                    onChange={(e) =>
                      setEditData({ ...editData, cold_rent: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorauszahlung gesamt *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.total_advance}
                    onChange={(e) =>
                      setEditData({ ...editData, total_advance: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            {editData.rent_type === "cold_rent_utilities_heating" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kaltmiete *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.cold_rent}
                    onChange={(e) =>
                      setEditData({ ...editData, cold_rent: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betriebskosten *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.operating_costs}
                    onChange={(e) =>
                      setEditData({ ...editData, operating_costs: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heizkosten *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.heating_costs}
                    onChange={(e) =>
                      setEditData({ ...editData, heating_costs: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Kaltmiete</div>
                <div className="text-2xl font-bold text-dark">
                  {contract.monthly_rent?.toFixed(2) || "0.00"} €
                </div>
                <div className="text-sm text-gray-600 mt-1">pro Monat</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">
                  Nebenkostenvorauszahlung
                </div>
                <div className="text-2xl font-bold text-dark">
                  {contract.utilities_advance?.toFixed(2) || "0.00"} €
                </div>
                <div className="text-sm text-gray-600 mt-1">pro Monat</div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-400">Letzte Änderung</div>
                <div className="text-sm text-gray-700 mt-1">
                  {new Date(history[0].effective_date).toLocaleDateString("de-DE")}
                  {" - "}
                  {getReasonLabel(history[0].reason)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isPremium ? (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-dark mb-2">
              Premium-Funktion
            </h3>
            <p className="text-gray-600 mb-6">
              Die vollständige Miethistorie mit allen Änderungen ist im
              Pro-Tarif verfügbar. Upgrade jetzt für:
            </p>
            <div className="text-left space-y-2 mb-6">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Komplette Timeline aller Mietänderungen
                </span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Erfassung von Mieterhöhungen
                </span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-primary-blue mt-0.5" />
                <span className="text-sm text-gray-600">
                  Verwaltung von Staffel- und Indexmieten
                </span>
              </div>
            </div>
            <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              Jetzt upgraden
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark">
              Mietentwicklung
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue transition-colors">
              <Plus className="w-4 h-4" />
              Änderung erfassen
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Keine Historie vorhanden</p>
              <p className="text-sm text-gray-400">
                Erfassen Sie Mietänderungen, um eine Historie aufzubauen
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-0"
                  >
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-primary-blue rounded-full"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(item.effective_date).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {getReasonLabel(item.reason)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Kaltmiete: {item.cold_rent.toFixed(2)} €
                          {item.utilities > 0 &&
                            ` | Nebenkosten: ${item.utilities.toFixed(2)} €`}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      {index < history.length - 1 && (
                        <div className="text-sm text-emerald-600 font-medium">
                          +
                          {(
                            item.cold_rent - history[index + 1].cold_rent
                          ).toFixed(2)}{" "}
                          €
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
