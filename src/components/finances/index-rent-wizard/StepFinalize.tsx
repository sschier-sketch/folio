import { CheckCircle, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "../../ui/Button";
import type { WizardState } from "./types";

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";

const formatDateDE = (iso: string) => {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface Props {
  state: WizardState;
  saving: boolean;
  saved: boolean;
  pdfBlob: Blob | null;
  onSave: (autoDownload: boolean) => void;
}

export default function StepFinalize({ state, saving, saved, pdfBlob, onSave }: Props) {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const newRent = oldVal > 0 ? Math.round(state.currentRent * (newVal / oldVal) * 100) / 100 : 0;
  const gesamtmiete = newRent + state.currentUtilities;

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Indexmieterhoehung_${state.tenantName.replace(/\s+/g, "_")}_${state.effectiveDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (saved && pdfBlob) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">Indexmieterh\u00F6hung abgeschlossen</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Das Erh\u00F6hungsschreiben wurde als PDF gespeichert und die neue Miete im System hinterlegt.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Neue Nettokaltmiete</span>
            <span className="font-semibold text-dark">{fmt(newRent)}</span>
          </div>
          {state.currentUtilities > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Betriebskosten</span>
                <span className="text-dark">{fmt(state.currentUtilities)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-500 font-medium">Gesamtmiete</span>
                <span className="font-bold text-dark">{fmt(gesamtmiete)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Wirksam ab</span>
            <span className="font-semibold text-dark">{formatDateDE(state.effectiveDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status im System</span>
            <span className="font-semibold text-dark">
              {state.effectiveDate <= new Date().toISOString().split("T")[0] ? "Aktiv" : "Geplant (wird automatisch aktiv)"}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleDownload} variant="secondary">
            <Download className="w-4 h-4 mr-1.5" />
            PDF herunterladen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">Finalisieren</h3>
        <p className="text-sm text-gray-500">
          Pr\u00FCfen Sie die Zusammenfassung und erstellen Sie das PDF.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mieter</span>
          <span className="font-semibold text-dark">{state.tenantName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Bisherige Nettokaltmiete</span>
          <span className="text-dark">{fmt(state.currentRent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Neue Nettokaltmiete</span>
          <span className="font-bold text-emerald-700">{fmt(newRent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Erh\u00F6hung</span>
          <span className="text-emerald-700">+{fmt(newRent - state.currentRent)}</span>
        </div>
        {state.currentUtilities > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Betriebskosten</span>
              <span className="text-dark">{fmt(state.currentUtilities)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-500 font-medium">Neue Gesamtmiete</span>
              <span className="font-bold text-dark">{fmt(gesamtmiete)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Wirksam ab</span>
          <span className="font-semibold text-dark">{formatDateDE(state.effectiveDate)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-2 font-medium">Beim Finalisieren passiert Folgendes:</p>
        <ul className="text-sm text-blue-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>PDF wird generiert und als internes Dokument gespeichert (nicht im Mieterportal sichtbar)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {state.effectiveDate <= new Date().toISOString().split("T")[0]
                ? "Die neue Miete wird sofort im System als aktuelle Miete eingetragen"
                : `Die neue Miete wird als geplant eingetragen und am ${formatDateDE(state.effectiveDate)} automatisch aktiv`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>VPI-Werte werden f\u00FCr k\u00FCnftige Berechnungen gespeichert</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <Button onClick={() => onSave(false)} disabled={saving} variant="secondary">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-1.5" />
              PDF speichern
            </>
          )}
        </Button>
        <Button onClick={() => onSave(true)} disabled={saving} variant="primary">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-1.5" />
              PDF speichern & downloaden
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
