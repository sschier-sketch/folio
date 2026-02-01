import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailAttachment {
  filename: string;
  content?: string;
  path?: string;
}

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  templateKey?: string;
  variables?: Record<string, string>;
  language?: 'de' | 'en';
  userId?: string;
  mailType?: string;
  category?: 'transactional' | 'informational';
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  attachments?: EmailAttachment[];
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let logId: string | undefined;

  try {
    const {
      to,
      subject,
      html,
      text,
      templateKey,
      variables,
      language,
      userId,
      mailType,
      category,
      idempotencyKey,
      metadata,
      attachments
    }: EmailRequest = await req.json();

    let finalSubject = subject || '';
    let finalHtml = html || '';
    let finalText = text || '';
    let finalMailType = mailType || templateKey || 'generic';
    let finalCategory = category || 'transactional';

    // Check idempotency
    if (idempotencyKey) {
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingLog && (existingLog.status === 'sent' || existingLog.status === 'queued')) {
        console.log('Email already sent/queued with idempotency key:', idempotencyKey);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email already sent (idempotency)',
            skipped: true,
            logId: existingLog.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Load template if specified
    if (templateKey) {
      let userLanguage = language || 'de';

      if (userId && !language) {
        const { data: userData } = await supabase
          .from('admin_users')
          .select('preferred_language')
          .eq('user_id', userId)
          .maybeSingle();

        if (userData?.preferred_language) {
          userLanguage = userData.preferred_language;
        }
      }

      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('language', userLanguage)
        .maybeSingle();

      if (templateError || !template) {
        throw new Error(`Template not found: ${templateKey}`);
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
      throw new Error("Missing required fields: to, and either (subject + html) or templateKey");
    }

    // Create email log entry (status: queued)
    const { data: logEntry, error: logError } = await supabase
      .from('email_logs')
      .insert({
        mail_type: finalMailType,
        category: finalCategory,
        to_email: to,
        user_id: userId || null,
        subject: finalSubject,
        provider: 'resend',
        status: 'queued',
        idempotency_key: idempotencyKey || null,
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create email log:', logError);
      throw new Error('Failed to create email log');
    }

    logId = logEntry.id;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_code: 'CONFIG_ERROR',
          error_message: 'RESEND_API_KEY not configured',
        })
        .eq('id', logId);

      throw new Error('RESEND_API_KEY not configured');
    }

    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Rentably <hallo@rentab.ly>';
    const NODE_ENV = Deno.env.get('NODE_ENV') || 'production';

    // DEV Mode: Log email preview
    if (NODE_ENV === 'development') {
      console.log('=== EMAIL PREVIEW (DEV MODE) ===');
      console.log('To:', to);
      console.log('Subject:', finalSubject);
      console.log('Mail Type:', finalMailType);
      console.log('Idempotency Key:', idempotencyKey || 'none');
      console.log('===============================');
    }

    console.log('Sending email via Resend:', { to, subject: finalSubject, from: EMAIL_FROM });

    const emailPayload: any = {
      from: EMAIL_FROM,
      to: [to],
      subject: finalSubject,
      html: finalHtml,
      text: finalText || '',
    };

    if (attachments && attachments.length > 0) {
      emailPayload.attachments = await Promise.all(
        attachments.map(async (att) => {
          if (att.path) {
            const { data: fileData, error: fileError } = await supabase.storage
              .from('documents')
              .download(att.path);

            if (fileError) {
              console.error('Error loading attachment:', fileError);
              throw new Error(`Failed to load attachment: ${att.filename}`);
            }

            const buffer = await fileData.arrayBuffer();
            const base64Content = btoa(
              String.fromCharCode(...new Uint8Array(buffer))
            );

            return {
              filename: att.filename,
              content: base64Content,
            };
          } else if (att.content) {
            return {
              filename: att.filename,
              content: att.content,
            };
          }
          return null;
        })
      ).then(results => results.filter(r => r !== null));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);

      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_code: `RESEND_${response.status}`,
          error_message: data.message || 'Resend API error',
        })
        .eq('id', logId);

      throw new Error(data.message || 'Failed to send email via Resend');
    }

    // Update log: success
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        provider_message_id: data.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', logId);

    console.log('Email sent successfully:', { id: data.id, to, subject: finalSubject });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: to,
        emailId: data.id,
        logId: logId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    // Update log if we created one
    if (logId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId);
    }

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
