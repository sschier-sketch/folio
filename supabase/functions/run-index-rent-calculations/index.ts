import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let cronRunId: string | null = null;

  try {
    const { data: cronRun } = await supabase
      .from("cron_runs")
      .insert({ job_name: "run-index-rent-calculations", status: "running" })
      .select("id")
      .single();

    cronRunId = cronRun?.id || null;

    const { data, error } = await supabase.rpc("run_automatic_index_rent_calculations");

    if (error) {
      throw new Error(error.message);
    }

    const processedCount = Array.isArray(data) ? data.length : (data ? 1 : 0);

    if (cronRunId) {
      await supabase
        .from("cron_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          processed_count: processedCount,
          sent_count: 0,
          failed_count: 0,
          skipped_count: 0,
          metadata: { result: data },
        })
        .eq("id", cronRunId);
    }

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception:", error);

    if (cronRunId) {
      try {
        await supabase
          .from("cron_runs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", cronRunId);
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
