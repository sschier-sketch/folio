import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvitePayload {
  email: string;
  role: string;
  is_read_only: boolean;
  can_manage_billing: boolean;
  can_manage_users: boolean;
  can_manage_properties: boolean;
  can_manage_tenants: boolean;
  can_manage_finances: boolean;
  can_view_analytics: boolean;
  can_view_finances: boolean;
  can_view_statements: boolean;
  can_view_rent_payments: boolean;
  can_view_leases: boolean;
  can_view_messages: boolean;
  property_scope: string;
  property_access: string;
  property_ids: string[];
  language?: string;
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(placeholder, value);
  });
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: InvitePayload = await req.json();
    const invitedEmail = payload.email?.toLowerCase().trim();

    if (!invitedEmail) {
      return new Response(
        JSON.stringify({ error: "E-Mail-Adresse ist erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitedEmail === user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Du kannst dich nicht selbst einladen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerSettings } = await supabaseAdmin
      .from("user_settings")
      .select("role, account_owner_id, can_manage_users, is_active_member, removed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    let accountOwnerId: string;

    if (!callerSettings?.account_owner_id && callerSettings?.role === "owner") {
      accountOwnerId = user.id;
    } else if (
      callerSettings?.account_owner_id &&
      callerSettings.can_manage_users &&
      callerSettings.is_active_member &&
      !callerSettings.removed_at
    ) {
      accountOwnerId = callerSettings.account_owner_id;
    } else {
      return new Response(
        JSON.stringify({ error: "Keine Berechtigung zum Einladen von Benutzern" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ownerBilling } = await supabaseAdmin
      .from("billing_info")
      .select("subscription_plan, subscription_status, trial_ends_at")
      .eq("user_id", accountOwnerId)
      .maybeSingle();

    const isPro =
      (ownerBilling?.subscription_plan === "pro" && ownerBilling?.subscription_status === "active") ||
      (ownerBilling?.trial_ends_at && new Date(ownerBilling.trial_ends_at) > new Date());

    if (!isPro) {
      return new Response(
        JSON.stringify({ error: "Benutzerverwaltung ist nur im Pro-Tarif verfuegbar" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let existingUserId: string | null = null;
    try {
      const { data: usersResult } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const match = usersResult?.users?.find(
        (u) => u.email?.toLowerCase() === invitedEmail
      );
      if (match) existingUserId = match.id;
    } catch (listErr) {
      console.warn("listUsers failed, continuing without duplicate check:", listErr);
    }

    if (existingUserId) {
      const { data: existingSettings } = await supabaseAdmin
        .from("user_settings")
        .select("account_owner_id, role, removed_at")
        .eq("user_id", existingUserId)
        .maybeSingle();

      if (existingSettings) {
        if (!existingSettings.account_owner_id && existingSettings.role === "owner") {
          return new Response(
            JSON.stringify({
              error: "Diese E-Mail-Adresse gehoert bereits zu einem eigenstaendigen Rentably-Account. " +
                "Ein bestehendes Konto kann nicht als Teammitglied hinzugefuegt werden.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existingSettings.account_owner_id === accountOwnerId && !existingSettings.removed_at) {
          return new Response(
            JSON.stringify({ error: "Dieser Benutzer ist bereits Mitglied dieses Accounts" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const { data: existingInvitation } = await supabaseAdmin
      .from("user_invitations")
      .select("id, status, expires_at")
      .eq("account_owner_id", accountOwnerId)
      .eq("invited_email", invitedEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      if (new Date(existingInvitation.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({
            error: "Es gibt bereits eine aktive Einladung fuer diese E-Mail-Adresse",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("user_invitations")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", existingInvitation.id);
    }

    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        account_owner_id: accountOwnerId,
        invited_email: invitedEmail,
        invited_by: user.id,
        role: payload.role || "member",
        is_read_only: payload.is_read_only ?? false,
        can_manage_billing: payload.can_manage_billing ?? false,
        can_manage_users: payload.can_manage_users ?? false,
        can_manage_properties: payload.can_manage_properties ?? true,
        can_manage_tenants: payload.can_manage_tenants ?? true,
        can_manage_finances: payload.can_manage_finances ?? true,
        can_view_analytics: payload.can_view_analytics ?? true,
        can_view_finances: payload.can_view_finances ?? false,
        can_view_statements: payload.can_view_statements ?? false,
        can_view_rent_payments: payload.can_view_rent_payments ?? false,
        can_view_leases: payload.can_view_leases ?? false,
        can_view_messages: payload.can_view_messages ?? false,
        property_scope: payload.property_scope || "all",
        property_access: payload.property_access || "write",
        property_ids: payload.property_ids || [],
      })
      .select()
      .single();

    if (insertError || !invitation) {
      console.error("Insert invitation failed:", insertError);
      return new Response(
        JSON.stringify({ error: "Einladung konnte nicht erstellt werden", details: insertError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inviterProfile } = await supabaseAdmin
      .from("account_profiles")
      .select("first_name, last_name, company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const inviterName =
      [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
      inviterProfile?.company_name ||
      user.email;

    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      member: "Mitglied",
      viewer: "Betrachter",
    };

    const origin = req.headers.get("origin") || "https://rentab.ly";
    const invitationLink = `${origin}/einladung/${invitation.token}`;

    const expiresDate = new Date(invitation.expires_at);
    const expiresFormatted = expiresDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const language = payload.language || "de";

    let emailSent = false;
    let emailError: string | null = null;
    let emailLogId: string | null = null;

    const idempotencyKey = `account_invite:${invitation.id}`;
    const templateVariables: Record<string, string> = {
      inviter_name: inviterName || "",
      invitee_email: invitedEmail,
      invitation_link: invitationLink,
      role: roleLabels[invitation.role] || invitation.role,
      expires_in: expiresFormatted,
    };

    try {
      const { data: existingLog } = await supabaseAdmin
        .from("email_logs")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existingLog?.status === "sent") {
        emailSent = true;
        emailLogId = existingLog.id;
      } else {
        if (existingLog) {
          emailLogId = existingLog.id;
          await supabaseAdmin
            .from("email_logs")
            .update({
              status: "queued",
              error_code: null,
              error_message: null,
              metadata: { templateKey: "user_invitation", retry: true },
            })
            .eq("id", emailLogId);
        } else {
          const { data: logEntry } = await supabaseAdmin
            .from("email_logs")
            .insert({
              mail_type: "user_invitation",
              category: "transactional",
              to_email: invitedEmail,
              user_id: accountOwnerId,
              subject: "user_invitation",
              provider: "resend",
              status: "queued",
              idempotency_key: idempotencyKey,
              metadata: { templateKey: "user_invitation" },
            })
            .select("id")
            .single();

          if (logEntry) emailLogId = logEntry.id;
        }

        const { data: template } = await supabaseAdmin
          .from("email_templates")
          .select("*")
          .eq("template_key", "user_invitation")
          .eq("language", language)
          .maybeSingle();

        if (!template) {
          const errMsg = `Template not found: user_invitation (language: ${language})`;
          if (emailLogId) {
            await supabaseAdmin
              .from("email_logs")
              .update({ status: "failed", error_code: "TEMPLATE_NOT_FOUND", error_message: errMsg })
              .eq("id", emailLogId);
          }
          emailError = errMsg;
        } else {
          const finalSubject = replaceVariables(template.subject, templateVariables);
          const finalHtml = replaceVariables(template.body_html, templateVariables);
          const finalText = replaceVariables(template.body_text || "", templateVariables);

          if (emailLogId) {
            await supabaseAdmin
              .from("email_logs")
              .update({ subject: finalSubject })
              .eq("id", emailLogId);
          }

          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (!RESEND_API_KEY) {
            if (emailLogId) {
              await supabaseAdmin
                .from("email_logs")
                .update({ status: "failed", error_code: "CONFIG_ERROR", error_message: "RESEND_API_KEY not configured" })
                .eq("id", emailLogId);
            }
            emailError = "RESEND_API_KEY not configured";
          } else {
            const DEFAULT_FROM = Deno.env.get("EMAIL_FROM") || "Rentably <hallo@rentab.ly>";

            const resendResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: DEFAULT_FROM,
                to: [invitedEmail],
                subject: finalSubject,
                html: finalHtml,
                text: finalText || "",
              }),
            });

            const resendData = await resendResponse.json();

            if (!resendResponse.ok) {
              console.error("Resend API error for invitation email:", resendData);
              if (emailLogId) {
                await supabaseAdmin
                  .from("email_logs")
                  .update({
                    status: "failed",
                    error_code: `RESEND_${resendResponse.status}`,
                    error_message: resendData.message || "Resend API error",
                  })
                  .eq("id", emailLogId);
              }
              emailError = resendData.message || "Resend API error";
            } else {
              emailSent = true;
              if (emailLogId) {
                await supabaseAdmin
                  .from("email_logs")
                  .update({
                    status: "sent",
                    provider_message_id: resendData.id,
                    sent_at: new Date().toISOString(),
                  })
                  .eq("id", emailLogId);
              }
              console.log("Invitation email sent successfully:", { to: invitedEmail, resendId: resendData.id });
            }
          }
        }
      }
    } catch (emailErr) {
      emailError = String(emailErr);
      console.error("Email send threw:", emailErr);
      if (emailLogId) {
        await supabaseAdmin
          .from("email_logs")
          .update({
            status: "failed",
            error_message: emailError,
          })
          .eq("id", emailLogId)
          .catch(() => {});
      }
    }

    try {
      await supabaseAdmin.rpc("log_user_management_action", {
        p_actor_user_id: user.id,
        p_event_type: "member_invited",
        p_description: "Benutzer eingeladen",
        p_target_email: invitedEmail,
        p_changes: { role: invitation.role, email: invitedEmail },
      });
    } catch (auditErr) {
      console.error("Audit log failed:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        emailError,
        invitation: {
          id: invitation.id,
          email: invitation.invited_email,
          status: invitation.status,
          expires_at: invitation.expires_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("invite-account-member error:", err);
    return new Response(
      JSON.stringify({ error: "Ein unerwarteter Fehler ist aufgetreten", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
