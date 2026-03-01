import type { WohnungsgeberSachverhaltData } from './types';

interface Props {
  data: WohnungsgeberSachverhaltData;
  onChange: (data: WohnungsgeberSachverhaltData) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export function isWohnungsgeberSachverhaltValid(data: WohnungsgeberSachverhaltData): boolean {
  return !!data.einOderAuszug && !!data.umzugDatum;
}

export default function StepWohnungsgeberSachverhalt({ data, onChange }: Props) {
  const set = (partial: Partial<WohnungsgeberSachverhaltData>) =>
    onChange({ ...data, ...partial });

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Wohnungsgeberbestätigung</h3>
      <p className="text-sm text-gray-500 mb-8">
        Angaben zum meldepflichtigen Vorgang nach § 19 BMG.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Einzug oder Auszug?
          </label>
          <select
            value={data.einOderAuszug}
            onChange={(e) => set({ einOderAuszug: e.target.value as '' | 'einzug' | 'auszug' })}
            className={inputCls}
          >
            <option value="">--</option>
            <option value="einzug">Wohnungseinzug</option>
            <option value="auszug">Wohnungsauszug</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Umzug Datum
          </label>
          <input
            type="date"
            value={data.umzugDatum}
            onChange={(e) => set({ umzugDatum: e.target.value })}
            className={inputCls + ' max-w-xs'}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Wird die Anmeldung von einer Drittperson durchgeführt?
          </span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="drittperson"
                checked={!data.drittperson}
                onChange={() => set({ drittperson: false, maklerName: '' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="drittperson"
                checked={data.drittperson}
                onChange={() => set({ drittperson: true })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        {data.drittperson && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name des Maklers:der Maklerin
            </label>
            <input
              type="text"
              value={data.maklerName}
              onChange={(e) => set({ maklerName: e.target.value })}
              className={inputCls}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Bist du der Eigentümer:die Eigentümerin des Mietobjekts?
          </span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="eigentuemer"
                checked={!data.istEigentuemer}
                onChange={() => set({ istEigentuemer: false })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="eigentuemer"
                checked={data.istEigentuemer}
                onChange={() => set({ istEigentuemer: true })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anmerkung
          </label>
          <textarea
            value={data.anmerkung}
            onChange={(e) => set({ anmerkung: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
          />
        </div>
      </div>
    </div>
  );
}
