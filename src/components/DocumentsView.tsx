import { useState } from "react";
import { FileText, List, Upload, Archive, Eye } from "lucide-react";
import DocumentsOverview from "./documents/DocumentsOverview";
import DocumentsList from "./documents/DocumentsList";
import DocumentUpload from "./documents/DocumentUpload";
import DocumentArchive from "./documents/DocumentArchive";
import DocumentDetails from "./documents/DocumentDetails";

type Tab = "overview" | "list" | "upload" | "archive";

export default function DocumentsView() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: "overview" as Tab, label: "Übersicht", icon: Eye },
    { id: "list" as Tab, label: "Dokumentenliste", icon: List },
    { id: "upload" as Tab, label: "Upload", icon: Upload },
    { id: "archive" as Tab, label: "Archiv", icon: Archive },
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Dokument hochladen
        </button>
      </div>

      <div>
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
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
        {activeTab === "archive" && (
          <DocumentArchive
            key={refreshTrigger}
            onDocumentClick={handleDocumentClick}
          />
        )}
      </div>
    </div>
  );
}
