import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEDUP_SECONDS = 15;

interface GeoData {
  city?: string;
  country?: string;
}

async function resolveGeo(ip: string): Promise<GeoData> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return {};
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=city,country`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.city || undefined,
      country: data.country || undefined,
    };
  } catch {
    return {};
  }
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

    const body = await req.json();
    const { userId, eventType, userAgent, clientIp } = body;

    if (!userId || !eventType) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const serverIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "";
    const ip = clientIp || serverIp;

    const { data: recentEntry } = await supabase
      .from("login_history")
      .select("id")
      .eq("user_id", userId)
      .gte(
        "logged_in_at",
        new Date(Date.now() - DEDUP_SECONDS * 1000).toISOString(),
      )
      .limit(1)
      .maybeSingle();

    if (recentEntry) {
      return jsonResponse({ success: true, deduplicated: true });
    }

    const geo = ip ? await resolveGeo(ip) : ({} as GeoData);

    if (ip) {
      if (eventType === "signup") {
        await supabase
          .from("account_profiles")
          .update({
            registration_ip: ip,
            registration_city: geo.city || null,
            registration_country: geo.country || null,
          })
          .eq("user_id", userId);
      } else {
        const { data: profile } = await supabase
          .from("account_profiles")
          .select("registration_ip")
          .eq("user_id", userId)
          .maybeSingle();
        if (profile && !profile.registration_ip) {
          await supabase
            .from("account_profiles")
            .update({
              registration_ip: ip,
              registration_city: geo.city || null,
              registration_country: geo.country || null,
            })
            .eq("user_id", userId);
        }
      }
    }

    await supabase.from("login_history").insert({
      user_id: userId,
      ip_address: ip || null,
      city: geo.city || null,
      country: geo.country || null,
      user_agent: userAgent || null,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("log-auth-event error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
