import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

interface TrackClickPayload {
  referralCode: string;
  refSid?: string;
  landingPath?: string;
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fullQueryString?: string;
  userAgent?: string;
}

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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TrackClickPayload = await req.json();

    if (!payload.referralCode) {
      return new Response(
        JSON.stringify({ error: "Missing referralCode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const ipHash = await hashString(clientIp);
    const userAgentHash = payload.userAgent ? await hashString(payload.userAgent) : null;

    const cookieHeader = req.headers.get("cookie");
    let refSid = payload.refSid || getCookieValue(cookieHeader, "ref_sid");
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

    if (!session) {
      refSid = crypto.randomUUID();
      const { data: newSession, error: sessionError } = await supabase
        .from("referral_sessions")
        .insert({
          ref_sid: refSid,
          ref_code: payload.referralCode,
          landing_path: payload.landingPath || null,
          referrer_url: payload.referrerUrl || null,
          utm_source: payload.utmSource || null,
          utm_medium: payload.utmMedium || null,
          utm_campaign: payload.utmCampaign || null,
          utm_term: payload.utmTerm || null,
          utm_content: payload.utmContent || null,
          full_query_string: payload.fullQueryString || null,
          ip_hash: ipHash,
          ua_hash: userAgentHash,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating session:", sessionError);
      } else {
        session = newSession;
      }
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingClick } = await supabase
      .from("referral_click_events")
      .select("id")
      .eq("ref_sid", refSid)
      .eq("referral_code", payload.referralCode)
      .gte("created_at", thirtyMinutesAgo)
      .maybeSingle();

    if (!existingClick) {
      await supabase.from("referral_click_events").insert({
        referral_code: payload.referralCode,
        ref_sid: refSid,
        session_id: refSid,
        landing_path: payload.landingPath || null,
        referrer_url: payload.referrerUrl || null,
        utm_source: payload.utmSource || null,
        utm_medium: payload.utmMedium || null,
        utm_campaign: payload.utmCampaign || null,
        utm_term: payload.utmTerm || null,
        utm_content: payload.utmContent || null,
        user_agent_hash: userAgentHash,
        ip_hash: ipHash,
        country_code: null,
      });
    }

    const isProd = supabaseUrl.includes("supabase.co");
    const maxAge = 30 * 24 * 60 * 60;
    const cookieValue = `ref_sid=${refSid}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isProd ? "; Secure" : ""}`;

    return new Response(
      JSON.stringify({
        success: true,
        refSid,
        message: existingClick ? "Session updated" : "Click tracked",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": cookieValue,
        },
      }
    );
  } catch (error) {
    console.error("Error in track-referral-click function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
