import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  appInfo: {
    name: "Bolt Integration",
    version: "1.0.0",
  },
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: adminUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !adminUser) {
      throw new Error("Unauthorized");
    }

    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", adminUser.id)
      .maybeSingle();

    if (!adminCheck) {
      throw new Error("Admin access required");
    }

    const { userId, reason } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    const { data: customer } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!customer?.customer_id) {
      throw new Error("Kein Stripe-Kunde fuer diesen Benutzer gefunden");
    }

    const charges = await stripe.charges.list({
      customer: customer.customer_id,
      limit: 1,
    });

    if (charges.data.length === 0) {
      throw new Error("Keine Zahlungen fuer diesen Kunden gefunden");
    }

    const latestCharge = charges.data[0];

    if (latestCharge.refunded) {
      throw new Error("Letzte Zahlung wurde bereits erstattet");
    }

    const refund = await stripe.refunds.create({
      charge: latestCharge.id,
      reason: "requested_by_customer",
    });

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.cancel(subscriptions.data[0].id);
    }

    await supabase
      .from("billing_info")
      .update({
        subscription_plan: "free",
        subscription_status: "canceled",
        subscription_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    await supabase
      .from("stripe_subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_id", customer.customer_id);

    await supabase.from("admin_activity_log").insert({
      admin_user_id: adminUser.id,
      action: "refund_subscription",
      target_user_id: userId,
      details: {
        refund_id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        charge_id: latestCharge.id,
        reason: reason || "Admin refund",
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Admin refund error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
