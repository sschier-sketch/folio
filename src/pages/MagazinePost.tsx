import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { Calendar, Tag as TagIcon, FolderOpen, ArrowLeft, User, Share2, Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { RefLink } from "../components/common/RefLink";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  hero_image_url?: string;
  author_name: string;
  published_at: string;
  topic_id?: string;
  topic_name?: string;
  topic_slug?: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  hero_image_url?: string;
  published_at: string;
}

export function MagazinePost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    loadPost();
  }, [slug, language]);

  async function loadPost() {
    if (!slug) return;

    setLoading(true);
    setNotFound(false);

    try {
      const { data: redirect } = await supabase
        .from("mag_slug_history")
        .select("new_slug")
        .eq("entity_type", "post")
        .eq("locale", language)
        .eq("old_slug", slug)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (redirect) {
        const magazineBasePath = language === "de" ? "/magazin" : "/magazine";
        navigate(`${magazineBasePath}/${redirect.new_slug}`, { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("mag_posts")
        .select(`
          id,
          primary_topic_id,
          hero_image_url,
          author_name,
          published_at,
          translations:mag_post_translations!inner(
            title,
            slug,
            excerpt,
            content,
            seo_title,
            seo_description,
            og_image_url
          ),
          topic:mag_topics(
            id,
            translations:mag_topic_translations(name, slug)
          ),
          post_tags:mag_post_tags(
            tag:mag_tags(
              id,
              translations:mag_tag_translations(name, slug)
            )
          )
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", language)
        .eq("translations.slug", slug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        return;
      }

      const translation = data.translations?.[0];
      const topicTrans = data.topic?.translations?.find((t: any) => t.locale === language);

      const currentPost: Post = {
        id: data.id,
        slug: translation.slug,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        hero_image_url: data.hero_image_url,
        author_name: data.author_name,
        published_at: data.published_at,
        topic_id: data.primary_topic_id,
        topic_name: topicTrans?.name,
        topic_slug: topicTrans?.slug,
        tags: (data.post_tags || [])
          .map((pt: any) => {
            const tagTrans = pt.tag?.translations?.find((t: any) => t.locale === language);
            return tagTrans ? { id: pt.tag.id, name: tagTrans.name, slug: tagTrans.slug } : null;
          })
          .filter(Boolean),
        seo_title: translation.seo_title,
        seo_description: translation.seo_description,
        og_image_url: translation.og_image_url
      };

      setPost(currentPost);

      loadRelatedPosts(currentPost);

      if (translation.seo_title) {
        document.title = translation.seo_title;
      } else {
        document.title = `${translation.title} - Rentably`;
      }
    } catch (err) {
      console.error("Error loading post:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelatedPosts(currentPost: Post) {
    try {
      let query = supabase
        .from("mag_posts")
        .select(`
          id,
          hero_image_url,
          published_at,
          translations:mag_post_translations!inner(title, slug, excerpt),
          post_tags:mag_post_tags(tag_id)
        `)
        .eq("status", "PUBLISHED")
        .eq("translations.locale", language)
        .neq("id", currentPost.id)
        .not("published_at", "is", null)
        .limit(6);

      if (currentPost.topic_id) {
        query = query.eq("primary_topic_id", currentPost.topic_id);
      } else if (currentPost.tags.length > 0) {
        const tagIds = currentPost.tags.map(t => t.id);
        query = query.in("post_tags.tag_id", tagIds);
      }

      const { data } = await query.order("published_at", { ascending: false });

      if (data && data.length > 0) {
        setRelatedPosts(
          data.map((p: any) => ({
            id: p.id,
            slug: p.translations[0]?.slug || "",
            title: p.translations[0]?.title || "",
            excerpt: p.translations[0]?.excerpt,
            hero_image_url: p.hero_image_url,
            published_at: p.published_at
          }))
        );
      }
    } catch (err) {
      console.error("Error loading related posts:", err);
    }
  }

  function sanitizeAndRenderMarkdown(content: string): string {
    let html = content;

    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-dark mt-8 mb-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-dark mt-10 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-dark mt-12 mb-6">$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2">$1</li>');
    html = html.replace(/(<li class="ml-6 mb-2">.*<\/li>\n?)+/gim, '<ul class="list-disc my-4 space-y-2">$&</ul>');

    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2">$1</li>');
    html = html.replace(/(<li class="ml-6 mb-2">.*<\/li>\n?)+/gim, '<ol class="list-decimal my-4 space-y-2">$&</ol>');

    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gim,
      '<a href="$2" class="text-primary-blue hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html.replace(/\n\n/gim, '</p><p class="text-gray-600 leading-relaxed mb-4">');
    html = '<p class="text-gray-600 leading-relaxed mb-4">' + html + '</p>';

    return html;
  }

  function shareOnSocial(platform: string) {
    const url = window.location.href;
    const title = post?.title || "";

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      if (platform === "email") {
        window.location.href = shareUrl;
      } else {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }
    }

    setShowShareMenu(false);
  }

  const magazineBasePath = language === "de" ? "/magazin" : "/magazine";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-dark mb-4">
              {language === "de" ? "Artikel nicht gefunden" : "Article not found"}
            </h1>
            <p className="text-gray-400 mb-8">
              {language === "de"
                ? "Der gesuchte Artikel existiert nicht oder wurde entfernt."
                : "The requested article does not exist or has been removed."}
            </p>
            <RefLink
              to={magazineBasePath}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === "de" ? "Zurück zum Magazin" : "Back to Magazine"}
            </RefLink>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <RefLink
            to={magazineBasePath}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-dark transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "de" ? "Zurück zum Magazin" : "Back to Magazine"}
          </RefLink>

          {post.hero_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={post.hero_image_url}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <div className="mb-6">
              {post.topic_name && (
                <RefLink
                  to={`${magazineBasePath}?topic=${post.topic_slug}`}
                  className="inline-flex items-center gap-1 text-primary-blue hover:underline text-sm font-medium mb-4"
                >
                  <FolderOpen className="w-4 h-4" />
                  {post.topic_name}
                </RefLink>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">
                {post.title}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {post.author_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString(
                      language === "de" ? "de-DE" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-dark hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {language === "de" ? "Teilen" : "Share"}
                    </span>
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      <button
                        onClick={() => shareOnSocial("facebook")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </button>
                      <button
                        onClick={() => shareOnSocial("twitter")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </button>
                      <button
                        onClick={() => shareOnSocial("linkedin")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <RefLinkedin className="w-4 h-4" />
                        LinkedIn
                      </button>
                      <button
                        onClick={() => shareOnSocial("email")}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {post.excerpt && (
              <div className="text-xl text-gray-400 leading-relaxed mb-8 pb-8 border-b">
                {post.excerpt}
              </div>
            )}

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeAndRenderMarkdown(post.content) }}
            />

            {post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    {language === "de" ? "Tags" : "Tags"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <RefLink
                      key={tag.slug}
                      to={`${magazineBasePath}?tags=${tag.slug}`}
                      className="px-4 py-2 bg-gray-100 text-gray-400 rounded-full hover:bg-primary-blue/10 hover:text-primary-blue transition-colors"
                    >
                      {tag.name}
                    </RefLink>
                  ))}
                </div>
              </div>
            )}
          </article>

          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-dark mb-6">
                {language === "de" ? "Ähnliche Artikel" : "Related Articles"}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.slice(0, 3).map((relatedPost) => (
                  <RefLink
                    key={relatedPost.id}
                    to={`${magazineBasePath}/${relatedPost.slug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    {relatedPost.hero_image_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={relatedPost.hero_image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-xs text-gray-400 mb-2">
                        {new Date(relatedPost.published_at).toLocaleDateString(
                          language === "de" ? "de-DE" : "en-US"
                        )}
                      </div>
                      <h3 className="font-semibold text-dark group-hover:text-primary-blue transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </RefLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
