import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  ReceiptText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import AdminCreditNotesTab from './AdminCreditNotesTab';

interface StripeInvoice {
  id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string | null;
  invoice_number: string | null;
  status: string;
  currency: string;
  total: number;
  tax: number | null;
  subtotal: number | null;
  created_at_stripe: string;
  period_start: string | null;
  period_end: string | null;
  customer_email: string | null;
  customer_name: string | null;
  hosted_invoice_url: string | null;
  pdf_storage_path: string | null;
  pdf_cached_at: string | null;
}

type StatusFilter = 'all' | 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';
type ActiveTab = 'invoices' | 'credit_notes';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paid: { label: 'Bezahlt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  open: { label: 'Offen', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  draft: { label: 'Entwurf', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: <FileText className="w-3 h-3" /> },
  void: { label: 'Storniert', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
  uncollectible: { label: 'Uneinbringlich', color: 'bg-red-50 text-red-600 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function AdminInvoicesView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stripe_invoices')
        .select('*')
        .gte('created_at_stripe', `${dateRange.from}T00:00:00Z`)
        .lte('created_at_stripe', `${dateRange.to}T23:59:59Z`)
        .order('created_at_stripe', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error loading invoices:', error);
        return;
      }
      setInvoices(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices();
    }
  }, [loadInvoices, activeTab]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (inv.invoice_number ?? '').toLowerCase().includes(q) ||
      (inv.customer_email ?? '').toLowerCase().includes(q) ||
      (inv.customer_name ?? '').toLowerCase().includes(q) ||
      inv.stripe_invoice_id.toLowerCase().includes(q)
    );
  });

  const statusCounts = invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  async function handleSync() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stripe-invoices`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source: 'admin' }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        alert(`Sync-Fehler: ${result.error}`);
      } else {
        const parts = [`${result.synced} Rechnungen`, `${result.pdfs_cached} PDFs`];
        if (result.credit_notes_synced !== undefined) {
          parts.push(`${result.credit_notes_synced} Gutschriften`);
        }
        if (result.credit_notes_pdfs_cached !== undefined) {
          parts.push(`${result.credit_notes_pdfs_cached} Gutschrift-PDFs`);
        }
        alert(`Sync abgeschlossen: ${parts.join(', ')} synchronisiert.`);
        if (activeTab === 'invoices') {
          await loadInvoices();
        }
      }
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-invoices-zip?${params}`,
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
      a.download = `Rechnungen_${dateRange.from}_bis_${dateRange.to}.zip`;
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

  async function handleOpenPdf(invoice: StripeInvoice) {
    if (!invoice.pdf_storage_path && !invoice.hosted_invoice_url) {
      alert('Kein PDF verfuegbar');
      return;
    }

    setPdfLoading(invoice.stripe_invoice_id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-invoice-pdf?invoice_id=${invoice.stripe_invoice_id}`,
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
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Rechnungen
        </button>
        <button
          onClick={() => setActiveTab('credit_notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'credit_notes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          Gutschriften
        </button>
      </div>

      {activeTab === 'credit_notes' ? (
        <AdminCreditNotesTab dateRange={dateRange} onDateRangeChange={setDateRange} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              value={invoices.length}
              label="Rechnungen gesamt"
              bg="bg-blue-50"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              value={statusCounts['paid'] ?? 0}
              label="Bezahlt"
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              value={statusCounts['open'] ?? 0}
              label="Offen"
              bg="bg-amber-50"
            />
            <StatCard
              icon={<Archive className="w-5 h-5 text-green-600" />}
              value={totalRevenue > 0 ? formatCents(totalRevenue, 'eur') : '0,00 \u20AC'}
              label="Umsatz (bezahlt)"
              bg="bg-green-50"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-base font-semibold text-gray-800">Stripe Rechnungen</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sync
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportZip}
                    disabled={exporting || filteredInvoices.length === 0}
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    ZIP Export
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">bis</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
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
                  { key: 'paid', label: 'Bezahlt' },
                  { key: 'open', label: 'Offen' },
                  { key: 'draft', label: 'Entwurf' },
                  { key: 'void', label: 'Storniert' },
                  { key: 'uncollectible', label: 'Uneinbringlich' },
                ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
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
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Keine Rechnungen gefunden</p>
                <p className="text-xs text-gray-300 mt-1">
                  Passen Sie den Zeitraum oder die Filter an, oder starten Sie einen Sync.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Datum</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Rechnungsnr.</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Kunde</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Netto</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Steuer</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Brutto</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">PDF</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Archiv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv) => {
                      const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['draft'];
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 text-sm text-gray-600">
                            {new Date(inv.created_at_stripe).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-mono text-gray-800">{inv.invoice_number || '-'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-gray-800">{inv.customer_name || '-'}</div>
                            {inv.customer_email && (
                              <div className="text-xs text-gray-400">{inv.customer_email}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600 text-right font-mono">
                            {inv.subtotal !== null ? formatCents(inv.subtotal, inv.currency) : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600 text-right font-mono">
                            {inv.tax !== null ? formatCents(inv.tax, inv.currency) : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-800 text-right font-semibold font-mono">
                            {formatCents(inv.total, inv.currency)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {(inv.pdf_storage_path || inv.hosted_invoice_url) ? (
                              <button
                                onClick={() => handleOpenPdf(inv)}
                                disabled={pdfLoading === inv.stripe_invoice_id}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm disabled:opacity-50"
                                title="PDF oeffnen"
                              >
                                {pdfLoading === inv.stripe_invoice_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : inv.pdf_storage_path ? (
                                  <FileText className="w-4 h-4" />
                                ) : (
                                  <ExternalLink className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {inv.pdf_storage_path ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600" title={`Archiviert: ${inv.pdf_cached_at ? new Date(inv.pdf_cached_at).toLocaleDateString('de-DE') : ''}`}>
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

            {!loading && filteredInvoices.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{filteredInvoices.length} Rechnung{filteredInvoices.length !== 1 ? 'en' : ''}</span>
                <span>
                  {filteredInvoices.filter((i) => i.pdf_storage_path).length} / {filteredInvoices.length} PDFs archiviert
                </span>
              </div>
            )}
          </div>
        </>
      )}
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
