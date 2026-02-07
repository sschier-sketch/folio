import { supabase } from "./supabase";

export interface SeoMetadata {
  title: string;
  description: string;
  robots: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string;
  hreflang?: Array<{ locale: string; url: string }>;
  jsonLd?: any;
}

interface SeoGlobalSettings {
  title_template: string;
  default_title: string;
  default_description: string;
  default_robots_index: boolean;
}

interface SeoPageSettings {
  path: string;
  page_type: string;
  is_public: boolean;
  allow_indexing: boolean;
  title?: string;
  description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
}

const APP_PATHS = [
  '/dashboard',
  '/app',
  '/admin',
  '/mieterportal',
  '/login',
  '/signup',
  '/reset-password',
  '/einstellungen',
  '/account-banned'
];

const BASE_URL = window.location.origin;

let globalSettingsCache: SeoGlobalSettings | null = null;
let pageSettingsCache: Map<string, SeoPageSettings> = new Map();

export async function loadGlobalSettings(): Promise<SeoGlobalSettings> {
  if (globalSettingsCache) {
    return globalSettingsCache;
  }

  const { data, error } = await supabase
    .from('seo_global_settings')
    .select('*')
    .single();

  if (error || !data) {
    globalSettingsCache = {
      title_template: '%s – Rentably',
      default_title: 'Rentably – Immobilienverwaltung leicht gemacht',
      default_description: 'Die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen an einem Ort.',
      default_robots_index: true
    };
  } else {
    globalSettingsCache = data;
  }

  return globalSettingsCache;
}

export async function loadPageSettings(path: string): Promise<SeoPageSettings | null> {
  if (pageSettingsCache.has(path)) {
    return pageSettingsCache.get(path)!;
  }

  const { data, error } = await supabase
    .from('seo_page_settings')
    .select('*')
    .eq('path', path)
    .maybeSingle();

  if (data) {
    pageSettingsCache.set(path, data);
    return data;
  }

  return null;
}

export function isAppPath(path: string): boolean {
  return APP_PATHS.some(appPath => path.startsWith(appPath));
}

export async function resolveSeoMetadata(currentPath: string): Promise<SeoMetadata> {
  const cleanPath = currentPath.split('?')[0].split('#')[0];

  const magazinMatch = cleanPath.match(/^\/(magazin|magazine)\/([^/]+)$/);
  if (magazinMatch) {
    const [, pathLocale, slug] = magazinMatch;
    const locale = pathLocale === "magazin" ? "de" : "en";
    return await resolveMagazineSeoMetadata(slug, locale);
  }

  const magazinIndexMatch = cleanPath.match(/^\/(magazin|magazine)\/?$/);
  if (magazinIndexMatch) {
    const [, pathLocale] = magazinIndexMatch;
    const locale = pathLocale === "magazin" ? "de" : "en";
    return {
      title: locale === "de" ? "Magazin – Rentably" : "Magazine – Rentably",
      description: locale === "de"
        ? "Tipps, Tricks und Wissenswertes rund um die Immobilienverwaltung"
        : "Tips, tricks and knowledge about property management",
      robots: "index, follow",
      canonical: `${BASE_URL}/${pathLocale}`,
      ogTitle: locale === "de" ? "Magazin – Rentably" : "Magazine – Rentably",
      ogDescription: locale === "de"
        ? "Tipps, Tricks und Wissenswertes rund um die Immobilienverwaltung"
        : "Tips, tricks and knowledge about property management",
      hreflang: [
        { locale: "de", url: `${BASE_URL}/magazin` },
        { locale: "en", url: `${BASE_URL}/magazine` }
      ]
    };
  }

  const isApp = isAppPath(cleanPath);

  if (isApp) {
    return {
      title: 'Rentably',
      description: '',
      robots: 'noindex, nofollow',
      canonical: '',
      ogTitle: 'Rentably',
      ogDescription: ''
    };
  }

  const globalSettings = await loadGlobalSettings();
  const pageSettings = await loadPageSettings(cleanPath);

  let title = globalSettings.default_title;
  let description = globalSettings.default_description;
  let allowIndexing = globalSettings.default_robots_index;
  let canonicalUrl = `${BASE_URL}${cleanPath}`;
  let ogTitle = '';
  let ogDescription = '';
  let ogImageUrl: string | undefined;

  if (pageSettings) {
    if (pageSettings.page_type === 'app' || !pageSettings.is_public) {
      return {
        title: 'Rentably',
        description: '',
        robots: 'noindex, nofollow',
        canonical: '',
        ogTitle: 'Rentably',
        ogDescription: ''
      };
    }

    allowIndexing = pageSettings.allow_indexing;

    if (pageSettings.title) {
      title = globalSettings.title_template.replace('%s', pageSettings.title);
    }

    if (pageSettings.description) {
      description = pageSettings.description;
    }

    if (pageSettings.canonical_url) {
      canonicalUrl = pageSettings.canonical_url;
    }

    ogTitle = pageSettings.og_title || title;
    ogDescription = pageSettings.og_description || description;
    ogImageUrl = pageSettings.og_image_url;
  } else {
    ogTitle = title;
    ogDescription = description;
  }

  const robots = allowIndexing ? 'index, follow' : 'noindex, nofollow';

  return {
    title,
    description,
    robots,
    canonical: canonicalUrl,
    ogTitle,
    ogDescription,
    ogImageUrl
  };
}

async function resolveMagazineSeoMetadata(slug: string, locale: "de" | "en"): Promise<SeoMetadata> {
  try {
    const { data, error } = await supabase
      .from("mag_posts")
      .select(`
        id,
        author_name,
        published_at,
        updated_at,
        hero_image_url,
        current_trans:mag_post_translations!inner(
          title,
          slug,
          excerpt,
          seo_title,
          seo_description,
          og_image_url
        ),
        other_trans:mag_post_translations(
          locale,
          slug
        )
      `)
      .eq("status", "PUBLISHED")
      .eq("current_trans.locale", locale)
      .eq("current_trans.slug", slug)
      .maybeSingle();

    if (error || !data) {
      return {
        title: "Artikel nicht gefunden – Rentably",
        description: "",
        robots: "noindex, nofollow",
        canonical: "",
        ogTitle: "Artikel nicht gefunden",
        ogDescription: ""
      };
    }

    const trans = data.current_trans[0];
    const title = trans.seo_title || `${trans.title} – Rentably`;
    const description = trans.seo_description || trans.excerpt || "";
    const ogImage = trans.og_image_url || data.hero_image_url;

    const hreflang: Array<{ locale: string; url: string }> = [];
    const otherLocale = locale === "de" ? "en" : "de";
    const otherPathPrefix = otherLocale === "de" ? "magazin" : "magazine";
    const currentPathPrefix = locale === "de" ? "magazin" : "magazine";

    hreflang.push({ locale, url: `${BASE_URL}/${currentPathPrefix}/${slug}` });

    const otherTrans = data.other_trans?.find((t: any) => t.locale === otherLocale);
    if (otherTrans) {
      hreflang.push({ locale: otherLocale, url: `${BASE_URL}/${otherPathPrefix}/${otherTrans.slug}` });
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": trans.title,
      "description": trans.excerpt || "",
      "image": ogImage,
      "author": {
        "@type": "Person",
        "name": data.author_name
      },
      "publisher": {
        "@type": "Organization",
        "name": "Rentably",
        "logo": {
          "@type": "ImageObject",
          "url": `${BASE_URL}/logo_1.svg`
        }
      },
      "datePublished": data.published_at,
      "dateModified": data.updated_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${BASE_URL}/${currentPathPrefix}/${slug}`
      }
    };

    return {
      title,
      description,
      robots: "index, follow",
      canonical: `${BASE_URL}/${currentPathPrefix}/${slug}`,
      ogTitle: trans.seo_title || trans.title,
      ogDescription: trans.seo_description || trans.excerpt || "",
      ogImageUrl: ogImage,
      hreflang,
      jsonLd
    };
  } catch (err) {
    console.error("Error resolving magazine SEO:", err);
    return {
      title: "Rentably",
      description: "",
      robots: "noindex, nofollow",
      canonical: "",
      ogTitle: "Rentably",
      ogDescription: ""
    };
  }
}

export function clearSeoCache() {
  globalSettingsCache = null;
  pageSettingsCache.clear();
}
