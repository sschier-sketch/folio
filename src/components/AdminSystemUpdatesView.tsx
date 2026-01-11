import { useState, useEffect } from "react";
import { Bell, Plus, Edit2, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  update_type: "free" | "premium";
  version: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSystemUpdatesView() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    update_type: "free" as "free" | "premium",
    version: "",
    is_published: false,
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  async function loadUpdates() {
    try {
      const { data, error } = await supabase
        .from("system_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error loading updates:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUpdate(null);
    setFormData({
      title: "",
      content: "",
      update_type: "free",
      version: "",
      is_published: false,
    });
    setShowModal(true);
  }

  function openEditModal(update: SystemUpdate) {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      update_type: update.update_type,
      version: update.version || "",
      is_published: update.is_published,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const updateData = {
        title: formData.title,
        content: formData.content,
        update_type: formData.update_type,
        version: formData.version || null,
        is_published: formData.is_published,
        published_at: formData.is_published && !editingUpdate?.is_published ? new Date().toISOString() : editingUpdate?.published_at,
      };

      if (editingUpdate) {
        const { error } = await supabase
          .from("system_updates")
          .update(updateData)
          .eq("id", editingUpdate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_updates")
          .insert([{ ...updateData, created_by: user.id }]);

        if (error) throw error;
      }

      setShowModal(false);
      loadUpdates();
    } catch (error) {
      console.error("Error saving update:", error);
      alert("Fehler beim Speichern des Updates");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Möchten Sie dieses Update wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("system_updates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadUpdates();
    } catch (error) {
      console.error("Error deleting update:", error);
      alert("Fehler beim Löschen des Updates");
    }
  }

  async function togglePublished(update: SystemUpdate) {
    try {
      const { error } = await supabase
        .from("system_updates")
        .update({
          is_published: !update.is_published,
          published_at: !update.is_published ? new Date().toISOString() : update.published_at,
        })
        .eq("id", update.id);

      if (error) throw error;
      loadUpdates();
    } catch (error) {
      console.error("Error toggling published status:", error);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark">System-Updates</h2>
          <p className="text-gray-400 mt-1">
            Verwalten Sie Änderungen und neue Features
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neues Update
        </button>
      </div>

      <div className="grid gap-4">
        {updates.map((update) => (
          <div
            key={update.id}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4"
            style={{
              borderLeftColor: update.is_published ? "#10b981" : "#94a3b8",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-dark">
                    {update.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      update.update_type === "premium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {update.update_type === "premium" ? "Premium" : "Free"}
                  </span>
                  {update.version && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      v{update.version}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      update.is_published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {update.is_published ? "Veröffentlicht" : "Entwurf"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3 whitespace-pre-wrap">
                  {update.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Erstellt: {formatDate(update.created_at)}
                  </span>
                  {update.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Veröffentlicht: {formatDate(update.published_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => togglePublished(update)}
                  className={`p-2 rounded-lg transition-colors ${
                    update.is_published
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                  title={
                    update.is_published ? "Veröffentlichung aufheben" : "Veröffentlichen"
                  }
                >
                  {update.is_published ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => openEditModal(update)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(update.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {updates.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">
              Keine Updates
            </h3>
            <p className="text-gray-400">
              Erstellen Sie Ihr erstes System-Update
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-dark">
                {editingUpdate ? "Update bearbeiten" : "Neues Update"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Typ
                  </label>
                  <select
                    value={formData.update_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        update_type: e.target.value as "free" | "premium",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Version (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    placeholder="1.2.0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="text-sm text-dark">
                  Sofort veröffentlichen
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-dark rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUpdate ? "Speichern" : "Erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
