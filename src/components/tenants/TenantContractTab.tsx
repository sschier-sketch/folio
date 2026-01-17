import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Download, Lock, X, Trash2, Eye, Calendar, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import DocumentDetails from "../documents/DocumentDetails";

interface TenantContractTabProps {
  tenantId: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  upload_date: string;
  category: string | null;
  description: string | null;
}

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function TenantContractTab({
  tenantId,
}: TenantContractTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("contract");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [shareWithTenant, setShareWithTenant] = useState(true);
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    if (user && tenantId) {
      if (isPremium) {
        loadTenantContractAndDocuments();
      } else {
        setLoading(false);
      }
    }
  }, [user, tenantId, isPremium]);

  async function loadTenantContractAndDocuments() {
    try {
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("contract_id")
        .eq("id", tenantId)
        .maybeSingle();

      if (!tenantData?.contract_id) {
        setContractId(null);
        setDocuments([]);
        return;
      }

      setContractId(tenantData.contract_id);

      const { data: associations } = await supabase
        .from("document_associations")
        .select("document_id, association_id, association_type")
        .eq("association_type", "rental_contract")
        .eq("association_id", tenantData.contract_id);

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
        } else {
          setDocuments([]);
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

  async function loadDocuments() {
    if (!contractId) return;

    try {
      setLoading(true);

      const { data: associations } = await supabase
        .from("document_associations")
        .select("document_id, association_id, association_type")
        .eq("association_type", "rental_contract")
        .eq("association_id", contractId);

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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending" as const,
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  async function handleUpload() {
    if (!user || uploadFiles.length === 0 || !contractId) return;

    setIsUploading(true);
    const results: { id: string; success: boolean }[] = [];

    for (const uploadFile of uploadFiles) {
      try {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "uploading" } : f
          )
        );

        const fileExt = uploadFile.file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert([
            {
              user_id: user.id,
              file_name: uploadFile.file.name,
              file_path: filePath,
              file_type: uploadFile.file.type || 'application/octet-stream',
              document_type: selectedDocType,
              file_size: uploadFile.file.size,
              category: null,
              description: uploadDescription || null,
              shared_with_tenant: shareWithTenant,
            },
          ])
          .select()
          .single();

        if (docError) throw docError;

        const { error: assocError } = await supabase.from("document_associations").insert([
          {
            document_id: docData.id,
            association_type: "rental_contract",
            association_id: contractId,
            created_by: user.id,
          },
        ]);

        if (assocError) throw assocError;

        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "success" } : f
          )
        );
        results.push({ id: uploadFile.id, success: true });
      } catch (error: any) {
        console.error("Error uploading file:", error);
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
        results.push({ id: uploadFile.id, success: false });
      }
    }

    setIsUploading(false);
    await loadDocuments();

    const allSuccessful = results.every((r) => r.success);

    if (allSuccessful) {
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescription("");
      setSelectedDocType("contract");
      setShareWithTenant(true);
    }
  }

  async function handleDownload(filePath: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Fehler beim Herunterladen der Datei");
    }
  }

  async function handleDelete(documentId: string, filePath: string) {
    if (!confirm("Möchten Sie dieses Dokument wirklich löschen?")) return;

    try {
      await supabase.storage.from("documents").remove([filePath]);

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      await loadDocuments();
      alert("Dokument erfolgreich gelöscht");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Fehler beim Löschen des Dokuments");
    }
  }

  function handleViewDocument(documentId: string) {
    setSelectedDocumentId(documentId);
  }

  function handleBackFromDetails() {
    setSelectedDocumentId(null);
    loadDocuments();
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "contract":
        return "Vertrag";
      case "rental_agreement":
        return "Mietvertrag";
      case "invoice":
        return "Rechnung";
      case "receipt":
        return "Quittung";
      case "report":
        return "Bericht";
      case "main_contract":
        return "Hauptvertrag";
      case "amendment":
        return "Nachtrag";
      case "addendum":
        return "Zusatzvereinbarung";
      case "termination":
        return "Kündigung";
      case "protocol":
        return "Protokoll";
      case "correspondence":
        return "Schriftverkehr";
      case "other":
        return "Sonstiges";
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (selectedDocumentId) {
    return (
      <DocumentDetails
        documentId={selectedDocumentId}
        onBack={handleBackFromDetails}
        onUpdate={loadDocuments}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Lädt...</div>;
  }

  if (!contractId) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-400">Kein Mietverhältnis gefunden</p>
        <p className="text-sm text-gray-400 mt-2">
          Dieser Mieter ist keinem aktiven Mietverhältnis zugeordnet.
        </p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">
            Pro-Funktion
          </h3>
          <p className="text-gray-600 mb-6">
            Der Upload und die Verwaltung von Vertragsdokumenten ist im
            Pro-Tarif verfügbar. Upgrade jetzt für:
          </p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Upload von Mietverträgen und Nachträgen
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Sichere Dokumentenverwaltung
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Zentrale Ablage aller Vertragsdokumente
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary-blue mt-0.5" />
              <span className="text-sm text-gray-600">
                Kategorisierung und Suchfunktion
              </span>
            </div>
          </div>
          <button className="px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors">
            Jetzt upgraden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark">
              Dokumente zum Mietverhältnis
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Hier werden alle Dokumente angezeigt, die diesem Mietverhältnis zugeordnet sind
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Upload className="w-4 h-4" />
            Dokument hochladen
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Keine Dokumente vorhanden</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Erstes Dokument hochladen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Dokumentname
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Typ
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Größe
                  </th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                    Hochgeladen
                  </th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-dark">{doc.file_name}</div>
                          {doc.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(doc.upload_date)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc.id);
                          }}
                          className="text-gray-300 hover:text-primary-blue transition-colors"
                          title="Ansehen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.file_path, doc.file_name);
                          }}
                          className="text-gray-300 hover:text-primary-blue transition-colors"
                          title="Herunterladen"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id, doc.file_path);
                          }}
                          className="text-gray-300 hover:text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-dark">Dokument zum Mietverhältnis hochladen</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Das Dokument wird automatisch diesem Mietverhältnis zugeordnet
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setUploadDescription("");
                }}
                className="text-gray-300 hover:text-gray-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dokumenttyp *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="contract">Hauptvertrag</option>
                  <option value="rental_agreement">Mietvertrag</option>
                  <option value="invoice">Rechnung</option>
                  <option value="receipt">Quittung</option>
                  <option value="report">Bericht</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung (optional)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Mietvertrag vom 01.01.2024"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="share_with_tenant"
                    checked={shareWithTenant}
                    onChange={(e) => setShareWithTenant(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Im Mieterportal zur Verfügung stellen
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Alle Mieter dieses Mietverhältnisses können das Dokument in ihrem Portal einsehen und herunterladen
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datei(en) auswählen *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary-blue bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Dateien hier ablegen oder
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
                  >
                    Datei auswählen
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF, Word, Bilder (max. 10 MB pro Datei)
                  </p>
                </div>
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ausgewählte Dateien ({uploadFiles.length})
                  </label>
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">
                          {file.file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({formatFileSize(file.file.size)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "success" && (
                          <span className="text-emerald-600 text-xs font-medium">
                            Erfolgreich
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="text-red-600 text-xs font-medium">
                            Fehler
                          </span>
                        )}
                        {file.status === "uploading" && (
                          <span className="text-blue-600 text-xs font-medium">
                            Lädt...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === "uploading"}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setUploadDescription("");
                }}
                disabled={isUploading}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || uploadFiles.length === 0}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50"
              >
                {isUploading ? "Lädt hoch..." : "Hochladen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
