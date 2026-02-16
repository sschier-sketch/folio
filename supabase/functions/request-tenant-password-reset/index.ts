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

    const normalizedEmail = email.toLowerCase().trim();

    const genericSuccess = {
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet. Bitte prüfen Sie Ihr Postfach.'
    };

    const { data: tenants, error: fetchError } = await supabase
      .from('tenants')
      .select('id, email, first_name, last_name, password_hash')
      .eq('email', normalizedEmail);

    if (fetchError || !tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify(genericSuccess),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tenant = tenants[0];

    if (!tenant.password_hash) {
      return new Response(
        JSON.stringify(genericSuccess),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('tenant_password_reset_tokens')
      .update({ used: true })
      .eq('tenant_id', tenant.id)
      .eq('used', false);

    const { data: resetToken, error: insertError } = await supabase
      .from('tenant_password_reset_tokens')
      .insert({
        tenant_id: tenant.id,
        email: normalizedEmail,
      })
      .select()
      .single();

    if (insertError || !resetToken) {
      console.error('Error creating tenant reset token:', insertError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Erstellen der Anfrage' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const origin = req.headers.get('origin') || 'https://rentab.ly';
    const resetLink = `${origin}/tenant-portal/reset-password?token=${resetToken.verification_token}`;

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: normalizedEmail,
        templateKey: 'tenant_password_reset',
        variables: {
          reset_link: resetLink,
        },
        mailType: 'tenant_password_reset',
        category: 'transactional',
        idempotencyKey: `tenant-password-reset:${resetToken.id}`,
        metadata: {
          tenantId: tenant.id,
          resetTokenId: resetToken.id,
        },
      }),
    });

    if (!emailResponse.ok) {
      const emailData = await emailResponse.json();
      console.error('Failed to send tenant password reset email:', emailData);
    }

    return new Response(
      JSON.stringify(genericSuccess),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in request-tenant-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
