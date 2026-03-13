import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const baReentry = url.searchParams.get("baReentry");

    if (!baReentry) {
      return buildRedirectHtml("error", "Fehlender Parameter: baReentry");
    }

    const admin = getSupabaseAdmin();

    const { data: pendingConn } = await admin
      .from("banksapi_connections")
      .select("id, user_id, banksapi_customer_id")
      .eq("status", "requires_sca")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pendingConn) {
      console.error("No pending banksapi connection found for callback");
      return buildRedirectHtml("error", "Keine ausstehende Bankverbindung gefunden");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    try {
      const completeRes = await fetch(
        `${supabaseUrl}/functions/v1/banksapi-service/complete-callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Key": serviceKey,
          },
          body: JSON.stringify({
            userId: pendingConn.user_id,
            baReentry,
          }),
        }
      );

      if (!completeRes.ok) {
        const errText = await completeRes.text();
        console.error("complete-callback failed:", completeRes.status, errText);
        return buildRedirectHtml("error", "Fehler beim Abschliessen der Bankverbindung");
      }
    } catch (e) {
      console.error("Error calling complete-callback:", e);
      return buildRedirectHtml("error", "Technischer Fehler bei der Verarbeitung");
    }

    return buildRedirectHtml("success", "Bankverbindung erfolgreich hergestellt");
  } catch (err) {
    console.error("banksapi-callback error:", err);
    return buildRedirectHtml("error", "Ein Fehler ist aufgetreten");
  }
});

function buildRedirectHtml(
  status: "success" | "error",
  message: string
): Response {
  const redirectUrl = `/dashboard?view=financial&tab=bank&banksapi_status=${status}`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BanksAPI - Bankverbindung</title>
  <meta http-equiv="refresh" content="2;url=${redirectUrl}" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
    .card { text-align: center; padding: 2.5rem 2rem; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04); max-width: 420px; width: 90%; }
    .icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 1.5rem; }
    .icon-ok { background: #ecfdf5; color: #059669; }
    .icon-err { background: #fef2f2; color: #dc2626; }
    .msg { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; }
    .sub { font-size: 0.875rem; color: #64748b; margin: 0; }
    a { color: #3c8af7; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${status === "success" ? "icon-ok" : "icon-err"}">${status === "success" ? "&#10003;" : "&#10007;"}</div>
    <p class="msg">${message}</p>
    <p class="sub">Sie werden in Kuerze weitergeleitet...<br/><a href="${redirectUrl}">Jetzt weiterleiten</a></p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
