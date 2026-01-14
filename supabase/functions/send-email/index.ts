import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  templateKey?: string;
  variables?: Record<string, string>;
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value);
  });
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, text, templateKey, variables }: EmailRequest = await req.json();

    let finalSubject = subject || '';
    let finalHtml = html || '';
    let finalText = text || '';

    if (templateKey) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .maybeSingle();

      if (templateError || !template) {
        return new Response(
          JSON.stringify({
            error: `Template not found: ${templateKey}`
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      finalSubject = template.subject;
      finalHtml = template.body_html;
      finalText = template.body_text;

      if (variables) {
        finalSubject = replaceVariables(finalSubject, variables);
        finalHtml = replaceVariables(finalHtml, variables);
        finalText = replaceVariables(finalText, variables);
      }
    }

    if (!to || !finalSubject || !finalHtml) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, and either (subject + html) or templateKey"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          error: 'E-Mail-Versand nicht konfiguriert',
          details: 'RESEND_API_KEY fehlt. Bitte konfigurieren Sie den API-Key in den Supabase Edge Function Secrets.',
          instructions: 'Siehe EMAIL_SETUP.md für Anweisungen zur Konfiguration.'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Rentably <onboarding@resend.dev>';

    console.log('Sending email to:', to, 'Subject:', finalSubject, 'From:', EMAIL_FROM);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: finalSubject,
        html: finalHtml,
        text: finalText || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return new Response(
        JSON.stringify({
          error: 'Fehler beim E-Mail-Versand',
          details: data.message || 'Failed to send email via Resend',
          resendStatus: response.status,
          resendData: data
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Email sent successfully via Resend:', {
      id: data.id,
      to,
      subject: finalSubject,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: to,
        emailId: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});