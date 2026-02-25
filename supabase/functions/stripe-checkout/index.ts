import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url, mode } = await req.json();

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      return corsResponse({ error }, 400);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);

      return corsResponse({ error: 'Failed to fetch customer information' }, 500);
    }

    let customerId;

    /**
     * In case we don't have a mapping yet, the customer does not exist and we need to create one.
     */
    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);

        // Try to clean up both the Stripe customer and subscription record
        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to clean up after customer mapping error:', deleteError);
        }

        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: newCustomer.id,
          status: 'not_started',
        });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);

          // Try to clean up the Stripe customer since we couldn't create the subscription
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
          }

          return corsResponse({ error: 'Unable to save the subscription in the database' }, 500);
        }
      }

      customerId = newCustomer.id;

      await supabase
        .from('billing_info')
        .update({ stripe_customer_id: newCustomer.id, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      console.log(`Successfully set up new customer ${customerId} with subscription record`);
    } else {
      customerId = customer.customer_id;

      const { data: existingBilling } = await supabase
        .from('billing_info')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBilling && !existingBilling.stripe_customer_id) {
        await supabase
          .from('billing_info')
          .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        console.log(`Backfilled stripe_customer_id in billing_info for user ${user.id}`);
      }

      // Verify the customer exists in Stripe
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(`Customer ${customerId} no longer exists in Stripe, creating new customer`);

          // Create new customer in Stripe
          const newCustomer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: user.id,
            },
          });

          // Update database with new customer ID
          const { error: updateCustomerError } = await supabase
            .from('stripe_customers')
            .update({ customer_id: newCustomer.id })
            .eq('user_id', user.id);

          if (updateCustomerError) {
            console.error('Failed to update customer information in the database', updateCustomerError);
            return corsResponse({ error: 'Failed to update customer mapping' }, 500);
          }

          customerId = newCustomer.id;
          console.log(`Created replacement Stripe customer ${customerId} for user ${user.id}`);
        } else {
          throw error;
        }
      }

      if (mode === 'subscription') {
        // Check for any subscription record (including soft deleted ones)
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status, deleted_at')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);

          return corsResponse({ error: 'Failed to fetch subscription information' }, 500);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);

            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500);
          }

          console.log(`Created subscription record for existing customer ${customerId}`);
        } else if (subscription.deleted_at || subscription.status === 'canceled') {
          // If subscription was deleted or canceled, restore/reset it
          console.log(`Restoring subscription for customer ${customerId} (was ${subscription.status})`);
          const { error: updateSubscriptionError } = await supabase
            .from('stripe_subscriptions')
            .update({
              status: 'not_started',
              subscription_id: null,
              price_id: null,
              current_period_start: null,
              current_period_end: null,
              cancel_at_period_end: false,
              deleted_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('customer_id', customerId);

          if (updateSubscriptionError) {
            console.error('Failed to restore subscription', updateSubscriptionError);
            return corsResponse({ error: 'Failed to restore subscription' }, 500);
          }
        } else {
          // Subscription exists and is active/pending - this is fine, continue to checkout
          console.log(`Subscription already exists for customer ${customerId} with status ${subscription.status}`);
        }
      }
    }

    // --- Stripe Tax: ensure customer has a country for tax calculation ---
    // Priority: 1) account_profiles.address_country  2) existing Stripe customer  3) fallback "DE"
    // - Customer without country -> Stripe Customer gets country "DE"
    // - DE customer -> MwSt (VAT) will be shown on invoice
    // - EU customer with VAT-ID -> Reverse Charge (0%) + VAT-ID stored
    const countryNameToIso: Record<string, string> = {
      'deutschland': 'DE', 'germany': 'DE',
      'österreich': 'AT', 'austria': 'AT',
      'schweiz': 'CH', 'switzerland': 'CH',
      'frankreich': 'FR', 'france': 'FR',
      'italien': 'IT', 'italy': 'IT',
      'spanien': 'ES', 'spain': 'ES',
      'niederlande': 'NL', 'netherlands': 'NL',
      'belgien': 'BE', 'belgium': 'BE',
      'polen': 'PL', 'poland': 'PL',
      'tschechien': 'CZ', 'czech republic': 'CZ', 'czechia': 'CZ',
      'dänemark': 'DK', 'denmark': 'DK',
      'schweden': 'SE', 'sweden': 'SE',
      'finnland': 'FI', 'finland': 'FI',
      'portugal': 'PT',
      'irland': 'IE', 'ireland': 'IE',
      'griechenland': 'GR', 'greece': 'GR',
      'ungarn': 'HU', 'hungary': 'HU',
      'rumänien': 'RO', 'romania': 'RO',
      'bulgarien': 'BG', 'bulgaria': 'BG',
      'kroatien': 'HR', 'croatia': 'HR',
      'slowakei': 'SK', 'slovakia': 'SK',
      'slowenien': 'SI', 'slovenia': 'SI',
      'litauen': 'LT', 'lithuania': 'LT',
      'lettland': 'LV', 'latvia': 'LV',
      'estland': 'EE', 'estonia': 'EE',
      'luxemburg': 'LU', 'luxembourg': 'LU',
      'malta': 'MT',
      'zypern': 'CY', 'cyprus': 'CY',
    };

    function resolveCountryIso(raw: string | null | undefined): string | null {
      if (!raw) return null;
      const trimmed = raw.trim();
      if (trimmed.length === 2 && /^[A-Z]{2}$/.test(trimmed)) return trimmed;
      if (trimmed.length === 2) return trimmed.toUpperCase();
      return countryNameToIso[trimmed.toLowerCase()] ?? null;
    }

    let customerCountryIso: string | null = null;

    // 1) Try account_profiles
    const { data: profile } = await supabase
      .from('account_profiles')
      .select('address_country')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.address_country) {
      customerCountryIso = resolveCountryIso(profile.address_country);
    }

    // 2) Try existing Stripe customer address
    if (!customerCountryIso) {
      try {
        const stripeCustomer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (stripeCustomer.address?.country) {
          customerCountryIso = stripeCustomer.address.country;
        }
      } catch (_) { /* ignore – customer was already verified above */ }
    }

    // 3) Fallback: Germany
    if (!customerCountryIso) {
      customerCountryIso = 'DE';
      console.log(`No country found for customer ${customerId}, using fallback "DE"`);
    }

    // Update Stripe customer with country so Stripe Tax can calculate correctly
    try {
      await stripe.customers.update(customerId, {
        address: { country: customerCountryIso },
      });
    } catch (updateErr: any) {
      console.warn(`Could not update customer country: ${updateErr.message}`);
    }

    // create Checkout Session
    console.log(`Creating checkout session for customer ${customerId} with price ${price_id} in ${mode} mode (country: ${customerCountryIso})`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`, error);
    console.error('Error details:', {
      code: error.code,
      type: error.type,
      statusCode: error.statusCode,
      raw: error.raw,
    });

    let errorMessage = error.message;
    let errorDetails: any = {
      code: error.code,
      type: error.type,
    };

    if (error.code === 'resource_missing') {
      errorMessage = `Die Price ID wurde in Ihrem Stripe Account nicht gefunden. Verwendete Price ID: ${price_id}`;
      errorDetails.priceId = price_id;
      errorDetails.suggestion = 'Bitte prüfen Sie, ob Sie Live oder Test Keys verwenden und ob die Price IDs übereinstimmen.';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe Fehler: ${error.message}`;
      errorDetails.raw_message = error.raw?.message;
    }

    return corsResponse({ error: errorMessage, details: errorDetails }, 500);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}
