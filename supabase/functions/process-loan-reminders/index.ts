import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      return new Response(
        JSON.stringify({ message: 'Keine ausstehenden Erinnerungen', processed: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const reminder of pendingReminders) {
      try {
        const loan = reminder.loans;
        if (!loan) continue;

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

        const notificationTitle = `${reminderLabel}: ${loan.lender_name}`;
        const notificationMessage = `Erinnerung für Immobilie "${propertyName}": ${reminderLabel} am ${formattedDate} (in ${reminder.days_before} Tagen). Kredit: ${loan.lender_name}, Restschuld: ${loan.remaining_balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`;

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
        errors.push(`Fehler beim Verarbeiten von Reminder ${reminder.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `${processedCount} von ${pendingReminders.length} Erinnerungen verarbeitet`,
        processed: processedCount,
        total: pendingReminders.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing loan reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});