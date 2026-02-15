import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Image as ImageIcon, Tag, FolderOpen, Upload, X, Plus, GripVertical, ListChecks } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from '../ui/Button';
import { CATEGORIES, CATEGORY_LABELS } from "../magazine/magazineConstants";
import BlockEditor from "./BlockEditor";
import type { ContentBlock } from "../../lib/contentBlocks";
import {
  parseContentBlocks,
  serializeBlocks,
  calculateReadingTimeFromBlocks,
} from "../../lib/contentBlocks";

interface TagItem {
  id: string;
  name_de: string;
  name_en: string;
}

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
}

const CATEGORY_OPTIONS = CATEGORIES
  .filter((c) => c !== "alle")
  .map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));

export default function AdminMagazinePostEditor() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(postId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("Rentably Team");
  const [category, setCategory] = useState("allgemein");
  const [isFeatured, setIsFeatured] = useState(false);

  const [deTitle, setDeTitle] = useState("");
  const [deSlug, setDeSlug] = useState("");
  const [deExcerpt, setDeExcerpt] = useState("");
  const [deBlocks, setDeBlocks] = useState<ContentBlock[]>([]);
  const [deSummaryPoints, setDeSummaryPoints] = useState<string[]>([]);
  const [deSeoTitle, setDeSeoTitle] = useState("");
  const [deSeoDescription, setDeSeoDescription] = useState("");

  const [enTitle, setEnTitle] = useState("");
  const [enSlug, setEnSlug] = useState("");
  const [enExcerpt, setEnExcerpt] = useState("");
  const [enBlocks, setEnBlocks] = useState<ContentBlock[]>([]);
  const [enSummaryPoints, setEnSummaryPoints] = useState<string[]>([]);
  const [enSeoTitle, setEnSeoTitle] = useState("");
  const [enSeoDescription, setEnSeoDescription] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  const [activeLocale, setActiveLocale] = useState<"de" | "en">("de");

  useEffect(() => {
    loadTags();
    if (isEdit) {
      loadPost();
    }
  }, [postId]);

  async function loadTags() {
    try {
      const { data: tagsData } = await supabase
        .from("mag_tags")
        .select(`
          id,
          de:mag_tag_translations!inner(name),
          en:mag_tag_translations(name)
        `)
        .eq("de.locale", "de")
        .eq("en.locale", "en");

      if (tagsData) {
        setTags(tagsData.map((t: any) => ({
          id: t.id,
          name_de: t.de?.[0]?.name || "",
          name_en: t.en?.[0]?.name || ""
        })));
      }
    } catch (err) {
      console.error("Error loading tags:", err);
    }
  }

  async function loadPost() {
    setLoading(true);
    try {
      const { data: post, error } = await supabase
        .from("mag_posts")
        .select(`
          *,
          de:mag_post_translations(title, slug, excerpt, content, summary_points, seo_title, seo_description, og_image_url, reading_time_minutes),
          en:mag_post_translations(title, slug, excerpt, content, summary_points, seo_title, seo_description, og_image_url, reading_time_minutes),
          tags:mag_post_tags(tag_id)
        `)
        .eq("id", postId)
        .eq("de.locale", "de")
        .eq("en.locale", "en")
        .single();

      if (error) throw error;

      setStatus(post.status);
      setHeroImageUrl(post.hero_image_url || "");
      setAuthorName(post.author_name);
      setCategory(post.category || "allgemein");
      setIsFeatured(post.is_featured || false);

      const deTrans = post.de?.[0];
      if (deTrans) {
        setDeTitle(deTrans.title);
        setDeSlug(deTrans.slug);
        setDeExcerpt(deTrans.excerpt || "");
        setDeBlocks(parseContentBlocks(deTrans.content || ""));
        setDeSummaryPoints(Array.isArray(deTrans.summary_points) ? deTrans.summary_points : []);
        setDeSeoTitle(deTrans.seo_title || "");
        setDeSeoDescription(deTrans.seo_description || "");
      }

      const enTrans = post.en?.[0];
      if (enTrans) {
        setEnTitle(enTrans.title);
        setEnSlug(enTrans.slug);
        setEnExcerpt(enTrans.excerpt || "");
        setEnBlocks(parseContentBlocks(enTrans.content || ""));
        setEnSummaryPoints(Array.isArray(enTrans.summary_points) ? enTrans.summary_points : []);
        setEnSeoTitle(enTrans.seo_title || "");
        setEnSeoDescription(enTrans.seo_description || "");
      }

      setSelectedTags((post.tags || []).map((t: any) => t.tag_id));

      const { data: faqsData } = await supabase
        .from("mag_post_faqs")
        .select("id, question, answer, sort_order")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true });

      if (faqsData) {
        setFaqs(faqsData);
      }
    } catch (err) {
      console.error("Error loading post:", err);
      alert("Fehler beim Laden des Artikels");
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(title: string, locale: "de" | "en") {
    if (locale === "de") {
      setDeTitle(title);
      if (!deSlug || deSlug === generateSlug(deTitle)) {
        setDeSlug(generateSlug(title));
      }
    } else {
      setEnTitle(title);
      if (!enSlug || enSlug === generateSlug(enTitle)) {
        setEnSlug(generateSlug(title));
      }
    }
  }

  async function handleHeroImageUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `hero/${fileName}`;

      const { error } = await supabase.storage
        .from("magazine-images")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("magazine-images")
        .getPublicUrl(filePath);

      setHeroImageUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "", sort_order: faqs.length }]);
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  }

  function removeFaq(index: number) {
    setFaqs(faqs.filter((_, i) => i !== index));
  }

  async function handleSave(publish: boolean = false) {
    if (!deTitle || !deSlug || deBlocks.length === 0) {
      alert("Bitte füllen Sie mindestens Titel, Slug und Inhalt für DE aus");
      return;
    }

    if (!enTitle || !enSlug || enBlocks.length === 0) {
      alert("Bitte füllen Sie mindestens Titel, Slug und Inhalt für EN aus");
      return;
    }

    setSaving(true);
    try {
      const postData: any = {
        status: publish ? "PUBLISHED" : status,
        hero_image_url: heroImageUrl || null,
        author_name: authorName,
        category,
        is_featured: isFeatured,
      };

      if (publish || status === "PUBLISHED") {
        postData.published_at = new Date().toISOString();
      }

      let finalPostId = postId;

      if (isEdit) {
        const { error } = await supabase
          .from("mag_posts")
          .update(postData)
          .eq("id", postId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("mag_posts")
          .insert([postData])
          .select()
          .single();
        if (error) throw error;
        finalPostId = data.id;
      }

      const deReadingTime = calculateReadingTimeFromBlocks(deBlocks);
      const enReadingTime = calculateReadingTimeFromBlocks(enBlocks);

      const deContent = serializeBlocks(deBlocks);
      const enContent = serializeBlocks(enBlocks);

      const { error: deError } = await supabase
        .from("mag_post_translations")
        .upsert({
          post_id: finalPostId,
          locale: "de",
          title: deTitle,
          slug: deSlug,
          excerpt: deExcerpt || null,
          content: deContent,
          summary_points: deSummaryPoints.filter(p => p.trim()),
          seo_title: deSeoTitle || null,
          seo_description: deSeoDescription || null,
          og_image_url: null,
          reading_time_minutes: deReadingTime,
        }, { onConflict: "post_id,locale" });

      if (deError) throw deError;

      const { error: enError } = await supabase
        .from("mag_post_translations")
        .upsert({
          post_id: finalPostId,
          locale: "en",
          title: enTitle,
          slug: enSlug,
          excerpt: enExcerpt || null,
          content: enContent,
          summary_points: enSummaryPoints.filter(p => p.trim()),
          seo_title: enSeoTitle || null,
          seo_description: enSeoDescription || null,
          og_image_url: null,
          reading_time_minutes: enReadingTime,
        }, { onConflict: "post_id,locale" });

      if (enError) throw enError;

      await supabase
        .from("mag_post_tags")
        .delete()
        .eq("post_id", finalPostId);

      if (selectedTags.length > 0) {
        await supabase
          .from("mag_post_tags")
          .insert(selectedTags.map(tagId => ({
            post_id: finalPostId,
            tag_id: tagId
          })));
      }

      await supabase
        .from("mag_post_faqs")
        .delete()
        .eq("post_id", finalPostId);

      const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
      if (validFaqs.length > 0) {
        await supabase
          .from("mag_post_faqs")
          .insert(validFaqs.map((f, i) => ({
            post_id: finalPostId,
            question: f.question,
            answer: f.answer,
            sort_order: i,
          })));
      }

      alert(publish ? "Artikel veröffentlicht!" : "Artikel gespeichert!");
      navigate("/admin");
    } catch (err) {
      console.error("Error saving post:", err);
      alert("Fehler beim Speichern des Artikels");
    } finally {
      setSaving(false);
    }
  }

  const deReadingTime = calculateReadingTimeFromBlocks(deBlocks);
  const enReadingTime = calculateReadingTimeFromBlocks(enBlocks);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-gray-400 hover:text-dark transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Admin
          </button>
          <h1 className="text-3xl font-bold text-dark">
            {isEdit ? "Artikel bearbeiten" : "Neuer Artikel"}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <span className="px-4 py-2 rounded-lg font-medium bg-primary-blue text-white">
                <Globe className="w-4 h-4 inline mr-2" />
                Deutsch
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleSave(false)} disabled={saving} variant="outlined">
                Speichern
              </Button>
              {status !== "PUBLISHED" && (
                <Button onClick={() => handleSave(true)} disabled={saving} variant="primary">
                  Veröffentlichen
                </Button>
              )}
            </div>
          </div>

          <LocaleFields
            locale="de"
            title={deTitle}
            onTitleChange={(v) => handleTitleChange(v, "de")}
            slug={deSlug}
            onSlugChange={setDeSlug}
            excerpt={deExcerpt}
            onExcerptChange={setDeExcerpt}
            blocks={deBlocks}
            onBlocksChange={setDeBlocks}
            summaryPoints={deSummaryPoints}
            onSummaryPointsChange={setDeSummaryPoints}
            seoTitle={deSeoTitle}
            onSeoTitleChange={setDeSeoTitle}
            seoDescription={deSeoDescription}
            onSeoDescriptionChange={setDeSeoDescription}
            readingTime={deReadingTime}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-blue" />
              Hero Image
            </h3>
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleHeroImageUpload(file);
                  }}
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Wird hochgeladen..." : "Bild hochladen"}
                </span>
              </label>
              {heroImageUrl && (
                <div className="relative">
                  <img src={heroImageUrl} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setHeroImageUrl("")}
                    className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary-blue" />
              Einstellungen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Autor</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="DRAFT">Entwurf</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Veröffentlicht</option>
                  <option value="ARCHIVED">Archiviert</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeatured}
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    isFeatured ? "bg-primary-blue" : "bg-gray-200"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    isFeatured ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Featured-Artikel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-blue" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  if (selectedTags.includes(tag.id)) {
                    setSelectedTags(selectedTags.filter(id => id !== tag.id));
                  } else {
                    setSelectedTags([...selectedTags, tag.id]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag.id)
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {tag.name_de} / {tag.name_en}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-blue" />
              FAQ (optional)
            </h3>
            <button
              type="button"
              onClick={addFaq}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Frage hinzufügen
            </button>
          </div>
          {faqs.length === 0 ? (
            <p className="text-sm text-gray-400">
              Keine FAQ-Einträge. Wird am Ende des Artikels als aufklappbare Fragen angezeigt.
            </p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Frage
                        </label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaq(index, "question", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="z.B. Was ist die Mietpreisbremse?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Antwort
                        </label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, "answer", e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          placeholder="Die Antwort auf die Frage..."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocaleFields({
  locale,
  title, onTitleChange,
  slug, onSlugChange,
  excerpt, onExcerptChange,
  blocks, onBlocksChange,
  summaryPoints, onSummaryPointsChange,
  seoTitle, onSeoTitleChange,
  seoDescription, onSeoDescriptionChange,
  readingTime,
}: {
  locale: "de" | "en";
  title: string; onTitleChange: (v: string) => void;
  slug: string; onSlugChange: (v: string) => void;
  excerpt: string; onExcerptChange: (v: string) => void;
  blocks: ContentBlock[]; onBlocksChange: (v: ContentBlock[]) => void;
  summaryPoints: string[]; onSummaryPointsChange: (v: string[]) => void;
  seoTitle: string; onSeoTitleChange: (v: string) => void;
  seoDescription: string; onSeoDescriptionChange: (v: string) => void;
  readingTime: number;
}) {
  const isDe = locale === "de";
  const urlPrefix = isDe ? "/magazin/" : "/magazine/";

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {isDe ? "Titel (DE) *" : "Title (EN) *"}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-lg font-semibold"
          placeholder={isDe ? "z.B. Die 10 besten Tipps für Vermieter" : "e.g. The 10 Best Tips for Landlords"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {isDe ? "Slug (DE) *" : "Slug (EN) *"}
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
        />
        <p className="text-xs text-gray-400 mt-1">URL: {urlPrefix}{slug || "slug"}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {isDe ? "Kurzbeschreibung (DE)" : "Short description (EN)"}
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
          placeholder={isDe ? "Kurze Beschreibung für Magazin-Karten und SEO..." : "Short description for cards and SEO..."}
        />
      </div>

      <SummaryPointsEditor
        points={summaryPoints}
        onChange={onSummaryPointsChange}
        isDe={isDe}
      />

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            {isDe ? "Inhalt (DE) *" : "Content (EN) *"}
          </label>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
            ~{readingTime} Min. Lesezeit
          </span>
        </div>
        <BlockEditor blocks={blocks} onChange={onBlocksChange} />
      </div>

      <details className="group">
        <summary className="text-sm font-medium text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
          SEO-Einstellungen ({locale.toUpperCase()})
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => onSeoTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder={isDe ? "Optional, sonst wird Titel verwendet" : "Optional, uses title if empty"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              SEO Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder={isDe ? "Optional, sonst wird Kurzbeschreibung verwendet" : "Optional, uses excerpt if empty"}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function SummaryPointsEditor({
  points, onChange, isDe
}: {
  points: string[];
  onChange: (v: string[]) => void;
  isDe: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-[#3c8af7]" />
          {isDe ? "Zusammenfassung (Bulletpoints)" : "Summary (Bullet Points)"}
        </label>
        <span className="text-xs text-gray-400">
          {isDe ? "Optional - wird oben im Artikel angezeigt" : "Optional - shown at top of article"}
        </span>
      </div>
      {points.length > 0 && (
        <div className="space-y-2 mb-3">
          {points.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[#3c8af7]/10 text-[#3c8af7] rounded-full flex items-center justify-center text-xs flex-shrink-0">
                &#10003;
              </span>
              <input
                type="text"
                value={point}
                onChange={(e) => {
                  const updated = [...points];
                  updated[index] = e.target.value;
                  onChange(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white"
                placeholder={isDe ? "z.B. Mietpreisbremse gilt seit 2015" : "e.g. Rent cap applies since 2015"}
              />
              <button
                type="button"
                onClick={() => onChange(points.filter((_, i) => i !== index))}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...points, ""])}
        className="flex items-center gap-1.5 text-sm font-medium text-[#3c8af7] hover:text-[#2b7ae6] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {isDe ? "Punkt hinzufügen" : "Add point"}
      </button>
    </div>
  );
}
