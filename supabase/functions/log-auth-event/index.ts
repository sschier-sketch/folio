import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GeoData {
  city?: string;
  country?: string;
}

async function resolveGeo(ip: string): Promise<GeoData> {
  try {
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return {};
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`);
    if (!res.ok) return {};
    const data = await res.json();
    return { city: data.city || undefined, country: data.country || undefined };
  } catch {
    return {};
  }
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
    const { userId, eventType, userAgent } = body;

    if (!userId || !eventType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";

    const geo = await resolveGeo(ip);

    if (eventType === "signup") {
      await supabase
        .from("account_profiles")
        .update({
          registration_ip: ip || null,
          registration_city: geo.city || null,
          registration_country: geo.country || null,
        })
        .eq("user_id", userId);
    }

    await supabase.from("login_history").insert({
      user_id: userId,
      ip_address: ip || null,
      city: geo.city || null,
      country: geo.country || null,
      user_agent: userAgent || null,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
