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
    const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://rentab.ly';

    console.log('Starting trial-ended cron job');

    // Create cron run log
    const { data: cronRun, error: cronError } = await supabase
      .from('cron_runs')
      .insert({
        job_name: 'cron-trial-ended',
        status: 'running',
      })
      .select('id')
      .single();

    if (cronError) {
      throw new Error(`Failed to create cron run log: ${cronError.message}`);
    }

    const cronRunId = cronRun.id;

    // Find users whose trial has ended (trial_ends_at < now) and still on free plan
    const now = new Date().toISOString();
    const { data: users, error: usersError } = await supabase
      .from('billing_info')
      .select('user_id, trial_ends_at')
      .eq('subscription_plan', 'free')
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', now);

    if (usersError) {
      throw new Error(`Failed to query users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with expired trial`);

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

          // Idempotency key: userId + trial_ends_at date + "ended"
          const trialEndDate = billing.trial_ends_at.split('T')[0];
          const idempotencyKey = `trial_ended:${billing.user_id}:${trialEndDate}`;

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
              templateKey: 'trial_ended',
              variables: {
                trial_end_date: formattedDate,
                upgrade_link: upgradeLink,
              },
              userId: billing.user_id,
              mailType: 'trial_ended',
              category: 'informational',
              idempotencyKey: idempotencyKey,
              metadata: {
                cronRunId: cronRunId,
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

    console.log('Trial-ended cron job completed:', {
      processed: processedCount,
      sent: sentCount,
      skipped: skippedCount,
      failed: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trial-ended emails processed',
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
    console.error('Error in trial-ended cron:', error);

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
          .eq('job_name', 'cron-trial-ended')
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
