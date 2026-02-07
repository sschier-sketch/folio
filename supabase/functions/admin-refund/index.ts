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

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user: adminUser },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !adminUser) throw new Error("Unauthorized");

  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", adminUser.id)
    .maybeSingle();

  if (!adminCheck) throw new Error("Admin access required");

  return adminUser;
}

async function getRefundPreview(userId: string) {
  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!customer?.customer_id) {
    throw new Error("Kein Stripe-Kunde fuer diesen Benutzer gefunden");
  }

  const { data: localSub } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("customer_id", customer.customer_id)
    .maybeSingle();

  const charges = await stripe.charges.list({
    customer: customer.customer_id,
    limit: 1,
  });

  if (charges.data.length === 0) {
    throw new Error("Keine Zahlungen fuer diesen Kunden gefunden");
  }

  const latestCharge = charges.data[0];

  let subscription = null;
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.customer_id,
    status: "active",
    limit: 1,
  });
  if (subscriptions.data.length > 0) {
    subscription = subscriptions.data[0];
  }

  return {
    customerId: customer.customer_id,
    charge: {
      id: latestCharge.id,
      amount: latestCharge.amount / 100,
      currency: latestCharge.currency,
      created: latestCharge.created,
      refunded: latestCharge.refunded,
      description: latestCharge.description,
    },
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          planAmount: subscription.items.data[0]?.price?.unit_amount
            ? subscription.items.data[0].price.unit_amount / 100
            : null,
          planInterval: subscription.items.data[0]?.price?.recurring?.interval,
          planCurrency: subscription.items.data[0]?.price?.currency,
        }
      : null,
    paymentMethod: localSub
      ? {
          brand: localSub.payment_method_brand,
          last4: localSub.payment_method_last4,
        }
      : null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminUser = await verifyAdmin(req);
    const { userId, reason, preview, cancelImmediately } = await req.json();

    if (!userId) throw new Error("userId is required");

    if (preview) {
      const previewData = await getRefundPreview(userId);
      return new Response(JSON.stringify(previewData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previewData = await getRefundPreview(userId);

    if (previewData.charge.refunded) {
      throw new Error("Letzte Zahlung wurde bereits erstattet");
    }

    const refund = await stripe.refunds.create({
      charge: previewData.charge.id,
      reason: "requested_by_customer",
    });

    if (previewData.subscription) {
      if (cancelImmediately === false) {
        await stripe.subscriptions.update(previewData.subscription.id, {
          cancel_at_period_end: true,
        });

        const periodEnd = new Date(
          previewData.subscription.currentPeriodEnd * 1000
        ).toISOString();

        await supabase
          .from("billing_info")
          .update({
            subscription_ends_at: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        await supabase
          .from("stripe_subscriptions")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("customer_id", previewData.customerId);
      } else {
        await stripe.subscriptions.cancel(previewData.subscription.id);

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
          .eq("customer_id", previewData.customerId);
      }
    }

    await supabase.from("admin_activity_log").insert({
      admin_user_id: adminUser.id,
      action: "refund_subscription",
      target_user_id: userId,
      details: {
        refund_id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        charge_id: previewData.charge.id,
        reason: reason || "Admin refund",
        cancel_immediately: cancelImmediately !== false,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        cancelledImmediately: cancelImmediately !== false,
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
