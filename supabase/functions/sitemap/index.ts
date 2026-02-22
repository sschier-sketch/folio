import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_URL = "https://rentably.de";

const STATIC_PUBLIC_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/features", changefreq: "weekly", priority: "0.9" },
  { path: "/funktionen", changefreq: "weekly", priority: "0.9" },
  { path: "/preise", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/ueber-uns", changefreq: "monthly", priority: "0.7" },
  { path: "/kontakt", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/impressum", changefreq: "monthly", priority: "0.4" },
  { path: "/datenschutz", changefreq: "monthly", priority: "0.4" },
  { path: "/agb", changefreq: "monthly", priority: "0.4" },
  { path: "/avv", changefreq: "monthly", priority: "0.3" },
  { path: "/funktionen/mietverwaltung", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/immobilienmanagement", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/kommunikation", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/buchhaltung", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/dokumente", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/nebenkostenabrechnung", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/mieterportal", changefreq: "monthly", priority: "0.8" },
  { path: "/funktionen/uebergabeprotokoll", changefreq: "monthly", priority: "0.8" },
  { path: "/magazin", changefreq: "weekly", priority: "0.7" },
];

const EXCLUDED_PATH_PREFIXES = [
  "/app",
  "/admin",
  "/dashboard",
  "/login",
  "/signup",
  "/reset-password",
  "/einstellungen",
  "/subscription",
  "/mieterportal-aktivierung",
  "/tenant-portal",
  "/account-banned",
  "/api",
];

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toDateStr(ts: string): string {
  try {
    return new Date(ts).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urlElements = entries
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

async function buildSitemapEntries(
  supabase: ReturnType<typeof createClient>
): Promise<SitemapEntry[]> {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];
  const today = toDateStr(new Date().toISOString());

  function addEntry(entry: SitemapEntry) {
    if (seen.has(entry.loc)) return;
    seen.add(entry.loc);
    entries.push(entry);
  }

  for (const sp of STATIC_PUBLIC_PATHS) {
    addEntry({
      loc: `${BASE_URL}${sp.path}`,
      lastmod: today,
      changefreq: sp.changefreq,
      priority: sp.priority,
    });
  }

  try {
    const { data: seoPages } = await supabase
      .from("seo_page_settings")
      .select("path, updated_at")
      .eq("is_public", true)
      .eq("allow_indexing", true)
      .order("path", { ascending: true });

    if (seoPages) {
      for (const page of seoPages) {
        if (isExcludedPath(page.path)) continue;
        addEntry({
          loc: `${BASE_URL}${page.path}`,
          lastmod: toDateStr(page.updated_at),
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    }
  } catch (err) {
    console.error("Error loading SEO pages:", err);
  }

  try {
    const { data: magPosts } = await supabase
      .from("mag_post_translations")
      .select(
        "slug, updated_at, post:mag_posts!inner(status, published_at)"
      )
      .eq("locale", "de")
      .not("slug", "is", null);

    if (magPosts) {
      for (const entry of magPosts as any[]) {
        if (entry.post?.status !== "published") continue;
        addEntry({
          loc: `${BASE_URL}/magazin/${entry.slug}`,
          lastmod: toDateStr(entry.updated_at || entry.post?.published_at),
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    }
  } catch (err) {
    console.error("Error loading magazine posts:", err);
  }

  try {
    const { data: cmsPages } = await supabase
      .from("cms_pages")
      .select("slug, updated_at");

    if (cmsPages) {
      for (const page of cmsPages) {
        addEntry({
          loc: `${BASE_URL}/s/${page.slug}`,
          lastmod: toDateStr(page.updated_at),
          changefreq: "monthly",
          priority: "0.5",
        });
      }
    }
  } catch (err) {
    console.error("Error loading CMS pages:", err);
  }

  return entries;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: globalSettings } = await supabase
      .from("seo_global_settings")
      .select("sitemap_enabled, sitemap_xml_cache, sitemap_generated_at")
      .single();

    if (globalSettings && globalSettings.sitemap_enabled === false) {
      return new Response("Sitemap generation is disabled.", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const isRegenerate =
      req.method === "POST" ||
      new URL(req.url).searchParams.get("refresh") === "true";

    if (
      !isRegenerate &&
      globalSettings?.sitemap_xml_cache &&
      globalSettings?.sitemap_generated_at
    ) {
      const age =
        Date.now() -
        new Date(globalSettings.sitemap_generated_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000;
      if (age < maxAge) {
        return new Response(globalSettings.sitemap_xml_cache, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
            "X-Sitemap-Source": "cache",
          },
        });
      }
    }

    const entries = await buildSitemapEntries(supabase);
    const sitemap = buildSitemapXml(entries);

    await supabase
      .from("seo_global_settings")
      .update({
        sitemap_xml_cache: sitemap,
        sitemap_generated_at: new Date().toISOString(),
      })
      .not("id", "is", null);

    return new Response(sitemap, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Sitemap-Source": "generated",
        "X-Sitemap-Urls": String(entries.length),
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate sitemap",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
