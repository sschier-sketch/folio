import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

let stripe: Stripe | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(stripeSecret, {
      appInfo: { name: 'Bolt Integration', version: '1.0.0' },
    });
  }
  return stripe;
}

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }
  return supabase;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return Response.json(
        { error: 'Webhook secret not configured' },
        { status: 500, headers: corsHeaders },
      );
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400, headers: corsHeaders });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await getStripe().webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(
        `Webhook signature verification failed: ${error.message}`,
        { status: 400, headers: corsHeaders },
      );
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  const invoiceArchiveEvents = [
    'invoice.finalized',
    'invoice.paid',
    'invoice.payment_failed',
    'invoice.voided',
    'invoice.updated',
  ];

  if (invoiceArchiveEvents.includes(event.type)) {
    await upsertInvoiceArchive(event.data.object as Stripe.Invoice);
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
        const { error: orderError } = await getSupabase().from('stripe_orders').insert({
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
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await getSupabase().from('stripe_subscriptions').upsert(
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
    const { error: subError } = await getSupabase().from('stripe_subscriptions').upsert(
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

    const { data: directMatch, error: findError } = await getSupabase()
      .from('billing_info')
      .select('user_id, subscription_plan, pro_activated_at')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding billing info by stripe_customer_id:', findError);
    }

    billingData = directMatch;

    if (!billingData) {
      const { data: stripeCustomer, error: scError } = await getSupabase()
        .from('stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (scError) {
        console.error('Error looking up stripe_customers:', scError);
      }

      if (stripeCustomer) {
        const { data: billingByUser, error: biError } = await getSupabase()
          .from('billing_info')
          .select('user_id, subscription_plan, pro_activated_at')
          .eq('user_id', stripeCustomer.user_id)
          .maybeSingle();

        if (biError) {
          console.error('Error looking up billing_info by user_id:', biError);
        }

        if (billingByUser) {
          billingData = billingByUser;
          const { error: backfillError } = await getSupabase()
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

    const { error: updateError } = await getSupabase()
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

    const { data: referral } = await getSupabase()
      .from('affiliate_referrals')
      .select('id, affiliate_id, status')
      .eq('customer_id', invoice.customer)
      .maybeSingle();

    if (!referral) {
      console.log(`No referral found for customer ${invoice.customer}`);
      return;
    }

    if (referral.status !== 'paying') {
      await getSupabase()
        .from('affiliate_referrals')
        .update({
          status: 'paying',
          first_payment_at: new Date().toISOString(),
          last_payment_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);
    } else {
      await getSupabase()
        .from('affiliate_referrals')
        .update({
          last_payment_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', referral.id);
    }

    const { data: existingCommission } = await getSupabase()
      .from('affiliate_commissions')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existingCommission) {
      console.log(`Commission already processed for event ${event.id}`);
      return;
    }

    const { data: affiliate } = await getSupabase()
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

    const { error: commissionError } = await getSupabase()
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

    const { error: updateLifetimeError } = await getSupabase()
      .from('affiliate_referrals')
      .update({
        lifetime_value: getSupabase().rpc('increment', { x: amountTotal }),
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

    const { data: commission } = await getSupabase()
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

    await getSupabase()
      .from('affiliate_commissions')
      .update({
        status: 'reversed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', commission.id);

    const refundEventId = `refund_${event.id}`;
    const { data: existingReversal } = await getSupabase()
      .from('affiliate_commissions')
      .select('id')
      .eq('stripe_event_id', refundEventId)
      .maybeSingle();

    if (!existingReversal) {
      await getSupabase()
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

async function upsertInvoiceArchive(invoice: Stripe.Invoice) {
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
    const createdAt = new Date(invoice.created * 1000).toISOString();
    const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null;
    const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null;

    const row = {
      stripe_invoice_id: invoice.id,
      stripe_customer_id: customerId,
      invoice_number: invoice.number ?? null,
      status: invoice.status ?? 'draft',
      currency: invoice.currency ?? 'eur',
      total: invoice.total ?? 0,
      tax: invoice.tax ?? null,
      subtotal: invoice.subtotal ?? null,
      created_at_stripe: createdAt,
      period_start: periodStart,
      period_end: periodEnd,
      customer_email: invoice.customer_email ?? null,
      customer_name: invoice.customer_name ?? null,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf_url: invoice.invoice_pdf ?? null,
      updated_at: new Date().toISOString(),
      raw: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: invoice.total,
        tax: invoice.tax,
        subtotal: invoice.subtotal,
        currency: invoice.currency,
        lines_count: invoice.lines?.data?.length ?? 0,
      },
    };

    const { error: upsertError } = await getSupabase()
      .from('stripe_invoices')
      .upsert(row, { onConflict: 'stripe_invoice_id' });

    if (upsertError) {
      console.error('Error upserting invoice archive:', upsertError);
      return;
    }

    console.log(`Archived invoice ${invoice.id} (status: ${invoice.status})`);

    if (invoice.invoice_pdf && ['open', 'paid', 'uncollectible', 'void'].includes(invoice.status ?? '')) {
      await cacheInvoicePdf(invoice);
    }
  } catch (err: any) {
    console.error('Error in upsertInvoiceArchive:', err.message);
  }
}

async function cacheInvoicePdf(invoice: Stripe.Invoice) {
  try {
    if (!invoice.invoice_pdf) return;

    const createdDate = new Date(invoice.created * 1000);
    const yyyy = createdDate.getFullYear().toString();
    const mm = String(createdDate.getMonth() + 1).padStart(2, '0');
    const safeName = (invoice.number ?? invoice.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `stripe/invoices/${yyyy}/${mm}/${invoice.id}_${safeName}.pdf`;

    const { data: existing } = await getSupabase()
      .from('stripe_invoices')
      .select('pdf_storage_path, pdf_cached_at, updated_at')
      .eq('stripe_invoice_id', invoice.id)
      .maybeSingle();

    if (existing?.pdf_storage_path && existing.pdf_cached_at) {
      const cachedAt = new Date(existing.pdf_cached_at).getTime();
      const updatedAt = new Date(existing.updated_at).getTime();
      if (cachedAt >= updatedAt) {
        console.log(`PDF already cached for ${invoice.id}`);
        return;
      }
    }

    const pdfResponse = await fetch(invoice.invoice_pdf);
    if (!pdfResponse.ok) {
      console.error(`Failed to download PDF for ${invoice.id}: ${pdfResponse.status}`);
      return;
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    const { error: uploadError } = await getSupabase().storage
      .from('billing')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload PDF for ${invoice.id}:`, uploadError);
      return;
    }

    await getSupabase()
      .from('stripe_invoices')
      .update({
        pdf_storage_path: storagePath,
        pdf_cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id);

    console.log(`Cached PDF for invoice ${invoice.id} at ${storagePath}`);
  } catch (err: any) {
    console.error(`Error caching PDF for ${invoice.id}:`, err.message);
  }
}

async function updateReferralCustomerId(customerId: string) {
  try {
    const { data: stripeCustomer } = await getSupabase()
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!stripeCustomer) {
      console.log(`No user found for customer ${customerId}`);
      return;
    }

    const { data: referral } = await getSupabase()
      .from('affiliate_referrals')
      .select('id, customer_id')
      .eq('referred_user_id', stripeCustomer.user_id)
      .maybeSingle();

    if (!referral) {
      console.log(`No referral found for user ${stripeCustomer.user_id}`);
      return;
    }

    if (!referral.customer_id) {
      await getSupabase()
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