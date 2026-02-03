import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { Search, Calendar, Tag as TagIcon, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

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

const POSTS_PER_PAGE = 10;

export function Magazine() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const searchTerm = searchParams.get("search") || "";
  const topicSlug = searchParams.get("topic") || "";
  const tagSlug = searchParams.get("tag") || "";
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    loadPosts();
  }, [language, searchTerm, topicSlug, tagSlug, page]);

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
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("translations.title", `%${searchTerm}%`);
      }

      if (topicSlug) {
        query = query
          .eq("topic.translations.locale", language)
          .eq("topic.translations.slug", topicSlug);
      }

      if (tagSlug) {
        query = query
          .eq("post_tags.tag.translations.locale", language)
          .eq("post_tags.tag.translations.slug", tagSlug);
      }

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

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const magazineBasePath = language === "de" ? "/magazin" : "/magazine";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
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

          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    params.set("search", e.target.value);
                  } else {
                    params.delete("search");
                  }
                  params.delete("page");
                  setSearchParams(params);
                }}
                placeholder={language === "de" ? "Artikel durchsuchen..." : "Search articles..."}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>

          {(topicSlug || tagSlug) && (
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="text-gray-400">
                {language === "de" ? "Filter:" : "Filter:"}
              </span>
              {topicSlug && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("topic");
                    params.delete("page");
                    setSearchParams(params);
                  }}
                  className="px-4 py-2 bg-primary-blue/10 text-primary-blue rounded-full flex items-center gap-2 hover:bg-primary-blue/20 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  {topicSlug}
                  <span className="ml-2">×</span>
                </button>
              )}
              {tagSlug && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("tag");
                    params.delete("page");
                    setSearchParams(params);
                  }}
                  className="px-4 py-2 bg-primary-blue/10 text-primary-blue rounded-full flex items-center gap-2 hover:bg-primary-blue/20 transition-colors"
                >
                  <TagIcon className="w-4 h-4" />
                  {tagSlug}
                  <span className="ml-2">×</span>
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                {language === "de" ? "Keine Artikel gefunden" : "No articles found"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 mb-12">
                {posts.map((post) => (
                  <Link
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
                              <Link
                                to={`${magazineBasePath}?topic=${post.topic_slug}`}
                                className="hover:text-primary-blue transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {post.topic_name}
                              </Link>
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
                            {post.tags.map((tag) => (
                              <Link
                                key={tag.slug}
                                to={`${magazineBasePath}?tag=${tag.slug}`}
                                className="px-3 py-1 bg-gray-100 text-gray-400 text-sm rounded-full hover:bg-primary-blue/10 hover:text-primary-blue transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tag.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
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
                      }
                    }}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set("page", String(pageNum));
                          setSearchParams(params);
                        }}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          pageNum === page
                            ? "bg-primary-blue text-white"
                            : "hover:bg-gray-100 text-gray-400"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        const params = new URLSearchParams(searchParams);
                        params.set("page", String(page + 1));
                        setSearchParams(params);
                      }
                    }}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
