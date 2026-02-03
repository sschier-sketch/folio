import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const user = existingUser?.users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({
          message: 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: resetRequest, error: insertError } = await supabase
      .from('password_reset_requests')
      .insert({
        email,
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

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: email,
        templateKey: 'password_reset',
        variables: {
          reset_link: resetLink,
        },
        userId: user.id,
        mailType: 'password_reset',
        category: 'transactional',
        idempotencyKey: `password-reset:${resetRequest.id}`,
        metadata: {
          resetRequestId: resetRequest.id,
        },
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Failed to send password reset email:', emailData);
      return new Response(
        JSON.stringify({
          error: 'Fehler beim Senden der E-Mail',
          details: emailData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Password reset email sent successfully:', emailData);

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
