import { useState, useEffect } from "react";
import { Sparkles, Edit, Save, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProFeatureText {
  id: string;
  page: string;
  tab: string;
  feature_key: string;
  title: string;
  description: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProFeaturesView() {
  const [featureTexts, setFeatureTexts] = useState<ProFeatureText[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProFeatureText>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeature, setNewFeature] = useState<string>("");

  useEffect(() => {
    loadFeatureTexts();
  }, []);

  async function loadFeatureTexts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pro_feature_texts")
        .select("*")
        .order("page", { ascending: true })
        .order("tab", { ascending: true });

      if (error) throw error;
      setFeatureTexts(data || []);
    } catch (error) {
      console.error("Error loading feature texts:", error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(feature: ProFeatureText) {
    setEditingId(feature.id);
    setEditForm({ ...feature });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from("pro_feature_texts")
        .update({
          title: editForm.title,
          description: editForm.description,
          features: editForm.features,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);

      if (error) throw error;

      await loadFeatureTexts();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating feature text:", error);
      alert("Fehler beim Speichern der Änderungen");
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from("pro_feature_texts")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;
      await loadFeatureTexts();
    } catch (error) {
      console.error("Error toggling active state:", error);
      alert("Fehler beim Aktualisieren des Status");
    }
  }

  async function deleteFeature(id: string) {
    if (!confirm("Möchten Sie diesen Feature-Text wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("pro_feature_texts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadFeatureTexts();
    } catch (error) {
      console.error("Error deleting feature text:", error);
      alert("Fehler beim Löschen");
    }
  }

  function addFeatureToEdit() {
    if (!newFeature.trim()) return;
    setEditForm({
      ...editForm,
      features: [...(editForm.features || []), newFeature.trim()],
    });
    setNewFeature("");
  }

  function removeFeatureFromEdit(index: number) {
    setEditForm({
      ...editForm,
      features: (editForm.features || []).filter((_, i) => i !== index),
    });
  }

  async function createNewFeature() {
    try {
      const { error } = await supabase.from("pro_feature_texts").insert({
        page: "new_page",
        tab: "new_tab",
        feature_key: `new_page_new_tab_${Date.now()}`,
        title: "Neues Pro-Feature",
        description: "Beschreibung des Features",
        features: ["Feature 1", "Feature 2", "Feature 3"],
        is_active: false,
      });

      if (error) throw error;
      await loadFeatureTexts();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating feature:", error);
      alert("Fehler beim Erstellen des Features");
    }
  }

  const pageLabels: Record<string, string> = {
    dashboard: "Dashboard",
    billing: "Tarif & Abrechnung",
    rent_payments: "Mieteingänge",
    tenant_details: "Mietverhältnis-Details",
    finances: "Finanzen",
    property: "Immobilie",
    documents: "Dokumente",
    messages: "Nachrichten",
  };

  const tabLabels: Record<string, string> = {
    trial_banner: "Trial-Banner",
    dunning: "Mahnwesen",
    upgrade: "Upgrade-Prompt",
    pro_plan: "Pro-Plan Karte",
    contract: "Vertrag & Dokumente",
    communication: "Kommunikation",
    handover: "Übergabe & Wechsel",
    cashflow: "Cashflow",
    indexrent: "Indexmiete",
    operating_costs: "Betriebskosten",
    contacts: "Kontakte",
    documents: "Dokumente",
    history: "Historie",
    maintenance: "Instandhaltung",
    metrics: "Kennzahlen",
    overview: "Übersicht",
    archive: "Archiv",
    deposit: "Kaution",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Pro-Feature Texte
          </h2>
          <p className="text-gray-600 mt-1">
            Verwalten Sie die Upgrade-Prompts für alle Pro-Features
          </p>
        </div>
        <button
          onClick={createNewFeature}
          className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Feature
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-1">Wichtig: Feature-Keys beachten</p>
          <p>
            Der Feature-Key muss im Format <code className="px-1 py-0.5 bg-yellow-100 rounded">page_tab</code> sein und mit dem
            entsprechenden Code in den Komponenten übereinstimmen.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {featureTexts.map((feature) => {
          const isEditing = editingId === feature.id;

          return (
            <div
              key={feature.id}
              className={`bg-white rounded-lg border ${
                feature.is_active ? "border-gray-200" : "border-gray-300 opacity-60"
              } p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {pageLabels[feature.page] || feature.page}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {tabLabels[feature.tab] || feature.tab}
                    </span>
                    <span className="text-xs text-gray-500">
                      Key: {feature.feature_key}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titel
                        </label>
                        <input
                          type="text"
                          value={editForm.title || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Beschreibung
                        </label>
                        <textarea
                          value={editForm.description || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Features (Bulletpoints)
                        </label>
                        <div className="space-y-2">
                          {(editForm.features || []).map((feat, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={feat}
                                onChange={(e) => {
                                  const newFeatures = [...(editForm.features || [])];
                                  newFeatures[index] = e.target.value;
                                  setEditForm({
                                    ...editForm,
                                    features: newFeatures,
                                  });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                              />
                              <button
                                onClick={() => removeFeatureFromEdit(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addFeatureToEdit();
                                }
                              }}
                              placeholder="Neues Feature hinzufügen..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            />
                            <button
                              onClick={addFeatureToEdit}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-dark mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {feature.description}
                      </p>
                      <ul className="space-y-1">
                        {feature.features.map((feat, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="text-primary-blue mt-1">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Speichern"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Abbrechen"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(feature)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleActive(feature.id, feature.is_active)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          feature.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {feature.is_active ? "Aktiv" : "Inaktiv"}
                      </button>
                      <button
                        onClick={() => deleteFeature(feature.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                Erstellt: {new Date(feature.created_at).toLocaleString("de-DE")} |
                Aktualisiert: {new Date(feature.updated_at).toLocaleString("de-DE")}
              </div>
            </div>
          );
        })}
      </div>

      {featureTexts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Noch keine Pro-Feature Texte vorhanden</p>
          <button
            onClick={createNewFeature}
            className="mt-4 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Erstes Feature erstellen
          </button>
        </div>
      )}
    </div>
  );
}
