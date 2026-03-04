import { Lightbulb, CheckCircle } from 'lucide-react';
import type { MietschuldenfreiheitSachverhalt } from './types';

interface Props {
  data: MietschuldenfreiheitSachverhalt;
  onChange: (data: MietschuldenfreiheitSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export function isMietschuldenfreiheitSachverhaltValid(d: MietschuldenfreiheitSachverhalt): boolean {
  if (!d.hatMietschulden) return false;
  if (d.hatMietschulden === 'ja') {
    if (!d.hatZahlungsvereinbarung) return false;
    if (!d.schuldenBetrag) return false;
    if (d.hatZahlungsvereinbarung === 'ja' && !d.zahlungsvereinbarungText) return false;
  }
  if (d.hatBemerkungen === 'ja' && !d.bemerkungen) return false;
  return true;
}

export default function StepMietschuldenfreiheitSachverhalt({ data, onChange }: Props) {
  const set = (partial: Partial<MietschuldenfreiheitSachverhalt>) =>
    onChange({ ...data, ...partial });

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
                  Die Mietschuldenfreiheitsbescheinigung dient als Nachweis, dass der Mieter
                  seinen Zahlungsverpflichtungen vollständig nachgekommen ist.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>
                  Es besteht keine gesetzliche Pflicht zur Ausstellung. Sie kann jedoch
                  für den Mieter bei der Wohnungssuche hilfreich sein.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie an, ob Mietschulden bestehen und ob weitere Anmerkungen erforderlich sind.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hat der Mieter Mietschulden? *
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatMietschulden"
                checked={data.hatMietschulden === 'nein'}
                onChange={() =>
                  set({
                    hatMietschulden: 'nein',
                    hatZahlungsvereinbarung: '',
                    schuldenBetrag: '',
                    zahlungsvereinbarungText: '',
                  })
                }
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatMietschulden"
                checked={data.hatMietschulden === 'ja'}
                onChange={() => set({ hatMietschulden: 'ja' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        {data.hatMietschulden === 'ja' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ist eine Zahlungsvereinbarung in Kraft? *
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hatZahlungsvereinbarung"
                    checked={data.hatZahlungsvereinbarung === 'nein'}
                    onChange={() =>
                      set({ hatZahlungsvereinbarung: 'nein', zahlungsvereinbarungText: '' })
                    }
                    className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                  />
                  <span className="text-sm text-gray-700">Nein</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hatZahlungsvereinbarung"
                    checked={data.hatZahlungsvereinbarung === 'ja'}
                    onChange={() => set({ hatZahlungsvereinbarung: 'ja' })}
                    className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                  />
                  <span className="text-sm text-gray-700">Ja</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Höhe der Schulden *
              </label>
              <div className="relative max-w-xs">
                <input
                  type="text"
                  inputMode="decimal"
                  value={data.schuldenBetrag}
                  onChange={(e) => set({ schuldenBetrag: e.target.value })}
                  className={inputCls}
                  placeholder=""
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  &euro;
                </span>
              </div>
            </div>

            {data.hatZahlungsvereinbarung === 'ja' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zahlungsvereinbarung *
                </label>
                <textarea
                  value={data.zahlungsvereinbarungText}
                  onChange={(e) => set({ zahlungsvereinbarungText: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
                  placeholder="Beschreiben Sie die getroffene Zahlungsvereinbarung..."
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Weitere Bemerkungen
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatBemerkungen"
                checked={data.hatBemerkungen === 'nein'}
                onChange={() => set({ hatBemerkungen: 'nein', bemerkungen: '' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatBemerkungen"
                checked={data.hatBemerkungen === 'ja'}
                onChange={() => set({ hatBemerkungen: 'ja' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        {data.hatBemerkungen === 'ja' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bemerkungen *
            </label>
            <textarea
              value={data.bemerkungen}
              onChange={(e) => set({ bemerkungen: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
              placeholder="Weitere Bemerkungen..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
