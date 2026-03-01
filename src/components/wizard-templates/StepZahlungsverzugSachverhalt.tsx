import { Plus, X } from 'lucide-react';
import type { ZahlungsverzugSachverhalt, OffeneZahlung } from './types';

interface Props {
  data: ZahlungsverzugSachverhalt;
  onChange: (data: ZahlungsverzugSachverhalt) => void;
}

export function isZahlungsverzugSachverhaltValid(data: ZahlungsverzugSachverhalt): boolean {
  if (!data.rueckgabeDatum) return false;
  if (data.zahlungen.length === 0) return false;
  return data.zahlungen.every((z) => z.betrag && z.faelligkeitsdatum);
}

export default function StepZahlungsverzugSachverhalt({ data, onChange }: Props) {
  function updateZahlung(index: number, partial: Partial<OffeneZahlung>) {
    const updated = data.zahlungen.map((z, i) => (i === index ? { ...z, ...partial } : z));
    onChange({ ...data, zahlungen: updated });
  }

  function addZahlung() {
    onChange({
      ...data,
      zahlungen: [...data.zahlungen, { betrag: '', faelligkeitsdatum: '' }],
    });
  }

  function removeZahlung(index: number) {
    if (data.zahlungen.length <= 1) return;
    onChange({
      ...data,
      zahlungen: data.zahlungen.filter((_, i) => i !== index),
    });
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-dark mb-2">Sachverhalt</h3>
      <p className="text-sm text-gray-500 mb-8">
        Listen Sie die offenen Zahlungen auf und geben Sie das Rückgabedatum an.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-4">
            Nicht geleistete Zahlungen:
          </label>

          <div className="space-y-3">
            {data.zahlungen.map((z, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-1">
                  {i === 0 && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zahlungsbetrag
                    </label>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={z.betrag}
                      onChange={(e) => updateZahlung(i, { betrag: e.target.value })}
                      placeholder=""
                      className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      &euro;
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  {i === 0 && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fälligkeitsdatum
                    </label>
                  )}
                  <input
                    type="date"
                    value={z.faelligkeitsdatum}
                    onChange={(e) => updateZahlung(i, { faelligkeitsdatum: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>

                {data.zahlungen.length > 1 && (
                  <button
                    onClick={() => removeZahlung(i)}
                    className={`flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors ${
                      i === 0 ? 'mt-8' : ''
                    }`}
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addZahlung}
            type="button"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Weitere hinzufügen
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mietobjekt zurückzugeben *
          </label>
          <input
            type="date"
            value={data.rueckgabeDatum}
            onChange={(e) => onChange({ ...data, rueckgabeDatum: e.target.value })}
            className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
      </div>
    </div>
  );
}
