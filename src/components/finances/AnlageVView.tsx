import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  Building2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getAnlageVSummary, type AnlageVSummary } from '../../lib/anlageVService';
import { generateAnlageVPdf, exportAnlageVCsv } from '../../lib/anlageVPdfGenerator';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
}

type ScopeType = 'property' | 'unit';
type ResultTab = 'incomes' | 'expenses' | 'export';

export default function AnlageVView() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const currentYear = new Date().getFullYear();
  const defaultYear = new Date().getMonth() === 0 && new Date().getDate() < 15
    ? currentYear - 1
    : currentYear - 1;

  const [year, setYear] = useState(defaultYear);
  const [scopeType, setScopeType] = useState<ScopeType>('property');
  const [scopeId, setScopeId] = useState('');
  const [ownershipShare, setOwnershipShare] = useState(100);
  const [showShareInput, setShowShareInput] = useState(false);

  const [summary, setSummary] = useState<AnlageVSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ResultTab>('incomes');
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const filteredUnits = useMemo(
    () => {
      if (scopeType !== 'unit') return [];
      const selectedPropId = scopeId
        ? units.find(u => u.id === scopeId)?.property_id
        : '';
      return units;
    },
    [units, scopeType, scopeId]
  );

  useEffect(() => {
    if (!user) return;
    loadProperties();
  }, [user]);

  useEffect(() => {
    setScopeId('');
    setSummary(null);
  }, [scopeType]);

  async function loadProperties() {
    try {
      setLoadingProperties(true);
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, address')
        .eq('user_id', user!.id)
        .order('name');

      setProperties(props || []);

      const { data: unitData } = await supabase
        .from('property_units')
        .select('id, property_id, unit_number')
        .eq('user_id', user!.id)
        .order('unit_number');

      setUnits(unitData || []);

      if (props && props.length > 0) {
        setScopeId(props[0].id);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoadingProperties(false);
    }
  }

  async function handleCalculate() {
    if (!user || !scopeId) return;
    setLoading(true);
    setError('');
    setSummary(null);

    const { data, error: err } = await getAnlageVSummary(
      user.id,
      year,
      scopeType,
      scopeId,
      ownershipShare
    );

    if (err) {
      setError(err);
    } else {
      setSummary(data);
      setActiveTab('incomes');
    }
    setLoading(false);
  }

  async function handleExportPdf() {
    if (!summary) return;
    setExporting(true);
    try {
      await generateAnlageVPdf(summary);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  }

  function handleExportCsv(type: 'incomes' | 'expenses') {
    if (!summary) return;
    exportAnlageVCsv(summary, type);
  }

  function fmtCurrency(v: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
  }

  function fmtDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('de-DE');
  }

  if (loadingProperties) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-6 h-6 text-primary-blue" />
          <h2 className="text-xl font-bold text-dark">Anlage V</h2>
        </div>
        <p className="text-sm text-gray-400">
          Jahresuebersicht deiner Vermietungs-Einnahmen und -Ausgaben.
        </p>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Hinweis: rentably ersetzt keine Steuerberatung. Pruefe die Angaben vor Abgabe und
          besprich sie mit deinem Steuerberater.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-dark mb-4">Filter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Steuerjahr</label>
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setSummary(null); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Bereich</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setScopeType('property')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  scopeType === 'property'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Immobilie
              </button>
              <button
                onClick={() => setScopeType('unit')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                  scopeType === 'unit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Einheit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {scopeType === 'property' ? 'Immobilie' : 'Einheit'}
            </label>
            {scopeType === 'property' ? (
              <select
                value={scopeId}
                onChange={(e) => { setScopeId(e.target.value); setSummary(null); }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Waehlen --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={scopeId}
                onChange={(e) => { setScopeId(e.target.value); setSummary(null); }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Waehlen --</option>
                {properties.map(p => {
                  const propUnits = units.filter(u => u.property_id === p.id);
                  if (propUnits.length === 0) return null;
                  return (
                    <optgroup key={p.id} label={p.name}>
                      {propUnits.map(u => (
                        <option key={u.id} value={u.id}>
                          Einheit {u.unit_number}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              <button
                type="button"
                onClick={() => setShowShareInput(!showShareInput)}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                Eigentumsanteil
                <ChevronDown className={`w-3 h-3 transition-transform ${showShareInput ? 'rotate-180' : ''}`} />
              </button>
            </label>
            {showShareInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={ownershipShare}
                  onChange={(e) => setOwnershipShare(Math.min(100, Math.max(1, Number(e.target.value) || 100)))}
                  className="w-20 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            ) : (
              <div className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                {ownershipShare}%
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <Button
            onClick={handleCalculate}
            disabled={loading || !scopeId}
            variant="primary"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Berechne...</>
            ) : (
              <><Calculator className="w-4 h-4 mr-1.5" />Berechnen</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              label="Einnahmen"
              value={fmtCurrency(summary.income_total)}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              bg="bg-emerald-50"
              valueColor="text-emerald-700"
            />
            <SummaryCard
              label="Ausgaben"
              value={fmtCurrency(summary.expense_total)}
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              bg="bg-red-50"
              valueColor="text-red-600"
            />
            <SummaryCard
              label="Ergebnis"
              value={fmtCurrency(summary.result_total)}
              icon={<Calculator className="w-5 h-5 text-blue-600" />}
              bg="bg-blue-50"
              valueColor={summary.result_total >= 0 ? 'text-emerald-700' : 'text-red-600'}
            />
          </div>

          {summary.ownership_share !== 100 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Alle Betraege wurden mit dem Eigentumsanteil von {summary.ownership_share}% berechnet.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {([
                ['incomes', `Einnahmen (${summary.incomes.length})`],
                ['expenses', `Ausgaben (${summary.expenses.length})`],
                ['export', 'Export'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === key
                      ? 'text-primary-blue'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {label}
                  {activeTab === key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-0">
              {activeTab === 'incomes' && (
                <IncomesTable incomes={summary.incomes} fmtDate={fmtDate} fmtCurrency={fmtCurrency} />
              )}
              {activeTab === 'expenses' && (
                <ExpensesTable expenses={summary.expenses} fmtDate={fmtDate} fmtCurrency={fmtCurrency} />
              )}
              {activeTab === 'export' && (
                <ExportPanel
                  summary={summary}
                  exporting={exporting}
                  onExportPdf={handleExportPdf}
                  onExportCsv={handleExportCsv}
                />
              )}
            </div>
          </div>
        </>
      )}

      {!summary && !loading && !error && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 mb-1">Waehle ein Steuerjahr und Objekt</p>
          <p className="text-xs text-gray-300">und klicke auf "Berechnen"</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, bg, valueColor }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  valueColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function IncomesTable({ incomes, fmtDate, fmtCurrency }: {
  incomes: AnlageVSummary['incomes'];
  fmtDate: (d: string) => string;
  fmtCurrency: (v: number) => string;
}) {
  if (incomes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-200" />
        <p>Keine Einnahmen im gewaehlten Zeitraum</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Datum</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Betrag</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Quelle</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Mieter</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Immobilie</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Einheit</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((row) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 text-sm text-dark">{fmtDate(row.date)}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-emerald-700">
                {fmtCurrency(row.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.source_type}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.tenant_name || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.property_name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.unit_number || '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td className="px-4 py-3 text-sm font-semibold text-dark">Gesamt</td>
            <td className="px-4 py-3 text-sm font-bold text-right text-emerald-700">
              {fmtCurrency(incomes.reduce((s, r) => s + r.amount, 0))}
            </td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ExpensesTable({ expenses, fmtDate, fmtCurrency }: {
  expenses: AnlageVSummary['expenses'];
  fmtDate: (d: string) => string;
  fmtCurrency: (v: number) => string;
}) {
  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <TrendingDown className="w-10 h-10 mx-auto mb-2 text-gray-200" />
        <p>Keine Ausgaben im gewaehlten Zeitraum</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Datum</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Betrag</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kategorie</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Anlage-V-Gruppe</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Empfaenger</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Immobilie</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((row) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 text-sm text-dark">{fmtDate(row.date)}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                {fmtCurrency(row.amount)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.category}</td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  {row.anlage_v_group}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.vendor || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{row.property_name}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200">
            <td className="px-4 py-3 text-sm font-semibold text-dark">Gesamt</td>
            <td className="px-4 py-3 text-sm font-bold text-right text-red-600">
              {fmtCurrency(expenses.reduce((s, r) => s + r.amount, 0))}
            </td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ExportPanel({ summary, exporting, onExportPdf, onExportCsv }: {
  summary: AnlageVSummary;
  exporting: boolean;
  onExportPdf: () => void;
  onExportCsv: (type: 'incomes' | 'expenses') => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-dark mb-3">PDF Export</h4>
        <p className="text-xs text-gray-400 mb-3">
          Komplette Jahresuebersicht mit Einnahmen, Ausgaben und Ergebnis als PDF.
        </p>
        <Button
          onClick={onExportPdf}
          disabled={exporting}
          variant="primary"
        >
          {exporting ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Exportiere...</>
          ) : (
            <><Download className="w-4 h-4 mr-1.5" />PDF herunterladen</>
          )}
        </Button>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-semibold text-dark mb-3">CSV Export</h4>
        <p className="text-xs text-gray-400 mb-3">
          Einzelne Tabellen als CSV fuer die Weiterverarbeitung in Excel oder fuer den Steuerberater.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onExportCsv('incomes')}
            variant="secondary"
            disabled={summary.incomes.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Einnahmen ({summary.incomes.length})
          </Button>
          <Button
            onClick={() => onExportCsv('expenses')}
            variant="secondary"
            disabled={summary.expenses.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ausgaben ({summary.expenses.length})
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Diese Exporte dienen als Arbeitshilfe. Keine Gewaehr fuer steuerliche Korrektheit.
            Bitte pruefe alle Angaben mit deinem Steuerberater.
          </p>
        </div>
      </div>
    </div>
  );
}
