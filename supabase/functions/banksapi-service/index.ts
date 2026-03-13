import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BANKSAPI_BASE_URL = "https://banksapi.io";
const BANKSAPI_AUTH_URL = "https://banksapi.io/auth/oauth2/token";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getSupabaseUser(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function getAccessToken(
  admin: ReturnType<typeof createClient>
): Promise<string> {
  const { data: cached } = await admin
    .from("banksapi_token_cache")
    .select("access_token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (cached?.access_token && cached?.expires_at) {
    const expiresAt = new Date(cached.expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      return cached.access_token;
    }
  }

  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_client_id, banksapi_client_secret_encrypted")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.banksapi_client_id || !settings?.banksapi_client_secret_encrypted) {
    throw new Error("BanksAPI credentials not configured");
  }

  const clientId = settings.banksapi_client_id;
  const clientSecret = settings.banksapi_client_secret_encrypted;

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const tokenRes = await fetch(BANKSAPI_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("BanksAPI token error:", tokenRes.status, body);
    throw new Error(`BanksAPI auth failed: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin.from("banksapi_token_cache").upsert({
    id: 1,
    access_token: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return accessToken;
}

async function banksapiFetch(
  admin: ReturnType<typeof createClient>,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken(admin);
  const url = `${BANKSAPI_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers });
}

async function handleCreateBankAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: { providerId?: string; callbackUrl?: string }
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const payload: Record<string, unknown> = {};
  if (body.providerId) {
    payload.providerId = body.providerId;
  }
  if (body.callbackUrl) {
    payload.callbackUrl = body.callbackUrl;
  }

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge`,
    {
      method: "POST",
      headers: {
        "X-Tenant-Id": customerId,
      } as Record<string, string>,
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";
    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI createBankAccess error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();

  const bankAccessId = data.id || data.bankAccessId;
  const bankName = data.bankName || data.bank?.name || "";
  const providerId = data.providerId || body.providerId || "";

  const { data: connection, error: insertErr } = await admin
    .from("banksapi_connections")
    .insert({
      user_id: userId,
      banksapi_customer_id: customerId,
      bank_access_id: bankAccessId ? String(bankAccessId) : null,
      provider_id: providerId,
      bank_name: bankName,
      status: "connected",
      raw_response: data,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("Error saving connection:", insertErr);
    return errorResponse("Failed to save connection", 500);
  }

  return jsonResponse({
    connectionId: connection.id,
    bankAccessId,
    status: "connected",
    bankName,
  });
}

async function handleGetBankAccessList(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "GET",
    headers: { "X-Tenant-Id": customerId } as Record<string, string>,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI getBankAccessList error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();
  return jsonResponse({ bankAccesses: data });
}

async function handleGetBankProducts(
  admin: ReturnType<typeof createClient>,
  userId: string,
  bankAccessId: string
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${bankAccessId}/bankprodukte`,
    {
      method: "GET",
      headers: { "X-Tenant-Id": customerId } as Record<string, string>,
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI getBankProducts error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const products = await res.json();
  return jsonResponse({ products });
}

async function handleGetTransactions(
  admin: ReturnType<typeof createClient>,
  userId: string,
  bankProductId: string,
  query: URLSearchParams
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  let path = `/customer/v2/bankzugaenge/bankprodukte/${bankProductId}/kontoumsaetze`;
  const params = new URLSearchParams();
  if (query.get("from")) params.set("from", query.get("from")!);
  if (query.get("to")) params.set("to", query.get("to")!);
  if (params.toString()) path += `?${params.toString()}`;

  const res = await banksapiFetch(admin, path, {
    method: "GET",
    headers: { "X-Tenant-Id": customerId } as Record<string, string>,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI getTransactions error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();
  return jsonResponse({ transactions: data });
}

async function handleRefreshBankAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
  bankAccessId: string,
  body: { callbackUrl?: string }
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const payload: Record<string, unknown> = {};
  if (body.callbackUrl) {
    payload.callbackUrl = body.callbackUrl;
  }

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${bankAccessId}`,
    {
      method: "PUT",
      headers: { "X-Tenant-Id": customerId } as Record<string, string>,
      body: JSON.stringify(payload),
    }
  );

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";
    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("user_id", userId)
      .eq("bank_access_id", bankAccessId);

    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI refreshBankAccess error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();

  await admin
    .from("banksapi_connections")
    .update({
      status: "connected",
      error_message: null,
      raw_response: data,
    })
    .eq("user_id", userId)
    .eq("bank_access_id", bankAccessId);

  return jsonResponse({ status: "connected", data });
}

async function handleGetIssues(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const res = await banksapiFetch(admin, `/customer/v2/issues`, {
    method: "GET",
    headers: { "X-Tenant-Id": customerId } as Record<string, string>,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI getIssues error:", res.status, errBody);
    return errorResponse(`BanksAPI error: ${res.status}`, 502);
  }

  const data = await res.json();
  return jsonResponse({ issues: data });
}

async function handleDeleteBankAccess(
  admin: ReturnType<typeof createClient>,
  userId: string,
  bankAccessId: string
): Promise<Response> {
  const customerId = userId.replace(/-/g, "");

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${bankAccessId}`,
    {
      method: "DELETE",
      headers: { "X-Tenant-Id": customerId } as Record<string, string>,
    }
  );

  if (!res.ok && res.status !== 404) {
    const errBody = await res.text();
    console.error("BanksAPI deleteBankAccess error:", res.status, errBody);
  }

  await admin
    .from("banksapi_connections")
    .update({ status: "disconnected" })
    .eq("user_id", userId)
    .eq("bank_access_id", bankAccessId);

  return jsonResponse({ status: "disconnected" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return errorResponse("Missing Authorization header", 401);
    }

    const supabaseUser = getSupabaseUser(authHeader);
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const admin = getSupabaseAdmin();

    const { data: settings } = await admin
      .from("system_settings")
      .select("banksapi_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (!settings?.banksapi_enabled) {
      return errorResponse("BanksAPI integration is not enabled", 403);
    }

    const url = new URL(req.url);
    const pathParts = url.pathname
      .replace(/^\/banksapi-service\/?/, "")
      .split("/")
      .filter(Boolean);

    const action = pathParts[0] || "";

    switch (action) {
      case "create-bank-access": {
        if (req.method !== "POST") return errorResponse("Method not allowed", 405);
        const body = await req.json();
        return handleCreateBankAccess(admin, user.id, body);
      }

      case "bank-accesses": {
        if (req.method !== "GET") return errorResponse("Method not allowed", 405);
        return handleGetBankAccessList(admin, user.id);
      }

      case "bank-products": {
        if (req.method !== "GET") return errorResponse("Method not allowed", 405);
        const bankAccessId = pathParts[1];
        if (!bankAccessId) return errorResponse("bankAccessId required", 400);
        return handleGetBankProducts(admin, user.id, bankAccessId);
      }

      case "transactions": {
        if (req.method !== "GET") return errorResponse("Method not allowed", 405);
        const bankProductId = pathParts[1];
        if (!bankProductId) return errorResponse("bankProductId required", 400);
        return handleGetTransactions(admin, user.id, bankProductId, url.searchParams);
      }

      case "refresh": {
        if (req.method !== "PUT" && req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const refreshBankAccessId = pathParts[1];
        if (!refreshBankAccessId) return errorResponse("bankAccessId required", 400);
        const refreshBody = req.method === "POST" || req.method === "PUT"
          ? await req.json().catch(() => ({}))
          : {};
        return handleRefreshBankAccess(admin, user.id, refreshBankAccessId, refreshBody);
      }

      case "issues": {
        if (req.method !== "GET") return errorResponse("Method not allowed", 405);
        return handleGetIssues(admin, user.id);
      }

      case "delete": {
        if (req.method !== "DELETE" && req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const deleteBankAccessId = pathParts[1];
        if (!deleteBankAccessId) return errorResponse("bankAccessId required", 400);
        return handleDeleteBankAccess(admin, user.id, deleteBankAccessId);
      }

      case "status": {
        return jsonResponse({ enabled: true, version: "1.0.0" });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 404);
    }
  } catch (err) {
    console.error("banksapi-service error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
