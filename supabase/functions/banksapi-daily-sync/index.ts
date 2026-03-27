import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalHeaders = {
      "Content-Type": "application/json",
      "X-Internal-Key": serviceKey,
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "recover") {
      const recoverRes = await fetch(
        `${supabaseUrl}/functions/v1/banksapi-service/recover-connections`,
        { method: "POST", headers: internalHeaders, body: "{}" }
      );
      const recoverBody = await recoverRes.text();
      return new Response(recoverBody, {
        status: recoverRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const syncRes = await fetch(
      `${supabaseUrl}/functions/v1/banksapi-service/cron-sync`,
      {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({ trigger: "cron" }),
      }
    );

    const syncBody = await syncRes.text();

    const recoverRes = await fetch(
      `${supabaseUrl}/functions/v1/banksapi-service/recover-connections`,
      { method: "POST", headers: internalHeaders, body: "{}" }
    ).catch(() => null);

    let recoverBody = null;
    if (recoverRes?.ok) {
      recoverBody = await recoverRes.json().catch(() => null);
    }

    const combined = {
      sync: JSON.parse(syncBody),
      recover: recoverBody,
    };

    return new Response(JSON.stringify(combined), {
      status: syncRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("banksapi-daily-sync error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
