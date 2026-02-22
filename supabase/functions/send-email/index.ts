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
  useUserAlias?: boolean;
  storeAsMessage?: boolean;
  threadId?: string;
  recipientName?: string;
  tenantId?: string;
  replyTo?: string;
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value);
  });
  return result;
}

async function resolveFromAddress(
  supabase: any,
  userId: string | undefined,
  useUserAlias: boolean | undefined,
  defaultFrom: string
): Promise<string> {
  if (!userId || !useUserAlias) return defaultFrom;

  const { data: mailbox } = await supabase
    .from('user_mailboxes')
    .select('alias_localpart, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!mailbox) return defaultFrom;

  const aliasEmail = `${mailbox.alias_localpart}@rentab.ly`;

  const { data: mailSettings } = await supabase
    .from('user_mail_settings')
    .select('sender_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (mailSettings?.sender_name?.trim()) {
    return `${mailSettings.sender_name.trim()} <${aliasEmail}>`;
  }

  const { data: profile } = await supabase
    .from('account_profiles')
    .select('first_name, last_name, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (profile) {
    const displayName = profile.company_name
      || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      || 'Rentably';
    return `${displayName} <${aliasEmail}>`;
  }

  return `Rentably <${aliasEmail}>`;
}

async function storeOutboundMessage(
  supabase: any,
  params: {
    userId: string;
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml: string | null;
    senderAddress: string;
    providerMessageId: string;
    threadId?: string;
    recipientName?: string;
    tenantId?: string;
    attachments?: EmailAttachment[];
  }
) {
  let threadId = params.threadId;

  if (threadId) {
    await supabase
      .from('mail_threads')
      .update({
        last_message_at: new Date().toISOString(),
        last_email_message_id: params.providerMessageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    await supabase.rpc('increment_thread_message_count', { p_thread_id: threadId });
  } else {
    const { data: newThread } = await supabase
      .from('mail_threads')
      .insert({
        user_id: params.userId,
        tenant_id: params.tenantId || null,
        external_email: params.to,
        external_name: params.recipientName || null,
        subject: params.subject,
        folder: 'sent',
        status: 'read',
        last_message_at: new Date().toISOString(),
        last_email_message_id: params.providerMessageId,
        message_count: 1,
      })
      .select('id')
      .maybeSingle();

    if (newThread) threadId = newThread.id;
  }

  if (!threadId) return;

  const { data: msgRow } = await supabase.from('mail_messages').insert({
    thread_id: threadId,
    user_id: params.userId,
    direction: 'outbound',
    sender_address: params.senderAddress,
    sender_name: '',
    recipient_address: params.to,
    recipient_name: params.recipientName || '',
    body_text: params.bodyText,
    body_html: params.bodyHtml,
    email_message_id: params.providerMessageId,
    provider_message_id: params.providerMessageId,
  }).select('id').maybeSingle();

  if (msgRow && params.attachments && params.attachments.length > 0) {
    for (const att of params.attachments) {
      if (!att.path) continue;
      try {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('documents')
          .download(att.path);
        if (dlErr || !fileData) {
          console.error('Failed to download attachment for storage:', dlErr);
          continue;
        }

        const storagePath = `${params.userId}/${msgRow.id}/${Date.now()}_${att.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: upErr } = await supabase.storage
          .from('mail-attachments')
          .upload(storagePath, fileData, {
            contentType: fileData.type || 'application/octet-stream',
            upsert: false,
          });
        if (upErr) {
          console.error('Failed to upload attachment to mail-attachments:', upErr);
          continue;
        }

        const buf = await fileData.arrayBuffer();
        await supabase.from('mail_attachments').insert({
          message_id: msgRow.id,
          user_id: params.userId,
          filename: att.filename,
          content_type: fileData.type || 'application/octet-stream',
          file_size: buf.byteLength,
          storage_path: storagePath,
        });
      } catch (attErr) {
        console.error('Error storing outbound attachment:', attErr);
      }
    }
  }

  return threadId;
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
      attachments,
      useUserAlias,
      storeAsMessage,
      threadId,
      recipientName,
      tenantId,
      replyTo,
    }: EmailRequest = await req.json();

    let finalSubject = subject || '';
    let finalHtml = html || '';
    let finalText = text || '';
    let finalMailType = mailType || templateKey || 'generic';
    let finalCategory = category || 'transactional';

    if (idempotencyKey) {
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingLog) {
        if (existingLog.status === 'sent') {
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
        logId = existingLog.id;
        await supabase
          .from('email_logs')
          .update({
            status: 'queued',
            error_code: null,
            error_message: null,
            metadata: { ...(metadata || {}), templateKey: templateKey || null, retry: true },
          })
          .eq('id', logId);
      }
    }

    if (!logId) {
      const { data: logEntry, error: logError } = await supabase
        .from('email_logs')
        .insert({
          mail_type: finalMailType,
          category: finalCategory,
          to_email: to || 'unknown',
          user_id: userId || null,
          subject: subject || templateKey || 'unknown',
          provider: 'resend',
          status: 'queued',
          idempotency_key: idempotencyKey || null,
          metadata: { ...(metadata || {}), templateKey: templateKey || null },
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Failed to create email log:', logError);
      } else {
        logId = logEntry.id;
      }
    }

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
        const errMsg = `Template not found: ${templateKey} (language: ${userLanguage})`;
        if (logId) {
          await supabase
            .from('email_logs')
            .update({ status: 'failed', error_code: 'TEMPLATE_NOT_FOUND', error_message: errMsg })
            .eq('id', logId);
        }
        throw new Error(errMsg);
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

    if (!to || !finalSubject || (!finalHtml && !finalText)) {
      const errMsg = "Missing required fields: to, subject, and html or text";
      if (logId) {
        await supabase
          .from('email_logs')
          .update({ status: 'failed', error_code: 'MISSING_FIELDS', error_message: errMsg })
          .eq('id', logId);
      }
      throw new Error(errMsg);
    }

    if (!finalHtml && finalText) {
      finalHtml = `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${finalText}</div>`;
    }

    if (logId) {
      await supabase
        .from('email_logs')
        .update({ subject: finalSubject })
        .eq('id', logId);
    }

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

    const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') || 'Rentably <hallo@rentab.ly>';
    const fromAddress = await resolveFromAddress(supabase, userId, useUserAlias, DEFAULT_FROM);

    const emailPayload: any = {
      from: fromAddress,
      to: [to],
      subject: finalSubject,
      html: finalHtml,
      text: finalText || '',
    };

    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }

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
            const bytes = new Uint8Array(buffer);

            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.slice(i, i + chunkSize);
              binary += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const base64Content = btoa(binary);

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

    console.log('Sending email via Resend:', { to, subject: finalSubject, from: fromAddress });

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

    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        provider_message_id: data.id,
        sent_at: new Date().toISOString(),
      })
      .eq('id', logId);

    let resultThreadId: string | undefined;

    if (storeAsMessage && userId) {
      const senderAddr = fromAddress.match(/<(.+)>/)?.[1] || fromAddress;
      resultThreadId = await storeOutboundMessage(supabase, {
        userId,
        to,
        subject: finalSubject,
        bodyText: finalText || '',
        bodyHtml: finalHtml || null,
        senderAddress: senderAddr,
        providerMessageId: data.id,
        threadId,
        recipientName,
        tenantId,
        attachments,
      });
    }

    console.log('Email sent successfully:', { id: data.id, to, subject: finalSubject });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: to,
        emailId: data.id,
        logId: logId,
        threadId: resultThreadId || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

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
