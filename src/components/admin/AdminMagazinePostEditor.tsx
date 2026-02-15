import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Image as ImageIcon, Tag, FolderOpen, Upload, X, Plus, GripVertical } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from '../ui/Button';
import { calculateReadingTime } from "../../lib/markdownRenderer";
import { CATEGORIES, CATEGORY_LABELS } from "../magazine/magazineConstants";

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
  const [deContent, setDeContent] = useState("");
  const [deSeoTitle, setDeSeoTitle] = useState("");
  const [deSeoDescription, setDeSeoDescription] = useState("");
  const [deOgImageUrl, setDeOgImageUrl] = useState("");

  const [enTitle, setEnTitle] = useState("");
  const [enSlug, setEnSlug] = useState("");
  const [enExcerpt, setEnExcerpt] = useState("");
  const [enContent, setEnContent] = useState("");
  const [enSeoTitle, setEnSeoTitle] = useState("");
  const [enSeoDescription, setEnSeoDescription] = useState("");
  const [enOgImageUrl, setEnOgImageUrl] = useState("");

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
          de:mag_post_translations(title, slug, excerpt, content, seo_title, seo_description, og_image_url, reading_time_minutes),
          en:mag_post_translations(title, slug, excerpt, content, seo_title, seo_description, og_image_url, reading_time_minutes),
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
        setDeContent(deTrans.content);
        setDeSeoTitle(deTrans.seo_title || "");
        setDeSeoDescription(deTrans.seo_description || "");
        setDeOgImageUrl(deTrans.og_image_url || "");
      }

      const enTrans = post.en?.[0];
      if (enTrans) {
        setEnTitle(enTrans.title);
        setEnSlug(enTrans.slug);
        setEnExcerpt(enTrans.excerpt || "");
        setEnContent(enTrans.content);
        setEnSeoTitle(enTrans.seo_title || "");
        setEnSeoDescription(enTrans.seo_description || "");
        setEnOgImageUrl(enTrans.og_image_url || "");
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

  async function handleImageUpload(file: File) {
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
    if (!deTitle || !deSlug || !deContent) {
      alert("Bitte füllen Sie mindestens Titel, Slug und Inhalt für DE aus");
      return;
    }

    if (!enTitle || !enSlug || !enContent) {
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

      const deReadingTime = calculateReadingTime(deContent);
      const enReadingTime = calculateReadingTime(enContent);

      const { error: deError } = await supabase
        .from("mag_post_translations")
        .upsert({
          post_id: finalPostId,
          locale: "de",
          title: deTitle,
          slug: deSlug,
          excerpt: deExcerpt || null,
          content: deContent,
          seo_title: deSeoTitle || null,
          seo_description: deSeoDescription || null,
          og_image_url: deOgImageUrl || null,
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
          seo_title: enSeoTitle || null,
          seo_description: enSeoDescription || null,
          og_image_url: enOgImageUrl || null,
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

  const deReadingTime = calculateReadingTime(deContent);
  const enReadingTime = calculateReadingTime(enContent);

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
              <button
                onClick={() => setActiveLocale("de")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLocale === "de"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Deutsch
              </button>
              <button
                onClick={() => setActiveLocale("en")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeLocale === "en"
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                English
              </button>
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

          {activeLocale === "de" ? (
            <LocaleFields
              locale="de"
              title={deTitle}
              onTitleChange={(v) => handleTitleChange(v, "de")}
              slug={deSlug}
              onSlugChange={setDeSlug}
              excerpt={deExcerpt}
              onExcerptChange={setDeExcerpt}
              content={deContent}
              onContentChange={setDeContent}
              seoTitle={deSeoTitle}
              onSeoTitleChange={setDeSeoTitle}
              seoDescription={deSeoDescription}
              onSeoDescriptionChange={setDeSeoDescription}
              ogImageUrl={deOgImageUrl}
              onOgImageUrlChange={setDeOgImageUrl}
              readingTime={deReadingTime}
            />
          ) : (
            <LocaleFields
              locale="en"
              title={enTitle}
              onTitleChange={(v) => handleTitleChange(v, "en")}
              slug={enSlug}
              onSlugChange={setEnSlug}
              excerpt={enExcerpt}
              onExcerptChange={setEnExcerpt}
              content={enContent}
              onContentChange={setEnContent}
              seoTitle={enSeoTitle}
              onSeoTitleChange={setEnSeoTitle}
              seoDescription={enSeoDescription}
              onSeoDescriptionChange={setEnSeoDescription}
              ogImageUrl={enOgImageUrl}
              onOgImageUrlChange={setEnOgImageUrl}
              readingTime={enReadingTime}
            />
          )}
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
                    if (file) handleImageUpload(file);
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
            <h3 className="font-semibold text-dark">FAQ</h3>
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
              Keine FAQ-Einträge. Klicken Sie auf "Frage hinzufügen", um einen zu erstellen.
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
  content, onContentChange,
  seoTitle, onSeoTitleChange,
  seoDescription, onSeoDescriptionChange,
  ogImageUrl, onOgImageUrlChange,
  readingTime,
}: {
  locale: "de" | "en";
  title: string; onTitleChange: (v: string) => void;
  slug: string; onSlugChange: (v: string) => void;
  excerpt: string; onExcerptChange: (v: string) => void;
  content: string; onContentChange: (v: string) => void;
  seoTitle: string; onSeoTitleChange: (v: string) => void;
  seoDescription: string; onSeoDescriptionChange: (v: string) => void;
  ogImageUrl: string; onOgImageUrlChange: (v: string) => void;
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
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
          {isDe ? "Excerpt / Zusammenfassung (DE)" : "Excerpt (EN)"}
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder={isDe ? "Kurze Zusammenfassung des Artikels..." : "Short summary..."}
        />
        <p className="text-xs text-gray-400 mt-1">
          {isDe
            ? "Wird als Zusammenfassungsfeld auf der Artikelseite und als Kurzbeschreibung im Magazin angezeigt."
            : "Displayed as the summary box on the article page and as a short description in the magazine."}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-400">
            {isDe ? "Inhalt (DE) * (Markdown)" : "Content (EN) * (Markdown)"}
          </label>
          <span className="text-xs text-gray-400">
            ~{readingTime} Min. Lesezeit
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={15}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono text-sm"
          placeholder={isDe ? "## Überschrift\n\nIhr Artikel-Text hier..." : "## Heading\n\nYour article text here..."}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            SEO Title ({locale.toUpperCase()})
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
            OG Image URL ({locale.toUpperCase()})
          </label>
          <input
            type="text"
            value={ogImageUrl}
            onChange={(e) => onOgImageUrlChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          SEO Description ({locale.toUpperCase()})
        </label>
        <textarea
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          placeholder={isDe ? "Optional, sonst wird Excerpt verwendet" : "Optional, uses excerpt if empty"}
        />
      </div>
    </div>
  );
}
