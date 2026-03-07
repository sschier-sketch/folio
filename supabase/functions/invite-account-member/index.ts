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
        JSON.stringify({ error: "Benutzerverwaltung ist nur im Pro-Tarif verfügbar" }),
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
              error: "Diese E-Mail-Adresse gehört bereits zu einem eigenständigen Rentably-Account. " +
                "Ein bestehendes Konto kann nicht als Teammitglied hinzugefügt werden.",
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
      .from("account_invitations")
      .select("id, status, expires_at")
      .eq("account_owner_id", accountOwnerId)
      .eq("invited_email", invitedEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      if (new Date(existingInvitation.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({
            error: "Es gibt bereits eine aktive Einladung für diese E-Mail-Adresse",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("account_invitations")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", existingInvitation.id);
    }

    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("account_invitations")
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

    try {
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: invitedEmail,
            templateKey: "account_invitation",
            language,
            variables: {
              inviter_name: inviterName,
              invitee_email: invitedEmail,
              invitation_link: invitationLink,
              role: roleLabels[invitation.role] || invitation.role,
              expires_in: expiresFormatted,
            },
            userId: accountOwnerId,
            mailType: "account_invitation",
            category: "transactional",
            idempotencyKey: `account_invite:${invitation.id}`,
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        emailError = `send-email returned ${emailResponse.status}: ${errorText}`;
        console.error("Email send failed:", emailError);
      } else {
        emailSent = true;
      }
    } catch (emailErr) {
      emailError = String(emailErr);
      console.error("Email send threw:", emailErr);
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
