import { Plus, Minus, Trash2 } from 'lucide-react';
import type { AbmahnungRuhestoerungSachverhalt, StoerungsEreignis } from './types';

interface Props {
  data: AbmahnungRuhestoerungSachverhalt;
  onChange: (d: AbmahnungRuhestoerungSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

const TIME_OPTIONS = [
  '00:00','00:30','01:00','01:30','02:00','02:30','03:00','03:30',
  '04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30',
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30',
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function StepAbmahnungSachverhalt({ data, onChange }: Props) {
  const set = <K extends keyof AbmahnungRuhestoerungSachverhalt>(
    field: K,
    value: AbmahnungRuhestoerungSachverhalt[K],
  ) => onChange({ ...data, [field]: value });

  const updateEreignis = (id: string, field: keyof StoerungsEreignis, value: string) => {
    const updated = data.ereignisse.map((e) =>
      e.id === id ? { ...e, [field]: value } : e,
    );
    set('ereignisse', updated);
  };

  const addEreignis = () => {
    set('ereignisse', [
      ...data.ereignisse,
      { id: makeId(), datum: '', uhrzeit: '', kategorie: '', beschreibung: '' },
    ]);
  };

  const removeEreignis = (id: string) => {
    if (data.ereignisse.length <= 1) return;
    set('ereignisse', data.ereignisse.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Dokumentieren Sie die Störungsereignisse so genau wie möglich. Je detaillierter
          die Aufstellung, desto stärker die rechtliche Grundlage der Abmahnung.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die Details der Ruhestörung(en) ein.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Welche Nachbarn haben sich beschwert?
          </label>
          <input
            type="text"
            value={data.nachbarName}
            onChange={(e) => set('nachbarName', e.target.value)}
            className={inputCls}
            placeholder="z.B. Hans Meyer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Datum des Ereignisses *
          </label>
          <input
            type="date"
            value={data.datumEreignis}
            onChange={(e) => set('datumEreignis', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Anzahl der Ereignisse
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => set('anzahlEreignisse', Math.max(1, data.anzahlEreignisse - 1))}
              className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center text-base font-medium text-dark">
              {data.anzahlEreignisse}
            </div>
            <button
              type="button"
              onClick={() => set('anzahlEreignisse', data.anzahlEreignisse + 1)}
              className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Beschreibung von Störungsereignissen: *
          </label>

          <div className="space-y-4">
            {data.ereignisse.map((e, idx) => (
              <div
                key={e.id}
                className="border border-gray-200 rounded-lg p-4 relative"
              >
                {data.ereignisse.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEreignis(e.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {idx > 0 && (
                  <div className="text-xs font-medium text-gray-400 mb-3">
                    Ereignis {idx + 1}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Uhrzeit
                    </label>
                    <select
                      value={e.uhrzeit}
                      onChange={(ev) => updateEreignis(e.id, 'uhrzeit', ev.target.value)}
                      className={inputCls}
                    >
                      <option value="">--:--</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Datum
                    </label>
                    <input
                      type="date"
                      value={e.datum}
                      onChange={(ev) => updateEreignis(e.id, 'datum', ev.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategorie
                  </label>
                  <input
                    type="text"
                    value={e.kategorie}
                    onChange={(ev) => updateEreignis(e.id, 'kategorie', ev.target.value)}
                    className={inputCls}
                    placeholder="z.B. Laute Musik, Bohren, Party"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={e.beschreibung}
                    onChange={(ev) => updateEreignis(e.id, 'beschreibung', ev.target.value)}
                    className={inputCls}
                    placeholder="Kurze Beschreibung des Vorfalls"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEreignis}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-blue border border-gray-200 rounded-lg px-4 py-2.5 hover:border-primary-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            Weitere hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

export function isAbmahnungSachverhaltValid(d: AbmahnungRuhestoerungSachverhalt): boolean {
  if (!d.datumEreignis) return false;
  const hasValidEreignis = d.ereignisse.some(
    (e) => e.datum && e.beschreibung.trim(),
  );
  return hasValidEreignis;
}
