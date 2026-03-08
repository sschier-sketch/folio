import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const LETTERXPRESS_BASE_URL = "https://api.letterxpress.de/v3";
const MAX_RETRIES = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function lxFetch(
  method: string,
  path: string,
  jsonBody: string
): Promise<{ statusCode: number; body: string }> {
  const url = `${LETTERXPRESS_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: jsonBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await response.text();
    return { statusCode: response.status, body: text };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

interface PendingJob {
  id: string;
  user_id: string;
  pending_payload: {
    base64_file: string;
    base64_file_checksum: string;
    filename_original: string | null;
    specification: Record<string, unknown>;
    registered: string | null;
    dispatch_date: string | null;
    notice: string | null;
  };
  retry_count: number;
  tenant_id: string | null;
  save_to_tenant_file: boolean;
  publish_to_portal: boolean;
}

async function processJob(
  supabase: ReturnType<typeof getSupabase>,
  job: PendingJob
): Promise<void> {
  await supabase
    .from("letterxpress_jobs")
    .update({
      status: "processing",
      processing_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  const { data: account } = await supabase
    .from("letterxpress_accounts")
    .select("username, api_key, is_test_mode, is_enabled")
    .eq("user_id", job.user_id)
    .maybeSingle();

  if (!account || !account.is_enabled || !account.username || !account.api_key) {
    await supabase
      .from("letterxpress_jobs")
      .update({
        status: "error",
        last_error_code: "LX_NOT_CONFIGURED",
        last_error_message: "LetterXpress ist nicht konfiguriert oder deaktiviert.",
        pending_payload: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return;
  }

  const payload = job.pending_payload;
  const spec = payload.specification || {};

  const letterPayload: Record<string, unknown> = {
    base64_file: payload.base64_file,
    base64_file_checksum: payload.base64_file_checksum,
    specification: {
      color: spec.color || "1",
      mode: spec.mode || "simplex",
      shipping: spec.shipping || "national",
      ...(spec.c4 !== undefined ? { c4: spec.c4 } : {}),
    },
  };

  if (payload.filename_original) letterPayload.filename_original = payload.filename_original;
  if (payload.registered) letterPayload.registered = payload.registered;
  if (payload.dispatch_date) letterPayload.dispatch_date = payload.dispatch_date;
  if (payload.notice) letterPayload.notice = String(payload.notice).substring(0, 255);

  const requestBody = JSON.stringify({
    auth: {
      username: account.username,
      apikey: account.api_key,
      mode: account.is_test_mode ? "test" : "live",
    },
    letter: letterPayload,
  });

  try {
    const { statusCode, body: responseText } = await lxFetch(
      "POST",
      "/printjobs",
      requestBody
    );

    let responseData: Record<string, unknown>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error(`LetterXpress returned non-JSON (HTTP ${statusCode}): ${responseText.substring(0, 200)}`);
    }

    if (
      statusCode === 401 ||
      (responseData as { message?: string })?.message === "Unauthorized."
    ) {
      await supabase
        .from("letterxpress_jobs")
        .update({
          status: "error",
          last_error_code: "LX_AUTH_FAILED",
          last_error_message: "LetterXpress Authentifizierung fehlgeschlagen.",
          pending_payload: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      return;
    }

    if (statusCode !== 200 || (responseData as { status?: number })?.status !== 200) {
      const errorMsg =
        (responseData as { error?: string })?.error ||
        (responseData as { message?: string })?.message ||
        "Failed to create print job";

      if (job.retry_count < MAX_RETRIES) {
        await supabase
          .from("letterxpress_jobs")
          .update({
            status: "pending",
            retry_count: job.retry_count + 1,
            last_error_code: String(statusCode),
            last_error_message: errorMsg,
            processing_started_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      } else {
        await supabase
          .from("letterxpress_jobs")
          .update({
            status: "error",
            last_error_code: String(statusCode),
            last_error_message: `${errorMsg} (nach ${MAX_RETRIES} Versuchen)`,
            pending_payload: null,
            raw_payload_json: responseData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
      return;
    }

    const lxJob = (responseData as { data?: Record<string, unknown> })?.data as Record<string, unknown> | undefined;
    const firstItem = (lxJob?.items as Array<Record<string, unknown>>)?.[0];

    await supabase
      .from("letterxpress_jobs")
      .update({
        external_job_id: (lxJob?.id as number) || 0,
        status: (lxJob?.status as string) || "queue",
        filename_original: (lxJob?.filename_original as string) || payload.filename_original || null,
        recipient_address_text: (firstItem?.address as string) || null,
        pages: (firstItem?.pages as number) || null,
        amount: (firstItem?.amount as number) || null,
        vat: (firstItem?.vat as number) || null,
        currency: "EUR",
        shipping: (lxJob?.shipping as string) || null,
        mode: (lxJob?.mode as string) || null,
        color: (lxJob?.color as string) || null,
        c4: (lxJob?.c4 as number) ?? 0,
        registered: (lxJob?.registered as string) || null,
        notice: (lxJob?.notice as string) || null,
        dispatch_date: (lxJob?.dispatch_date as string) || null,
        created_at_provider: (lxJob?.created_at as string) || null,
        updated_at_provider: (lxJob?.updated_at as string) || null,
        item_status: (firstItem?.status as string) || null,
        raw_payload_json: lxJob,
        last_synced_at: new Date().toISOString(),
        is_cancelable: true,
        pending_payload: null,
        processing_started_at: null,
        last_error_code: null,
        last_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`Job ${job.id} successfully submitted to LetterXpress (external_id: ${lxJob?.id})`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);

    if (job.retry_count < MAX_RETRIES) {
      await supabase
        .from("letterxpress_jobs")
        .update({
          status: "pending",
          retry_count: job.retry_count + 1,
          last_error_code: "LX_NETWORK_ERROR",
          last_error_message: `Verbindungsfehler: ${errMsg}`,
          processing_started_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } else {
      await supabase
        .from("letterxpress_jobs")
        .update({
          status: "error",
          last_error_code: "LX_NETWORK_ERROR",
          last_error_message: `Verbindungsfehler: ${errMsg} (nach ${MAX_RETRIES} Versuchen)`,
          pending_payload: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = getSupabase();

    let targetJobId: string | null = null;
    try {
      const body = await req.json();
      targetJobId = body?.job_id || null;
    } catch {
      // no body
    }

    let query = supabase
      .from("letterxpress_jobs")
      .select("id, user_id, pending_payload, retry_count, tenant_id, save_to_tenant_file, publish_to_portal")
      .eq("status", "pending")
      .not("pending_payload", "is", null)
      .order("queued_at", { ascending: true })
      .limit(5);

    if (targetJobId) {
      query = supabase
        .from("letterxpress_jobs")
        .select("id, user_id, pending_payload, retry_count, tenant_id, save_to_tenant_file, publish_to_portal")
        .eq("id", targetJobId)
        .in("status", ["pending", "processing"])
        .limit(1);
    }

    const { data: pendingJobs, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching pending jobs:", fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending jobs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await supabase
      .from("letterxpress_jobs")
      .update({ status: "pending", processing_started_at: null, updated_at: new Date().toISOString() })
      .eq("status", "processing")
      .lt("processing_started_at", staleThreshold);

    let processed = 0;
    let errors = 0;

    for (const job of pendingJobs) {
      if (!job.pending_payload) continue;
      try {
        await processJob(supabase, job as PendingJob);
        processed++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error processing job ${job.id}:`, errMsg);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingJobs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Queue processor error:", errMsg);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
