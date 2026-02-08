import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Cron-Secret',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Verify cron secret
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      console.error('Invalid or missing cron secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get TRIAL_ENDING_DAYS from env (default: 7)
    const TRIAL_ENDING_DAYS = parseInt(Deno.env.get('TRIAL_ENDING_DAYS') || '7');
    const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://rentab.ly';

    console.log(`Starting trial-ending cron job (${TRIAL_ENDING_DAYS} days before expiry)`);

    // Create cron run log
    const { data: cronRun, error: cronError } = await supabase
      .from('cron_runs')
      .insert({
        job_name: 'cron-trial-ending',
        status: 'running',
        metadata: { days_before: TRIAL_ENDING_DAYS },
      })
      .select('id')
      .single();

    if (cronError) {
      throw new Error(`Failed to create cron run log: ${cronError.message}`);
    }

    const cronRunId = cronRun.id;

    // Calculate target date: now + TRIAL_ENDING_DAYS days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + TRIAL_ENDING_DAYS);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Find users whose trial ends on target date and haven't received ending email yet
    const { data: users, error: usersError } = await supabase
      .from('billing_info')
      .select('user_id, trial_ends_at')
      .eq('subscription_plan', 'free')
      .not('trial_ends_at', 'is', null)
      .gte('trial_ends_at', targetDateStr + ' 00:00:00')
      .lte('trial_ends_at', targetDateStr + ' 23:59:59');

    if (usersError) {
      throw new Error(`Failed to query users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with trial ending on ${targetDateStr}`);

    let processedCount = 0;
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    if (users && users.length > 0) {
      for (const billing of users) {
        try {
          processedCount++;

          // Get user email
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
            billing.user_id
          );

          if (authError || !authUser?.user?.email) {
            console.error(`User email not found for ${billing.user_id}`);
            failedCount++;
            continue;
          }

          const userEmail = authUser.user.email;
          const trialEndsAt = new Date(billing.trial_ends_at);
          const formattedDate = trialEndsAt.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });

          // Idempotency key: userId + trial_ends_at date
          const idempotencyKey = `trial_ending:${billing.user_id}:${targetDateStr}`;

          const upgradeLink = `${APP_BASE_URL}/dashboard?view=settings-billing`;

          // Send email
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: userEmail,
              templateKey: 'trial_ending',
              variables: {
                days_remaining: TRIAL_ENDING_DAYS.toString(),
                trial_end_date: formattedDate,
                upgrade_link: upgradeLink,
              },
              userId: billing.user_id,
              mailType: 'trial_ending',
              category: 'informational',
              idempotencyKey: idempotencyKey,
              metadata: {
                cronRunId: cronRunId,
                daysRemaining: TRIAL_ENDING_DAYS,
                trialEndsAt: billing.trial_ends_at,
              },
            }),
          });

          const emailData = await emailResponse.json();

          if (!emailResponse.ok) {
            console.error(`Failed to send email to ${userEmail}:`, emailData);
            failedCount++;
          } else if (emailData.skipped) {
            console.log(`Email already sent to ${userEmail} (idempotency)`);
            skippedCount++;
          } else {
            console.log(`Email sent to ${userEmail}`);
            sentCount++;
          }
        } catch (err) {
          console.error(`Error processing user ${billing.user_id}:`, err);
          failedCount++;
        }
      }
    }

    // Update cron run log
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

    console.log('Trial-ending cron job completed:', {
      processed: processedCount,
      sent: sentCount,
      skipped: skippedCount,
      failed: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trial-ending emails processed',
        cronRunId: cronRunId,
        processed: processedCount,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in trial-ending cron:', error);

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
          .eq('job_name', 'cron-trial-ending')
          .eq('status', 'running');
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
