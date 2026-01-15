import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Upload, X, FileText, Loader, Download } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

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

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-dark mb-2">
            Noch keine Vorlagen
          </h3>
          <p className="text-gray-400 mb-6">
            Laden Sie die erste Vorlage hoch
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
          >
            <Plus className="w-5 h-5" />
            Erste Vorlage hochladen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                  Titel & Beschreibung
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                  Kategorie
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                  Datei
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 w-32">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {template.title}
                    </div>
                    {template.description && (
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {template.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {getCategoryLabel(template.category)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{template.file_name}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(template.file_size)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {template.is_premium ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium inline-flex items-center justify-center">
                          Premium
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium inline-flex items-center justify-center">
                          Gratis
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium inline-flex items-center justify-center">
                        {template.download_count} DL
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(template)}
                        disabled={downloading === template.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Vorlage herunterladen"
                      >
                        {downloading === template.id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                        title="Vorlage löschen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
