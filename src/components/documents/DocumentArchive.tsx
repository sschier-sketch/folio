import { useState, useEffect } from "react";
import { Archive, RotateCcw, Eye, Calendar, FileText, Lock, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import DocumentFeatureGuard from "./DocumentFeatureGuard";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  upload_date: string;
  file_size: number;
  created_at: string;
}

interface DocumentArchiveProps {
  onDocumentClick: (documentId: string) => void;
}

export default function DocumentArchive({ onDocumentClick }: DocumentArchiveProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadArchivedDocuments();
    }
  }, [user]);

  async function loadArchivedDocuments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error loading archived documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(documentId: string) {
    if (!isPro) {
      alert("Das Wiederherstellen von archivierten Dokumenten ist ein Pro Feature.");
      return;
    }

    if (!confirm("Möchten Sie dieses Dokument wiederherstellen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .update({ is_archived: false })
        .eq("id", documentId);

      if (error) throw error;

      loadArchivedDocuments();
    } catch (error) {
      console.error("Error restoring document:", error);
      alert("Fehler beim Wiederherstellen");
    }
  }

  async function handleDelete(documentId: string, filePath: string) {
    if (!isPro) {
      alert("Das endgültige Löschen von archivierten Dokumenten ist ein Pro Feature.");
      return;
    }

    if (
      !confirm(
        "Möchten Sie dieses Dokument endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    try {
      await supabase.storage.from("documents").remove([filePath]);

      const { error } = await supabase.from("documents").delete().eq("id", documentId);

      if (error) throw error;

      loadArchivedDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Fehler beim Löschen");
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
          <Archive className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Archivierte Dokumente</h3>
            <p className="text-sm text-blue-700">
              Archivierte Dokumente sind schreibgeschützt und werden in der normalen Dokumentenliste
              nicht angezeigt. Sie können diese jederzeit wiederherstellen oder endgültig löschen.
            </p>
            {!isPro && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                Mit Pro können Sie Dokumente wiederherstellen und endgültig löschen.
              </p>
            )}
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">Kein Archiv vorhanden</h3>
          <p className="text-gray-500">
            Sie haben noch keine Dokumente archiviert. Archivierte Dokumente erscheinen hier.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dokumentname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archiviert am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Größe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(doc.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDocumentClick(doc.id)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Ansehen</span>
                        </button>

                        <DocumentFeatureGuard
                          feature="restore-archived"
                          fallback={
                            <button
                              disabled
                              className="text-gray-400 cursor-not-allowed inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span className="hidden sm:inline">Wiederherstellen</span>
                              <Lock className="w-3 h-3 sm:hidden" />
                            </button>
                          }
                        >
                          <button
                            onClick={() => handleRestore(doc.id)}
                            className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Wiederherstellen</span>
                          </button>
                        </DocumentFeatureGuard>

                        <DocumentFeatureGuard
                          feature="delete-archived"
                          fallback={
                            <button
                              disabled
                              className="text-gray-400 cursor-not-allowed inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <Lock className="w-3 h-3 sm:hidden" />
                            </button>
                          }
                        >
                          <button
                            onClick={() => handleDelete(doc.id, doc.file_path)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </DocumentFeatureGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center">
        {documents.length} archivierte{documents.length !== 1 ? "s" : ""} Dokument
        {documents.length !== 1 ? "e" : ""}
      </div>

      {!isPro && documents.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark mb-2">
                Erweiterte Archivverwaltung mit Pro
              </h3>
              <p className="text-gray-600 mb-4">
                Erhalten Sie volle Kontrolle über Ihre archivierten Dokumente mit Pro:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Dokumente jederzeit wiederherstellen
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Archivierte Dokumente endgültig löschen
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Rechtssichere Aufbewahrung mit Änderungsverlauf
                </li>
              </ul>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Jetzt auf Pro upgraden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
