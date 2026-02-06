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
        const { data: replyThread } = await supabase
          .from("mail_threads")
          .select("id, tenant_id, folder")
          .eq("user_id", userId)
          .eq("last_email_message_id", inReplyTo)
          .maybeSingle();

        if (replyThread) {
          threadId = replyThread.id;
          if (replyThread.tenant_id) tenantId = replyThread.tenant_id;
          if (
            replyThread.folder === "inbox" ||
            replyThread.folder === "sent"
          )
            folder = "inbox";
        }
      }

      if (!threadId && references.length > 0) {
        for (const ref of [...references].reverse()) {
          const { data: refMsg } = await supabase
            .from("mail_messages")
            .select(
              "thread_id, mail_threads!inner(id, user_id, tenant_id, folder)"
            )
            .eq("user_id", userId)
            .eq("email_message_id", ref)
            .maybeSingle();

          if (refMsg) {
            threadId = refMsg.thread_id;
            const t = refMsg.mail_threads as any;
            if (t?.tenant_id) tenantId = t.tenant_id;
            if (t?.folder === "inbox" || t?.folder === "sent")
              folder = "inbox";
            break;
          }
        }
      }

      if (!threadId) {
        const normalizedSubj = normalizeSubject(subject);

        const { data: subjectThread } = await supabase
          .from("mail_threads")
          .select("id, subject, tenant_id, folder")
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
          if (subjectThread.tenant_id) tenantId = subjectThread.tenant_id;
          if (subjectThread.folder !== "unknown")
            folder = subjectThread.folder as any;
        }
      }

      if (threadId) {
        await supabase
          .from("mail_threads")
          .update({
            last_message_at: receivedAt,
            last_email_message_id: messageId,
            status: "unread",
            updated_at: new Date().toISOString(),
          })
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

      const { error: msgErr } = await supabase.from("mail_messages").insert({
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
      });

      if (msgErr) {
        console.error("[inbound] Failed to insert message:", msgErr);
        continue;
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
