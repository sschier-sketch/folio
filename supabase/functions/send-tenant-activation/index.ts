import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { tenantId, userId } = await req.json();

    if (!tenantId || !userId) {
      return jsonResponse({ error: "Missing required fields: tenantId and userId" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("first_name, last_name, email, property_id")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error("Error fetching tenant:", tenantError);
      return jsonResponse({ error: "Error fetching tenant data", details: tenantError.message }, 500);
    }

    if (!tenant) {
      return jsonResponse({ error: "Tenant not found" }, 404);
    }

    if (!tenant.email) {
      return jsonResponse({ error: "Tenant has no email address" }, 400);
    }

    let propertyName = "";
    let propertyAddress = "";
    if (tenant.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("name, street, zip_code, city")
        .eq("id", tenant.property_id)
        .maybeSingle();

      if (prop) {
        propertyAddress = [prop.street, [prop.zip_code, prop.city].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ");
        propertyName = prop.name || propertyAddress || "";
      }
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      console.error("Error fetching landlord:", authError);
      return jsonResponse({ error: "Landlord not found" }, 404);
    }

    const landlordEmail = authUser.user.email || "";

    const { data: profile } = await supabase
      .from("account_profiles")
      .select("first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    const landlordName =
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : landlordEmail;

    const origin = req.headers.get("origin") || "https://rentab.ly";
    const portalLink = `${origin}/mieterportal-aktivierung`;

    const variables: Record<string, string> = {
      tenant_name: `${tenant.first_name} ${tenant.last_name}`.trim(),
      tenant_email: tenant.email,
      portal_link: portalLink,
      landlord_name: landlordName,
      landlord_email: landlordEmail,
      property_name: propertyName,
      property_address: propertyAddress,
    };

    let userLanguage = "de";
    const { data: langPref } = await supabase
      .from("admin_users")
      .select("preferred_language")
      .eq("user_id", userId)
      .maybeSingle();

    if (langPref?.preferred_language) {
      userLanguage = langPref.preferred_language;
    }

    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "tenant_portal_activation")
      .eq("language", userLanguage)
      .maybeSingle();

    let resolvedTemplate = template;

    if (templateError || !resolvedTemplate) {
      const { data: fallback } = await supabase
        .from("email_templates")
        .select("subject, body_html, body_text")
        .eq("template_key", "tenant_portal_activation")
        .eq("language", "de")
        .maybeSingle();

      if (!fallback) {
        console.error("Template not found: tenant_portal_activation");
        return jsonResponse({
          error: "Email template not found",
          details: "tenant_portal_activation template missing",
        }, 500);
      }

      resolvedTemplate = fallback;
    }

    const finalSubject = replaceVariables(resolvedTemplate.subject, variables);
    const finalHtml = replaceVariables(resolvedTemplate.body_html, variables);
    const finalText = replaceVariables(resolvedTemplate.body_text || "", variables);

    let fromAddress = "Rentably <hallo@rentab.ly>";

    const { data: mailbox } = await supabase
      .from("user_mailboxes")
      .select("alias_localpart, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (mailbox?.alias_localpart) {
      const aliasEmail = `${mailbox.alias_localpart}@rentab.ly`;

      const { data: mailSettings } = await supabase
        .from("user_mail_settings")
        .select("sender_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (mailSettings?.sender_name?.trim()) {
        fromAddress = `${mailSettings.sender_name.trim()} <${aliasEmail}>`;
      } else if (profile) {
        const displayName =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Rentably";
        fromAddress = `${displayName} <${aliasEmail}>`;
      } else {
        fromAddress = `Rentably <${aliasEmail}>`;
      }
    }

    const { data: logEntry } = await supabase
      .from("email_logs")
      .insert({
        mail_type: "tenant_portal_activation",
        category: "transactional",
        to_email: tenant.email,
        user_id: userId,
        subject: finalSubject,
        provider: "resend",
        status: "queued",
        metadata: { tenantId },
      })
      .select("id")
      .maybeSingle();

    const logId = logEntry?.id;

    if (!resendApiKey) {
      if (logId) {
        await supabase
          .from("email_logs")
          .update({ status: "failed", error_code: "CONFIG_ERROR", error_message: "RESEND_API_KEY not configured" })
          .eq("id", logId);
      }
      return jsonResponse({ error: "Email provider not configured (RESEND_API_KEY missing)" }, 500);
    }

    const emailPayload: Record<string, unknown> = {
      from: fromAddress,
      to: [tenant.email],
      subject: finalSubject,
      html: finalHtml,
      text: finalText || undefined,
    };

    if (landlordEmail) {
      emailPayload.reply_to = landlordEmail;
    }

    console.log("Sending tenant activation email:", {
      to: tenant.email,
      from: fromAddress,
      subject: finalSubject,
    });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
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
      return jsonResponse({
        error: "Failed to send email via provider",
        details: resendData.message || `Resend returned ${resendResponse.status}`,
      }, 500);
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

    await supabase
      .from("tenants")
      .update({ portal_invited_at: new Date().toISOString() })
      .eq("id", tenantId);

    console.log("Tenant activation email sent successfully:", {
      tenantId,
      email: tenant.email,
      resendId: resendData.id,
    });

    return jsonResponse({
      success: true,
      message: "Activation email sent successfully",
      recipient: tenant.email,
    }, 200);
  } catch (error) {
    console.error("Error in send-tenant-activation:", error);

    return jsonResponse({
      error: error instanceof Error ? error.message : "Failed to send activation email",
    }, 500);
  }
});
