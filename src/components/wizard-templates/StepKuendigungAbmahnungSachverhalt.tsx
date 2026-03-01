import type { KuendigungAbmahnungSachverhalt } from './types';

interface Props {
  data: KuendigungAbmahnungSachverhalt;
  onChange: (data: KuendigungAbmahnungSachverhalt) => void;
}

export function isKuendigungAbmahnungSachverhaltValid(data: KuendigungAbmahnungSachverhalt): boolean {
  return !!(
    data.versanddatum &&
    data.datumWarnung &&
    data.verlassenBis &&
    data.berufungsfrist
  );
}

export default function StepKuendigungAbmahnungSachverhalt({ data, onChange }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Daten zur Abmahnung und Kündigung an.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum der Warnung *
          </label>
          <input
            type="date"
            value={data.datumWarnung}
            onChange={(e) => onChange({ ...data, datumWarnung: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warnungsgrund
          </label>
          <input
            type="text"
            value={data.warnungsgrund}
            onChange={(e) => onChange({ ...data, warnungsgrund: e.target.value })}
            placeholder="z.B. wiederholte Ruhestörung, Zahlungsverzug..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frist bis
          </label>
          <input
            type="date"
            value={data.fristBis}
            onChange={(e) => onChange({ ...data, fristBis: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibe den Grund für die Kündigung
          </label>
          <textarea
            value={data.kuendigungsgrund}
            onChange={(e) => onChange({ ...data, kuendigungsgrund: e.target.value })}
            rows={4}
            placeholder="Beschreiben Sie, welche Vertragsverletzungen weiterhin bestehen..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verlassen bis *
          </label>
          <p className="text-xs text-gray-400 mb-1.5">
            Das Datum, bis zu dem der Mieter das Mietobjekt geräumt zurückgeben soll.
          </p>
          <input
            type="date"
            value={data.verlassenBis}
            onChange={(e) => onChange({ ...data, verlassenBis: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum der Berufungsfrist *
          </label>
          <p className="text-xs text-gray-400 mb-1.5">
            Bis zu diesem Datum kann der Mieter der Kündigung widersprechen.
          </p>
          <input
            type="date"
            value={data.berufungsfrist}
            onChange={(e) => onChange({ ...data, berufungsfrist: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
      </div>
    </div>
  );
}
