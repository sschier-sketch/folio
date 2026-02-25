import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  ChevronDown,
  X,
  Receipt,
  Banknote,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  getAnlageVSummary,
  type AnlageVSummary,
  type AnlageVIncomeRow,
  type AnlageVExpenseRow,
} from '../../lib/anlageVService';
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

export default function AnlageVView() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 1;

  const [year, setYear] = useState(defaultYear);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [ownershipShare, setOwnershipShare] = useState(100);
  const [summary, setSummary] = useState<AnlageVSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const yearOptions = useMemo(() => {
    const yrs: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) yrs.push(y);
    return yrs;
  }, [currentYear]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingProps(true);
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, address')
        .eq('user_id', user.id)
        .order('name');
      setProperties(props || []);
      const { data: unitData } = await supabase
        .from('property_units')
        .select('id, property_id, unit_number')
        .eq('user_id', user.id)
        .order('unit_number');
      setUnits(unitData || []);
      if (props && props.length > 0) setSelectedPropertyId(props[0].id);
      setLoadingProps(false);
    })();
  }, [user]);

  const calculate = useCallback(async () => {
    if (!user || !selectedPropertyId) return;
    setLoading(true);
    setError('');
    setSummary(null);
    const { data, error: err } = await getAnlageVSummary(user.id, year, 'property', selectedPropertyId, ownershipShare);
    if (err) setError(err);
    else setSummary(data);
    setLoading(false);
  }, [user, year, selectedPropertyId, ownershipShare]);

  useEffect(() => {
    if (selectedPropertyId && user) calculate();
  }, [selectedPropertyId, year, ownershipShare]);

  async function handleExportPdf() {
    if (!summary) return;
    setExporting(true);
    setShowExportMenu(false);
    try { await generateAnlageVPdf(summary); } catch (err) { console.error(err); }
    finally { setExporting(false); }
  }

  function handleExportCsv(type: 'incomes' | 'expenses') {
    if (!summary) return;
    setShowExportMenu(false);
    exportAnlageVCsv(summary, type);
  }

  if (loadingProps) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark">Steuerubersicht</h2>
          <p className="text-sm text-gray-400 mt-0.5">Einkunfte aus Vermietung und Verpachtung</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-[42px] px-4 pr-8 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="relative">
            <Button
              variant="outlined"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!summary || exporting}
            >
              {exporting
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Exportiere...</>
                : <><Download className="w-4 h-4 mr-1.5" />Export</>
              }
            </Button>
            {showExportMenu && summary && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1 animate-fade-in">
                  <button onClick={handleExportPdf} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-gray-400" />PDF Ubersicht
                  </button>
                  <button onClick={() => handleExportCsv('incomes')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-gray-400" />CSV Einnahmen
                  </button>
                  <button onClick={() => handleExportCsv('expenses')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                    <TrendingDown className="w-4 h-4 text-gray-400" />CSV Ausgaben
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 rounded-lg border border-amber-200 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Hinweis: rentably ersetzt keine Steuerberatung. Prufe die Angaben vor Abgabe und besprich sie mit deinem Steuerberater.
        </p>
      </div>

      <div className="flex gap-6">
        <Sidebar
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onSelect={(id) => setSelectedPropertyId(id)}
          ownershipShare={ownershipShare}
          onOwnershipShareChange={setOwnershipShare}
          summary={summary}
          loading={loading}
          onExportPdf={handleExportPdf}
          exporting={exporting}
        />
        <MainPanel summary={summary} loading={loading} error={error} />
      </div>
    </div>
  );
}

function Sidebar({
  properties, selectedPropertyId, onSelect, ownershipShare, onOwnershipShareChange, summary, loading, onExportPdf, exporting,
}: {
  properties: Property[];
  selectedPropertyId: string;
  onSelect: (id: string) => void;
  ownershipShare: number;
  onOwnershipShareChange: (v: number) => void;
  summary: AnlageVSummary | null;
  loading: boolean;
  onExportPdf: () => void;
  exporting: boolean;
}) {
  const selected = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="w-[340px] flex-shrink-0 space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Immobilie</p>
        {selected ? (
          <div className="flex items-center gap-3 p-3.5 bg-white rounded-lg border border-gray-200">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4.5 h-4.5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-dark truncate">{selected.name}</p>
              <p className="text-xs text-gray-400 truncate">{selected.address}</p>
            </div>
            {properties.length > 1 && (
              <div className="relative group">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => onSelect(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            )}
          </div>
        ) : (
          <select
            value={selectedPropertyId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="">Immobilie wahlen</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Eigentumsanteil</p>
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
          <input
            type="number"
            min={1}
            max={100}
            value={ownershipShare}
            onChange={(e) => {
              const v = Math.min(100, Math.max(1, Number(e.target.value) || 1));
              onOwnershipShareChange(v);
            }}
            className="w-16 text-sm font-semibold text-dark text-center border border-gray-200 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <span className="text-sm text-gray-500">%</span>
          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={100}
              value={ownershipShare}
              onChange={(e) => onOwnershipShareChange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-blue"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onExportPdf}
        disabled={!summary || exporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4 text-gray-500" />
        }
        Anlage V exportieren
      </button>

      {loading && !summary && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
            <div className="h-5 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}

      {summary && (
        <>
          <SidebarKeyfacts summary={summary} />
          <SidebarReceipts summary={summary} />
        </>
      )}
    </div>
  );
}

function SidebarKeyfacts({ summary }: { summary: AnlageVSummary }) {
  const isLoss = summary.result_total < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Ergebnis{summary.ownership_share < 100 ? ` (${summary.ownership_share}%)` : ''}
        </p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isLoss ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isLoss ? 'Verlust' : 'Uberschuss'}
        </span>
      </div>
      <p className={`text-xl font-bold ${isLoss ? 'text-red-600' : 'text-emerald-700'}`}>
        {fmtEur(summary.result_total)}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
        <MiniKpi label="Einnahmen" value={fmtEur(summary.income_total)} color="text-dark" />
        <MiniKpi label="Werbungskosten" value={`-${fmtEur(summary.expense_total)}`} color="text-dark" />
        <MiniKpi label="AfA" value="0 EUR" color="text-gray-300" tooltip="Kommt in Phase 2" />
      </div>
    </div>
  );
}

function MiniKpi({ label, value, color, tooltip }: { label: string; value: string; color: string; tooltip?: string }) {
  return (
    <div className="text-center relative group">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${color}`}>{value}</p>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function SidebarReceipts({ summary }: { summary: AnlageVSummary }) {
  if (summary.total_expenses_count === 0) return null;
  const attached = summary.total_expenses_count - summary.missing_receipts_count;
  const pct = Math.round((attached / summary.total_expenses_count) * 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Belege</p>
        <p className="text-xs text-gray-500 font-medium">{attached}/{summary.total_expenses_count}</p>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-primary-blue'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {summary.missing_receipts_count > 0 && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <Receipt className="w-3 h-3" />
          {summary.missing_receipts_count} Ausgabe{summary.missing_receipts_count > 1 ? 'n' : ''} ohne Beleg
        </p>
      )}
    </div>
  );
}

function MainPanel({ summary, loading, error }: {
  summary: AnlageVSummary | null;
  loading: boolean;
  error: string;
}) {
  if (error) {
    return (
      <div className="flex-1">
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 p-10 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="h-3 bg-gray-100 rounded w-40 mb-4" />
            <div className="h-10 bg-gray-100 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
          <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col items-center"><div className="h-8 w-8 bg-gray-100 rounded mb-2" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
            <div className="flex flex-col items-center"><div className="h-8 w-8 bg-gray-100 rounded mb-2" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
            <div className="flex flex-col items-center"><div className="h-8 w-8 bg-gray-100 rounded mb-2" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
            <div className="flex justify-between"><div className="h-4 bg-gray-100 rounded w-28" /><div className="h-4 bg-gray-100 rounded w-16" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-gray-100 min-h-[400px]">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">Wahle eine Immobilie aus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <HeroCard summary={summary} />
      <IncomeAccordion summary={summary} />
      <ExpenseAccordion summary={summary} />
      <AfaAccordion />
    </div>
  );
}

function HeroCard({ summary }: { summary: AnlageVSummary }) {
  const isLoss = summary.result_total < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100 px-8 py-8">
      <div className="flex flex-col items-center text-center">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Einkunfte aus V+V
        </p>
        <div className="flex items-center gap-2">
          {isLoss && <TrendingDown className="w-6 h-6 text-red-500" />}
          {!isLoss && summary.result_total > 0 && <TrendingUp className="w-6 h-6 text-emerald-500" />}
          <p className={`text-4xl font-extrabold tracking-tight ${isLoss ? 'text-red-600' : 'text-emerald-700'}`}>
            {fmtEur(summary.result_total)}
          </p>
        </div>
        <p className={`text-sm font-medium mt-1 ${isLoss ? 'text-red-400' : 'text-emerald-500'}`}>
          {isLoss ? 'Verlust' : 'Uberschuss'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-100">
        <HeroKpi
          icon={<Banknote className="w-5 h-5 text-gray-400" />}
          label="Mieteinnahmen"
          value={fmtEur(summary.income_total)}
        />
        <HeroKpi
          icon={<Receipt className="w-5 h-5 text-gray-400" />}
          label="Werbungskosten"
          value={`-${fmtEur(summary.expense_total)}`}
        />
        <HeroKpi
          icon={<Lock className="w-4.5 h-4.5 text-gray-300" />}
          label="AfA"
          value="-0 EUR"
          muted
        />
      </div>
    </div>
  );
}

function HeroKpi({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${muted ? 'bg-gray-50' : 'bg-gray-100'}`}>
        {icon}
      </div>
      <p className={`text-[11px] mb-0.5 ${muted ? 'text-gray-300' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm font-bold ${muted ? 'text-gray-300' : 'text-dark'}`}>{value}</p>
    </div>
  );
}

function IncomeAccordion({ summary }: { summary: AnlageVSummary }) {
  const [open, setOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const { income_breakdown: bd } = summary;

  const rows: { label: string; amount: number }[] = [];
  if (bd.rent > 0) rows.push({ label: 'Kaltmiete', amount: bd.rent });
  if (bd.nk_prepay > 0) rows.push({ label: 'Nebenkosten-Vorauszahlungen', amount: bd.nk_prepay });
  if (bd.other > 0) rows.push({ label: 'Sonstige Einnahmen', amount: bd.other });
  if (rows.length === 0 && summary.income_total === 0) {
    rows.push({ label: 'Kaltmiete', amount: 0 });
    rows.push({ label: 'Nebenkosten-Vorauszahlungen', amount: 0 });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="text-sm font-semibold text-dark">Einnahmen</span>
        </div>
        <span className="text-sm font-bold text-dark">{fmtEur(summary.income_total)}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-b-0">
              <span className="text-sm text-gray-600 pl-6">{r.label}</span>
              <span className="text-sm text-gray-700 font-medium">{fmtEur(r.amount)}</span>
            </div>
          ))}
          {summary.incomes.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary-blue hover:underline flex items-center gap-1"
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                {showDetails ? 'Details ausblenden' : `${summary.incomes.length} Einzelposten anzeigen`}
              </button>
              {showDetails && <DetailTable rows={summary.incomes} type="income" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpenseAccordion({ summary }: { summary: AnlageVSummary }) {
  const [open, setOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const bd = summary.expense_breakdown;

  const groups: { label: string; amount: number }[] = [
    { label: 'Grundsteuer', amount: bd.grundsteuer },
    { label: 'Versicherungen', amount: bd.versicherungen },
    { label: 'Verwaltungskosten', amount: bd.verwaltung },
    { label: 'Instandhaltung / Reparatur', amount: bd.reparaturen },
    { label: 'Schuldzinsen', amount: bd.zinsen },
    { label: 'Betriebskosten', amount: bd.betriebskosten },
    { label: 'Fahrtkosten', amount: bd.fahrtkosten },
    { label: 'Sonstiges', amount: bd.sonstiges },
  ].filter(g => g.amount > 0);

  if (groups.length === 0 && summary.expense_total === 0) {
    groups.push(
      { label: 'Grundsteuer', amount: 0 },
      { label: 'Versicherungen', amount: 0 },
      { label: 'Verwaltungskosten', amount: 0 },
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="text-sm font-semibold text-dark">Werbungskosten</span>
        </div>
        <span className="text-sm font-bold text-dark">-{fmtEur(summary.expense_total)}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {groups.map((g, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-b-0">
              <span className="text-sm text-gray-600 pl-6">{g.label}</span>
              <span className="text-sm text-gray-700 font-medium">{fmtEur(g.amount)}</span>
            </div>
          ))}
          {summary.expenses.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-primary-blue hover:underline flex items-center gap-1"
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                {showDetails ? 'Details ausblenden' : `${summary.expenses.length} Einzelposten anzeigen`}
              </button>
              {showDetails && <DetailTable rows={summary.expenses} type="expense" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AfaAccordion() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden opacity-60">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-semibold text-gray-400">Absetzung fur Abnutzung (AfA)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
            Kommt in Phase 2
          </span>
          <span className="text-sm font-bold text-gray-300">0 EUR</span>
        </div>
      </div>
    </div>
  );
}

function DetailTable({ rows, type }: { rows: AnlageVIncomeRow[] | AnlageVExpenseRow[]; type: 'income' | 'expense' }) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className={`text-xs ${type === 'income' ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
            <th className="text-left px-3 py-2 font-medium text-gray-500">Datum</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500">Betrag</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500">
              {type === 'income' ? 'Quelle' : 'Kategorie'}
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-500">
              {type === 'income' ? 'Mieter' : 'Empfanger'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={row.id || i} className="border-t border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2 text-xs text-gray-600">{fmtDate(row.date)}</td>
              <td className={`px-3 py-2 text-xs text-right font-medium ${type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmtEur(row.amount)}
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {type === 'income' ? row.source_type : row.category}
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {type === 'income' ? (row.tenant_name || '-') : (row.vendor || '-')}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t border-gray-200 ${type === 'income' ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
            <td className="px-3 py-2 text-xs font-semibold text-dark">Gesamt</td>
            <td className={`px-3 py-2 text-xs text-right font-bold ${type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
              {fmtEur(rows.reduce((s: number, r: any) => s + r.amount, 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function fmtDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('de-DE');
}
