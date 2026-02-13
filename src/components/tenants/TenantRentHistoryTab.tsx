import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Lock, Calendar, Edit, Save, X, Info, Percent, ParkingSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import Badge from "../common/Badge";
import { addMonths, differenceInDays, formatDateDE, parseISODate } from "../../lib/dateUtils";
import { Button } from '../ui/Button';

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-1.5">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg -top-2 left-6">
          <div className="absolute -left-1 top-3 w-2 h-2 bg-gray-900 transform rotate-45" />
          {text}
        </div>
      )}
    </div>
  );
}

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
  index_rent_active: boolean;
  auto_create_rent_increase_tickets: boolean;
  is_sublet: boolean;
  vat_applicable: boolean;
  rent_due_day: number;
  start_date: string;
}

interface ContractUnit {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  rent_included: boolean;
  separate_rent: number;
  separate_additional_costs: number;
  label: string | null;
}

interface EditableContractUnit {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  rent_included: boolean;
  separate_rent: string;
  separate_additional_costs: string;
}

export default function TenantRentHistoryTab({
  tenantId,
}: TenantRentHistoryTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<RentHistory[]>([]);
  const [contractUnits, setContractUnits] = useState<ContractUnit[]>([]);
  const [editableUnits, setEditableUnits] = useState<EditableContractUnit[]>([]);
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

  const section558Info = useMemo(() => {
    if (!contract || !contract.start_date) return null;

    let lastEffectiveDate: Date | null = null;

    if (history.length > 0) {
      const sortedHistory = [...history].sort(
        (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
      );

      for (const event of sortedHistory) {
        const eventDate = parseISODate(event.effective_date);
        if (eventDate <= new Date() && (event.cold_rent > 0 || event.utilities > 0)) {
          lastEffectiveDate = eventDate;
          break;
        }
      }
    }

    if (!lastEffectiveDate && contract.start_date) {
      lastEffectiveDate = parseISODate(contract.start_date);
    }

    if (!lastEffectiveDate) return null;

    const earliest558EffectiveDate = addMonths(lastEffectiveDate, 15);
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const daysRemaining = differenceInDays(earliest558EffectiveDate, today);

    if (daysRemaining > 0) {
      return {
        earliest558EffectiveDate,
        daysRemaining,
        formattedDate: formatDateDE(earliest558EffectiveDate),
      };
    }

    return null;
  }, [contract, history]);

  const rentIncreaseCalcs = useMemo(() => {
    if (!contract) return null;

    if (contract.index_rent_active || contract.rent_increase_type === 'graduated') {
      return null;
    }

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const threeYearsAgo = addMonths(today, -36);

    const currentColdRent = contract.monthly_rent || contract.cold_rent || 0;

    const section558EventsIn36Months = history
      .filter((event) => {
        const eventDate = parseISODate(event.effective_date);
        return eventDate >= threeYearsAgo && eventDate <= today && event.reason === 'increase';
      })
      .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());

    let baseRentForCap = currentColdRent;
    if (section558EventsIn36Months.length > 0) {
      const firstEventInWindow = section558EventsIn36Months[0];
      const prevHistoryIndex = history.findIndex(h => h.id === firstEventInWindow.id);

      if (prevHistoryIndex >= 0 && prevHistoryIndex < history.length - 1) {
        const sortedHistory = [...history].sort(
          (a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
        );
        const indexInSorted = sortedHistory.findIndex(h => h.id === firstEventInWindow.id);

        if (indexInSorted > 0) {
          baseRentForCap = sortedHistory[indexInSorted - 1].cold_rent;
        } else {
          baseRentForCap = firstEventInWindow.cold_rent;
        }
      }
    }

    const capPercent = 20;
    const alreadyIncreasedPercent = baseRentForCap > 0
      ? ((currentColdRent - baseRentForCap) / baseRentForCap) * 100
      : 0;
    const remainingPercent = Math.max(0, capPercent - alreadyIncreasedPercent);

    const maxByCap = baseRentForCap * (1 + capPercent / 100);
    const maxAllowed = maxByCap;
    const delta = Math.max(0, maxAllowed - currentColdRent);

    let section558Status = "possible";
    let section558Date = "";

    if (section558Info) {
      section558Status = "blocked";
      section558Date = section558Info.formattedDate;
    }

    return {
      capPercent,
      alreadyIncreasedPercent: Math.round(alreadyIncreasedPercent * 10) / 10,
      remainingPercent: Math.round(remainingPercent * 10) / 10,
      maxAllowed: Math.round(maxAllowed * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      section558Status,
      section558Date,
      currentColdRent,
    };
  }, [contract, history, section558Info]);

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

        const [historyRes, rcuRes] = await Promise.all([
          supabase
            .from("rent_history")
            .select("*")
            .eq("contract_id", contractData.id)
            .order("effective_date", { ascending: false }),
          supabase
            .from("rental_contract_units")
            .select("id, unit_id, rent_included, separate_rent, separate_additional_costs, label")
            .eq("contract_id", contractData.id),
        ]);

        if (historyRes.data) setHistory(historyRes.data);

        const rcuRows = rcuRes.data || [];
        if (rcuRows.length > 0) {
          const unitIds = rcuRows.map((r: any) => r.unit_id);
          const { data: unitsData } = await supabase
            .from("property_units")
            .select("id, unit_number, unit_type")
            .in("id", unitIds);

          const unitMap = new Map((unitsData || []).map((u: any) => [u.id, u]));
          const merged: ContractUnit[] = rcuRows.map((r: any) => {
            const unit = unitMap.get(r.unit_id);
            return {
              id: r.id,
              unit_id: r.unit_id,
              unit_number: unit?.unit_number || "?",
              unit_type: unit?.unit_type || "apartment",
              rent_included: r.rent_included ?? true,
              separate_rent: r.separate_rent || 0,
              separate_additional_costs: r.separate_additional_costs || 0,
              label: r.label || null,
            };
          });
          setContractUnits(merged);
          setEditableUnits(merged.map((cu) => ({
            id: cu.id,
            unit_id: cu.unit_id,
            unit_number: cu.unit_number,
            unit_type: cu.unit_type,
            rent_included: cu.rent_included,
            separate_rent: cu.separate_rent.toString(),
            separate_additional_costs: cu.separate_additional_costs.toString(),
          })));
        } else {
          setContractUnits([]);
          setEditableUnits([]);
        }
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

      for (const eu of editableUnits) {
        await supabase
          .from("rental_contract_units")
          .update({
            rent_included: eu.rent_included,
            separate_rent: eu.rent_included ? 0 : parseFloat(eu.separate_rent) || 0,
            separate_additional_costs: eu.rent_included ? 0 : parseFloat(eu.separate_additional_costs) || 0,
          })
          .eq("id", eu.id);
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
            <Button onClick={() => setIsEditing(true)} variant="secondary">
              Bearbeiten
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => {
                  setIsEditing(false);
                  loadData();
                }} variant="cancel">
                Abbrechen
              </Button>
              <Button onClick={handleSaveRent} variant="primary">
                Speichern
              </Button>
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

            {editableUnits.length > 1 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Miete pro Einheit</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Legen Sie fest, ob die Miete jeder Einheit in der Hauptmiete enthalten ist oder separat berechnet wird.
                </p>
                <div className="space-y-4">
                  {editableUnits.map((eu, idx) => (
                    <div key={eu.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <ParkingSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold text-dark">{eu.unit_number}</span>
                        <span className="text-xs text-gray-400">
                          ({eu.unit_type === "parking" ? "Stellplatz" : eu.unit_type === "storage" ? "Lager" : "Wohneinheit"})
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mietberechnung
                          </label>
                          <select
                            value={eu.rent_included ? "included" : "separate"}
                            onChange={(e) => {
                              const updated = [...editableUnits];
                              updated[idx] = { ...updated[idx], rent_included: e.target.value === "included" };
                              setEditableUnits(updated);
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          >
                            <option value="included">In Hauptmiete enthalten</option>
                            <option value="separate">Eigene Miete</option>
                          </select>
                        </div>
                        {!eu.rent_included && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Kaltmiete (EUR)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={eu.separate_rent}
                                onChange={(e) => {
                                  const updated = [...editableUnits];
                                  updated[idx] = { ...updated[idx], separate_rent: e.target.value };
                                  setEditableUnits(updated);
                                }}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Nebenkosten (EUR)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={eu.separate_additional_costs}
                                onChange={(e) => {
                                  const updated = [...editableUnits];
                                  updated[idx] = { ...updated[idx], separate_additional_costs: e.target.value };
                                  setEditableUnits(updated);
                                }}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            {contractUnits.length > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-dark mb-4">Zugeordnete Einheiten</h4>
                <div className="space-y-3">
                  {contractUnits.map((cu) => (
                    <div key={cu.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center border border-[#DDE7FF]">
                          <ParkingSquare className="w-4 h-4 text-[#1e1e24]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-dark">{cu.unit_number}</div>
                          <div className="text-xs text-gray-400">
                            {cu.unit_type === "parking" ? "Stellplatz" : cu.unit_type === "storage" ? "Lager" : "Wohneinheit"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {cu.rent_included ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Hauptmiete enthalten
                          </span>
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-dark">
                              {cu.separate_rent.toFixed(2)} EUR
                            </div>
                            {cu.separate_additional_costs > 0 && (
                              <div className="text-xs text-gray-400">
                                + {cu.separate_additional_costs.toFixed(2)} EUR NK
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {rentIncreaseCalcs && (
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark">Mieterhöhungen</h3>
            <Button disabled={rentIncreaseCalcs.section558Status === "blocked"} variant="primary">
              Erhöhung einstellen
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg p-6" style={{ backgroundColor: '#EEF4FF' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Kappungsgrenze (3 Jahre)</span>
                  <InfoTooltip text="Innerhalb von 3 Jahren darf die Miete maximal um 20% erhöht werden (§558 BGB). Zeigt an, wie viel Spielraum für weitere Erhöhungen noch besteht." />
                </div>
                <Percent className="w-5 h-5 text-[#3c8af7]" />
              </div>
              <p className="text-3xl font-bold text-dark">
                {rentIncreaseCalcs.remainingPercent}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {rentIncreaseCalcs.alreadyIncreasedPercent}% von {rentIncreaseCalcs.capPercent}% genutzt
              </p>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: '#EEF4FF' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Maximale neue Miete</span>
                  <InfoTooltip text="Die maximal mögliche Kaltmiete unter Berücksichtigung der 20%-Kappungsgrenze der letzten 3 Jahre." />
                </div>
                <TrendingUp className="w-5 h-5 text-[#3c8af7]" />
              </div>
              <p className="text-3xl font-bold text-dark">
                {rentIncreaseCalcs.maxAllowed.toFixed(2)} €
              </p>
              <p className="text-sm text-gray-500 mt-1">
                +{rentIncreaseCalcs.delta.toFixed(2)} € möglich
              </p>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: '#EEF4FF' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">15-Monats-Frist (§558)</span>
                  <InfoTooltip text="Nach einer Mieterhöhung muss eine Sperrfrist von 15 Monaten eingehalten werden, bevor die nächste Erhöhung möglich ist (§558 Abs. 1 BGB)." />
                </div>
                {rentIncreaseCalcs.section558Status === "possible" ? (
                  <Calendar className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-500" />
                )}
              </div>
              {rentIncreaseCalcs.section558Status === "possible" ? (
                <>
                  <p className="text-3xl font-bold text-emerald-600">
                    Möglich
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Frist abgelaufen
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-600">
                    Gesperrt
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ab {rentIncreaseCalcs.section558Date}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
