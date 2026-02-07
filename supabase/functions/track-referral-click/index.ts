import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TrackClickPayload {
  referralCode: string;
  sessionId: string;
  landingPath?: string;
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userAgent?: string;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

    if (!payload.referralCode || !payload.sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing referralCode or sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for duplicate clicks (same session + referral code within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingClick } = await supabase
      .from("referral_click_events")
      .select("id")
      .eq("session_id", payload.sessionId)
      .eq("referral_code", payload.referralCode)
      .gte("created_at", thirtyMinutesAgo)
      .maybeSingle();

    if (existingClick) {
      return new Response(
        JSON.stringify({ message: "Click already tracked (duplicate)" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get client IP from X-Forwarded-For header (Deno Deploy provides this)
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Hash IP and user agent for privacy
    const ipHash = await hashString(clientIp);
    const userAgentHash = payload.userAgent
      ? await hashString(payload.userAgent)
      : null;

    // Insert click event
    const { error: insertError } = await supabase
      .from("referral_click_events")
      .insert({
        referral_code: payload.referralCode,
        session_id: payload.sessionId,
        landing_path: payload.landingPath || null,
        referrer_url: payload.referrerUrl || null,
        utm_source: payload.utmSource || null,
        utm_medium: payload.utmMedium || null,
        utm_campaign: payload.utmCampaign || null,
        user_agent_hash: userAgentHash,
        ip_hash: ipHash,
        country_code: null,
      });

    if (insertError) {
      console.error("Error inserting click event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to track click" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Click tracked successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
