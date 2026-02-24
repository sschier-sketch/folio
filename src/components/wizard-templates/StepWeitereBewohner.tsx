import { Plus, Trash2 } from 'lucide-react';
import type { WeitereBewohnerData, Bewohner } from './types';

interface Props {
  data: WeitereBewohnerData;
  onChange: (d: WeitereBewohnerData) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

function emptyBewohner(): Bewohner {
  return { name: '', verwandtschaftsgrad: '', geburtsdatum: '', eigenesEinkommen: '' };
}

export default function StepWeitereBewohner({ data, onChange }: Props) {
  const setBewohner = (idx: number, field: keyof Bewohner, value: string) => {
    const updated = data.bewohner.map((b, i) =>
      i === idx ? { ...b, [field]: value } : b,
    );
    onChange({ ...data, bewohner: updated });
  };

  const addBewohner = () => {
    onChange({ ...data, bewohner: [...data.bewohner, emptyBewohner()] });
  };

  const removeBewohner = (idx: number) => {
    onChange({ ...data, bewohner: data.bewohner.filter((_, i) => i !== idx) });
  };

  const setHat = (v: boolean) => {
    const bewohner = v && data.bewohner.length === 0 ? [emptyBewohner()] : data.bewohner;
    onChange({ hatWeitereBewohner: v, bewohner });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Weitere Bewohner</h3>
      <p className="text-sm text-gray-500 mb-8">
        Zum Haushalt gehörende Kinder, Verwandte, Hausangestellte oder sonstige Mitbewohner.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Weitere Mietinteressenten, Verwandte oder Kinder?
        </label>
        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hatWeitereBewohner"
              checked={!data.hatWeitereBewohner}
              onChange={() => setHat(false)}
              className="w-5 h-5 accent-primary-blue"
            />
            <span className="text-sm font-medium text-gray-700">Nein</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="hatWeitereBewohner"
              checked={data.hatWeitereBewohner}
              onChange={() => setHat(true)}
              className="w-5 h-5 accent-primary-blue"
            />
            <span className="text-sm font-medium text-gray-700">Ja</span>
          </label>
        </div>
      </div>

      {data.hatWeitereBewohner && (
        <div className="space-y-6">
          {data.bewohner.map((b, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-5 relative bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-dark text-sm">Bewohner:in {idx + 1}</h4>
                {data.bewohner.length > 1 && (
                  <button
                    onClick={() => removeBewohner(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => setBewohner(idx, 'name', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Verwandtschaftsgrad *
                  </label>
                  <input
                    type="text"
                    value={b.verwandtschaftsgrad}
                    onChange={(e) => setBewohner(idx, 'verwandtschaftsgrad', e.target.value)}
                    placeholder="z.B. Kind, Ehepartner"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Geburtsdatum
                  </label>
                  <input
                    type="date"
                    value={b.geburtsdatum}
                    onChange={(e) => setBewohner(idx, 'geburtsdatum', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Eigenes Einkommen (Netto)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={b.eigenesEinkommen}
                      onChange={(e) => setBewohner(idx, 'eigenesEinkommen', e.target.value)}
                      placeholder="0"
                      className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">
                      €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addBewohner}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Weitere Bewohner:innen hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}
