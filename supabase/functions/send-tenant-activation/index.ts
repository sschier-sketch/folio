import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ActivationRequest {
  tenantId: string;
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { tenantId, userId }: ActivationRequest = await req.json();

    console.log("Processing activation request:", { tenantId, userId });

    if (!tenantId || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: tenantId and userId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("first_name, last_name, email")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error("Error fetching tenant:", tenantError);
      return new Response(
        JSON.stringify({
          error: "Error fetching tenant data",
          details: tenantError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!tenant) {
      console.error("Tenant not found:", tenantId);
      return new Response(
        JSON.stringify({
          error: "Tenant not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!tenant.email) {
      return new Response(
        JSON.stringify({
          error: "Tenant has no email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      console.error("Error fetching landlord:", authError);
      return new Response(
        JSON.stringify({
          error: "Landlord not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const landlordEmail = authUser.user.email || '';

    const { data: profile } = await supabase
      .from("account_profiles")
      .select("first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    const origin = req.headers.get("origin") || "https://rentab.ly";
    const portalLink = `${origin}/tenant-portal/${userId}`;

    const landlordName = profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : landlordEmail;

    const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
    const emailResponse = await fetch(sendEmailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: tenant.email,
        templateKey: "tenant_portal_activation",
        variables: {
          tenant_name: `${tenant.first_name} ${tenant.last_name}`,
          tenant_email: tenant.email,
          portal_link: portalLink,
          landlord_name: landlordName,
          landlord_email: landlordEmail,
        },
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", {
        status: emailResponse.status,
        data: emailData,
      });
      return new Response(
        JSON.stringify({
          error: "Failed to send activation email",
          status: emailResponse.status,
          details: emailData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Tenant activation email sent successfully:", {
      tenantId,
      email: tenant.email,
      portalLink,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Activation email sent successfully",
        recipient: tenant.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending tenant activation email:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Failed to send activation email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});