import { useState, useEffect } from "react";
import {
  Settings,
  AlertCircle,
  CheckCircle,
  Code,
  BarChart3,
  Info,
} from "lucide-react";
import { Button } from './ui/Button';
import {
  getSystemSettings,
  updateSystemSettings,
  SystemSettings,
  invalidateSettingsCache,
} from "../lib/systemSettings";

export default function AdminSystemSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [gtmContainerId, setGtmContainerId] = useState("");
  const [gtmCustomHeadHtml, setGtmCustomHeadHtml] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getSystemSettings(true);
      if (settings) {
        setGtmEnabled(settings.gtm_enabled);
        setGtmContainerId(settings.gtm_container_id || "");
        setGtmCustomHeadHtml(settings.gtm_custom_head_html || "");
        setShowAdvanced(!!settings.gtm_custom_head_html);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({
        type: "error",
        text: "Fehler beim Laden der Einstellungen",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateSystemSettings({
        gtm_enabled: gtmEnabled,
        gtm_container_id: gtmContainerId || null,
        gtm_custom_head_html: gtmCustomHeadHtml || null,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text:
            "Einstellungen gespeichert! Bitte laden Sie die Seite neu, damit die Änderungen wirksam werden.",
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
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

  const validateContainerId = (id: string): boolean => {
    if (!id) return true;
    const regex = /^GTM-[A-Z0-9]+$/i;
    return regex.test(id);
  };

  const isContainerIdValid = validateContainerId(gtmContainerId);
  const canSave =
    !saving &&
    (gtmEnabled ? isContainerIdValid || gtmCustomHeadHtml : true);

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
        <h1 className="text-3xl font-bold text-dark mb-2">
          System-Einstellungen
        </h1>
        <p className="text-gray-600">
          Verwalten Sie globale System-Konfigurationen
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : message.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : message.type === "error" ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark">
                Google Tag Manager
              </h2>
              <p className="text-sm text-gray-600">
                Tracking und Analytics konfigurieren
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gtmEnabled}
                  onChange={(e) => setGtmEnabled(e.target.checked)}
                  className="w-5 h-5 text-primary-blue rounded focus:ring-2 focus:ring-primary-blue"
                />
                <div>
                  <span className="text-sm font-semibold text-dark block">
                    GTM aktiv
                  </span>
                  <span className="text-xs text-gray-600">
                    Google Tag Manager auf allen Seiten aktivieren
                  </span>
                </div>
              </label>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                gtmEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {gtmEnabled ? "Aktiv" : "Inaktiv"}
            </div>
          </div>

          {gtmEnabled && !showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GTM Container ID
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={gtmContainerId}
                onChange={(e) =>
                  setGtmContainerId(e.target.value.toUpperCase())
                }
                placeholder="GTM-XXXXXXX"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent uppercase ${
                  gtmContainerId && !isContainerIdValid
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {gtmContainerId && !isContainerIdValid && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Format muss GTM-XXXXXXX sein (z.B. GTM-ABC123)
                </p>
              )}
              {gtmContainerId && isContainerIdValid && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Container ID ist gültig
                </p>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-primary-blue hover:text-blue-700 transition-colors"
            >
              <Code className="w-4 h-4" />
              {showAdvanced ? "Standard-Modus" : "Erweiterter Modus (Custom HTML)"}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Achtung</p>
                      <p>
                        Custom HTML überschreibt die Container-ID. Verwenden
                        Sie nur offiziellen GTM-Code von googletagmanager.com.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Head HTML (Override)
                  </label>
                  <textarea
                    value={gtmCustomHeadHtml}
                    onChange={(e) => setGtmCustomHeadHtml(e.target.value)}
                    placeholder="<script><!-- GTM Code hier einfügen --></script>"
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Wenn dieses Feld befüllt ist, wird die Container-ID
                    ignoriert und dieser Code direkt in den Head eingefügt.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
            <p className="text-sm text-blue-900">
              Falls keine Datenbank-Einstellung vorhanden ist, werden die
              Umgebungsvariablen VITE_GTM_ENABLED und VITE_GTM_ID
              verwendet.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              onClick={loadSettings}
              disabled={saving}
              variant="outlined"
            >
              Zurücksetzen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              variant="primary"
            >
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

      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Technische Informationen
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Caching</p>
              <p className="text-gray-600">
                Einstellungen werden für 60 Sekunden gecached. Nach dem
                Speichern wird der Cache automatisch aktualisiert.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Validierung</p>
              <p className="text-gray-600">
                Container-ID muss dem Format GTM-XXXXXXX entsprechen. Custom
                HTML darf nur Scripts von googletagmanager.com enthalten.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full mt-1.5"></div>
            <div>
              <p className="font-medium text-dark">Globale Integration</p>
              <p className="text-gray-600">
                GTM wird auf allen Seiten der Anwendung geladen und ist sofort
                nach dem Speichern (nach Reload) aktiv.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
