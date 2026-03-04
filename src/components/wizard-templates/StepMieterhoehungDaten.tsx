import { Lightbulb, CheckCircle } from 'lucide-react';
import type { MieterhoehungMieterhoehung } from './types';

interface Props {
  data: MieterhoehungMieterhoehung;
  onChange: (data: MieterhoehungMieterhoehung) => void;
}

export function isMieterhoehungDatenValid(d: MieterhoehungMieterhoehung): boolean {
  if (!d.wohnflaeche) return false;
  if (!d.aktuelleKaltmiete) return false;
  if (!d.aktuelleWarmmiete) return false;
  if (!d.mieterhoehungProQm) return false;
  if (!d.mieterhoehungDatum) return false;
  return true;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

function parseNum(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(',', '.')) || 0;
}

function formatEuro(val: number): string {
  return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';
}

export default function StepMieterhoehungDaten({ data, onChange }: Props) {
  const set = (partial: Partial<MieterhoehungMieterhoehung>) => onChange({ ...data, ...partial });

  const wohnflaeche = parseNum(data.wohnflaeche);
  const aktuelleKaltmiete = parseNum(data.aktuelleKaltmiete);
  const mieterhoehungProQm = parseNum(data.mieterhoehungProQm);
  const neueKaltmiete = aktuelleKaltmiete + mieterhoehungProQm * wohnflaeche;

  const vorauszahlungBK = parseNum(data.vorauszahlungBetriebskosten);
  const kabel = parseNum(data.kabelanschluss);
  const vorauszahlungHeizung = parseNum(data.vorauszahlungHeizung);
  const sonstige = parseNum(data.sonstigeGebuehren);
  const neueWarmmiete = neueKaltmiete + vorauszahlungBK + kabel + vorauszahlungHeizung + sonstige;

  return (
    <div>
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-gray-700">Hinweise und Tipps</span>
            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  Das Formular dient der Durchsetzung der Mieterhöhung bei preisfreiem Wohnraum nach den
                  §§ 558 bis 560 BGB. Wichtig ist, dass die Erhöhung der Miete nicht vertraglich
                  ausgeschlossen ist. Das Mieterhöhungsverlangen ist dem Mieter in Textform vorzulegen
                  und zu begründen.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  Bitte beschreiben Sie detailliert die auf dieser Seite angeforderten Informationen,
                  um sicherzustellen, dass Ihr Mieter den Grund der Erhöhung versteht.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Mieterhöhung</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die Details zur Mieterhöhung an.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Baujahr des Mietobjektes
          </label>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="numeric"
              value={data.baujahr}
              onChange={(e) => set({ baujahr: e.target.value })}
              className={inputCls}
              placeholder=""
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wohnfläche *
          </label>
          <div className="max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.wohnflaeche}
              onChange={(e) => set({ wohnflaeche: e.target.value })}
              className={inputCls}
              placeholder=""
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            aktuelle Kaltmiete *
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.aktuelleKaltmiete}
              onChange={(e) => set({ aktuelleKaltmiete: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            aktuelle Warmmiete *
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.aktuelleWarmmiete}
              onChange={(e) => set({ aktuelleWarmmiete: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mieterhöhung pro m&sup2; *
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.mieterhoehungProQm}
              onChange={(e) => set({ mieterhoehungProQm: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-dark mb-1">Neue Kaltmiete</p>
          <p className="text-2xl font-bold text-dark">{formatEuro(neueKaltmiete)}</p>
          <hr className="mt-3 border-gray-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vorauszahlung für Betriebskosten ohne Heizung und Warmwasser
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.vorauszahlungBetriebskosten}
              onChange={(e) => set({ vorauszahlungBetriebskosten: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kabelanschluss
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.kabelanschluss}
              onChange={(e) => set({ kabelanschluss: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vorauszahlung für Heizung und Warmwasser
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.vorauszahlungHeizung}
              onChange={(e) => set({ vorauszahlungHeizung: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sonstige Gebühren (Garage, Stellplatz, Keller)
          </label>
          <div className="relative max-w-xs">
            <input
              type="text"
              inputMode="decimal"
              value={data.sonstigeGebuehren}
              onChange={(e) => set({ sonstigeGebuehren: e.target.value })}
              className={inputCls}
              placeholder=""
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              &euro;
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-dark mb-1">Neue Warmmiete</p>
          <p className="text-2xl font-bold text-dark">{formatEuro(neueWarmmiete)}</p>
          <hr className="mt-3 border-gray-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wann tritt die Mieterhöhung in Kraft? *
          </label>
          <div className="max-w-xs">
            <input
              type="date"
              value={data.mieterhoehungDatum}
              onChange={(e) => set({ mieterhoehungDatum: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
