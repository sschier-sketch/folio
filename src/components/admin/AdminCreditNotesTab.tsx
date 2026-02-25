import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  ReceiptText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface StripeCreditNote {
  id: string;
  stripe_credit_note_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string | null;
  stripe_refund_id: string | null;
  number: string | null;
  status: string;
  currency: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  reason: string | null;
  memo: string | null;
  created_at_stripe: string;
  customer_email: string | null;
  customer_name: string | null;
  pdf_storage_path: string | null;
  pdf_cached_at: string | null;
}

type CnStatusFilter = 'all' | 'issued' | 'void';

const CN_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  issued: { label: 'Ausgestellt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  void: { label: 'Storniert', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

interface AdminCreditNotesTabProps {
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
}

export default function AdminCreditNotesTab({ dateRange, onDateRangeChange }: AdminCreditNotesTabProps) {
  const [creditNotes, setCreditNotes] = useState<StripeCreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CnStatusFilter>('all');
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const loadCreditNotes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stripe_credit_notes')
        .select('*')
        .gte('created_at_stripe', `${dateRange.from}T00:00:00Z`)
        .lte('created_at_stripe', `${dateRange.to}T23:59:59Z`)
        .order('created_at_stripe', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error loading credit notes:', error);
        return;
      }
      setCreditNotes(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  const filteredNotes = creditNotes.filter((cn) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cn.number ?? '').toLowerCase().includes(q) ||
      (cn.customer_email ?? '').toLowerCase().includes(q) ||
      (cn.customer_name ?? '').toLowerCase().includes(q) ||
      cn.stripe_credit_note_id.toLowerCase().includes(q) ||
      (cn.stripe_invoice_id ?? '').toLowerCase().includes(q)
    );
  });

  const statusCounts = creditNotes.reduce<Record<string, number>>((acc, cn) => {
    acc[cn.status] = (acc[cn.status] || 0) + 1;
    return acc;
  }, {});

  const totalCredited = creditNotes
    .filter((cn) => cn.status === 'issued')
    .reduce((sum, cn) => sum + cn.total, 0);

  async function handleExportZip() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-credit-notes-zip?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Export fehlgeschlagen');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gutschriften_${dateRange.from}_bis_${dateRange.to}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export-Fehler: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleOpenPdf(cn: StripeCreditNote) {
    if (!cn.pdf_storage_path) {
      alert('Kein PDF verfuegbar');
      return;
    }

    setPdfLoading(cn.stripe_credit_note_id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-credit-note-pdf?credit_note_id=${cn.stripe_credit_note_id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'PDF konnte nicht geladen werden');
        return;
      }

      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setPdfLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<ReceiptText className="w-5 h-5 text-blue-600" />}
          value={creditNotes.length}
          label="Gutschriften gesamt"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          value={statusCounts['issued'] ?? 0}
          label="Ausgestellt"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<ReceiptText className="w-5 h-5 text-red-500" />}
          value={totalCredited > 0 ? formatCents(totalCredited, 'eur') : '0,00 \u20AC'}
          label="Gutgeschrieben"
          bg="bg-red-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-800">Gutschriften (Credit Notes)</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportZip}
              disabled={exporting || filteredNotes.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              ZIP Export
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">bis</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Nummer, E-Mail, Kunde..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {([
              { key: 'all', label: 'Alle' },
              { key: 'issued', label: 'Ausgestellt' },
              { key: 'void', label: 'Storniert' },
            ] as { key: CnStatusFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
                {key !== 'all' && statusCounts[key] !== undefined && (
                  <span className={`ml-1.5 text-xs ${statusFilter === key ? 'text-gray-300' : 'text-gray-400'}`}>
                    {statusCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Keine Gutschriften gefunden</p>
            <p className="text-xs text-gray-300 mt-1">
              Gutschriften werden automatisch bei Rueckerstattungen erstellt.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Datum</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Nummer</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Kunde</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Bezug (Invoice)</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Betrag</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">PDF</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Archiv</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredNotes.map((cn) => {
                  const cfg = CN_STATUS_CONFIG[cn.status] ?? CN_STATUS_CONFIG['issued'];
                  return (
                    <tr key={cn.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {new Date(cn.created_at_stripe).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono text-gray-800">{cn.number || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-800">{cn.customer_name || '-'}</div>
                        {cn.customer_email && (
                          <div className="text-xs text-gray-400">{cn.customer_email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-gray-400">{cn.stripe_invoice_id || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-red-600 text-right font-semibold font-mono">
                        -{formatCents(cn.total, cn.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {cn.pdf_storage_path ? (
                          <button
                            onClick={() => handleOpenPdf(cn)}
                            disabled={pdfLoading === cn.stripe_credit_note_id}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm disabled:opacity-50"
                            title="PDF oeffnen"
                          >
                            {pdfLoading === cn.stripe_credit_note_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {cn.pdf_storage_path ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600" title={`Archiviert: ${cn.pdf_cached_at ? new Date(cn.pdf_cached_at).toLocaleDateString('de-DE') : ''}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-gray-300" title="Nicht archiviert">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredNotes.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{filteredNotes.length} Gutschrift{filteredNotes.length !== 1 ? 'en' : ''}</span>
            <span>
              {filteredNotes.filter((cn) => cn.pdf_storage_path).length} / {filteredNotes.length} PDFs archiviert
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, bg }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
