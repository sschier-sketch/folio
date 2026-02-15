import { useState, useEffect } from "react";
import { BookOpen, Search, Edit, Trash2, Check, X, ExternalLink, Star, FileText, Eye, PenLine, Archive } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { BaseTable, StatusBadge, ActionButton, ActionsCell } from "../common/BaseTable";
import { Button } from '../ui/Button';
import { CATEGORY_LABELS } from "../magazine/magazineConstants";

interface Post {
  id: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  hero_image_url?: string;
  author_name: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  de_title?: string;
  de_slug?: string;
  en_title?: string;
  en_slug?: string;
  topic_name?: string;
  category?: string;
  is_featured?: boolean;
  tags: string[];
}

interface Tag {
  id: string;
  de_name: string;
  de_slug: string;
  en_name?: string;
  en_slug?: string;
  created_at: string;
}

export default function AdminMagazineView() {
  const [activeTab, setActiveTab] = useState<"posts" | "tags">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  const publishedCount = posts.filter(p => p.status === "PUBLISHED").length;
  const draftCount = posts.filter(p => p.status === "DRAFT" || p.status === "REVIEW").length;
  const archivedCount = posts.filter(p => p.status === "ARCHIVED").length;
  const featuredCount = posts.filter(p => p.is_featured).length;

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    } else if (activeTab === "tags") {
      loadTags();
    }
  }, [activeTab]);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("mag_posts")
        .select(`
          *,
          de:mag_post_translations!inner(title, slug),
          en:mag_post_translations(title, slug),
          topic:mag_topics(
            de_trans:mag_topic_translations!inner(name)
          ),
          post_tags:mag_post_tags(
            tag:mag_tags(
              translations:mag_tag_translations!inner(name)
            )
          )
        `)
        .eq("de.locale", "de")
        .eq("en.locale", "en")
        .eq("topic.de_trans.locale", "de")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const formatted = (postsData || []).map((post: any) => ({
        id: post.id,
        status: post.status,
        hero_image_url: post.hero_image_url,
        author_name: post.author_name,
        published_at: post.published_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        de_title: post.de?.[0]?.title,
        de_slug: post.de?.[0]?.slug,
        en_title: post.en?.[0]?.title,
        en_slug: post.en?.[0]?.slug,
        topic_name: post.topic?.de_trans?.[0]?.name,
        category: post.category,
        is_featured: post.is_featured,
        tags: (post.post_tags || []).map((pt: any) =>
          pt.tag?.translations?.[0]?.name
        ).filter(Boolean)
      }));

      setPosts(formatted);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTags() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mag_tags")
        .select(`
          id,
          created_at,
          de:mag_tag_translations!inner(name, slug),
          en:mag_tag_translations(name, slug)
        `)
        .eq("de.locale", "de")
        .eq("en.locale", "en")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((tag: any) => ({
        id: tag.id,
        de_name: tag.de?.[0]?.name || "",
        de_slug: tag.de?.[0]?.slug || "",
        en_name: tag.en?.[0]?.name,
        en_slug: tag.en?.[0]?.slug,
        created_at: tag.created_at
      }));

      setTags(formatted);
    } catch (err) {
      console.error("Error loading tags:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("Möchten Sie diesen Artikel wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("mag_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Fehler beim Löschen des Artikels");
    }
  }

  async function handlePublish(id: string) {
    try {
      const { error } = await supabase
        .from("mag_posts")
        .update({
          status: "PUBLISHED",
          published_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      loadPosts();
    } catch (err) {
      console.error("Error publishing post:", err);
      alert("Fehler beim Veröffentlichen");
    }
  }

  async function handleUnpublish(id: string) {
    try {
      const { error } = await supabase
        .from("mag_posts")
        .update({ status: "REVIEW" })
        .eq("id", id);

      if (error) throw error;
      loadPosts();
    } catch (err) {
      console.error("Error unpublishing post:", err);
      alert("Fehler beim Zurückziehen");
    }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm("Möchten Sie diesen Tag wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("mag_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTags(tags.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting tag:", err);
      alert("Fehler beim Löschen des Tags");
    }
  }

  async function handleSaveTag() {
    if (!editingTag) return;

    try {
      if (editingTag.id.startsWith("new-")) {
        const { data: tag, error: tagError } = await supabase
          .from("mag_tags")
          .insert({})
          .select()
          .single();

        if (tagError) throw tagError;

        const deSlug = editingTag.de_slug || generateSlug(editingTag.de_name);
        const enSlug = editingTag.en_slug || (editingTag.en_name ? generateSlug(editingTag.en_name) : deSlug);

        const { error: transError } = await supabase
          .from("mag_tag_translations")
          .insert([
            {
              tag_id: tag.id,
              locale: "de",
              name: editingTag.de_name,
              slug: deSlug
            },
            {
              tag_id: tag.id,
              locale: "en",
              name: editingTag.en_name || editingTag.de_name,
              slug: enSlug
            }
          ]);

        if (transError) throw transError;
      } else {
        const deSlug = editingTag.de_slug || generateSlug(editingTag.de_name);
        const enSlug = editingTag.en_slug || (editingTag.en_name ? generateSlug(editingTag.en_name) : deSlug);

        const { error: deError } = await supabase
          .from("mag_tag_translations")
          .update({
            name: editingTag.de_name,
            slug: deSlug
          })
          .eq("tag_id", editingTag.id)
          .eq("locale", "de");

        if (deError) throw deError;

        const { error: enError } = await supabase
          .from("mag_tag_translations")
          .upsert({
            tag_id: editingTag.id,
            locale: "en",
            name: editingTag.en_name || editingTag.de_name,
            slug: enSlug
          }, { onConflict: "tag_id,locale" });

        if (enError) throw enError;
      }

      setShowTagModal(false);
      setEditingTag(null);
      loadTags();
    } catch (err) {
      console.error("Error saving tag:", err);
      alert("Fehler beim Speichern des Tags");
    }
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === "" ||
      post.de_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.en_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesTopic = topicFilter === "all" || post.category === topicFilter;

    return matchesSearch && matchesStatus && matchesTopic;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-blue/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark">Magazin-Verwaltung</h2>
                <p className="text-sm text-gray-400">Artikel und Tags verwalten</p>
              </div>
            </div>
            {activeTab === "posts" && (
              <Button
                onClick={() => window.location.href = '/admin/magazine/posts/new'}
                variant="primary"
              >
                Neuer Artikel
              </Button>
            )}
            {activeTab === "tags" && (
              <Button
                onClick={() => {
                  setEditingTag({
                    id: `new-${Date.now()}`,
                    de_name: "",
                    de_slug: "",
                    en_name: "",
                    en_slug: "",
                    created_at: new Date().toISOString()
                  });
                  setShowTagModal(true);
                }}
                variant="primary"
              >
                Neuer Tag
              </Button>
            )}
          </div>

          {activeTab === "posts" && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark">{posts.length}</p>
                  <p className="text-xs text-gray-400">Gesamt</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
                  <p className="text-xs text-emerald-600/70">Veröffentlicht</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <PenLine className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
                  <p className="text-xs text-amber-600/70">Entwürfe</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Star className="w-4 h-4 text-primary-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-blue">{featuredCount}</p>
                  <p className="text-xs text-primary-blue/70">Featured</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 border-b -mb-6">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "posts"
                  ? "border-primary-blue text-primary-blue"
                  : "border-transparent text-gray-400 hover:text-dark"
              }`}
            >
              Artikel
            </button>
            <button
              onClick={() => setActiveTab("tags")}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === "tags"
                  ? "border-primary-blue text-primary-blue"
                  : "border-transparent text-gray-400 hover:text-dark"
              }`}
            >
              Tags
            </button>
          </div>
        </div>

        {activeTab === "posts" && (
          <div>
            <div className="p-6 border-b border-gray-100 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Artikel durchsuchen..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">Alle Status</option>
                <option value="DRAFT">Entwurf</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Veröffentlicht</option>
                <option value="ARCHIVED">Archiviert</option>
              </select>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="all">Alle Kategorien</option>
                {Object.entries(CATEGORY_LABELS)
                  .filter(([key]) => key !== "alle")
                  .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))
                }
              </select>
            </div>

            {!loading && posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-dark mb-2">Noch keine Artikel vorhanden</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  Erstellen Sie Ihren ersten Magazin-Artikel. Sie können Kategorien zuweisen, Hero-Bilder hochladen, FAQs hinzufügen und vieles mehr.
                </p>
                <Button
                  onClick={() => window.location.href = '/admin/magazine/posts/new'}
                  variant="primary"
                >
                  Ersten Artikel erstellen
                </Button>
              </div>
            ) : (
              <BaseTable
                columns={[
              {
                key: "status",
                header: "Status",
                render: (post: Post) => {
                  const statusConfig = {
                    DRAFT: { type: "neutral" as const, label: "Entwurf" },
                    REVIEW: { type: "info" as const, label: "Review" },
                    PUBLISHED: { type: "success" as const, label: "Veröffentlicht" },
                    ARCHIVED: { type: "neutral" as const, label: "Archiviert" }
                  };
                  const config = statusConfig[post.status];
                  return <StatusBadge type={config.type} label={config.label} />;
                }
              },
              {
                key: "de_title",
                header: "Titel (DE)",
                sortable: true,
                render: (post: Post) => (
                  <div>
                    <div className="font-medium text-dark flex items-center gap-1.5">
                      {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      {post.de_title || "-"}
                    </div>
                    <div className="text-xs text-gray-400">{post.de_slug}</div>
                  </div>
                )
              },
              {
                key: "en_title",
                header: "Titel (EN)",
                sortable: true,
                render: (post: Post) => (
                  <div>
                    <div className="font-medium text-dark">{post.en_title || "-"}</div>
                    <div className="text-xs text-gray-400">{post.en_slug}</div>
                  </div>
                )
              },
              {
                key: "category",
                header: "Kategorie",
                render: (post: Post) => (
                  <span className="px-2.5 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                    {CATEGORY_LABELS[post.category || "allgemein"] || post.category}
                  </span>
                )
              },
              {
                key: "tags",
                header: "Tags",
                render: (post: Post) => (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-xs text-gray-400 rounded">
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{post.tags.length - 2}</span>
                    )}
                  </div>
                )
              },
              {
                key: "published_at",
                header: "Veröffentlicht",
                sortable: true,
                render: (post: Post) => (
                  <span className="text-sm text-gray-400">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString("de-DE") : "-"}
                  </span>
                )
              },
              {
                key: "actions",
                header: "Aktionen",
                align: "center" as const,
                render: (post: Post) => (
                  <ActionsCell>
                    <ActionButton
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => window.location.href = `/admin/magazine/posts/${post.id}/edit`}
                      title="Bearbeiten"
                    />
                    {post.status === "PUBLISHED" ? (
                      <>
                        <ActionButton
                          icon={<ExternalLink className="w-4 h-4" />}
                          onClick={() => window.open(`/magazin/${post.de_slug}`, '_blank')}
                          title="Vorschau DE"
                        />
                        <ActionButton
                          icon={<ExternalLink className="w-4 h-4" />}
                          onClick={() => window.open(`/magazine/${post.en_slug}`, '_blank')}
                          title="Vorschau EN"
                        />
                        <ActionButton
                          icon={<X className="w-4 h-4" />}
                          onClick={() => handleUnpublish(post.id)}
                          title="Zurückziehen"
                        />
                      </>
                    ) : (
                      <ActionButton
                        icon={<Check className="w-4 h-4" />}
                        onClick={() => handlePublish(post.id)}
                        title="Veröffentlichen"
                      />
                    )}
                    <ActionButton
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeletePost(post.id)}
                      title="Löschen"
                    />
                  </ActionsCell>
                )
              }
            ]}
            data={filteredPosts}
            loading={loading}
            emptyMessage="Noch keine Artikel vorhanden"
          />
            )}
          </div>
        )}

      {activeTab === "tags" && (
        <div>
          <BaseTable
            columns={[
              {
                key: "de_name",
                header: "Name (DE)",
                sortable: true,
                render: (tag: Tag) => (
                  <div>
                    <div className="font-medium text-dark">{tag.de_name}</div>
                    <div className="text-xs text-gray-400">{tag.de_slug}</div>
                  </div>
                )
              },
              {
                key: "en_name",
                header: "Name (EN)",
                sortable: true,
                render: (tag: Tag) => (
                  <div>
                    <div className="font-medium text-dark">{tag.en_name || "-"}</div>
                    <div className="text-xs text-gray-400">{tag.en_slug}</div>
                  </div>
                )
              },
              {
                key: "created_at",
                header: "Erstellt",
                sortable: true,
                render: (tag: Tag) => (
                  <span className="text-sm text-gray-400">
                    {new Date(tag.created_at).toLocaleDateString("de-DE")}
                  </span>
                )
              },
              {
                key: "actions",
                header: "Aktionen",
                align: "center" as const,
                render: (tag: Tag) => (
                  <ActionsCell>
                    <ActionButton
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => {
                        setEditingTag(tag);
                        setShowTagModal(true);
                      }}
                      title="Bearbeiten"
                    />
                    <ActionButton
                      icon={<ExternalLink className="w-4 h-4" />}
                      onClick={() => window.open(`/magazin?tags=${tag.de_slug}`, '_blank')}
                      title="Vorschau"
                    />
                    <ActionButton
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDeleteTag(tag.id)}
                      title="Löschen"
                    />
                  </ActionsCell>
                )
              }
            ]}
            data={tags}
            loading={loading}
            emptyMessage="Noch keine Tags vorhanden"
          />
        </div>
      )}

      </div>

      {showTagModal && editingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-dark">
                {editingTag.id.startsWith("new-") ? "Neuer Tag" : "Tag bearbeiten"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name (DE) *
                </label>
                <input
                  type="text"
                  value={editingTag.de_name}
                  onChange={(e) => setEditingTag({ ...editingTag, de_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="z.B. Mietrecht"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Slug (DE)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingTag.de_slug}
                    onChange={(e) => setEditingTag({ ...editingTag, de_slug: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="mietrecht"
                  />
                  <Button
                    onClick={() => setEditingTag({ ...editingTag, de_slug: generateSlug(editingTag.de_name) })}
                    variant="secondary"
                  >
                    Generieren
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name (EN)
                </label>
                <input
                  type="text"
                  value={editingTag.en_name || ""}
                  onChange={(e) => setEditingTag({ ...editingTag, en_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="e.g. Rental Law"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Slug (EN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingTag.en_slug || ""}
                    onChange={(e) => setEditingTag({ ...editingTag, en_slug: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="rental-law"
                  />
                  <Button
                    onClick={() => setEditingTag({ ...editingTag, en_slug: generateSlug(editingTag.en_name || editingTag.de_name) })}
                    variant="secondary"
                  >
                    Generieren
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowTagModal(false);
                  setEditingTag(null);
                }}
                variant="secondary"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveTag}
                disabled={!editingTag.de_name}
                variant="primary"
              >
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
