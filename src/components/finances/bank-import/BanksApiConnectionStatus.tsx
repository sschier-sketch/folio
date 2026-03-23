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
  ArrowDownToLine,
  ShieldAlert,
  CreditCard,
  Info,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { BanksApiConnection, BanksApiImportLog, BanksApiAccountSummary } from './BanksApiImportFlow';

interface Props {
  connection: BanksApiConnection;
  loading: boolean;
  refreshing?: boolean;
  lastImportLog?: BanksApiImportLog | null;
  onRefresh: () => void;
  onDisconnect: () => void;
  onManageAccounts: () => void;
  onRefreshAndImport: () => void;
  onConsentRenewal: () => void;
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
    label: 'Bankfreigabe erforderlich',
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

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatImportStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'success':
      return { label: 'Erfolgreich', color: 'text-emerald-600' };
    case 'partial':
      return { label: 'Teilweise', color: 'text-amber-600' };
    case 'failed':
      return { label: 'Fehlgeschlagen', color: 'text-red-600' };
    case 'requires_sca':
      return { label: 'Freigabe noetig', color: 'text-amber-600' };
    default:
      return { label: status, color: 'text-gray-500' };
  }
}

function isConsentExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
}

function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export default function BanksApiConnectionStatus({
  connection,
  loading,
  refreshing = false,
  lastImportLog = null,
  onRefresh,
  onDisconnect,
  onManageAccounts,
  onRefreshAndImport,
  onConsentRenewal,
}: Props) {
  const config = STATUS_CONFIG[connection.status] || STATUS_CONFIG.error;
  const StatusIcon = config.icon;
  const consentDays = daysUntilExpiry(connection.consent_expires_at);
  const consentExpiring = isConsentExpiringSoon(connection.consent_expires_at);
  const consentExpired = consentDays !== null && consentDays === 0;

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
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`w-3 h-3 ${config.color} ${
                  connection.status === 'syncing' ? 'animate-spin' : ''
                }`} />
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              {connection.selected_accounts > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  {connection.selected_accounts}/{connection.total_accounts} Konten
                </span>
              )}
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

        {connection.last_attempted_sync_at && connection.last_attempted_sync_at !== connection.last_sync_at && (
          <p className="text-[10px] text-gray-400 mt-2">
            Letzter Versuch: {formatDateTime(connection.last_attempted_sync_at)}
          </p>
        )}

        {connection.accounts && connection.accounts.length > 0 && (
          <AccountsList accounts={connection.accounts} />
        )}

        <HealthIndicator connection={connection} onRefreshAndImport={onRefreshAndImport} onConsentRenewal={onConsentRenewal} loading={loading} />

        {lastImportLog && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Letzter Import</p>
                <p className="text-xs font-medium text-dark">
                  {formatDateTime(lastImportLog.finished_at || lastImportLog.started_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status</p>
                <p className={`text-xs font-medium ${formatImportStatus(lastImportLog.status).color}`}>
                  {formatImportStatus(lastImportLog.status).label}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Importiert</p>
                <p className="text-xs font-medium text-dark">
                  {lastImportLog.total_new_transactions_imported} neu
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duplikate</p>
                <p className="text-xs font-medium text-gray-500">
                  {lastImportLog.total_duplicates_skipped} uebersprungen
                </p>
              </div>
            </div>
            {lastImportLog.error_message && (
              <p className="text-xs text-red-600 mt-2">{lastImportLog.error_message}</p>
            )}
          </div>
        )}

        {connection.error_message && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{connection.error_message}</p>
          </div>
        )}

        {connection.last_issue_message && connection.status !== 'error' && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
            <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">{connection.last_issue_message}</p>
          </div>
        )}

        {(consentExpiring || consentExpired) && connection.status === 'connected' && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800">
                {consentExpired
                  ? 'Ihre PSD2-Bankfreigabe ist abgelaufen.'
                  : `Ihre PSD2-Bankfreigabe laeuft in ${consentDays} Tagen ab (${formatDate(connection.consent_expires_at)}).`
                }
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                Erneuern Sie die Freigabe, um weiterhin automatisch Transaktionen abzurufen.
              </p>
              <button
                onClick={onConsentRenewal}
                disabled={loading}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <ShieldAlert className="w-3 h-3" />
                )}
                Bankfreigabe erneuern
              </button>
            </div>
          </div>
        )}

        {connection.status === 'requires_sca' && (
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">
                  Die Bankfreigabe muss erneuert werden.
                </p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Der automatische Import ist pausiert, bis die Freigabe erteilt wird. Ihre bisherigen Daten bleiben erhalten.
                </p>
              </div>
            </div>
            <Button variant="warning" size="sm" onClick={onConsentRenewal} disabled={loading}>
              {loading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              Bankfreigabe erneuern
            </Button>
          </div>
        )}

        {connection.status === 'connected' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={onRefreshAndImport}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#3c8af7] bg-[#3c8af7]/5 hover:bg-[#3c8af7]/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <>
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Transaktionen werden abgerufen...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Jetzt aktualisieren
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Aktualisiert die Bankdaten und importiert neue Transaktionen.
              Automatischer Import taeglich um 09:00 Uhr.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBalance(cents: number | null): string {
  if (cents === null) return '';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatAccountType(type: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    girokonto: 'Girokonto',
    sparkonto: 'Sparkonto',
    tagesgeld: 'Tagesgeldkonto',
    festgeld: 'Festgeldkonto',
    kreditkarte: 'Kreditkarte',
    depot: 'Depot',
    bausparvertrag: 'Bausparvertrag',
    checking: 'Girokonto',
    savings: 'Sparkonto',
    credit_card: 'Kreditkarte',
    loan: 'Kredit',
  };
  return map[type.toLowerCase()] || type;
}

function maskIban(iban: string): string {
  if (iban.length <= 8) return iban;
  return iban.slice(0, 4) + ' **** ' + iban.slice(-4);
}

function AccountsList({ accounts }: { accounts: BanksApiAccountSummary[] }) {
  const selected = accounts.filter(a => a.selected);
  const unselected = accounts.filter(a => !a.selected);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
        Konten ({selected.length} aktiv / {accounts.length} gesamt)
      </p>
      <div className="space-y-1.5">
        {selected.map((acc) => (
          <AccountRow key={acc.id} account={acc} />
        ))}
        {unselected.map((acc) => (
          <AccountRow key={acc.id} account={acc} />
        ))}
      </div>
    </div>
  );
}

function AccountRow({ account }: { account: BanksApiAccountSummary }) {
  const typeLabel = formatAccountType(account.account_type);

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
      account.selected ? 'bg-gray-50' : 'bg-gray-50/50 opacity-60'
    }`}>
      <CreditCard className={`w-3.5 h-3.5 flex-shrink-0 ${
        account.selected ? 'text-[#3c8af7]' : 'text-gray-300'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-dark truncate">
            {account.account_name || 'Konto'}
          </span>
          {typeLabel && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {typeLabel}
            </span>
          )}
          {!account.selected && (
            <span className="text-[10px] text-gray-400 italic flex-shrink-0">
              (nicht aktiv)
            </span>
          )}
        </div>
        {account.iban && (
          <span className="text-[10px] text-gray-400 font-mono">
            {maskIban(account.iban)}
          </span>
        )}
      </div>
      {account.balance_cents !== null && (
        <span className={`text-xs font-semibold flex-shrink-0 ${
          account.balance_cents >= 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {formatBalance(account.balance_cents)}
        </span>
      )}
    </div>
  );
}

function HealthIndicator({
  connection,
  onRefreshAndImport,
  onConsentRenewal,
  loading,
}: {
  connection: BanksApiConnection;
  onRefreshAndImport: () => void;
  onConsentRenewal: () => void;
  loading: boolean;
}) {
  const hs = connection.last_health_status;
  if (!hs || hs === 'healthy' || connection.status === 'disconnected') return null;
  if (connection.status === 'requires_sca') return null;

  const isWarning = hs === 'warning';
  const isCritical = hs === 'critical';
  const isSca = hs === 'requires_sca';

  if (!isWarning && !isCritical && !isSca) return null;

  const bgClass = isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const iconClass = isCritical ? 'text-red-500' : 'text-amber-500';
  const titleClass = isCritical ? 'text-red-800' : 'text-amber-800';
  const bodyClass = isCritical ? 'text-red-600' : 'text-amber-600';

  const reason = connection.last_health_reason;
  const failures = connection.consecutive_failure_count || 0;

  let title = '';
  let description = '';
  let action: { label: string; handler: () => void } | null = null;

  if (isSca) {
    title = 'Bankfreigabe erforderlich';
    description = 'Die automatische Aktualisierung ist pausiert, bis Sie eine neue Bankfreigabe erteilen.';
    action = { label: 'Bankfreigabe erneuern', handler: onConsentRenewal };
  } else if (isCritical) {
    title = 'Synchronisierung unterbrochen';
    description = reason || 'Die automatische Aktualisierung konnte seit laengerem nicht erfolgreich durchgefuehrt werden.';
    if (failures >= 5) {
      description += ` (${failures} aufeinanderfolgende Fehlversuche)`;
    }
    action = { label: 'Jetzt erneut versuchen', handler: onRefreshAndImport };
  } else {
    title = 'Aktualisierung verzoegert';
    description = reason || 'Die letzte automatische Aktualisierung liegt laenger zurueck als erwartet.';
    if (failures >= 2) {
      description += ` (${failures} Fehlversuche)`;
    }
  }

  return (
    <div className={`mt-3 flex items-start gap-2 p-2.5 border rounded-lg ${bgClass}`}>
      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${titleClass}`}>{title}</p>
        <p className={`text-[10px] mt-0.5 ${bodyClass}`}>{description}</p>
        {action && (
          <button
            onClick={action.handler}
            disabled={loading}
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 ${
              isCritical
                ? 'text-red-800 bg-red-100 hover:bg-red-200'
                : isSca
                  ? 'text-amber-800 bg-amber-100 hover:bg-amber-200'
                  : ''
            }`}
          >
            {isSca ? <ShieldAlert className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
