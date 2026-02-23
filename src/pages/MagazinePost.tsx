import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { RefLink } from "../components/common/RefLink";
import { renderMarkdown, extractHeadings } from "../lib/markdownRenderer";
import {
  isBlockContent,
  parseContentBlocks,
  renderBlocksToHtml,
  extractHeadingsFromBlocks,
} from "../lib/contentBlocks";
import { CATEGORY_LABELS } from "../components/magazine/magazineConstants";
import ArticleTableOfContents from "../components/magazine/ArticleTableOfContents";
import ArticleFaq from "../components/magazine/ArticleFaq";
import ArticleShareButtons from "../components/magazine/ArticleShareButtons";
import MagazineCta from "../components/magazine/MagazineCta";
import { ARTICLE_COMPONENT_REGISTRY } from "../components/magazine/articleComponents";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  summary_points?: string[];
  hero_image_url?: string;
  hero_image_alt?: string;
  author_name: string;
  published_at: string;
  category: string;
  reading_time_minutes: number;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  published_at: string;
  category: string;
  reading_time_minutes: number;
  author_name: string;
}

export function MagazinePost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language: _language } = useLanguage();
  const locale = "de";
  const [post, setPost] = useState<Post | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const magazineBasePath = "/magazin";

  useEffect(() => {
    loadPost();
  }, [slug, locale]);

  async function loadPost() {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    try {
      const { data: redirect } = await supabase
        .from("mag_slug_history")
        .select("new_slug")
        .eq("entity_type", "post")
        .eq("locale", locale)
        .eq("old_slug", slug)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (redirect) {
        navigate(`${magazineBasePath}/${redirect.new_slug}`, { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("mag_posts")
        .select(`
          id,
          hero_image_url,
          hero_image_alt,
          author_name,
          published_at,
          category,
          translations:mag_post_translations!inner(
            title, slug, excerpt, content, summary_points, reading_time_minutes,
            seo_title, seo_description, og_image_url
          )
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", locale)
        .eq("translations.slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setNotFound(true);
        return;
      }

      const t = data.translations?.[0];
      const currentPost: Post = {
        id: data.id,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
        summary_points: Array.isArray(t.summary_points) ? t.summary_points : [],
        hero_image_url: data.hero_image_url,
        hero_image_alt: data.hero_image_alt,
        author_name: data.author_name,
        published_at: data.published_at,
        category: data.category,
        reading_time_minutes: t.reading_time_minutes || 1,
        seo_title: t.seo_title,
        seo_description: t.seo_description,
        og_image_url: t.og_image_url,
      };

      setPost(currentPost);
      document.title = t.seo_title || `${t.title} – rentably`;

      loadFaqs(data.id);
      loadRelated(data.id, data.category);
    } catch (err) {
      console.error("Error loading post:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadFaqs(postId: string) {
    try {
      const { data } = await supabase
        .from("mag_post_faqs")
        .select("id, question, answer")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true });

      setFaqs(data || []);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    }
  }

  async function loadRelated(postId: string, _category: string) {
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
          translations:mag_post_translations!inner(title, slug, excerpt, reading_time_minutes)
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", locale)
        .neq("id", postId)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) {
        setRelatedPosts(
          data.map((p: any) => ({
            id: p.id,
            slug: p.translations[0]?.slug || "",
            title: p.translations[0]?.title || "",
            excerpt: p.translations[0]?.excerpt,
            hero_image_url: p.hero_image_url,
            hero_image_alt: p.hero_image_alt,
            published_at: p.published_at,
            category: p.category,
            reading_time_minutes: p.translations[0]?.reading_time_minutes || 1,
            author_name: p.author_name,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading related posts:", err);
    }
  }

  const isBlocks = useMemo(
    () => post?.content ? isBlockContent(post.content) : false,
    [post?.content]
  );

  const headings = useMemo(() => {
    if (!post?.content) return [];
    if (isBlocks) {
      return extractHeadingsFromBlocks(parseContentBlocks(post.content));
    }
    return extractHeadings(post.content);
  }, [post?.content, isBlocks]);

  const htmlContent = useMemo(() => {
    if (!post?.content) return "";
    if (isBlocks) {
      return renderBlocksToHtml(parseContentBlocks(post.content));
    }
    return renderMarkdown(post.content);
  }, [post?.content, isBlocks]);

  const contentSegments = useMemo(() => {
    if (!htmlContent) return [];
    const parts = htmlContent.split(/<div data-component="([^"]+)"(?:\s+data-props="([^"]*)")?\s*><\/div>/);
    const segments: Array<{ type: 'html'; html: string } | { type: 'component'; name: string; props: Record<string, unknown> }> = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) segments.push({ type: 'html', html: parts[i] });
      } else if (i % 3 === 1) {
        const name = parts[i];
        const rawProps = parts[i + 1];
        let props: Record<string, unknown> = {};
        if (rawProps) {
          try { props = JSON.parse(rawProps.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'")); } catch {}
        }
        segments.push({ type: 'component', name, props });
      }
    }
    return segments;
  }, [htmlContent]);

  const hasComponents = contentSegments.some(s => s.type === 'component');

  const summaryPoints = useMemo(
    () => (post?.summary_points || []).filter(p => p.trim()),
    [post?.summary_points]
  );

  const faqSchema = useMemo(() => {
    if (faqs.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    };
  }, [faqs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#3c8af7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Artikel nicht gefunden
          </h1>
          <p className="text-gray-500 mb-8">
            Der gesuchte Artikel existiert nicht oder wurde entfernt.
          </p>
          <RefLink
            to={magazineBasePath}
            className="inline-block px-6 py-3 bg-[#3c8af7] text-white text-sm font-semibold rounded-lg hover:bg-[#2b7ae6] transition-colors"
          >
            Zurück zum Magazin
          </RefLink>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {post.hero_image_url && (
        <div className="w-full max-w-[1200px] mx-auto px-4 pt-8">
          <img
            src={post.hero_image_url}
            alt={post.hero_image_alt || post.title}
            className="w-full h-48 sm:h-64 md:h-[420px] object-cover rounded-2xl"
          />
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-4">
        <RefLink
          to={magazineBasePath}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle Artikel
        </RefLink>
      </div>

      <article className="max-w-[1200px] mx-auto px-4 pb-16">
        <div className="flex gap-16">
          <div className="max-w-[760px] flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#3c8af7]/10 text-[#3c8af7]">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              <span className="text-sm text-gray-400">
                {post.reading_time_minutes} Min. Lesezeit
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>

            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{post.author_name}</span>
                <span className="text-gray-200">|</span>
                <span>{formattedDate}</span>
              </div>
              <ArticleShareButtons
                url={window.location.href}
                title={post.title}
              />
            </div>

            {post.excerpt && (
              <div className="mb-8 text-lg text-gray-600 leading-relaxed font-medium">
                {post.excerpt}
              </div>
            )}

            {summaryPoints.length > 0 && (
              <div className="mb-12 bg-gradient-to-br from-blue-50 to-sky-50/50 rounded-2xl p-6 md:p-8 border border-blue-100/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#3c8af7] mb-4">
                  Das Wichtigste in Kürze
                </h3>
                <ul className="space-y-3">
                  {summaryPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-[#3c8af7] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed text-[15px]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasComponents ? (
              <div className="magazine-article-content">
                {contentSegments.map((seg, i) => {
                  if (seg.type === 'html') {
                    return <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />;
                  }
                  const Comp = ARTICLE_COMPONENT_REGISTRY[seg.name];
                  if (!Comp) return null;
                  return <Comp key={i} {...seg.props} />;
                })}
              </div>
            ) : (
              <div
                className="magazine-article-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            <ArticleFaq faqs={faqs} />
          </div>

          {headings.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <ArticleTableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Neueste Artikel
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <RefLink
                  key={rp.id}
                  to={`${magazineBasePath}/${rp.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {rp.hero_image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={rp.hero_image_url}
                        alt={rp.hero_image_alt || rp.title}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="text-[#3c8af7] font-semibold">
                        {CATEGORY_LABELS[rp.category] || rp.category}
                      </span>
                      <span>|</span>
                      <span>{rp.reading_time_minutes} Min.</span>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#3c8af7] transition-colors line-clamp-2 mb-2">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {rp.excerpt}
                      </p>
                    )}
                  </div>
                </RefLink>
              ))}
            </div>
          </div>
        </section>
      )}

      <MagazineCta />
    </div>
  );
}
