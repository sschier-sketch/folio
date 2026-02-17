import { Calendar, TrendingUp, Info } from "lucide-react";
import type { WizardState } from "./types";

const formatCurrency = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";

const formatDateDE = (iso: string) => {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getReasonLabel = (reason: string | null) => {
  if (!reason) return null;
  const map: Record<string, string> = {
    initial: "Anfangsmiete",
    increase: "Mieterh\u00F6hung",
    index: "Indexmiete",
    stepped: "Staffelmiete",
    migration: "Migration",
    manual: "Manuell",
    import: "Import",
  };
  return map[reason] || reason;
};

interface Props {
  state: WizardState;
  tenantName: string;
  propertyName: string;
}

export default function StepOverview({ state, tenantName, propertyName }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">\u00DCbersicht</h3>
        <p className="text-sm text-gray-500">
          Pr\u00FCfen Sie die aktuellen Daten, bevor Sie die Indexmieterh\u00F6hung berechnen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mieter</span>
          </div>
          <p className="text-lg font-bold text-dark">{tenantName}</p>
          <p className="text-sm text-gray-500 mt-1">{propertyName}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aktuelle Nettokaltmiete</span>
          </div>
          <p className="text-2xl font-bold text-dark">{formatCurrency(state.currentRent)}</p>
          <p className="text-sm text-gray-500 mt-1">
            G\u00FCltig ab {formatDateDE(state.currentRentValidFrom)}
          </p>
        </div>
      </div>

      {state.lastChangeDate && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Letzte Miet\u00E4nderung</span>
          </div>
          <p className="text-sm text-dark">
            <span className="font-semibold">{formatDateDE(state.lastChangeDate)}</span>
            {state.lastChangeReason && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {getReasonLabel(state.lastChangeReason)}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Fr\u00FChestes Wirksamkeitsdatum</span>
        </div>
        <p className="text-lg font-bold text-dark">{formatDateDE(state.effectiveDate)}</p>
        <p className="text-xs text-blue-700 mt-1">
          Berechnet gem\u00E4\u00DF \u00A7 557b BGB: \u00DCbern\u00E4chster Monat nach Zugang des Erh\u00F6hungsschreibens, fr\u00FChestens 12 Monate nach letzter Anpassung.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Es werden keine \u00C4nderungen automatisch ins Mieterportal gestellt. Das Erh\u00F6hungsschreiben wird als internes Dokument gespeichert.
        </p>
      </div>
    </div>
  );
}
