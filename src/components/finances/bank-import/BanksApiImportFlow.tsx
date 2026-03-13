import { useState, useEffect, useCallback } from 'react';
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

type FlowState = 'idle' | 'connecting' | 'redirecting' | 'connected' | 'account-selection';

async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${SUPABASE_URL}/functions/v1/banksapi-service/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Apikey: SUPABASE_ANON_KEY,
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

export default function BanksApiImportFlow() {
  const { user, session } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [connections, setConnections] = useState<BanksApiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BanksApiConnection | null>(null);
  const [products, setProducts] = useState<BanksApiBankProduct[]>([]);

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

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

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
      const callbackUrl = `${SUPABASE_URL}/functions/v1/banksapi-callback`;

      const res = await apiFetch('create-bank-access', token, {
        method: 'POST',
        body: JSON.stringify({ callbackUrl }),
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
      const callbackUrl = `${SUPABASE_URL}/functions/v1/banksapi-callback`;
      const res = await apiFetch(`refresh/${connectionId}`, token, {
        method: 'POST',
        body: JSON.stringify({ callbackUrl }),
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

  async function handleDisconnect(connectionId: string) {
    if (!token) return;
    if (!window.confirm('Möchten Sie diese Bankverbindung wirklich trennen?')) return;
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
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {activeConnections.map((conn) => (
          <BanksApiConnectionStatus
            key={conn.id}
            connection={conn}
            loading={actionLoading}
            onRefresh={() => handleRefresh(conn.id)}
            onDisconnect={() => handleDisconnect(conn.id)}
            onManageAccounts={() => handleOpenAccountSelection(conn)}
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
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
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
