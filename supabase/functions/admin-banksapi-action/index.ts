import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

const BANKSAPI_BASE_URL = "https://banksapi.io";
const BANKSAPI_AUTH_URL = "https://banksapi.io/auth/oauth2/token";
const OVERLAP_DAYS = 14;

async function getBanksapiToken(
  admin: ReturnType<typeof getAdmin>
): Promise<string | null> {
  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_basic_authorization, banksapi_client_id, banksapi_client_secret_encrypted")
    .eq("id", 1)
    .maybeSingle();

  if (!settings) return null;

  const basicAuth = settings.banksapi_basic_authorization;
  if (!basicAuth) return null;

  const authHeader = basicAuth.startsWith("Basic ")
    ? basicAuth
    : `Basic ${basicAuth}`;

  const res = await fetch(BANKSAPI_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;
  const body = await res.json();
  return body.access_token || null;
}

async function banksapiFetch(
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${BANKSAPI_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return err("Unauthorized", 401);

    const userClient = getUserClient(authHeader);
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const admin = getAdmin();
    const { data: isAdmin } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!isAdmin) return err("Forbidden", 403);

    const body = await req.json();
    const { action, connectionId, targetUserId } = body as {
      action: string;
      connectionId: string;
      targetUserId?: string;
    };

    if (!connectionId) return err("connectionId required");

    const { data: conn } = await admin
      .from("banksapi_connections")
      .select("id, user_id, bank_access_id, banksapi_customer_id, status, bank_name")
      .eq("id", connectionId)
      .maybeSingle();

    if (!conn) return err("Connection not found", 404);

    if (action === "delete") {
      if (conn.bank_access_id) {
        try {
          const token = await getBanksapiToken(admin);
          if (token) {
            await banksapiFetch(
              token,
              `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
              { method: "DELETE" }
            );
          }
        } catch (e) {
          console.error("Error deleting remote bank access:", e);
        }
      }

      await admin
        .from("banksapi_connections")
        .update({ status: "disconnected", updated_at: new Date().toISOString() })
        .eq("id", connectionId);

      await admin.from("admin_activity_log").insert({
        admin_user_id: user.id,
        action: "banksapi_delete_connection",
        target_user_id: conn.user_id,
        details: {
          connection_id: connectionId,
          bank_name: conn.bank_name,
        },
      });

      return json({ status: "disconnected" });
    }

    if (action === "sync") {
      if (conn.status !== "connected") {
        return err(`Verbindung hat Status "${conn.status}", Sync nur bei "connected" moeglich`, 409);
      }
      if (!conn.bank_access_id || !conn.banksapi_customer_id) {
        return err("Verbindung hat keine bank_access_id", 409);
      }

      const serviceUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/banksapi-service/import/${connectionId}`;
      const serviceRes = await fetch(serviceUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      const result = await serviceRes.json();

      await admin.from("admin_activity_log").insert({
        admin_user_id: user.id,
        action: "banksapi_admin_sync",
        target_user_id: conn.user_id,
        details: {
          connection_id: connectionId,
          bank_name: conn.bank_name,
          result,
        },
      });

      if (!serviceRes.ok) {
        return json({ status: "error", error: result.error || "Sync fehlgeschlagen" }, serviceRes.status);
      }

      return json({ status: "synced", result });
    }

    return err("Unknown action. Use 'delete' or 'sync'.");
  } catch (e) {
    console.error("admin-banksapi-action error:", e);
    return err("Internal server error", 500);
  }
});
