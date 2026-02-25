import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, Building2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  type AfaSettings,
  type AfaSetupStatus,
  getAfaSetupStatus,
  saveAfaSettings,
  getDefaultAfaRate,
  mapPropertyTypeToUsage,
} from '../../lib/afaService';

interface AfaSetupModalProps {
  propertyId: string;
  userId: string;
  propertyType: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AfaSetupModal({ propertyId, userId, propertyType, onClose, onSaved }: AfaSetupModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePriceTotal, setPurchasePriceTotal] = useState('');
  const [buildingShareType, setBuildingShareType] = useState<'percent' | 'amount'>('percent');
  const [buildingShareValue, setBuildingShareValue] = useState('');
  const [constructionYear, setConstructionYear] = useState('');
  const [usageType, setUsageType] = useState<'residential' | 'commercial' | 'mixed'>('residential');
  const [afaRate, setAfaRate] = useState('');
  const [ownershipShare, setOwnershipShare] = useState('100');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [propertyId]);

  async function loadStatus() {
    setLoading(true);
    const status = await getAfaSetupStatus(propertyId, userId);
    prefillForm(status);
    setLoading(false);
  }

  function prefillForm(status: AfaSetupStatus) {
    const cv = status.current_values;
    const pd = status.proposed_defaults;

    if (cv.purchase_date) setPurchaseDate(cv.purchase_date);
    if (cv.purchase_price_total) setPurchasePriceTotal(String(cv.purchase_price_total));
    if (cv.building_share_type) setBuildingShareType(cv.building_share_type);
    if (cv.building_share_value) {
      setBuildingShareValue(String(cv.building_share_value));
    } else if (pd.building_share_value) {
      setBuildingShareValue(String(pd.building_share_value));
    }
    if (cv.construction_year) setConstructionYear(String(cv.construction_year));

    const effectiveUsage = cv.usage_type || pd.usage_type || mapPropertyTypeToUsage(propertyType) || 'residential';
    setUsageType(effectiveUsage);

    const effectiveRate = cv.afa_rate || pd.afa_rate || getDefaultAfaRate(effectiveUsage);
    setAfaRate(String(Math.round(effectiveRate * 10000) / 100));

    if (cv.ownership_share != null) setOwnershipShare(String(cv.ownership_share));
    if (cv.enabled != null) setEnabled(cv.enabled);
  }

  function handleUsageTypeChange(newUsage: 'residential' | 'commercial' | 'mixed') {
    setUsageType(newUsage);
    const defaultRate = getDefaultAfaRate(newUsage);
    setAfaRate(String(Math.round(defaultRate * 10000) / 100));
  }

  async function handleSave() {
    setError('');

    if (!purchaseDate) { setError('Bitte Anschaffungsdatum angeben.'); return; }
    const priceNum = parseFloat(purchasePriceTotal.replace(/\./g, '').replace(',', '.'));
    if (!priceNum || priceNum <= 0) { setError('Bitte einen gültigen Kaufpreis angeben.'); return; }

    const shareNum = parseFloat(buildingShareValue.replace(',', '.'));
    if (!shareNum || shareNum <= 0) { setError('Bitte Gebäudeanteil angeben.'); return; }
    if (buildingShareType === 'percent' && shareNum > 100) { setError('Gebäudeanteil darf maximal 100% betragen.'); return; }

    const rateNum = parseFloat(afaRate.replace(',', '.')) / 100;
    if (!rateNum || rateNum <= 0 || rateNum > 0.2) { setError('AfA-Satz muss zwischen 0,01% und 20% liegen.'); return; }

    const ownerNum = parseFloat(ownershipShare.replace(',', '.'));
    if (!ownerNum || ownerNum <= 0 || ownerNum > 100) { setError('Eigentumsanteil muss zwischen 1 und 100% liegen.'); return; }

    const cyNum = constructionYear ? parseInt(constructionYear) : null;
    if (cyNum && (cyNum < 1800 || cyNum > new Date().getFullYear())) { setError('Bitte ein gültiges Baujahr angeben.'); return; }

    const settings: AfaSettings = {
      enabled,
      purchase_date: purchaseDate,
      purchase_price_total: priceNum,
      building_share_type: buildingShareType,
      building_share_value: shareNum,
      building_value_amount: 0,
      construction_year: cyNum,
      usage_type: usageType,
      afa_rate: rateNum,
      ownership_share: ownerNum,
    };

    setSaving(true);
    const result = await saveAfaSettings(propertyId, userId, settings);
    setSaving(false);

    if (result.error) { setError(result.error); return; }
    onSaved();
  }

  const computedBuildingValue = (() => {
    const price = parseFloat(purchasePriceTotal.replace(/\./g, '').replace(',', '.')) || 0;
    const share = parseFloat(buildingShareValue.replace(',', '.')) || 0;
    if (buildingShareType === 'percent') return Math.round(price * (share / 100) * 100) / 100;
    return share;
  })();

  const computedAnnualAfa = (() => {
    const rate = (parseFloat(afaRate.replace(',', '.')) || 0) / 100;
    return Math.round(computedBuildingValue * rate * 100) / 100;
  })();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h3 className="text-xl font-bold text-dark">AfA einrichten</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Die AfA-Berechnung ersetzt keine Steuerberatung. Bitte prüfe die Angaben mit deinem Steuerberater.
            </p>
          </div>

          <div className="flex items-center justify-between px-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-dark">AfA aktiv</p>
              <p className="text-xs text-gray-400 mt-0.5">Abschreibung in Steuerübersicht berücksichtigen</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-blue' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anschaffungsdatum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaufpreis gesamt (EUR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchasePriceTotal}
                    onChange={(e) => setPurchasePriceTotal(e.target.value)}
                    placeholder="z.B. 250000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Gebäudeanteil <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Grund & Boden ist nicht abschreibbar
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setBuildingShareType('percent')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        buildingShareType === 'percent' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Prozent
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuildingShareType('amount')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        buildingShareType === 'amount' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Betrag
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={buildingShareValue}
                      onChange={(e) => setBuildingShareValue(e.target.value)}
                      placeholder={buildingShareType === 'percent' ? 'z.B. 80' : 'z.B. 200000'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {buildingShareType === 'percent' ? '%' : 'EUR'}
                    </span>
                  </div>
                </div>
                {computedBuildingValue > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Gebäudeanteil: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(computedBuildingValue)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-sm font-medium text-gray-700">Baujahr</label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Alternativ: Bezugsfertig seit
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={constructionYear}
                    onChange={(e) => setConstructionYear(e.target.value)}
                    placeholder="z.B. 1995"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nutzungstyp</label>
                  <select
                    value={usageType}
                    onChange={(e) => handleUsageTypeChange(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm bg-white"
                  >
                    <option value="residential">Wohnen</option>
                    <option value="commercial">Gewerbe</option>
                    <option value="mixed">Gemischt</option>
                  </select>
                  {propertyType === 'parking' && (
                    <p className="text-xs text-amber-600 mt-1">Stellplatz/Garage: AfA-Satz kann abweichen – bitte prüfen.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      AfA-Satz (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-800 text-white text-[11px] rounded-lg max-w-[200px] text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Bitte mit Steuerberater prüfen
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={afaRate}
                    onChange={(e) => setAfaRate(e.target.value)}
                    placeholder="z.B. 2"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm"
                  />
                  {computedAnnualAfa > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Jährliche AfA: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(computedAnnualAfa)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eigentumsanteil (%)</label>
                  <input
                    type="text"
                    value={ownershipShare}
                    onChange={(e) => setOwnershipShare(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <Button variant="cancel" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Speichere...</> : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
