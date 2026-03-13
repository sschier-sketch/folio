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
      return buildRedirectHtml(
        "error",
        "Fehlender Parameter: baReentry"
      );
    }

    const admin = getSupabaseAdmin();

    let bankAccessData: Record<string, unknown> | null = null;
    let bankAccessId: string | null = null;

    try {
      const { data: tokenRow } = await admin
        .from("banksapi_token_cache")
        .select("access_token, expires_at")
        .eq("id", 1)
        .maybeSingle();

      if (tokenRow?.access_token) {
        const expiresAt = new Date(tokenRow.expires_at).getTime();
        if (Date.now() < expiresAt - 60_000) {
          const checkRes = await fetch(baReentry, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokenRow.access_token}`,
              Accept: "application/json",
            },
          });

          if (checkRes.ok) {
            bankAccessData = await checkRes.json();
            bankAccessId =
              (bankAccessData?.id as string) ||
              (bankAccessData?.bankAccessId as string) ||
              null;
          }
        }
      }
    } catch (e) {
      console.error("Error checking baReentry URL:", e);
    }

    if (bankAccessId) {
      const { data: existing } = await admin
        .from("banksapi_connections")
        .select("id")
        .eq("bank_access_id", bankAccessId)
        .maybeSingle();

      if (existing) {
        await admin
          .from("banksapi_connections")
          .update({
            status: "connected",
            error_message: null,
            raw_response: bankAccessData,
          })
          .eq("id", existing.id);
      }
    }

    return buildRedirectHtml("success", "Bankverbindung erfolgreich hergestellt");
  } catch (err) {
    console.error("banksapi-callback error:", err);
    return buildRedirectHtml(
      "error",
      "Ein Fehler ist aufgetreten"
    );
  }
});

function buildRedirectHtml(
  status: "success" | "error",
  message: string
): Response {
  const appUrl =
    Deno.env.get("APP_URL") || "https://rentab.ly";
  const redirectUrl = `${appUrl}/dashboard/finances?tab=bank&banksapi_status=${status}`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BanksAPI Callback</title>
  <meta http-equiv="refresh" content="2;url=${redirectUrl}" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
    .card { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    .msg { font-size: 1rem; margin-bottom: 0.5rem; }
    .sub { font-size: 0.875rem; color: #64748b; }
    a { color: #3c8af7; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${status === "success" ? "&#10003;" : "&#10007;"}</div>
    <p class="msg">${message}</p>
    <p class="sub">Sie werden in Kuerze weitergeleitet... <a href="${redirectUrl}">Jetzt weiterleiten</a></p>
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
