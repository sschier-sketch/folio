import { useEffect, useState } from "react";
import { Save, FileText, Loader2, Check, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}

const PAGE_TABS = [
  { slug: "impressum", label: "Impressum", path: "/impressum" },
  { slug: "agb", label: "AGB", path: "/agb" },
  { slug: "datenschutz", label: "Datenschutz", path: "/datenschutz" },
  { slug: "avv", label: "AVV", path: "/avv" },
];

export default function AdminCmsView() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState("impressum");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    const page = pages.find((p) => p.slug === activeSlug);
    if (page) {
      setContent(page.content);
      setHasChanges(false);
      setSaved(false);
    }
  }, [activeSlug, pages]);

  async function loadPages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .order("slug");
    if (!error && data) {
      setPages(data);
    }
    setLoading(false);
  }

  function handleContentChange(value: string) {
    setContent(value);
    setHasChanges(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase
      .from("cms_pages")
      .update({
        content,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq("slug", activeSlug);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
    } else {
      setSaved(true);
      setHasChanges(false);
      await loadPages();
    }
    setSaving(false);
  }

  const activePage = pages.find((p) => p.slug === activeSlug);
  const activeTab = PAGE_TABS.find((t) => t.slug === activeSlug);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Seiten-Inhalte (CMS)
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Inhalte der rechtlichen Seiten bearbeiten
          </p>
        </div>
        {activeTab && (
          <a
            href={activeTab.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Seite ansehen
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        {PAGE_TABS.map((tab) => {
          const page = pages.find((p) => p.slug === tab.slug);
          const hasContent = page && page.content.trim().length > 0;
          return (
            <button
              key={tab.slug}
              onClick={() => setActiveSlug(tab.slug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeSlug === tab.slug
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {hasContent && (
                <span
                  className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                    activeSlug === tab.slug ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {activePage?.title || activeSlug}
              </p>
              {activePage?.updated_at && activePage.content.trim() && (
                <p className="text-[11px] text-gray-400">
                  Zuletzt bearbeitet:{" "}
                  {new Date(activePage.updated_at).toLocaleString("de-DE")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <Check className="w-3.5 h-3.5" />
                Gespeichert
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasChanges
                  ? "bg-primary-blue text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Speichern
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">
              HTML-Inhalt der Seite. Verwende Standard-HTML-Tags wie &lt;h2&gt;,
              &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;strong&gt;,
              &lt;em&gt;, &lt;a&gt; etc.
            </p>
            <p className="text-xs text-gray-400">
              Wenn das Feld leer ist, wird der eingebaute Standard-Inhalt
              angezeigt.
            </p>
          </div>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={28}
            className="w-full px-4 py-3 text-sm text-gray-700 font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue/40 resize-y leading-relaxed"
            placeholder="<h2>Überschrift</h2>
<p>Absatz mit Text...</p>"
            spellCheck={false}
          />
        </div>

        {content.trim() && (
          <div className="border-t border-gray-100 px-5 py-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Vorschau</p>
            <div
              className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-5 border border-gray-100 max-h-80 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
