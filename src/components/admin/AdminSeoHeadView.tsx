import { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  getGlobalHeadHtml,
  getDefaultHeadHtml,
  updateGlobalHeadHtml,
  resolveHeadVariables,
  replaceHeadPlaceholders,
  invalidateGlobalHeadCache,
} from "../../lib/globalHead";
import { SITE_URL } from "../../config/site";
import { Button } from "../ui/Button";

export default function AdminSeoHeadView() {
  const { user } = useAuth();
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewPath, setPreviewPath] = useState("/");
  const [showPreview, setShowPreview] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadHeadHtml();
  }, []);

  useEffect(() => {
    validateHtml(html);
  }, [html]);

  async function loadHeadHtml() {
    try {
      setLoading(true);
      invalidateGlobalHeadCache();
      const headHtml = await getGlobalHeadHtml(true);
      setHtml(headHtml);
      setOriginalHtml(headHtml);
    } catch {
      setHtml(getDefaultHeadHtml());
      setOriginalHtml(getDefaultHeadHtml());
    } finally {
      setLoading(false);
    }
  }

  function validateHtml(value: string) {
    const w: string[] = [];

    if (/<script[\s>]/i.test(value)) {
      w.push("Das Template enthaelt <script>-Tags. Diese werden aus Sicherheitsgruenden ignoriert.");
    }

    if (!/og:title/i.test(value)) {
      w.push("Kein og:title gefunden. WhatsApp und andere Social-Media-Plattformen benoetigen diesen Tag.");
    }

    if (!/og:url/i.test(value) && !/canonical/i.test(value)) {
      w.push("Kein og:url oder canonical Link gefunden. Die korrekte URL wird moeglicherweise nicht angezeigt.");
    }

    if (!/og:image/i.test(value)) {
      w.push("Kein og:image gefunden. Vorschaubilder werden ohne diesen Tag nicht angezeigt.");
    }

    setWarnings(w);
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    const result = await updateGlobalHeadHtml(html, user.id);

    if (result.success) {
      setOriginalHtml(html);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert(result.error || "Fehler beim Speichern");
    }

    setSaving(false);
  }

  function handleReset() {
    if (!confirm("Moechten Sie den Head auf den Standardwert zuruecksetzen? Alle Aenderungen gehen verloren.")) return;
    setHtml(getDefaultHeadHtml());
  }

  function getPreviewHtml(): string {
    const vars = resolveHeadVariables(previewPath);
    return replaceHeadPlaceholders(html, vars);
  }

  const hasChanges = html !== originalHtml;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        style={{ backgroundColor: "#eff4fe", borderColor: "#DDE7FF" }}
        className="border rounded-lg p-4"
      >
        <p className="text-sm font-medium text-blue-900 mb-1">
          Globaler Website-Head
        </p>
        <p className="text-sm text-blue-900">
          Hier koennen Sie die Meta-Tags im Head-Bereich der Website bearbeiten.
          Diese Tags werden auf allen Seiten ausgegeben und steuern, wie die
          Website bei WhatsApp, Facebook, Twitter und in Suchmaschinen
          angezeigt wird.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-dark">
              Head HTML Template
            </label>
            <Button
              type="button"
              variant="outlined"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Auf Standard zuruecksetzen
            </Button>
          </div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full h-80 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y bg-gray-50"
            spellCheck={false}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Verfuegbare Platzhalter
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                key: "{{SITE_URL}}",
                desc: `Basis-URL der Website (${SITE_URL})`,
              },
              {
                key: "{{PAGE_URL}}",
                desc: "Vollstaendige URL der aktuellen Seite",
              },
              {
                key: "{{TITLE}}",
                desc: "Seitentitel aus SEO-Einstellungen",
              },
              {
                key: "{{DESCRIPTION}}",
                desc: "Seitenbeschreibung aus SEO-Einstellungen",
              },
              {
                key: "{{OG_IMAGE}}",
                desc: "URL des OG-Bildes",
              },
            ].map(({ key, desc }) => (
              <div
                key={key}
                className="flex items-start gap-2 text-xs"
              >
                <code className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-blue-700 font-mono whitespace-nowrap flex-shrink-0">
                  {key}
                </code>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{w}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                Gespeichert
              </span>
            )}
            {hasChanges && !saved && (
              <span className="text-sm text-gray-400">
                Ungespeicherte Aenderungen
              </span>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            variant="primary"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            Live-Vorschau
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showPreview ? "Ausblenden" : "Anzeigen"}
          </button>
        </div>

        {showPreview && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pfad fuer Vorschau
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{SITE_URL}</span>
                <input
                  type="text"
                  value={previewPath}
                  onChange={(e) => setPreviewPath(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Ergebnis nach Platzhalter-Ersetzung:
              </p>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {getPreviewHtml()}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-dark">Hinweise</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              Die hier definierten Tags werden auf allen Seiten in den
              &lt;head&gt; injiziert. Seiten-spezifische Title und
              Description aus den SEO-Seiteneinstellungen werden
              automatisch als Platzhalter-Werte verwendet.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              &lt;script&gt;-Tags werden aus Sicherheitsgruenden ignoriert.
              Verwenden Sie fuer Tracking-Scripts die
              System-Einstellungen.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>
              WhatsApp, Facebook und andere Crawler lesen die statischen
              Meta-Tags aus der HTML-Datei. Aenderungen hier wirken sich
              auf die clientseitigen Tags aus. Die statischen Tags in
              index.html bilden den Fallback fuer Crawler.
            </span>
          </li>
        </ul>

        <div className="pt-2 flex flex-wrap gap-3">
          <a
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Facebook Sharing Debugger
          </a>
          <a
            href="https://cards-dev.twitter.com/validator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Twitter Card Validator
          </a>
        </div>
      </div>
    </div>
  );
}
