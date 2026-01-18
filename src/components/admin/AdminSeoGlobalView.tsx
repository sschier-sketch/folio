import { useState, useEffect } from "react";
import { Save, Lock, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { clearSeoCache } from "../../lib/seoResolver";

interface GlobalSettings {
  id: string;
  title_template: string;
  default_title: string;
  default_description: string;
  default_robots_index: boolean;
}

export default function AdminSeoGlobalView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    id: "",
    title_template: "%s – Rentably",
    default_title: "Rentably – Immobilienverwaltung leicht gemacht",
    default_description:
      "Die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen an einem Ort.",
    default_robots_index: true,
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Globale Einstellungen</p>
            <p>
              Diese Einstellungen werden als Fallback verwendet, wenn für eine Seite keine
              spezifischen SEO-Daten hinterlegt sind. App-/Login-Seiten werden immer mit noindex
              ausgeliefert, unabhängig von diesen Einstellungen.
            </p>
          </div>
        </div>
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
                  placeholder="%s – Rentably"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  %s wird durch den Seiten-Title ersetzt. Beispiel: "Startseite – Rentably"
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
                  placeholder="Rentably – Immobilienverwaltung leicht gemacht"
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
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? "Speichern..." : "Änderungen speichern"}
          </button>
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
