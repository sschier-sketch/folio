import { supabase } from "./supabase";

export interface SeoMetadata {
  title: string;
  description: string;
  robots: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string;
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
  '/subscription',
  '/subscription-success',
  '/subscription-cancelled',
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

export function clearSeoCache() {
  globalSettingsCache = null;
  pageSettingsCache.clear();
}
