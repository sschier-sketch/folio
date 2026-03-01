import type { RaeumungsaufforderungSachverhalt } from './types';

interface Props {
  data: RaeumungsaufforderungSachverhalt;
  onChange: (data: RaeumungsaufforderungSachverhalt) => void;
}

export function isRaeumungSachverhaltValid(data: RaeumungsaufforderungSachverhalt): boolean {
  if (!data.versanddatum || !data.kuendigungsDatum || !data.fristAuszug) return false;
  const today = new Date().toISOString().split('T')[0];
  if (data.kuendigungsDatum > today) return false;
  if (data.fristAuszug > today) return false;
  return true;
}

export default function StepRaeumungSachverhalt({ data, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const kuendigungInFuture = data.kuendigungsDatum && data.kuendigungsDatum > today;
  const fristInFuture = data.fristAuszug && data.fristAuszug > today;

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Daten zur Kuendigung und Raeumungsfrist an.
        Alle Daten muessen in der Vergangenheit liegen.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Versanddatum des Briefes *
          </label>
          <input
            type="date"
            value={data.versanddatum}
            onChange={(e) => onChange({ ...data, versanddatum: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum der Kuendigung *
          </label>
          <p className="text-xs text-gray-400 mb-1.5">
            Das Datum, an dem die Kuendigung ausgesprochen wurde.
          </p>
          <input
            type="date"
            value={data.kuendigungsDatum}
            max={today}
            onChange={(e) => onChange({ ...data, kuendigungsDatum: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue ${
              kuendigungInFuture ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          {kuendigungInFuture && (
            <p className="text-xs text-red-500 mt-1">
              Das Kuendigungsdatum muss in der Vergangenheit liegen.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frist zum Auszug *
          </label>
          <p className="text-xs text-gray-400 mb-1.5">
            Das Datum, bis zu dem der Mieter haette ausziehen muessen.
          </p>
          <input
            type="date"
            value={data.fristAuszug}
            max={today}
            onChange={(e) => onChange({ ...data, fristAuszug: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue ${
              fristInFuture ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          {fristInFuture && (
            <p className="text-xs text-red-500 mt-1">
              Die Auszugsfrist muss in der Vergangenheit liegen.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Hinweis:</strong> Die Raeumungsaufforderung setzt voraus, dass die Kuendigung
          bereits wirksam zugestellt wurde und die Frist zum Auszug verstrichen ist. Beide Daten
          muessen daher in der Vergangenheit liegen.
        </p>
      </div>
    </div>
  );
}
