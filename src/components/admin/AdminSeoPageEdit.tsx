import { useState, useEffect } from "react";
import { ArrowLeft, Lock, AlertCircle, Eye } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { clearSeoCache } from "../../lib/seoResolver";
import { Button } from '../ui/Button';

interface SeoPageData {
  path: string;
  page_type: string;
  is_public: boolean;
  allow_indexing: boolean;
  title: string;
  description: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
}

interface AdminSeoPageEditProps {
  pageId: string | null;
  onBack: () => void;
}

export default function AdminSeoPageEdit({ pageId, onBack }: AdminSeoPageEditProps) {
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SeoPageData>({
    path: "/",
    page_type: "marketing",
    is_public: true,
    allow_indexing: true,
    title: "",
    description: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
  });

  const isAppPage = formData.page_type === "app";
  const titleLength = formData.title.length;
  const descriptionLength = formData.description.length;

  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  async function loadPage() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("seo_page_settings")
        .select("*")
        .eq("id", pageId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          path: data.path,
          page_type: data.page_type,
          is_public: data.is_public,
          allow_indexing: data.allow_indexing,
          title: data.title || "",
          description: data.description || "",
          canonical_url: data.canonical_url || "",
          og_title: data.og_title || "",
          og_description: data.og_description || "",
          og_image_url: data.og_image_url || "",
        });
      }
    } catch (error) {
      console.error("Error loading page:", error);
      alert("Fehler beim Laden der Seite");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.path.startsWith("/")) {
      alert("Der Pfad muss mit '/' beginnen");
      return;
    }

    try {
      setSaving(true);

      const dataToSave = {
        path: formData.path,
        page_type: formData.page_type,
        is_public: formData.page_type === "app" ? false : formData.is_public,
        allow_indexing: formData.page_type === "app" ? false : formData.allow_indexing,
        title: formData.title || null,
        description: formData.description || null,
        canonical_url: formData.canonical_url || null,
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        og_image_url: formData.og_image_url || null,
      };

      if (pageId) {
        const { error } = await supabase
          .from("seo_page_settings")
          .update(dataToSave)
          .eq("id", pageId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("seo_page_settings").insert(dataToSave);

        if (error) {
          if (error.code === "23505") {
            alert("Eine Seite mit diesem Pfad existiert bereits");
            return;
          }
          throw error;
        }
      }

      clearSeoCache();
      alert("Erfolgreich gespeichert");
      onBack();
    } catch (error) {
      console.error("Error saving page:", error);
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
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-dark transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </button>
        <h2 className="text-2xl font-bold text-dark">
          {pageId ? "Seite bearbeiten" : "Neue Seite hinzufügen"}
        </h2>
      </div>

      {isAppPage && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">App-Seite</p>
              <p>
                Diese Seite ist eine App-Seite und wird immer mit noindex, nofollow ausgeliefert.
                Die Indexierung kann nicht geändert werden.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Pfad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/beispiel-seite"
                required
                disabled={!!pageId}
              />
              <p className="text-xs text-gray-500 mt-1">
                Der URL-Pfad, z.B. "/", "/preise", "/funktionen"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Seitentyp <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.page_type}
                onChange={(e) => setFormData({ ...formData, page_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!pageId}
              >
                <option value="marketing">Marketing</option>
                <option value="feature">Feature</option>
                <option value="blog">Blog</option>
                <option value="app">App</option>
              </select>
            </div>

            {!isAppPage && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allow_indexing"
                  checked={formData.allow_indexing}
                  onChange={(e) =>
                    setFormData({ ...formData, allow_indexing: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="allow_indexing" className="text-sm font-medium text-dark">
                  Indexieren erlauben (von Suchmaschinen)
                </label>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-dark">SEO Meta-Tags</h3>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">SEO Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Startseite"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Wird in Template eingesetzt: "%s – rentably"
                </p>
                <span
                  className={`text-xs ${
                    titleLength > 60 ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {titleLength} / ~60 Zeichen
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">SEO Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="Kurze Beschreibung der Seite für Suchmaschinen"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">Erscheint in Suchergebnissen</p>
                <span
                  className={`text-xs ${
                    descriptionLength > 155 ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {descriptionLength} / ~155 Zeichen
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Canonical URL</label>
              <input
                type="text"
                value={formData.canonical_url}
                onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://rentably.de/seite"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Bevorzugte URL-Version</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-dark">Open Graph (Social Media)</h3>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">OG Title</label>
              <input
                type="text"
                value={formData.og_title}
                onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fällt zurück auf SEO Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">OG Description</label>
              <textarea
                value={formData.og_description}
                onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                placeholder="Fällt zurück auf SEO Description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">OG Image URL</label>
              <input
                type="text"
                value={formData.og_image_url}
                onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://rentably.de/og-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Empfohlen: 1200x630px für optimale Darstellung
              </p>
            </div>
          </div>

          {!isAppPage && formData.title && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Google Snippet Vorschau
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-1">
                  <div className="text-sm text-blue-600">
                    {window.location.origin}
                    {formData.path}
                  </div>
                  <div className="text-xl text-blue-800 hover:underline cursor-pointer">
                    {formData.title ? `${formData.title} – rentably` : "rentably"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.description || "Keine Beschreibung vorhanden"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(!formData.title || !formData.description) && !isAppPage && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Fehlende SEO-Daten</p>
                  <p>
                    Wenn Title oder Description leer sind, werden die globalen Standard-Werte
                    verwendet. Für optimale Suchmaschinen-Rankings sollten Sie individuelle Texte
                    pflegen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={onBack}
            variant="cancel"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
          >
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </form>
    </div>
  );
}
