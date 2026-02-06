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

  try {
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or missing cron secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: queuedEmails, error: fetchError } = await supabase
      .from("email_logs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching queued emails:", fetchError);
      throw new Error("Failed to fetch queued emails");
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No queued emails to process",
          processed: 0,
        }),
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

        const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;

        const emailPayload: Record<string, unknown> = {
          to: emailLog.to_email,
          templateKey: templateKey,
          userId: emailLog.user_id,
          mailType: emailLog.mail_type,
          category: emailLog.category,
          variables: variables,
        };

        console.log(`Sending email ${emailLog.id} to ${emailLog.to_email}`);

        const response = await fetch(sendEmailUrl, {
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
          console.log(`Email ${emailLog.id} sent successfully:`, result);

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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} emails`,
        processed: processedCount,
        success: successCount,
        errors: errorCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-email-queue:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
