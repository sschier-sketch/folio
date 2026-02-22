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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!userExists) {
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a magic link has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectTo || "https://rentab.ly/dashboard",
      },
    });

    if (linkError || !linkData) {
      console.error("send-magic-link: generateLink error", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const magicLink = linkData.properties?.action_link;
    if (!magicLink) {
      return new Response(
        JSON.stringify({ error: "No action_link returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("account_profiles")
      .select("language")
      .eq("user_id", linkData.user?.id)
      .maybeSingle();

    const language = profile?.language || "de";

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "magic_link")
      .eq("language", language)
      .maybeSingle();

    if (templateError || !template) {
      const { data: fallback } = await supabase
        .from("email_templates")
        .select("subject, body_html, body_text")
        .eq("template_key", "magic_link")
        .eq("language", "de")
        .maybeSingle();

      if (!fallback) {
        return new Response(
          JSON.stringify({ error: "magic_link template not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      Object.assign(template || {}, fallback);
    }

    const tpl = template!;
    const variables: Record<string, string> = {
      magic_link: magicLink,
    };

    const finalSubject = replaceVariables(tpl.subject, variables);
    const finalHtml = replaceVariables(tpl.body_html, variables);
    const finalText = tpl.body_text ? replaceVariables(tpl.body_text, variables) : "";

    const { data: newLog } = await supabase
      .from("email_logs")
      .insert({
        mail_type: "magic_login",
        category: "transactional",
        to_email: email,
        user_id: linkData.user?.id || null,
        subject: finalSubject,
        provider: "resend",
        status: "queued",
        metadata: { template_key: "magic_link", trigger: "login_magic_link" },
      })
      .select("id")
      .maybeSingle();

    const logId = newLog?.id;

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
      console.error("send-magic-link: Resend error", resendData);
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
        JSON.stringify({ error: "Failed to send email" }),
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

    return new Response(
      JSON.stringify({ success: true, message: "If the email exists, a magic link has been sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-magic-link: FATAL ERROR", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
