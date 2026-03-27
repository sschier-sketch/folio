import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  Landmark,
  Eye,
  EyeOff,
  Shield,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Activity,
  Loader,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/Button";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../lib/systemSettings";
import { supabase } from "../../lib/supabase";

export default function AdminBanksApiView() {
  const [loading, setLoading] = useState(true);
  const [banksapiEnabled, setBanksapiEnabled] = useState(false);
  const [banksapiBasicAuth, setBanksapiBasicAuth] = useState("");
  const [banksapiBasicAuthMasked, setBanksapiBasicAuthMasked] = useState(true);
  const [banksapiHasBasicAuth, setBanksapiHasBasicAuth] = useState(false);
  const [banksapiShowLegacy, setBanksapiShowLegacy] = useState(false);
  const [banksapiClientId, setBanksapiClientId] = useState("");
  const [banksapiClientSecret, setBanksapiClientSecret] = useState("");
  const [banksapiSecretMasked, setBanksapiSecretMasked] = useState(true);
  const [banksapiHasSecret, setBanksapiHasSecret] = useState(false);
  const [savingBanksapi, setSavingBanksapi] = useState(false);
  const [banksapiMessage, setBanksapiMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [banksapiStats, setBanksapiStats] = useState<Record<string, unknown> | null>(null);
  const [banksapiStatsLoading, setBanksapiStatsLoading] = useState(false);

  const loadBanksapiStats = useCallback(async () => {
    setBanksapiStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_banksapi_stats");
      if (error) throw error;
      setBanksapiStats(data);
    } catch (err) {
      console.error("Failed to load BanksAPI stats:", err);
    } finally {
      setBanksapiStatsLoading(false);
    }
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getSystemSettings(true);
      if (settings) {
        setBanksapiEnabled(settings.banksapi_enabled ?? false);
        setBanksapiClientId(settings.banksapi_client_id || "");
      }

      const { data: secretCheck } = await supabase
        .from("system_settings")
        .select("banksapi_basic_authorization, banksapi_client_secret_encrypted")
        .eq("id", 1)
        .maybeSingle();
      setBanksapiHasBasicAuth(!!secretCheck?.banksapi_basic_authorization);
      setBanksapiHasSecret(!!secretCheck?.banksapi_client_secret_encrypted);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadBanksapiStats();
  }, [loadBanksapiStats]);

  const handleSaveBanksapi = async () => {
    setSavingBanksapi(true);
    setBanksapiMessage(null);

    try {
      const updates: Record<string, unknown> = {
        banksapi_enabled: banksapiEnabled,
        banksapi_client_id: banksapiClientId.trim() || null,
      };

      if (banksapiBasicAuth.trim()) {
        updates.banksapi_basic_authorization = banksapiBasicAuth.trim();
      }

      if (banksapiClientSecret.trim()) {
        updates.banksapi_client_secret_encrypted = banksapiClientSecret.trim();
      }

      const { error } = await supabase
        .from("system_settings")
        .update(updates)
        .eq("id", 1);

      if (error) {
        setBanksapiMessage({ type: "error", text: error.message });
      } else {
        setBanksapiMessage({ type: "success", text: "BanksAPI-Einstellungen gespeichert!" });
        setBanksapiBasicAuth("");
        setBanksapiClientSecret("");
        if (updates.banksapi_basic_authorization) {
          setBanksapiHasBasicAuth(true);
        }
        if (updates.banksapi_client_secret_encrypted) {
          setBanksapiHasSecret(true);
        }
        await getSystemSettings(true);
      }
    } catch (error) {
      setBanksapiMessage({ type: "error", text: "Ein unerwarteter Fehler ist aufgetreten" });
    } finally {
      setSavingBanksapi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">BanksAPI</h1>
        <p className="text-gray-600">
          PSD2-Bankanbindung, Einstellungen und Diagnostik
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <Landmark className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                Bankanbindung (BanksAPI)
              </h2>
              <p className="text-sm text-gray-600">
                PSD2-Schnittstelle fuer automatischen Bankumsatz-Import
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {banksapiMessage && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                banksapiMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {banksapiMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{banksapiMessage.text}</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={banksapiEnabled}
                  onChange={(e) => setBanksapiEnabled(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-primary-blue rounded focus:ring-2 focus:ring-primary-blue"
                />
                <div>
                  <span className="text-sm font-semibold text-dark block">
                    BanksAPI-Integration aktivieren
                  </span>
                  <span className="text-xs text-gray-600 block mt-1">
                    Ermoeglicht Nutzern die automatische Anbindung ihres Bankkontos via PSD2
                  </span>
                </div>
              </label>
            </div>
            <div
              className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
                banksapiEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {banksapiEnabled ? "Aktiv" : "Inaktiv"}
            </div>
          </div>

          <div>
            <label
              htmlFor="banksapi-basic-auth"
              className="block text-sm font-semibold text-dark mb-2"
            >
              BANKSapi Authorization
            </label>
            <div className="relative">
              <input
                id="banksapi-basic-auth"
                type={banksapiBasicAuthMasked ? "password" : "text"}
                value={banksapiBasicAuth}
                onChange={(e) => setBanksapiBasicAuth(e.target.value)}
                placeholder={
                  banksapiHasBasicAuth
                    ? "Credential hinterlegt - neuen Wert eingeben zum Ueberschreiben"
                    : "Basic Authorization Credential von BANKSapi einfuegen"
                }
                className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setBanksapiBasicAuthMasked(!banksapiBasicAuthMasked)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {banksapiBasicAuthMasked ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {banksapiHasBasicAuth ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Credential ist hinterlegt (write-only, wird nie im Frontend angezeigt)
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Das Credential von BANKSapi einfuegen (z.B. "Basic abc123..." oder nur den kodierten Wert).
                  Wird ausschliesslich serverseitig verwendet.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Landmark className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">BanksAPI PSD2-Integration</p>
              <p>
                Fuegen Sie das von BANKSapi bereitgestellte Basic Authorization Credential ein.
                Es wird ausschliesslich serverseitig in Edge Functions fuer den OAuth2
                Token-Request verwendet und nie an den Browser uebertragen. Der taeglich
                automatische Sync laeuft via Cron-Job um 07:00 UTC.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setBanksapiShowLegacy(!banksapiShowLegacy)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              {banksapiShowLegacy ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {banksapiShowLegacy ? "Legacy-Felder ausblenden" : "Legacy-Felder anzeigen (Client ID / Secret)"}
            </button>

            {banksapiShowLegacy && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-amber-600 font-medium">
                  Diese Felder werden nur als Fallback verwendet, wenn kein Basic Authorization Credential hinterlegt ist.
                </p>
                <div>
                  <label
                    htmlFor="banksapi-client-id"
                    className="block text-xs font-semibold text-gray-500 mb-1.5"
                  >
                    Client ID (Legacy)
                  </label>
                  <input
                    id="banksapi-client-id"
                    type="text"
                    value={banksapiClientId}
                    onChange={(e) => setBanksapiClientId(e.target.value)}
                    placeholder="Client ID"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="banksapi-client-secret"
                    className="block text-xs font-semibold text-gray-500 mb-1.5"
                  >
                    Client Secret (Legacy)
                  </label>
                  <div className="relative">
                    <input
                      id="banksapi-client-secret"
                      type={banksapiSecretMasked ? "password" : "text"}
                      value={banksapiClientSecret}
                      onChange={(e) => setBanksapiClientSecret(e.target.value)}
                      placeholder={
                        banksapiHasSecret
                          ? "Secret hinterlegt - neuen Wert eingeben zum Ueberschreiben"
                          : "Client Secret"
                      }
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setBanksapiSecretMasked(!banksapiSecretMasked)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {banksapiSecretMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {banksapiHasSecret && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3" />
                      Secret ist hinterlegt
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                setBanksapiBasicAuth("");
                setBanksapiClientSecret("");
                loadSettings();
              }}
              disabled={savingBanksapi}
              variant="outlined"
            >
              Zuruecksetzen
            </Button>
            <Button onClick={handleSaveBanksapi} disabled={savingBanksapi} variant="primary">
              {savingBanksapi ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird gespeichert...
                </>
              ) : (
                "BanksAPI speichern"
              )}
            </Button>
          </div>
        </div>
      </div>

      {banksapiEnabled && (
        <BanksApiDiagnosticsSection
          stats={banksapiStats}
          loading={banksapiStatsLoading}
          onRefresh={loadBanksapiStats}
        />
      )}
    </div>
  );
}

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BanksApiDiagnosticsSection({
  stats,
  loading,
  onRefresh,
}: {
  stats: Record<string, unknown> | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const conns = (stats?.connections || {}) as Record<string, number>;
  const products = (stats?.products || {}) as Record<string, number>;
  const imp = (stats?.import_24h || {}) as Record<string, number>;
  const lastCron = (stats?.last_cron || {}) as Record<string, unknown>;
  const cronJob = (stats?.cron_job || {}) as Record<string, unknown>;
  const connList = (stats?.connection_list || []) as Array<Record<string, unknown>>;

  const statCards = [
    { label: "Aktive Verbindungen", value: conns.total_active ?? 0, icon: Activity, color: "text-emerald-600 bg-emerald-50" },
    { label: "Freigabe noetig", value: conns.requires_sca ?? 0, icon: AlertTriangle, color: conns.requires_sca ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-50" },
    { label: "Fehler", value: conns.with_errors ?? 0, icon: AlertCircle, color: conns.with_errors ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50" },
    { label: "Ausgewaehlte Konten", value: products.selected_accounts ?? 0, icon: CreditCard, color: "text-blue-600 bg-blue-50" },
    { label: "Import-Laeufe (24h)", value: imp.runs_24h ?? 0, icon: RefreshCw, color: "text-teal-600 bg-teal-50" },
    { label: "Importiert (24h)", value: imp.imported_24h ?? 0, icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark">
              BanksAPI Diagnostik
            </h2>
            <p className="text-sm text-gray-600">
              Uebersicht aller aktiven Bankverbindungen und Importstatus
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : !stats ? (
          <p className="text-sm text-gray-500 text-center py-4">Keine Daten verfuegbar</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="p-3 rounded-lg border border-gray-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-dark">{card.value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{card.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Letzter Cron-Lauf</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400">Cron-Trigger</p>
                  <p className="font-medium text-dark">{cronJob.last_trigger_at ? formatDt(cronJob.last_trigger_at as string) : "Nie"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Trigger-Status</p>
                  <p className={`font-medium ${cronJob.last_trigger_status === "failed" ? "text-red-600" : cronJob.last_trigger_at ? "text-emerald-600" : "text-gray-400"}`}>
                    {cronJob.last_trigger_status === "failed" ? "Fehlgeschlagen" : cronJob.last_trigger_at ? "Ausgeloest" : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Letzter Sync</p>
                  <p className="font-medium text-dark">{lastCron.started_at ? formatDt(lastCron.started_at as string) : "Kein Sync"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Importiert</p>
                  <p className="font-medium text-dark">{(lastCron.total_new_transactions_imported as number) ?? 0}</p>
                </div>
                {lastCron.error_message && lastCron.status === "failed" && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-[10px] text-gray-400">Fehler</p>
                    <p className="text-xs text-red-600">{lastCron.error_message as string}</p>
                  </div>
                )}
                {lastCron.error_message && lastCron.status !== "failed" && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-[10px] text-gray-400">Hinweis</p>
                    <p className="text-xs text-gray-500">{lastCron.error_message as string}</p>
                  </div>
                )}
              </div>
            </div>

            {connList.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Verbindungen</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="text-left px-3 py-2 font-medium">Nutzer</th>
                        <th className="text-left px-3 py-2 font-medium">Bank</th>
                        <th className="text-left px-3 py-2 font-medium">Status</th>
                        <th className="text-left px-3 py-2 font-medium">Konten</th>
                        <th className="text-left px-3 py-2 font-medium">Verbunden seit</th>
                        <th className="text-left px-3 py-2 font-medium">Letzter Sync</th>
                        <th className="text-left px-3 py-2 font-medium">Letzter Import</th>
                        <th className="text-left px-3 py-2 font-medium">Hinweis</th>
                        <th className="text-right px-3 py-2 font-medium">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {connList.map((c, i) => {
                        const st = c.status as string;
                        const statusColor = st === "connected" ? "text-emerald-600" : st === "requires_sca" ? "text-amber-600" : st === "error" ? "text-red-600" : "text-gray-500";
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{(c.user_email as string) || "\u2013"}</td>
                            <td className="px-3 py-2 font-medium text-dark">{(c.bank_name as string) || "\u2013"}</td>
                            <td className={`px-3 py-2 font-medium ${statusColor}`}>
                              {st === "connected" ? "Verbunden" : st === "requires_sca" ? "SCA noetig" : st === "error" ? "Fehler" : st}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {(c.selected_accounts as number) ?? 0}/{(c.total_accounts as number) ?? 0}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{formatDt(c.created_at as string)}</td>
                            <td className="px-3 py-2 text-gray-600">{formatDt(c.last_sync_at as string)}</td>
                            <td className="px-3 py-2 text-gray-600">
                              {c.last_import_status ? (
                                <span className={`${(c.last_import_status as string) === "success" ? "text-emerald-600" : "text-red-600"}`}>
                                  {(c.last_import_imported as number) ?? 0} neu
                                </span>
                              ) : "\u2013"}
                            </td>
                            <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">
                              {(c.last_issue_message as string) || (c.error_message as string) || "\u2013"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <BankConnectionActions
                                connectionId={c.connection_id as string}
                                status={st}
                                onDone={onRefresh}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {imp.failed_runs_24h > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {imp.failed_runs_24h} fehlgeschlagene Import-Laeufe in den letzten 24 Stunden.
                  Pruefen Sie die Cron-Jobs fuer Details.
                </p>
              </div>
            )}

            {imp.sca_runs_24h > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  {imp.sca_runs_24h} Verbindungen benoetigen eine erneute Bankfreigabe (SCA).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BankConnectionActions({
  connectionId,
  status,
  onDone,
}: {
  connectionId: string;
  status: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<"sync" | "delete" | null>(null);

  async function callAction(action: "sync" | "delete") {
    if (action === "delete" && !confirm("Bankverbindung wirklich loeschen?")) return;
    setBusy(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-banksapi-action`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, connectionId }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Aktion fehlgeschlagen");
      } else {
        onDone();
      }
    } catch {
      alert("Netzwerkfehler");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {status === "connected" && (
        <button
          onClick={() => callAction("sync")}
          disabled={!!busy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors disabled:opacity-40"
          title="Kontoumsaetze abrufen"
        >
          {busy === "sync" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Sync
        </button>
      )}
      <button
        onClick={() => callAction("delete")}
        disabled={!!busy}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-40"
        title="Verbindung loeschen"
      >
        {busy === "delete" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        Loeschen
      </button>
    </div>
  );
}
