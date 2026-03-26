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
        const formattedBalance = loan.remaining_balance
          ? loan.remaining_balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
          : '0,00 EUR';

        let specialRepaymentInfo = '';
        if (reminder.reminder_type === 'special_repayment' && (loan.special_repayment_max_amount || loan.special_repayment_max_percent)) {
          const maxAmount = loan.special_repayment_max_amount
            ? loan.special_repayment_max_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
            : `${loan.special_repayment_max_percent}%`;
          specialRepaymentInfo = `<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Max. Sondertilgung:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">${maxAmount} / Jahr</td></tr>`;
        }

        let importantNote = '';
        if (reminder.reminder_type === 'fixed_interest_end') {
          importantNote = '<strong>Wichtig:</strong> Ihre Zinsbindung endet bald. Wir empfehlen Ihnen, rechtzeitig mit Ihrer Bank ueber eine Anschlussfinanzierung zu sprechen.';
        } else if (reminder.reminder_type === 'loan_end') {
          importantNote = '<strong>Wichtig:</strong> Ihr Kredit laeuft bald aus. Bitte stellen Sie sicher, dass alle offenen Betraege beglichen sind.';
        } else if (reminder.reminder_type === 'special_repayment') {
          importantNote = '<strong>Hinweis:</strong> Sie haben die Moeglichkeit, eine Sondertilgung vorzunehmen. Nutzen Sie diese Chance, um Ihre Restschuld zu reduzieren.';
        }

        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: userEmail,
              templateKey: 'loan_reminder',
              variables: {
                reminderLabel,
                eventDate: formattedDate,
                daysRemaining: String(reminder.days_before),
                propertyName,
                lenderName: loan.lender_name || '',
                remainingBalance: formattedBalance,
                interestRate: String(loan.interest_rate || 0),
                specialRepaymentInfo,
                importantNote,
              },
              userId: reminder.user_id,
              mailType: 'loan_reminder',
              category: 'transactional',
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
