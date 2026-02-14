import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  X,
  Save,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Faq {
  id: string;
  page_slug: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PAGE_OPTIONS: { slug: string; label: string }[] = [
  { slug: "landing", label: "Startseite" },
  { slug: "pricing", label: "Preise" },
  { slug: "features", label: "Funktionen" },
  { slug: "support", label: "Support" },
];

export default function AdminFaqsView() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePageSlug, setActivePageSlug] = useState("landing");
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    page_slug: "landing",
    is_active: true,
  });

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("page_slug")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  }

  const filteredFaqs = faqs.filter((f) => f.page_slug === activePageSlug);

  const pageCounts = PAGE_OPTIONS.reduce(
    (acc, p) => {
      acc[p.slug] = faqs.filter((f) => f.page_slug === p.slug).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  function openNewForm() {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      page_slug: activePageSlug,
      is_active: true,
    });
    setShowForm(true);
  }

  function openEditForm(faq: Faq) {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      page_slug: faq.page_slug,
      is_active: faq.is_active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingFaq(null);
  }

  async function handleSave() {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    setSaving(true);

    if (editingFaq) {
      await supabase
        .from("faqs")
        .update({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          page_slug: formData.page_slug,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFaq.id);
    } else {
      const maxOrder = filteredFaqs.reduce(
        (max, f) => Math.max(max, f.sort_order),
        0,
      );
      await supabase.from("faqs").insert({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        page_slug: formData.page_slug,
        is_active: formData.is_active,
        sort_order: maxOrder + 1,
      });
    }

    setSaving(false);
    closeForm();
    loadFaqs();
  }

  async function handleToggleActive(faq: Faq) {
    await supabase
      .from("faqs")
      .update({
        is_active: !faq.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", faq.id);
    loadFaqs();
  }

  async function handleDelete(faq: Faq) {
    if (
      !confirm(`FAQ "${faq.question.slice(0, 60)}..." wirklich loeschen?`)
    )
      return;
    await supabase.from("faqs").delete().eq("id", faq.id);
    loadFaqs();
  }

  async function handleMoveUp(faq: Faq, index: number) {
    if (index === 0) return;
    const prev = filteredFaqs[index - 1];
    await Promise.all([
      supabase
        .from("faqs")
        .update({ sort_order: prev.sort_order })
        .eq("id", faq.id),
      supabase
        .from("faqs")
        .update({ sort_order: faq.sort_order })
        .eq("id", prev.id),
    ]);
    loadFaqs();
  }

  async function handleMoveDown(faq: Faq, index: number) {
    if (index === filteredFaqs.length - 1) return;
    const next = filteredFaqs[index + 1];
    await Promise.all([
      supabase
        .from("faqs")
        .update({ sort_order: next.sort_order })
        .eq("id", faq.id),
      supabase
        .from("faqs")
        .update({ sort_order: faq.sort_order })
        .eq("id", next.id),
    ]);
    loadFaqs();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            FAQ-Verwaltung
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Verwalten Sie die haeufig gestellten Fragen fuer alle Seiten.
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue FAQ
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PAGE_OPTIONS.map((page) => (
          <button
            key={page.slug}
            onClick={() => setActivePageSlug(page.slug)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePageSlug === page.slug
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {page.label}
            <span
              className={`ml-1.5 text-xs ${activePageSlug === page.slug ? "text-gray-300" : "text-gray-400"}`}
            >
              {pageCounts[page.slug] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            Keine FAQs fuer diese Seite vorhanden.
          </p>
          <button
            onClick={openNewForm}
            className="mt-4 text-sm text-primary-blue hover:underline"
          >
            Erste FAQ hinzufuegen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {filteredFaqs.map((faq, i) => (
            <div
              key={faq.id}
              className={`flex items-start gap-4 p-5 group ${!faq.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex flex-col items-center gap-1 pt-1">
                <button
                  onClick={() => handleMoveUp(faq, i)}
                  disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                </button>
                <GripVertical className="w-4 h-4 text-gray-300" />
                <button
                  onClick={() => handleMoveDown(faq, i)}
                  disabled={i === filteredFaqs.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
                    #{faq.sort_order}
                  </span>
                  {!faq.is_active && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                      Versteckt
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {faq.answer}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(faq)}
                  title={faq.is_active ? "Verstecken" : "Anzeigen"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {faq.is_active ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => openEditForm(faq)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-blue hover:bg-blue-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(faq)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingFaq ? "FAQ bearbeiten" : "Neue FAQ erstellen"}
              </h3>
              <button
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Seite
                </label>
                <select
                  value={formData.page_slug}
                  onChange={(e) =>
                    setFormData({ ...formData, page_slug: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
                >
                  {PAGE_OPTIONS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Frage
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="z.B. Ist rentably wirklich kostenlos?"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Antwort
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  rows={6}
                  placeholder="Geben Sie die Antwort ein..."
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue/20"
                />
                <span className="text-sm text-gray-700">Aktiv (sichtbar auf der Seite)</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeForm}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !formData.question.trim() ||
                  !formData.answer.trim()
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
