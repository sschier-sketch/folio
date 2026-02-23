import type { LandlordData } from './types';

interface Props {
  data: LandlordData;
  onChange: (d: LandlordData) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function StepVermieter({ data, onChange }: Props) {
  const set = (field: keyof LandlordData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Die Vermieterdaten erscheinen als Absender im Brief. Stellen Sie sicher,
          dass Name und Anschrift korrekt sind, damit das Schreiben rechtlich wirksam ist.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Vermieter</h3>
      <p className="text-sm text-gray-500 mb-8">
        Ihre Daten wurden aus dem Profil geladen. Sie können sie hier anpassen.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Vor- und Nachname *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls}
            placeholder="Max Mustermann"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Straße *
            </label>
            <input
              type="text"
              value={data.street}
              onChange={(e) => set('street', e.target.value)}
              className={inputCls}
              placeholder="Musterstraße"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nr. *
            </label>
            <input
              type="text"
              value={data.number}
              onChange={(e) => set('number', e.target.value)}
              className={inputCls}
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PLZ *
            </label>
            <input
              type="text"
              value={data.zip}
              onChange={(e) => set('zip', e.target.value)}
              className={inputCls}
              placeholder="10179"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stadt *
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => set('city', e.target.value)}
              className={inputCls}
              placeholder="Berlin"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Adresszusatz
          </label>
          <input
            type="text"
            value={data.prefix}
            onChange={(e) => set('prefix', e.target.value)}
            className={inputCls}
            placeholder="z. B. c/o, Hinterhaus"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Land
          </label>
          <input
            type="text"
            value="Deutschland"
            disabled
            className={`${inputCls} bg-gray-50 text-gray-500`}
          />
        </div>
      </div>
    </div>
  );
}

export function isVermieterValid(d: LandlordData): boolean {
  return !!(d.name.trim() && d.street.trim() && d.number.trim() && d.zip.trim() && d.city.trim());
}
