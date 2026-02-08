import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  let cronRunId: string | null = null;

  try {
    const { data: cronRun } = await supabase
      .from('cron_runs')
      .insert({ job_name: 'process-loan-reminders', status: 'running' })
      .select('id')
      .single();

    cronRunId = cronRun?.id || null;

    const today = new Date().toISOString().split('T')[0];

    const { data: pendingReminders, error: remindersError } = await supabase
      .from('loan_reminders')
      .select(`
        *,
        loans:loan_id (
          id,
          lender_name,
          loan_amount,
          remaining_balance,
          interest_rate,
          monthly_payment,
          end_date,
          fixed_interest_end_date,
          special_repayment_due_date,
          special_repayment_max_amount,
          special_repayment_max_percent,
          property_id,
          properties:property_id (name)
        )
      `)
      .eq('status', 'pending')
      .lte('reminder_date', today);

    if (remindersError) {
      throw remindersError;
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      if (cronRunId) {
        await supabase
          .from('cron_runs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            processed_count: 0,
            sent_count: 0,
            failed_count: 0,
            skipped_count: 0,
          })
          .eq('id', cronRunId);
      }

      return new Response(
        JSON.stringify({ message: 'Keine ausstehenden Erinnerungen', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let emailsSent = 0;
    const errors: string[] = [];

    for (const reminder of pendingReminders) {
      try {
        const loan = reminder.loans;
        if (!loan) continue;

        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          reminder.user_id
        );

        if (userError || !userData?.user?.email) {
          errors.push(`Benutzer-E-Mail fuer Reminder ${reminder.id} nicht gefunden`);
          continue;
        }

        const userEmail = userData.user.email;

        const reminderTypeLabels: Record<string, string> = {
          fixed_interest_end: 'Ende der Zinsbindung',
          loan_end: 'Kreditende',
          special_repayment: 'Sondertilgungstermin',
        };

        const reminderLabel = reminderTypeLabels[reminder.reminder_type] || reminder.reminder_type;
        const propertyName = loan.properties?.name || 'Unbekannte Immobilie';

        let eventDate = '';
        switch (reminder.reminder_type) {
          case 'fixed_interest_end':
            eventDate = loan.fixed_interest_end_date || '';
            break;
          case 'loan_end':
            eventDate = loan.end_date || '';
            break;
          case 'special_repayment':
            eventDate = loan.special_repayment_due_date || '';
            break;
        }

        const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('de-DE') : 'Unbekannt';
        const formattedBalance = loan.remaining_balance.toLocaleString('de-DE', {
          style: 'currency',
          currency: 'EUR',
        });

        const emailSubject = `Erinnerung: ${reminderLabel} - ${loan.lender_name}`;

        let emailBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;
        emailBody += `<h2 style="color: #008CFF;">${reminderLabel}</h2>`;
        emailBody += `<p>Hallo,</p>`;
        emailBody += `<p>Dies ist eine automatische Erinnerung fuer einen wichtigen Termin:</p>`;
        emailBody += `<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">`;
        emailBody += `<table style="width: 100%; border-collapse: collapse;">`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Ereignis:</td><td style="padding: 8px 0;">${reminderLabel}</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Datum:</td><td style="padding: 8px 0;">${formattedDate}</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">In:</td><td style="padding: 8px 0;">${reminder.days_before} Tagen</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Immobilie:</td><td style="padding: 8px 0;">${propertyName}</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Kreditgeber:</td><td style="padding: 8px 0;">${loan.lender_name}</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Restschuld:</td><td style="padding: 8px 0;">${formattedBalance}</td></tr>`;
        emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Zinssatz:</td><td style="padding: 8px 0;">${loan.interest_rate}%</td></tr>`;

        if (reminder.reminder_type === 'special_repayment' && (loan.special_repayment_max_amount || loan.special_repayment_max_percent)) {
          const maxAmount = loan.special_repayment_max_amount
            ? loan.special_repayment_max_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
            : `${loan.special_repayment_max_percent}%`;
          emailBody += `<tr><td style="padding: 8px 0; font-weight: bold;">Max. Sondertilgung:</td><td style="padding: 8px 0;">${maxAmount} / Jahr</td></tr>`;
        }

        emailBody += `</table></div>`;

        if (reminder.reminder_type === 'fixed_interest_end') {
          emailBody += `<p><strong>Wichtig:</strong> Ihre Zinsbindung endet bald. Wir empfehlen Ihnen, rechtzeitig mit Ihrer Bank ueber eine Anschlussfinanzierung zu sprechen.</p>`;
        } else if (reminder.reminder_type === 'loan_end') {
          emailBody += `<p><strong>Wichtig:</strong> Ihr Kredit laeuft bald aus. Bitte stellen Sie sicher, dass alle offenen Betraege beglichen sind.</p>`;
        } else if (reminder.reminder_type === 'special_repayment') {
          emailBody += `<p><strong>Hinweis:</strong> Sie haben die Moeglichkeit, eine Sondertilgung vorzunehmen. Nutzen Sie diese Chance, um Ihre Restschuld zu reduzieren.</p>`;
        }

        emailBody += `<p>Viele Gruesse,<br>Ihr Rentably Team</p></div>`;

        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: userEmail,
              subject: emailSubject,
              html: emailBody,
            }),
          });

          if (emailResponse.ok) {
            emailsSent++;
          } else {
            const errorText = await emailResponse.text();
            errors.push(`E-Mail-Versand fehlgeschlagen fuer Reminder ${reminder.id}: ${errorText}`);
          }
        } catch (emailError) {
          errors.push(`E-Mail-Versand-Fehler fuer Reminder ${reminder.id}: ${(emailError as Error).message}`);
        }

        const notificationMessage = `Erinnerung fuer Immobilie "${propertyName}": ${reminderLabel} am ${formattedDate} (in ${reminder.days_before} Tagen). Kredit: ${loan.lender_name}, Restschuld: ${formattedBalance}.`;

        const { error: updateError } = await supabase
          .from('loan_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            notes: notificationMessage,
          })
          .eq('id', reminder.id);

        if (updateError) {
          errors.push(`Fehler beim Aktualisieren von Reminder ${reminder.id}: ${updateError.message}`);
        } else {
          processedCount++;
        }
      } catch (err) {
        errors.push(`Fehler beim Verarbeiten von Reminder ${reminder.id}: ${(err as Error).message}`);
      }
    }

    if (cronRunId) {
      await supabase
        .from('cron_runs')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          processed_count: processedCount,
          sent_count: emailsSent,
          failed_count: errors.length,
          skipped_count: 0,
          error_message: errors.length > 0 ? errors.join('; ') : null,
        })
        .eq('id', cronRunId);
    }

    return new Response(
      JSON.stringify({
        message: `${processedCount} von ${pendingReminders.length} Erinnerungen verarbeitet, ${emailsSent} E-Mails versendet`,
        processed: processedCount,
        emailsSent: emailsSent,
        total: pendingReminders.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing loan reminders:', error);

    if (cronRunId) {
      try {
        await supabase
          .from('cron_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', cronRunId);
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
