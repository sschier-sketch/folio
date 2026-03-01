import type { SchoenheitsreparaturenSachverhalt } from './types';

interface Props {
  data: SchoenheitsreparaturenSachverhalt;
  onChange: (data: SchoenheitsreparaturenSachverhalt) => void;
}

export function isSchoenheitsreparaturenSachverhaltValid(
  data: SchoenheitsreparaturenSachverhalt,
): boolean {
  return !!data.besichtigungDatum && !!data.maengel.trim() && !!data.fristBis;
}

export default function StepSchoenheitsreparaturenSachverhalt({ data, onChange }: Props) {
  const set = (partial: Partial<SchoenheitsreparaturenSachverhalt>) =>
    onChange({ ...data, ...partial });

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die Details zur Besichtigung und die festgestellten Mängel an.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Besichgung Datum
          </label>
          <input
            type="date"
            value={data.besichtigungDatum}
            onChange={(e) => set({ besichtigungDatum: e.target.value })}
            className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mängel im Einzelnen zu beseitigen
          </label>
          <textarea
            value={data.maengel}
            onChange={(e) => set({ maengel: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frist bis
          </label>
          <input
            type="date"
            value={data.fristBis}
            onChange={(e) => set({ fristBis: e.target.value })}
            className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
      </div>
    </div>
  );
}
