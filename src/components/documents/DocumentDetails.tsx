import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Link as LinkIcon,
  Clock,
  User,
  Calendar,
  HardDrive,
  Tag,
  Building,
  Users,
  FileCheck,
  Plus,
  X,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import DocumentFeatureGuard from "./DocumentFeatureGuard";

interface DocumentDetailsProps {
  documentId: string;
  onBack: () => void;
  onUpdate: () => void;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  category: string | null;
  description: string | null;
  upload_date: string;
  is_archived: boolean;
  shared_with_tenant: boolean;
  created_at: string;
  updated_at: string;
}

interface Association {
  id: string;
  association_type: string;
  association_id: string;
  created_at: string;
  name?: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  created_at: string;
  user_email?: string;
}

export default function DocumentDetails({ documentId, onBack, onUpdate }: DocumentDetailsProps) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [document, setDocument] = useState<Document | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    file_name: "",
    document_type: "",
    category: "",
    description: "",
    shared_with_tenant: false,
  });
  const [showAddAssociation, setShowAddAssociation] = useState(false);
  const [newAssociation, setNewAssociation] = useState({
    type: "property",
    id: "",
  });
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; tenant_name: string }[]>([]);

  useEffect(() => {
    if (user && documentId) {
      loadDocument();
      loadAssociations();
      loadHistory();
      loadReferences();
    }
  }, [user, documentId]);

  async function loadDocument() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDocument(data);
        setEditForm({
          file_name: data.file_name,
          document_type: data.document_type,
          category: data.category || "",
          description: data.description || "",
          shared_with_tenant: data.shared_with_tenant || false,
        });

        const supportedPreviewTypes = [
          "application/pdf",
          "image/png",
          "image/jpg",
          "image/jpeg",
          "image/heic",
          "image/heif"
        ];

        if (supportedPreviewTypes.some(type => data.file_type.includes(type)) || data.file_type.startsWith("image/")) {
          loadPreview(data.file_path);
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error loading preview:", error);
    }
  }

  async function loadAssociations() {
    try {
      const { data } = await supabase
        .from("document_associations")
        .select("*")
        .eq("document_id", documentId);

      if (data) {
        const enrichedAssociations = await Promise.all(
          data.map(async (assoc) => {
            let name = "Unbekannt";

            if (assoc.association_type === "property") {
              const { data: prop } = await supabase
                .from("properties")
                .select("name")
                .eq("id", assoc.association_id)
                .maybeSingle();
              name = prop?.name || "Unbekannt";
            } else if (assoc.association_type === "rental_contract") {
              const { data: contract } = await supabase
                .from("rental_contracts")
                .select("tenants(name)")
                .eq("id", assoc.association_id)
                .maybeSingle();
              name = (contract as any)?.tenants?.name || "Unbekannt";
            } else if (assoc.association_type === "tenant") {
              const { data: tenant } = await supabase
                .from("tenants")
                .select("name")
                .eq("id", assoc.association_id)
                .maybeSingle();
              name = tenant?.name || "Unbekannt";
            }

            return { ...assoc, name };
          })
        );

        setAssociations(enrichedAssociations);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    }
  }

  async function loadHistory() {
    try {
      const { data } = await supabase
        .from("document_history")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (data) {
        setHistory(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }

  async function loadReferences() {
    try {
      const [propsRes, contractsRes] = await Promise.all([
        supabase.from("properties").select("id, name").order("name"),
        supabase
          .from("rental_contracts")
          .select("id, tenants(name)")
          .eq("status", "active")
          .order("start_date", { ascending: false }),
      ]);

      if (propsRes.data) setProperties(propsRes.data);
      if (contractsRes.data) {
        setContracts(
          contractsRes.data.map((c: any) => ({
            id: c.id,
            tenant_name: c.tenants?.name || "Unbekannt",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading references:", error);
    }
  }

  async function handleSave() {
    if (!document) return;

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          file_name: editForm.file_name,
          document_type: editForm.document_type,
          category: editForm.category || null,
          description: editForm.description || null,
          shared_with_tenant: editForm.shared_with_tenant,
        })
        .eq("id", documentId);

      if (error) throw error;

      setIsEditing(false);
      loadDocument();
      onUpdate();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Fehler beim Aktualisieren des Dokuments");
    }
  }

  async function handleArchive() {
    if (!document) return;

    if (!confirm("Möchten Sie dieses Dokument wirklich archivieren?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .update({ is_archived: true })
        .eq("id", documentId);

      if (error) throw error;

      onBack();
      onUpdate();
    } catch (error) {
      console.error("Error archiving document:", error);
      alert("Fehler beim Archivieren");
    }
  }

  async function handleDelete() {
    if (!document) return;

    if (
      !confirm(
        "Möchten Sie dieses Dokument wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    try {
      await supabase.storage.from("documents").remove([document.file_path]);

      const { error } = await supabase.from("documents").delete().eq("id", documentId);

      if (error) throw error;

      onBack();
      onUpdate();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Fehler beim Löschen");
    }
  }

  async function handleDownload() {
    if (!document) return;

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Fehler beim Herunterladen");
    }
  }

  async function handleAddAssociation() {
    if (!newAssociation.id) {
      alert("Bitte wählen Sie ein Objekt aus");
      return;
    }

    try {
      const { error } = await supabase.from("document_associations").insert({
        document_id: documentId,
        association_type: newAssociation.type,
        association_id: newAssociation.id,
        created_by: user?.id,
      });

      if (error) throw error;

      setShowAddAssociation(false);
      setNewAssociation({ type: "property", id: "" });
      loadAssociations();
      onUpdate();
    } catch (error) {
      console.error("Error adding association:", error);
      alert("Fehler beim Hinzufügen der Zuordnung");
    }
  }

  async function handleRemoveAssociation(associationId: string) {
    try {
      const { error } = await supabase
        .from("document_associations")
        .delete()
        .eq("id", associationId);

      if (error) throw error;

      loadAssociations();
      onUpdate();
    } catch (error) {
      console.error("Error removing association:", error);
      alert("Fehler beim Entfernen der Zuordnung");
    }
  }

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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

  const getAssociationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      property: "Immobilie",
      unit: "Einheit",
      rental_contract: "Mietverhältnis",
      tenant: "Mieter",
      finance: "Finanzen",
    };
    return labels[type] || type;
  };

  const getAssociationIcon = (type: string) => {
    const icons: Record<string, any> = {
      property: Building,
      unit: Building,
      rental_contract: FileCheck,
      tenant: Users,
      finance: FileText,
    };
    return icons[type] || FileText;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Hochgeladen",
      updated: "Aktualisiert",
      archived: "Archiviert",
      restored: "Wiederhergestellt",
      associated: "Zugeordnet",
      disassociated: "Zuordnung entfernt",
    };
    return labels[action] || action;
  };

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
              className="px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Bearbeiten
            </button>
          )}

          <DocumentFeatureGuard feature="document-archive">
            <button
              onClick={handleArchive}
              style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
              className="px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              Archivieren
            </button>
          </DocumentFeatureGuard>

          <button
            onClick={handleDelete}
            style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
            className="px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.file_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, file_name: e.target.value })
                    }
                    className="w-full text-2xl font-bold text-dark border-b-2 border-blue-600 focus:outline-none mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-dark mb-2 break-words">
                    {document.file_name}
                  </h1>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>•</span>
                  <span>{document.file_type}</span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-4 mb-6 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dokumenttyp
                  </label>
                  <select
                    value={editForm.document_type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, document_type: e.target.value })
                    }
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
                      Kategorie
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      placeholder="z.B. Steuer, Versicherung, Wartung"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </DocumentFeatureGuard>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Optional: Zusätzliche Informationen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="share_with_tenant_edit"
                      checked={editForm.shared_with_tenant}
                      onChange={(e) =>
                        setEditForm({ ...editForm, shared_with_tenant: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Im Mieterportal zur Verfügung stellen
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {associations.some((a) => a.association_type === "tenant")
                          ? 'Wenn Sie einen Mieter zugeordnet haben, sieht nur dieser Mieter das Dokument in seinem Portal.'
                          : 'Alle Mieter der zugeordneten Immobilie/Einheit können dieses Dokument in ihrem Portal einsehen. Ohne Zuordnung bleibt das Dokument privat.'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        file_name: document.file_name,
                        document_type: document.document_type,
                        category: document.category || "",
                        description: document.description || "",
                        shared_with_tenant: document.shared_with_tenant || false,
                      });
                    }}
                    style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                    className="px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {previewUrl && document.file_type === "application/pdf" ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] border-0"
                  title="PDF Vorschau"
                />
              </div>
            ) : previewUrl && (document.file_type.startsWith("image/") || document.file_type.includes("heic") || document.file_type.includes("heif")) ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden p-4">
                <img
                  src={previewUrl}
                  alt={document.file_name}
                  className="w-full h-auto max-h-[600px] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Vorschau nicht verfügbar</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">
                    Vorschau ist nur für folgende Dateitypen verfügbar:
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF, PNG, JPG, JPEG, HEIC
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Laden Sie die Datei herunter, um sie anzuzeigen
                  </p>
                </div>
              </div>
            )}

            {document.description && !isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Beschreibung</h3>
                <p className="text-gray-600">{document.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Zuordnungen
              </h2>
              <button
                onClick={() => setShowAddAssociation(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>

            {showAddAssociation && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ
                    </label>
                    <select
                      value={newAssociation.type}
                      onChange={(e) =>
                        setNewAssociation({ ...newAssociation, type: e.target.value, id: "" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="property">Immobilie</option>
                      <option value="rental_contract">Mietverhältnis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Objekt
                    </label>
                    <select
                      value={newAssociation.id}
                      onChange={(e) =>
                        setNewAssociation({ ...newAssociation, id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Bitte wählen...</option>
                      {newAssociation.type === "property" &&
                        properties.map((prop) => (
                          <option key={prop.id} value={prop.id}>
                            {prop.name}
                          </option>
                        ))}
                      {newAssociation.type === "rental_contract" &&
                        contracts.map((contract) => (
                          <option key={contract.id} value={contract.id}>
                            {contract.tenant_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAssociation}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Hinzufügen
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAssociation(false);
                        setNewAssociation({ type: "property", id: "" });
                      }}
                      style={{ backgroundColor: "#fbf8f8", color: "#000000" }}
                      className="px-3 py-1.5 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {associations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Noch keine Zuordnungen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => {
                  const Icon = getAssociationIcon(assoc.association_type);
                  return (
                    <div
                      key={assoc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-dark">
                            {assoc.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getAssociationTypeLabel(assoc.association_type)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssociation(assoc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-dark mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Typ</div>
                  <div className="text-sm font-medium text-dark">
                    {getDocumentTypeLabel(document.document_type)}
                  </div>
                </div>
              </div>

              {isPro && document.category && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Kategorie</div>
                    <div className="text-sm font-medium text-dark">{document.category}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Hochgeladen</div>
                  <div className="text-sm font-medium text-dark">
                    {formatDate(document.upload_date)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Größe</div>
                  <div className="text-sm font-medium text-dark">
                    {formatFileSize(document.file_size)}
                  </div>
                </div>
              </div>

              {isPro && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Letzte Änderung</div>
                    <div className="text-sm font-medium text-dark">
                      {formatDate(document.updated_at)}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Mieterportal</div>
                  <div className="text-sm font-medium text-dark">
                    {document.shared_with_tenant ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <FileCheck className="w-4 h-4" />
                        Für Mieter sichtbar
                      </span>
                    ) : (
                      <span className="text-gray-400">Nicht geteilt</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DocumentFeatureGuard
            feature="document-history"
            fallback={
              <div className="bg-white rounded-lg p-6 border border-gray-100 relative">
                <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Pro Feature</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Änderungsverlauf mit Pro freischalten
                    </p>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Änderungsverlauf
                </h2>
                <div className="space-y-3 blur-sm">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-dark font-medium">Dokument hochgeladen</p>
                      <p className="text-xs text-gray-500">Vor 2 Tagen</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Änderungsverlauf
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Keine Änderungen</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-dark font-medium">
                          {getActionLabel(entry.action)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DocumentFeatureGuard>
        </div>
      </div>
    </div>
  );
}
