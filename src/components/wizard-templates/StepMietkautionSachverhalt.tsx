import type { MietkautionSachverhalt } from './types';

interface Props {
  data: MietkautionSachverhalt;
  onChange: (data: MietkautionSachverhalt) => void;
}

export function isMietkautionSachverhaltValid(data: MietkautionSachverhalt): boolean {
  if (!data.fristAuszug || !data.zahlungsrueckstand || !data.kautionBetrag) return false;
  if (!data.forderungHoeher) return false;
  if (data.forderungHoeher === 'ja' && (!data.restsumme || !data.ueberweisungsfrist)) return false;
  return true;
}

function EuroInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-xs px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
        &euro;
      </span>
    </div>
  );
}

export default function StepMietkautionSachverhalt({ data, onChange }: Props) {
  const set = (partial: Partial<MietkautionSachverhalt>) => onChange({ ...data, ...partial });

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Daten zur Inanspruchnahme der Mietkaution an.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frist zum Auszug *
          </label>
          <input
            type="date"
            value={data.fristAuszug}
            onChange={(e) => set({ fristAuszug: e.target.value })}
            className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Insgesamt beträgt Ihr Zahlungsrückstand *
          </label>
          <EuroInput value={data.zahlungsrueckstand} onChange={(v) => set({ zahlungsrueckstand: v })} />
        </div>

        <div>
          <h4 className="text-base font-semibold text-dark mb-1">Im Einzelnen</h4>
          <div className="border-t border-gray-200 mb-4" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verspäteter Monat
              </label>
              <input
                type="text"
                value={data.verspaetertMonat}
                onChange={(e) => set({ verspaetertMonat: e.target.value })}
                placeholder="z. B. Februar 2026"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschuldeter Mietbetrag
              </label>
              <EuroInput value={data.geschuldeterMietbetrag} onChange={(v) => set({ geschuldeterMietbetrag: v })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schadensersatz
              </label>
              <EuroInput value={data.schadensersatz} onChange={(v) => set({ schadensersatz: v })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betriebskostennachzahlung
              </label>
              <EuroInput value={data.betriebskostennachzahlung} onChange={(v) => set({ betriebskostennachzahlung: v })} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-dark mb-1">Im Einzelnen</h4>
          <div className="border-t border-gray-200 mb-4" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kaution in Höhe von:
              </label>
              <EuroInput value={data.kautionBetrag} onChange={(v) => set({ kautionBetrag: v })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                zzgl. Zinsen
              </label>
              <EuroInput value={data.zinsen} onChange={(v) => set({ zinsen: v })} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Forderung des Vermieters:der Vermieterin ist höher als die Kaution
          </label>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="forderungHoeher"
                checked={data.forderungHoeher === 'nein'}
                onChange={() => set({ forderungHoeher: 'nein', restsumme: '', ueberweisungsfrist: '' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="forderungHoeher"
                checked={data.forderungHoeher === 'ja'}
                onChange={() => set({ forderungHoeher: 'ja' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        {data.forderungHoeher === 'ja' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restsumme
              </label>
              <EuroInput value={data.restsumme} onChange={(v) => set({ restsumme: v })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Überweisungsfrist
              </label>
              <input
                type="date"
                value={data.ueberweisungsfrist}
                onChange={(e) => set({ ueberweisungsfrist: e.target.value })}
                className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
