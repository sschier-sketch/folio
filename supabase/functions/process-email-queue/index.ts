import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  let cronRunId: string | null = null;

  try {
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or missing cron secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: cronRun } = await supabase
      .from("cron_runs")
      .insert({ job_name: "process-email-queue", status: "running" })
      .select("id")
      .single();

    cronRunId = cronRun?.id || null;

    const { data: queuedEmails, error: fetchError } = await supabase
      .from("email_logs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch queued emails: ${fetchError.message}`);
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      if (cronRunId) {
        await supabase
          .from("cron_runs")
          .update({
            status: "completed",
            finished_at: new Date().toISOString(),
            processed_count: 0,
            sent_count: 0,
            failed_count: 0,
            skipped_count: 0,
          })
          .eq("id", cronRunId);
      }

      return new Response(
        JSON.stringify({ success: true, message: "No queued emails to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${queuedEmails.length} queued emails`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const emailLog of queuedEmails) {
      processedCount++;

      try {
        await supabase
          .from("email_logs")
          .update({ status: "processing" })
          .eq("id", emailLog.id);

        const metadata = emailLog.metadata || {};
        const templateKey = metadata.template_key || emailLog.mail_type;
        const variables = metadata.variables || {};

        if (metadata.dashboard_link) {
          variables.dashboard_link = metadata.dashboard_link;
        }

        const emailPayload: Record<string, unknown> = {
          to: emailLog.to_email,
          templateKey: templateKey,
          userId: emailLog.user_id,
          mailType: emailLog.mail_type,
          category: emailLog.category,
          variables: variables,
        };

        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Failed to send email ${emailLog.id}:`, errorData);

          await supabase
            .from("email_logs")
            .update({
              status: "failed",
              error_message: `Queue processing failed: ${errorData}`,
            })
            .eq("id", emailLog.id);

          errorCount++;
        } else {
          const result = await response.json();

          await supabase
            .from("email_logs")
            .update({
              status: "sent",
              provider_message_id: result.emailId || null,
              sent_at: new Date().toISOString(),
            })
            .eq("id", emailLog.id);

          successCount++;
        }
      } catch (error) {
        console.error(`Error processing email ${emailLog.id}:`, error);

        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error during queue processing",
          })
          .eq("id", emailLog.id);

        errorCount++;
      }
    }

    if (cronRunId) {
      await supabase
        .from("cron_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          processed_count: processedCount,
          sent_count: successCount,
          failed_count: errorCount,
          skipped_count: 0,
        })
        .eq("id", cronRunId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} emails`,
        processed: processedCount,
        sent: successCount,
        errors: errorCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-email-queue:", error);

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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
