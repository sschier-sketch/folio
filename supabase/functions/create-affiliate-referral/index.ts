import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Cookie',
  'Access-Control-Allow-Credentials': 'true',
};

interface RequestBody {
  userId: string;
  affiliateCode?: string | null;
  refSid?: string | null;
  landingPath?: string | null;
  attributionSource?: string | null;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
  return match ? match[2] : null;
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

    const body: RequestBody = await req.json();
    const { userId, landingPath, attributionSource } = body;
    let { affiliateCode, refSid } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cookieHeader = req.headers.get('cookie');
    if (!refSid) {
      refSid = getCookieValue(cookieHeader, 'ref_sid');
    }

    let session = null;
    let finalAffiliateCode = affiliateCode?.toUpperCase() || null;

    if (refSid) {
      const { data: sessionData } = await supabase
        .from('referral_sessions')
        .select('*')
        .eq('ref_sid', refSid)
        .maybeSingle();

      if (sessionData) {
        session = sessionData;
        if (!finalAffiliateCode && sessionData.ref_code) {
          finalAffiliateCode = sessionData.ref_code;
        }
      }
    }

    if (!session && !finalAffiliateCode) {
      const forwarded = req.headers.get('x-forwarded-for');
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";
      const userAgent = req.headers.get('user-agent') || '';

      if (clientIp !== 'unknown' && userAgent) {
        const ipHash = await hashString(clientIp);
        const uaHash = await hashString(userAgent);

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: fallbackSession } = await supabase
          .from('referral_sessions')
          .select('*')
          .eq('ip_hash', ipHash)
          .eq('ua_hash', uaHash)
          .is('attributed_user_id', null)
          .gte('last_seen_at', oneHourAgo)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackSession) {
          session = fallbackSession;
          finalAffiliateCode = fallbackSession.ref_code;
          console.log(`[referral] Fallback attribution via IP/UA hash for user ${userId}`);
        }
      }
    }

    if (!finalAffiliateCode) {
      console.log(`[referral] No affiliate code found for user ${userId}`);
      return new Response(
        JSON.stringify({ error: 'No affiliate code provided or found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/^[A-Z0-9]{6,16}$/i.test(finalAffiliateCode)) {
      console.log(`[referral] Invalid ref code format: ${finalAffiliateCode}`);
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate code format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const normalizedCode = finalAffiliateCode.toUpperCase();

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

    if (landingPath || session?.landing_path) {
      insertData.landing_path = landingPath || session.landing_path;
    }
    if (attributionSource) {
      insertData.attribution_source = attributionSource;
    } else if (session) {
      insertData.attribution_source = 'session';
    }

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

    if (session) {
      await supabase
        .from('referral_sessions')
        .update({
          attributed_user_id: userId,
        })
        .eq('ref_sid', session.ref_sid);
    }

    await supabase
      .from('affiliates')
      .update({
        total_referrals: (affiliate.total_referrals || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    console.log(`[referral] OK: user=${userId}, code=${normalizedCode}, source=${attributionSource || session ? 'session' : 'unknown'}, landing=${landingPath || session?.landing_path || 'n/a'}`);

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
