import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-Mail ist erforderlich' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: listData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const user = listData?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    const successMessage = 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.';

    if (!user) {
      return new Response(
        JSON.stringify({ message: successMessage }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: resetRequest, error: insertError } = await supabase
      .from('password_reset_requests')
      .insert({
        email: normalizedEmail,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating reset request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Erstellen der Anfrage' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const origin = req.headers.get('origin') || Deno.env.get('APP_BASE_URL') || 'https://rentab.ly';
    const resetLink = `${origin}/reset-password/confirm?token=${resetRequest.verification_token}`;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Fehler beim Senden der E-Mail' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, body_html, body_text')
      .eq('template_key', 'password_reset')
      .eq('language', 'de')
      .maybeSingle();

    if (templateError || !template) {
      console.error('Password reset email template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Senden der E-Mail' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profile } = await supabase
      .from('account_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    let userName = normalizedEmail.split('@')[0];
    if (profile) {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      if (fullName) userName = fullName;
    }

    const variables: Record<string, string> = {
      resetLink,
      userName,
    };

    const finalSubject = replaceVariables(template.subject, variables);
    const finalHtml = replaceVariables(template.body_html, variables);
    const finalText = template.body_text ? replaceVariables(template.body_text, variables) : '';

    const idempotencyKey = `password-reset:${resetRequest.id}`;
    let logId: string | undefined;

    const { data: newLog } = await supabase
      .from('email_logs')
      .insert({
        mail_type: 'password_reset',
        category: 'transactional',
        to_email: normalizedEmail,
        user_id: user.id,
        subject: finalSubject,
        provider: 'resend',
        status: 'queued',
        idempotency_key: idempotencyKey,
        metadata: { template_key: 'password_reset', resetRequestId: resetRequest.id },
      })
      .select('id')
      .maybeSingle();

    if (newLog) logId = newLog.id;

    const fromAddress = Deno.env.get('EMAIL_FROM') || 'rentably <hallo@rentab.ly>';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [normalizedEmail],
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error for password reset:', resendData);
      if (logId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_code: `RESEND_${resendResponse.status}`,
            error_message: resendData.message || 'Resend API error',
          })
          .eq('id', logId);
      }
      return new Response(
        JSON.stringify({ error: 'Fehler beim Senden der E-Mail' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (logId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          provider_message_id: resendData.id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', logId);
    }

    console.log('Password reset email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({
        message: 'Eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts wurde an Ihre Adresse gesendet. Bitte überprüfen Sie Ihr Postfach.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in request-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
