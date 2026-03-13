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

function redirect(origin: string, status: "success" | "error"): Response {
  const safeOrigin = origin.startsWith("http") ? origin : "https://rentab.ly";
  const url = `${safeOrigin}/dashboard?view=financial&tab=bank&banksapi_status=${status}`;
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
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
    const callerOrigin =
      url.searchParams.get("origin") || "https://rentab.ly";

    if (!baReentry) {
      console.warn("banksapi-callback called without baReentry parameter");
      return redirect(callerOrigin, "error");
    }

    const admin = getSupabaseAdmin();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: pendingConns } = await admin
      .from("banksapi_connections")
      .select("id, user_id, banksapi_customer_id, status")
      .eq("status", "requires_sca")
      .gte("updated_at", thirtyMinAgo)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!pendingConns || pendingConns.length === 0) {
      const { data: recentlyConnected } = await admin
        .from("banksapi_connections")
        .select("id, status")
        .eq("status", "connected")
        .gte("updated_at", thirtyMinAgo)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentlyConnected) {
        console.info(
          `banksapi-callback: No pending connection, but recently connected ${recentlyConnected.id} found - likely duplicate callback`
        );
        return redirect(callerOrigin, "success");
      }

      console.error(
        "banksapi-callback: No pending or recently connected connection found within time window"
      );
      return redirect(callerOrigin, "error");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let processed = false;
    let lastError = "";

    for (const pendingConn of pendingConns) {
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
              connectionId: pendingConn.id,
            }),
          }
        );

        if (completeRes.ok) {
          console.info(
            `banksapi-callback: Successfully processed for connection ${pendingConn.id}, user ${pendingConn.user_id}`
          );
          processed = true;
          break;
        }

        const errText = await completeRes.text();

        if (completeRes.status === 409) {
          console.info(
            `banksapi-callback: Connection ${pendingConn.id} already completed (409)`
          );
          processed = true;
          break;
        }

        console.warn(
          `banksapi-callback: complete-callback failed for connection ${pendingConn.id}: ${completeRes.status} ${errText}`
        );
        lastError = errText;
      } catch (e) {
        console.error(
          `banksapi-callback: Error processing connection ${pendingConn.id}:`,
          e
        );
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (processed) {
      return redirect(callerOrigin, "success");
    }

    console.error(
      `banksapi-callback: Failed to process any of ${pendingConns.length} pending connections. Last error: ${lastError}`
    );
    return redirect(callerOrigin, "error");
  } catch (err) {
    console.error("banksapi-callback error:", err);
    return redirect("https://rentab.ly", "error");
  }
});
