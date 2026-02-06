import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  let logId: string | undefined;

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "userId and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-welcome-email: start for", email, "userId:", userId);

    if (!resendApiKey) {
      console.error("send-welcome-email: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idempotencyKey = `welcome:${userId}`;

    const { data: existingLog } = await supabase
      .from("email_logs")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingLog?.status === "sent") {
      console.log("send-welcome-email: already sent, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Already sent", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("account_profiles")
      .select("first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    let userName = email.split("@")[0];
    if (profile) {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      if (fullName) userName = fullName;
    }

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "registration")
      .eq("language", "de")
      .maybeSingle();

    if (templateError || !template) {
      console.error("send-welcome-email: template not found", templateError);
      return new Response(
        JSON.stringify({ error: "Email template 'registration' not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://rentab.ly";
    const dashboardLink = `${origin}/dashboard`;

    const variables: Record<string, string> = {
      userName,
      dashboard_link: dashboardLink,
      user_email: email,
    };

    const finalSubject = replaceVariables(template.subject, variables);
    const finalHtml = replaceVariables(template.body_html, variables);
    const finalText = template.body_text ? replaceVariables(template.body_text, variables) : "";

    if (existingLog) {
      logId = existingLog.id;
      await supabase
        .from("email_logs")
        .update({
          status: "queued",
          error_code: null,
          error_message: null,
          subject: finalSubject,
        })
        .eq("id", logId);
    } else {
      const { data: newLog, error: insertError } = await supabase
        .from("email_logs")
        .insert({
          mail_type: "registration",
          category: "transactional",
          to_email: email,
          user_id: userId,
          subject: finalSubject,
          provider: "resend",
          status: "queued",
          idempotency_key: idempotencyKey,
          metadata: { template_key: "registration", trigger: "signup" },
        })
        .select("id")
        .maybeSingle();

      if (insertError) {
        console.error("send-welcome-email: log insert failed:", insertError.message);
      }
      if (newLog) logId = newLog.id;
    }

    console.log("send-welcome-email: calling Resend API for", email);

    const fromAddress = Deno.env.get("EMAIL_FROM") || "Rentably <hallo@rentab.ly>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("send-welcome-email: Resend error", resendData);
      if (logId) {
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error_code: `RESEND_${resendResponse.status}`,
            error_message: resendData.message || "Resend API error",
          })
          .eq("id", logId);
      }
      return new Response(
        JSON.stringify({ error: resendData.message || "Resend API error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (logId) {
      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          provider_message_id: resendData.id,
          sent_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    console.log("send-welcome-email: SUCCESS, Resend ID:", resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent",
        emailId: resendData.id,
        logId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-welcome-email: FATAL ERROR", error);

    if (logId) {
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
