import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import MagazineHero from "../components/magazine/MagazineHero";
import MagazineFeatured from "../components/magazine/MagazineFeatured";
import MagazineCard from "../components/magazine/MagazineCard";
import CategoryFilter from "../components/magazine/CategoryFilter";
import MagazineCta from "../components/magazine/MagazineCta";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  author_name: string;
  published_at: string;
  category: string;
  reading_time_minutes: number;
  is_featured: boolean;
}

const POSTS_PER_PAGE = 9;

export function Magazine() {
  const { language: _language } = useLanguage();
  const locale = "de";
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const activeCategory = searchParams.get("kategorie") || "alle";
  const page = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("suche") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const magazineBasePath = "/magazin";

  useEffect(() => {
    loadFeatured();
  }, [locale]);

  useEffect(() => {
    loadPosts();
  }, [locale, activeCategory, page, searchQuery]);

  async function loadFeatured() {
    try {
      const { data } = await supabase
        .from("mag_posts")
        .select(`
          id,
          hero_image_url,
          hero_image_alt,
          author_name,
          published_at,
          category,
          is_featured,
          translations:mag_post_translations!inner(title, slug, excerpt, reading_time_minutes)
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", locale)
        .not("published_at", "is", null)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const p = data[0] as any;
        setFeaturedPost({
          id: p.id,
          slug: p.translations?.[0]?.slug || "",
          title: p.translations?.[0]?.title || "",
          excerpt: p.translations?.[0]?.excerpt,
          hero_image_url: p.hero_image_url,
          hero_image_alt: p.hero_image_alt,
          author_name: p.author_name,
          published_at: p.published_at,
          category: p.category,
          reading_time_minutes: p.translations?.[0]?.reading_time_minutes || 1,
          is_featured: true,
        });
      } else {
        const { data: latest } = await supabase
          .from("mag_posts")
          .select(`
            id,
            hero_image_url,
            author_name,
            published_at,
            category,
            is_featured,
            translations:mag_post_translations!inner(title, slug, excerpt, reading_time_minutes)
          `)
          .eq("status", "PUBLISHED")
          .eq("translations.locale", locale)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(1);

        if (latest && latest.length > 0) {
          const p = latest[0] as any;
          setFeaturedPost({
            id: p.id,
            slug: p.translations?.[0]?.slug || "",
            title: p.translations?.[0]?.title || "",
            excerpt: p.translations?.[0]?.excerpt,
            hero_image_url: p.hero_image_url,
            author_name: p.author_name,
            published_at: p.published_at,
            category: p.category,
            reading_time_minutes: p.translations?.[0]?.reading_time_minutes || 1,
            is_featured: false,
          });
        }
      }
    } catch (err) {
      console.error("Error loading featured post:", err);
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
          hero_image_alt,
          author_name,
          published_at,
          category,
          is_featured,
          translations:mag_post_translations!inner(title, slug, excerpt, reading_time_minutes)
        `, { count: "exact" })
        .eq("status", "PUBLISHED")
        .eq("translations.locale", locale)
        .not("published_at", "is", null);

      if (activeCategory !== "alle") {
        query = query.eq("category", activeCategory);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery.trim()}%,excerpt.ilike.%${searchQuery.trim()}%`,
          { referencedTable: "translations" }
        );
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
        hero_image_alt: post.hero_image_alt,
        author_name: post.author_name,
        published_at: post.published_at,
        category: post.category,
        reading_time_minutes: post.translations?.[0]?.reading_time_minutes || 1,
        is_featured: post.is_featured,
      }));

      setPosts(formatted);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(cat: string) {
    const params = new URLSearchParams();
    if (cat !== "alle") {
      params.set("kategorie", cat);
    }
    if (searchQuery.trim()) {
      params.set("suche", searchQuery.trim());
    }
    setSearchParams(params);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeCategory !== "alle") {
      params.set("kategorie", activeCategory);
    }
    if (searchInput.trim()) {
      params.set("suche", searchInput.trim());
    }
    setSearchParams(params);
  }

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <div className="bg-white">
      <MagazineHero />

      {featuredPost && (
        <MagazineFeatured post={featuredPost} basePath={magazineBasePath} />
      )}

      <section className="pb-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Artikel durchsuchen..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3c8af7] focus:border-transparent transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      const params = new URLSearchParams();
                      if (activeCategory !== "alle") {
                        params.set("kategorie", activeCategory);
                      }
                      setSearchParams(params);
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs transition-colors"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-[#3c8af7] text-white text-sm font-semibold rounded-xl hover:bg-[#2b7ae6] transition-colors flex-shrink-0"
              >
                Suchen
              </button>
            </div>
          </form>

          <div className="flex justify-center mb-10">
            <CategoryFilter active={activeCategory} onChange={handleCategoryChange} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-[#3c8af7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Keine Artikel gefunden
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? `Keine Ergebnisse für "${searchQuery}".`
                  : "In dieser Kategorie gibt es noch keine Beiträge."}
              </p>
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchParams(new URLSearchParams());
                }}
                className="px-6 py-3 bg-[#3c8af7] text-white text-sm font-semibold rounded-lg hover:bg-[#2b7ae6] transition-colors"
              >
                Alle Beiträge anzeigen
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {posts.map((post) => (
                  <MagazineCard key={post.id} post={post} basePath={magazineBasePath} />
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
                    className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
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
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === page
                              ? "bg-[#3c8af7] text-white"
                              : "hover:bg-gray-100 text-gray-500"
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
                    className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <MagazineCta />
    </div>
  );
}
