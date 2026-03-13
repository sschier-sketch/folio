import { useState, useEffect } from "react";
import {
  Monitor,
  AlertCircle,
  CheckCircle,
  Bell,
  Mail,
  Landmark,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Button } from "../ui/Button";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../../lib/systemSettings";
import { supabase } from "../../lib/supabase";
import RegistrationHealthView from "./RegistrationHealthView";

export default function AdminSystemInfoView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [notifyOnNewRegistration, setNotifyOnNewRegistration] = useState(false);
  const [notifyOnNewFeedback, setNotifyOnNewFeedback] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("hello@rentab.ly");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [banksapiEnabled, setBanksapiEnabled] = useState(false);
  const [banksapiClientId, setBanksapiClientId] = useState("");
  const [banksapiClientSecret, setBanksapiClientSecret] = useState("");
  const [banksapiSecretMasked, setBanksapiSecretMasked] = useState(true);
  const [banksapiHasSecret, setBanksapiHasSecret] = useState(false);
  const [savingBanksapi, setSavingBanksapi] = useState(false);
  const [banksapiMessage, setBanksapiMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getSystemSettings(true);
      if (settings) {
        setNotifyOnNewRegistration(settings.notify_on_new_registration);
        setNotifyOnNewFeedback(settings.notify_on_new_feedback ?? true);
        setNotificationEmail(settings.notification_email || "hello@rentab.ly");
        setBanksapiEnabled(settings.banksapi_enabled ?? false);
        setBanksapiClientId(settings.banksapi_client_id || "");
      }

      const { data: secretCheck } = await supabase
        .from("system_settings")
        .select("banksapi_client_secret_encrypted")
        .eq("id", 1)
        .maybeSingle();
      setBanksapiHasSecret(!!secretCheck?.banksapi_client_secret_encrypted);
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Fehler beim Laden der Einstellungen" });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError("E-Mail-Adresse darf nicht leer sein");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Bitte eine gueltige E-Mail-Adresse eingeben");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSave = async () => {
    if ((notifyOnNewRegistration || notifyOnNewFeedback) && !validateEmail(notificationEmail)) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateSystemSettings({
        notify_on_new_registration: notifyOnNewRegistration,
        notify_on_new_feedback: notifyOnNewFeedback,
        notification_email: notificationEmail.trim(),
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: "Einstellungen gespeichert!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Fehler beim Speichern",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Ein unerwarteter Fehler ist aufgetreten",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanksapi = async () => {
    setSavingBanksapi(true);
    setBanksapiMessage(null);

    try {
      const updates: Record<string, unknown> = {
        banksapi_enabled: banksapiEnabled,
        banksapi_client_id: banksapiClientId.trim() || null,
      };

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
        setBanksapiClientSecret("");
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
        <h1 className="text-3xl font-bold text-dark mb-2">Systeminfos</h1>
        <p className="text-gray-600">
          Benachrichtigungen und Systeminformationen konfigurieren
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                Admin-Benachrichtigungen
              </h2>
              <p className="text-sm text-gray-600">
                E-Mail-Benachrichtigungen bei wichtigen System-Ereignissen
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnNewRegistration}
                  onChange={(e) => setNotifyOnNewRegistration(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-primary-blue rounded focus:ring-2 focus:ring-primary-blue"
                />
                <div>
                  <span className="text-sm font-semibold text-dark block">
                    Benachrichtigung bei neuer Registrierung
                  </span>
                  <span className="text-xs text-gray-600 block mt-1">
                    Bei jeder neuen Benutzerregistrierung wird automatisch eine
                    E-Mail an die unten angegebene Adresse gesendet.
                  </span>
                </div>
              </label>
            </div>
            <div
              className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
                notifyOnNewRegistration
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {notifyOnNewRegistration ? "Aktiv" : "Inaktiv"}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnNewFeedback}
                  onChange={(e) => setNotifyOnNewFeedback(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-primary-blue rounded focus:ring-2 focus:ring-primary-blue"
                />
                <div>
                  <span className="text-sm font-semibold text-dark block">
                    Benachrichtigung bei neuem Featurewunsch
                  </span>
                  <span className="text-xs text-gray-600 block mt-1">
                    Bei jedem neuen Featurewunsch wird automatisch eine
                    E-Mail an die unten angegebene Adresse gesendet.
                  </span>
                </div>
              </label>
            </div>
            <div
              className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
                notifyOnNewFeedback
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {notifyOnNewFeedback ? "Aktiv" : "Inaktiv"}
            </div>
          </div>

          {(notifyOnNewRegistration || notifyOnNewFeedback) && (
            <>
              <div>
                <label
                  htmlFor="notification-email"
                  className="block text-sm font-semibold text-dark mb-2"
                >
                  Empfaenger-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    id="notification-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => {
                      setNotificationEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    onBlur={() => {
                      if (notificationEmail.trim()) {
                        validateEmail(notificationEmail);
                      }
                    }}
                    placeholder="hello@rentab.ly"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      emailError
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-gray-200 focus:ring-primary-blue/20 focus:border-primary-blue"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {emailError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  An diese Adresse werden alle Registrierungsbenachrichtigungen gesendet.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">So funktioniert es</p>
                  <p>
                    Sobald sich ein neuer Nutzer registriert, wird automatisch eine
                    E-Mail mit der E-Mail-Adresse und dem Zeitpunkt der Registrierung
                    an{" "}
                    <span className="font-mono font-semibold">
                      {notificationEmail || "..."}
                    </span>{" "}
                    gesendet. Die E-Mail wird über die bestehende E-Mail-Warteschlange
                    verarbeitet.
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button onClick={loadSettings} disabled={saving} variant="outlined">
              Zurücksetzen
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="primary">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird gespeichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
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
              htmlFor="banksapi-client-id"
              className="block text-sm font-semibold text-dark mb-2"
            >
              Client ID
            </label>
            <input
              id="banksapi-client-id"
              type="text"
              value={banksapiClientId}
              onChange={(e) => setBanksapiClientId(e.target.value)}
              placeholder="Ihre BanksAPI Client ID"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="banksapi-client-secret"
              className="block text-sm font-semibold text-dark mb-2"
            >
              Client Secret
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
                    : "Ihre BanksAPI Client Secret"
                }
                className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setBanksapiSecretMasked(!banksapiSecretMasked)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {banksapiSecretMasked ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {banksapiHasSecret ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Secret ist hinterlegt (write-only, wird nie im Frontend angezeigt)
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Das Secret wird verschluesselt gespeichert und nur serverseitig verwendet
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Landmark className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">BanksAPI PSD2-Integration</p>
              <p>
                Die Zugangsdaten erhalten Sie von BanksAPI (banksapi.io).
                Das Client Secret wird ausschliesslich serverseitig in Edge Functions
                verwendet und nie an den Browser uebertragen. Der taeglich automatische
                Sync ist als Cron-Platzhalter registriert und wird in einem spaeteren
                Update aktiviert.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => {
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

      <RegistrationHealthView />

      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Technische Informationen
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Benachrichtigungs-E-Mail</p>
              <p className="text-gray-600">
                Die Benachrichtigung wird direkt beim Anlegen des neuen Benutzers
                in die E-Mail-Warteschlange eingereiht und vom Cron-Job verarbeitet.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Inhalt</p>
              <p className="text-gray-600">
                Die E-Mail enthaelt die E-Mail-Adresse des neuen Nutzers sowie den
                Zeitpunkt der Registrierung (Berliner Zeit).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Registrierungsfehler-Alerting</p>
              <p className="text-gray-600">
                Bei jedem Registrierungsfehler (nicht bei bewussten Blocks wie Einladungs-Duplikaten)
                wird automatisch eine kritische E-Mail an die hinterlegte Adresse gesendet.
                Fehler werden dauerhaft in der Datenbank protokolliert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
