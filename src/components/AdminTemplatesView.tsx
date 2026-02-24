import { useState, useEffect, useRef } from "react";
import { Plus, Upload, X, Loader, Edit2, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { BaseTable, StatusBadge, ActionButton, ActionsCell, TableColumn } from "./common/BaseTable";
import TableActionsDropdown, { ActionItem } from "./common/TableActionsDropdown";
import { Button } from './ui/Button';

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

  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [uploadData, setUploadData] = useState({
    title: "",
    category: "",
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
    return categoryDescriptions.find((c) => c.category === category)?.title || category;
  };

  async function handleAddCategory() {
    if (!newCategoryTitle.trim()) return;

    const slug = newCategorySlug.trim() || newCategoryTitle.trim().toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    try {
      setAddingCategory(true);
      const { error } = await supabase
        .from('template_category_descriptions')
        .insert({
          category: slug,
          title: newCategoryTitle.trim(),
          description: newCategoryDescription.trim() || newCategoryTitle.trim(),
        });

      if (error) throw error;

      setNewCategorySlug("");
      setNewCategoryTitle("");
      setNewCategoryDescription("");
      await loadCategoryDescriptions();
    } catch (error: any) {
      console.error('Error adding category:', error);
      alert(error.message?.includes('duplicate') ? 'Diese Kategorie existiert bereits.' : 'Fehler beim Anlegen der Kategorie');
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: CategoryDescription) {
    const usedCount = templates.filter(t => t.category === cat.category).length;
    if (usedCount > 0) {
      alert(`Diese Kategorie wird von ${usedCount} Vorlage(n) verwendet und kann nicht gelöscht werden.`);
      return;
    }
    if (!confirm(`Kategorie "${cat.title}" wirklich löschen?`)) return;

    try {
      const { error } = await supabase
        .from('template_category_descriptions')
        .delete()
        .eq('id', cat.id);

      if (error) throw error;
      await loadCategoryDescriptions();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Fehler beim Löschen der Kategorie');
    }
  }

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
        <h2 className="text-2xl font-bold text-dark mb-2">Kategorien verwalten</h2>
        <p className="text-gray-400 mb-4">Kategorien, die Benutzern als Filter angezeigt werden</p>

        <div className="bg-white rounded-lg overflow-hidden mb-4">
          {categoryDescriptions.map((cat) => (
            <div key={cat.id} className="border-b border-gray-100 last:border-b-0">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-dark">{cat.title}</h3>
                    <span className="text-xs text-gray-400 font-mono">{cat.category}</span>
                  </div>
                  {editingCategory === cat.id ? (
                    <div className="mt-2 flex gap-2">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                      />
                      <Button
                        onClick={() => handleSaveCategoryDescription(cat.id)}
                        variant="primary"
                        size="sm"
                      >
                        Speichern
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 truncate">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingCategory !== cat.id && (
                    <button
                      onClick={() => {
                        setEditingCategory(cat.id);
                        setEditDescription(cat.description);
                      }}
                      className="p-2 text-gray-400 hover:text-primary-blue transition-colors"
                      title="Beschreibung bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Kategorie löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-5">
          <h3 className="text-sm font-semibold text-dark mb-3">Neue Kategorie anlegen</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">Anzeigename *</label>
              <input
                type="text"
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="z.B. Betriebskosten"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">Beschreibung</label>
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Kurzbeschreibung der Kategorie"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryTitle.trim() || addingCategory}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Anlegen
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark">Vorlagen verwalten</h2>
          <p className="text-gray-400">Laden Sie Vorlagen für Benutzer hoch</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          variant="primary"
        >
          Vorlage hochladen
        </Button>
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
            align: "center" as const,
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
                  <option value="">Kategorie wählen...</option>
                  {categoryDescriptions.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.title}
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
              <Button
                onClick={() => setShowUploadModal(false)}
                variant="cancel"
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleUpload}
                disabled={
                  !uploadData.title || !uploadData.category || !selectedFile || uploading
                }
                variant="primary"
                fullWidth
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Lädt hoch...
                  </>
                ) : (
                  "Hochladen"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
