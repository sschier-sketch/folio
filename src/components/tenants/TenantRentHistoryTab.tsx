import { useState, useEffect } from "react";
import { TrendingUp, Plus, Lock, Calendar, Edit, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import Badge from "../common/Badge";

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
  rent_increase_type: string;
  graduated_rent_date: string;
  graduated_rent_new_amount: number;
  index_first_increase_date: string;
  auto_create_rent_increase_tickets: boolean;
  is_sublet: boolean;
  vat_applicable: boolean;
  rent_due_day: number;
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
    rent_increase_type: "none",
    graduated_rent_date: "",
    graduated_rent_new_amount: "",
    index_first_increase_date: "",
    auto_create_rent_increase_tickets: false,
    is_sublet: false,
    vat_applicable: false,
    rent_due_day: 1,
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
          rent_increase_type: contractData.rent_increase_type || "none",
          graduated_rent_date: contractData.graduated_rent_date || "",
          graduated_rent_new_amount: contractData.graduated_rent_new_amount?.toString() || "",
          index_first_increase_date: contractData.index_first_increase_date || "",
          auto_create_rent_increase_tickets: contractData.auto_create_rent_increase_tickets || false,
          is_sublet: contractData.is_sublet || false,
          vat_applicable: contractData.vat_applicable || false,
          rent_due_day: contractData.rent_due_day || 1,
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

      const oldMonthlyRent = contract.monthly_rent || 0;
      const oldUtilities = contract.utilities_advance || contract.additional_costs || 0;
      const rentChanged = monthlyRent !== oldMonthlyRent || utilitiesAdvance !== oldUtilities;

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
          rent_increase_type: editData.rent_increase_type,
          graduated_rent_date: editData.rent_increase_type === "graduated" ? editData.graduated_rent_date || null : null,
          graduated_rent_new_amount: editData.rent_increase_type === "graduated" ? parseFloat(editData.graduated_rent_new_amount) || null : null,
          index_first_increase_date: editData.rent_increase_type === "index" ? editData.index_first_increase_date || null : null,
          auto_create_rent_increase_tickets: editData.rent_increase_type !== "none" ? editData.auto_create_rent_increase_tickets : false,
          is_sublet: editData.is_sublet,
          vat_applicable: editData.vat_applicable,
          rent_due_day: editData.rent_due_day,
        })
        .eq("id", contract.id);

      if (error) throw error;

      if (rentChanged) {
        await supabase.from("rent_history").insert([
          {
            contract_id: contract.id,
            user_id: user.id,
            effective_date: new Date().toISOString().split('T')[0],
            cold_rent: monthlyRent,
            utilities: utilitiesAdvance,
            reason: "increase",
            notes: "Manuell angepasst",
          },
        ]);
      }

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
      <div className="bg-white rounded-lg p-12 text-center">
        <p className="text-gray-400">Kein Mietvertrag vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
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
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
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

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Mieterhöhungsart</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mieterhöhung
                </label>
                <select
                  value={editData.rent_increase_type}
                  onChange={(e) =>
                    setEditData({ ...editData, rent_increase_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="none">Keine automatische Erhöhung</option>
                  <option value="index">Indexmiete</option>
                  <option value="graduated">Staffelmiete (vorausgeplant)</option>
                </select>
              </div>

              {editData.rent_increase_type === "index" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum der ersten Indexanpassung
                    </label>
                    <input
                      type="date"
                      value={editData.index_first_increase_date}
                      onChange={(e) =>
                        setEditData({ ...editData, index_first_increase_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Das Datum, ab dem die Miete erstmals indexiert werden kann (normalerweise 12 Monate nach Mietbeginn).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editData.auto_create_rent_increase_tickets}
                      onChange={(e) =>
                        setEditData({ ...editData, auto_create_rent_increase_tickets: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-blue"
                    />
                    <label className="text-sm text-gray-700">
                      Automatisch Erinnerungen für Mieterhöhungen erstellen
                    </label>
                  </div>
                </div>
              )}

              {editData.rent_increase_type === "graduated" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erste Erhöhung am
                    </label>
                    <input
                      type="date"
                      value={editData.graduated_rent_date}
                      onChange={(e) =>
                        setEditData({ ...editData, graduated_rent_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Das Datum der ersten Mieterhöhung (normalerweise 12 Monate nach Mietbeginn).
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Neue Kaltmiete ab diesem Zeitpunkt
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={editData.graduated_rent_new_amount}
                        onChange={(e) =>
                          setEditData({ ...editData, graduated_rent_new_amount: e.target.value })
                        }
                        className="w-full px-4 py-2 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="z.B. 850.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Die neue Kaltmiete, die ab dem angegebenen Datum gelten soll.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editData.auto_create_rent_increase_tickets}
                      onChange={(e) =>
                        setEditData({ ...editData, auto_create_rent_increase_tickets: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-blue"
                    />
                    <label className="text-sm text-gray-700">
                      Automatisch Erinnerungen für Mieterhöhungen erstellen
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Zusätzliche Informationen</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mietfälligkeit (Tag im Monat)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editData.rent_due_day}
                    onChange={(e) =>
                      setEditData({ ...editData, rent_due_day: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Der Tag im Monat, an dem die Miete fällig wird (z.B. 1 = am 1. des Monats).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.is_sublet}
                    onChange={(e) =>
                      setEditData({ ...editData, is_sublet: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-blue"
                  />
                  <label className="text-sm text-gray-700">
                    Untermietverhältnis
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.vat_applicable}
                    onChange={(e) =>
                      setEditData({ ...editData, vat_applicable: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-blue"
                  />
                  <label className="text-sm text-gray-700">
                    Mehrwertsteuer berechnen
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {contract.rent_type === "flat_rate" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Pauschalmiete (Warmmiete)</div>
                  <div className="text-2xl font-bold text-dark">
                    {contract.flat_rate_amount?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-sm text-gray-600 mt-1">pro Monat</div>
                </div>
              </div>
            ) : contract.rent_type === "cold_rent_advance" ? (
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
                    {contract.total_advance?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-sm text-gray-600 mt-1">pro Monat</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Kaltmiete</div>
                  <div className="text-2xl font-bold text-dark">
                    {contract.monthly_rent?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-sm text-gray-600 mt-1">pro Monat</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Betriebskosten
                  </div>
                  <div className="text-2xl font-bold text-dark">
                    {contract.operating_costs?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-sm text-gray-600 mt-1">pro Monat</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Heizkosten
                  </div>
                  <div className="text-2xl font-bold text-dark">
                    {contract.heating_costs?.toFixed(2) || "0.00"} €
                  </div>
                  <div className="text-sm text-gray-600 mt-1">pro Monat</div>
                </div>
              </div>
            )}

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

{isPremium && (
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-dark">
                    Mietentwicklung
                  </h3>
                  <Badge variant="pro" size="sm">Pro</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Änderungen werden automatisch protokolliert bei Mietanpassungen, Staffelmieten oder Indexmieten
                </p>
              </div>
            </div>
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
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
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
