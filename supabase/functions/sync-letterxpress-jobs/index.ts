import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const LETTERXPRESS_BASE_URL = "https://api.letterxpress.de/v3";
const RATE_LIMIT_DELAY_MS = 600;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AccountRow {
  user_id: string;
  username: string;
  is_test_mode: boolean;
  is_enabled: boolean;
}

interface AccountCredentials {
  username: string;
  api_key: string;
  is_test_mode: boolean;
}

async function getDecryptedCredentials(
  supabase: ReturnType<typeof getSupabase>,
  ownerId: string
): Promise<AccountCredentials | null> {
  const { data, error } = await supabase.rpc("get_letterxpress_credentials", {
    p_owner_id: ownerId,
  });

  if (error || !data || !data.username || !data.api_key) {
    return null;
  }

  return {
    username: data.username,
    api_key: data.api_key,
    is_test_mode: data.is_test_mode ?? true,
  };
}

async function fetchPrintjobs(
  creds: AccountCredentials,
  filter?: string
): Promise<{ printjobs: any[]; pagination: any } | null> {
  const path = filter
    ? `/printjobs?filter=${encodeURIComponent(filter)}`
    : "/printjobs";
  const url = `${LETTERXPRESS_BASE_URL}${path}`;

  const auth = {
    username: creds.username,
    apikey: creds.api_key,
    mode: creds.is_test_mode ? "test" : "live",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (response.status !== 200 || data?.status !== 200) {
      return null;
    }

    return {
      printjobs: data.data?.printjobs || [],
      pagination: data.data?.pagination || null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function syncAccountJobs(
  supabase: ReturnType<typeof getSupabase>,
  ownerId: string,
  creds: AccountCredentials
): Promise<{ synced: number; errors: number; total: number }> {
  const result = await fetchPrintjobs(creds);

  if (!result) {
    return { synced: 0, errors: 1, total: 0 };
  }

  const { printjobs } = result;
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
      user_id: ownerId,
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
      .upsert(row, { onConflict: "user_id,external_job_id" });

    if (upsertError) {
      console.error(`[${ownerId}] Failed to upsert job ${job.id}:`, upsertError.message);
      errors++;
    } else {
      synced++;
    }
  }

  return { synced, errors, total: printjobs.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = getSupabase();

    const { data: accounts, error: accountsError } = await supabase
      .from("letterxpress_accounts")
      .select("user_id, username, is_test_mode, is_enabled")
      .eq("is_enabled", true)
      .not("encrypted_api_key", "is", null);

    if (accountsError) {
      console.error("Failed to load accounts:", accountsError.message);
      return new Response(
        JSON.stringify({ error: "Failed to load accounts", details: accountsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active LetterXpress accounts found", accounts_processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      user_id: string;
      synced: number;
      errors: number;
      total: number;
      error?: string;
    }> = [];

    for (const account of accounts as AccountRow[]) {
      try {
        const creds = await getDecryptedCredentials(supabase, account.user_id);

        if (!creds) {
          results.push({
            user_id: account.user_id,
            synced: 0,
            errors: 1,
            total: 0,
            error: "Could not decrypt credentials",
          });
          continue;
        }

        const syncResult = await syncAccountJobs(supabase, account.user_id, creds);
        results.push({ user_id: account.user_id, ...syncResult });

        await supabase
          .from("letterxpress_accounts")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", account.user_id);

        await sleep(RATE_LIMIT_DELAY_MS);
      } catch (err: any) {
        console.error(`[${account.user_id}] Sync failed:`, err.message);
        results.push({
          user_id: account.user_id,
          synced: 0,
          errors: 1,
          total: 0,
          error: err.message,
        });
      }
    }

    const totalSynced = results.reduce((s, r) => s + r.synced, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors, 0);

    return new Response(
      JSON.stringify({
        message: "Sync complete",
        accounts_processed: accounts.length,
        total_synced: totalSynced,
        total_errors: totalErrors,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("sync-letterxpress-jobs fatal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
