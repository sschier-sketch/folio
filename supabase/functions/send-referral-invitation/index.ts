import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReferralInvitationRequest {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  language?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { recipientEmail, recipientName, message, language = "de" } =
      (await req.json()) as ReferralInvitationRequest;

    if (!recipientEmail) {
      throw new Error("recipientEmail is required");
    }

    const { data: settings, error: settingsError } = await supabaseClient
      .from("user_settings")
      .select("referral_code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError || !settings) {
      throw new Error("User settings not found");
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("account_profiles")
      .select("company_name, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let inviterName = user.email?.split("@")[0] || "Ein Freund";
    if (profile) {
      if (profile.company_name) {
        inviterName = profile.company_name;
      } else if (profile.first_name || profile.last_name) {
        inviterName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      }
    }

    const { data: template, error: templateError } = await supabaseClient
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "referral_invitation")
      .eq("language", language)
      .maybeSingle();

    if (templateError || !template) {
      throw new Error("Email template not found");
    }

    const registrationLink = `${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://app.")}/?ref=${settings.referral_code}`;

    let emailBody = template.body_html
      .replace(/{{inviter_name}}/g, inviterName)
      .replace(/{{registration_link}}/g, registrationLink)
      .replace(/{{referral_code}}/g, settings.referral_code);

    if (message) {
      const personalMessage = `
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Persönliche Nachricht:</strong></p>
          <p style="margin: 10px 0 0 0; color: #856404;">${message}</p>
        </div>
      `;
      emailBody = emailBody.replace(
        '<div style="background: #f8fafc;',
        personalMessage + '<div style="background: #f8fafc;',
      );
    }

    const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: template.subject,
        html: emailBody,
        text: template.body_text
          .replace(/{{inviter_name}}/g, inviterName)
          .replace(/{{registration_link}}/g, registrationLink)
          .replace(/{{referral_code}}/g, settings.referral_code),
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send error:", errorText);
      throw new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral invitation sent successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
