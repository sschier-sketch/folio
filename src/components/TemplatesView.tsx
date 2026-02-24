import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import Badge from "./common/Badge";
import { Button } from './ui/Button';
import { PremiumUpgradePrompt } from './PremiumUpgradePrompt';
import WizardCreatorSection from './wizard-templates/WizardCreatorSection';
import KuendigungWizard from './wizard-templates/KuendigungWizard';

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
  updated_at: string;
  download_count: number;
}

interface CategoryDescription {
  category: string;
  title: string;
  description: string;
}

export default function TemplatesView() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categoryDescriptions, setCategoryDescriptions] = useState<CategoryDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [wizardFreshStart, setWizardFreshStart] = useState(false);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadCategoryDescriptions();
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

  async function loadCategoryDescriptions() {
    try {
      const { data, error } = await supabase
        .from("template_category_descriptions")
        .select("*")
        .order("category");

      if (error) throw error;
      setCategoryDescriptions(data || []);
    } catch (error) {
      console.error("Error loading category descriptions:", error);
    }
  }

  async function handleDownload(template: Template) {
    if (template.is_premium && !isPremium) {
      alert("Diese Vorlage ist nur für Pro-Mitglieder verfügbar. Bitte upgraden Sie Ihren Tarif.");
      return;
    }

    try {
      setDownloading(template.id);

      await supabase
        .from("templates")
        .update({ download_count: template.download_count + 1 })
        .eq("id", template.id);

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

      loadTemplates();
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

  const getFileExtension = (filename: string): string => {
    const ext = filename.split(".").pop()?.toUpperCase();
    return ext || "FILE";
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (activeWizard === 'kuendigungsbestaetigung') {
    return <KuendigungWizard onBack={() => { setActiveWizard(null); setWizardFreshStart(false); }} freshStart={wizardFreshStart} />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Vorlagen</h1>
        <p className="text-gray-400">
          Professionelle Dokumente für Ihre Immobilienverwaltung
        </p>
      </div>

      {isPremium ? (
        <WizardCreatorSection onStartWizard={(id, fresh) => { setWizardFreshStart(!!fresh); setActiveWizard(id); }} />
      ) : (
        <PremiumUpgradePrompt featureKey="wizard_document_creator" />
      )}

      {templates.length > 0 && (
        <>
          <div className="mb-4 mt-10">
            <h2 className="text-lg font-bold text-dark">Vorlagen zum Herunterladen</h2>
            <p className="text-sm text-gray-400 mt-1">
              Fertige Dokumente, die von unseren Experten erstellt wurden.
            </p>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-[#1e1e24] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            {categoryDescriptions.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.category
                    ? 'bg-[#1e1e24] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </>
      )}

      {templates.length === 0 ? null : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Keine Vorlagen gefunden
          </h3>
          <p className="text-gray-400 mb-6">
            Keine Vorlagen in dieser Kategorie vorhanden.
          </p>
          <Button
            onClick={() => setSelectedCategory(null)}
            variant="primary"
          >
            Alle anzeigen
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-[#DDE7FF] bg-[#EEF4FF]">
                    <FileText className="w-4 h-4 text-[#1e1e24]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-dark truncate">
                        {template.title}
                      </h3>
                      {template.is_premium && (
                        <Badge variant="pro" size="sm">Pro</Badge>
                      )}
                      {!template.is_premium && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[11px] rounded font-medium">
                          Kostenlos
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {getFileExtension(template.file_name)}
                      </span>
                      <span className="text-xs text-gray-300">&bull;</span>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(template.file_size)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleDownload(template)}
                  disabled={downloading === template.id || (template.is_premium && !isPremium)}
                  variant={template.is_premium && !isPremium ? "secondary" : "primary"}
                  size="sm"
                >
                  {downloading === template.id ? (
                    "Lädt..."
                  ) : template.is_premium && !isPremium ? (
                    "Pro"
                  ) : (
                    "Herunterladen"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
