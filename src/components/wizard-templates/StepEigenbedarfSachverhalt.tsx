import type { EigenbedarfSachverhalt } from './types';

interface Props {
  data: EigenbedarfSachverhalt;
  onChange: (data: EigenbedarfSachverhalt) => void;
}

export function isEigenbedarfSachverhaltValid(data: EigenbedarfSachverhalt): boolean {
  if (!data.raeumungsdatum || !data.raeumungsgrund || !data.hatAndereWohnung) return false;
  if (data.hatAndereWohnung === 'ja' && !data.andereWohnungNutzbar) return false;
  return true;
}

export default function StepEigenbedarfSachverhalt({ data, onChange }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Geben Sie die relevanten Daten zur Eigenbedarfskündigung an.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Räumungsdatum *
          </label>
          <input
            type="date"
            value={data.raeumungsdatum}
            onChange={(e) => onChange({ ...data, raeumungsdatum: e.target.value })}
            className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Räumungsgrund *
          </label>
          <textarea
            value={data.raeumungsgrund}
            onChange={(e) => onChange({ ...data, raeumungsgrund: e.target.value })}
            rows={4}
            placeholder="Ich möchte selber einziehen"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Haben Sie eine andere Wohnung zur Verfügung? *
          </label>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatAndereWohnung"
                checked={data.hatAndereWohnung === 'nein'}
                onChange={() =>
                  onChange({ ...data, hatAndereWohnung: 'nein', andereWohnungNutzbar: '' })
                }
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hatAndereWohnung"
                checked={data.hatAndereWohnung === 'ja'}
                onChange={() => onChange({ ...data, hatAndereWohnung: 'ja' })}
                className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
          </div>
        </div>

        {data.hatAndereWohnung === 'ja' && (
          <div className="animate-in fade-in duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Könnten Sie diese Wohnung für sich selbst nutzen? *
            </label>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="andereWohnungNutzbar"
                  checked={data.andereWohnungNutzbar === 'nein'}
                  onChange={() => onChange({ ...data, andereWohnungNutzbar: 'nein' })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Nein</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="andereWohnungNutzbar"
                  checked={data.andereWohnungNutzbar === 'ja'}
                  onChange={() => onChange({ ...data, andereWohnungNutzbar: 'ja' })}
                  className="w-5 h-5 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-700">Ja</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
