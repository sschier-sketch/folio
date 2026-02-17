import { FileText } from "lucide-react";
import type { WizardState } from "./types";

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatMonthDE = (iso: string) => {
  if (!iso) return "\u2013";
  const d = new Date(iso + (iso.length <= 7 ? "-01" : ""));
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

const formatDateDE = (iso: string) => {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface Props {
  state: WizardState;
}

export default function StepPreview({ state }: Props) {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const pctChange = oldVal > 0 ? ((newVal / oldVal - 1) * 100) : 0;
  const newRent = oldVal > 0 ? Math.round(state.currentRent * (newVal / oldVal) * 100) / 100 : 0;
  const delta = newRent - state.currentRent;

  let salutation = "Sehr geehrte Damen und Herren";
  if (state.tenantSalutation === "male") {
    salutation = `Sehr geehrter Herr ${state.tenantName.split(" ").pop()}`;
  } else if (state.tenantSalutation === "female") {
    salutation = `Sehr geehrte Frau ${state.tenantName.split(" ").pop()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-1">Vorschau</h3>
        <p className="text-sm text-gray-500">
          So wird das Erh\u00F6hungsschreiben aussehen. Bei der Finalisierung wird ein PDF generiert.
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Briefvorschau</span>
        </div>

        <div className="px-8 py-6 font-[serif] text-[15px] leading-relaxed text-gray-900 space-y-6">
          <div className="text-xs text-gray-400 border-b border-gray-200 pb-1">
            {state.landlordName} &middot; {state.landlordAddress}
          </div>

          <div className="mt-4">
            <p className="font-semibold">{state.tenantName}</p>
            <p className="whitespace-pre-line">{state.tenantAddress}</p>
          </div>

          <p className="text-right text-sm text-gray-500">{formatDateDE(new Date().toISOString().split("T")[0])}</p>

          <p className="font-bold text-lg">Mietanpassung gem\u00E4\u00DF \u00A7 557b BGB (Indexmiete)</p>

          <div className="text-sm text-gray-600">
            <p>Mietobjekt: {state.propertyAddress}{state.unitNumber ? `, Einheit ${state.unitNumber}` : ""}</p>
            {state.contractDate && <p>Mietvertrag vom {formatDateDE(state.contractDate)}</p>}
          </div>

          <p>{salutation},</p>

          <p>
            gem\u00E4\u00DF \u00A7 557b BGB und der in Ihrem Mietvertrag enthaltenen Indexklausel teilen
            wir Ihnen hiermit die Anpassung der Nettokaltmiete auf Grundlage des Verbraucherpreisindex
            (VPI) f\u00FCr Deutschland mit.
          </p>

          <div>
            <p className="font-bold mb-2">I. Verbraucherpreisindex (VPI)</p>
            <hr className="border-gray-300 mb-3" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <p>Basismonat: <strong>{formatMonthDE(state.vpiOldMonth)}</strong></p>
              <p>Indexstand: <strong>{oldVal.toFixed(1)}</strong></p>
              <p>Aktueller Monat: <strong>{formatMonthDE(state.vpiNewMonth)}</strong></p>
              <p>Indexstand: <strong>{newVal.toFixed(1)}</strong></p>
            </div>
            <p className="mt-2 text-sm">
              Index\u00E4nderung: {newVal.toFixed(1)} / {oldVal.toFixed(1)} &ndash; 1 = <strong>+{pctChange.toFixed(2)} %</strong>
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">II. Berechnung der neuen Miete</p>
            <hr className="border-gray-300 mb-3" />
            <div className="text-sm space-y-1">
              <p>Bisherige Nettokaltmiete: {fmt(state.currentRent)} \u20AC</p>
              <p>Indexfaktor: {newVal.toFixed(1)} / {oldVal.toFixed(1)} = {(newVal / oldVal).toFixed(6)}</p>
              <p>Neue Nettokaltmiete: {fmt(state.currentRent)} \u20AC &times; {(newVal / oldVal).toFixed(6)} = <strong>{fmt(newRent)} \u20AC</strong></p>
              <p className="font-bold mt-2">Erh\u00F6hung: {fmt(delta)} \u20AC pro Monat</p>
            </div>
          </div>

          <div>
            <p className="font-bold mb-2">III. Zusammenfassung</p>
            <hr className="border-gray-300 mb-3" />
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Bisherige Nettokaltmiete:</span>
                <span>{fmt(state.currentRent)} \u20AC</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Neue Nettokaltmiete:</span>
                <span>{fmt(newRent)} \u20AC</span>
              </div>
              <div className="flex justify-between">
                <span>Wirksamkeitsdatum:</span>
                <span>{formatDateDE(state.effectiveDate)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold mb-2">IV. Rechtliche Hinweise</p>
            <hr className="border-gray-300 mb-3" />
            <p className="text-sm text-gray-700">
              Die Anpassung der Miete erfolgt auf Grundlage der im Mietvertrag vereinbarten Indexklausel
              gem\u00E4\u00DF \u00A7 557b BGB. Ma\u00DFgeblich ist der vom Statistischen Bundesamt ver\u00F6ffentlichte
              Verbraucherpreisindex f\u00FCr Deutschland (Basis 2020 = 100). Die neue Miete wird ab dem oben
              genannten Wirksamkeitsdatum geschuldet. Die \u00FCbrigen Bestandteile Ihres Mietvertrages bleiben unber\u00FChrt.
            </p>
          </div>

          <p className="text-sm">
            Bitte \u00FCberweisen Sie ab dem {formatDateDE(state.effectiveDate)} den neuen monatlichen Betrag
            von {fmt(newRent)} \u20AC (Nettokaltmiete) zuz\u00FCglich der vereinbarten Nebenkosten.
          </p>

          <p>F\u00FCr R\u00FCckfragen stehen wir Ihnen gerne zur Verf\u00FCgung.</p>
          <p>Mit freundlichen Gr\u00FC\u00DFen</p>
          <p className="mt-4 font-semibold">{state.landlordName}</p>
        </div>
      </div>
    </div>
  );
}
