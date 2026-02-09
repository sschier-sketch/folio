import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { Search, Calendar, Tag as TagIcon, FolderOpen, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { RefLink } from "../components/common/RefLink";
import { Button } from "../components/ui/Button";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  author_name: string;
  published_at: string;
  topic_name?: string;
  topic_slug?: string;
  tags: Array<{ name: string; slug: string }>;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const POSTS_PER_PAGE = 10;

export function Magazine() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const searchTerm = searchParams.get("search") || "";
  const topicSlug = searchParams.get("topic") || "";
  const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    loadTopicsAndTags();
  }, [language]);

  useEffect(() => {
    loadPosts();
  }, [language, searchTerm, topicSlug, selectedTags.join(","), page]);

  async function loadTopicsAndTags() {
    try {
      const { data: topicsData } = await supabase
        .from("mag_topics")
        .select(`
          id,
          translations:mag_topic_translations!inner(name, slug)
        `)
        .eq("translations.locale", language)
        .order("translations.name");

      const { data: tagsData } = await supabase
        .from("mag_tags")
        .select(`
          id,
          translations:mag_tag_translations!inner(name, slug)
        `)
        .eq("translations.locale", language)
        .order("translations.name");

      if (topicsData) {
        setTopics(topicsData.map((t: any) => ({
          id: t.id,
          name: t.translations[0]?.name || "",
          slug: t.translations[0]?.slug || ""
        })));
      }

      if (tagsData) {
        setTags(tagsData.map((t: any) => ({
          id: t.id,
          name: t.translations[0]?.name || "",
          slug: t.translations[0]?.slug || ""
        })));
      }
    } catch (err) {
      console.error("Error loading topics/tags:", err);
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      let query = supabase
        .from("mag_posts")
        .select(`
          id,
          hero_image_url,
          author_name,
          published_at,
          translations:mag_post_translations!inner(title, slug, excerpt),
          topic:mag_topics(
            translations:mag_topic_translations(name, slug)
          ),
          post_tags:mag_post_tags(
            tag:mag_tags(
              translations:mag_tag_translations(name, slug)
            )
          )
        `, { count: "exact" })
        .eq("status", "PUBLISHED")
        .eq("translations.locale", language)
        .not("published_at", "is", null);

      if (searchTerm) {
        query = query.or(
          `translations.title.ilike.%${searchTerm}%,translations.excerpt.ilike.%${searchTerm}%,translations.content.ilike.%${searchTerm}%`
        );
      }

      if (topicSlug) {
        query = query
          .eq("topic.translations.locale", language)
          .eq("topic.translations.slug", topicSlug);
      }

      if (selectedTags.length > 0) {
        query = query.in("post_tags.tag.translations.slug", selectedTags);
      }

      query = query.order("published_at", { ascending: false });

      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);

      const formatted: Post[] = (data || []).map((post: any) => ({
        id: post.id,
        slug: post.translations?.[0]?.slug || "",
        title: post.translations?.[0]?.title || "",
        excerpt: post.translations?.[0]?.excerpt,
        hero_image_url: post.hero_image_url,
        author_name: post.author_name,
        published_at: post.published_at,
        topic_name: post.topic?.translations?.find((t: any) => t.locale === language)?.name,
        topic_slug: post.topic?.translations?.find((t: any) => t.locale === language)?.slug,
        tags: (post.post_tags || [])
          .map((pt: any) => {
            const tagTrans = pt.tag?.translations?.find((t: any) => t.locale === language);
            return tagTrans ? { name: tagTrans.name, slug: tagTrans.slug } : null;
          })
          .filter(Boolean)
      }));

      setPosts(formatted);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateSearchParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    setSearchParams(params);
  }

  function toggleTag(tagSlug: string) {
    const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    let newTags: string[];

    if (currentTags.includes(tagSlug)) {
      newTags = currentTags.filter(t => t !== tagSlug);
    } else {
      newTags = [...currentTags, tagSlug];
    }

    updateSearchParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
  }

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const magazineBasePath = language === "de" ? "/magazin" : "/magazine";

  const hasFilters = searchTerm || topicSlug || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
              {language === "de" ? "Magazin" : "Magazine"}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {language === "de"
                ? "Tipps, Tricks und Wissenswertes rund um die Immobilienverwaltung"
                : "Tips, tricks and knowledge about property management"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => updateSearchParams({ search: e.target.value })}
                  placeholder={language === "de" ? "Artikel durchsuchen..." : "Search articles..."}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div className="relative">
                <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <select
                  value={topicSlug}
                  onChange={(e) => updateSearchParams({ topic: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue appearance-none bg-white"
                >
                  <option value="">
                    {language === "de" ? "Alle Themen" : "All Topics"}
                  </option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.slug}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    {language === "de" ? "Tags filtern" : "Filter by tags"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag.slug)
                          ? "bg-primary-blue text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {language === "de" ? "Aktive Filter:" : "Active filters:"}
                </span>
                {searchTerm && (
                  <button
                    onClick={() => updateSearchParams({ search: null })}
                    className="px-3 py-1 bg-primary-blue/10 text-primary-blue rounded-full flex items-center gap-2 text-sm hover:bg-primary-blue/20 transition-colors"
                  >
                    {searchTerm}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {topicSlug && (
                  <button
                    onClick={() => updateSearchParams({ topic: null })}
                    className="px-3 py-1 bg-primary-blue/10 text-primary-blue rounded-full flex items-center gap-2 text-sm hover:bg-primary-blue/20 transition-colors"
                  >
                    {topics.find(t => t.slug === topicSlug)?.name}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedTags.map((tagSlug) => {
                  const tag = tags.find(t => t.slug === tagSlug);
                  return tag ? (
                    <button
                      key={tagSlug}
                      onClick={() => toggleTag(tagSlug)}
                      className="px-3 py-1 bg-primary-blue/10 text-primary-blue rounded-full flex items-center gap-2 text-sm hover:bg-primary-blue/20 transition-colors"
                    >
                      {tag.name}
                      <X className="w-3 h-3" />
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-dark transition-colors text-sm font-medium"
                >
                  {language === "de" ? "Alle Filter entfernen" : "Clear all filters"}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">
                {language === "de" ? "Keine Artikel gefunden" : "No articles found"}
              </h3>
              <p className="text-gray-400 mb-6">
                {language === "de"
                  ? "Versuchen Sie es mit anderen Suchbegriffen oder Filtern."
                  : "Try different search terms or filters."}
              </p>
              {hasFilters && (
                <Button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  variant="primary"
                >
                  {language === "de" ? "Alle Filter entfernen" : "Clear all filters"}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-gray-400">
                {language === "de"
                  ? `${totalCount} Artikel${totalCount !== 1 ? "" : ""} gefunden`
                  : `${totalCount} article${totalCount !== 1 ? "s" : ""} found`}
              </div>

              <div className="grid gap-8 mb-12">
                {posts.map((post) => (
                  <RefLink
                    key={post.id}
                    to={`${magazineBasePath}/${post.slug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="md:flex">
                      {post.hero_image_url && (
                        <div className="md:w-1/3 h-64 md:h-auto">
                          <img
                            src={post.hero_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={`p-6 ${post.hero_image_url ? "md:w-2/3" : "w-full"}`}>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.published_at).toLocaleDateString(language === "de" ? "de-DE" : "en-US")}
                          </div>
                          {post.topic_name && (
                            <div className="flex items-center gap-1">
                              <FolderOpen className="w-4 h-4" />
                              <span className="hover:text-primary-blue transition-colors">
                                {post.topic_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-dark mb-3 group-hover:text-primary-blue transition-colors">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-gray-400 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag.slug}
                                className="px-3 py-1 bg-gray-100 text-gray-400 text-sm rounded-full"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {post.tags.length > 5 && (
                              <span className="px-3 py-1 text-gray-400 text-sm">
                                +{post.tags.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </RefLink>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        const params = new URLSearchParams(searchParams);
                        params.set("page", String(page - 1));
                        setSearchParams(params);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set("page", String(pageNum));
                            setSearchParams(params);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            pageNum === page
                              ? "bg-primary-blue text-white"
                              : "hover:bg-gray-100 text-gray-400"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        const params = new URLSearchParams(searchParams);
                        params.set("page", String(page + 1));
                        setSearchParams(params);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
