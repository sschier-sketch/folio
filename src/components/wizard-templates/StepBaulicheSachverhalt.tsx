import type { AbmahnungBaulicheSachverhalt } from './types';

interface Props {
  data: AbmahnungBaulicheSachverhalt;
  onChange: (d: AbmahnungBaulicheSachverhalt) => void;
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue';

export default function StepBaulicheSachverhalt({ data, onChange }: Props) {
  const set = <K extends keyof AbmahnungBaulicheSachverhalt>(
    field: K,
    value: AbmahnungBaulicheSachverhalt[K],
  ) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="bg-blue-50 rounded-lg px-5 py-4 mb-6">
        <h4 className="font-semibold text-dark mb-1 text-sm">Hinweise & Tipps</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Beschreiben Sie die baulichen Veränderungen so genau wie möglich. Setzen Sie
          eine angemessene Frist für den Rückbau (in der Regel mindestens 14 Tage).
        </p>
      </div>

      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die Details der unerlaubten baulichen Veränderungen ein.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Beschreibe möglichst genau, was ohne dein Einverständnis verändert wurde: *
          </label>
          <textarea
            value={data.beschreibung}
            onChange={(e) => set('beschreibung', e.target.value)}
            rows={4}
            className={inputCls + ' resize-y'}
            placeholder="z.B. Türen ausgebaut, Wände entfernt, Bodenbelag verändert..."
          />
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Bis wann muss die Reparatur erfolgen? *
          </label>
          <input
            type="date"
            value={data.reparaturFrist}
            onChange={(e) => set('reparaturFrist', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

export function isBaulicheSachverhaltValid(d: AbmahnungBaulicheSachverhalt): boolean {
  return d.beschreibung.trim().length > 0 && !!d.reparaturFrist;
}
