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

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function getAccessToken(
  admin: ReturnType<typeof getSupabaseAdmin>
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

  if (
    !settings?.banksapi_client_id ||
    !settings?.banksapi_client_secret_encrypted
  ) {
    throw new Error("BanksAPI credentials not configured");
  }

  const basicAuth = btoa(
    `${settings.banksapi_client_id}:${settings.banksapi_client_secret_encrypted}`
  );

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
  admin: ReturnType<typeof getSupabaseAdmin>,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken(admin);
  const url = `${BANKSAPI_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers, redirect: "manual" });
}

function getCustomerId(userId: string): string {
  return userId.replace(/-/g, "");
}

async function handleCreateBankAccess(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  body: { callbackUrl?: string; customerIpAddress?: string }
): Promise<Response> {
  const customerId = getCustomerId(userId);

  const callbackUrl =
    body.callbackUrl || "https://rentab.ly/banksapi/callback";

  const payload: Record<string, unknown> = {
    sync: true,
    callbackUrl,
  };

  const reqHeaders: Record<string, string> = {
    "X-Tenant-Id": customerId,
  };
  if (body.customerIpAddress) {
    reqHeaders["Customer-IP-Address"] = body.customerIpAddress;
  }

  const { data: existing } = await admin
    .from("banksapi_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "requires_sca")
    .maybeSingle();

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(payload),
  });

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";

    if (!existing) {
      await admin.from("banksapi_connections").insert({
        user_id: userId,
        banksapi_customer_id: customerId,
        bank_access_id: null,
        bank_name: "",
        status: "requires_sca",
      });
    }

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
  return await persistBankAccess(admin, userId, customerId, data);
}

async function persistBankAccess(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  customerId: string,
  data: Record<string, unknown>
): Promise<Response> {
  const bankAccessId = String(data.id || "");
  const bankName =
    (data.bankName as string) ||
    (data.bank as Record<string, unknown>)?.name as string ||
    "";
  const providerId = String(data.providerId || "");

  const { data: existingConn } = await admin
    .from("banksapi_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("bank_access_id", bankAccessId)
    .maybeSingle();

  let connectionId: string;

  if (existingConn) {
    connectionId = existingConn.id;
    await admin
      .from("banksapi_connections")
      .update({
        status: "connected",
        error_message: null,
        bank_name: bankName || undefined,
        provider_id: providerId || undefined,
        raw_response: data,
      })
      .eq("id", connectionId);
  } else {
    const { data: pendingConn } = await admin
      .from("banksapi_connections")
      .select("id")
      .eq("user_id", userId)
      .is("bank_access_id", null)
      .eq("status", "requires_sca")
      .maybeSingle();

    if (pendingConn) {
      connectionId = pendingConn.id;
      await admin
        .from("banksapi_connections")
        .update({
          bank_access_id: bankAccessId,
          banksapi_customer_id: customerId,
          provider_id: providerId,
          bank_name: bankName,
          status: "connected",
          error_message: null,
          raw_response: data,
        })
        .eq("id", connectionId);
    } else {
      const { data: newConn, error: insertErr } = await admin
        .from("banksapi_connections")
        .insert({
          user_id: userId,
          banksapi_customer_id: customerId,
          bank_access_id: bankAccessId,
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
      connectionId = newConn.id;
    }
  }

  await syncBankProducts(admin, userId, connectionId, bankAccessId, customerId);

  return jsonResponse({
    connectionId,
    bankAccessId,
    status: "connected",
    bankName,
  });
}

async function syncBankProducts(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string
): Promise<void> {
  try {
    const res = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge/${bankAccessId}/bankprodukte`,
      {
        method: "GET",
        headers: { "X-Tenant-Id": customerId },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch bank products:", res.status);
      return;
    }

    const productsData = await res.json();
    const products = Array.isArray(productsData)
      ? productsData
      : productsData?.bankprodukte || productsData?.bankProducts || [];

    for (const product of products) {
      const productId = String(product.id || product.bankProductId || "");
      if (!productId) continue;

      const iban = (product.iban as string) || null;
      const accountName =
        (product.bezeichnung as string) ||
        (product.description as string) ||
        (product.name as string) ||
        "";
      const accountType =
        (product.kategorie as string) ||
        (product.category as string) ||
        null;

      let balanceCents: number | null = null;
      let balanceDate: string | null = null;
      const saldo = product.saldo || product.balance;
      if (saldo) {
        const amount =
          typeof saldo.value === "number"
            ? saldo.value
            : typeof saldo === "number"
            ? saldo
            : null;
        if (amount !== null) {
          balanceCents = Math.round(amount * 100);
        }
        balanceDate = saldo.date || saldo.datum || null;
      }

      const { data: existingProduct } = await admin
        .from("banksapi_bank_products")
        .select("id, selected_for_import, import_from_date")
        .eq("connection_id", connectionId)
        .eq("bank_product_id", productId)
        .maybeSingle();

      if (existingProduct) {
        await admin
          .from("banksapi_bank_products")
          .update({
            iban,
            account_name: accountName,
            account_type: accountType,
            balance_cents: balanceCents,
            balance_date: balanceDate,
            raw_response: product,
          })
          .eq("id", existingProduct.id);
      } else {
        await admin.from("banksapi_bank_products").insert({
          connection_id: connectionId,
          user_id: userId,
          bank_product_id: productId,
          iban,
          account_name: accountName,
          account_type: accountType,
          balance_cents: balanceCents,
          balance_date: balanceDate,
          selected_for_import: false,
          import_from_date: null,
          raw_response: product,
        });
      }
    }
  } catch (err) {
    console.error("Error syncing bank products:", err);
  }
}

async function handleCompleteCallback(
  admin: ReturnType<typeof getSupabaseAdmin>,
  body: { userId: string; baReentry: string }
): Promise<Response> {
  const userId = body.userId;
  const customerId = getCustomerId(userId);

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "GET",
    headers: { "X-Tenant-Id": customerId },
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Failed to list bank accesses after callback:", errBody);
    return errorResponse("Failed to resolve bank access", 502);
  }

  const bankAccesses = await res.json();
  const accessList = Array.isArray(bankAccesses)
    ? bankAccesses
    : bankAccesses?.bankzugaenge || [];

  if (accessList.length === 0) {
    return errorResponse("No bank accesses found after authorization", 404);
  }

  const latest = accessList[accessList.length - 1];
  return await persistBankAccess(admin, userId, customerId, latest);
}

async function handleGetConnections(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<Response> {
  const { data: connections, error } = await admin
    .from("banksapi_connections")
    .select(
      "id, bank_access_id, bank_name, provider_id, status, error_message, last_sync_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .neq("status", "disconnected")
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ connections: connections || [] });
}

async function handleGetProducts(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  connectionId: string
): Promise<Response> {
  const { data: products, error } = await admin
    .from("banksapi_bank_products")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_id", connectionId)
    .order("account_name");

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ products: products || [] });
}

async function handleSaveProductSelection(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  body: {
    connectionId: string;
    selections: Array<{
      productId: string;
      selected: boolean;
      importFromDate: string | null;
    }>;
  }
): Promise<Response> {
  for (const sel of body.selections) {
    await admin
      .from("banksapi_bank_products")
      .update({
        selected_for_import: sel.selected,
        import_from_date: sel.importFromDate || null,
      })
      .eq("id", sel.productId)
      .eq("user_id", userId)
      .eq("connection_id", body.connectionId);
  }

  // NOTE: BanksAPI supports PUT /customer/v2/bankzugaenge/{id}/selectedbankproducts
  // for remote product selection sync. Not implemented in this phase;
  // selection is stored locally only. Remote sync can be added when
  // transaction import is implemented.

  return jsonResponse({ status: "saved" });
}

async function handleRefreshBankAccess(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  connectionId: string,
  body: { callbackUrl?: string; customerIpAddress?: string }
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn?.bank_access_id) {
    return errorResponse("Connection not found", 404);
  }

  const callbackUrl =
    body.callbackUrl || "https://rentab.ly/banksapi/callback";

  const reqHeaders: Record<string, string> = {
    "X-Tenant-Id": conn.banksapi_customer_id,
  };
  if (body.customerIpAddress) {
    reqHeaders["Customer-IP-Address"] = body.customerIpAddress;
  }

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
    {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify({ sync: true, callbackUrl }),
    }
  );

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";
    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    return jsonResponse({
      action: "redirect",
      redirectUrl: location,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error("BanksAPI refresh error:", res.status, errBody);
    await admin
      .from("banksapi_connections")
      .update({ status: "error", error_message: `Refresh failed: ${res.status}` })
      .eq("id", connectionId);
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
    .eq("id", connectionId);

  await syncBankProducts(
    admin,
    userId,
    connectionId,
    conn.bank_access_id,
    conn.banksapi_customer_id
  );

  return jsonResponse({ status: "connected" });
}

async function handleDeleteConnection(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  connectionId: string
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conn?.bank_access_id) {
    try {
      await banksapiFetch(
        admin,
        `/customer/v2/bankzugaenge/${conn.bank_access_id}`,
        {
          method: "DELETE",
          headers: { "X-Tenant-Id": conn.banksapi_customer_id },
        }
      );
    } catch (e) {
      console.error("Error deleting remote bank access:", e);
    }
  }

  await admin
    .from("banksapi_connections")
    .update({ status: "disconnected" })
    .eq("id", connectionId)
    .eq("user_id", userId);

  return jsonResponse({ status: "disconnected" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname
      .replace(/^\/banksapi-service\/?/, "")
      .split("/")
      .filter(Boolean);
    const action = pathParts[0] || "";

    const admin = getSupabaseAdmin();

    if (action === "complete-callback") {
      const internalKey = req.headers.get("X-Internal-Key") || "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (internalKey !== serviceKey) {
        return errorResponse("Forbidden", 403);
      }
      const body = await req.json();
      return handleCompleteCallback(admin, body);
    }

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

    const { data: settings } = await admin
      .from("system_settings")
      .select("banksapi_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (!settings?.banksapi_enabled) {
      return errorResponse("BanksAPI integration is not enabled", 403);
    }

    switch (action) {
      case "create-bank-access": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const body = await req.json();
        return handleCreateBankAccess(admin, user.id, body);
      }

      case "connections": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        return handleGetConnections(admin, user.id);
      }

      case "products": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        return handleGetProducts(admin, user.id, connId);
      }

      case "save-selection": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const body = await req.json();
        return handleSaveProductSelection(admin, user.id, body);
      }

      case "refresh": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const body = await req.json().catch(() => ({}));
        return handleRefreshBankAccess(admin, user.id, connId, body);
      }

      case "disconnect": {
        if (req.method !== "POST" && req.method !== "DELETE")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        return handleDeleteConnection(admin, user.id, connId);
      }

      case "status": {
        return jsonResponse({ enabled: true, version: "1.0.0" });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 404);
    }
  } catch (err) {
    console.error("banksapi-service error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
});
