import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

/*
  fetch-interest-rates -- Weekly Bundesbank BBIM1 interest rate importer

  Data source: Deutsche Bundesbank SDMX REST API (public, no auth required)
  Flow: BBIM1 -- MFI Interest Rate Statistics
  4 series: Housing loans to households, new business, effective interest rate, monthly

  URLs:
    1) Variabel / bis 1 Jahr:    M.DE.B.A2C.F.R.A.2250.EUR.N
    2) > 1 bis 5 Jahre:          M.DE.B.A2C.I.R.A.2250.EUR.N
    3) > 5 bis 10 Jahre:         M.DE.B.A2C.O.R.A.2250.EUR.N
    4) > 10 Jahre:               M.DE.B.A2C.P.R.A.2250.EUR.N

  raw_hash: SHA-256 of JSON.stringify(series) with keys sorted alphabetically.
  This means identical data produces the same hash regardless of fetch timing.
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Cron-Secret, X-Client-Info, Apikey",
};

const SERIES_CONFIG = [
  {
    id: "fixation_up_to_1y",
    label: "Variabel / bis 1 Jahr",
    key: "M.DE.B.A2C.F.R.A.2250.EUR.N",
  },
  {
    id: "fixation_1_to_5y",
    label: "> 1 bis 5 Jahre",
    key: "M.DE.B.A2C.I.R.A.2250.EUR.N",
  },
  {
    id: "fixation_5_to_10y",
    label: "> 5 bis 10 Jahre",
    key: "M.DE.B.A2C.O.R.A.2250.EUR.N",
  },
  {
    id: "fixation_over_10y",
    label: "> 10 Jahre",
    key: "M.DE.B.A2C.P.R.A.2250.EUR.N",
  },
];

const BASE_URL = "https://api.statistiken.bundesbank.de/rest/download/BBIM1";

interface DataPoint {
  date: string;
  value: number;
}

function parseBundesbankCsv(csvText: string): DataPoint[] {
  const points: DataPoint[] = [];
  const lines = csvText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split(";");
    if (parts.length < 2) continue;

    const datePart = parts[0].trim().replace(/^"/, "").replace(/"$/, "");
    const valuePart = parts[1].trim().replace(/^"/, "").replace(/"$/, "");

    if (!/^\d{4}-\d{2}$/.test(datePart)) continue;

    const numericStr = valuePart.replace(",", ".");
    const value = parseFloat(numericStr);
    if (isNaN(value)) continue;

    points.push({ date: datePart, value });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => JSON.stringify(k) + ":" + stableStringify((obj as Record<string, unknown>)[k])
  );
  return "{" + pairs.join(",") + "}";
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchCsvWithRetry(url: string): Promise<string> {
  const headers = {
    "User-Agent": "Rentably/1.0 (interest-rate-fetcher; hallo@rentab.ly)",
    Accept: "text/csv",
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  const bearerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const cronHeader = req.headers.get("x-cron-secret");

  const isValidCronSecret = CRON_SECRET && (cronHeader === CRON_SECRET || bearerToken === CRON_SECRET);
  const isValidServiceRole = bearerToken === serviceRoleKey;

  let isValidAdmin = false;
  if (!isValidCronSecret && !isValidServiceRole && bearerToken) {
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (adminRow) isValidAdmin = true;
    }
  }

  if (!isValidCronSecret && !isValidServiceRole && !isValidAdmin) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let cronRunId: string | null = null;

  try {
    const { data: cronRun } = await supabase
      .from("cron_runs")
      .insert({ job_name: "weekly-interest-rate-fetch", status: "running" })
      .select("id")
      .single();
    cronRunId = cronRun?.id || null;

    const { data: lastRun } = await supabase
      .from("cron_runs")
      .select("started_at")
      .eq("job_name", "weekly-interest-rate-fetch")
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRun?.started_at) {
      const lastRunDate = new Date(lastRun.started_at);
      const hoursSince = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const msg = `Skipped: last successful run was ${Math.round(hoursSince)}h ago (< 24h threshold)`;
        console.log("fetch-interest-rates:", msg);
        if (cronRunId) {
          await supabase
            .from("cron_runs")
            .update({
              status: "completed",
              finished_at: new Date().toISOString(),
              skipped_count: 1,
              metadata: { message: msg },
            })
            .eq("id", cronRunId);
        }
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: msg }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("fetch-interest-rates: fetching 4 series from Bundesbank...");

    const seriesResults: Array<{
      id: string;
      label: string;
      key: string;
      points: DataPoint[];
    }> = [];

    for (const cfg of SERIES_CONFIG) {
      const url = `${BASE_URL}/${cfg.key}?format=csv&lang=de`;
      console.log(`fetch-interest-rates: fetching ${cfg.id} from ${url}`);
      const csvText = await fetchCsvWithRetry(url);
      const points = parseBundesbankCsv(csvText);

      if (points.length === 0) {
        throw new Error(`No data points parsed for series ${cfg.id} (${cfg.key})`);
      }

      console.log(`fetch-interest-rates: ${cfg.id} -> ${points.length} data points`);

      seriesResults.push({
        id: cfg.id,
        label: cfg.label,
        key: cfg.key,
        points,
      });
    }

    const allDates = seriesResults.flatMap((s) => s.points.map((p) => p.date));
    allDates.sort();
    const startPeriod = allDates[0];
    const endPeriod = allDates[allDates.length - 1];

    const seriesPayload = {
      meta: {
        source: "bundesbank",
        flowRef: "BBIM1",
        unit: "% p.a.",
        note: "Wohnungsbaukredite an private Haushalte (Neugeschäft), Effektivzins, monatlich",
      },
      series: seriesResults,
    };

    const stableJson = stableStringify(seriesPayload);
    const rawHash = await sha256(stableJson);

    console.log(`fetch-interest-rates: hash=${rawHash}, period=${startPeriod}..${endPeriod}`);

    const { error: insertError } = await supabase
      .from("interest_rate_snapshots")
      .insert({
        source: "bundesbank",
        start_period: startPeriod,
        end_period: endPeriod,
        series: seriesPayload,
        raw_hash: rawHash,
      });

    let inserted = true;
    if (insertError) {
      if (insertError.code === "23505") {
        inserted = false;
        console.log("fetch-interest-rates: duplicate hash, no new data. Skipped insert.");
      } else {
        throw new Error(`Insert failed: ${insertError.message}`);
      }
    }

    const totalPoints = seriesResults.reduce((sum, s) => sum + s.points.length, 0);
    const resultMsg = inserted
      ? `Imported ${totalPoints} data points across 4 series (${startPeriod} to ${endPeriod})`
      : `Data unchanged (hash match). ${totalPoints} points, ${startPeriod} to ${endPeriod}`;

    console.log("fetch-interest-rates:", resultMsg);

    if (cronRunId) {
      await supabase
        .from("cron_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          processed_count: totalPoints,
          sent_count: inserted ? 1 : 0,
          skipped_count: inserted ? 0 : 1,
          metadata: {
            message: resultMsg,
            hash: rawHash,
            start_period: startPeriod,
            end_period: endPeriod,
            inserted,
          },
        })
        .eq("id", cronRunId);
    }

    return new Response(
      JSON.stringify({ success: true, inserted, message: resultMsg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("fetch-interest-rates: FATAL ERROR", errMsg);

    if (cronRunId) {
      await supabase
        .from("cron_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: errMsg,
        })
        .eq("id", cronRunId);
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
