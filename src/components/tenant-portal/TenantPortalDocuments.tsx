import { useState, useEffect } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
  notes: string | null;
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
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .eq("shared_with_tenant", true)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      contract: "Mietvertrag",
      billing: "Abrechnung",
      letter: "Schreiben",
      protocol: "Protokoll",
      other: "Sonstiges",
    };
    return types[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      contract: "bg-blue-100 text-blue-700",
      billing: "bg-emerald-100 text-emerald-700",
      letter: "bg-amber-100 text-amber-700",
      protocol: "bg-purple-100 text-purple-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[type] || colors.other;
  };

  const handleDownload = async (document: Document) => {
    if (document.file_url.startsWith('data:')) {
      const a = window.document.createElement("a");
      a.href = document.file_url;
      a.download = document.document_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } else {
      try {
        const { data, error } = await supabase.storage
          .from("property-documents")
          .download(document.file_url);

        if (error) throw error;

        const url = window.URL.createObjectURL(data);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = document.document_name;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      } catch (error) {
        console.error("Error downloading document:", error);
        alert("Fehler beim Herunterladen des Dokuments");
      }
    }
  };

  const handleView = async (document: Document) => {
    if (document.file_url.startsWith('data:')) {
      window.open(document.file_url, "_blank");
    } else {
      try {
        const { data, error } = await supabase.storage
          .from("property-documents")
          .createSignedUrl(document.file_url, 3600);

        if (error) throw error;

        if (data.signedUrl) {
          window.open(data.signedUrl, "_blank");
        }
      } catch (error) {
        console.error("Error viewing document:", error);
        alert("Fehler beim Öffnen des Dokuments");
      }
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
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-dark">
                    {document.document_name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getDocumentTypeColor(document.document_type)}`}
                  >
                    {getDocumentTypeLabel(document.document_type)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Hochgeladen am {formatDate(document.uploaded_at)}
                </p>
                {document.notes && (
                  <p className="text-sm text-gray-400 mt-2">
                    {document.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleView(document)}
                className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                title="Anzeigen"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDownload(document)}
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
