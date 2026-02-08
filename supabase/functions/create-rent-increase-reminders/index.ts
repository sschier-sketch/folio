import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      .insert({ job_name: "create-rent-increase-reminders", status: "running" })
      .select("id")
      .single();

    cronRunId = cronRun?.id || null;

    const { data, error } = await supabase.rpc("create_rent_increase_reminder_tickets");

    if (error) {
      throw new Error(error.message);
    }

    const ticketsCreated = data?.[0]?.tickets_created || 0;

    if (cronRunId) {
      await supabase
        .from("cron_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          processed_count: ticketsCreated,
          sent_count: ticketsCreated,
          failed_count: 0,
          skipped_count: 0,
        })
        .eq("id", cronRunId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tickets_created: ticketsCreated,
        message: `Successfully created ${ticketsCreated} reminder ticket(s)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);

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
