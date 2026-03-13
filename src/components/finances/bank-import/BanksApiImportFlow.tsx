import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Landmark,
  Loader,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Unplug,
  Calendar,
  CreditCard,
  Info,
  ShieldCheck,
  ExternalLink,
  Download,
  Clock,
  ArrowDownToLine,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../ui/Button';
import BanksApiAccountSelection from './BanksApiAccountSelection';
import BanksApiConnectionStatus from './BanksApiConnectionStatus';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface BanksApiConnection {
  id: string;
  bank_access_id: string | null;
  bank_name: string;
  provider_id: string;
  status: 'connected' | 'requires_sca' | 'syncing' | 'error' | 'disconnected';
  error_message: string | null;
  last_sync_at: string | null;
  last_attempted_sync_at: string | null;
  last_issue_message: string | null;
  last_issue_code: string | null;
  consent_expires_at: string | null;
  selected_accounts: number;
  total_accounts: number;
  created_at: string;
  updated_at: string;
}

export interface BanksApiBankProduct {
  id: string;
  connection_id: string;
  bank_product_id: string;
  iban: string | null;
  account_name: string;
  account_type: string | null;
  balance_cents: number | null;
  balance_date: string | null;
  selected_for_import: boolean;
  import_from_date: string | null;
  last_import_at: string | null;
}

export interface BanksApiImportLog {
  id: string;
  connection_id: string;
  trigger_type: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_remote_transactions_seen: number;
  total_new_transactions_imported: number;
  total_duplicates_skipped: number;
  total_filtered_by_date: number;
  error_message: string | null;
}

export interface ImportResult {
  totalSeen: number;
  totalImported: number;
  totalDuplicates: number;
  totalFiltered: number;
  status: string;
  error?: string;
}

interface SyncProgress {
  phase: 'refreshing' | 'syncing_products' | 'importing' | 'done' | 'error';
  total_transactions: number;
  processed_transactions: number;
  imported_transactions: number;
  duplicate_transactions: number;
  current_account_name: string | null;
  current_account_index: number;
  total_accounts: number;
  started_at: string;
  updated_at: string;
  finished_at: string | null;
  error_message: string | null;
}

type FlowState = 'idle' | 'connecting' | 'redirecting' | 'connected' | 'account-selection';

async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    return await fetch(`${SUPABASE_URL}/functions/v1/banksapi-service/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Apikey: SUPABASE_ANON_KEY,
        ...(options.headers as Record<string, string> || {}),
      },
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function BanksApiImportFlow() {
  const { user, session } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [connections, setConnections] = useState<BanksApiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshingConnectionId, setRefreshingConnectionId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<BanksApiConnection | null>(null);
  const [products, setProducts] = useState<BanksApiBankProduct[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importLogs, setImportLogs] = useState<Record<string, BanksApiImportLog | null>>({});
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const cooldownRef = useRef<Record<string, number>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = session?.access_token || '';

  const loadConnections = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch('connections', token);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setConnections(data.connections || []);

      const activeConn = (data.connections || []).find(
        (c: BanksApiConnection) => c.status === 'connected' || c.status === 'syncing'
      );
      if (activeConn) {
        setFlowState('connected');
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadImportLogs = useCallback(async (connIds: string[]) => {
    if (!token || connIds.length === 0) return;
    try {
      const results: Record<string, BanksApiImportLog | null> = {};
      for (const connId of connIds) {
        const res = await apiFetch(`import-logs/${connId}`, token);
        if (res.ok) {
          const data = await res.json();
          const logs = data.logs || [];
          results[connId] = logs.length > 0 ? logs[0] : null;
        }
      }
      setImportLogs(results);
    } catch (err) {
      console.error('Failed to load import logs:', err);
    }
  }, [token]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const activeIds = connections
      .filter(c => c.status !== 'disconnected')
      .map(c => c.id);
    if (activeIds.length > 0) {
      loadImportLogs(activeIds);
    }
  }, [connections, loadImportLogs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('banksapi_status');
    if (status === 'success') {
      loadConnections();
      setFlowState('connected');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('banksapi_status');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (status === 'error') {
      setError('Die Bankverbindung konnte nicht hergestellt werden. Bitte versuchen Sie es erneut.');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('banksapi_status');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [loadConnections]);

  async function handleStartConnection() {
    if (!token) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch('create-bank-access', token, {
        method: 'POST',
        body: JSON.stringify({ origin: window.location.origin }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.action === 'redirect' && data.redirectUrl) {
        setFlowState('redirecting');
        window.location.href = data.redirectUrl;
        return;
      }

      await loadConnections();
      setFlowState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefresh(connectionId: string) {
    if (!token) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch(`refresh/${connectionId}`, token, {
        method: 'POST',
        body: JSON.stringify({ origin: window.location.origin }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.action === 'redirect' && data.redirectUrl) {
        setFlowState('redirecting');
        window.location.href = data.redirectUrl;
        return;
      }

      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen');
    } finally {
      setActionLoading(false);
    }
  }

  function stopProgressPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startProgressPolling(connectionId: string) {
    stopProgressPolling();
    let nullCount = 0;
    const poll = async () => {
      try {
        const res = await apiFetch(`sync-progress/${connectionId}`, token, {}, 8000);
        if (!res.ok) return;
        const data = await res.json();
        const p = data.progress as SyncProgress | null;
        if (p && p.phase !== 'done' && p.phase !== 'error') {
          nullCount = 0;
          setSyncProgress(p);
        } else if (p && (p.phase === 'done' || p.phase === 'error')) {
          stopProgressPolling();
          setRefreshingConnectionId(null);
          setSyncProgress(null);
          if (p.phase === 'error' && p.error_message) {
            setError(p.error_message);
          } else if (p.phase === 'done') {
            setImportResult({
              totalSeen: p.total_transactions,
              totalImported: p.imported_transactions,
              totalDuplicates: p.duplicate_transactions,
              totalFiltered: 0,
              status: 'success',
            });
          }
          await loadConnections();
          await loadImportLogs([connectionId]);
        } else {
          nullCount++;
          if (nullCount >= 5) {
            stopProgressPolling();
            setRefreshingConnectionId(null);
            setSyncProgress(null);
            await loadConnections();
          }
        }
      } catch (_) { /* retry next interval */ }
    };
    poll();
    pollRef.current = setInterval(poll, 2500);
  }

  useEffect(() => {
    return () => stopProgressPolling();
  }, []);

  useEffect(() => {
    if (!token) return;
    const syncingConn = connections.find(c => c.status === 'syncing');
    if (syncingConn && !refreshingConnectionId) {
      setRefreshingConnectionId(syncingConn.id);
      startProgressPolling(syncingConn.id);
    }
  }, [connections, token]);

  async function handleRefreshAndImport(connectionId: string) {
    if (!token) return;

    const now = Date.now();
    const lastCall = cooldownRef.current[connectionId] || 0;
    if (now - lastCall < 15000) {
      setError('Bitte warten Sie mindestens 15 Sekunden zwischen Aktualisierungen.');
      return;
    }
    cooldownRef.current[connectionId] = now;

    setError('');
    setImportResult(null);
    setSyncProgress(null);
    setRefreshingConnectionId(connectionId);

    try {
      const res = await apiFetch(`refresh-and-import/${connectionId}`, token, {
        method: 'POST',
        body: JSON.stringify({ origin: window.location.origin }),
      }, 25000);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      if (data?.action === 'redirect' && data.redirectUrl) {
        setFlowState('redirecting');
        window.location.href = data.redirectUrl;
        return;
      }

      if (data?.status === 'syncing') {
        startProgressPolling(connectionId);
        return;
      }

      await loadConnections();
      await loadImportLogs([connectionId]);
      setRefreshingConnectionId(null);
    } catch (err) {
      const isNetworkErr =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof TypeError && (err.message === 'Load failed' || err.message === 'Failed to fetch'));

      if (isNetworkErr) {
        startProgressPolling(connectionId);
        return;
      }

      setError(err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen');
      setRefreshingConnectionId(null);
      await loadConnections();
    }
  }

  async function handleConsentRenewal(connectionId: string) {
    if (!token) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch(`consent-renewal/${connectionId}`, token, {
        method: 'POST',
        body: JSON.stringify({ origin: window.location.origin }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.action === 'redirect' && data.redirectUrl) {
        setFlowState('redirecting');
        window.location.href = data.redirectUrl;
        return;
      }

      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bankfreigabe konnte nicht erneuert werden');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!token) return;
    if (!window.confirm('Moechten Sie diese Bankverbindung wirklich trennen?')) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch(`disconnect/${connectionId}`, token, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      setFlowState('idle');
      setSelectedConnection(null);
      setProducts([]);
      setImportResult(null);
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trennung fehlgeschlagen');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOpenAccountSelection(conn: BanksApiConnection) {
    if (!token) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch(`products/${conn.id}`, token);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setProducts(data.products || []);
      setSelectedConnection(conn);
      setFlowState('account-selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konten konnten nicht geladen werden');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveSelection(
    selections: Array<{ productId: string; selected: boolean; importFromDate: string | null }>
  ) {
    if (!token || !selectedConnection) return;
    setError('');
    setActionLoading(true);

    try {
      const res = await apiFetch('save-selection', token, {
        method: 'POST',
        body: JSON.stringify({
          connectionId: selectedConnection.id,
          selections,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      setFlowState('connected');
      setSelectedConnection(null);
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 text-[#3c8af7] mx-auto mb-3 animate-spin" />
        <p className="text-sm text-gray-500">Bankverbindungen werden geladen...</p>
      </div>
    );
  }

  if (flowState === 'redirecting') {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 text-[#3c8af7] mx-auto mb-3 animate-spin" />
        <p className="text-sm font-medium text-dark mb-1">Weiterleitung zur Bank...</p>
        <p className="text-xs text-gray-400">
          Sie werden zur Seite Ihrer Bank weitergeleitet, um die Freigabe zu erteilen.
        </p>
      </div>
    );
  }

  if (flowState === 'account-selection' && selectedConnection) {
    return (
      <BanksApiAccountSelection
        connection={selectedConnection}
        products={products}
        saving={actionLoading}
        onSave={handleSaveSelection}
        onCancel={() => {
          setFlowState('connected');
          setSelectedConnection(null);
        }}
        error={error}
      />
    );
  }

  const activeConnections = connections.filter(c => c.status !== 'disconnected');
  const hasActiveConnection = activeConnections.some(c => c.status === 'connected' || c.status === 'syncing');

  if (hasActiveConnection || flowState === 'connected') {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Fehler bei der Bankverbindung</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {refreshingConnectionId && syncProgress && (
          <SyncProgressBar progress={syncProgress} />
        )}

        {refreshingConnectionId && !syncProgress && (
          <div className="border border-[#3c8af7]/20 bg-[#3c8af7]/5 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 text-[#3c8af7] animate-spin flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">
                Bankdaten werden aktualisiert...
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Die Synchronisierung laeuft im Hintergrund. Fortschritt wird gleich angezeigt.
            </p>
          </div>
        )}

        {importResult && !refreshingConnectionId && (
          <ImportResultBanner result={importResult} onDismiss={() => setImportResult(null)} />
        )}

        {activeConnections.map((conn) => (
          <BanksApiConnectionStatus
            key={conn.id}
            connection={conn}
            loading={actionLoading || refreshingConnectionId === conn.id}
            refreshing={refreshingConnectionId === conn.id}
            lastImportLog={importLogs[conn.id] || null}
            onRefresh={() => handleRefresh(conn.id)}
            onDisconnect={() => handleDisconnect(conn.id)}
            onManageAccounts={() => handleOpenAccountSelection(conn)}
            onRefreshAndImport={() => handleRefreshAndImport(conn.id)}
            onConsentRenewal={() => handleConsentRenewal(conn.id)}
          />
        ))}

        <div className="flex items-center justify-center pt-2">
          <button
            onClick={handleStartConnection}
            disabled={actionLoading}
            className="text-sm text-[#3c8af7] hover:text-[#3579de] font-medium transition-colors"
          >
            + Weitere Bankverbindung hinzufuegen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Landmark className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-dark mb-2">
          Bankimport (BanksAPI / PSD2)
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
          Verbinden Sie Ihr Bankkonto direkt ueber die PSD2-Schnittstelle.
          Ihre Kontobewegungen werden sicher und automatisch abgerufen &ndash; ohne manuellen Datei-Upload.
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            PSD2-konform
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Bankgeheimnis geschuetzt
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Nur Lesezugriff
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Fehler bei der Bankverbindung</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {activeConnections.some(c => c.status === 'requires_sca') && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 max-w-md mx-auto">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Eine Bankfreigabe ist ausstehend. Bitte erneut versuchen.
            </p>
          </div>
        )}

        {activeConnections.some(c => c.status === 'error') && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Es gab einen Fehler bei der letzten Bankverbindung. Bitte erneut versuchen.
            </p>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleStartConnection}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Verbinde...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Bankfreigabe erteilen
            </>
          )}
        </Button>
      </div>

      <div
        style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
        className="border rounded-lg p-4"
      >
        <p className="text-sm font-medium text-emerald-900 mb-1">So funktioniert es:</p>
        <ol className="text-sm text-emerald-800 space-y-1 list-decimal list-inside">
          <li>Klicken Sie auf &quot;Bankfreigabe erteilen&quot;</li>
          <li>Sie werden zur Seite Ihrer Bank weitergeleitet</li>
          <li>Autorisieren Sie den Lesezugriff (TAN/Freigabe)</li>
          <li>Waehlen Sie die Konten aus, die importiert werden sollen</li>
        </ol>
      </div>
    </div>
  );
}

function SyncProgressBar({ progress }: { progress: SyncProgress }) {
  const { phase, total_transactions, processed_transactions, imported_transactions, duplicate_transactions, current_account_name, current_account_index, total_accounts, started_at } = progress;

  const pct = total_transactions > 0
    ? Math.min(Math.round((processed_transactions / total_transactions) * 100), 100)
    : 0;

  const elapsedSec = (Date.now() - new Date(started_at).getTime()) / 1000;
  let etaLabel = '';
  if (phase === 'importing' && processed_transactions > 0 && processed_transactions < total_transactions) {
    const rate = processed_transactions / elapsedSec;
    const remaining = (total_transactions - processed_transactions) / rate;
    if (remaining < 60) {
      etaLabel = `~${Math.ceil(remaining)} Sek. verbleibend`;
    } else {
      etaLabel = `~${Math.ceil(remaining / 60)} Min. verbleibend`;
    }
  }

  const phaseLabels: Record<string, string> = {
    refreshing: 'Bankdaten werden aktualisiert...',
    syncing_products: 'Konten werden synchronisiert...',
    importing: 'Transaktionen werden importiert...',
    done: 'Abgeschlossen',
    error: 'Fehler',
  };

  return (
    <div className="border border-[#3c8af7]/20 bg-[#3c8af7]/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader className="w-4 h-4 text-[#3c8af7] animate-spin flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800">
          {phaseLabels[phase] || 'Synchronisierung...'}
        </span>
      </div>

      {phase === 'importing' && total_transactions > 0 && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-[#3c8af7] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {processed_transactions} / {total_transactions} Transaktionen
            </span>
            {etaLabel && <span>{etaLabel}</span>}
          </div>
        </>
      )}

      {phase === 'importing' && total_transactions === 0 && (
        <p className="text-xs text-gray-500">Transaktionen werden von der Bank abgerufen...</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {total_accounts > 0 && (
          <span className="text-xs text-gray-500">
            Konto {current_account_index}/{total_accounts}
            {current_account_name ? `: ${current_account_name}` : ''}
          </span>
        )}
        {imported_transactions > 0 && (
          <span className="text-xs text-emerald-600 font-medium">
            {imported_transactions} neu importiert
          </span>
        )}
        {duplicate_transactions > 0 && (
          <span className="text-xs text-gray-400">
            {duplicate_transactions} Duplikate
          </span>
        )}
      </div>
    </div>
  );
}

function ImportResultBanner({
  result,
  onDismiss,
}: {
  result: ImportResult;
  onDismiss: () => void;
}) {
  const isSuccess = result.status === 'success' || result.status === 'partial';
  const isError = result.status === 'failed';

  return (
    <div
      className={`border rounded-lg p-4 ${
        isError
          ? 'bg-red-50 border-red-200'
          : isSuccess && result.totalImported > 0
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          ) : result.totalImported > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${
              isError ? 'text-red-800' : result.totalImported > 0 ? 'text-emerald-800' : 'text-blue-800'
            }`}>
              {isError
                ? 'Import fehlgeschlagen'
                : result.totalImported > 0
                ? `${result.totalImported} neue Transaktionen importiert`
                : 'Keine neuen Transaktionen'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-xs text-gray-500">
                {result.totalSeen} Transaktionen abgerufen
              </span>
              {result.totalDuplicates > 0 && (
                <span className="text-xs text-gray-500">
                  {result.totalDuplicates} Duplikate uebersprungen
                </span>
              )}
              {result.totalFiltered > 0 && (
                <span className="text-xs text-gray-500">
                  {result.totalFiltered} nach Datum gefiltert
                </span>
              )}
            </div>
            {result.error && (
              <p className="text-xs text-red-600 mt-1">{result.error}</p>
            )}
            {result.status === 'partial' && (
              <p className="text-xs text-amber-600 mt-1">
                Einige Konten konnten nicht vollstaendig importiert werden.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors flex-shrink-0"
        >
          <span className="sr-only">Schliessen</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
