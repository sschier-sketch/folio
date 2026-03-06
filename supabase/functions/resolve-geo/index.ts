import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCH_SIZE = 30;

interface GeoResult {
  city?: string;
  country?: string;
}

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  );
}

async function tryFetch(url: string, timeout = 4000): Promise<GeoResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    clearTimeout(timer);
    return {};
  }
}

async function resolveGeo(ip: string): Promise<GeoResult> {
  if (isPrivateIp(ip)) return {};

  const primary = await tryFetch(
    `http://ip-api.com/json/${ip}?fields=city,country`,
  );
  if (primary.city || primary.country) return primary;

  const fallback = await tryFetch(
    `https://ipapi.co/${ip}/json/`,
  );
  return {
    city: fallback.city || undefined,
    country: fallback.country_name || (fallback as Record<string, string>).country || undefined,
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let loginResolved = 0;
    let profileResolved = 0;

    const { data: unresolvedLogins } = await supabase
      .from("login_history")
      .select("id, ip_address")
      .not("ip_address", "is", null)
      .is("geo_resolved_at", null)
      .order("logged_in_at", { ascending: false })
      .limit(BATCH_SIZE);

    if (unresolvedLogins && unresolvedLogins.length > 0) {
      const ipCache = new Map<string, GeoResult>();

      for (const entry of unresolvedLogins) {
        const ip = entry.ip_address;
        let geo: GeoResult;
        if (ipCache.has(ip)) {
          geo = ipCache.get(ip)!;
        } else {
          geo = await resolveGeo(ip);
          ipCache.set(ip, geo);
        }

        await supabase
          .from("login_history")
          .update({
            city: geo.city || null,
            country: geo.country || null,
            geo_resolved_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        loginResolved++;
      }
    }

    const { data: unresolvedProfiles } = await supabase
      .from("account_profiles")
      .select("user_id, registration_ip")
      .not("registration_ip", "is", null)
      .is("geo_resolved_at", null)
      .limit(BATCH_SIZE);

    if (unresolvedProfiles && unresolvedProfiles.length > 0) {
      const ipCache = new Map<string, GeoResult>();

      for (const profile of unresolvedProfiles) {
        const ip = profile.registration_ip;
        let geo: GeoResult;
        if (ipCache.has(ip)) {
          geo = ipCache.get(ip)!;
        } else {
          geo = await resolveGeo(ip);
          ipCache.set(ip, geo);
        }

        await supabase
          .from("account_profiles")
          .update({
            registration_city: geo.city || null,
            registration_country: geo.country || null,
            geo_resolved_at: new Date().toISOString(),
          })
          .eq("user_id", profile.user_id);

        profileResolved++;
      }
    }

    return jsonResponse({
      success: true,
      loginResolved,
      profileResolved,
    });
  } catch (err) {
    console.error("resolve-geo error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
