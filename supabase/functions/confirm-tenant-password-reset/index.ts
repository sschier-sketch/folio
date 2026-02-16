import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Token und neues Passwort sind erforderlich' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: resetToken, error: fetchError } = await supabase
      .from('tenant_password_reset_tokens')
      .select('*')
      .eq('verification_token', token)
      .eq('used', false)
      .single();

    if (fetchError || !resetToken) {
      return new Response(
        JSON.stringify({ error: 'Ungültiger oder bereits verwendeter Link. Bitte fordern Sie einen neuen Link an.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);

    if (now > expiresAt) {
      await supabase
        .from('tenant_password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

      return new Response(
        JSON.stringify({ error: 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);

    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        password_hash: hash,
        password_salt: salt,
      })
      .eq('id', resetToken.tenant_id);

    if (updateError) {
      console.error('Error updating tenant password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Aktualisieren des Passworts' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('tenant_password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    return new Response(
      JSON.stringify({
        message: 'Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in confirm-tenant-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
