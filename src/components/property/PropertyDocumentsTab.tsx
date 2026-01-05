import { useState, useEffect } from "react";
import { FileText, Lock, Upload, Eye, Calendar, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";

interface PropertyDocumentsTabProps {
  propertyId: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  upload_date: string;
  category: string | null;
}

export default function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isPro) {
      loadDocuments();
    }
  }, [user, propertyId, isPro]);

  async function loadDocuments() {
    try {
      setLoading(true);

      const { data: associations } = await supabase
        .from("document_associations")
        .select("document_id")
        .eq("association_type", "property")
        .eq("association_id", propertyId);

      if (associations && associations.length > 0) {
        const documentIds = associations.map((a) => a.document_id);

        const { data: docs } = await supabase
          .from("documents")
          .select("*")
          .in("id", documentIds)
          .eq("is_archived", false)
          .order("upload_date", { ascending: false });

        if (docs) {
          setDocuments(docs);
        }
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(filePath: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Fehler beim Herunterladen");
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract: "Vertrag",
      invoice: "Rechnung",
      bill: "Abrechnung",
      receipt: "Beleg",
      report: "Bericht",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contract: "bg-blue-100 text-blue-700",
      invoice: "bg-emerald-100 text-emerald-700",
      bill: "bg-orange-100 text-orange-700",
      receipt: "bg-violet-100 text-violet-700",
      report: "bg-gray-100 text-gray-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (!isPro) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">Pro-Funktion</h3>
          <p className="text-gray-600 mb-6">
            Die Dokumentenverwaltung für Immobilien ist im Pro-Tarif verfügbar.
            Upgrade jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-600">
                Upload von Grundrissen und Plänen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-600">
                Energieausweise digital hinterlegen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-600">
                Versicherungsunterlagen zentral verwalten
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <span className="text-sm text-gray-600">
                Alle objektbezogenen Dokumente an einem Ort
              </span>
            </div>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Jetzt auf Pro upgraden
          </button>
        </div>
      </div>
    );
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark">Dokumente</h3>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} Dokument{documents.length !== 1 ? "e" : ""} dieser Immobilie zugeordnet
            </p>
          </div>
          <a
            href="/dashboard?view=documents&tab=upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Dokument hochladen
          </a>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Noch keine Dokumente für diese Immobilie</p>
            <p className="text-sm text-gray-400">
              Laden Sie Dokumente hoch und ordnen Sie sie dieser Immobilie zu
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumentname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  {documents.some((d) => d.category) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Größe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-dark truncate max-w-xs">
                          {doc.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(
                          doc.document_type
                        )}`}
                      >
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    {documents.some((d) => d.category) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.category || "-"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(doc.upload_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/dashboard?view=documents&document=${doc.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ansehen
                        </a>
                        <button
                          onClick={() => handleDownload(doc.file_path, doc.file_name)}
                          className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">
              Zentrale Dokumentenverwaltung
            </p>
            <p className="text-sm text-blue-700">
              Alle Dokumente werden im zentralen Dokumentenbereich verwaltet. Von hier aus können
              Sie Dokumente dieser Immobilie ansehen und herunterladen. Um neue Dokumente hochzuladen
              oder Zuordnungen zu verwalten, nutzen Sie den Dokumente-Bereich im Hauptmenü.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
