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

const formatEffectiveMonth = (iso: string) => {
  if (!iso) return "\u2013";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

interface Props {
  state: WizardState;
}

export default function StepPreview({ state }: Props) {
  const oldVal = parseFloat(state.vpiOldValue) || 0;
  const newVal = parseFloat(state.vpiNewValue) || 0;
  const indexFactor = oldVal > 0 ? newVal / oldVal : 1;
  const indexPercent = (indexFactor - 1) * 100;
  const newRent = oldVal > 0 ? Math.round(state.currentRent * indexFactor * 100) / 100 : 0;
  const newRentUnrounded = state.currentRent * indexFactor;
  const delta = newRent - state.currentRent;
  const gesamtmiete = newRent + state.currentUtilities;

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
          So wird das Erh&ouml;hungsschreiben aussehen. Bei der Finalisierung wird ein PDF generiert.
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Briefvorschau</span>
        </div>

        <div className="px-8 py-6 font-[serif] text-[15px] leading-relaxed text-gray-900 space-y-5">
          <div className="text-xs text-gray-400 border-b border-gray-200 pb-1">
            {state.landlordName} &middot; {state.landlordAddress}
          </div>

          <div className="mt-4">
            <p className="font-semibold">{state.tenantName}</p>
            <p className="whitespace-pre-line">{state.tenantAddress}</p>
          </div>

          <p className="text-right text-sm text-gray-500">{formatDateDE(new Date().toISOString().split("T")[0])}</p>

          <p className="font-bold text-base">
            Betreff: Anpassung der Miete gem&auml;&szlig; vereinbarter Indexmiete (&sect; 557b BGB)
          </p>

          <p>{salutation},</p>

          <p>
            im Mietvertrag vom {formatDateDE(state.contractDate)} wurde gem&auml;&szlig; &sect; 557b BGB vereinbart, dass die Nettokaltmiete an die Entwicklung des vom Statistischen Bundesamt ver&ouml;ffentlichten Verbraucherpreisindexes f&uuml;r Deutschland (VPI, Basisjahr 2020 = 100) angepasst wird.
          </p>

          <p>
            Die letzte Mietfestsetzung erfolgte zum {formatDateDE(state.currentRentValidFrom)} mit einer monatlichen Nettokaltmiete in H&ouml;he von {fmt(state.currentRent)} &euro;.
          </p>

          <div>
            <p className="font-bold mb-2">1. Entwicklung des Verbraucherpreisindexes</p>
            <hr className="border-gray-300 mb-3" />
            <p className="text-sm mb-1">Zum Zeitpunkt der letzten Mietfestsetzung ma&szlig;geblicher Index:</p>
            <p className="text-sm font-bold mb-3">
              {formatMonthDE(state.vpiOldMonth)} &ndash; {oldVal.toFixed(1)} Punkte
            </p>
            <p className="text-sm mb-1">Aktuell ver&ouml;ffentlichter Index:</p>
            <p className="text-sm font-bold">
              {formatMonthDE(state.vpiNewMonth)} &ndash; {newVal.toFixed(1)} Punkte
            </p>
          </div>

          <div>
            <p className="font-bold mb-2">2. Berechnung der Mietanpassung</p>
            <hr className="border-gray-300 mb-3" />
            <div className="text-sm space-y-2">
              <div>
                <p>Die Ver&auml;nderung des Indexes betr&auml;gt:</p>
                <p className="font-bold">{newVal.toFixed(1)} / {oldVal.toFixed(1)} = {indexFactor.toFixed(6)}</p>
              </div>
              <div>
                <p>Prozentuale Ver&auml;nderung:</p>
                <p className="font-bold">({indexFactor.toFixed(6)} - 1) &times; 100 = {indexPercent.toFixed(2)} %</p>
              </div>
              <div>
                <p>Berechnung der neuen Nettokaltmiete:</p>
                <p className="font-bold">{fmt(state.currentRent)} &euro; &times; {indexFactor.toFixed(6)} = {fmt(newRentUnrounded)} &euro;</p>
              </div>
              <div>
                <p>Gerundet auf zwei Nachkommastellen ergibt sich eine neue monatliche Nettokaltmiete von:</p>
                <p className="font-bold text-base">{fmt(newRent)} &euro;</p>
              </div>
              <div>
                <p>Die monatliche Erh&ouml;hung betr&auml;gt somit:</p>
                <p className="font-bold">{fmt(delta)} &euro;</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-bold mb-2">3. Wirksamkeit der Anpassung</p>
            <hr className="border-gray-300 mb-3" />
            <p className="text-sm mb-2">
              Die angepasste Miete ist gem&auml;&szlig; &sect; 557b BGB ab dem {formatDateDE(state.effectiveDate)} zu zahlen.
            </p>
            <p className="text-sm mb-2">
              Die Betriebskostenvorauszahlungen bleiben unver&auml;ndert, sofern keine gesonderte Anpassung erfolgt.
            </p>
            <p className="text-sm mb-2">
              Die monatlich zu zahlende Gesamtmiete setzt sich somit ab dem oben genannten Zeitpunkt wie folgt zusammen:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>&ndash; Nettokaltmiete: {fmt(newRent)} &euro;</li>
              <li>&ndash; Betriebskosten: {fmt(state.currentUtilities)} &euro;</li>
              <li className="font-bold">&ndash; Gesamtmiete: {fmt(gesamtmiete)} &euro;</li>
            </ul>
            <p className="text-sm mt-3">
              Bitte &uuml;berweisen Sie den entsprechend angepassten Betrag erstmals f&uuml;r den Monat {formatEffectiveMonth(state.effectiveDate)}.
            </p>
          </div>

          <p>F&uuml;r R&uuml;ckfragen stehen wir Ihnen gerne zur Verf&uuml;gung.</p>
          <p>Mit freundlichen Gr&uuml;&szlig;en</p>
          <p className="mt-4 font-semibold">{state.landlordName}</p>
          <p className="text-sm text-gray-600">{state.landlordAddress}</p>
        </div>
      </div>
    </div>
  );
}
