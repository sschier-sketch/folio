import { useState } from "react";
import { Plus, X, Info } from "lucide-react";
import { Button } from "../ui/Button";
import { CostItem, COST_TYPES, ALLOCATION_OPTIONS, calcShare } from "./OperatingCostWizardStep2";
import { AllocationParams } from "../../lib/operatingCostService";

interface CostGroup {
  label: string;
  costItems: CostItem[];
  customCostItems: CostItem[];
  collapsed: boolean;
}

interface CostGroupTableProps {
  group: CostGroup;
  groupIndex: number;
  allocParams: AllocationParams;
  onUpdateGroup: (updated: CostGroup) => void;
}

function getAllocHint(key: string, alloc: AllocationParams): string {
  switch (key) {
    case "area": {
      const u = alloc.alloc_unit_area ?? 0;
      const t = alloc.alloc_total_area ?? 0;
      return t > 0 ? `${u} / ${t} m²` : "Wohnfläche fehlt";
    }
    case "persons": {
      const u = alloc.alloc_unit_persons ?? 0;
      const t = alloc.alloc_total_persons ?? 0;
      return t > 0 ? `${u} / ${t} Pers.` : "Personen fehlt";
    }
    case "units": {
      const t = alloc.alloc_total_units ?? 0;
      return t > 0 ? `1 / ${t} Einh.` : "Einheiten fehlt";
    }
    case "mea": {
      const u = alloc.alloc_unit_mea ?? 0;
      const t = alloc.alloc_total_mea ?? 0;
      return t > 0 ? `${u} / ${t} MEA` : "MEA fehlt";
    }
    case "consumption": {
      const t = alloc.alloc_total_units ?? 0;
      return t > 0 ? `1 / ${t} Einh.` : "Einheiten fehlt";
    }
    case "direct":
      return "100 %";
    case "consumption_billing":
      return "100 %";
    default:
      return "";
  }
}

export default function CostGroupTable({
  group,
  groupIndex,
  allocParams,
  onUpdateGroup,
}: CostGroupTableProps) {
  const [newCostType, setNewCostType] = useState("");

  function updateCostItem(
    index: number,
    field: "allocation_key" | "amount" | "is_section_35a" | "section_35a_category",
    value: any
  ) {
    const updated = [...group.costItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "is_section_35a" && value === false) {
      updated[index].section_35a_category = null;
    }
    onUpdateGroup({ ...group, costItems: updated });
  }

  function updateCustomCostItem(
    index: number,
    field: "allocation_key" | "amount" | "is_section_35a" | "section_35a_category",
    value: any
  ) {
    const updated = [...group.customCostItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "is_section_35a" && value === false) {
      updated[index].section_35a_category = null;
    }
    onUpdateGroup({ ...group, customCostItems: updated });
  }

  function addCustomCostType() {
    if (!newCostType.trim()) return;
    const newItem: CostItem = {
      cost_type: newCostType.trim(),
      allocation_key: "area",
      amount: 0,
      group_label: group.label === "Hauptabrechnung" ? null : group.label,
    };
    onUpdateGroup({
      ...group,
      customCostItems: [...group.customCostItems, newItem],
    });
    setNewCostType("");
  }

  function removeCustomCostItem(index: number) {
    onUpdateGroup({
      ...group,
      customCostItems: group.customCostItems.filter((_, i) => i !== index),
    });
  }

  const allItems = [...group.costItems, ...group.customCostItems];
  const groupTotal = allItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const groupShareTotal = allItems.reduce(
    (sum, item) => sum + calcShare(item.allocation_key, item.amount, allocParams),
    0
  );

  function renderRow(item: CostItem, index: number, isCustom: boolean) {
    const share = calcShare(item.allocation_key, item.amount, allocParams);
    const hint = Number(item.amount || 0) > 0 ? getAllocHint(item.allocation_key, allocParams) : "";
    const isUsed = Number(item.amount || 0) > 0;

    return (
      <tr
        key={isCustom ? `custom-${index}` : index}
        className={`border-b border-gray-100 transition-colors ${
          isUsed
            ? "bg-blue-50/60 hover:bg-blue-50"
            : isCustom
              ? "bg-blue-50/30 hover:bg-gray-50"
              : "hover:bg-gray-50"
        }`}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {isUsed && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-blue flex-shrink-0" />
            )}
            <span className={`text-sm ${isUsed ? "text-gray-900 font-medium" : "text-gray-600"}`}>{item.cost_type}</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <select
            value={item.allocation_key}
            onChange={(e) =>
              isCustom
                ? updateCustomCostItem(index, "allocation_key", e.target.value)
                : updateCostItem(index, "allocation_key", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
          >
            {ALLOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hint && (
            <span className="block text-xs text-gray-400 mt-0.5 pl-1">
              {hint}
            </span>
          )}
        </td>
        <td className="py-3 px-4">
          <input
            type="number"
            step="0.01"
            value={item.amount || ""}
            onChange={(e) =>
              isCustom
                ? updateCustomCostItem(index, "amount", parseFloat(e.target.value) || 0)
                : updateCostItem(index, "amount", parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right text-sm"
            placeholder="0,00"
          />
        </td>
        <td className="py-3 px-4 text-right">
          {Number(item.amount || 0) > 0 ? (
            <span className="text-sm font-medium text-green-700">
              {share.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-sm text-gray-300">--</span>
          )}
        </td>
        <td className="py-3 px-4 text-center">
          <input
            type="checkbox"
            checked={item.is_section_35a || false}
            onChange={(e) =>
              isCustom
                ? updateCustomCostItem(index, "is_section_35a", e.target.checked)
                : updateCostItem(index, "is_section_35a", e.target.checked)
            }
            className="w-5 h-5 text-primary-blue focus:ring-2 focus:ring-primary-blue rounded"
          />
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <select
              value={item.section_35a_category || ""}
              onChange={(e) =>
                isCustom
                  ? updateCustomCostItem(index, "section_35a_category", e.target.value || null)
                  : updateCostItem(index, "section_35a_category", e.target.value || null)
              }
              disabled={!item.is_section_35a}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Bitte wählen</option>
              <option value="haushaltsnahe_dienstleistungen">Haushaltsnahe DL</option>
              <option value="handwerkerleistungen">Handwerkerleist.</option>
            </select>
            {isCustom && (
              <button
                onClick={() => removeCustomCostItem(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Entfernen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                Kostenart
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                Umlageschlüssel
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                Gesamtkosten (EUR)
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                Mieteranteil (EUR)
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                <div className="flex items-center justify-center gap-1.5">
                  <span>§35a</span>
                  <div className="group relative inline-block">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 fixed z-[99999] w-72 p-3 bg-gray-900 text-white text-xs font-normal rounded-lg shadow-2xl pointer-events-none" style={{marginTop: '-80px', marginLeft: '-130px'}}>
                      <div className="text-left leading-relaxed">
                        Hinweis: Die steuerliche Einordnung erfolgt auf Basis Ihrer Auswahl. Rentably übernimmt keine steuerliche Beratung.
                      </div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                Kategorie
              </th>
            </tr>
          </thead>
          <tbody>
            {group.costItems.map((item, index) => renderRow(item, index, false))}
            {group.customCostItems.map((item, index) => renderRow(item, index, true))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={2} className="py-4 px-4 text-right font-bold text-sm">
                Summe:
              </td>
              <td className="py-4 px-4 text-right font-bold text-lg text-primary-blue">
                {groupTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4 px-4 text-right font-bold text-lg text-green-700">
                {groupShareTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-600 mb-2">Eigene Kostenart hinzufügen</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCostType}
            onChange={(e) => setNewCostType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomCostType()}
            placeholder="z.B. Hausmeisterdienst"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
          />
          <Button onClick={addCustomCostType} disabled={!newCostType.trim()} variant="primary">
            <Plus className="w-4 h-4 mr-1" />
            Hinzufügen
          </Button>
        </div>
      </div>
    </div>
  );
}
