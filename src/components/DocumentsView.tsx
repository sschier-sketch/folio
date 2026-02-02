import { useState } from "react";
import { FileText, List, Upload, Archive, Eye } from "lucide-react";
import DocumentsOverview from "./documents/DocumentsOverview";
import DocumentsList from "./documents/DocumentsList";
import DocumentUpload from "./documents/DocumentUpload";
import DocumentArchive from "./documents/DocumentArchive";
import DocumentDetails from "./documents/DocumentDetails";
import ScrollableTabNav from "./common/ScrollableTabNav";
import Badge from "./common/Badge";
import { useSubscription } from "../hooks/useSubscription";
import { PremiumUpgradePrompt } from "./PremiumUpgradePrompt";

type Tab = "overview" | "list" | "upload" | "archive";

export default function DocumentsView() {
  const { isPro } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: "overview" as Tab, label: "Übersicht", icon: Eye, isPro: false },
    { id: "list" as Tab, label: "Dokumentenliste", icon: List, isPro: false },
    { id: "upload" as Tab, label: "Upload", icon: Upload, isPro: false },
    { id: "archive" as Tab, label: "Archiv", icon: Archive, isPro: true },
  ];

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  const handleBackFromDetails = () => {
    setSelectedDocumentId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab("list");
  };

  if (selectedDocumentId) {
    return (
      <DocumentDetails
        documentId={selectedDocumentId}
        onBack={handleBackFromDetails}
        onUpdate={() => setRefreshTrigger(prev => prev + 1)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Dokumente</h1>
          <p className="text-gray-400 mt-1">
            Zentrales Dokumentenmanagement für alle Immobilien und Mietverhältnisse
          </p>
        </div>
        <button
          onClick={() => setActiveTab("upload")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Dokument hochladen
        </button>
      </div>

      <div className="bg-white rounded-lg mb-6">
        <ScrollableTabNav>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isDisabled = tab.isPro && !isPro;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isDisabled) {
                      alert("Das Archiv ist ein Pro Feature. Upgraden Sie auf Pro, um auf das Archiv zuzugreifen.");
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap text-sm ${
                    isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : activeTab === tab.id
                      ? "text-primary-blue"
                      : "text-gray-400 hover:text-dark"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  {tab.isPro && (
                    <Badge variant="pro" size="sm">Pro</Badge>
                  )}
                  {activeTab === tab.id && !isDisabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableTabNav>
      </div>

      <div>
        {activeTab === "overview" && (
          <DocumentsOverview
            key={refreshTrigger}
            onNavigateToUpload={() => setActiveTab("upload")}
            onNavigateToList={() => setActiveTab("list")}
          />
        )}
        {activeTab === "list" && (
          <DocumentsList
            key={refreshTrigger}
            onDocumentClick={handleDocumentClick}
          />
        )}
        {activeTab === "upload" && (
          <DocumentUpload
            key={refreshTrigger}
            onSuccess={handleUploadSuccess}
          />
        )}
        {activeTab === "archive" && isPro && (
          <DocumentArchive
            key={refreshTrigger}
            onDocumentClick={handleDocumentClick}
          />
        )}
        {activeTab === "archive" && !isPro && (
          <PremiumUpgradePrompt featureKey="documents_archive" />
        )}
      </div>
    </div>
  );
}
