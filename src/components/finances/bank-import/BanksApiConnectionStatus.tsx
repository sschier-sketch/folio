import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Unplug,
  Loader,
  Settings,
  Landmark,
  Clock,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { BanksApiConnection } from './BanksApiImportFlow';

interface Props {
  connection: BanksApiConnection;
  loading: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
  onManageAccounts: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle2 }
> = {
  connected: {
    label: 'Verbunden',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  syncing: {
    label: 'Synchronisierung...',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Loader,
  },
  requires_sca: {
    label: 'Freigabe erforderlich',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle,
  },
  error: {
    label: 'Fehler',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
  },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Nie';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BanksApiConnectionStatus({
  connection,
  loading,
  onRefresh,
  onDisconnect,
  onManageAccounts,
}: Props) {
  const config = STATUS_CONFIG[connection.status] || STATUS_CONFIG.error;
  const StatusIcon = config.icon;

  return (
    <div className={`border rounded-lg overflow-hidden ${config.borderColor}`}>
      <div className={`${config.bgColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center">
            <Landmark className="w-4.5 h-4.5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark">
              {connection.bank_name || 'Bankverbindung'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusIcon className={`w-3 h-3 ${config.color} ${
                connection.status === 'syncing' ? 'animate-spin' : ''
              }`} />
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onManageAccounts}
            disabled={loading || connection.status !== 'connected'}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors disabled:opacity-40"
            title="Konten verwalten"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors disabled:opacity-40"
            title="Verbindung aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-white/60 transition-colors disabled:opacity-40"
            title="Verbindung trennen"
          >
            <Unplug className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Letzte Synchronisierung</p>
              <p className="text-xs font-medium text-dark">
                {formatDateTime(connection.last_sync_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Verbunden seit</p>
              <p className="text-xs font-medium text-dark">
                {formatDateTime(connection.created_at)}
              </p>
            </div>
          </div>
        </div>

        {connection.error_message && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{connection.error_message}</p>
          </div>
        )}

        {connection.status === 'requires_sca' && (
          <div className="mt-3">
            <Button variant="warning" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Erneut freigeben
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
