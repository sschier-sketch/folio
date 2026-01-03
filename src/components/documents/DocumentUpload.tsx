import { useState, useEffect, useRef } from "react";
import { Upload, X, FileText, Lock, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import DocumentFeatureGuard from "./DocumentFeatureGuard";

interface DocumentUploadProps {
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [documentType, setDocumentType] = useState("other");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [associationType, setAssociationType] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferences();
    }
  }, [user]);

  async function loadReferences() {
    try {
      const [propsRes, tenantsRes] = await Promise.all([
        supabase.from("properties").select("id, name").order("name"),
        supabase.from("tenants").select("id, name").order("name"),
      ]);

      if (propsRes.data) setProperties(propsRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Error loading references:", error);
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const maxFiles = isPro ? 10 : 1;
    const currentCount = files.length;
    const newFilesArray = Array.from(selectedFiles);

    if (currentCount + newFilesArray.length > maxFiles) {
      alert(
        isPro
          ? `Sie können maximal ${maxFiles} Dateien auf einmal hochladen.`
          : "Upgraden Sie auf Pro, um mehrere Dateien gleichzeitig hochzuladen."
      );
      return;
    }

    const newFiles: UploadFile[] = newFilesArray.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (!isPro) {
      alert("Drag & Drop ist ein Pro Feature. Nutzen Sie den Upload-Button oder upgraden Sie auf Pro.");
      return;
    }

    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isPro) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<string | null> => {
    if (!user) return null;

    try {
      setFiles((prev) =>
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
          document_type: documentType,
          category: category || null,
          description: description || null,
        })
        .select()
        .single();

      if (docError) throw docError;

      if (associationType && associationId && docData) {
        await supabase.from("document_associations").insert({
          document_id: docData.id,
          association_type: associationType,
          association_id: associationId,
          created_by: user.id,
        });
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "success" as const, progress: 100 }
            : f
        )
      );

      return docData.id;
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: "Upload fehlgeschlagen",
              }
            : f
        )
      );
      return null;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Bitte wählen Sie mindestens eine Datei aus.");
      return;
    }

    setIsUploading(true);

    try {
      await Promise.all(files.map((file) => uploadFile(file)));

      const hasErrors = files.some((f) => f.status === "error");

      if (!hasErrors) {
        setTimeout(() => {
          onSuccess();
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

  const allSuccess = files.length > 0 && files.every((f) => f.status === "success");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-dark mb-4">Dateien auswählen</h2>

        <DocumentFeatureGuard
          feature="drag-drop-upload"
          fallback={
            <div className="relative">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 relative"
              >
                <div className="absolute inset-0 bg-white bg-opacity-60 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Drag & Drop mit Pro freischalten
                    </p>
                  </div>
                </div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Dateien hierher ziehen</p>
                <p className="text-sm text-gray-400">Nur mit Pro verfügbar</p>
              </div>
            </div>
          }
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Dateien hierher ziehen oder klicken Sie auf den Button
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {isPro
                ? "Mehrere Dateien werden unterstützt"
                : "Nur eine Datei pro Upload (Pro: Mehrfach-Upload)"}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Dateien auswählen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={isPro}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.csv"
            />
          </div>
        </DocumentFeatureGuard>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Ausgewählte Dateien ({files.length})
            </h3>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {file.status === "success" ? (
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : file.status === "error" ? (
                    <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
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
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-dark mb-4">Dokumentinformationen</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dokumenttyp <span className="text-red-500">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="contract">Vertrag</option>
              <option value="invoice">Rechnung</option>
              <option value="bill">Abrechnung</option>
              <option value="receipt">Beleg</option>
              <option value="report">Bericht</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <DocumentFeatureGuard
            feature="document-category"
            fallback={
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    placeholder="Pro Feature"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            }
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie (Optional)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="z.B. Steuer, Versicherung, Wartung"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </DocumentFeatureGuard>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Zusätzliche Informationen zum Dokument"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <DocumentFeatureGuard
        feature="upload-with-assignment"
        fallback={
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 relative">
            <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Pro Feature</p>
                <p className="text-xs text-gray-500 mt-1">
                  Direkte Zuordnung beim Upload mit Pro
                </p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-dark mb-4">Zuordnung (Optional)</h2>
            <div className="space-y-4 blur-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Keine Zuordnung</option>
                </select>
              </div>
            </div>
          </div>
        }
      >
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-dark mb-4">Zuordnung (Optional)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zuordnungstyp
              </label>
              <select
                value={associationType}
                onChange={(e) => {
                  setAssociationType(e.target.value);
                  setAssociationId("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Keine Zuordnung</option>
                <option value="property">Immobilie</option>
                <option value="tenant">Mieter</option>
              </select>
            </div>

            {associationType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objekt auswählen
                </label>
                <select
                  value={associationId}
                  onChange={(e) => setAssociationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Bitte wählen...</option>
                  {associationType === "property" &&
                    properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  {associationType === "tenant" &&
                    tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </DocumentFeatureGuard>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {files.length > 0
            ? `${files.length} Datei${files.length !== 1 ? "en" : ""} bereit zum Upload`
            : "Keine Dateien ausgewählt"}
        </p>

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || allSuccess}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            files.length === 0 || isUploading || allSuccess
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
              <Check className="w-4 h-4" />
              Erfolgreich hochgeladen
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Jetzt hochladen
            </>
          )}
        </button>
      </div>
    </div>
  );
}
