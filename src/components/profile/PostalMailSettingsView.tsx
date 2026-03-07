import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Wallet,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { useAdmin } from "../../hooks/useAdmin";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/Button";
import type { LxConfig, LxTestResult } from "../../lib/letterxpress-api";
import {
  getLetterXpressConfig,
  saveLetterXpressConfig,
  testLetterXpressConnection,
  setAccessToken,
  LetterXpressApiError,
} from "../../lib/letterxpress-api";
import PostalMailJobsList from "./PostalMailJobsList";

function formatDateTime(iso: string | null, language: string): string {
  if (!iso) return language === "de" ? "Nie" : "Never";
  try {
    return new Date(iso).toLocaleString(language === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function maskApiKey(hasKey: boolean, language: string): string {
  if (!hasKey) return language === "de" ? "Nicht hinterlegt" : "Not set";
  return "••••••••••••••••";
}

export default function PostalMailSettingsView() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const { dataOwnerId, canWrite, isOwner, isMember } = usePermissions();
  const { isAdmin } = useAdmin();
  const isReadOnly = isMember && !canWrite;

  useEffect(() => {
    setAccessToken(session?.access_token ?? null);
    return () => setAccessToken(null);
  }, [session?.access_token]);

  const [config, setConfig] = useState<LxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [togglingTestMode, setTogglingTestMode] = useState(false);

  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<LxTestResult | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLetterXpressConfig();
      setConfig(data);
      if (data) {
        setUsername(data.username || "");
      }
    } catch (err) {
      console.error("Error loading LetterXpress config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    setSaveMessage(null);
    setTestResult(null);

    try {
      if (!username.trim()) {
        setSaveMessage({
          type: "error",
          text: language === "de"
            ? "Bitte geben Sie einen Benutzernamen ein."
            : "Please enter a username.",
        });
        return;
      }

      const result = await saveLetterXpressConfig({
        username: username.trim(),
        ...(apiKey ? { api_key: apiKey } : {}),
        is_enabled: true,
      });

      setConfig({
        ...config,
        ...result,
        last_connection_test_at: config?.last_connection_test_at ?? null,
        last_connection_test_status: config?.last_connection_test_status ?? null,
        last_connection_test_message: config?.last_connection_test_message ?? null,
        last_balance: config?.last_balance ?? null,
        last_balance_currency: config?.last_balance_currency ?? null,
        last_balance_synced_at: config?.last_balance_synced_at ?? null,
        created_at: config?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as LxConfig);
      setApiKey("");
      setSaveMessage({
        type: "success",
        text: language === "de"
          ? "Zugangsdaten erfolgreich gespeichert."
          : "Credentials saved successfully.",
      });
    } catch (err: any) {
      const msg = err instanceof LetterXpressApiError
        ? err.message
        : (language === "de" ? "Fehler beim Speichern." : "Error saving credentials.");
      setSaveMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await testLetterXpressConnection();
      setTestResult(result);

      await loadConfig();
    } catch (err: any) {
      const msg = err instanceof LetterXpressApiError
        ? err.message
        : (language === "de" ? "Verbindungstest fehlgeschlagen." : "Connection test failed.");
      setTestResult({
        success: false,
        message: msg,
        balance: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleTestMode = async () => {
    if (!isAdmin || !config) return;
    setTogglingTestMode(true);

    try {
      const { data, error } = await supabase.rpc("set_letterxpress_test_mode", {
        p_owner_id: dataOwnerId,
        p_test_mode: !config.is_test_mode,
      });

      if (error) throw error;

      if (data?.success) {
        setConfig({ ...config, is_test_mode: data.is_test_mode });
      }
    } catch (err: any) {
      console.error("Error toggling test mode:", err);
    } finally {
      setTogglingTestMode(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-10 bg-gray-100 rounded w-full" />
            <div className="h-10 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  const hasCredentials = config?.has_api_key && config?.username;
  const isConnected = config?.last_connection_test_status === "success";

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-primary-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark">
              {language === "de" ? "Postalischer Briefversand" : "Postal Letter Dispatch"}
            </h3>
            <p className="text-sm text-gray-400">
              {language === "de" ? "LetterXpress-Integration" : "LetterXpress Integration"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            {language === "de" ? (
              <>
                Hier kann der postalische Briefversand über LetterXpress aktiviert werden.
                Nach Hinterlegung der Zugangsdaten kann rentably Briefe zentral über die LetterXpress API
                verwalten. Generierte PDFs aus verschiedenen Modulen können später direkt per Brief versendet werden.
              </>
            ) : (
              <>
                Here you can activate postal letter dispatch via LetterXpress.
                After saving your credentials, rentably can manage letters centrally through the LetterXpress API.
                Generated PDFs from various modules can later be sent directly by mail.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Credentials Card */}
      <div className="bg-white rounded shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary-blue" />
          <h3 className="text-lg font-semibold text-dark">
            {language === "de" ? "Zugangsdaten" : "Credentials"}
          </h3>
        </div>

        {isReadOnly && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {language === "de"
                ? "Diese Daten werden vom Hauptaccount verwaltet und können hier nur eingesehen werden."
                : "This data is managed by the main account and can only be viewed here."}
            </p>
          </div>
        )}

        {saveMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {saveMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {saveMessage.text}
          </div>
        )}

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "de" ? "Benutzername" : "Username"} *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => !isReadOnly && setUsername(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-50 disabled:text-gray-500"
              placeholder={language === "de" ? "Ihr LetterXpress Benutzername" : "Your LetterXpress username"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            {!isReadOnly ? (
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue pr-12"
                  placeholder={
                    config?.has_api_key
                      ? (language === "de" ? "Neuen API Key eingeben, um zu ändern" : "Enter new API key to change")
                      : (language === "de" ? "Ihr LetterXpress API Key" : "Your LetterXpress API key")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm">
                {maskApiKey(config?.has_api_key ?? false, language)}
              </div>
            )}
            {config?.has_api_key && !isReadOnly && (
              <p className="text-xs text-gray-400 mt-1">
                {language === "de"
                  ? "Ein API Key ist bereits hinterlegt. Lassen Sie das Feld leer, um den bestehenden Key beizubehalten."
                  : "An API key is already stored. Leave the field empty to keep the existing key."}
              </p>
            )}
          </div>

          {!isReadOnly && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="primary"
              >
                {saving
                  ? (language === "de" ? "Wird gespeichert…" : "Saving…")
                  : (language === "de" ? "Speichern" : "Save")}
              </Button>

              {hasCredentials && (
                <Button
                  onClick={handleTestConnection}
                  disabled={testing}
                  variant="outlined"
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
                  {testing
                    ? (language === "de" ? "Wird getestet…" : "Testing…")
                    : (language === "de" ? "Verbindung testen" : "Test Connection")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connection Test Result */}
      {testResult && (
        <div className={`rounded shadow-sm p-4 flex items-start gap-3 ${
          testResult.success
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${testResult.success ? "text-green-700" : "text-red-700"}`}>
              {testResult.success
                ? (language === "de" ? "Verbindung erfolgreich" : "Connection successful")
                : (language === "de" ? "Verbindung fehlgeschlagen" : "Connection failed")}
            </p>
            <p className={`text-sm mt-1 ${testResult.success ? "text-green-600" : "text-red-600"}`}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Balance & Status Card */}
      {hasCredentials && (
        <div className="bg-white rounded shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-primary-blue" />
            <h3 className="text-lg font-semibold text-dark">
              {language === "de" ? "Guthaben & Status" : "Balance & Status"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Balance */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {language === "de" ? "Guthaben" : "Balance"}
              </p>
              <p className="text-2xl font-bold text-dark">
                {config?.last_balance != null
                  ? `${config.last_balance.toFixed(2)} ${config.last_balance_currency || "EUR"}`
                  : "–"}
              </p>
              {config?.last_balance_synced_at && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(config.last_balance_synced_at, language)}
                </p>
              )}
            </div>

            {/* Connection Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {language === "de" ? "Verbindungsstatus" : "Connection Status"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {isConnected ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-green-700">
                      {language === "de" ? "Verbunden" : "Connected"}
                    </span>
                  </>
                ) : config?.last_connection_test_status === "error" ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span className="text-sm font-medium text-red-700">
                      {language === "de" ? "Fehler" : "Error"}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                    <span className="text-sm font-medium text-gray-500">
                      {language === "de" ? "Nicht getestet" : "Not tested"}
                    </span>
                  </>
                )}
              </div>
              {config?.last_connection_test_at && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === "de" ? "Letzter Test: " : "Last test: "}
                  {formatDateTime(config.last_connection_test_at, language)}
                </p>
              )}
            </div>

            {/* Mode */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {language === "de" ? "Modus" : "Mode"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {config?.is_test_mode ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">
                      {language === "de" ? "Testmodus" : "Test Mode"}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {language === "de" ? "Produktiv" : "Live"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {config?.is_test_mode
                  ? (language === "de"
                    ? "Briefe werden nicht tatsächlich versendet."
                    : "Letters are not actually sent.")
                  : (language === "de"
                    ? "Briefe werden produktiv verarbeitet."
                    : "Letters are processed in production.")}
              </p>
            </div>
          </div>

          {config?.last_connection_test_status === "error" && config?.last_connection_test_message && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{config.last_connection_test_message}</p>
            </div>
          )}
        </div>
      )}

      {/* Admin-only Test Mode Toggle */}
      {isAdmin && config && (
        <div className="bg-white rounded shadow-sm p-6 border-l-4 border-amber-400">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-dark">
              {language === "de" ? "Admin: Testmodus" : "Admin: Test Mode"}
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {language === "de"
              ? "Im Testmodus werden übertragene Aufträge nicht produktiv verarbeitet. Unversendete Postbox-Aufträge werden nach 7 Tagen gelöscht. Diese Einstellung ist nur für Administratoren sichtbar."
              : "In test mode, submitted jobs are not processed in production. Unsent postbox jobs are deleted after 7 days. This setting is only visible to administrators."}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleTestMode}
              disabled={togglingTestMode}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue ${
                config.is_test_mode ? "bg-amber-500" : "bg-gray-300"
              } ${togglingTestMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  config.is_test_mode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {config.is_test_mode
                ? (language === "de" ? "Testmodus aktiv" : "Test mode active")
                : (language === "de" ? "Produktivmodus" : "Live mode")}
            </span>
          </div>
        </div>
      )}

      {/* Jobs List - only shown when credentials are configured */}
      {hasCredentials && <PostalMailJobsList />}
    </div>
  );
}
