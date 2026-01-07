import { useState, useEffect } from "react";
import { Download, FileText, Loader } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Template {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  is_premium: boolean;
  created_at: string;
}

interface CategoryGroup {
  category: string;
  title: string;
  description: string;
  templates: Template[];
}

const CATEGORIES = [
  {
    category: "interessentensuche",
    title: "Interessentensuche",
    description: "Neben dem persönlichen Eindruck zählen die wichtigsten Eckdaten zum neuen Mieter. Falschangaben sind übrigens ein Kündigungsgrund.",
  },
  {
    category: "wohnungsuebergabe",
    title: "Wohnungsübergabe",
    description: "Protokollieren Sie umfassend und genau, um Konflikten vorzubeugen. Dazu bestätigen Sie den Einzug des Mieters für die Ämter.",
  },
  {
    category: "mietvertrag",
    title: "Mietvertrag",
    description: "Die vom Rechtsanwalt geprüften Mietvertragsvorlagen sind der Grundbaustein für ein gutes Mietverhältnis.",
  },
  {
    category: "mietzahlungen",
    title: "Mietzahlungen",
    description: "Bei Anpassungen und Mahnungen zur Miete ist es besonders wichtig Formvorgaben und Fristen genau einzuhalten. Diese Vorlagen helfen dabei.",
  },
  {
    category: "kuendigung",
    title: "Kündigung",
    description: "Eine formal richtige Kündigungsbestätigung schützt Sie vor Problemen bei Auszug und Neuvermietung.",
  },
  {
    category: "sonstiges",
    title: "Sonstiges",
    description: "Checklisten, Protokolle und Vorlagen, die Ihnen das Leben als Vermieter vereinfachen.",
  },
];

export default function TemplatesView() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("category")
        .order("title");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(template: Template) {
    try {
      setDownloading(template.id);
      const { data, error } = await supabase.storage
        .from("templates")
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Fehler beim Herunterladen der Vorlage");
    } finally {
      setDownloading(null);
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const groupedTemplates: CategoryGroup[] = CATEGORIES.map(cat => ({
    category: cat.category,
    title: cat.title,
    description: cat.description,
    templates: templates.filter(t => t.category === cat.category),
  }));

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
        <h1 className="text-3xl font-bold text-dark mb-2">Vorlagen</h1>
        <p className="text-gray-400">
          Professionelle Dokumente für Ihre Immobilienverwaltung
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Vorlagen verfügbar
          </h3>
          <p className="text-gray-400">
            Vorlagen werden von Administratoren hochgeladen und stehen Ihnen dann hier zur Verfügung.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTemplates.map(group => {
            if (group.templates.length === 0) return null;

            return (
              <div key={group.category} className="bg-white rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-dark">{group.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                </div>

                <div className="p-6">
                  <div className="grid gap-4">
                    {group.templates.map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-dark truncate">
                              {template.title}
                            </h3>
                            {template.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {formatFileSize(template.file_size)}
                              </span>
                              {template.is_premium && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                                    Verwaltung
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(template)}
                          disabled={downloading === template.id}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {downloading === template.id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Lädt...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Herunterladen
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
