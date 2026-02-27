import { useState, useEffect } from "react";
import {
  FileText,
  Wand2,
  Download,
  FolderOpen,
  FileSignature,
  AlertTriangle,
  ScrollText,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import Badge from "./common/Badge";
import { Button } from "./ui/Button";
import ScrollableTabNav from "./common/ScrollableTabNav";
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";
import KuendigungWizard from "./wizard-templates/KuendigungWizard";
import ZahlungserinnerungWizard from "./wizard-templates/ZahlungserinnerungWizard";
import AbmahnungRuhestoerungWizard from "./wizard-templates/AbmahnungRuhestoerungWizard";
import AbmahnungBaulicheWizard from "./wizard-templates/AbmahnungBaulicheWizard";
import BetriebskostenVorauszahlungenWizard from "./wizard-templates/BetriebskostenVorauszahlungenWizard";
import MieterselbstauskunftWizard from "./wizard-templates/MieterselbstauskunftWizard";
import type { WizardTemplate } from "./wizard-templates/types";

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

interface DraftInfo {
  id: string;
  template_id: string;
  current_step: number;
  updated_at: string;
}

type Tab = "alle" | "kuendigung" | "abmahnungen" | "mietvertrag" | "sonstiges" | "downloads";

const CATEGORY_ICON_MAP: Record<string, typeof FileText> = {
  kuendigung: FileSignature,
  abmahnungen: AlertTriangle,
  mietvertrag: ScrollText,
  sonstiges: FolderOpen,
};

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "alle", label: "Alle Assistenten", icon: Wand2 },
  { id: "kuendigung", label: "Kündigung", icon: FileSignature },
  { id: "abmahnungen", label: "Abmahnungen", icon: AlertTriangle },
  { id: "sonstiges", label: "Sonstiges", icon: FolderOpen },
  { id: "downloads", label: "Download-Vorlagen", icon: Download },
];

export default function TemplatesView() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [wizardTemplates, setWizardTemplates] = useState<WizardTemplate[]>([]);
  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("alle");
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [wizardFreshStart, setWizardFreshStart] = useState(false);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  async function loadAll() {
    try {
      setLoading(true);
      const [tplRes, wizRes, draftRes] = await Promise.all([
        supabase.from("templates").select("*").order("category").order("title"),
        supabase
          .from("wizard_templates")
          .select("id, category, title, description")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("wizard_drafts")
          .select("id, template_id, current_step, updated_at")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false }),
      ]);
      if (tplRes.data) setTemplates(tplRes.data);
      if (wizRes.data) setWizardTemplates(wizRes.data);
      if (draftRes.data) setDrafts(draftRes.data);
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(template: Template) {
    if (template.is_premium && !isPremium) return;
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
      loadAll();
    } catch (error) {
      console.error("Error downloading template:", error);
    } finally {
      setDownloading(null);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toUpperCase() || "FILE";
  }

  function formatDraftDate(iso: string): string {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function deleteDraft(e: React.MouseEvent, draftId: string) {
    e.stopPropagation();
    try {
      await supabase.from("wizard_drafts").delete().eq("id", draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (err) {
      console.error("Error deleting draft:", err);
    }
  }

  function startWizard(id: string, fresh?: boolean) {
    setWizardFreshStart(!!fresh);
    setActiveWizard(id);
  }

  function closeWizard() {
    setActiveWizard(null);
    setWizardFreshStart(false);
  }

  if (activeWizard === "kuendigungsbestaetigung")
    return <KuendigungWizard onBack={closeWizard} freshStart={wizardFreshStart} />;
  if (activeWizard === "zahlungserinnerung")
    return <ZahlungserinnerungWizard onBack={closeWizard} freshStart={wizardFreshStart} />;
  if (activeWizard === "abmahnung_ruhestoerung")
    return <AbmahnungRuhestoerungWizard onBack={closeWizard} freshStart={wizardFreshStart} />;
  if (activeWizard === "abmahnung_bauliche_veraenderungen")
    return <AbmahnungBaulicheWizard onBack={closeWizard} freshStart={wizardFreshStart} />;
  if (activeWizard === "betriebskosten_vorauszahlungen")
    return <BetriebskostenVorauszahlungenWizard onBack={closeWizard} freshStart={wizardFreshStart} />;
  if (activeWizard === "mieterselbstauskunft")
    return <MieterselbstauskunftWizard onBack={closeWizard} freshStart={wizardFreshStart} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue" />
      </div>
    );
  }

  const filteredWizards =
    activeTab === "alle"
      ? wizardTemplates
      : activeTab === "downloads"
      ? []
      : wizardTemplates.filter((w) => w.category === activeTab);

  const filteredDownloads =
    activeTab === "downloads" ? templates : [];

  const showWizards = filteredWizards.length > 0;
  const showDownloads = filteredDownloads.length > 0;
  const showDrafts = drafts.length > 0 && activeTab === "alle";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Vorlagen</h1>
        <p className="text-gray-400 mt-1">
          Professionelle Dokumente für Ihre Immobilienverwaltung
        </p>
      </div>

      <div className="bg-white rounded-lg">
        <ScrollableTabNav>
          <div className="flex">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      {!isPremium && activeTab !== "downloads" && (
        <PremiumUpgradePrompt featureKey="wizard_document_creator" />
      )}

      {showDrafts && isPremium && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Entwürfe fortsetzen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drafts.map((draft) => {
              const tpl = wizardTemplates.find((t) => t.id === draft.template_id);
              if (!tpl) return null;
              return (
                <button
                  key={draft.id}
                  onClick={() => startWizard(draft.template_id)}
                  className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left hover:bg-amber-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-amber-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate group-hover:text-amber-800 transition-colors">
                      {tpl.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Zuletzt bearbeitet: {formatDraftDate(draft.updated_at)}
                    </p>
                  </div>
                  <span
                    role="button"
                    title="Entwurf löschen"
                    onClick={(e) => deleteDraft(e, draft.id)}
                    className="p-2 rounded-md text-amber-700/60 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showWizards && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Dokument erstellen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWizards.map((tpl) => {
              const CatIcon =
                CATEGORY_ICON_MAP[tpl.category] || FileText;
              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-lg p-5 hover:shadow-sm transition-all flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full border border-[#DDE7FF] bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                      <CatIcon className="w-4 h-4 text-[#1e1e24]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark text-sm leading-tight">
                        {tpl.title}
                      </h3>
                      {!isPremium && (
                        <Badge variant="pro" size="sm" className="mt-1">
                          Pro
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex-1 mb-4 leading-relaxed">
                    {tpl.description}
                  </p>
                  <Button
                    onClick={() =>
                      isPremium
                        ? startWizard(tpl.id, true)
                        : undefined
                    }
                    disabled={!isPremium}
                    variant="primary"
                    size="sm"
                    className="self-start"
                  >
                    Dokument erstellen
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDownloads && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Vorlagen zum Herunterladen
          </h3>
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredDownloads.map((template) => (
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
                        {template.is_premium ? (
                          <Badge variant="pro" size="sm">
                            Pro
                          </Badge>
                        ) : (
                          <Badge variant="green" size="sm">
                            Kostenlos
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {getFileExtension(template.file_name)}
                        </span>
                        <span className="text-xs text-gray-300">
                          &bull;
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(template.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(template)}
                    disabled={
                      downloading === template.id ||
                      (template.is_premium && !isPremium)
                    }
                    variant={
                      template.is_premium && !isPremium
                        ? "secondary"
                        : "primary"
                    }
                    size="sm"
                  >
                    {downloading === template.id
                      ? "Lädt..."
                      : template.is_premium && !isPremium
                      ? "Pro"
                      : "Herunterladen"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showWizards && !showDownloads && (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Keine Vorlagen gefunden
          </h3>
          <p className="text-gray-400 mb-6">
            In dieser Kategorie sind noch keine Vorlagen vorhanden.
          </p>
          <Button onClick={() => setActiveTab("alle")} variant="primary">
            Alle anzeigen
          </Button>
        </div>
      )}
    </div>
  );
}
