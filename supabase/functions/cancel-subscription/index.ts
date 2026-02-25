import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: customerData } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customerData?.customer_id) {
      const { data: billingData } = await supabase
        .from("billing_info")
        .select("subscription_plan, subscription_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (billingData?.subscription_plan === "pro") {
        await supabase
          .from("billing_info")
          .update({
            subscription_plan: "free",
            subscription_status: "canceled",
            subscription_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscription cancelled successfully",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      throw new Error("No active subscription found");
    }

    const { data: subscriptionData } = await supabase
      .from("stripe_subscriptions")
      .select("subscription_id")
      .eq("customer_id", customerData.customer_id)
      .maybeSingle();

    if (!subscriptionData?.subscription_id) {
      await supabase
        .from("billing_info")
        .update({
          subscription_plan: "free",
          subscription_status: "canceled",
          subscription_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription cancelled successfully",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const subscriptionId = subscriptionData.subscription_id;

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "cancel_at_period_end=true",
      }
    );

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(
        `Stripe API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const subscription = await stripeResponse.json();

    const periodEndDate = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase
      .from("stripe_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", customerData.customer_id);

    await supabase
      .from("billing_info")
      .update({
        subscription_ends_at: periodEndDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    try {
      const { data: profile } = await supabase
        .from("account_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email;
      const endDateFormatted = new Date(subscription.current_period_end * 1000).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: user.email,
          templateKey: "subscription_cancelled",
          variables: { user_name: userName, end_date: endDateFormatted },
          userId: user.id,
          idempotencyKey: `subscription_cancelled_${user.id}_${Date.now()}`,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send subscription_cancelled email:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription will be cancelled at period end",
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
