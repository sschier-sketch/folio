import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Plus, ChevronDown, ChevronUp, Trash2, RefreshCw, Save, Info, Check } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { operatingCostService, AllocationParams } from "../../lib/operatingCostService";
import { Button } from "../ui/Button";
import CostGroupTable from "./CostGroupTable";

export interface CostItem {
  id?: string;
  cost_type: string;
  allocation_key: "area" | "persons" | "units" | "consumption" | "mea" | "direct" | "consumption_billing";
  amount: number;
  is_section_35a?: boolean;
  section_35a_category?: "haushaltsnahe_dienstleistungen" | "handwerkerleistungen" | null;
  group_label?: string | null;
  custom_unit_mea?: number | null;
}

export const COST_TYPES = [
  "Grundsteuer",
  "Wasserversorgung (kalt)",
  "Entwässerung/Abwasser",
  "Aufzug",
  "Straßenreinigung",
  "Müllbeseitigung",
  "Gebäudereinigung",
  "Ungezieferbekämpfung",
  "Gartenpflege",
  "Beleuchtung (Allgemeinstrom)",
  "Schornsteinreinigung",
  "Gebäudeversicherung",
  "Sach-/Haftpflichtversicherung",
  "Hauswart",
  "Kabelanschluss/Antenne",
  "Waschraum/Gemeinschaftswaschmaschine",
  "Rauchwarnmelderwartung",
  "Wartung Rauchwarnmelder (Wohnungen)",
  "Wartung technische Anlagen",
  "Winterdienst",
  "Sonstige Betriebskosten",
];

export const ALLOCATION_OPTIONS = [
  { value: "area", label: "Wohnfläche (m²)" },
  { value: "persons", label: "Personenzahl" },
  { value: "units", label: "Wohneinheiten" },
  { value: "consumption", label: "Verbrauch (Zähler)" },
  { value: "mea", label: "Miteigentumsanteil (MEA)" },
  { value: "direct", label: "Direktumlage" },
  { value: "consumption_billing", label: "lt. Verbrauchsabrechnung" },
];

interface CostGroup {
  label: string;
  costItems: CostItem[];
  customCostItems: CostItem[];
  collapsed: boolean;
}

function buildDefaultCostItems(groupLabel: string | null): CostItem[] {
  return COST_TYPES.map((costType) => ({
    cost_type: costType,
    allocation_key: "area" as const,
    amount: 0,
    group_label: groupLabel,
  }));
}

export function calcShare(
  allocationKey: string,
  amount: number,
  alloc: AllocationParams,
  customUnitMea?: number | null
): number {
  const amt = Number(amount || 0);
  if (amt === 0) return 0;

  switch (allocationKey) {
    case "area": {
      const unit = Number(alloc.alloc_unit_area || 0);
      const total = Number(alloc.alloc_total_area || 0);
      return total > 0 ? (unit / total) * amt : 0;
    }
    case "persons": {
      const unit = Number(alloc.alloc_unit_persons || 0);
      const total = Number(alloc.alloc_total_persons || 0);
      return total > 0 ? (unit / total) * amt : 0;
    }
    case "units": {
      const total = Number(alloc.alloc_total_units || 0);
      return total > 0 ? amt / total : 0;
    }
    case "mea": {
      const unitMea = customUnitMea != null ? Number(customUnitMea) : Number(alloc.alloc_unit_mea || 0);
      const total = Number(alloc.alloc_total_mea || 0);
      return total > 0 ? (unitMea / total) * amt : 0;
    }
    case "consumption": {
      const total = Number(alloc.alloc_total_units || 0);
      return total > 0 ? amt / total : 0;
    }
    case "direct":
    case "consumption_billing":
      return amt;
    default:
      return 0;
  }
}

const DEFAULT_ALLOC: AllocationParams = {
  alloc_unit_area: null,
  alloc_total_area: null,
  alloc_unit_persons: null,
  alloc_total_persons: null,
  alloc_total_units: null,
  alloc_unit_mea: null,
  alloc_total_mea: null,
};

export default function OperatingCostWizardStep2() {
  const { id: statementId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [statement, setStatement] = useState<any>(null);
  const [groups, setGroups] = useState<CostGroup[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [allocParams, setAllocParams] = useState<AllocationParams>(DEFAULT_ALLOC);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  useEffect(() => {
    if (statementId) {
      loadStatement();
    }
  }, [statementId]);

  async function loadStatement() {
    if (!statementId) return;

    setLoading(true);
    const { statement: stmt, lineItems, error } =
      await operatingCostService.getStatementDetail(statementId);

    if (error || !stmt) {
      setError("Fehler beim Laden der Abrechnung");
      setLoading(false);
      return;
    }

    setStatement(stmt);

    const hasStoredAlloc = stmt.alloc_total_area != null || stmt.alloc_total_units != null;

    if (hasStoredAlloc) {
      setAllocParams({
        alloc_unit_area: stmt.alloc_unit_area ?? null,
        alloc_total_area: stmt.alloc_total_area ?? null,
        alloc_unit_persons: stmt.alloc_unit_persons ?? null,
        alloc_total_persons: stmt.alloc_total_persons ?? null,
        alloc_total_units: stmt.alloc_total_units ?? null,
        alloc_unit_mea: stmt.alloc_unit_mea ?? null,
        alloc_total_mea: stmt.alloc_total_mea ?? null,
      });
    } else {
      await loadDefaultsFromDb(stmt.property_id, stmt.unit_id || null, stmt.year);
    }

    const groupMap = new Map<string, { standard: CostItem[]; custom: CostItem[] }>();
    groupMap.set("", { standard: [], custom: [] });

    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        const key = item.group_label || "";
        if (!groupMap.has(key)) {
          groupMap.set(key, { standard: [], custom: [] });
        }
        const group = groupMap.get(key)!;
        if (COST_TYPES.includes(item.cost_type)) {
          group.standard.push(item);
        } else {
          group.custom.push(item);
        }
      }
    }

    const loadedGroups: CostGroup[] = [];
    for (const [key, items] of groupMap.entries()) {
      const groupLabel = key || null;
      const costItems = COST_TYPES.map((costType) => {
        const existing = items.standard.find((i) => i.cost_type === costType);
        return existing || {
          cost_type: costType,
          allocation_key: "area" as const,
          amount: 0,
          group_label: groupLabel,
        };
      });
      loadedGroups.push({
        label: key || "Hauptabrechnung",
        costItems,
        customCostItems: items.custom,
        collapsed: false,
      });
    }

    setGroups(loadedGroups);
    setLoading(false);
  }

  async function loadDefaultsFromDb(propertyId: string, unitId: string | null, year: number) {
    setLoadingDefaults(true);
    const { data } = await operatingCostService.loadAllocationDefaults(propertyId, unitId, year);
    if (data) {
      setAllocParams(data);
    }
    setLoadingDefaults(false);
  }

  function updateAllocParam(key: keyof AllocationParams, value: number | null) {
    setAllocParams((prev) => ({ ...prev, [key]: value }));
  }

  function updateGroup(groupIndex: number, updated: CostGroup) {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? updated : g)));
  }

  function removeGroup(groupIndex: number) {
    if (groupIndex === 0) return;
    setGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  }

  function toggleGroupCollapsed(groupIndex: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, collapsed: !g.collapsed } : g
      )
    );
  }

  function addGroup() {
    const label = newGroupLabel.trim();
    if (!label) return;

    const existingLabels = groups.map((g) => g.label.toLowerCase());
    if (existingLabels.includes(label.toLowerCase())) {
      setError("Eine Abrechnung mit diesem Namen existiert bereits.");
      return;
    }

    setGroups((prev) => [
      ...prev,
      {
        label,
        costItems: buildDefaultCostItems(label),
        customCostItems: [],
        collapsed: false,
      },
    ]);
    setNewGroupLabel("");
    setShowAddGroup(false);
    setError(null);
  }

  const allItemsFlat = groups.flatMap((g) => {
    const groupLabel = g.label === "Hauptabrechnung" ? null : g.label;
    return [...g.costItems, ...g.customCostItems].map((item) => ({
      ...item,
      group_label: groupLabel,
    }));
  });

  const totalCosts = allItemsFlat.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalShare = allItemsFlat.reduce(
    (sum, item) => sum + calcShare(item.allocation_key, item.amount, allocParams, item.custom_unit_mea),
    0
  );

  async function handleSave() {
    if (!statementId) return;

    setSaving(true);
    setError(null);

    try {
      const itemsToSave = allItemsFlat
        .filter((item) => Number(item.amount) !== 0)
        .map((item) => ({
          ...item,
          custom_unit_mea: item.allocation_key === "mea" ? (item.custom_unit_mea ?? null) : null,
        }));

      const [lineResult, allocResult] = await Promise.all([
        operatingCostService.upsertLineItems({
          statement_id: statementId,
          items: itemsToSave,
        }),
        operatingCostService.saveAllocationParams(statementId, allocParams),
      ]);

      if (lineResult.error) throw lineResult.error;
      if (allocResult.error) throw allocResult.error;

      const { error: statusError } = await operatingCostService.updateStatementStatus(
        statementId,
        'draft'
      );
      if (statusError) throw statusError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error("Error saving line items:", err);
      setError(
        err.message || "Fehler beim Speichern. Bitte versuchen Sie es erneut."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!statementId) return;
    await handleSave();
    if (!error) {
      navigate(`/abrechnungen/betriebskosten/${statementId}/versand`);
    }
  }

  async function handleSaveTemplate() {
    if (!user || !statement) return;

    setSavingTemplate(true);
    setTemplateSaved(false);

    const usedItems = allItemsFlat
      .filter((item) => Number(item.amount) !== 0 || item.is_section_35a || item.allocation_key !== "area")
      .map((item) => ({
        cost_type: item.cost_type,
        allocation_key: item.allocation_key,
        is_section_35a: item.is_section_35a,
        section_35a_category: item.section_35a_category || null,
        group_label: item.group_label || null,
      }));

    const { error: tplError } = await operatingCostService.saveTemplate(
      user.id,
      statement.property_id,
      statement.unit_id || null,
      allocParams,
      usedItems
    );

    if (tplError) {
      console.error("Error saving template:", tplError);
      setError("Fehler beim Speichern der Vorlage.");
    } else {
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
    }

    setSavingTemplate(false);
  }

  function handleBack() {
    navigate("/dashboard?view=billing&tab=operating-costs");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary-blue rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Lade Abrechnung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">
            Betriebskostenabrechnung {statement?.year}
          </h1>
          <p className="text-gray-400">
            Erfassen Sie die Betriebskosten für das Abrechnungsjahr
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold mb-2">
                ✓
              </div>
              <span className="text-sm font-medium text-green-500">
                Objekt & Jahr
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-primary-blue -mt-6" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold mb-2">
                2
              </div>
              <span className="text-sm font-medium text-primary-blue">
                Kosten erfassen
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 -mt-6" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-semibold mb-2">
                3
              </div>
              <span className="text-sm text-gray-400">Probeabrechnung & Versand</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark">
            Schritt 2: Betriebskosten erfassen
          </h2>
          <div className="flex items-center gap-3">
            <div className="group relative">
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  templateSaved
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-primary-blue hover:text-primary-blue"
                }`}
              >
                {templateSaved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingTemplate ? "Speichert..." : templateSaved ? "Vorlage gespeichert" : "Als Vorlage speichern"}
              </button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 right-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Hierdurch werden die vorgenommenen Einstellungen als Voreinstellung für diese Immobilie oder Einheit gespeichert und bei der Erstellung der nächsten Abrechnung auf Wunsch automatisch angewendet.</span>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} variant="secondary">
              {saving ? 'Speichert...' : saveSuccess ? 'Gespeichert' : 'Speichern'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Fehler</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark">
              Verteilungsgrundlagen
            </h3>
            {statement && (
              <button
                onClick={() => loadDefaultsFromDb(statement.property_id, statement.unit_id || null, statement.year)}
                disabled={loadingDefaults}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-blue transition-colors"
                title="Werte aus den Stammdaten neu laden"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDefaults ? 'animate-spin' : ''}`} />
                Aus Stammdaten laden
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Diese Werte bestimmen, wie die Kosten auf den Mieter umgelegt werden. Sie wurden aus Ihren Stammdaten vorausgefüllt und können angepasst werden.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Wohnfläche (m²)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Einheit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={allocParams.alloc_unit_area ?? ""}
                    onChange={(e) => updateAllocParam("alloc_unit_area", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0.00"
                  />
                </div>
                <span className="text-gray-300 mt-5">/</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Gesamt</label>
                  <input
                    type="number"
                    step="0.01"
                    value={allocParams.alloc_total_area ?? ""}
                    onChange={(e) => updateAllocParam("alloc_total_area", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Personenzahl
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Einheit</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={allocParams.alloc_unit_persons ?? ""}
                    onChange={(e) => updateAllocParam("alloc_unit_persons", e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0"
                  />
                </div>
                <span className="text-gray-300 mt-5">/</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Gesamt</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={allocParams.alloc_total_persons ?? ""}
                    onChange={(e) => updateAllocParam("alloc_total_persons", e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Wohneinheiten
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Einheit</label>
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-500">
                    1
                  </div>
                </div>
                <span className="text-gray-300 mt-5">/</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Gesamt</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={allocParams.alloc_total_units ?? ""}
                    onChange={(e) => updateAllocParam("alloc_total_units", e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                MEA (Miteigentumsanteile)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Einheit</label>
                  <input
                    type="number"
                    step="0.001"
                    value={allocParams.alloc_unit_mea ?? ""}
                    onChange={(e) => updateAllocParam("alloc_unit_mea", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0"
                  />
                </div>
                <span className="text-gray-300 mt-5">/</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Gesamt</label>
                  <input
                    type="number"
                    step="0.001"
                    value={allocParams.alloc_total_mea ?? ""}
                    onChange={(e) => updateAllocParam("alloc_total_mea", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleGroupCollapsed(groupIndex)}
            >
              <div className="flex items-center gap-3">
                {group.collapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-dark">
                  {group.label}
                </h3>
                <span className="text-sm text-gray-400">
                  ({group.costItems
                    .concat(group.customCostItems)
                    .filter((i) => Number(i.amount) !== 0).length} Positionen)
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-primary-blue">
                  {group.costItems
                    .concat(group.customCostItems)
                    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                    .toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                  EUR
                </span>
                {groupIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${group.label}" wirklich entfernen?`)) {
                        removeGroup(groupIndex);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Abrechnung entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {!group.collapsed && (
              <CostGroupTable
                group={group}
                groupIndex={groupIndex}
                allocParams={allocParams}
                onUpdateGroup={(updated) => updateGroup(groupIndex, updated)}
              />
            )}
          </div>
        ))}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {!showAddGroup ? (
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-2 text-primary-blue hover:text-blue-700 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Weitere Abrechnung hinzufügen (z.B. Stellplatz, Garage)
            </button>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Fügen Sie eine weitere Abrechnung hinzu, z.B. wenn Sie eine separate Betriebskostenabrechnung für einen Stellplatz oder eine Garage von der Hausverwaltung erhalten.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGroup()}
                  placeholder="z.B. Stellplatz, Garage, Tiefgarage..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  autoFocus
                />
                <Button onClick={addGroup} disabled={!newGroupLabel.trim()} variant="primary">
                  Hinzufügen
                </Button>
                <Button
                  onClick={() => { setShowAddGroup(false); setNewGroupLabel(""); }}
                  variant="secondary"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {groups.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Gesamtkosten aller Abrechnungen
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {groups.length} Abrechnungen werden in Schritt 3 kumuliert dargestellt
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {totalCosts.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}EUR
              </p>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">
                Geschätzter Mieteranteil (gesamt)
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Basierend auf den Verteilungsgrundlagen, ohne zeitanteilige Berechnung
              </p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {totalShare.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}EUR
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-2">Hinweise zur Erfassung:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
            <li>
              Die <strong>Verteilungsgrundlagen</strong> oben bestimmen den Mieteranteil. Passen Sie die Werte an, wenn sie von den Stammdaten abweichen.
            </li>
            <li>
              Der <strong>Umlageschlüssel</strong> bestimmt, wie die Kosten auf die Mieter verteilt werden.
            </li>
            <li>
              Markieren Sie Kosten als <strong>§35a EStG-relevant</strong>, wenn diese steuerlich absetzbar sind.
            </li>
            {groups.length > 1 && (
              <li>
                <strong>Mehrere Abrechnungen:</strong> Alle erfassten Kosten werden in der Gesamtabrechnung für den Mieter kumuliert dargestellt.
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <Button onClick={handleBack} variant="secondary" disabled={saving}>
            Zurück
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving || allItemsFlat.every((item) => Number(item.amount) === 0)}
            variant="primary"
          >
            {saving ? 'Speichert...' : 'Weiter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
