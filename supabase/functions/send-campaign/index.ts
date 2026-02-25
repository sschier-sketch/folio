import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AudienceFilter {
  plan?: "all" | "free" | "pro" | "trial";
  has_newsletter?: boolean;
  registered_before?: string;
  registered_after?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaignId } = await req.json();

    const { data: campaign, error: campError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();

    if (campError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Kampagne nicht gefunden" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (campaign.status !== "draft") {
      return new Response(
        JSON.stringify({ error: "Kampagne wurde bereits gesendet" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase
      .from("email_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaignId);

    const { data: usersData, error: usersError } = await supabase.rpc(
      "admin_get_users"
    );

    if (usersError) {
      throw new Error(`Failed to load users: ${usersError.message}`);
    }

    const allUsers = (usersData || []) as any[];
    const filter: AudienceFilter = campaign.audience_filter || {};

    const recipients = allUsers.filter((u: any) => {
      if (filter.has_newsletter && !u.newsletter_opt_in) return false;

      if (filter.plan && filter.plan !== "all") {
        const hasTrial =
          u.trial_ends_at && new Date(u.trial_ends_at) > new Date();
        if (filter.plan === "pro" && u.subscription_plan !== "pro") return false;
        if (filter.plan === "free" && (u.subscription_plan === "pro" || hasTrial))
          return false;
        if (filter.plan === "trial" && !hasTrial) return false;
      }

      if (
        filter.registered_after &&
        new Date(u.created_at) < new Date(filter.registered_after)
      )
        return false;
      if (
        filter.registered_before &&
        new Date(u.created_at) > new Date(filter.registered_before)
      )
        return false;

      return true;
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const idempotencyKey = `campaign_${campaignId}_${recipient.id}`;

        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              to: recipient.email,
              subject: campaign.subject,
              html: campaign.body_html,
              text: campaign.body_text,
              userId: recipient.id,
              mailType: `campaign_${campaignId}`,
              category: "informational",
              idempotencyKey,
              metadata: {
                campaignId,
                campaignName: campaign.name,
              },
            }),
          }
        );

        const emailResult = await emailResponse.json();

        if (emailResponse.ok && !emailResult.error) {
          sentCount++;
        } else {
          console.error(
            `Failed to send to ${recipient.email}:`,
            emailResult.error
          );
          failedCount++;
        }
      } catch (err) {
        console.error(`Error sending to ${recipient.email}:`, err);
        failedCount++;
      }
    }

    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_recipients: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        total: recipients.length,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-campaign:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unbekannter Fehler",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
