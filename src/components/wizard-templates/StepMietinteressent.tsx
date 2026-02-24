import type { MietinteressentData } from './types';

interface Props {
  data: MietinteressentData;
  onChange: (d: MietinteressentData) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

const FAMILIENSTAND_OPTIONS = [
  'ledig',
  'verheiratet',
  'verwitwet',
  'geschieden',
  'eingetragene Lebenspartnerschaft',
  'eingetragene Lebenspartnerschaft aufgehoben',
];

export default function StepMietinteressent({ data, onChange }: Props) {
  const set = <K extends keyof MietinteressentData>(
    field: K,
    value: MietinteressentData[K],
  ) => onChange({ ...data, [field]: value });

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Mietinteressent/in</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die persönlichen und beruflichen Angaben des Mietinteressenten ein.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mietbeginn *
            </label>
            <input
              type="date"
              value={data.mietbeginn}
              onChange={(e) => set('mietbeginn', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Gewünschter Einzugstermin *
            </label>
            <input
              type="date"
              value={data.gewuenschterEinzugstermin}
              onChange={(e) => set('gewuenschterEinzugstermin', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Geburtsdatum
            </label>
            <input
              type="date"
              value={data.geburtsdatum}
              onChange={(e) => set('geburtsdatum', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Familienstand
            </label>
            <select
              value={data.familienstand}
              onChange={(e) => set('familienstand', e.target.value)}
              className={inputCls}
            >
              <option value="">--</option>
              {FAMILIENSTAND_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Aktuelles monatliches Nettoeinkommen in Euro
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={data.nettoeinkommenMonatlich}
                onChange={(e) => set('nettoeinkommenMonatlich', e.target.value)}
                placeholder="0"
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                €
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Telefonnummer
            </label>
            <input
              type="tel"
              value={data.telefonnummer}
              onChange={(e) => set('telefonnummer', e.target.value)}
              placeholder="+49 30 ..."
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            E-Mail Adresse
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="beispiel@email.de"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bisheriger Vermieter
            </label>
            <input
              type="text"
              value={data.bisherigVermieter}
              onChange={(e) => set('bisherigVermieter', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kontakt des Vermieters
            </label>
            <input
              type="text"
              value={data.kontaktVermieter}
              onChange={(e) => set('kontaktVermieter', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Derzeitiger Arbeitgeber
            </label>
            <input
              type="text"
              value={data.derzeitigerArbeitgeber}
              onChange={(e) => set('derzeitigerArbeitgeber', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kontakt der Arbeitgeber
            </label>
            <input
              type="text"
              value={data.kontaktArbeitgeber}
              onChange={(e) => set('kontaktArbeitgeber', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Derzeitig ausgeübter Beruf / selbstständig als
            </label>
            <input
              type="text"
              value={data.ausgeuebterBeruf}
              onChange={(e) => set('ausgeuebterBeruf', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Stellung seit
            </label>
            <input
              type="text"
              value={data.stellungSeit}
              onChange={(e) => set('stellungSeit', e.target.value)}
              placeholder="z.B. 2020"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function isMietinteressentValid(d: MietinteressentData): boolean {
  return !!d.mietbeginn && !!d.gewuenschterEinzugstermin;
}
