import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  userId: string;
  affiliateCode: string;
  landingPath?: string | null;
  attributionSource?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { userId, affiliateCode, landingPath, attributionSource }: RequestBody = await req.json();

    if (!userId || !affiliateCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/^[A-Z0-9]{6,16}$/i.test(affiliateCode)) {
      console.log(`[referral] Invalid ref code format: ${affiliateCode}`);
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate code format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const normalizedCode = affiliateCode.toUpperCase();

    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, user_id, status, is_blocked, total_referrals')
      .eq('affiliate_code', normalizedCode)
      .maybeSingle();

    if (affiliateError || !affiliate) {
      console.log(`[referral] Code not found: ${normalizedCode}, source=${attributionSource || 'unknown'}`);
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (affiliate.is_blocked || affiliate.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Affiliate is not active' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (affiliate.user_id === userId) {
      return new Response(
        JSON.stringify({ error: 'Self-referral not allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingReferral } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .maybeSingle();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ error: 'User already has a referrer' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const insertData: Record<string, unknown> = {
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      status: 'registered',
    };

    if (landingPath) insertData.landing_path = landingPath;
    if (attributionSource) insertData.attribution_source = attributionSource;

    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert(insertData)
      .select()
      .single();

    if (referralError) {
      console.error('[referral] Insert error:', referralError);
      return new Response(
        JSON.stringify({ error: 'Failed to create referral' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('affiliates')
      .update({
        total_referrals: (affiliate.total_referrals || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    console.log(`[referral] OK: user=${userId}, code=${normalizedCode}, source=${attributionSource || 'unknown'}, landing=${landingPath || 'n/a'}`);

    return new Response(
      JSON.stringify({ success: true, referral }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[referral] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
