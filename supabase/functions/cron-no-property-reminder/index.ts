import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DAYS_AFTER_SIGNUP = 17;
const SENDER_EMAIL = 'Yvonne von Rentably <yvonne@rentab.ly>';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cronRun } = await supabase
      .from('cron_runs')
      .insert({
        job_name: 'cron-no-property-reminder',
        status: 'running',
        metadata: { days_after_signup: DAYS_AFTER_SIGNUP },
      })
      .select('id')
      .single();

    const cronRunId = cronRun?.id;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - DAYS_AFTER_SIGNUP);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: candidates, error: candError } = await supabase
      .from('billing_info')
      .select('user_id, trial_ends_at, created_at')
      .eq('subscription_plan', 'free')
      .not('trial_ends_at', 'is', null)
      .gt('trial_ends_at', new Date().toISOString());

    if (candError) throw new Error(`Failed to query billing: ${candError.message}`);

    let processedCount = 0;
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const billing of (candidates || [])) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(billing.user_id);
        if (!authUser?.user?.email) continue;

        const createdAt = authUser.user.created_at;
        if (!createdAt) continue;

        const signupDate = new Date(createdAt).toISOString().split('T')[0];
        if (signupDate !== targetDateStr) continue;

        const { data: memberCheck } = await supabase
          .from('account_members')
          .select('id')
          .eq('member_user_id', billing.user_id)
          .limit(1);

        if (memberCheck && memberCheck.length > 0) continue;

        const { data: propertyCheck } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', billing.user_id)
          .limit(1);

        if (propertyCheck && propertyCheck.length > 0) continue;

        processedCount++;

        const userEmail = authUser.user.email;
        const todayStr = new Date().toISOString().split('T')[0];
        const idempotencyKey = `no_property_reminder:${billing.user_id}:${todayStr}`;

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            to: userEmail,
            templateKey: 'no_property_reminder',
            variables: {},
            userId: billing.user_id,
            mailType: 'no_property_reminder',
            category: 'informational',
            idempotencyKey,
            metadata: {
              cronRunId,
              signupDate,
              senderOverride: SENDER_EMAIL,
            },
            from: SENDER_EMAIL,
            replyTo: 'yvonne@rentab.ly',
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          failedCount++;
        } else if (emailData.skipped) {
          skippedCount++;
        } else {
          sentCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    if (cronRunId) {
      await supabase
        .from('cron_runs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          processed_count: processedCount,
          sent_count: sentCount,
          skipped_count: skippedCount,
          failed_count: failedCount,
        })
        .eq('id', cronRunId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'No-property reminder emails processed',
        cronRunId,
        processed: processedCount,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in no-property-reminder cron:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb
          .from('cron_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('job_name', 'cron-no-property-reminder')
          .eq('status', 'running');
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
