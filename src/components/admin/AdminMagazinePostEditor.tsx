import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Image as ImageIcon, Tag, FolderOpen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from '../ui/Button';

interface Topic {
  id: string;
  name_de: string;
  name_en: string;
}

interface Tag {
  id: string;
  name_de: string;
  name_en: string;
}

export default function AdminMagazinePostEditor() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(postId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("Rentably Team");
  const [primaryTopicId, setPrimaryTopicId] = useState("");

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [activeLocale, setActiveLocale] = useState<"de" | "en">("de");

  useEffect(() => {
    loadTopicsAndTags();
    if (isEdit) {
      loadPost();
    }
  }, [postId]);

  async function loadTopicsAndTags() {
    try {
      const { data: topicsData } = await supabase
        .from("mag_topics")
        .select(`
          id,
          de:mag_topic_translations!inner(name),
          en:mag_topic_translations(name)
        `)
        .eq("de.locale", "de")
        .eq("en.locale", "en");

      const { data: tagsData } = await supabase
        .from("mag_tags")
        .select(`
          id,
          de:mag_tag_translations!inner(name),
          en:mag_tag_translations(name)
        `)
        .eq("de.locale", "de")
        .eq("en.locale", "en");

      if (topicsData) {
        setTopics(topicsData.map((t: any) => ({
          id: t.id,
          name_de: t.de?.[0]?.name || "",
          name_en: t.en?.[0]?.name || ""
        })));
      }

      if (tagsData) {
        setTags(tagsData.map((t: any) => ({
          id: t.id,
          name_de: t.de?.[0]?.name || "",
          name_en: t.en?.[0]?.name || ""
        })));
      }
    } catch (err) {
      console.error("Error loading topics/tags:", err);
    }
  }

  async function loadPost() {
    setLoading(true);
    try {
      const { data: post, error } = await supabase
        .from("mag_posts")
        .select(`
          *,
          de:mag_post_translations(title, slug, excerpt, content, seo_title, seo_description, og_image_url),
          en:mag_post_translations(title, slug, excerpt, content, seo_title, seo_description, og_image_url),
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
      setPrimaryTopicId(post.primary_topic_id || "");

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
      const postData = {
        status: publish ? "PUBLISHED" : status,
        hero_image_url: heroImageUrl || null,
        author_name: authorName,
        primary_topic_id: primaryTopicId || null,
        published_at: publish ? new Date().toISOString() : undefined
      };

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
          og_image_url: deOgImageUrl || null
        }, {
          onConflict: "post_id,locale"
        });

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
          og_image_url: enOgImageUrl || null
        }, {
          onConflict: "post_id,locale"
        });

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

      alert(publish ? "Artikel veröffentlicht!" : "Artikel gespeichert!");
      navigate("/admin");
    } catch (err) {
      console.error("Error saving post:", err);
      alert("Fehler beim Speichern des Artikels");
    } finally {
      setSaving(false);
    }
  }

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
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                variant="outlined"
              >
                Speichern
              </Button>
              {status !== "PUBLISHED" && (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  variant="primary"
                >
                  Veröffentlichen
                </Button>
              )}
            </div>
          </div>

          {activeLocale === "de" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Titel (DE) *
                </label>
                <input
                  type="text"
                  value={deTitle}
                  onChange={(e) => handleTitleChange(e.target.value, "de")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Die 10 besten Tipps für Vermieter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Slug (DE) *
                </label>
                <input
                  type="text"
                  value={deSlug}
                  onChange={(e) => setDeSlug(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="die-10-besten-tipps-fuer-vermieter"
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL: /magazin/{deSlug || "slug"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Excerpt (DE)
                </label>
                <textarea
                  value={deExcerpt}
                  onChange={(e) => setDeExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Kurze Zusammenfassung..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Inhalt (DE) * (Markdown)
                </label>
                <textarea
                  value={deContent}
                  onChange={(e) => setDeContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono text-sm"
                  placeholder="# Überschrift&#10;&#10;Ihr Artikel-Text hier..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    SEO Title (DE)
                  </label>
                  <input
                    type="text"
                    value={deSeoTitle}
                    onChange={(e) => setDeSeoTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Optional, sonst wird Titel verwendet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    OG Image URL (DE)
                  </label>
                  <input
                    type="text"
                    value={deOgImageUrl}
                    onChange={(e) => setDeOgImageUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  SEO Description (DE)
                </label>
                <textarea
                  value={deSeoDescription}
                  onChange={(e) => setDeSeoDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Optional, sonst wird Excerpt verwendet"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Title (EN) *
                </label>
                <input
                  type="text"
                  value={enTitle}
                  onChange={(e) => handleTitleChange(e.target.value, "en")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="e.g. The 10 Best Tips for Landlords"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Slug (EN) *
                </label>
                <input
                  type="text"
                  value={enSlug}
                  onChange={(e) => setEnSlug(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="the-10-best-tips-for-landlords"
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL: /magazine/{enSlug || "slug"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Excerpt (EN)
                </label>
                <textarea
                  value={enExcerpt}
                  onChange={(e) => setEnExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Short summary..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Content (EN) * (Markdown)
                </label>
                <textarea
                  value={enContent}
                  onChange={(e) => setEnContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono text-sm"
                  placeholder="# Heading&#10;&#10;Your article text here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    SEO Title (EN)
                  </label>
                  <input
                    type="text"
                    value={enSeoTitle}
                    onChange={(e) => setEnSeoTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Optional, uses title if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    OG Image URL (EN)
                  </label>
                  <input
                    type="text"
                    value={enOgImageUrl}
                    onChange={(e) => setEnOgImageUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  SEO Description (EN)
                </label>
                <textarea
                  value={enSeoDescription}
                  onChange={(e) => setEnSeoDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Optional, uses excerpt if empty"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-blue" />
              Hero Image
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="https://..."
              />
            </div>
            {heroImageUrl && (
              <div className="mt-4">
                <img src={heroImageUrl} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary-blue" />
              Thema & Autor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Hauptthema
                </label>
                <select
                  value={primaryTopicId}
                  onChange={(e) => setPrimaryTopicId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Kein Thema</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name_de} / {topic.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
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
      </div>
    </div>
  );
}
