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

async function sendWelcomeEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  resendApiKey: string,
  fromAddress: string,
): Promise<void> {
  try {
    const idempotencyKey = `welcome:${userId}`;

    const { data: existingLog } = await supabase
      .from("email_logs")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingLog?.status === "sent") {
      console.log("send-magic-link: welcome email already sent, skipping");
      return;
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

    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "registration")
      .eq("language", "de")
      .maybeSingle();

    if (!template) {
      console.error("send-magic-link: welcome email template 'registration' not found");
      return;
    }

    const variables: Record<string, string> = {
      userName,
      dashboard_link: "https://rentab.ly/dashboard",
      user_email: email,
    };

    const finalSubject = replaceVariables(template.subject, variables);
    const finalHtml = replaceVariables(template.body_html, variables);
    const finalText = template.body_text ? replaceVariables(template.body_text, variables) : "";

    let welcomeLogId: string | undefined;

    if (existingLog) {
      welcomeLogId = existingLog.id;
      await supabase
        .from("email_logs")
        .update({
          status: "queued",
          error_code: null,
          error_message: null,
          subject: finalSubject,
        })
        .eq("id", welcomeLogId);
    } else {
      const { data: newLog } = await supabase
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
          metadata: { template_key: "registration", trigger: "magic_link_signup" },
        })
        .select("id")
        .maybeSingle();
      if (newLog) welcomeLogId = newLog.id;
    }

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
      console.error("send-magic-link: welcome email Resend error", resendData);
      if (welcomeLogId) {
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error_code: `RESEND_${resendResponse.status}`,
            error_message: resendData.message || "Resend API error",
          })
          .eq("id", welcomeLogId);
      }
      return;
    }

    if (welcomeLogId) {
      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          provider_message_id: resendData.id,
          sent_at: new Date().toISOString(),
        })
        .eq("id", welcomeLogId);
    }

    console.log("send-magic-link: welcome email sent successfully, Resend ID:", resendData.id);
  } catch (err) {
    console.error("send-magic-link: welcome email error (non-blocking)", err);
  }
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

    const timestampBeforeGenerate = Date.now();

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectTo || "https://rentab.ly/dashboard",
      },
    });

    if (linkError) {
      const msg = linkError.message?.toLowerCase() ?? "";
      if (msg.includes("user not found") || msg.includes("no user found")) {
        return new Response(
          JSON.stringify({ success: true, message: "If the email exists, a magic link has been sent." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("send-magic-link: generateLink error", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!linkData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate magic link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = linkData.user?.id;
    const magicLink = linkData.properties?.action_link;
    if (!magicLink) {
      return new Response(
        JSON.stringify({ error: "No action_link returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isNewUser = false;
    if (userId) {
      const createdAt = linkData.user?.created_at;
      if (createdAt) {
        const createdMs = new Date(createdAt).getTime();
        if (createdMs >= timestampBeforeGenerate - 10_000) {
          isNewUser = true;
          console.log("send-magic-link: new user detected via magic link registration:", email);
        }
      }
    }

    const { data: profileData } = await supabase
      .from("account_profiles")
      .select("language")
      .eq("user_id", userId)
      .maybeSingle();

    const language = profileData?.language || "de";

    let { data: tpl } = await supabase
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "magic_link")
      .eq("language", language)
      .maybeSingle();

    if (!tpl) {
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

      tpl = fallback;
    }

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
        user_id: userId || null,
        subject: finalSubject,
        provider: "resend",
        status: "queued",
        metadata: {
          template_key: "magic_link",
          trigger: isNewUser ? "magic_link_signup" : "login_magic_link",
        },
      })
      .select("id")
      .maybeSingle();

    const logId = newLog?.id;

    const fromAddress = Deno.env.get("EMAIL_FROM") || "rentably <hallo@rentab.ly>";

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

    if (isNewUser && userId) {
      await sendWelcomeEmail(supabase, userId, email, resendApiKey, fromAddress);
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
