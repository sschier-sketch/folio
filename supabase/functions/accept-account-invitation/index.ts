import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token ist erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: invitation, error: lookupError } = await supabaseAdmin
      .from("account_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (lookupError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Einladung nicht gefunden" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status === "accepted") {
      return new Response(
        JSON.stringify({
          error: "Diese Einladung wurde bereits angenommen",
          status: "accepted",
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status === "revoked") {
      return new Response(
        JSON.stringify({
          error: "Diese Einladung wurde widerrufen",
          status: "revoked",
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status === "expired" || new Date(invitation.expires_at) <= new Date()) {
      if (invitation.status !== "expired") {
        await supabaseAdmin
          .from("account_invitations")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", invitation.id);
      }
      return new Response(
        JSON.stringify({
          error: "Diese Einladung ist abgelaufen",
          status: "expired",
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ownerProfile } = await supabaseAdmin
      .from("account_profiles")
      .select("first_name, last_name, company_name")
      .eq("user_id", invitation.account_owner_id)
      .maybeSingle();

    const ownerName =
      [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(" ") ||
      ownerProfile?.company_name ||
      "rentably Nutzer";

    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      member: "Mitglied",
      viewer: "Betrachter",
    };

    return new Response(
      JSON.stringify({
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.invited_email,
          role: invitation.role,
          role_label: roleLabels[invitation.role] || invitation.role,
          owner_name: ownerName,
          expires_at: invitation.expires_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("accept-account-invitation error:", err);
    return new Response(
      JSON.stringify({ error: "Ein unerwarteter Fehler ist aufgetreten" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
