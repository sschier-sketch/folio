import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ActivateRewardRequest {
  referredUserId: string;
  referralCode: string;
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

    const { referredUserId, referralCode } =
      (await req.json()) as ActivateRewardRequest;

    if (!referredUserId || !referralCode) {
      throw new Error("referredUserId and referralCode are required");
    }

    const { data: referrer, error: referrerError } = await supabaseClient
      .from("user_settings")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (referrerError || !referrer) {
      throw new Error("Invalid referral code");
    }

    const referrerId = referrer.user_id;

    const { data: existingReferral, error: checkError } =
      await supabaseClient
        .from("user_referrals")
        .select("id")
        .eq("referrer_id", referrerId)
        .eq("referred_user_id", referredUserId)
        .maybeSingle();

    if (checkError) {
      throw new Error("Error checking referral");
    }

    if (existingReferral) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Referral already processed",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: referral, error: referralError } = await supabaseClient
      .from("user_referrals")
      .insert({
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: "completed",
        reward_earned: true,
        completed_at: new Date().toISOString(),
        reward_months: 2,
        reward_activated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (referralError) {
      throw new Error("Failed to create referral record");
    }

    const { data: referrerSubscription } = await supabaseClient
      .from("user_subscriptions")
      .select("subscription_tier, subscription_end_date")
      .eq("user_id", referrerId)
      .maybeSingle();

    let rewardType = "pro_upgrade";
    let rewardDetails = "Sofort aktiviert für 2 Monate";
    let expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    if (referrerSubscription?.subscription_tier === "pro") {
      rewardType = "pro_extension";
      rewardDetails = "Wird am Ende deiner aktuellen Laufzeit aktiviert";

      if (referrerSubscription.subscription_end_date) {
        const currentEndDate = new Date(
          referrerSubscription.subscription_end_date,
        );
        expiresAt = new Date(currentEndDate);
        expiresAt.setMonth(expiresAt.getMonth() + 2);

        await supabaseClient
          .from("user_subscriptions")
          .update({
            subscription_end_date: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", referrerId);
      }
    } else {
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: referrerId,
          subscription_tier: "pro",
          subscription_status: "active",
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    await supabaseClient.from("referral_rewards").insert({
      user_id: referrerId,
      referral_id: referral.id,
      reward_type: rewardType,
      months_granted: 2,
      status: "active",
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    const { data: referrerSettings } = await supabaseClient
      .from("user_settings")
      .select("language")
      .eq("user_id", referrerId)
      .maybeSingle();

    const language = referrerSettings?.language || "de";

    const { data: template } = await supabaseClient
      .from("email_templates")
      .select("subject, body_html, body_text")
      .eq("template_key", "referral_reward_earned")
      .eq("language", language)
      .maybeSingle();

    if (template) {
      const { data: referrerUser } = await supabaseClient.auth.admin.getUserById(
        referrerId,
      );

      if (referrerUser?.user?.email) {
        const dashboardLink = `${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://app.")}/dashboard`;

        const emailBody = template.body_html
          .replace(/{{reward_details}}/g, rewardDetails)
          .replace(/{{dashboard_link}}/g, dashboardLink);

        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            to: referrerUser.user.email,
            subject: template.subject,
            html: emailBody,
            text: template.body_text
              .replace(/{{reward_details}}/g, rewardDetails)
              .replace(/{{dashboard_link}}/g, dashboardLink),
          }),
        });
      }
    }

    const { data: newUserSubscription } = await supabaseClient
      .from("user_subscriptions")
      .select("subscription_tier")
      .eq("user_id", referredUserId)
      .maybeSingle();

    if (
      !newUserSubscription ||
      newUserSubscription.subscription_tier === "basic"
    ) {
      const newUserExpiresAt = new Date();
      newUserExpiresAt.setMonth(newUserExpiresAt.getMonth() + 2);

      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: referredUserId,
          subscription_tier: "pro",
          subscription_status: "active",
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: newUserExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral reward activated successfully",
        rewardType,
        rewardDetails,
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
