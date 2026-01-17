import { useState, useEffect, useRef } from "react";
import { FileText, Lock, Upload, Eye, Calendar, Download, X, Image, FileCheck, Shield, Home, FileSignature, Receipt, Wrench, Plus, Trash2, AlertCircle } from "lucide-react";
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
  description: string | null;
  unit_id: string | null;
  property_units?: {
    unit_number: string;
  };
}

interface DocumentCategory {
  id: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  documents: Document[];
  types: string[];
}

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [units, setUnits] = useState<{ id: string; unit_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("floor_plan");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [sharedWithTenant, setSharedWithTenant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (user && isPro) {
      loadDocuments();
      loadUnits();
    }
  }, [user, propertyId, isPro]);

  async function loadUnits() {
    try {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_number")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (data) {
        setUnits(data);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  async function loadDocuments() {
    try {
      setLoading(true);

      const { data: associations } = await supabase
        .from("document_associations")
        .select("document_id, association_id, association_type")
        .eq("association_type", "property")
        .eq("association_id", propertyId);

      if (associations && associations.length > 0) {
        const documentIds = associations.map((a) => a.document_id);

        const { data: docs } = await supabase
          .from("documents")
          .select("*")
          .in("id", documentIds)
          .eq("is_archived", false)
          .order("upload_date", { ascending: false});

        if (docs) {
          const { data: unitAssociations } = await supabase
            .from("document_associations")
            .select("document_id, association_id")
            .eq("association_type", "unit")
            .in("document_id", documentIds);

          const unitIds = unitAssociations?.map(ua => ua.association_id) || [];

          let unitsMap: Record<string, string> = {};
          if (unitIds.length > 0) {
            const { data: unitsData } = await supabase
              .from("property_units")
              .select("id, unit_number")
              .in("id", unitIds);

            if (unitsData) {
              unitsMap = Object.fromEntries(unitsData.map(u => [u.id, u.unit_number]));
            }
          }

          const docsWithUnits = docs.map(doc => {
            const unitAssoc = unitAssociations?.find(ua => ua.document_id === doc.id);
            return {
              ...doc,
              unit_id: unitAssoc?.association_id || null,
              property_units: unitAssoc && unitsMap[unitAssoc.association_id]
                ? { unit_number: unitsMap[unitAssoc.association_id] }
                : undefined
            };
          });

          setDocuments(docsWithUnits);
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

  async function handleDelete(documentId: string) {
    if (!confirm("Möchten Sie dieses Dokument wirklich löschen?")) return;

    try {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc) return;

      await supabase.storage.from("documents").remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", documentId);

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Fehler beim Löschen");
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFilesArray = Array.from(selectedFiles);
    const maxFiles = isPro ? 10 : 3;

    if (uploadFiles.length + newFilesArray.length > maxFiles) {
      alert(`Sie können maximal ${maxFiles} Dateien auf einmal hochladen.`);
      return;
    }

    const newFiles: UploadFile[] = newFilesArray.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    if (!user) return false;

    try {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f
        )
      );

      const fileExt = uploadFile.file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, uploadFile.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: uploadFile.file.name,
          file_path: fileName,
          file_size: uploadFile.file.size,
          file_type: uploadFile.file.type,
          document_type: selectedDocType,
          description: uploadDescription || null,
          shared_with_tenant: sharedWithTenant,
        })
        .select()
        .single();

      if (docError) {
        await supabase.storage.from("documents").remove([fileName]);
        throw docError;
      }

      if (docData) {
        await supabase.from("document_associations").insert({
          document_id: docData.id,
          association_type: "property",
          association_id: propertyId,
          created_by: user.id,
        });

        if (selectedUnitId) {
          await supabase.from("document_associations").insert({
            document_id: docData.id,
            association_type: "unit",
            association_id: selectedUnitId,
            created_by: user.id,
          });
        }
      }

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "success" as const } : f
        )
      );

      return true;
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: error.message || "Upload fehlgeschlagen",
              }
            : f
        )
      );
      return false;
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    try {
      const results = await Promise.all(uploadFiles.map((file) => uploadFile(file)));
      const allSuccess = results.every((r) => r === true);

      if (allSuccess) {
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFiles([]);
          setSelectedDocType("floor_plan");
          setSelectedUnitId("");
          setUploadDescription("");
          setSharedWithTenant(false);
          loadDocuments();
        }, 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Fehler beim Hochladen der Dateien");
    } finally {
      setIsUploading(false);
    }
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

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      floor_plan: "Grundriss",
      energy_certificate: "Energieausweis",
      insurance: "Versicherung",
      property_deed: "Grundbuchauszug",
      rental_agreement: "Mietvertrag",
      utility_bill: "Nebenkostenabrechnung",
      maintenance: "Wartung",
      photo: "Foto",
      blueprint: "Bauplan",
      expose: "Exposé",
      contract: "Vertrag",
      invoice: "Rechnung",
      bill: "Abrechnung",
      receipt: "Beleg",
      report: "Bericht",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!filterDateFrom && !filterDateTo) return true;

    const uploadDate = new Date(doc.upload_date);
    const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
    const toDate = filterDateTo ? new Date(filterDateTo) : null;

    if (fromDate && uploadDate < fromDate) return false;
    if (toDate && uploadDate > toDate) return false;

    return true;
  });

  const categories: DocumentCategory[] = [
    {
      id: "floor_plans",
      title: "Grundrisse & Pläne",
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      documents: filteredDocuments.filter((d) => ["floor_plan", "blueprint", "expose"].includes(d.document_type)),
      types: ["floor_plan", "blueprint", "expose"],
    },
    {
      id: "certificates",
      title: "Energieausweise",
      icon: FileCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      documents: filteredDocuments.filter((d) => d.document_type === "energy_certificate"),
      types: ["energy_certificate"],
    },
    {
      id: "insurance",
      title: "Versicherungen",
      icon: Shield,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      documents: filteredDocuments.filter((d) => d.document_type === "insurance"),
      types: ["insurance"],
    },
    {
      id: "contracts",
      title: "Verträge & Urkunden",
      icon: FileSignature,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      documents: filteredDocuments.filter((d) =>
        ["property_deed", "rental_agreement", "contract"].includes(d.document_type)
      ),
      types: ["property_deed", "rental_agreement", "contract"],
    },
    {
      id: "bills",
      title: "Rechnungen & Abrechnungen",
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      documents: filteredDocuments.filter((d) =>
        ["utility_bill", "invoice", "bill", "receipt"].includes(d.document_type)
      ),
      types: ["utility_bill", "invoice", "bill", "receipt"],
    },
    {
      id: "maintenance",
      title: "Wartung & Instandhaltung",
      icon: Wrench,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      documents: filteredDocuments.filter((d) => d.document_type === "maintenance"),
      types: ["maintenance"],
    },
    {
      id: "photos",
      title: "Fotos",
      icon: Image,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      documents: filteredDocuments.filter((d) => d.document_type === "photo"),
      types: ["photo"],
    },
    {
      id: "other",
      title: "Sonstige Dokumente",
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      documents: filteredDocuments.filter((d) =>
        ["other", "report"].includes(d.document_type)
      ),
      types: ["other", "report"],
    },
  ];

  const allSuccess = uploadFiles.length > 0 && uploadFiles.every((f) => f.status === "success");

  if (!isPro) {
    return (
      <div className="bg-white rounded-lg p-8">
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
          <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dark">Dokumente</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filteredDocuments.length} von {documents.length} Dokument{documents.length !== 1 ? "en" : ""} {filterDateFrom || filterDateTo ? "gefiltert" : "gespeichert"}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dokument hochladen
          </button>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Von</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bis</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Noch keine Dokumente für diese Immobilie</p>
          <p className="text-sm text-gray-400 mb-4">
            Laden Sie Grundrisse, Energieausweise, Versicherungen und mehr hoch
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Erstes Dokument hochladen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const hasDocuments = category.documents.length > 0;
            const isEnergyCertificate = category.id === "certificates";

            if (!hasDocuments && !isEnergyCertificate) return null;

            return (
              <div key={category.id} className="bg-white rounded-lg">
                <div className={`${category.bgColor} px-4 py-3 border-b border-gray-200 flex items-center gap-3 rounded-t-lg`}>
                  <Icon className={`w-5 h-5 ${category.color}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-dark">{category.title}</h4>
                    <p className="text-xs text-gray-500">{category.documents.length} Dokument{category.documents.length !== 1 ? "e" : ""}</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {hasDocuments ? (
                    category.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className={`w-4 h-4 ${category.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">
                            {doc.file_name}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.upload_date)}</span>
                            {doc.property_units && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">Einheit {doc.property_units.unit_number}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleDownload(doc.file_path, doc.file_name)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Herunterladen"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEnergyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-dark">Bedarfsausweis mit 20% Rabatt</h3>
              <button
                onClick={() => setShowEnergyModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Für Ihre Immobilie ist zwingend nach <strong>§80 GEG – Energieausweispflicht</strong> ein Bedarfs- oder Verbrauchausweis erforderlich, mit rentably erhalten Sie 20% Rabatt beliebig viele Energieausweise.
              </p>

              <p className="text-gray-600">
                Kopieren Sie den Code und füllen Sie bei unserem Partner McEnergieausweis das Formular aus. Am Ende des Formulars geben Sie den Code ein. Sie können diesen Code jederzeit in rentably einsehen und kopieren, der Code ist bis zum 31.12.2026 gültig.
              </p>

              <div className="text-center my-6">
                <img
                  src="/mcmakler_energieausweis_logo_rgb.svg"
                  alt="McEnergieausweis Logo"
                  className="mx-auto h-20"
                />
              </div>

              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-3 tracking-wider">
                  RET-736AD5
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("RET-736AD5");
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      Code kopiert
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Code kopieren
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-end">
              <a
                href="https://mcenergieausweis.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
              >
                Zu McEnergieausweis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">Dokumente hochladen</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setSelectedDocType("floor_plan");
                  setSelectedUnitId("");
                  setUploadDescription("");
                  setSharedWithTenant(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dokumenttyp <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <optgroup label="Grundrisse & Pläne">
                    <option value="floor_plan">Grundriss</option>
                    <option value="blueprint">Bauplan</option>
                    <option value="expose">Exposé</option>
                  </optgroup>
                  <optgroup label="Zertifikate">
                    <option value="energy_certificate">Energieausweis</option>
                  </optgroup>
                  <optgroup label="Versicherungen">
                    <option value="insurance">Versicherung</option>
                  </optgroup>
                  <optgroup label="Verträge & Urkunden">
                    <option value="property_deed">Grundbuchauszug/Kaufvertrag</option>
                    <option value="rental_agreement">Mietvertrag</option>
                    <option value="contract">Vertrag (Sonstige)</option>
                  </optgroup>
                  <optgroup label="Rechnungen">
                    <option value="utility_bill">Nebenkostenabrechnung</option>
                    <option value="invoice">Rechnung</option>
                    <option value="bill">Abrechnung</option>
                    <option value="receipt">Beleg</option>
                  </optgroup>
                  <optgroup label="Wartung">
                    <option value="maintenance">Wartungsunterlagen</option>
                  </optgroup>
                  <optgroup label="Medien">
                    <option value="photo">Foto</option>
                  </optgroup>
                  <optgroup label="Sonstiges">
                    <option value="report">Bericht</option>
                    <option value="other">Sonstiges</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  placeholder="Zusätzliche Informationen zum Dokument"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {units.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mieteinheit (Optional)
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Keine Einheit - für gesamte Immobilie</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Wählen Sie optional eine Einheit, falls das Dokument nur für diese relevant ist
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="shared_with_tenant"
                    checked={sharedWithTenant}
                    onChange={(e) => setSharedWithTenant(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="shared_with_tenant"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      Im Mieterportal unter "Dokumente" anzeigen
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Wenn aktiviert, können Mieter der ausgewählten Einheit dieses Dokument in ihrem Portal einsehen
                    </p>
                  </div>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400"
                }`}
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  Dateien hierher ziehen oder klicken Sie auf den Button
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Mehrere Dateien werden unterstützt (max. {isPro ? "10" : "3"})
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Dateien auswählen
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Ausgewählte Dateien ({uploadFiles.length})
                  </h4>
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark truncate">
                            {file.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file.size)}
                            {file.status === "uploading" && " • Wird hochgeladen..."}
                            {file.status === "success" && " • Erfolgreich"}
                            {file.status === "error" && ` • ${file.error}`}
                          </p>
                        </div>
                      </div>
                      {file.status === "pending" && (
                        <button
                          onClick={() => removeUploadFile(file.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      {file.status === "success" && (
                        <div className="text-emerald-600 flex-shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                      )}
                      {file.status === "error" && (
                        <div className="text-red-600 flex-shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                    setSelectedDocType("floor_plan");
                    setSelectedUnitId("");
                    setUploadDescription("");
                  }}
                  style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                  className="px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || isUploading || allSuccess}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    uploadFiles.length === 0 || isUploading || allSuccess
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Wird hochgeladen...
                    </>
                  ) : allSuccess ? (
                    <>
                      <FileCheck className="w-4 h-4" />
                      Erfolgreich
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Hochladen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
