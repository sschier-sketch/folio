import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { crypto as stdCrypto } from "jsr:@std/crypto@1.0.4";

const LETTERXPRESS_BASE_URL = "https://api.letterxpress.de/v3";
const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function corsResponse(body: unknown, status = 200) {
  if (status === 204) {
    return new Response(null, { status, headers: corsHeaders });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function authenticateUser(
  req: Request
): Promise<{ userId: string; error?: never } | { userId?: never; error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: corsResponse({ error: "Missing authorization header" }, 401) };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: corsResponse({ error: "Unauthorized" }, 401) };
  }
  return { userId: user.id };
}

async function resolveDataOwnerId(
  supabase: ReturnType<typeof getSupabase>,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("user_settings")
    .select("account_owner_id, is_active_member, removed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    data?.account_owner_id &&
    data.is_active_member &&
    !data.removed_at
  ) {
    return data.account_owner_id;
  }
  return userId;
}

async function assertIsOwner(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  dataOwnerId: string
): Promise<Response | null> {
  if (userId !== dataOwnerId) {
    return corsResponse(
      { error: "Only the account owner can modify LetterXpress configuration" },
      403
    );
  }
  return null;
}

interface LxCredentials {
  username: string;
  apiKey: string;
  isTestMode: boolean;
}

async function getCredentials(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string
): Promise<{ creds: LxCredentials; error?: never } | { creds?: never; error: Response }> {
  const { data, error } = await supabase
    .from("letterxpress_accounts")
    .select("username, api_key, is_test_mode, is_enabled")
    .eq("user_id", dataOwnerId)
    .maybeSingle();

  if (error || !data) {
    return {
      error: corsResponse(
        {
          error: "LetterXpress is not configured for this account",
          code: "LX_NOT_CONFIGURED",
        },
        404
      ),
    };
  }

  if (!data.is_enabled) {
    return {
      error: corsResponse(
        {
          error: "LetterXpress is not configured for this account",
          code: "LX_NOT_CONFIGURED",
        },
        404
      ),
    };
  }

  if (!data.username || !data.api_key) {
    return {
      error: corsResponse(
        {
          error: "LetterXpress credentials are incomplete",
          code: "LX_INCOMPLETE_CONFIG",
        },
        400
      ),
    };
  }

  return {
    creds: {
      username: data.username,
      apiKey: data.api_key,
      isTestMode: data.is_test_mode ?? true,
    },
  };
}

async function computeBase64Md5(base64String: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(base64String);
  const hashBuffer = await stdCrypto.subtle.digest("MD5", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildAuth(creds: LxCredentials) {
  return {
    username: creds.username,
    apikey: creds.apiKey,
    mode: creds.isTestMode ? "test" : "live",
  };
}

async function lxFetch(
  method: string,
  url: string,
  jsonBody: string
): Promise<{ statusCode: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const request = new Request(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: jsonBody,
      signal: controller.signal,
    });
    const response = await fetch(request);
    clearTimeout(timeout);
    const text = await response.text();
    return { statusCode: response.status, body: text };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function lxRequest(
  method: string,
  path: string,
  creds: LxCredentials,
  body?: Record<string, unknown>
): Promise<{ data: any; status: number }> {
  const url = `${LETTERXPRESS_BASE_URL}${path}`;

  const payload: Record<string, unknown> = {
    auth: buildAuth(creds),
    ...body,
  };

  const jsonBody = JSON.stringify(payload);

  try {
    const { statusCode, body: responseText } = await lxFetch(method, url, jsonBody);

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return {
        data: {
          error: `LetterXpress returned non-JSON (HTTP ${statusCode})`,
          code: "LX_INVALID_RESPONSE",
          details: responseText.substring(0, 500),
        },
        status: statusCode,
      };
    }

    if (
      statusCode === 401 ||
      responseData?.message === "Unauthorized."
    ) {
      return {
        data: {
          error: "LetterXpress Authentifizierung fehlgeschlagen. Bitte Benutzername und API Key pruefen.",
          code: "LX_AUTH_FAILED",
          details: responseData,
        },
        status: 401,
      };
    }

    return { data: responseData, status: statusCode };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        data: { error: "LetterXpress API Timeout (30s)", code: "LX_TIMEOUT" },
        status: 504,
      };
    }
    return {
      data: {
        error: `LetterXpress Verbindungsfehler: ${err.message}`,
        code: "LX_NETWORK_ERROR",
        details: `${err.name}: ${err.message}`,
      },
      status: 502,
    };
  }
}

// ============================================================
// ACTION HANDLERS
// ============================================================

async function handleTestConnection(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string,
  creds: LxCredentials
): Promise<Response> {
  const { data, status } = await lxRequest("GET", "/balance", creds);

  const testStatus = status === 200 && data?.status === 200 ? "success" : "error";

  let testMessage: string;
  let debugDetails: string | null = null;

  if (testStatus === "success") {
    testMessage = `Verbindung erfolgreich. Guthaben: ${data.data?.balance ?? "?"} ${data.data?.currency ?? "EUR"}`;
  } else {
    testMessage = data?.error || data?.message || "Verbindung fehlgeschlagen";
    debugDetails = JSON.stringify({
      http_status: status,
      lx_status: data?.status,
      lx_message: data?.message,
      lx_error: data?.error,
      lx_code: data?.code,
      lx_details: data?.details,
    });
  }

  const storedMessage = debugDetails
    ? `${testMessage} | Debug: ${debugDetails}`
    : testMessage;

  await supabase
    .from("letterxpress_accounts")
    .update({
      last_connection_test_at: new Date().toISOString(),
      last_connection_test_status: testStatus,
      last_connection_test_message: storedMessage,
      ...(testStatus === "success" && data?.data
        ? {
            last_balance: data.data.balance,
            last_balance_currency: data.data.currency || "EUR",
            last_balance_synced_at: new Date().toISOString(),
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", dataOwnerId);

  return corsResponse({
    success: testStatus === "success",
    message: testMessage,
    debug: debugDetails,
    balance:
      testStatus === "success"
        ? { amount: data.data?.balance, currency: data.data?.currency }
        : null,
  });
}

async function handleGetBalance(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string,
  creds: LxCredentials
): Promise<Response> {
  const { data, status } = await lxRequest("GET", "/balance", creds);

  if (status !== 200 || data?.status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Failed to fetch balance", code: "LX_BALANCE_ERROR" },
      status >= 400 ? status : 500
    );
  }

  await supabase
    .from("letterxpress_accounts")
    .update({
      last_balance: data.data.balance,
      last_balance_currency: data.data.currency || "EUR",
      last_balance_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", dataOwnerId);

  return corsResponse({
    balance: data.data.balance,
    currency: data.data.currency || "EUR",
  });
}

async function handleGetPriceQuote(
  creds: LxCredentials,
  body: any
): Promise<Response> {
  const spec = body?.specification;
  if (!spec || typeof spec.pages !== "number") {
    return corsResponse(
      { error: "specification.pages is required for price query" },
      400
    );
  }

  const { data, status } = await lxRequest("GET", "/price", creds, {
    letter: {
      specification: {
        pages: spec.pages,
        color: spec.color || "1",
        mode: spec.mode || "simplex",
        shipping: spec.shipping || "national",
        c4: spec.c4 ?? 0,
      },
      ...(body.registered ? { registered: body.registered } : {}),
    },
  });

  if (status !== 200 || data?.status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Price query failed", code: "LX_PRICE_ERROR" },
      status >= 400 ? status : 500
    );
  }

  return corsResponse({ price: data.data });
}

async function handleListJobs(
  creds: LxCredentials,
  filter?: string
): Promise<Response> {
  const path = filter ? `/printjobs?filter=${encodeURIComponent(filter)}` : "/printjobs";
  const { data, status } = await lxRequest("GET", path, creds);

  if (status !== 200 || data?.status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Failed to list jobs", code: "LX_LIST_ERROR" },
      status >= 400 ? status : 500
    );
  }

  return corsResponse({
    printjobs: data.data?.printjobs || [],
    pagination: data.data?.pagination || null,
  });
}

async function handleSyncJobs(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string,
  creds: LxCredentials,
  filter?: string
): Promise<Response> {
  const path = filter ? `/printjobs?filter=${encodeURIComponent(filter)}` : "/printjobs";
  const { data, status } = await lxRequest("GET", path, creds);

  if (status !== 200 || data?.status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Failed to sync jobs", code: "LX_SYNC_ERROR" },
      status >= 400 ? status : 500
    );
  }

  const printjobs = data.data?.printjobs || [];
  let synced = 0;
  let errors = 0;

  for (const job of printjobs) {
    const firstItem = job.items?.[0];
    const isCancelable =
      job.status !== "done" &&
      job.status !== "canceled" &&
      job.created_at &&
      Date.now() - new Date(job.created_at).getTime() < 15 * 60 * 1000;

    const row = {
      user_id: dataOwnerId,
      external_job_id: job.id,
      status: job.status || "unknown",
      filename_original: job.filename_original || null,
      recipient_address_text: firstItem?.address || null,
      pages: firstItem?.pages || null,
      amount: firstItem?.amount || null,
      vat: firstItem?.vat || null,
      currency: "EUR",
      shipping: job.shipping || null,
      mode: job.mode || null,
      color: job.color || null,
      c4: job.c4 ?? 0,
      registered: job.registered || null,
      notice: job.notice || null,
      dispatch_date: job.dispatch_date || null,
      created_at_provider: job.created_at || null,
      updated_at_provider: job.updated_at || null,
      item_status: firstItem?.status || null,
      raw_payload_json: job,
      last_synced_at: new Date().toISOString(),
      is_cancelable: isCancelable,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("letterxpress_jobs")
      .upsert(row, {
        onConflict: "user_id,external_job_id",
      });

    if (upsertError) {
      console.error(
        `Failed to upsert job ${job.id}:`,
        upsertError.message
      );
      errors++;
    } else {
      synced++;
    }
  }

  return corsResponse({
    synced,
    errors,
    total: printjobs.length,
    pagination: data.data?.pagination || null,
  });
}

async function handleCreateJob(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string,
  creds: LxCredentials,
  body: any
): Promise<Response> {
  if (!body?.base64_file) {
    return corsResponse({ error: "base64_file is required" }, 400);
  }

  const fileSizeBytes = (body.base64_file.length * 3) / 4;
  if (fileSizeBytes > MAX_PDF_SIZE_BYTES) {
    return corsResponse(
      { error: `PDF exceeds maximum size of ${MAX_PDF_SIZE_BYTES / 1024 / 1024} MB`, code: "LX_FILE_TOO_LARGE" },
      400
    );
  }

  const checksum = await computeBase64Md5(body.base64_file);

  const spec = body.specification || {};
  const hasRegistered = !!body.registered;
  const shipping = hasRegistered ? "national" : (spec.shipping || "national");

  const letterPayload: Record<string, unknown> = {
    base64_file: body.base64_file,
    base64_file_checksum: checksum,
    specification: {
      color: spec.color || "1",
      mode: spec.mode || "simplex",
      shipping,
      ...(spec.c4 !== undefined ? { c4: spec.c4 } : {}),
    },
  };

  if (body.filename_original) letterPayload.filename_original = body.filename_original;
  if (hasRegistered) letterPayload.registered = body.registered;
  if (body.dispatch_date) letterPayload.dispatch_date = body.dispatch_date;
  if (body.notice) letterPayload.notice = String(body.notice).substring(0, 255);

  const { data, status } = await lxRequest("POST", "/printjobs", creds, {
    letter: letterPayload,
  });

  if (status !== 200 || data?.status !== 200) {
    const errorMsg = data?.error || data?.message || "Failed to create print job";

    await supabase.from("letterxpress_jobs").insert({
      user_id: dataOwnerId,
      external_job_id: null,
      status: "error",
      filename_original: body.filename_original || null,
      last_error_code: String(status),
      last_error_message: errorMsg,
      raw_payload_json: data,
    }).then(() => {});

    return corsResponse(
      { error: errorMsg, code: "LX_CREATE_ERROR", details: data },
      status >= 400 ? status : 500
    );
  }

  const job = data.data;
  const firstItem = job?.items?.[0];

  if (job?.id) {
    await supabase.from("letterxpress_jobs").upsert(
      {
        user_id: dataOwnerId,
        external_job_id: job.id,
        status: job.status || "queue",
        filename_original: job.filename_original || body.filename_original || null,
        recipient_address_text: firstItem?.address || null,
        pages: firstItem?.pages || null,
        amount: firstItem?.amount || null,
        vat: firstItem?.vat || null,
        currency: "EUR",
        shipping: job.shipping || null,
        mode: job.mode || null,
        color: job.color || null,
        c4: job.c4 ?? 0,
        registered: job.registered || null,
        notice: job.notice || null,
        dispatch_date: job.dispatch_date || null,
        created_at_provider: job.created_at || null,
        updated_at_provider: job.updated_at || null,
        item_status: firstItem?.status || null,
        raw_payload_json: job,
        last_synced_at: new Date().toISOString(),
        is_cancelable: true,
      },
      { onConflict: "user_id,external_job_id" }
    );
  }

  return corsResponse({
    success: true,
    job: {
      id: job?.id,
      status: job?.status,
      items: job?.items,
      created_at: job?.created_at,
    },
  });
}

async function handleUpdateJob(
  creds: LxCredentials,
  body: any,
  externalJobId: number
): Promise<Response> {
  if (!externalJobId) {
    return corsResponse({ error: "job_id is required" }, 400);
  }

  const letterPayload: Record<string, unknown> = {};
  if (body.specification) letterPayload.specification = body.specification;
  if (body.registered !== undefined) letterPayload.registered = body.registered;
  if (body.dispatch_date) letterPayload.dispatch_date = body.dispatch_date;
  if (body.notice !== undefined) letterPayload.notice = String(body.notice).substring(0, 255);

  const { data, status } = await lxRequest(
    "PUT",
    `/printjobs/${externalJobId}`,
    creds,
    { letter: letterPayload }
  );

  if (status !== 200 || data?.status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Failed to update job", code: "LX_UPDATE_ERROR" },
      status >= 400 ? status : 500
    );
  }

  return corsResponse({ success: true, job: data.data });
}

async function handleCancelJob(
  supabase: ReturnType<typeof getSupabase>,
  dataOwnerId: string,
  creds: LxCredentials,
  externalJobId: number
): Promise<Response> {
  if (!externalJobId) {
    return corsResponse({ error: "job_id is required" }, 400);
  }

  const { data, status } = await lxRequest(
    "DELETE",
    `/printjobs/${externalJobId}`,
    creds
  );

  if (status !== 200) {
    return corsResponse(
      { error: data?.error || data?.message || "Failed to cancel job", code: "LX_CANCEL_ERROR" },
      status >= 400 ? status : 500
    );
  }

  await supabase
    .from("letterxpress_jobs")
    .update({
      status: "canceled",
      is_cancelable: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", dataOwnerId)
    .eq("external_job_id", externalJobId);

  return corsResponse({ success: true, message: "Job canceled" });
}

// ============================================================
// MAIN ROUTER
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse(null, 204);
  }

  try {
    const auth = await authenticateUser(req);
    if (auth.error) return auth.error;

    const supabase = getSupabase();
    const dataOwnerId = await resolveDataOwnerId(supabase, auth.userId);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1] || "";

    let body: any = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    if (action === "save-config") {
      const ownerCheck = await assertIsOwner(supabase, auth.userId, dataOwnerId);
      if (ownerCheck) return ownerCheck;

      const username = body.username || "";
      const apiKey = body.api_key || null;
      const isEnabled = body.is_enabled ?? false;

      const { data: existing } = await supabase
        .from("letterxpress_accounts")
        .select("id")
        .eq("user_id", dataOwnerId)
        .maybeSingle();

      let result;
      if (existing) {
        const updateFields: Record<string, unknown> = {
          username,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        };
        if (apiKey && apiKey !== "") {
          updateFields.api_key = apiKey;
        }
        result = await supabase
          .from("letterxpress_accounts")
          .update(updateFields)
          .eq("user_id", dataOwnerId)
          .select("id, user_id, username, is_enabled, is_test_mode, api_key")
          .single();
      } else {
        result = await supabase
          .from("letterxpress_accounts")
          .insert({
            user_id: dataOwnerId,
            username,
            api_key: apiKey,
            is_enabled: isEnabled,
          })
          .select("id, user_id, username, is_enabled, is_test_mode, api_key")
          .single();
      }

      if (result.error) {
        return corsResponse({ error: result.error.message, code: "LX_SAVE_ERROR" }, 500);
      }

      return corsResponse({
        success: true,
        config: {
          id: result.data.id,
          user_id: result.data.user_id,
          username: result.data.username,
          has_api_key: !!result.data.api_key,
          is_enabled: result.data.is_enabled,
          is_test_mode: result.data.is_test_mode,
        },
      });
    }

    if (action === "get-config") {
      const { data, error } = await supabase
        .from("letterxpress_accounts")
        .select("id, user_id, username, api_key, is_enabled, is_test_mode, last_connection_test_at, last_connection_test_status, last_connection_test_message, last_balance, last_balance_currency, last_balance_synced_at, created_at, updated_at")
        .eq("user_id", dataOwnerId)
        .maybeSingle();

      if (error) {
        return corsResponse({ error: error.message }, 500);
      }

      if (!data) {
        return corsResponse({ config: null });
      }

      return corsResponse({
        config: {
          id: data.id,
          user_id: data.user_id,
          username: data.username,
          has_api_key: !!data.api_key,
          is_enabled: data.is_enabled,
          is_test_mode: data.is_test_mode,
          last_connection_test_at: data.last_connection_test_at,
          last_connection_test_status: data.last_connection_test_status,
          last_connection_test_message: data.last_connection_test_message,
          last_balance: data.last_balance,
          last_balance_currency: data.last_balance_currency,
          last_balance_synced_at: data.last_balance_synced_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      });
    }

    if (action === "test-connection") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      return handleTestConnection(supabase, dataOwnerId, credResult.creds);
    }

    if (action === "balance") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      return handleGetBalance(supabase, dataOwnerId, credResult.creds);
    }

    if (action === "price") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      return handleGetPriceQuote(credResult.creds, body);
    }

    if (action === "list-jobs") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      const filter = url.searchParams.get("filter") || undefined;
      return handleListJobs(credResult.creds, filter);
    }

    if (action === "sync-jobs") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      const filter = url.searchParams.get("filter") || body?.filter || undefined;
      return handleSyncJobs(supabase, dataOwnerId, credResult.creds, filter);
    }

    if (action === "queue-job") {
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;

      if (!body?.base64_file) {
        return corsResponse({ error: "base64_file is required" }, 400);
      }

      const fileSizeBytes = (body.base64_file.length * 3) / 4;
      if (fileSizeBytes > MAX_PDF_SIZE_BYTES) {
        return corsResponse(
          { error: `PDF exceeds maximum size of ${MAX_PDF_SIZE_BYTES / 1024 / 1024} MB`, code: "LX_FILE_TOO_LARGE" },
          400
        );
      }

      const queueChecksum = await computeBase64Md5(body.base64_file);
      const hasRegistered = !!body.registered;
      const resolvedShipping = hasRegistered ? "national" : (body.specification?.shipping || "auto");

      const { data: inserted, error: insertError } = await supabase
        .from("letterxpress_jobs")
        .insert({
          user_id: dataOwnerId,
          external_job_id: null,
          status: "pending",
          filename_original: body.filename_original || null,
          notice: body.notice ? String(body.notice).substring(0, 255) : null,
          color: body.specification?.color || "1",
          mode: body.specification?.mode || "simplex",
          shipping: resolvedShipping,
          registered: body.registered || null,
          dispatch_date: body.dispatch_date || null,
          pending_payload: {
            base64_file: body.base64_file,
            base64_file_checksum: queueChecksum,
            filename_original: body.filename_original || null,
            specification: {
              ...(body.specification || {}),
              shipping: resolvedShipping,
            },
            registered: hasRegistered ? body.registered : null,
            dispatch_date: body.dispatch_date || null,
            notice: body.notice || null,
          },
          queued_at: new Date().toISOString(),
          tenant_id: body.tenant_id || null,
          save_to_tenant_file: body.save_to_tenant_file ?? false,
          publish_to_portal: body.publish_to_portal ?? false,
        })
        .select("id")
        .single();

      if (insertError) {
        return corsResponse({ error: insertError.message, code: "LX_QUEUE_ERROR" }, 500);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      EdgeRuntime.waitUntil(
        fetch(`${supabaseUrl}/functions/v1/process-letterxpress-queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ job_id: inserted.id }),
        }).catch((err: Error) => {
          console.error("Failed to trigger queue processor:", err.message);
        })
      );

      return corsResponse({
        success: true,
        queued: true,
        job_id: inserted.id,
        message: "Brief wurde in die Warteschlange gestellt und wird im Hintergrund versendet.",
      });
    }

    if (action === "create-job") {
      const ownerCheck = await assertIsOwner(supabase, auth.userId, dataOwnerId);
      if (ownerCheck) return ownerCheck;
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      return handleCreateJob(supabase, dataOwnerId, credResult.creds, body);
    }

    if (action === "update-job") {
      const ownerCheck = await assertIsOwner(supabase, auth.userId, dataOwnerId);
      if (ownerCheck) return ownerCheck;
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      const jobId = parseInt(body.job_id || url.searchParams.get("job_id") || "0");
      return handleUpdateJob(credResult.creds, body, jobId);
    }

    if (action === "cancel-job") {
      const ownerCheck = await assertIsOwner(supabase, auth.userId, dataOwnerId);
      if (ownerCheck) return ownerCheck;
      const credResult = await getCredentials(supabase, dataOwnerId);
      if (credResult.error) return credResult.error;
      const jobId = parseInt(body.job_id || url.searchParams.get("job_id") || "0");
      return handleCancelJob(supabase, dataOwnerId, credResult.creds, jobId);
    }

    return corsResponse(
      {
        error: "Unknown action",
        available_actions: [
          "get-config",
          "save-config",
          "test-connection",
          "balance",
          "price",
          "list-jobs",
          "sync-jobs",
          "queue-job",
          "create-job",
          "update-job",
          "cancel-job",
        ],
      },
      400
    );
  } catch (err: any) {
    console.error("LetterXpress API error:", err);
    return corsResponse(
      { error: "Internal server error", code: "LX_INTERNAL_ERROR" },
      500
    );
  }
});
