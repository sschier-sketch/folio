import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResendInboundEmail {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  message_id?: string;
  in_reply_to?: string;
  references?: string;
  created_at?: string;
  headers?: { name: string; value: string }[];
}

interface ResendWebhookPayload {
  type: string;
  data: ResendInboundEmail;
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

function parseReferences(refs: string | undefined): string[] {
  if (!refs) return [];
  return refs
    .split(/\s+/)
    .map((r) => r.trim())
    .filter(Boolean);
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
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload: ResendWebhookPayload = await req.json();

    if (!payload.data || !payload.data.from || !payload.data.to) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = payload.data;
    const fromAddress = extractEmail(email.from);
    const fromName = extractName(email.from) || fromAddress;
    const toRaw = email.to;
    const toAddresses = toRaw.split(",").map((t: string) => extractEmail(t));
    const subject = email.subject || "(Kein Betreff)";
    const bodyText = email.text || "";
    const bodyHtml = email.html || null;
    const messageId = email.message_id || null;
    const inReplyTo = email.in_reply_to || null;
    const references = parseReferences(email.references);
    const receivedAt = email.created_at
      ? new Date(email.created_at).toISOString()
      : new Date().toISOString();

    let processed = 0;

    for (const toAddr of toAddresses) {
      if (!toAddr.endsWith("@rentab.ly")) continue;

      const aliasLocalpart = extractLocalPart(toAddr);

      const { data: mailbox } = await supabase
        .from("user_mailboxes")
        .select("user_id, is_active")
        .eq("alias_localpart", aliasLocalpart)
        .maybeSingle();

      if (!mailbox || !mailbox.is_active) {
        console.log(`No active mailbox for alias: ${aliasLocalpart}`);
        continue;
      }

      const userId = mailbox.user_id;

      if (messageId) {
        const { data: existing } = await supabase
          .from("mail_messages")
          .select("id")
          .eq("user_id", userId)
          .eq("email_message_id", messageId)
          .maybeSingle();

        if (existing) {
          console.log(`Duplicate message skipped: ${messageId}`);
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
          if (replyThread.folder === "inbox" || replyThread.folder === "sent")
            folder = "inbox";
        }
      }

      if (!threadId && references.length > 0) {
        for (const ref of references.reverse()) {
          const { data: refThread } = await supabase
            .from("mail_messages")
            .select("thread_id, mail_threads!inner(id, user_id, tenant_id, folder)")
            .eq("user_id", userId)
            .eq("email_message_id", ref)
            .maybeSingle();

          if (refThread) {
            threadId = refThread.thread_id;
            const t = refThread.mail_threads as any;
            if (t?.tenant_id) tenantId = t.tenant_id;
            if (t?.folder === "inbox" || t?.folder === "sent") folder = "inbox";
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
          if (subjectThread.folder !== "unknown") folder = subjectThread.folder as any;
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
          console.error("Failed to create thread:", threadErr);
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
        console.error("Failed to insert message:", msgErr);
        continue;
      }

      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Inbound webhook error:", error);
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
