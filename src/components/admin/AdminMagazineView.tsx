import { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { BaseTable, StatusBadge, ActionButton, ActionsCell } from "../common/BaseTable";

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
}

export default function AdminMagazineView() {
  const [activeTab, setActiveTab] = useState<"posts" | "topics" | "tags">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
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
          )
        `)
        .order("created_at", { ascending: false });

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
        topic_name: post.topic?.de_trans?.[0]?.name
      }));

      setPosts(formatted);
    } catch (err) {
      console.error("Error loading posts:", err);
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === "" ||
      post.de_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.en_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark">Magazin-Verwaltung</h2>
              <p className="text-sm text-gray-400">Blog-Artikel, Themen und Tags verwalten</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/admin/magazine/posts/new'}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Artikel
          </button>
        </div>

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
            onClick={() => setActiveTab("topics")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "topics"
                ? "border-primary-blue text-primary-blue"
                : "border-transparent text-gray-400 hover:text-dark"
            }`}
          >
            Themen
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
          <div className="p-6 border-b flex gap-4">
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
          </div>

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
                    <div className="font-medium text-dark">{post.de_title || "-"}</div>
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
                key: "topic_name",
                header: "Thema",
                render: (post: Post) => (
                  <span className="text-sm text-gray-400">{post.topic_name || "-"}</span>
                )
              },
              {
                key: "author_name",
                header: "Autor",
                render: (post: Post) => (
                  <span className="text-sm text-gray-400">{post.author_name}</span>
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
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => window.open(`/magazin/${post.de_slug}`, '_blank')}
                          title="Ansehen"
                        />
                        <ActionButton
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => handleUnpublish(post.id)}
                          title="Zurückziehen"
                        />
                      </>
                    ) : (
                      <ActionButton
                        icon={<Eye className="w-4 h-4" />}
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
        </div>
      )}

      {activeTab === "topics" && (
        <div className="p-6">
          <p className="text-gray-400">Themen-Verwaltung wird geladen...</p>
        </div>
      )}

      {activeTab === "tags" && (
        <div className="p-6">
          <p className="text-gray-400">Tag-Verwaltung wird geladen...</p>
        </div>
      )}
    </div>
  );
}
