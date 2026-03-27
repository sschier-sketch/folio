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
const OVERLAP_DAYS = 14;

function maskSensitiveHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const masked = { ...headers };
  if (masked["Authorization"]) masked["Authorization"] = "***MASKED***";
  if (masked["authorization"]) masked["authorization"] = "***MASKED***";
  return masked;
}

async function logBanksapiRequest(
  admin: ReturnType<typeof getSupabaseAdmin>,
  params: {
    userId?: string;
    action: string;
    method: string;
    url: string;
    requestHeaders?: Record<string, string>;
    requestBody?: unknown;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
    durationMs?: number;
  }
): Promise<void> {
  try {
    await admin.from("banksapi_request_logs").insert({
      user_id: params.userId || null,
      action: params.action,
      method: params.method,
      url: params.url,
      request_headers: params.requestHeaders
        ? maskSensitiveHeaders(params.requestHeaders)
        : {},
      request_body: params.requestBody ?? null,
      response_status: params.responseStatus ?? null,
      response_body: params.responseBody
        ? params.responseBody.substring(0, 4000)
        : null,
      error_message: params.errorMessage ?? null,
      duration_ms: params.durationMs ?? null,
    });
  } catch (e) {
    console.error("Failed to log BanksAPI request:", e);
  }
}

function getCanonicalCallbackUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/banksapi-callback`;
}

type Admin = ReturnType<typeof getSupabaseAdmin>;

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

async function computeFingerprint(
  userId: string,
  bookingDate: string,
  amount: number,
  iban?: string,
  usageText?: string,
  reference?: string,
  counterpartyName?: string
): Promise<string> {
  const raw =
    userId +
    "|" +
    (bookingDate || "") +
    "|" +
    (amount != null ? String(amount) : "") +
    "|" +
    (iban ? iban.trim().toUpperCase() : "") +
    "|" +
    (usageText ? usageText.trim().substring(0, 140) : "") +
    "|" +
    (reference ? reference.trim() : "") +
    "|" +
    (counterpartyName ? counterpartyName.trim().toUpperCase() : "");

  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function updateSyncProgress(
  admin: Admin,
  userId: string,
  connectionId: string,
  update: Record<string, unknown>
): Promise<void> {
  try {
    const { data: existing } = await admin
      .from("banksapi_sync_progress")
      .select("id")
      .eq("connection_id", connectionId)
      .maybeSingle();

    if (existing) {
      await admin
        .from("banksapi_sync_progress")
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("connection_id", connectionId);
    } else {
      await admin.from("banksapi_sync_progress").insert({
        user_id: userId,
        connection_id: connectionId,
        ...update,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("[sync-progress] Failed to update:", e);
  }
}

function getBasicAuthCredential(settings: Record<string, unknown>): string {
  if (settings?.banksapi_basic_authorization) {
    return (settings.banksapi_basic_authorization as string).replace(/^Basic\s+/i, "");
  }
  if (settings?.banksapi_client_id && settings?.banksapi_client_secret_encrypted) {
    return btoa(
      `${settings.banksapi_client_id}:${settings.banksapi_client_secret_encrypted}`
    );
  }
  throw new Error("BanksAPI credentials not configured");
}

async function getClientToken(admin: Admin): Promise<{ token: string; tenant: string }> {
  const { data: cached } = await admin
    .from("banksapi_token_cache")
    .select("access_token, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (cached?.access_token && cached?.expires_at) {
    const expiresAt = new Date(cached.expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      const { data: creds } = await admin
        .from("banksapi_user_credentials")
        .select("tenant_name")
        .limit(1)
        .maybeSingle();
      let tenant = creds?.tenant_name || "";
      if (!tenant) {
        const { data: s } = await admin
          .from("system_settings")
          .select("banksapi_basic_authorization, banksapi_client_id")
          .eq("id", 1)
          .maybeSingle();
        const decoded = atob(getBasicAuthCredential(s || {}));
        const clientId = decoded.split(":")[0] || "";
        const slashIdx = clientId.indexOf("/");
        if (slashIdx > 0) tenant = clientId.substring(0, slashIdx);
      }
      if (tenant) return { token: cached.access_token, tenant };
    }
  }

  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_basic_authorization, banksapi_client_id, banksapi_client_secret_encrypted")
    .eq("id", 1)
    .maybeSingle();

  const basicAuth = getBasicAuthCredential(settings || {});

  const tokenStart = Date.now();
  const tokenHeaders: Record<string, string> = {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const tokenRes = await fetch(BANKSAPI_AUTH_URL, {
    method: "POST",
    headers: tokenHeaders,
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("BanksAPI client token error:", tokenRes.status, body);
    await logBanksapiRequest(admin, {
      action: "client-token-request",
      method: "POST",
      url: BANKSAPI_AUTH_URL,
      requestHeaders: tokenHeaders,
      requestBody: { grant_type: "client_credentials" },
      responseStatus: tokenRes.status,
      responseBody: body,
      errorMessage: `Client token request failed: ${tokenRes.status} - ${body.substring(0, 500)}`,
      durationMs: Date.now() - tokenStart,
    });
    throw new Error(`BanksAPI auth failed: ${tokenRes.status} - ${body.substring(0, 200)}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  let tenant = (tokenData.tenant as string) || "";
  if (!tenant) {
    const decoded = atob(basicAuth);
    const clientId = decoded.split(":")[0] || "";
    const slashIdx = clientId.indexOf("/");
    if (slashIdx > 0) tenant = clientId.substring(0, slashIdx);
  }
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin.from("banksapi_token_cache").upsert({
    id: 1,
    access_token: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return { token: accessToken, tenant };
}

async function ensureBanksapiUser(admin: Admin, userId: string): Promise<{
  username: string;
  password: string;
  tenantName: string;
}> {
  const { data: existing } = await admin
    .from("banksapi_user_credentials")
    .select("banksapi_username, banksapi_password_encrypted, tenant_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.banksapi_username && existing?.banksapi_password_encrypted) {
    return {
      username: existing.banksapi_username,
      password: existing.banksapi_password_encrypted,
      tenantName: existing.tenant_name || "",
    };
  }

  const { token: clientToken, tenant } = await getClientToken(admin);

  const username = `user_${userId.replace(/-/g, "")}`;
  const password = `Bp${crypto.randomUUID().replace(/-/g, "").substring(0, 24)}!`;

  const createUserUrl = `${BANKSAPI_BASE_URL}/auth/mgmt/v1/tenants/${tenant}/users`;
  const startTime = Date.now();

  const res = await fetch(createUserUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const durationMs = Date.now() - startTime;

  if (!res.ok && res.status !== 409) {
    const errBody = await res.text();
    console.error("BanksAPI create user error:", res.status, errBody);
    await logBanksapiRequest(admin, {
      userId,
      action: "create-banksapi-user",
      method: "POST",
      url: createUserUrl,
      requestHeaders: { "Content-Type": "application/json" },
      requestBody: { username, password: "***" },
      responseStatus: res.status,
      responseBody: errBody,
      errorMessage: `Create user failed: ${res.status} - ${errBody.substring(0, 500)}`,
      durationMs,
    });
    throw new Error(`Failed to create BanksAPI user: ${res.status}`);
  }

  await logBanksapiRequest(admin, {
    userId,
    action: "create-banksapi-user",
    method: "POST",
    url: createUserUrl,
    requestHeaders: { "Content-Type": "application/json" },
    requestBody: { username, password: "***" },
    responseStatus: res.status,
    durationMs,
  });

  await admin.from("banksapi_user_credentials").upsert({
    user_id: userId,
    banksapi_username: username,
    banksapi_password_encrypted: password,
    tenant_name: tenant,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return { username, password, tenantName: tenant };
}

async function getUserAccessToken(admin: Admin, userId: string): Promise<string> {
  const { data: cached } = await admin
    .from("banksapi_user_token_cache")
    .select("access_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (cached?.access_token && cached?.expires_at) {
    const expiresAt = new Date(cached.expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      return cached.access_token;
    }
  }

  const { username, password } = await ensureBanksapiUser(admin, userId);

  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_basic_authorization, banksapi_client_id, banksapi_client_secret_encrypted")
    .eq("id", 1)
    .maybeSingle();

  const basicAuth = getBasicAuthCredential(settings || {});

  const tokenStart = Date.now();
  const tokenHeaders: Record<string, string> = {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const tokenBody = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  const tokenRes = await fetch(BANKSAPI_AUTH_URL, {
    method: "POST",
    headers: tokenHeaders,
    body: tokenBody,
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("BanksAPI user token error:", tokenRes.status, body);
    await logBanksapiRequest(admin, {
      userId,
      action: "user-token-request",
      method: "POST",
      url: BANKSAPI_AUTH_URL,
      requestHeaders: tokenHeaders,
      requestBody: { grant_type: "password", username },
      responseStatus: tokenRes.status,
      responseBody: body,
      errorMessage: `User token request failed: ${tokenRes.status} - ${body.substring(0, 500)}`,
      durationMs: Date.now() - tokenStart,
    });
    throw new Error(`BanksAPI user auth failed: ${tokenRes.status} - ${body.substring(0, 200)}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;
  const expiresIn = (tokenData.expires_in as number) || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  if (tokenData.user) {
    await admin
      .from("banksapi_user_credentials")
      .update({ banksapi_user_id: tokenData.user as string })
      .eq("user_id", userId);
  }

  await admin.from("banksapi_user_token_cache").upsert({
    user_id: userId,
    access_token: accessToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return accessToken;
}

async function banksapiFetch(
  admin: Admin,
  path: string,
  options: RequestInit = {},
  userId?: string
): Promise<Response> {
  const token = userId
    ? await getUserAccessToken(admin, userId)
    : (await getClientToken(admin)).token;
  const url = `${BANKSAPI_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers, redirect: "manual" });

  if (res.status === 451) return res;

  if ((res.status === 302 || res.status === 307) && res.headers.get("Location")) {
    const location = res.headers.get("Location")!;
    const isBanksapiInternal = location.startsWith(BANKSAPI_BASE_URL);
    if (isBanksapiInternal) {
      return fetch(location, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    }
    return res;
  }

  return res;
}

function getCustomerId(userId: string): string {
  return userId.replace(/-/g, "");
}

// ─── Connection management ──────────────────────────────────────

async function handleCreateBankAccess(
  admin: Admin,
  userId: string,
  body: { customerIpAddress?: string; origin?: string },
  incomingReq?: Request
): Promise<Response> {
  const customerId = getCustomerId(userId);
  const baseCallback = getCanonicalCallbackUrl();
  const origin = body.origin || "https://rentab.ly";
  const callbackUrl = `${baseCallback}?origin=${encodeURIComponent(origin)}`;

  const customerIp =
    body.customerIpAddress ||
    incomingReq?.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    incomingReq?.headers.get("X-Real-Ip") ||
    incomingReq?.headers.get("CF-Connecting-IP") ||
    "";

  const bankAccessUuid = crypto.randomUUID();

  const payload: Record<string, unknown> = {
    [bankAccessUuid]: {},
  };

  const reqHeaders: Record<string, string> = {};
  if (customerIp) {
    reqHeaders["Customer-IP-Address"] = customerIp;
  }

  const { data: existing } = await admin
    .from("banksapi_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "requires_sca")
    .maybeSingle();

  const apiUrl = `${BANKSAPI_BASE_URL}/customer/v2/bankzugaenge`;
  const startTime = Date.now();

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(payload),
  }, userId);

  if (res.status === 451) {
    const location = res.headers.get("Location") || "";

    const encodedCallback = encodeURIComponent(callbackUrl);
    const separator = location.includes("?") ? "&" : "?";
    const redirectUrl = location
      ? `${location}${separator}callbackUrl=${encodedCallback}`
      : "";

    const connId = existing?.id || null;
    if (!existing) {
      const { data: newConn } = await admin
        .from("banksapi_connections")
        .insert({
          user_id: userId,
          banksapi_customer_id: customerId,
          bank_access_id: bankAccessUuid,
          bank_name: "",
          status: "requires_sca",
        })
        .select("id")
        .maybeSingle();
      if (newConn) {
        // stored for callback resolution
      }
    } else {
      await admin
        .from("banksapi_connections")
        .update({ bank_access_id: bankAccessUuid })
        .eq("id", existing.id);
    }

    return jsonResponse({
      action: "redirect",
      redirectUrl,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    const durationMs = Date.now() - startTime;
    console.error("BanksAPI createBankAccess error:", res.status, errBody);

    let parsedError = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedError = errJson.message || errJson.error || errJson.error_description || errBody;
    } catch (_) {}

    await logBanksapiRequest(admin, {
      userId,
      action: "create-bank-access",
      method: "POST",
      url: apiUrl,
      requestHeaders: reqHeaders,
      requestBody: payload,
      responseStatus: res.status,
      responseBody: errBody,
      errorMessage: `createBankAccess failed: ${res.status} - ${parsedError}`,
      durationMs,
    });

    const userMessage =
      res.status === 400
        ? `Anfrage von der Bank abgelehnt (400). ${parsedError}`
        : res.status === 401
        ? "Authentifizierung fehlgeschlagen. Bitte Admin kontaktieren."
        : res.status === 403
        ? "Zugriff verweigert. Bitte Admin kontaktieren."
        : res.status === 429
        ? "Zu viele Anfragen. Bitte warten Sie einen Moment."
        : `BanksAPI Fehler: ${res.status}`;

    return errorResponse(userMessage, 502);
  }

  const raw = await res.json();
  let data: Record<string, unknown> = raw;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const keys = Object.keys(raw).filter((k) => k !== "relations");
    if (keys.length > 0 && typeof raw[keys[0]] === "object" && raw[keys[0]] !== null) {
      data = { id: keys[0], ...(raw[keys[0]] as Record<string, unknown>) };
    }
  }
  return await persistBankAccess(admin, userId, customerId, data);
}

async function persistBankAccess(
  admin: Admin,
  userId: string,
  customerId: string,
  data: Record<string, unknown>
): Promise<Response> {
  const bankAccessId = String(data.id || "");
  let bankName =
    (data.bankName as string) ||
    ((data.bank as Record<string, unknown>)?.name as string) ||
    "";
  if (!bankName) {
    const products = (data.bankprodukte || data.bankProducts) as Array<Record<string, unknown>> | undefined;
    if (products && products.length > 0) {
      const inst = (products[0].kreditinstitut as string) || (products[0].bankName as string) || "";
      if (inst) {
        bankName = inst.split(",")[0].trim();
      }
    }
  }
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
    const { data: pendingConnNull } = await admin
      .from("banksapi_connections")
      .select("id")
      .eq("user_id", userId)
      .is("bank_access_id", null)
      .eq("status", "requires_sca")
      .maybeSingle();

    const pendingConn = pendingConnNull || (await (async () => {
      const { data: pendingAny } = await admin
        .from("banksapi_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "requires_sca")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return pendingAny;
    })());

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

  await syncBankProducts(
    admin,
    userId,
    connectionId,
    bankAccessId,
    customerId
  );

  return jsonResponse({
    connectionId,
    bankAccessId,
    status: "connected",
    bankName,
  });
}

async function syncBankProducts(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string
): Promise<void> {
  try {
    const res = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge/${bankAccessId}`,
      { method: "GET" },
      userId
    );

    if (!res.ok) {
      console.error("Failed to fetch bank access for products:", res.status);
      return;
    }

    const bankAccessData = await res.json();
    const products = bankAccessData?.bankprodukte ||
      bankAccessData?.bankProducts ||
      (Array.isArray(bankAccessData) ? bankAccessData : []);

    if (products.length > 0) {
      const { data: connCheck } = await admin
        .from("banksapi_connections")
        .select("bank_name")
        .eq("id", connectionId)
        .maybeSingle();
      if (connCheck && !connCheck.bank_name) {
        const inst = (products[0].kreditinstitut as string) || (products[0].bankName as string) || "";
        if (inst) {
          await admin
            .from("banksapi_connections")
            .update({ bank_name: inst.split(",")[0].trim() })
            .eq("id", connectionId);
        }
      }
    }

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

async function fetchAndStoreIssues(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string
): Promise<void> {
  try {
    const res = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge/${bankAccessId}/issues`,
      { method: "GET" },
      userId
    );

    if (!res.ok) {
      if (res.status === 404) return;
      console.error("Issues API error:", res.status);
      return;
    }

    const data = await res.json();
    const issues = Array.isArray(data) ? data : data?.issues || [];

    if (issues.length === 0) {
      await admin
        .from("banksapi_connections")
        .update({ last_issue_message: null, last_issue_code: null })
        .eq("id", connectionId);
      return;
    }

    const mostSevere = issues[0];
    const code =
      (mostSevere.code as string) ||
      (mostSevere.type as string) ||
      "unknown";
    const message =
      (mostSevere.message as string) ||
      (mostSevere.description as string) ||
      (mostSevere.titel as string) ||
      "Unbekanntes Problem";

    await admin
      .from("banksapi_connections")
      .update({ last_issue_message: message, last_issue_code: code })
      .eq("id", connectionId);

    const relations = mostSevere.relations || mostSevere.relationen || {};
    if (relations.start_sca || relations.startSca) {
      await admin
        .from("banksapi_connections")
        .update({ status: "requires_sca" })
        .eq("id", connectionId);
    }
  } catch (err) {
    console.error("Error fetching issues:", err);
  }
}

async function evaluateBankAccessState(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string
): Promise<void> {
  try {
    const res = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge/${bankAccessId}`,
      { method: "GET" },
      userId
    );

    if (!res.ok) return;

    const data = await res.json();
    const relations = data.relations || data.relationen || {};

    if (relations.start_sca || relations.startSca) {
      await admin
        .from("banksapi_connections")
        .update({
          status: "requires_sca",
          last_issue_message:
            "Bankfreigabe ist abgelaufen. Bitte erneuern Sie die Freigabe.",
          last_issue_code: "consent_expired",
        })
        .eq("id", connectionId);
    }

    const consentExpiresRaw =
      data.consentExpires || data.consent_expires || data.consentGueltigBis;
    if (consentExpiresRaw) {
      await admin
        .from("banksapi_connections")
        .update({ consent_expires_at: consentExpiresRaw })
        .eq("id", connectionId);
    }
  } catch (err) {
    console.error("Error evaluating bank access state:", err);
  }
}

async function handleConsentRenewal(
  admin: Admin,
  userId: string,
  connectionId: string,
  body: { customerIpAddress?: string; origin?: string },
  incomingReq?: Request
): Promise<Response> {
  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id, status")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn?.bank_access_id) {
    return errorResponse("Connection not found", 404);
  }

  const customerIp =
    body.customerIpAddress ||
    incomingReq?.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    incomingReq?.headers.get("X-Real-Ip") ||
    incomingReq?.headers.get("CF-Connecting-IP") ||
    "";

  const baseCallback = getCanonicalCallbackUrl();
  const origin = body.origin || "https://rentab.ly";
  const callbackUrl = `${baseCallback}?origin=${encodeURIComponent(origin)}`;
  const reqHeaders: Record<string, string> = {};
  if (customerIp) {
    reqHeaders["Customer-IP-Address"] = customerIp;
  }

  const apiUrl = `${BANKSAPI_BASE_URL}/customer/v2/bankzugaenge/${conn.bank_access_id}/consent`;
  const startTime = Date.now();

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${conn.bank_access_id}/consent`,
    {
      method: "POST",
      headers: reqHeaders,
    },
    userId
  );

  if (res.status === 451 || res.status === 307 || res.status === 302) {
    const location =
      res.headers.get("Location") || res.headers.get("location") || "";

    const encodedCallback = encodeURIComponent(callbackUrl);
    const separator = location.includes("?") ? "&" : "?";
    const redirectUrl = location
      ? `${location}${separator}callbackUrl=${encodedCallback}`
      : "";

    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    return jsonResponse({
      action: "redirect",
      redirectUrl,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    const durationMs = Date.now() - startTime;
    console.error("Consent renewal error:", res.status, errBody);

    let parsedError = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedError = errJson.message || errJson.error || errJson.error_description || errBody;
    } catch (_) {}

    await logBanksapiRequest(admin, {
      userId,
      action: "consent-renewal",
      method: "POST",
      url: apiUrl,
      requestHeaders: reqHeaders,
      requestBody: { callbackUrl },
      responseStatus: res.status,
      responseBody: errBody,
      errorMessage: `Consent renewal failed: ${res.status} - ${parsedError}`,
      durationMs,
    });

    const userMessage =
      res.status === 400
        ? `Bankfreigabe abgelehnt (400). ${parsedError}`
        : `Freigabe-Erneuerung fehlgeschlagen: ${res.status}`;

    return errorResponse(userMessage, 502);
  }

  await admin
    .from("banksapi_connections")
    .update({
      status: "connected",
      error_message: null,
      last_issue_message: null,
      last_issue_code: null,
      consent_expires_at: new Date(
        Date.now() + 180 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .eq("id", connectionId);

  return jsonResponse({ status: "connected", message: "Freigabe erneuert" });
}

async function handleCompleteCallback(
  admin: Admin,
  body: { userId: string; baReentry: string; connectionId?: string }
): Promise<Response> {
  const userId = body.userId;
  const customerId = getCustomerId(userId);

  if (body.baReentry && body.baReentry !== "FINISHED" && body.baReentry !== "ACCOUNT_CREATED") {
    console.warn(`complete-callback: baReentry=${body.baReentry} for user ${userId}`);
    if (body.connectionId) {
      await admin
        .from("banksapi_connections")
        .update({ status: "error", error_message: `SCA failed: ${body.baReentry}` })
        .eq("id", body.connectionId);
    }
    return errorResponse(`SCA not completed: ${body.baReentry}`, 400);
  }

  if (body.connectionId) {
    const { data: conn } = await admin
      .from("banksapi_connections")
      .select("id, user_id, status")
      .eq("id", body.connectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!conn) {
      return errorResponse("Connection not found for this user", 404);
    }

    if (conn.status === "connected") {
      return errorResponse("Connection already completed", 409);
    }
  }

  const res = await banksapiFetch(admin, `/customer/v2/bankzugaenge`, {
    method: "GET",
  }, userId);

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Failed to list bank accesses after callback:", errBody);
    return errorResponse("Failed to resolve bank access", 502);
  }

  const bankAccessesRaw = await res.json();
  const accessList: Record<string, unknown>[] = [];
  if (typeof bankAccessesRaw === "object" && bankAccessesRaw !== null && !Array.isArray(bankAccessesRaw)) {
    for (const [key, value] of Object.entries(bankAccessesRaw)) {
      if (key !== "relations" && typeof value === "object" && value !== null) {
        accessList.push({ id: key, ...(value as Record<string, unknown>) });
      }
    }
  } else if (Array.isArray(bankAccessesRaw)) {
    accessList.push(...bankAccessesRaw);
  }

  if (accessList.length === 0) {
    return errorResponse("No bank accesses found after authorization", 404);
  }

  const latest = accessList[accessList.length - 1];
  return await persistBankAccess(admin, userId, customerId, latest);
}

async function handleGetConnections(
  admin: Admin,
  userId: string
): Promise<Response> {
  const { data: connections, error } = await admin
    .from("banksapi_connections")
    .select(
      "id, bank_access_id, bank_name, provider_id, status, error_message, last_sync_at, last_attempted_sync_at, last_issue_message, last_issue_code, consent_expires_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .neq("status", "disconnected")
    .order("created_at", { ascending: false });

  if (error) return errorResponse(error.message, 500);

  const STUCK_THRESHOLD_MS = 2 * 60 * 1000;

  const enriched = [];
  for (const conn of connections || []) {
    if (conn.status === "syncing" && conn.last_attempted_sync_at) {
      const syncAge = Date.now() - new Date(conn.last_attempted_sync_at).getTime();
      if (syncAge > STUCK_THRESHOLD_MS) {
        console.info(`[connections] Auto-recovering stuck syncing connection ${conn.id} (age=${Math.round(syncAge / 1000)}s)`);
        await admin
          .from("banksapi_connections")
          .update({ status: "connected", error_message: null })
          .eq("id", conn.id);
        conn.status = "connected";
        conn.error_message = null;

        await admin
          .from("banksapi_sync_progress")
          .update({ phase: "error", error_message: "Sync timed out", finished_at: new Date().toISOString() })
          .eq("connection_id", conn.id)
          .is("finished_at", null);
      }
    }

    const { data: allProducts } = await admin
      .from("banksapi_bank_products")
      .select("id, iban, account_name, account_type, balance_cents, balance_date, selected_for_import, last_import_at")
      .eq("connection_id", conn.id)
      .order("account_name");

    const productsList = allProducts || [];
    const selectedProducts = productsList.filter(p => p.selected_for_import);

    enriched.push({
      ...conn,
      selected_accounts: selectedProducts.length,
      total_accounts: productsList.length,
      accounts: productsList.map(p => ({
        id: p.id,
        iban: p.iban,
        account_name: p.account_name,
        account_type: p.account_type,
        balance_cents: p.balance_cents,
        balance_date: p.balance_date,
        selected: p.selected_for_import,
        last_import_at: p.last_import_at,
      })),
    });
  }

  return jsonResponse({ connections: enriched });
}

async function handleGetProducts(
  admin: Admin,
  userId: string,
  connectionId: string
): Promise<Response> {
  const { data: products, error } = await admin
    .from("banksapi_bank_products")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_id", connectionId)
    .order("account_name");

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ products: products || [] });
}

async function handleSaveProductSelection(
  admin: Admin,
  userId: string,
  body: {
    connectionId: string;
    selections: Array<{
      productId: string;
      selected: boolean;
      importFromDate: string | null;
    }>;
    triggerImport?: boolean;
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

  if (body.triggerImport !== false) {
    const { data: conn } = await admin
      .from("banksapi_connections")
      .select("id, bank_access_id, banksapi_customer_id, status")
      .eq("id", body.connectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (conn?.status === "connected" && conn.bank_access_id) {
      const result = await importTransactionsForConnection(
        admin,
        userId,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id,
        "manual"
      );
      return jsonResponse({ status: "saved", import: result });
    }
  }

  return jsonResponse({ status: "saved" });
}

async function handleRefreshBankAccess(
  admin: Admin,
  userId: string,
  connectionId: string,
  body: { customerIpAddress?: string; origin?: string },
  incomingReq?: Request
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

  const customerIp =
    body.customerIpAddress ||
    incomingReq?.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    incomingReq?.headers.get("X-Real-Ip") ||
    incomingReq?.headers.get("CF-Connecting-IP") ||
    "";

  const baseCallback = getCanonicalCallbackUrl();
  const origin = body.origin || "https://rentab.ly";
  const callbackUrl = `${baseCallback}?origin=${encodeURIComponent(origin)}`;

  const reqHeaders: Record<string, string> = {};
  if (customerIp) {
    reqHeaders["Customer-IP-Address"] = customerIp;
  }

  const refreshPayload: Record<string, unknown> = {
    [conn.bank_access_id]: {},
  };

  const apiUrl = `${BANKSAPI_BASE_URL}/customer/v2/bankzugaenge?refresh=true`;
  const startTime = Date.now();

  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge?refresh=true`,
    {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(refreshPayload),
    },
    userId
  );

  const isScaRedirect = res.status === 451 ||
    ((res.status === 302 || res.status === 307) && res.headers.get("Location") && !res.headers.get("Location")!.startsWith(BANKSAPI_BASE_URL));

  if (isScaRedirect) {
    const location = res.headers.get("Location") || "";
    const encodedCallback = encodeURIComponent(callbackUrl);
    const separator = location.includes("?") ? "&" : "?";
    const redirectUrl = location
      ? `${location}${separator}callbackUrl=${encodedCallback}`
      : "";

    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    return jsonResponse({
      action: "redirect",
      redirectUrl,
      status: "requires_sca",
    });
  }

  if (!res.ok) {
    const errBody = await res.text();
    const durationMs = Date.now() - startTime;
    console.error("BanksAPI refresh error:", res.status, errBody);

    let parsedError = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedError = errJson.message || errJson.error || errJson.error_description || errBody;
    } catch (_) {}

    await logBanksapiRequest(admin, {
      userId,
      action: "refresh-bank-access",
      method: "POST",
      url: apiUrl,
      requestHeaders: reqHeaders,
      requestBody: refreshPayload,
      responseStatus: res.status,
      responseBody: errBody,
      errorMessage: `Refresh failed: ${res.status} - ${parsedError}`,
      durationMs,
    });

    await admin
      .from("banksapi_connections")
      .update({
        status: "error",
        error_message: `Refresh failed: ${res.status} - ${parsedError}`,
      })
      .eq("id", connectionId);

    const userMessage =
      res.status === 400
        ? `Aktualisierung von der Bank abgelehnt (400). ${parsedError}`
        : res.status === 401
        ? "Authentifizierung fehlgeschlagen. Bitte Admin kontaktieren."
        : res.status === 403
        ? "Zugriff verweigert. Bitte Admin kontaktieren."
        : res.status === 429
        ? "Zu viele Anfragen. Bitte warten Sie einen Moment."
        : `BanksAPI Fehler: ${res.status}`;

    return errorResponse(userMessage, 502);
  }

  const data = await res.json();
  await admin
    .from("banksapi_connections")
    .update({ status: "connected", error_message: null, raw_response: data })
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
  admin: Admin,
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
        { method: "DELETE" },
        userId
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

// ─── Transaction import ─────────────────────────────────────────

interface ProductImportResult {
  bankProductId: string;
  accountName: string;
  totalSeen: number;
  imported: number;
  duplicates: number;
  filteredByDate: number;
  anomalies: number;
  status: "success" | "failed";
  error?: string;
}

interface ConnectionImportResult {
  connectionId: string;
  bankAccessId: string;
  status: "success" | "partial" | "failed" | "requires_sca";
  products: ProductImportResult[];
  totalSeen: number;
  totalImported: number;
  totalDuplicates: number;
  totalFilteredByDate: number;
  error?: string;
}

function getOverlapStartDate(importFromDate: string): string {
  const overlapStart = new Date();
  overlapStart.setDate(overlapStart.getDate() - OVERLAP_DAYS);

  const configDate = new Date(importFromDate);
  return configDate < overlapStart
    ? overlapStart.toISOString().slice(0, 10)
    : importFromDate;
}

function getEffectiveStartDate(
  importFromDate: string,
  lastImportAt: string | null
): string {
  if (!lastImportAt) return importFromDate;
  return getOverlapStartDate(importFromDate);
}

async function fetchRemoteTransactions(
  admin: Admin,
  userId: string,
  bankAccessId: string,
  bankProductId: string,
  customerId: string
): Promise<Record<string, unknown>[]> {
  const res = await banksapiFetch(
    admin,
    `/customer/v2/bankzugaenge/${bankAccessId}/${bankProductId}/kontoumsaetze`,
    { method: "GET" },
    userId
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `BanksAPI kontoumsaetze ${res.status}: ${errBody.substring(0, 200)}`
    );
  }

  const data = await res.json();
  let list: Record<string, unknown>[];
  if (Array.isArray(data)) {
    list = data;
  } else if (data?.kontoumsaetze && Array.isArray(data.kontoumsaetze)) {
    list = data.kontoumsaetze;
  } else if (data?.transactions && Array.isArray(data.transactions)) {
    list = data.transactions;
  } else if (typeof data === "object" && data !== null) {
    list = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === "relations" || key === "paging") continue;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        list.push({ _remoteKey: key, ...(value as Record<string, unknown>) });
      }
    }
  } else {
    list = [];
  }

  if (list.length > 0) {
    console.info(`[kontoumsaetze] Fetched ${list.length} transactions. Sample keys: ${Object.keys(list[0]).join(", ")}`);
  }

  return list;
}

function parseRemoteTx(tx: Record<string, unknown>) {
  const remoteId =
    (tx.id as string) || (tx.transactionId as string) || null;
  const remoteHash = (tx.hash as string) || null;

  const bookingDateRaw =
    (tx.buchungsdatum as string) ||
    (tx.bookingDate as string) ||
    (tx.valutaDatum as string) ||
    (tx.valueDate as string) ||
    null;
  const valueDateRaw =
    (tx.valutaDatum as string) ||
    (tx.valueDate as string) ||
    null;

  const bookingDate = bookingDateRaw ? bookingDateRaw.slice(0, 10) : null;
  const valueDate = valueDateRaw ? valueDateRaw.slice(0, 10) : null;

  const effectiveDate = bookingDate || valueDate;

  const betrag = tx.betrag ?? tx.amount;
  const amount =
    typeof betrag === "number"
      ? betrag
      : typeof betrag === "string"
      ? parseFloat(betrag.replace(",", "."))
      : null;

  const currency =
    (tx.waehrung as string) || (tx.currency as string) || "EUR";

  const usageText =
    (tx.verwendungszweck as string) ||
    (tx.usage as string) ||
    (tx.purpose as string) ||
    "";

  const counterpartyName =
    (tx.gegenkontoInhaber as string) ||
    (tx.counterpartyName as string) ||
    (tx.creditorName as string) ||
    (tx.debtorName as string) ||
    "";

  const counterpartyIban =
    (tx.gegenkontoIban as string) ||
    (tx.counterpartyIban as string) ||
    (tx.creditorIban as string) ||
    (tx.debtorIban as string) ||
    null;

  const counterpartyBic =
    (tx.gegenkontoBic as string) ||
    (tx.counterpartyBic as string) ||
    null;

  const endToEndId =
    (tx.endToEndId as string) || (tx.endToEndReference as string) || null;
  const mandateId = (tx.mandateId as string) || null;
  const bankReference =
    (tx.primaNotaId as string) ||
    (tx.bankReference as string) ||
    null;

  return {
    remoteId,
    remoteHash,
    bookingDate,
    valueDate,
    effectiveDate,
    amount,
    currency,
    usageText,
    counterpartyName,
    counterpartyIban,
    counterpartyBic,
    endToEndId,
    mandateId,
    bankReference,
  };
}

async function importTransactionsForProduct(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  product: {
    id: string;
    bank_product_id: string;
    iban: string | null;
    account_name: string;
    import_from_date: string;
    last_import_at: string | null;
  },
  customerId: string,
  progressCallback?: (processed: number, imported: number, duplicates: number, total: number) => Promise<void>
): Promise<ProductImportResult> {
  const result: ProductImportResult = {
    bankProductId: product.bank_product_id,
    accountName: product.account_name,
    totalSeen: 0,
    imported: 0,
    duplicates: 0,
    filteredByDate: 0,
    anomalies: 0,
    status: "success",
  };

  try {
    const remoteTxs = await fetchRemoteTransactions(
      admin,
      userId,
      bankAccessId,
      product.bank_product_id,
      customerId
    );

    result.totalSeen = remoteTxs.length;
    const effectiveStart = getEffectiveStartDate(
      product.import_from_date,
      product.last_import_at
    );
    const seenFingerprints = new Set<string>();

    const importFileId = await createBanksapiImportFile(
      admin,
      userId,
      connectionId,
      product.id,
      product.account_name
    );

    await admin
      .from("bank_import_files")
      .update({ status: "processing" })
      .eq("id", importFileId);

    if (progressCallback) {
      await progressCallback(0, 0, 0, remoteTxs.length);
    }

    const BATCH_SIZE = 50;
    const pendingInserts: Record<string, unknown>[] = [];
    let processedCount = 0;
    const anomalySamples: Record<string, unknown>[] = [];
    const duplicateDetails: Array<{
      bookingDate: string;
      amount: number;
      counterpartyName?: string;
      usageText?: string;
      reason: "db" | "batch";
    }> = [];
    const MAX_DUPLICATE_DETAILS = 100;

    const batchMeta: Array<{
      bookingDate: string;
      amount: number;
      counterpartyName?: string;
      usageText?: string;
    }> = [];

    const flushBatch = async () => {
      if (pendingInserts.length === 0) return;
      const batch = pendingInserts.splice(0);
      const meta = batchMeta.splice(0);
      const { data: inserted, error: batchErr } = await admin
        .from("bank_transactions")
        .upsert(batch, { onConflict: "fingerprint", ignoreDuplicates: true })
        .select("id, fingerprint");

      if (batchErr) {
        console.error("Batch upsert error:", batchErr.message, batchErr.details, batchErr.hint);
        result.anomalies += batch.length;
        if (anomalySamples.length < 3) {
          anomalySamples.push({ reason: "upsert_error", error: batchErr.message, details: batchErr.details, batchSize: batch.length });
        }
      } else {
        const actualInserted = inserted?.length || 0;
        const dupes = batch.length - actualInserted;
        result.imported += actualInserted;
        result.duplicates += dupes;

        if (dupes > 0 && duplicateDetails.length < MAX_DUPLICATE_DETAILS) {
          const insertedFps = new Set(
            (inserted || []).map((r: { fingerprint: string }) => r.fingerprint)
          );
          for (let i = 0; i < batch.length && duplicateDetails.length < MAX_DUPLICATE_DETAILS; i++) {
            const fp = batch[i].fingerprint as string;
            if (!insertedFps.has(fp)) {
              duplicateDetails.push({
                bookingDate: meta[i]?.bookingDate || "",
                amount: meta[i]?.amount || 0,
                counterpartyName: meta[i]?.counterpartyName,
                usageText: meta[i]?.usageText,
                reason: "db",
              });
            }
          }
        }
      }
    };

    for (const rawTx of remoteTxs) {
      processedCount++;
      const parsed = parseRemoteTx(rawTx);

      if (!parsed.effectiveDate) {
        result.anomalies++;
        if (anomalySamples.length < 3) {
          anomalySamples.push({ reason: "no_date", keys: Object.keys(rawTx) });
        }
        if (progressCallback && processedCount % 20 === 0) {
          await progressCallback(processedCount, result.imported, result.duplicates, remoteTxs.length);
        }
        continue;
      }

      if (parsed.amount === null || isNaN(parsed.amount)) {
        result.anomalies++;
        if (anomalySamples.length < 3) {
          anomalySamples.push({ reason: "no_amount", keys: Object.keys(rawTx) });
        }
        continue;
      }

      if (parsed.effectiveDate < effectiveStart) {
        result.filteredByDate++;
        if (progressCallback && processedCount % 20 === 0) {
          await progressCallback(processedCount, result.imported, result.duplicates, remoteTxs.length);
        }
        continue;
      }

      const reference =
        parsed.bankReference || parsed.endToEndId || parsed.remoteId || "";

      const fp = await computeFingerprint(
        userId,
        parsed.effectiveDate,
        parsed.amount,
        parsed.counterpartyIban || product.iban || undefined,
        parsed.usageText || undefined,
        reference || undefined,
        parsed.counterpartyName || undefined
      );

      if (seenFingerprints.has(fp)) {
        result.duplicates++;
        if (duplicateDetails.length < MAX_DUPLICATE_DETAILS) {
          duplicateDetails.push({
            bookingDate: parsed.effectiveDate,
            amount: parsed.amount,
            counterpartyName: parsed.counterpartyName || undefined,
            usageText: parsed.usageText || undefined,
            reason: "batch",
          });
        }
        if (progressCallback && processedCount % 20 === 0) {
          await progressCallback(processedCount, result.imported, result.duplicates, remoteTxs.length);
        }
        continue;
      }

      seenFingerprints.add(fp);

      const direction: "credit" | "debit" =
        parsed.amount >= 0 ? "credit" : "debit";

      batchMeta.push({
        bookingDate: parsed.effectiveDate,
        amount: parsed.amount,
        counterpartyName: parsed.counterpartyName || undefined,
        usageText: parsed.usageText || undefined,
      });

      pendingInserts.push({
        user_id: userId,
        import_file_id: importFileId,
        transaction_date: parsed.effectiveDate,
        value_date: parsed.valueDate || null,
        amount: parsed.amount,
        currency: parsed.currency,
        direction,
        counterparty_name: parsed.counterpartyName || null,
        counterparty_iban: parsed.counterpartyIban || null,
        usage_text: parsed.usageText || null,
        end_to_end_id: parsed.endToEndId || null,
        mandate_id: parsed.mandateId || null,
        bank_reference: parsed.bankReference || null,
        fingerprint: fp,
        status: "UNMATCHED",
        description: parsed.usageText || parsed.counterpartyName || "",
        sender: parsed.counterpartyName || "",
        raw_data: {
          source: "banksapi",
          remote_id: parsed.remoteId,
          remote_hash: parsed.remoteHash,
          bank_access_id: bankAccessId,
          bank_product_id: product.bank_product_id,
          counterparty_bic: parsed.counterpartyBic,
          product_iban: product.iban,
          raw: rawTx,
        },
      });

      if (pendingInserts.length >= BATCH_SIZE) {
        await flushBatch();
        if (progressCallback) {
          await progressCallback(processedCount, result.imported, result.duplicates, remoteTxs.length);
        }
      }
    }

    await flushBatch();

    console.info(`[import-summary] product=${product.bank_product_id} effectiveStart=${effectiveStart} seen=${result.totalSeen} imported=${result.imported} duplicates=${result.duplicates} filteredByDate=${result.filteredByDate} anomalies=${result.anomalies}`);

    if (progressCallback) {
      await progressCallback(remoteTxs.length, result.imported, result.duplicates, remoteTxs.length);
    }

    const consideredRows = result.totalSeen - result.filteredByDate;

    await admin
      .from("bank_import_files")
      .update({
        status: "completed",
        total_rows: consideredRows,
        imported_rows: result.imported,
        duplicate_rows: result.duplicates,
        processed_at: new Date().toISOString(),
        raw_meta: {
          filtered_by_date: result.filteredByDate,
          total_from_provider: result.totalSeen,
          anomalies: result.anomalies,
          anomaly_samples: anomalySamples,
          effective_start: effectiveStart,
          overlap_days: OVERLAP_DAYS,
          duplicates: duplicateDetails,
        },
      })
      .eq("id", importFileId);

    await admin
      .from("banksapi_bank_products")
      .update({ last_import_at: new Date().toISOString() })
      .eq("id", product.id);
  } catch (err) {
    result.status = "failed";
    result.error = err instanceof Error ? err.message : String(err);
    console.error(
      `Import failed for product ${product.bank_product_id}:`,
      err
    );
  }

  return result;
}

async function createBanksapiImportFile(
  admin: Admin,
  userId: string,
  connectionId: string,
  productDbId: string,
  accountName: string,
  triggerType: "manual" | "cron" | "callback_initial_sync" = "manual"
): Promise<string> {
  const { data, error } = await admin
    .from("bank_import_files")
    .insert({
      user_id: userId,
      filename: `BanksAPI: ${accountName || "Konto"}`,
      source_type: "banksapi",
      status: "pending",
      banksapi_connection_id: connectionId,
      banksapi_product_id: productDbId,
      trigger_type: triggerType,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create import file: ${error.message}`);
  return data.id;
}

async function importTransactionsForConnection(
  admin: Admin,
  userId: string,
  connectionId: string,
  bankAccessId: string,
  customerId: string,
  triggerType: "manual" | "cron" | "callback_initial_sync"
): Promise<ConnectionImportResult> {
  const result: ConnectionImportResult = {
    connectionId,
    bankAccessId,
    status: "success",
    products: [],
    totalSeen: 0,
    totalImported: 0,
    totalDuplicates: 0,
    totalFilteredByDate: 0,
  };

  const { data: logRow } = await admin
    .from("banksapi_import_logs")
    .insert({
      user_id: userId,
      connection_id: connectionId,
      bank_access_id: bankAccessId,
      trigger_type: triggerType,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  const logId = logRow?.id;

  try {
    const { data: products } = await admin
      .from("banksapi_bank_products")
      .select(
        "id, bank_product_id, iban, account_name, import_from_date, last_import_at"
      )
      .eq("connection_id", connectionId)
      .eq("user_id", userId)
      .eq("selected_for_import", true)
      .not("import_from_date", "is", null);

    if (!products || products.length === 0) {
      result.status = "success";
      await admin
        .from("banksapi_connections")
        .update({ status: "connected", error_message: null, last_sync_at: new Date().toISOString() })
        .eq("id", connectionId);
      await updateSyncProgress(admin, userId, connectionId, {
        phase: "done",
        total_accounts: 0,
        finished_at: new Date().toISOString(),
      });
      if (logId) {
        await admin
          .from("banksapi_import_logs")
          .update({
            finished_at: new Date().toISOString(),
            status: "success",
          })
          .eq("id", logId);
      }
      return result;
    }

    await updateSyncProgress(admin, userId, connectionId, {
      phase: "importing",
      total_accounts: products.length,
      current_account_index: 0,
      total_transactions: 0,
      processed_transactions: 0,
      imported_transactions: 0,
      duplicate_transactions: 0,
    });

    let anySuccess = false;
    let anyFailure = false;
    let cumulativeProcessed = 0;
    let cumulativeTotal = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      await updateSyncProgress(admin, userId, connectionId, {
        current_account_name: product.account_name,
        current_account_index: i + 1,
      });

      const progressCallback = async (processed: number, imported: number, duplicates: number, total: number) => {
        if (i === 0 && processed === 0) {
          cumulativeTotal += total;
        } else if (processed === 0 && total > 0) {
          cumulativeTotal += total;
        }
        await updateSyncProgress(admin, userId, connectionId, {
          total_transactions: cumulativeTotal,
          processed_transactions: cumulativeProcessed + processed,
          imported_transactions: result.totalImported + imported,
          duplicate_transactions: result.totalDuplicates + duplicates,
        });
      };

      const productResult = await importTransactionsForProduct(
        admin,
        userId,
        connectionId,
        bankAccessId,
        product,
        customerId,
        progressCallback
      );

      cumulativeProcessed += productResult.totalSeen;

      result.products.push(productResult);
      result.totalSeen += productResult.totalSeen;
      result.totalImported += productResult.imported;
      result.totalDuplicates += productResult.duplicates;
      result.totalFilteredByDate += productResult.filteredByDate;

      if (productResult.status === "success") anySuccess = true;
      else anyFailure = true;
    }

    if (anySuccess && anyFailure) result.status = "partial";
    else if (!anySuccess && anyFailure) result.status = "failed";

    await admin
      .from("banksapi_connections")
      .update({ status: "connected", error_message: null, last_sync_at: new Date().toISOString() })
      .eq("id", connectionId);

    await updateSyncProgress(admin, userId, connectionId, {
      phase: "done",
      processed_transactions: cumulativeTotal,
      imported_transactions: result.totalImported,
      duplicate_transactions: result.totalDuplicates,
      finished_at: new Date().toISOString(),
    });

    if (logId) {
      await admin
        .from("banksapi_import_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: result.status,
          total_remote_transactions_seen: result.totalSeen,
          total_new_transactions_imported: result.totalImported,
          total_duplicates_skipped: result.totalDuplicates,
          total_filtered_by_date: result.totalFilteredByDate,
        })
        .eq("id", logId);
    }
  } catch (err) {
    result.status = "failed";
    result.error = err instanceof Error ? err.message : String(err);
    await updateSyncProgress(admin, userId, connectionId, {
      phase: "error",
      error_message: result.error,
      finished_at: new Date().toISOString(),
    });
    if (logId) {
      await admin
        .from("banksapi_import_logs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error_message: result.error,
        })
        .eq("id", logId);
    }
  }

  return result;
}

// ─── User-facing: manual refresh + import ───────────────────────
// Runs the full refresh + import synchronously and returns the result.
// Frontend receives the final import result in the response body.

async function handleRefreshAndImport(
  admin: Admin,
  userId: string,
  connectionId: string,
  body: { customerIpAddress?: string; origin?: string },
  incomingReq?: Request
): Promise<Response> {
  const startTime = Date.now();
  console.info(`[refresh-and-import] START conn=${connectionId} user=${userId}`);

  const { data: conn } = await admin
    .from("banksapi_connections")
    .select("bank_access_id, banksapi_customer_id, status, last_attempted_sync_at")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conn?.bank_access_id) {
    return errorResponse("Connection not found", 404);
  }

  if (conn.status === "syncing") {
    const attemptedAt = conn.last_attempted_sync_at ? new Date(conn.last_attempted_sync_at).getTime() : 0;
    const stuckMs = Date.now() - attemptedAt;
    if (stuckMs < 120_000) {
      return jsonResponse({ status: "syncing", message: "Synchronisierung laeuft bereits" });
    }
    console.warn(`[refresh-and-import] Connection stuck in syncing for ${Math.round(stuckMs / 1000)}s – recovering`);
  }

  const customerIp =
    body.customerIpAddress ||
    incomingReq?.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    incomingReq?.headers.get("X-Real-Ip") ||
    incomingReq?.headers.get("CF-Connecting-IP") ||
    "";

  const now = new Date().toISOString();
  await admin
    .from("banksapi_connections")
    .update({ status: "syncing", last_attempted_sync_at: now, error_message: null })
    .eq("id", connectionId);

  const baseCallback = getCanonicalCallbackUrl();
  const origin = body.origin || "https://rentab.ly";
  const callbackUrl = `${baseCallback}?origin=${encodeURIComponent(origin)}`;
  const reqHeaders: Record<string, string> = {};
  if (customerIp) {
    reqHeaders["Customer-IP-Address"] = customerIp;
  }

  const refreshPayload: Record<string, unknown> = {
    [conn.bank_access_id]: {},
  };

  let refreshRes: Response;
  try {
    console.info(`[refresh-and-import] Calling BanksAPI refresh...`);
    refreshRes = await banksapiFetch(
      admin,
      `/customer/v2/bankzugaenge?refresh=true`,
      {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(refreshPayload),
      },
      userId
    );
    console.info(`[refresh-and-import] BanksAPI refresh => ${refreshRes.status} (${Date.now() - startTime}ms)`);
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error("[refresh-and-import] BanksAPI network error:", msg);
    await admin
      .from("banksapi_connections")
      .update({ status: "error", error_message: `Netzwerkfehler: ${msg}` })
      .eq("id", connectionId);
    return errorResponse(`Bankverbindung fehlgeschlagen: ${msg}`, 502);
  }

  const isScaRedirect2 = refreshRes.status === 451 ||
    ((refreshRes.status === 302 || refreshRes.status === 307) && refreshRes.headers.get("Location") && !refreshRes.headers.get("Location")!.startsWith(BANKSAPI_BASE_URL));

  if (isScaRedirect2) {
    const location = refreshRes.headers.get("Location") || "";
    const encodedCallback = encodeURIComponent(callbackUrl);
    const separator = location.includes("?") ? "&" : "?";
    const redirectUrlWithCallback = location
      ? `${location}${separator}callbackUrl=${encodedCallback}`
      : "";
    await admin
      .from("banksapi_connections")
      .update({ status: "requires_sca" })
      .eq("id", connectionId);

    await admin.from("banksapi_import_logs").insert({
      user_id: userId,
      connection_id: connectionId,
      bank_access_id: conn.bank_access_id,
      trigger_type: "manual",
      started_at: now,
      finished_at: new Date().toISOString(),
      status: "requires_sca",
      error_message: "SCA redirect required",
    });

    return jsonResponse({
      action: "redirect",
      redirectUrl: redirectUrlWithCallback,
      status: "requires_sca",
    });
  }

  if (!refreshRes.ok) {
    const errBody = await refreshRes.text();
    console.error("[refresh-and-import] BanksAPI refresh error:", refreshRes.status, errBody);

    let parsedError = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedError = errJson.message || errJson.error || errJson.error_description || errBody;
    } catch (_) { /* keep raw */ }

    await logBanksapiRequest(admin, {
      userId,
      action: "refresh-and-import",
      method: "POST",
      url: `${BANKSAPI_BASE_URL}/customer/v2/bankzugaenge?refresh=true`,
      requestHeaders: reqHeaders,
      requestBody: refreshPayload,
      responseStatus: refreshRes.status,
      responseBody: errBody,
      errorMessage: `Refresh failed: ${refreshRes.status} - ${parsedError}`,
    });

    await admin
      .from("banksapi_connections")
      .update({ status: "error", error_message: `Refresh failed: ${refreshRes.status} - ${parsedError}` })
      .eq("id", connectionId);

    const userMessage =
      refreshRes.status === 400
        ? `Aktualisierung von der Bank abgelehnt (400). ${parsedError}`
        : `BanksAPI Fehler: ${refreshRes.status}`;
    return errorResponse(userMessage, 502);
  }

  let refreshData: unknown;
  try {
    refreshData = await refreshRes.json();
  } catch (_) {
    refreshData = null;
  }
  await admin
    .from("banksapi_connections")
    .update({ error_message: null, raw_response: refreshData })
    .eq("id", connectionId);

  console.info(`[refresh-and-import] Refresh OK (${Date.now() - startTime}ms). Starting synchronous import...`);

  const bgBankAccessId = conn.bank_access_id;
  const bgCustomerId = conn.banksapi_customer_id;

  try {
    await updateSyncProgress(admin, userId, connectionId, {
      phase: "syncing_products",
      total_transactions: 0,
      processed_transactions: 0,
      imported_transactions: 0,
      duplicate_transactions: 0,
      finished_at: null,
      error_message: null,
    });

    console.info(`[refresh-and-import] Syncing bank products...`);
    await syncBankProducts(admin, userId, connectionId, bgBankAccessId, bgCustomerId);

    console.info(`[refresh-and-import] Importing transactions... (+${Date.now() - startTime}ms)`);
    const importResult = await importTransactionsForConnection(
      admin, userId, connectionId, bgBankAccessId, bgCustomerId, "manual"
    );

    console.info(`[refresh-and-import] DONE in ${Date.now() - startTime}ms – imported=${importResult.totalImported} dupes=${importResult.totalDuplicates}`);

    EdgeRuntime.waitUntil((async () => {
      await fetchAndStoreIssues(admin, userId, connectionId, bgBankAccessId, bgCustomerId).catch(() => {});
      await evaluateBankAccessState(admin, userId, connectionId, bgBankAccessId, bgCustomerId).catch(() => {});
    })());

    return jsonResponse({
      status: "completed",
      totalSeen: importResult.totalSeen,
      totalImported: importResult.totalImported,
      totalDuplicates: importResult.totalDuplicates,
      totalFiltered: importResult.totalFilteredByDate,
      duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[refresh-and-import] FATAL after ${Date.now() - startTime}ms:`, errMsg);
    await updateSyncProgress(admin, userId, connectionId, {
      phase: "error",
      error_message: errMsg,
      finished_at: new Date().toISOString(),
    }).catch(() => {});
    await admin
      .from("banksapi_connections")
      .update({ status: "error", error_message: errMsg })
      .eq("id", connectionId);
    return errorResponse(`Import fehlgeschlagen: ${errMsg}`, 500);
  }
}

// ─── Cron: sync all connections ─────────────────────────────────

async function handleCronSync(admin: Admin): Promise<Response> {
  const { data: settings } = await admin
    .from("system_settings")
    .select("banksapi_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.banksapi_enabled) {
    return jsonResponse({
      status: "skipped",
      reason: "BanksAPI disabled",
    });
  }

  const { data: connections } = await admin
    .from("banksapi_connections")
    .select("id, user_id, bank_access_id, banksapi_customer_id, status")
    .in("status", ["connected", "syncing"])
    .not("bank_access_id", "is", null);

  if (!connections || connections.length === 0) {
    return jsonResponse({
      status: "success",
      message: "No active connections to sync",
      connections_processed: 0,
    });
  }

  const results: Array<{
    connectionId: string;
    userId: string;
    status: string;
    imported: number;
    error?: string;
  }> = [];

  for (const conn of connections) {
    try {
      const { data: selectedProducts } = await admin
        .from("banksapi_bank_products")
        .select("id")
        .eq("connection_id", conn.id)
        .eq("selected_for_import", true)
        .not("import_from_date", "is", null)
        .limit(1);

      if (!selectedProducts || selectedProducts.length === 0) {
        results.push({
          connectionId: conn.id,
          userId: conn.user_id,
          status: "skipped",
          imported: 0,
        });
        continue;
      }

      const cronNow = new Date().toISOString();
      await admin
        .from("banksapi_connections")
        .update({ status: "syncing", last_attempted_sync_at: cronNow })
        .eq("id", conn.id);

      let refreshOk = true;
      const cronRefreshPayload: Record<string, unknown> = {
        [conn.bank_access_id]: {},
      };
      const refreshRes = await banksapiFetch(
        admin,
        `/customer/v2/bankzugaenge?refresh=true`,
        {
          method: "POST",
          body: JSON.stringify(cronRefreshPayload),
        },
        conn.user_id
      );

      const cronIsScaRedirect = refreshRes.status === 451 ||
        ((refreshRes.status === 302 || refreshRes.status === 307) && refreshRes.headers.get("Location") && !refreshRes.headers.get("Location")!.startsWith(BANKSAPI_BASE_URL));

      if (cronIsScaRedirect) {
        await admin
          .from("banksapi_connections")
          .update({ status: "requires_sca" })
          .eq("id", conn.id);

        await admin.from("banksapi_import_logs").insert({
          user_id: conn.user_id,
          connection_id: conn.id,
          bank_access_id: conn.bank_access_id,
          trigger_type: "cron",
          started_at: cronNow,
          finished_at: new Date().toISOString(),
          status: "requires_sca",
          error_message: "SCA consent expired, user must re-authorize",
        });

        results.push({
          connectionId: conn.id,
          userId: conn.user_id,
          status: "requires_sca",
          imported: 0,
        });
        continue;
      }

      if (!refreshRes.ok) {
        console.error(
          `Cron refresh failed for conn ${conn.id}: ${refreshRes.status}`
        );
        refreshOk = false;
      }

      await admin
        .from("banksapi_connections")
        .update({ status: "connected", error_message: refreshOk ? null : undefined })
        .eq("id", conn.id);

      if (refreshOk) {
        await syncBankProducts(
          admin,
          conn.user_id,
          conn.id,
          conn.bank_access_id,
          conn.banksapi_customer_id
        );
      }

      await fetchAndStoreIssues(
        admin,
        conn.user_id,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id
      );

      await evaluateBankAccessState(
        admin,
        conn.user_id,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id
      );

      const importResult = await importTransactionsForConnection(
        admin,
        conn.user_id,
        conn.id,
        conn.bank_access_id,
        conn.banksapi_customer_id,
        "cron"
      );

      await admin
        .from("banksapi_connections")
        .update({ status: "connected", last_sync_at: new Date().toISOString() })
        .eq("id", conn.id);

      results.push({
        connectionId: conn.id,
        userId: conn.user_id,
        status: importResult.status,
        imported: importResult.totalImported,
        error: importResult.error,
      });
    } catch (err) {
      console.error(`Cron sync error for conn ${conn.id}:`, err);
      await admin
        .from("banksapi_connections")
        .update({
          status: "error",
          error_message:
            err instanceof Error ? err.message : "Sync failed",
        })
        .eq("id", conn.id);

      results.push({
        connectionId: conn.id,
        userId: conn.user_id,
        status: "failed",
        imported: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  return jsonResponse({
    status: "success",
    connections_processed: connections.length,
    total_imported: totalImported,
    results,
  });
}

// ─── Import logs ────────────────────────────────────────────────

async function handleGetImportLogs(
  admin: Admin,
  userId: string,
  connectionId?: string
): Promise<Response> {
  let query = admin
    .from("banksapi_import_logs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ logs: data || [] });
}

// ─── Router ─────────────────────────────────────────────────────

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

    if (action === "cron-sync") {
      const internalKey = req.headers.get("X-Internal-Key") || "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (internalKey !== serviceKey) {
        return errorResponse("Forbidden", 403);
      }
      return handleCronSync(admin);
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
        return handleCreateBankAccess(admin, user.id, body, req);
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
        return handleRefreshBankAccess(admin, user.id, connId, body, req);
      }

      case "refresh-and-import": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const body = await req.json().catch(() => ({}));
        return handleRefreshAndImport(admin, user.id, connId, body, req);
      }

      case "import": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const { data: conn } = await admin
          .from("banksapi_connections")
          .select("bank_access_id, banksapi_customer_id, status")
          .eq("id", connId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!conn?.bank_access_id)
          return errorResponse("Connection not found", 404);
        if (conn.status !== "connected")
          return errorResponse(
            `Connection status is ${conn.status}, not connected`,
            409
          );

        const importResult = await importTransactionsForConnection(
          admin,
          user.id,
          connId,
          conn.bank_access_id,
          conn.banksapi_customer_id,
          "manual"
        );
        return jsonResponse({ status: "imported", import: importResult });
      }

      case "import-logs": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1] || undefined;
        return handleGetImportLogs(admin, user.id, connId);
      }

      case "consent-renewal": {
        if (req.method !== "POST")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const body = await req.json().catch(() => ({}));
        return handleConsentRenewal(admin, user.id, connId, body, req);
      }

      case "disconnect": {
        if (req.method !== "POST" && req.method !== "DELETE")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        return handleDeleteConnection(admin, user.id, connId);
      }

      case "admin-stats": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const { data: isAdmin } = await admin
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!isAdmin) return errorResponse("Forbidden", 403);
        const { data: stats, error: statsErr } = await admin.rpc(
          "admin_get_banksapi_stats"
        );
        if (statsErr) return errorResponse(statsErr.message, 500);
        return jsonResponse(stats);
      }

      case "sync-progress": {
        if (req.method !== "GET")
          return errorResponse("Method not allowed", 405);
        const connId = pathParts[1];
        if (!connId) return errorResponse("connectionId required", 400);
        const { data: progress } = await admin
          .from("banksapi_sync_progress")
          .select("*")
          .eq("connection_id", connId)
          .eq("user_id", user.id)
          .maybeSingle();
        return jsonResponse({ progress: progress || null });
      }

      case "status": {
        return jsonResponse({ enabled: true, version: "2.2.0" });
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
