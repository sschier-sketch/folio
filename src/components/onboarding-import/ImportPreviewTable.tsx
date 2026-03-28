import { AlertCircle } from 'lucide-react';
import { ImportProperty, ImportUnit, ImportTenant, ValidationError } from '../../lib/onboardingImport';

interface Props {
  properties: ImportProperty[];
  units: ImportUnit[];
  tenants: ImportTenant[];
  errors: ValidationError[];
}

export default function ImportPreviewTable({ properties, units, tenants, errors }: Props) {
  const errorsBySheet = (sheet: string) => errors.filter(e => e.sheet === sheet);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Immobilien ({properties.length})
          </h3>
          {errorsBySheet('Immobilien').length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {errorsBySheet('Immobilien').length} Fehler
            </span>
          )}
        </div>
        {properties.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Ref-Nr.</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Adresse</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Typ</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Kaufpreis</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {properties.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{p.ref_nr}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="px-3 py-2 text-gray-600">{p.street}, {p.zip_code} {p.city}</td>
                    <td className="px-3 py-2 text-gray-600">{p.property_type}</td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {p.purchase_price ? `${p.purchase_price.toLocaleString('de-DE')} EUR` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Keine Immobilien erkannt</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Einheiten ({units.length})
          </h3>
          {errorsBySheet('Einheiten').length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {errorsBySheet('Einheiten').length} Fehler
            </span>
          )}
        </div>
        {units.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Immobilie</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Nr.</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Typ</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Fläche</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Zimmer</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{u.property_ref}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{u.unit_number}</td>
                    <td className="px-3 py-2 text-gray-600">{u.unit_type}</td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {u.area_sqm ? `${u.area_sqm} m²` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{u.rooms || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Keine Einheiten erkannt</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Mietverhältnisse ({tenants.length})
          </h3>
          {errorsBySheet('Mietverhältnisse').length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {errorsBySheet('Mietverhältnisse').length} Fehler
            </span>
          )}
        </div>
        {tenants.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Immobilie</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Einheit</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Mieter</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Beginn</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Kaltmiete</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Gesamt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map((t, i) => {
                  const total = t.cold_rent + (t.additional_costs || 0) + (t.heating_costs || 0);
                  return (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{t.property_ref}</td>
                      <td className="px-3 py-2 text-gray-600">{t.unit_ref}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {t.first_name} {t.last_name}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(t.contract_start).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {t.cold_rent.toLocaleString('de-DE')} EUR
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {total.toLocaleString('de-DE')} EUR
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Keine Mietverhältnisse erkannt</p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">
              {errors.length} Validierungsfehler
            </h3>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-700">
                <span className="font-medium">{err.sheet}</span>
                {err.row > 0 && <span>, Zeile {err.row}</span>}
                {err.column !== '-' && <span>, Spalte "{err.column}"</span>}
                : {err.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
