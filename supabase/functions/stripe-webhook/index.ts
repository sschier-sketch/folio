import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (event.type === 'invoice.paid') {
    await handleInvoicePaid(event);
    return;
  }

  if (event.type === 'charge.refunded') {
    await handleChargeRefunded(event);
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
      await updateReferralCustomerId(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed', // assuming we want to mark it as completed since payment is successful
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }

      // Update billing_info to free plan when no subscriptions
      await updateBillingInfo(customerId, 'free', 'inactive');
      return;
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    const plan = ['active', 'trialing'].includes(subscription.status) ? 'pro' : 'free';
    const status = ['active', 'trialing'].includes(subscription.status) ? 'active' : 'inactive';
    const subscriptionEndsAt = subscription.cancel_at_period_end && subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
    await updateBillingInfo(customerId, plan, status, subscriptionEndsAt);

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

async function updateBillingInfo(customerId: string, plan: string, status: string, subscriptionEndsAt: string | null = null) {
  try {
    let billingData: { user_id: string; subscription_plan: string | null; pro_activated_at: string | null } | null = null;

    const { data: directMatch, error: findError } = await supabase
      .from('billing_info')
      .select('user_id, subscription_plan, pro_activated_at')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding billing info by stripe_customer_id:', findError);
    }

    billingData = directMatch;

    if (!billingData) {
      const { data: stripeCustomer, error: scError } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (scError) {
        console.error('Error looking up stripe_customers:', scError);
      }

      if (stripeCustomer) {
        const { data: billingByUser, error: biError } = await supabase
          .from('billing_info')
          .select('user_id, subscription_plan, pro_activated_at')
          .eq('user_id', stripeCustomer.user_id)
          .maybeSingle();

        if (biError) {
          console.error('Error looking up billing_info by user_id:', biError);
        }

        if (billingByUser) {
          billingData = billingByUser;
          const { error: backfillError } = await supabase
            .from('billing_info')
            .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
            .eq('user_id', stripeCustomer.user_id);
          if (backfillError) {
            console.error('Error backfilling stripe_customer_id:', backfillError);
          } else {
            console.info(`Backfilled stripe_customer_id in billing_info for user ${stripeCustomer.user_id}`);
          }
        }
      }
    }

    if (!billingData) {
      console.warn(`No billing info found for customer: ${customerId}`);
      return;
    }

    const updateData: any = {
      subscription_plan: plan,
      subscription_status: status,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    };

    if (subscriptionEndsAt !== undefined) {
      updateData.subscription_ends_at = subscriptionEndsAt;
    }

    if (plan === 'pro' && status === 'active' && !billingData.pro_activated_at) {
      updateData.pro_activated_at = new Date().toISOString();
      console.info(`Setting pro_activated_at for customer ${customerId}`);
    }

    if (plan === 'pro' && status === 'active') {
      updateData.trial_started_at = null;
      updateData.trial_ends_at = null;
    }

    const { error: updateError } = await supabase
      .from('billing_info')
      .update(updateData)
      .eq('user_id', billingData.user_id);

    if (updateError) {
      console.error('Error updating billing info:', updateError);
      throw new Error('Failed to update billing info');
    }

    console.info(`Updated billing info for customer ${customerId}: plan=${plan}, status=${status}, ends_at=${subscriptionEndsAt}`);
  } catch (error) {
    console.error(`Failed to update billing info for customer ${customerId}:`, error);
    throw error;
  }
}

async function handleInvoicePaid(event: Stripe.Event) {
  try {
    const invoice = event.data.object as Stripe.Invoice;

    if (!invoice.customer || typeof invoice.customer !== 'string') {
      console.error('No customer ID in invoice');
      return;
    }

    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      console.log('Invoice is not for a subscription, skipping commission');
      return;
    }

    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('id, affiliate_id, status')
      .eq('customer_id', invoice.customer)
      .maybeSingle();

    if (!referral) {
      console.log(`No referral found for customer ${invoice.customer}`);
      return;
    }

    if (referral.status !== 'paying') {
      await supabase
        .from('affiliate_referrals')
        .update({
          status: 'paying',
          first_payment_at: new Date().toISOString(),
          last_payment_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);
    } else {
      await supabase
        .from('affiliate_referrals')
        .update({
          last_payment_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);
    }

    const { data: existingCommission } = await supabase
      .from('affiliate_commissions')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existingCommission) {
      console.log(`Commission already processed for event ${event.id}`);
      return;
    }

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, commission_rate, is_blocked')
      .eq('id', referral.affiliate_id)
      .maybeSingle();

    if (!affiliate || affiliate.is_blocked) {
      console.log(`Affiliate ${referral.affiliate_id} is blocked or not found`);
      return;
    }

    const amountTotal = invoice.total / 100;
    const amountNet = invoice.subtotal / 100;
    const commissionAmount = amountNet * affiliate.commission_rate;
    const holdPeriodDays = 14;
    const holdUntil = new Date();
    holdUntil.setDate(holdUntil.getDate() + holdPeriodDays);

    const { error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        subscription_id: invoice.subscription,
        invoice_id: invoice.id,
        stripe_event_id: event.id,
        amount_total: amountTotal,
        amount_net: amountNet,
        commission_rate: affiliate.commission_rate,
        commission_amount: commissionAmount,
        status: 'pending',
        hold_until: holdUntil.toISOString(),
      });

    if (commissionError) {
      console.error('Error creating commission:', commissionError);
      return;
    }

    const { error: updateLifetimeError } = await supabase
      .from('affiliate_referrals')
      .update({
        lifetime_value: supabase.rpc('increment', { x: amountTotal }),
      })
      .eq('id', referral.id);

    if (updateLifetimeError) {
      console.error('Error updating lifetime value:', updateLifetimeError);
    }

    console.log(`Created commission of ${commissionAmount} EUR for affiliate ${affiliate.id}`);
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
  }
}

async function handleChargeRefunded(event: Stripe.Event) {
  try {
    const charge = event.data.object as Stripe.Charge;

    if (!charge.invoice || typeof charge.invoice !== 'string') {
      console.log('Refund is not for an invoice, skipping');
      return;
    }

    const { data: commission } = await supabase
      .from('affiliate_commissions')
      .select('id, commission_amount, status, affiliate_id, referral_id')
      .eq('invoice_id', charge.invoice)
      .maybeSingle();

    if (!commission) {
      console.log(`No commission found for invoice ${charge.invoice}`);
      return;
    }

    if (commission.status === 'reversed') {
      console.log('Commission already reversed');
      return;
    }

    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'reversed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', commission.id);

    const refundEventId = `refund_${event.id}`;
    const { data: existingReversal } = await supabase
      .from('affiliate_commissions')
      .select('id')
      .eq('stripe_event_id', refundEventId)
      .maybeSingle();

    if (!existingReversal) {
      await supabase
        .from('affiliate_commissions')
        .insert({
          affiliate_id: commission.affiliate_id,
          referral_id: commission.referral_id,
          invoice_id: charge.invoice,
          stripe_event_id: refundEventId,
          amount_total: -(charge.amount_refunded / 100),
          amount_net: -(charge.amount_refunded / 100),
          commission_rate: 0,
          commission_amount: -commission.commission_amount,
          status: 'reversed',
          hold_until: new Date().toISOString(),
        });
    }

    console.log(`Reversed commission for invoice ${charge.invoice}`);
  } catch (error) {
    console.error('Error handling charge.refunded:', error);
  }
}

async function updateReferralCustomerId(customerId: string) {
  try {
    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!stripeCustomer) {
      console.log(`No user found for customer ${customerId}`);
      return;
    }

    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('id, customer_id')
      .eq('referred_user_id', stripeCustomer.user_id)
      .maybeSingle();

    if (!referral) {
      console.log(`No referral found for user ${stripeCustomer.user_id}`);
      return;
    }

    if (!referral.customer_id) {
      await supabase
        .from('affiliate_referrals')
        .update({
          customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      console.log(`Updated referral ${referral.id} with customer_id ${customerId}`);
    }
  } catch (error) {
    console.error('Error updating referral customer_id:', error);
  }
}