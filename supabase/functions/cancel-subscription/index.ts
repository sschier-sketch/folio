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

    const { data: stripeData, error: stripeError } = await supabase
      .from("stripe_user_subscriptions")
      .select("subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (stripeError) {
      throw new Error("Error fetching subscription: " + stripeError.message);
    }

    if (!stripeData?.subscription_id) {
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
            subscription_status: "active",
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

    const subscriptionId = stripeData.subscription_id;

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

    await supabase
      .from("stripe_user_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

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
