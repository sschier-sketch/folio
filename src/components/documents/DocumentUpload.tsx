import { useState, useEffect, useRef } from "react";
import { Upload, X, FileText, Lock, Check, AlertCircle } from "lucide-react";
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

const FREE_STORAGE_LIMIT = 200 * 1024 * 1024;
const PRO_STORAGE_LIMIT = 2 * 1024 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [documentType, setDocumentType] = useState("other");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [associationType, setAssociationType] = useState("");
  const [associationId, setAssociationId] = useState("");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; unit_number: string; property_id: string }[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedPropertyForUnit, setSelectedPropertyForUnit] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStorageUsed, setCurrentStorageUsed] = useState(0);
  const [storageError, setStorageError] = useState("");
  const [sharedWithTenant, setSharedWithTenant] = useState(false);

  const storageLimit = isPro ? PRO_STORAGE_LIMIT : FREE_STORAGE_LIMIT;

  useEffect(() => {
    if (user) {
      loadReferences();
      loadCurrentStorage();
    }
  }, [user]);

  async function loadCurrentStorage() {
    try {
      const { data: documents } = await supabase
        .from("documents")
        .select("file_size")
        .eq("is_archived", false);

      if (documents) {
        const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
        setCurrentStorageUsed(totalSize);
      }
    } catch (error) {
      console.error("Error loading storage:", error);
    }
  }

  async function loadReferences() {
    try {
      const [propsRes, contractsRes, unitsRes, tenantsRes] = await Promise.all([
        supabase.from("properties").select("id, name").order("name"),
        supabase
          .from("rental_contracts")
          .select("id, tenants!contract_id(first_name, last_name)")
          .order("contract_start", { ascending: false }),
        supabase.from("property_units").select("id, unit_number, property_id").order("unit_number"),
        supabase.from("tenants").select("id, first_name, last_name").order("last_name"),
      ]);

      if (propsRes.data) setProperties(propsRes.data);
      if (contractsRes.data) {
        const contractsList = contractsRes.data.map((c: any) => {
          const tenantNames = c.tenants?.map((t: any) => `${t.first_name} ${t.last_name}`).join(", ") || "Unbekannter Mieter";
          return {
            id: c.id,
            name: tenantNames,
          };
        });
        setContracts(contractsList);
      }
      if (unitsRes.data) setUnits(unitsRes.data);
      if (tenantsRes.data) {
        const tenantsList = tenantsRes.data.map((t) => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`,
        }));
        setTenants(tenantsList);
      }
    } catch (error) {
      console.error("Error loading references:", error);
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setStorageError("");

    const maxFiles = isPro ? 10 : 1;
    const currentCount = files.length;
    const newFilesArray = Array.from(selectedFiles);

    if (currentCount > 0 && !isPro) {
      alert("Free-Nutzer können nur eine Datei pro Upload hochladen. Upgraden Sie auf Pro für Mehrfach-Upload.");
      return;
    }

    if (currentCount + newFilesArray.length > maxFiles) {
      alert(
        isPro
          ? `Sie können maximal ${maxFiles} Dateien auf einmal hochladen.`
          : "Free-Nutzer können nur eine Datei pro Upload hochladen. Upgraden Sie auf Pro für Mehrfach-Upload."
      );
      return;
    }

    const newFilesSize = newFilesArray.reduce((sum, file) => sum + file.size, 0);
    const totalNewSize = currentStorageUsed + newFilesSize;

    if (totalNewSize > storageLimit) {
      const remainingSpace = storageLimit - currentStorageUsed;
      setStorageError(
        `Speicherlimit überschritten! Sie haben noch ${formatFileSize(remainingSpace)} verfügbar. ${
          !isPro ? "Upgraden Sie auf Pro für 2GB Speicher." : ""
        }`
      );
      return;
    }

    for (const file of newFilesArray) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Die Datei "${file.name}" ist zu groß. Maximale Dateigröße: 50MB`);
        return;
      }
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

      const fileExt = uploadFile.file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'file';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, uploadFile.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

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
          document_date: documentDate || null,
          shared_with_tenant: sharedWithTenant,
        })
        .select()
        .single();

      if (docError) {
        await supabase.storage.from("documents").remove([fileName]);
        throw docError;
      }

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

      setCurrentStorageUsed((prev) => prev + uploadFile.file.size);

      return docData.id;
    } catch (error: any) {
      console.error("Upload error:", error);
      setFiles((prev) =>
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
  const storagePercentage = (currentStorageUsed / storageLimit) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark">Speicherplatz</h2>
          {!isPro && (
            <span className="text-xs text-gray-500">Free: 200MB | Pro: 2GB</span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {formatFileSize(currentStorageUsed)} von {formatFileSize(storageLimit)} verwendet
            </span>
            <span className="text-gray-500">{Math.round(storagePercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                storagePercentage > 90
                  ? "bg-red-600"
                  : storagePercentage > 70
                  ? "bg-amber-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            ></div>
          </div>
          {storagePercentage > 80 && (
            <p className="text-xs text-amber-600">
              {storagePercentage > 90
                ? "Speicher fast voll!"
                : "Speicher wird knapp."}{" "}
              {!isPro && (
                <button className="underline hover:text-amber-700">
                  Auf Pro upgraden für 2GB
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {storageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Speicherlimit überschritten</p>
              <p className="text-sm text-red-700 mt-1">{storageError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-dark mb-4">Dateien auswählen</h2>

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
              ? "Mehrere Dateien werden unterstützt (max. 10)"
              : "Eine Datei pro Upload (Pro: bis zu 10 gleichzeitig)"}
          </p>
          <p className="text-xs text-gray-400 mb-4">Maximale Dateigröße: 50MB</p>
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
            multiple={isPro}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.csv"
          />
        </div>

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

      <div className="bg-white rounded-lg p-6 border border-gray-100">
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

          <DocumentFeatureGuard
            feature="document-date"
            fallback={
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dokumentdatum
                </label>
                <div className="relative">
                  <input
                    type="date"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pro Feature: Geben Sie das tatsächliche Datum des Dokuments an
                </p>
              </div>
            }
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumentdatum (Optional)
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Z.B. Rechnungsdatum, Vertragsdatum (nicht Upload-Datum)
              </p>
            </div>
          </DocumentFeatureGuard>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sharedWithTenant}
                onChange={(e) => setSharedWithTenant(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Im Mieterportal zur Verfügung stellen
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {associationType === 'tenant' && associationId
                    ? 'Wenn Sie einen Mieter zuordnen, sieht nur dieser Mieter das Dokument in seinem Portal.'
                    : 'Alle Mieter können dieses Dokument in ihrem Portal einsehen.'}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <DocumentFeatureGuard
        feature="upload-with-assignment"
        fallback={
          <div className="bg-white rounded-lg p-6 border border-gray-100 relative">
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
        <div className="bg-white rounded-lg p-6 border border-gray-100">
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
                  setSelectedPropertyForUnit("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Keine Zuordnung</option>
                <option value="property">Immobilie</option>
                <option value="unit">Einheit</option>
                <option value="rental_contract">Mietverhältnis</option>
                <option value="tenant">Mieter</option>
              </select>
            </div>

            {associationType === "unit" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Immobilie auswählen
                  </label>
                  <select
                    value={selectedPropertyForUnit}
                    onChange={(e) => {
                      setSelectedPropertyForUnit(e.target.value);
                      setAssociationId("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Bitte wählen...</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPropertyForUnit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Einheit auswählen
                    </label>
                    <select
                      value={associationId}
                      onChange={(e) => setAssociationId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Bitte wählen...</option>
                      {units
                        .filter((unit) => unit.property_id === selectedPropertyForUnit)
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unit_number}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {associationType && associationType !== "unit" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {associationType === "property" && "Immobilie auswählen"}
                  {associationType === "rental_contract" && "Mietverhältnis auswählen"}
                  {associationType === "tenant" && "Mieter auswählen"}
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
                  {associationType === "rental_contract" &&
                    contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.name}
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

      {!isPro && (
        <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark mb-2">
                Mehr Speicher mit Pro
              </h3>
              <p className="text-gray-600 mb-4">
                Upgraden Sie auf Pro und erhalten Sie:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  2GB Speicherplatz (10x mehr)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Mehrfach-Upload (bis zu 10 Dateien gleichzeitig)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Direkte Zuordnung beim Upload
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Erweiterte Kategorisierung und Metadaten
                </li>
              </ul>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                Jetzt auf Pro upgraden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
