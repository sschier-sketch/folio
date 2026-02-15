import type { AllocationParams } from "../../lib/operatingCostService";
import { calcShare } from "./OperatingCostWizardStep2";

const ALLOCATION_LABELS: Record<string, string> = {
  area: "Wohnfläche",
  units: "Wohneinheiten",
  persons: "Personenzahl",
  consumption: "Verbrauch (Zähler)",
  mea: "MEA",
  direct: "Direktumlage",
  consumption_billing: "lt. Verbrauchsabrechnung",
};

interface LineItem {
  cost_type: string;
  allocation_key: string;
  amount: number;
  group_label?: string | null;
  custom_unit_mea?: number | null;
}

interface LineItemsGroupedViewProps {
  lineItems: LineItem[];
  allocParams?: AllocationParams | null;
}

export default function LineItemsGroupedView({ lineItems, allocParams }: LineItemsGroupedViewProps) {
  const groups = new Map<string, LineItem[]>();

  for (const item of lineItems) {
    const key = item.group_label || "Hauptabrechnung";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  const groupEntries = Array.from(groups.entries());
  const hasMultipleGroups = groupEntries.length > 1;
  const grandTotal = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const showShare = !!allocParams;
  const grandShareTotal = showShare
    ? lineItems.reduce((sum, item) => sum + calcShare(item.allocation_key, item.amount, allocParams!, item.custom_unit_mea), 0)
    : 0;
  const colSpanBase = showShare ? 3 : 2;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-dark mb-4">
        Erfasste Betriebskosten
        {hasMultipleGroups && (
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({groupEntries.length} Abrechnungen kumuliert)
          </span>
        )}
      </h3>

      {groupEntries.map(([groupLabel, items], groupIdx) => {
        const groupSum = items.reduce((sum, item) => sum + Number(item.amount), 0);
        const groupShareSum = showShare
          ? items.reduce((sum, item) => sum + calcShare(item.allocation_key, item.amount, allocParams!, item.custom_unit_mea), 0)
          : 0;

        return (
          <div key={groupLabel} className={groupIdx > 0 ? "mt-6" : ""}>
            {hasMultipleGroups && (
              <div className="flex items-center justify-between mb-2 px-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {groupLabel}
                </h4>
                <span className="text-sm font-medium text-gray-500">
                  {groupSum.toFixed(2)} EUR
                </span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                {groupIdx === 0 && (
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">
                        Kostenart
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">
                        Umlageschlüssel
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">
                        Gesamtkosten
                      </th>
                      {showShare && (
                        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">
                          Mieteranteil
                        </th>
                      )}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const share = showShare
                      ? calcShare(item.allocation_key, item.amount, allocParams!, item.custom_unit_mea)
                      : 0;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-dark">
                          {item.cost_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {ALLOCATION_LABELS[item.allocation_key] || item.allocation_key}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-dark">
                          {Number(item.amount).toFixed(2)} EUR
                        </td>
                        {showShare && (
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-700">
                            {share.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {hasMultipleGroups && (
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="px-4 py-2 text-sm text-gray-600 font-medium">
                        Zwischensumme {groupLabel}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-700">
                        {groupSum.toFixed(2)} EUR
                      </td>
                      {showShare && (
                        <td className="px-4 py-2 text-sm text-right font-medium text-green-700">
                          {groupShareSum.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                        </td>
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="border-t-2 border-gray-300 mt-2">
        <table className="w-full">
          <tbody>
            <tr className="font-semibold">
              <td colSpan={colSpanBase} className="px-4 py-3 text-sm text-dark">
                {hasMultipleGroups ? "Gesamtsumme (kumuliert)" : "Summe"}
              </td>
              <td className="px-4 py-3 text-sm text-right text-dark">
                {grandTotal.toFixed(2)} EUR
              </td>
              {showShare && (
                <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                  {grandShareTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
