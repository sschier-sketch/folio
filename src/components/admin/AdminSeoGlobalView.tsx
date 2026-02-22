import { useState, useEffect } from "react";
import { Lock, RefreshCw, CheckCircle2, Map, Copy, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { clearSeoCache } from "../../lib/seoResolver";
import { Button } from '../ui/Button';
import { SITE_URL } from '../../config/site';

interface GlobalSettings {
  id: string;
  title_template: string;
  default_title: string;
  default_description: string;
  default_robots_index: boolean;
  sitemap_enabled: boolean;
  sitemap_generated_at: string | null;
}

export default function AdminSeoGlobalView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [regenerating, setRegenerating] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    id: "",
    title_template: "%s – rentably",
    default_title: "rentably – Immobilienverwaltung leicht gemacht",
    default_description:
      "Die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen an einem Ort.",
    default_robots_index: true,
    sitemap_enabled: true,
    sitemap_generated_at: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("seo_global_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading global settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);

      const { error } = await supabase
        .from("seo_global_settings")
        .update({
          title_template: settings.title_template,
          default_title: settings.default_title,
          default_description: settings.default_description,
          default_robots_index: settings.default_robots_index,
          sitemap_enabled: settings.sitemap_enabled,
        })
        .eq("id", settings.id);

      if (error) throw error;

      clearSeoCache();
      alert("Erfolgreich gespeichert");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }} className="border rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Hinweis:</p>
        <p className="text-sm text-blue-900">
          Diese Einstellungen werden als Fallback verwendet, wenn für eine Seite keine
          spezifischen SEO-Daten hinterlegt sind. App-/Login-Seiten werden immer mit noindex
          ausgeliefert, unabhängig von diesen Einstellungen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-dark mb-4">Title-Einstellungen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Title Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.title_template}
                  onChange={(e) =>
                    setSettings({ ...settings, title_template: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="%s – rentably"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  %s wird durch den Seiten-Title ersetzt. Beispiel: "Startseite – rentably"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Standard Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.default_title}
                  onChange={(e) => setSettings({ ...settings, default_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="rentably – Immobilienverwaltung leicht gemacht"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird verwendet, wenn für eine Seite kein spezifischer Title hinterlegt ist
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Description-Einstellungen</h3>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Standard Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={settings.default_description}
                onChange={(e) =>
                  setSettings({ ...settings, default_description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="Die moderne Plattform für Vermieter..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird verwendet, wenn für eine Seite keine spezifische Description hinterlegt ist
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-dark mb-4">Indexierungs-Einstellungen</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="default_robots_index"
                  checked={settings.default_robots_index}
                  onChange={(e) =>
                    setSettings({ ...settings, default_robots_index: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="default_robots_index" className="text-sm font-medium text-dark">
                  Standard: Öffentliche Seiten indexieren
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Dieser Wert wird für neue öffentliche Seiten als Standard verwendet. Bestehende
                Seiten werden nicht beeinflusst.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-gray-500" />
              Sitemap
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.sitemap_enabled}
                    onClick={() => setSettings({ ...settings, sitemap_enabled: !settings.sitemap_enabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.sitemap_enabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.sitemap_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium text-dark">
                    Sitemap generieren
                  </label>
                </div>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={regenerating || !settings.sitemap_enabled}
                  onClick={async () => {
                    setRegenerating(true);
                    setRegenerateSuccess(false);
                    try {
                      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;
                      const res = await fetch(url, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action: "regenerate" }),
                      });
                      if (!res.ok) throw new Error("Fehler beim Generieren");
                      setRegenerateSuccess(true);
                      await loadSettings();
                      setTimeout(() => setRegenerateSuccess(false), 3000);
                    } catch {
                      alert("Fehler beim Generieren der Sitemap");
                    } finally {
                      setRegenerating(false);
                    }
                  }}
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : regenerateSuccess ? (
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                  )}
                  {regenerateSuccess ? "Generiert" : "Jetzt generieren"}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Die Sitemap wird automatisch taeglich um 05:00 Uhr UTC aktualisiert und enthaelt
                alle oeffentlichen, indexierbaren Seiten, Magazin-Beitraege und CMS-Seiten.
              </p>

              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Oeffentliche Sitemap URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-gray-800 bg-white border border-gray-200 rounded px-3 py-1.5 truncate">
                      {SITE_URL}/sitemap.xml
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${SITE_URL}/sitemap.xml`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Kopiert" : "Kopieren"}
                    </button>
                    <a
                      href={`${SITE_URL}/sitemap.xml`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-white border border-gray-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ansehen
                    </a>
                  </div>
                </div>
                {settings.sitemap_generated_at && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Letzte Generierung</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(settings.sitemap_generated_at).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Geschützte Bereiche</p>
                <p>
                  App-Bereiche (/dashboard, /admin, /mieterportal, /login, etc.) werden
                  automatisch mit noindex, nofollow ausgeliefert und erscheinen nie in
                  Suchmaschinen. Diese Einstellung kann nicht geändert werden.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
          >
            {saving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </form>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Hinweise</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Das Title-Template wird auf alle Seiten angewendet, die einen eigenen Title haben
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Änderungen an den globalen Einstellungen wirken sich sofort auf alle Seiten ohne
              spezifische Werte aus
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Für optimale SEO-Ergebnisse sollten Sie für wichtige Seiten individuelle Title und
              Descriptions pflegen
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Die Sitemap enthält nur Seiten mit is_public=true und allow_indexing=true
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
