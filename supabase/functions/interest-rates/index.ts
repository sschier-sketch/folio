import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/*
  interest-rates -- Public read-only API for Bundesbank interest rate snapshots

  Endpoints (single edge function, path-based routing):
    GET /interest-rates/latest       -> latest snapshot, all data points
    GET /interest-rates?range=1y     -> latest snapshot, points filtered to last 12 months
    GET /interest-rates?range=3y     -> latest snapshot, points filtered to last 36 months
    GET /interest-rates?range=5y     -> latest snapshot, points filtered to last 60 months
    GET /interest-rates?range=max    -> latest snapshot, all data points (default)

  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
  (Data updates weekly, so 1h fresh + 24h stale-while-revalidate is appropriate)
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RANGE_MONTHS: Record<string, number> = {
  "1y": 12,
  "3y": 36,
  "5y": 60,
};

function filterPointsByRange(
  series: Array<{ id: string; label: string; key: string; points: Array<{ date: string; value: number }> }>,
  months: number
): typeof series {
  const now = new Date();
  const cutoffYear = now.getFullYear() - Math.floor(months / 12);
  const cutoffMonth = now.getMonth() + 1 - (months % 12);
  const adjusted = cutoffMonth <= 0
    ? { y: cutoffYear - 1, m: cutoffMonth + 12 }
    : { y: cutoffYear, m: cutoffMonth };
  const cutoff = `${adjusted.y}-${String(adjusted.m).padStart(2, "0")}`;

  return series.map((s) => ({
    ...s,
    points: s.points.filter((p) => p.date >= cutoff),
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use GET." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") || "max";

    if (rangeParam !== "max" && !RANGE_MONTHS[rangeParam]) {
      return new Response(
        JSON.stringify({
          error: `Invalid range "${rangeParam}". Supported: 1y, 3y, 5y, max`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: snapshot, error: dbError } = await supabase
      .from("interest_rate_snapshots")
      .select("source, fetched_at, start_period, end_period, series")
      .eq("source", "bundesbank")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      console.error("interest-rates: DB error", dbError.message);
      throw new Error(dbError.message);
    }

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          error: "No interest rate data available yet. The weekly import may not have run. Check /admin cron jobs.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seriesData = snapshot.series as {
      meta: Record<string, string>;
      series: Array<{ id: string; label: string; key: string; points: Array<{ date: string; value: number }> }>;
    };

    let filteredSeries = seriesData.series;
    if (rangeParam !== "max" && RANGE_MONTHS[rangeParam]) {
      filteredSeries = filterPointsByRange(seriesData.series, RANGE_MONTHS[rangeParam]);
    }

    const allDates = filteredSeries.flatMap((s) => s.points.map((p) => p.date)).sort();
    const startPeriod = allDates.length > 0 ? allDates[0] : snapshot.start_period;
    const endPeriod = allDates.length > 0 ? allDates[allDates.length - 1] : snapshot.end_period;

    const response = {
      source: snapshot.source,
      fetched_at: snapshot.fetched_at,
      start_period: startPeriod,
      end_period: endPeriod,
      range: rangeParam,
      series: {
        meta: seriesData.meta,
        series: filteredSeries,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("interest-rates: Error", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
