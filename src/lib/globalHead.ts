import { supabase } from "./supabase";
import { SITE_URL } from "../config/site";

const DEFAULT_TITLE = "rentably – Immobilienverwaltung fuer Vermieter";
const DEFAULT_DESCRIPTION =
  "Immobilienverwaltung kostenlos fuer Vermieter. Nebenkostenabrechnung, Mietverwaltung & mehr.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/rentably-app.jpg`;

const DEFAULT_HEAD_HTML = `<link rel="canonical" href="{{PAGE_URL}}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rentably" />
<meta property="og:title" content="{{TITLE}}" />
<meta property="og:description" content="{{DESCRIPTION}}" />
<meta property="og:url" content="{{PAGE_URL}}" />
<meta property="og:image" content="{{OG_IMAGE}}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{TITLE}}" />
<meta name="twitter:description" content="{{DESCRIPTION}}" />
<meta name="twitter:image" content="{{OG_IMAGE}}" />`;

let cachedHeadHtml: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getGlobalHeadHtml(
  forceRefresh = false
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedHeadHtml !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedHeadHtml;
  }

  try {
    const { data, error } = await supabase.rpc("get_system_settings");

    if (error || !data || data.length === 0) {
      cachedHeadHtml = DEFAULT_HEAD_HTML;
      cacheTimestamp = now;
      return DEFAULT_HEAD_HTML;
    }

    const html = data[0].global_head_html;
    cachedHeadHtml = html || DEFAULT_HEAD_HTML;
    cacheTimestamp = now;
    return cachedHeadHtml;
  } catch {
    cachedHeadHtml = DEFAULT_HEAD_HTML;
    cacheTimestamp = now;
    return DEFAULT_HEAD_HTML;
  }
}

export function invalidateGlobalHeadCache(): void {
  cachedHeadHtml = null;
  cacheTimestamp = 0;
}

export interface HeadVariables {
  siteUrl: string;
  pageUrl: string;
  title: string;
  description: string;
  ogImage: string;
}

export function resolveHeadVariables(
  pathname: string,
  title?: string,
  description?: string
): HeadVariables {
  const siteUrl = SITE_URL;
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const pageUrl = `${siteUrl}${cleanPath === "/" ? "" : cleanPath}`;

  return {
    siteUrl,
    pageUrl: cleanPath === "/" ? `${siteUrl}/` : pageUrl,
    title: title || DEFAULT_TITLE,
    description: description || DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
  };
}

export function replaceHeadPlaceholders(
  template: string,
  vars: HeadVariables
): string {
  return template
    .replace(/\{\{SITE_URL\}\}/g, vars.siteUrl)
    .replace(/\{\{PAGE_URL\}\}/g, vars.pageUrl)
    .replace(/\{\{TITLE\}\}/g, escapeHtmlAttr(vars.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtmlAttr(vars.description))
    .replace(/\{\{OG_IMAGE\}\}/g, vars.ogImage);
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getDefaultHeadHtml(): string {
  return DEFAULT_HEAD_HTML;
}

export async function updateGlobalHeadHtml(
  html: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("system_settings")
      .update({
        global_head_html: html,
        global_head_html_updated_at: new Date().toISOString(),
        global_head_html_updated_by: userId,
      })
      .eq("id", 1);

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateGlobalHeadCache();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}
