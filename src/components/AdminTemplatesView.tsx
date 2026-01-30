import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Upload, X, FileText, Loader, Download, Edit2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "./common/BaseTable";
import TableActionsDropdown, { ActionItem } from "./common/TableActionsDropdown";

interface Template {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  download_count: number;
}

interface CategoryDescription {
  id: string;
  category: string;
  title: string;
  description: string;
}

const CATEGORIES = [
  { value: "interessentensuche", label: "Interessentensuche" },
  { value: "wohnungsuebergabe", label: "Wohnungsübergabe" },
  { value: "mietvertrag", label: "Mietvertrag" },
  { value: "mietzahlungen", label: "Mietzahlungen" },
  { value: "kuendigung", label: "Kündigung" },
  { value: "sonstiges", label: "Sonstiges" },
];

export function AdminTemplatesView() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categoryDescriptions, setCategoryDescriptions] = useState<CategoryDescription[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadData, setUploadData] = useState({
    title: "",
    category: "interessentensuche",
    description: "",
    content: "",
    is_premium: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadTemplates();
    loadCategoryDescriptions();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoryDescriptions() {
    try {
      const { data, error } = await supabase
        .from("template_category_descriptions")
        .select("*")
        .order("category");

      if (error) throw error;
      setCategoryDescriptions(data || []);
    } catch (error) {
      console.error("Error loading category descriptions:", error);
    }
  }

  async function handleSaveCategoryDescription(categoryId: string) {
    try {
      const { error } = await supabase
        .from("template_category_descriptions")
        .update({ description: editDescription, updated_at: new Date().toISOString() })
        .eq("id", categoryId);

      if (error) throw error;

      await loadCategoryDescriptions();
      setEditingCategory(null);
      setEditDescription("");
      alert("Beschreibung aktualisiert!");
    } catch (error) {
      console.error("Error updating category description:", error);
      alert("Fehler beim Aktualisieren der Beschreibung");
    }
  }

  async function handleUpload() {
    if (!user || !selectedFile) return;

    try {
      setUploading(true);

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("templates").insert({
        user_id: user.id,
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description || null,
        content: uploadData.content || null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        is_premium: uploadData.is_premium,
      });

      if (dbError) throw dbError;

      alert("Vorlage erfolgreich hochgeladen");
      setShowUploadModal(false);
      setUploadData({
        title: "",
        category: "interessentensuche",
        description: "",
        content: "",
        is_premium: false,
      });
      setSelectedFile(null);
      loadTemplates();
    } catch (error) {
      console.error("Error uploading template:", error);
      alert("Fehler beim Hochladen der Vorlage");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(template: Template) {
    if (!confirm(`Möchten Sie die Vorlage "${template.title}" wirklich löschen?`)) {
      return;
    }

    try {
      const { error: storageError } = await supabase.storage
        .from("templates")
        .remove([template.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("templates")
        .delete()
        .eq("id", template.id);

      if (dbError) throw dbError;

      alert("Vorlage erfolgreich gelöscht");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Fehler beim Löschen der Vorlage");
    }
  }

  async function handleDownload(template: Template) {
    try {
      setDownloading(template.id);

      const { data, error } = await supabase.storage
        .from("templates")
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Fehler beim Herunterladen der Vorlage");
    } finally {
      setDownloading(null);
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getCategoryLabel = (category: string): string => {
    return CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-dark mb-2">Kategoriebeschreibungen</h2>
        <p className="text-gray-400 mb-4">Bearbeiten Sie die Beschreibungen, die Benutzern für jede Vorlagenkategorie angezeigt werden</p>

        <div className="bg-white rounded-lg overflow-hidden">
          {categoryDescriptions.map((cat) => (
            <div key={cat.id} className="border-b border-gray-100 last:border-b-0">
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-dark">{cat.title}</h3>
                  {editingCategory === cat.id ? (
                    <button
                      onClick={() => handleSaveCategoryDescription(cat.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Speichern
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingCategory(cat.id);
                        setEditDescription(cat.description);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-primary-blue transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Bearbeiten
                    </button>
                  )}
                </div>
                {editingCategory === cat.id ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                  />
                ) : (
                  <p className="text-gray-600">{cat.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark">Vorlagen verwalten</h2>
          <p className="text-gray-400">Laden Sie Vorlagen für Benutzer hoch</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          Vorlage hochladen
        </button>
      </div>

      <BaseTable
        columns={[
          {
            key: "title",
            header: "Titel & Beschreibung",
            render: (template: Template) => (
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {template.title}
                </div>
                {template.description && (
                  <div className="text-xs text-gray-500 max-w-xs truncate">
                    {template.description}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "category",
            header: "Kategorie",
            render: (template: Template) => (
              <span className="text-sm text-gray-500">
                {getCategoryLabel(template.category)}
              </span>
            ),
          },
          {
            key: "file",
            header: "Datei",
            render: (template: Template) => (
              <div>
                <div className="text-sm text-gray-900">{template.file_name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(template.file_size)}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (template: Template) => (
              <div className="flex flex-col gap-1">
                {template.is_premium ? (
                  <StatusBadge type="warning" label="Premium" />
                ) : (
                  <StatusBadge type="neutral" label="Gratis" />
                )}
                <StatusBadge type="info" label={`${template.download_count} DL`} />
              </div>
            ),
          },
          {
            key: "actions",
            header: "Aktionen",
            align: "right" as const,
            render: (template: Template) => (
              <TableActionsDropdown
                actions={[
                  {
                    label: 'Herunterladen',
                    onClick: () => handleDownload(template)
                  },
                  {
                    label: 'Löschen',
                    onClick: () => handleDelete(template),
                    variant: 'danger'
                  }
                ]}
              />
            ),
          },
        ]}
        data={templates}
        loading={loading}
        emptyMessage="Noch keine Vorlagen"
      />

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-bold text-dark">Vorlage hochladen</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Mietvertrag Einfamilienhaus"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                  placeholder="Optionale Beschreibung..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suchbegriffe / Inhalt
                </label>
                <textarea
                  value={uploadData.content}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={4}
                  placeholder="Wichtige Suchbegriffe, Schlüsselwörter oder Inhaltszusammenfassung für bessere Auffindbarkeit..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Diese Informationen helfen Benutzern, die Vorlage über die Suche zu finden
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={uploadData.is_premium}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      is_premium: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                />
                <label htmlFor="is_premium" className="text-sm text-gray-700">
                  Premium-Vorlage (nur für Verwaltung)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datei *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-blue transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {selectedFile ? selectedFile.name : "Datei auswählen"}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Unterstützte Formate: PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-lg">
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                className="flex-1 px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  !uploadData.title || !selectedFile || uploading
                }
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Lädt hoch...
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
      )}
    </div>
  );
}
