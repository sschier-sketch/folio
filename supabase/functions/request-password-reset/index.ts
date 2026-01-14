import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function encryptPassword(password: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
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

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'E-Mail und neues Passwort sind erforderlich' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === email);

    if (!userExists) {
      return new Response(
        JSON.stringify({ error: 'Kein Konto mit dieser E-Mail-Adresse gefunden' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const encryptedPassword = await encryptPassword(newPassword, supabaseServiceKey);

    const { data: resetRequest, error: insertError } = await supabase
      .from('password_reset_requests')
      .insert({
        email,
        new_password_encrypted: encryptedPassword,
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

    const confirmationUrl = `${req.headers.get('origin') || 'https://rentab.ly'}/reset-password/confirm?token=${resetRequest.verification_token}`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
    } else {
      try {
        const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Rentably <hallo@rentab.ly>';

        console.log('Sending password reset email from:', EMAIL_FROM, 'to:', email);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email],
            subject: 'Passwort-Änderung bestätigen',
            html: `
              <h2>Passwort-Änderung bestätigen</h2>
              <p>Sie haben eine Passwort-Änderung angefordert.</p>
              <p>Klicken Sie auf den folgenden Link, um Ihr neues Passwort zu aktivieren:</p>
              <p><a href="${confirmationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Passwort bestätigen</a></p>
              <p>Dieser Link ist 24 Stunden gültig.</p>
              <p>Falls Sie diese Änderung nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
            `,
          }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error('Resend API error:', emailData);
        } else {
          console.log('Password reset email sent successfully:', emailData.id);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Eine Bestätigungs-E-Mail wurde an Ihre Adresse gesendet. Bitte überprüfen Sie Ihr Postfach.' 
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