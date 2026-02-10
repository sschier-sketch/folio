import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
  return match ? match[2] : null;
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2 || pathParts[0] !== 'r') {
      return new Response("Invalid shortlink format. Use /r/CODE", {
        status: 400,
      });
    }

    const code = pathParts[1].toUpperCase();

    if (!/^[A-Z0-9]{6,16}$/i.test(code)) {
      return new Response("Invalid referral code format", {
        status: 400,
      });
    }

    const { data: validCode } = await supabase
      .from("user_settings")
      .select("referral_code")
      .eq("referral_code", code)
      .maybeSingle();

    const { data: validAffiliateCode } = await supabase
      .from("affiliates")
      .select("affiliate_code")
      .eq("affiliate_code", code)
      .maybeSingle();

    if (!validCode && !validAffiliateCode) {
      return new Response("Referral code not found", {
        status: 404,
      });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const ipHash = await hashString(clientIp);
    const userAgent = req.headers.get("user-agent") || "";
    const userAgentHash = userAgent ? await hashString(userAgent) : null;

    const cookieHeader = req.headers.get("cookie");
    let refSid = getCookieValue(cookieHeader, "ref_sid");
    let session = null;

    if (refSid) {
      const { data: existingSession } = await supabase
        .from("referral_sessions")
        .select("*")
        .eq("ref_sid", refSid)
        .maybeSingle();

      if (existingSession) {
        session = existingSession;
        await supabase
          .from("referral_sessions")
          .update({
            last_seen_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("ref_sid", refSid);
      }
    }

    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");
    const utmTerm = url.searchParams.get("utm_term");
    const utmContent = url.searchParams.get("utm_content");

    if (!session) {
      refSid = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from("referral_sessions")
        .insert({
          ref_sid: refSid,
          ref_code: code,
          landing_path: url.pathname,
          referrer_url: req.headers.get("referer") || null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm,
          utm_content: utmContent,
          full_query_string: url.search,
          ip_hash: ipHash,
          ua_hash: userAgentHash,
        });

      if (sessionError) {
        console.error("Error creating session:", sessionError);
      }
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingClick } = await supabase
      .from("referral_click_events")
      .select("id")
      .eq("ref_sid", refSid)
      .eq("referral_code", code)
      .gte("created_at", thirtyMinutesAgo)
      .maybeSingle();

    if (!existingClick) {
      await supabase.from("referral_click_events").insert({
        referral_code: code,
        ref_sid: refSid,
        session_id: refSid,
        landing_path: url.pathname,
        referrer_url: req.headers.get("referer") || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        user_agent_hash: userAgentHash,
        ip_hash: ipHash,
        country_code: null,
      });
    }

    const redirectUrl = new URL("/", supabaseUrl.replace(/\/.*$/, ''));
    redirectUrl.searchParams.set("ref", code);

    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'ref') {
        redirectUrl.searchParams.set(key, value);
      }
    }

    const isProd = supabaseUrl.includes("supabase.co");
    const maxAge = 30 * 24 * 60 * 60;
    const cookieValue = `ref_sid=${refSid}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isProd ? "; Secure" : ""}`;

    return new Response(null, {
      status: 307,
      headers: {
        "Location": redirectUrl.toString(),
        "Set-Cookie": cookieValue,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in referral-shortlink function:", error);
    return new Response("Internal server error", {
      status: 500,
    });
  }
});
