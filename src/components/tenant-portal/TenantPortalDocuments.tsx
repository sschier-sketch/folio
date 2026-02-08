import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getDocumentTypeLabel as sharedGetDocumentTypeLabel, getDocumentTypeColor as sharedGetDocumentTypeColor } from "../../lib/documentTypes";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  description: string | null;
  upload_date: string;
}

interface TenantPortalDocumentsProps {
  tenantId: string;
  propertyId: string;
}

export default function TenantPortalDocuments({
  tenantId,
  propertyId,
}: TenantPortalDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [tenantId, propertyId]);

  const loadDocuments = async () => {
    try {
      console.log("[TenantPortalDocuments] Loading documents for tenant:", tenantId);

      const { data, error } = await supabase
        .rpc("get_tenant_documents", { tenant_id_param: tenantId });

      if (error) {
        console.error("[TenantPortalDocuments] Error loading documents:", error);
        throw error;
      }

      console.log("[TenantPortalDocuments] Documents loaded:", data);
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = sharedGetDocumentTypeLabel;
  const getDocumentTypeColor = sharedGetDocumentTypeColor;

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Fehler beim Herunterladen des Dokuments");
    }
  };

  const handleView = async (document: Document) => {
    try {
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(document.file_path);

      if (publicUrlData.publicUrl) {
        window.open(publicUrlData.publicUrl, "_blank");
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      alert("Fehler beim Öffnen des Dokuments");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-dark mb-2">
          Keine Dokumente
        </h3>
        <p className="text-gray-400">
          Es wurden noch keine Dokumente für Sie bereitgestellt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <div
          key={document.id}
          onClick={() => handleView(document)}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-dark">
                    {document.file_name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(document.document_type)}`}
                  >
                    {getDocumentTypeLabel(document.document_type)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Hochgeladen am {formatDate(document.upload_date)}
                </p>
                {document.description && (
                  <p className="text-sm text-gray-400 mt-2">
                    {document.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(document);
                }}
                className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                title="Herunterladen"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
