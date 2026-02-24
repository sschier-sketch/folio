import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResendWebhookPayload {
  type: string;
  created_at?: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    message_id?: string;
    created_at?: string;
    attachments?: { id: string; filename: string; content_type: string }[];
  };
}

interface ResendEmailContent {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html: string | null;
  text: string | null;
  headers: Record<string, string>;
  message_id: string | null;
  created_at: string;
}

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase().trim();
  return raw.toLowerCase().trim();
}

function extractName(raw: string): string {
  const match = raw.match(/^([^<]+)</);
  if (match) return match[1].trim().replace(/^"|"$/g, "");
  return "";
}

function extractLocalPart(email: string): string {
  return email.split("@")[0].toLowerCase();
}

function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|aw|wg):\s*/gi, "")
    .trim()
    .toLowerCase();
}

function extractTicketNumber(subject: string): string | null {
  const match = subject.match(/\[Ticket\s*#([A-Z0-9-]+)\]/i);
  return match ? match[1] : null;
}

function parseReferences(refs: string | undefined | null): string[] {
  if (!refs) return [];
  return refs
    .split(/\s+/)
    .map((r) => r.trim())
    .filter(Boolean);
}

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(svixTimestamp, 10);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    return false;
  }

  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(rawSecret), (c) =>
    c.charCodeAt(0)
  );

  const signatureBase = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signatureBase)
  );

  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  const signatures = svixSignature.split(" ");
  return signatures.some((sig) => {
    const parts = sig.split(",");
    if (parts.length < 2 || parts[0] !== "v1") return false;
    return parts[1] === expectedSignature;
  });
}

interface ResendAttachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  content_disposition: string;
  content_id: string | null;
  download_url: string;
  expires_at: string;
}

async function fetchEmailContent(
  emailId: string,
  apiKey: string
): Promise<ResendEmailContent | null> {
  const response = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!response.ok) {
    console.error(
      `Failed to fetch email content: ${response.status} ${response.statusText}`
    );
    return null;
  }

  return await response.json();
}

async function fetchAttachmentsList(
  emailId: string,
  apiKey: string
): Promise<ResendAttachment[]> {
  try {
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}/attachments`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) {
      console.error(
        `[inbound] Failed to fetch attachments list: ${response.status}`
      );
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (err) {
    console.error("[inbound] Error fetching attachments list:", err);
    return [];
  }
}

async function downloadAttachmentBuffer(
  downloadUrl: string
): Promise<{ buffer: ArrayBuffer; size: number } | null> {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.error(
        `[inbound] Failed to download attachment: ${response.status}`
      );
      return null;
    }
    const buffer = await response.arrayBuffer();
    return { buffer, size: buffer.byteLength };
  } catch (err) {
    console.error("[inbound] Error downloading attachment:", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const rawBody = await req.text();

    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(
        rawBody,
        req.headers,
        webhookSecret
      );
      if (!isValid) {
        console.error("Webhook signature validation failed");
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);

    if (payload.type !== "email.received") {
      return new Response(JSON.stringify({ ignored: true, type: payload.type }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.data || !payload.data.from || !payload.data.to) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookData = payload.data;
    const emailId = webhookData.email_id;

    let bodyText = "";
    let bodyHtml: string | null = null;
    let messageId = webhookData.message_id || null;
    let inReplyTo: string | null = null;
    let references: string[] = [];
    let fullHeaders: Record<string, string> = {};

    if (emailId && resendApiKey) {
      const emailContent = await fetchEmailContent(emailId, resendApiKey);
      if (emailContent) {
        bodyText = emailContent.text || "";
        bodyHtml = emailContent.html || null;
        fullHeaders = emailContent.headers || {};

        if (emailContent.message_id) {
          messageId = emailContent.message_id;
        }

        inReplyTo = fullHeaders["in-reply-to"] || null;
        references = parseReferences(fullHeaders["references"]);
      }
    }

    const fromAddress = extractEmail(webhookData.from);
    const fromName = extractName(webhookData.from) || fromAddress;
    const toAddresses = Array.isArray(webhookData.to)
      ? webhookData.to.map((t: string) => extractEmail(t))
      : String(webhookData.to)
          .split(",")
          .map((t: string) => extractEmail(t));
    const subject = webhookData.subject || "(Kein Betreff)";
    const receivedAt = webhookData.created_at
      ? new Date(webhookData.created_at).toISOString()
      : new Date().toISOString();

    console.log(
      `[inbound] from=${fromAddress} to=${toAddresses.join(",")} subject="${subject}" email_id=${emailId || "n/a"}`
    );

    let forwarded = 0;
    for (const toAddr of toAddresses) {
      if (!toAddr.endsWith("@rentab.ly")) continue;
      const fwdAlias = extractLocalPart(toAddr);

      const { data: fwdRule } = await supabase
        .from("email_forwarding_rules")
        .select("source_alias, forward_to_email, is_active")
        .eq("source_alias", fwdAlias)
        .eq("is_active", true)
        .maybeSingle();

      if (fwdRule && resendApiKey) {
        console.log(
          `[inbound] Forwarding ${fwdAlias}@rentab.ly -> ${fwdRule.forward_to_email}`
        );

        const fwdPayload: Record<string, unknown> = {
          from: `${fwdAlias}@rentab.ly`,
          to: [fwdRule.forward_to_email],
          subject: `[Weitergeleitet] ${subject}`,
          reply_to: fromAddress,
          text: bodyText || undefined,
          html: bodyHtml || undefined,
        };

        if (emailId && webhookData.attachments && webhookData.attachments.length > 0) {
          console.log(
            `[inbound] Fetching ${webhookData.attachments.length} attachment(s) for forwarding`
          );
          const fwdAttachmentsList = await fetchAttachmentsList(emailId, resendApiKey);
          const resendAttachments: { filename: string; content: string }[] = [];

          for (const att of fwdAttachmentsList) {
            try {
              const downloaded = await downloadAttachmentBuffer(att.download_url);
              if (!downloaded) continue;

              const bytes = new Uint8Array(downloaded.buffer);
              let binary = "";
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Content = btoa(binary);

              resendAttachments.push({
                filename: att.filename,
                content: base64Content,
              });
              console.log(`[inbound] Prepared attachment for forwarding: ${att.filename} (${att.size} bytes)`);
            } catch (attErr) {
              console.error(`[inbound] Error preparing attachment ${att.filename} for forwarding:`, attErr);
            }
          }

          if (resendAttachments.length > 0) {
            fwdPayload.attachments = resendAttachments;
          }
        }

        const fwdRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fwdPayload),
        });

        if (fwdRes.ok) {
          console.log(
            `[inbound] Forwarded to ${fwdRule.forward_to_email} successfully`
          );
          forwarded++;
        } else {
          const errBody = await fwdRes.text();
          console.error(
            `[inbound] Forward failed: ${fwdRes.status} ${errBody}`
          );
        }

        await supabase.from("email_logs").insert({
          mail_type: "forwarded_inbound",
          category: "transactional",
          to_email: fwdRule.forward_to_email,
          subject: `[Weitergeleitet] ${subject}`,
          provider: "resend",
          status: fwdRes.ok ? "sent" : "failed",
          metadata: {
            original_from: fromAddress,
            original_to: toAddr,
            forwarding_rule: fwdAlias,
          },
        });
      }
    }

    if (forwarded > 0) {
      return new Response(
        JSON.stringify({ success: true, forwarded }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ticketNumber = extractTicketNumber(subject);
    if (ticketNumber) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id, ticket_number, contact_email, contact_name, status, user_id")
        .eq("ticket_number", ticketNumber)
        .maybeSingle();

      if (ticket && ticket.contact_email?.toLowerCase() === fromAddress.toLowerCase()) {
        console.log(
          `[inbound] Matched contact ticket reply: ${ticketNumber} from ${fromAddress}`
        );

        const replyBody = bodyText
          ? bodyText.split(/\n\s*>/).shift()?.trim() || bodyText.trim()
          : "(Kein Textinhalt)";

        const { error: msgErr } = await supabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticket.id,
            sender_type: "contact",
            sender_name: ticket.contact_name || fromName,
            sender_email: fromAddress,
            message: replyBody,
          });

        if (msgErr) {
          console.error("[inbound] Failed to insert ticket message:", msgErr);
        } else {
          const newStatus = ticket.status === "closed" ? "open" : "open";
          await supabase
            .from("tickets")
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
              last_email_received_at: receivedAt,
            })
            .eq("id", ticket.id);

          console.log(
            `[inbound] Created ticket_message for ticket ${ticketNumber}, status -> ${newStatus}`
          );
        }

        return new Response(
          JSON.stringify({ success: true, ticket_reply: ticketNumber }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    let processed = 0;
    let noMailboxFound = true;

    for (const toAddr of toAddresses) {
      if (!toAddr.endsWith("@rentab.ly")) continue;

      const aliasLocalpart = extractLocalPart(toAddr);

      const { data: mailbox } = await supabase
        .from("user_mailboxes")
        .select("user_id, is_active")
        .eq("alias_localpart", aliasLocalpart)
        .maybeSingle();

      if (!mailbox || !mailbox.is_active) {
        console.log(`[inbound] No active mailbox for alias: ${aliasLocalpart}`);
        continue;
      }

      noMailboxFound = false;
      const userId = mailbox.user_id;

      if (messageId) {
        const { data: existing } = await supabase
          .from("mail_messages")
          .select("id")
          .eq("user_id", userId)
          .eq("email_message_id", messageId)
          .maybeSingle();

        if (existing) {
          console.log(`[inbound] Duplicate skipped: ${messageId}`);
          processed++;
          continue;
        }
      }

      let threadId: string | null = null;
      let folder: "inbox" | "unknown" = "unknown";
      let tenantId: string | null = null;
      let isReplyToExistingThread = false;

      const { data: knownTenant } = await supabase
        .from("tenants")
        .select("id, first_name, last_name")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .ilike("email", fromAddress)
        .maybeSingle();

      if (knownTenant) {
        tenantId = knownTenant.id;
        folder = "inbox";
      } else {
        const { data: knownContact } = await supabase
          .from("property_contacts")
          .select("id")
          .eq("user_id", userId)
          .ilike("email", fromAddress)
          .maybeSingle();

        if (knownContact) {
          folder = "inbox";
        }
      }

      if (inReplyTo) {
        const { data: replyMsg } = await supabase
          .from("mail_messages")
          .select(
            "thread_id, mail_threads!inner(id, user_id, tenant_id)"
          )
          .eq("user_id", userId)
          .eq("email_message_id", inReplyTo)
          .maybeSingle();

        if (replyMsg) {
          threadId = replyMsg.thread_id;
          isReplyToExistingThread = true;
          const t = replyMsg.mail_threads as any;
          if (t?.tenant_id) tenantId = t.tenant_id;
        }
      }

      if (!threadId && references.length > 0) {
        for (const ref of [...references].reverse()) {
          const { data: refMsg } = await supabase
            .from("mail_messages")
            .select(
              "thread_id, mail_threads!inner(id, user_id, tenant_id)"
            )
            .eq("user_id", userId)
            .eq("email_message_id", ref)
            .maybeSingle();

          if (refMsg) {
            threadId = refMsg.thread_id;
            isReplyToExistingThread = true;
            const t = refMsg.mail_threads as any;
            if (t?.tenant_id) tenantId = t.tenant_id;
            break;
          }
        }
      }

      if (!threadId) {
        const normalizedSubj = normalizeSubject(subject);

        const { data: subjectThread } = await supabase
          .from("mail_threads")
          .select("id, subject, tenant_id")
          .eq("user_id", userId)
          .eq("external_email", fromAddress)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (
          subjectThread &&
          normalizeSubject(subjectThread.subject || "") === normalizedSubj
        ) {
          threadId = subjectThread.id;
          isReplyToExistingThread = true;
          if (subjectThread.tenant_id) tenantId = subjectThread.tenant_id;
        }
      }

      if (isReplyToExistingThread) {
        folder = "inbox";
      }

      if (threadId) {
        const threadUpdate: Record<string, unknown> = {
          last_message_at: receivedAt,
          last_email_message_id: messageId,
          status: "unread",
          updated_at: new Date().toISOString(),
          folder: folder,
        };
        if (tenantId) {
          threadUpdate.tenant_id = tenantId;
        }

        await supabase
          .from("mail_threads")
          .update(threadUpdate)
          .eq("id", threadId);

        await supabase.rpc("increment_thread_message_count", {
          p_thread_id: threadId,
        });
      } else {
        const { data: newThread, error: threadErr } = await supabase
          .from("mail_threads")
          .insert({
            user_id: userId,
            tenant_id: tenantId,
            external_email: fromAddress,
            external_name: fromName,
            subject: subject,
            folder: folder,
            status: "unread",
            last_message_at: receivedAt,
            last_email_message_id: messageId,
            message_count: 1,
          })
          .select("id")
          .single();

        if (threadErr || !newThread) {
          console.error("[inbound] Failed to create thread:", threadErr);
          continue;
        }

        threadId = newThread.id;
      }

      const { data: insertedMsg, error: msgErr } = await supabase
        .from("mail_messages")
        .insert({
          thread_id: threadId,
          user_id: userId,
          direction: "inbound",
          sender_address: fromAddress,
          sender_name: fromName,
          recipient_address: toAddr,
          recipient_name: "",
          body_text: bodyText,
          body_html: bodyHtml,
          email_message_id: messageId,
          in_reply_to: inReplyTo,
          email_references: references.length > 0 ? references : null,
          received_at: receivedAt,
        })
        .select("id")
        .single();

      if (msgErr || !insertedMsg) {
        console.error("[inbound] Failed to insert message:", msgErr);
        continue;
      }

      const messageDbId = insertedMsg.id;

      if (emailId && resendApiKey && webhookData.attachments && webhookData.attachments.length > 0) {
        console.log(
          `[inbound] Processing ${webhookData.attachments.length} attachment(s) for message=${messageDbId}`
        );

        const attachmentsList = await fetchAttachmentsList(emailId, resendApiKey);

        for (const att of attachmentsList) {
          try {
            const downloaded = await downloadAttachmentBuffer(att.download_url);
            if (!downloaded) continue;

            const safeName = att.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
            const storagePath = `${userId}/${messageDbId}/${Date.now()}_${safeName}`;

            const { error: uploadErr } = await supabase.storage
              .from("mail-attachments")
              .upload(storagePath, downloaded.buffer, {
                contentType: att.content_type || "application/octet-stream",
                upsert: false,
              });

            if (uploadErr) {
              console.error(`[inbound] Failed to upload attachment ${att.filename}:`, uploadErr);
              continue;
            }

            await supabase.from("mail_attachments").insert({
              message_id: messageDbId,
              user_id: userId,
              filename: att.filename,
              content_type: att.content_type || "application/octet-stream",
              file_size: att.size || downloaded.size,
              storage_path: storagePath,
              resend_attachment_id: att.id,
            });

            console.log(`[inbound] Stored attachment: ${att.filename} (${att.size} bytes)`);
          } catch (attErr) {
            console.error(`[inbound] Error processing attachment ${att.filename}:`, attErr);
          }
        }
      }

      console.log(
        `[inbound] Stored message for user=${userId} thread=${threadId} folder=${folder}`
      );
      processed++;
    }

    if (noMailboxFound && processed === 0) {
      console.log(
        `[inbound] No matching mailbox found for recipients: ${toAddresses.join(", ")}`
      );
      return new Response(
        JSON.stringify({ accepted: true, reason: "no matching mailbox" }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[inbound] Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
