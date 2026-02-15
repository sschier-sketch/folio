import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_URL = "https://rentably.de";

interface SeoPage {
  path: string;
  updated_at: string;
}

interface MagPost {
  slug: string;
  updated_at: string;
  published_at: string | null;
}

interface CmsPage {
  slug: string;
  updated_at: string;
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

function priorityForPath(path: string): string {
  if (path === "/") return "1.0";
  if (path === "/features" || path === "/preise") return "0.9";
  if (path.startsWith("/funktionen/")) return "0.8";
  if (path.startsWith("/magazin")) return "0.7";
  return "0.7";
}

function changefreqForPath(path: string): string {
  if (path === "/") return "daily";
  if (path.startsWith("/magazin")) return "weekly";
  if (path === "/preise") return "weekly";
  return "weekly";
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
        Date.now() - new Date(globalSettings.sitemap_generated_at).getTime();
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

    const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [];

    const { data: seoPages } = await supabase
      .from("seo_page_settings")
      .select("path, updated_at")
      .eq("is_public", true)
      .eq("allow_indexing", true)
      .order("path", { ascending: true });

    if (seoPages) {
      for (const page of seoPages as SeoPage[]) {
        urls.push({
          loc: `${BASE_URL}${page.path}`,
          lastmod: toDateStr(page.updated_at),
          priority: priorityForPath(page.path),
          changefreq: changefreqForPath(page.path),
        });
      }
    }

    const seoPathsSet = new Set((seoPages || []).map((p: SeoPage) => p.path));

    const { data: magPosts } = await supabase
      .from("mag_post_translations")
      .select("slug, updated_at, post:mag_posts!inner(status, published_at)")
      .eq("locale", "de")
      .not("slug", "is", null);

    if (magPosts) {
      for (const entry of magPosts as any[]) {
        if (entry.post?.status !== "published") continue;
        const path = `/magazin/${entry.slug}`;
        if (seoPathsSet.has(path)) continue;
        urls.push({
          loc: `${BASE_URL}${path}`,
          lastmod: toDateStr(entry.updated_at || entry.post?.published_at),
          priority: "0.6",
          changefreq: "monthly",
        });
      }
    }

    if (!seoPathsSet.has("/magazin")) {
      urls.push({
        loc: `${BASE_URL}/magazin`,
        lastmod: toDateStr(new Date().toISOString()),
        priority: "0.7",
        changefreq: "weekly",
      });
    }

    const { data: cmsPages } = await supabase
      .from("cms_pages")
      .select("slug, updated_at");

    if (cmsPages) {
      for (const page of cmsPages as CmsPage[]) {
        const path = `/s/${page.slug}`;
        if (seoPathsSet.has(path)) continue;
        urls.push({
          loc: `${BASE_URL}${path}`,
          lastmod: toDateStr(page.updated_at),
          priority: "0.5",
          changefreq: "monthly",
        });
      }
    }

    const urlEntries = urls
      .map(
        (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

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
        "X-Sitemap-Urls": String(urls.length),
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
