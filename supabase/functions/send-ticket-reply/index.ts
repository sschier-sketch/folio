import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TicketReplyRequest {
  ticketId: string;
  message: string;
  senderName: string;
  senderEmail: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticketId, message, senderName, senderEmail }: TicketReplyRequest = await req.json();

    if (!ticketId || !message || !senderName || !senderEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: ticketId,
        sender_type: 'landlord',
        sender_name: senderName,
        sender_email: senderEmail,
        message: message,
      }]);

    if (messageError) {
      throw new Error('Failed to save message: ' + messageError.message);
    }

    if (ticket.ticket_type === 'contact' && ticket.contact_email) {
      const emailSubject = `Re: ${ticket.subject} [Ticket #${ticket.ticket_number}]`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Antwort auf Ihre Anfrage</h2>
          <p>Hallo ${ticket.contact_name},</p>
          <p>vielen Dank für Ihre Nachricht. Hier ist unsere Antwort:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Ticket #${ticket.ticket_number}<br>
            Betreff: ${ticket.subject}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px;">
            Diese E-Mail wurde automatisch gesendet. Bitte antworten Sie direkt auf diese E-Mail, wenn Sie weitere Fragen haben.
          </p>
        </div>
      `;

      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ticket.contact_email,
          subject: emailSubject,
          html: emailHtml,
          text: message,
          replyTo: senderEmail,
          userId: ticket.user_id || undefined,
          useUserAlias: !!ticket.user_id,
          mailType: 'ticket_reply',
          category: 'transactional',
        }),
      });

      if (sendEmailResponse.ok) {
        const emailData = await sendEmailResponse.json();

        await supabase
          .from('tickets')
          .update({
            email_thread_id: emailData.emailId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
      } else {
        const errorData = await sendEmailResponse.json();
        console.error('Failed to send email via send-email:', errorData);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reply sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error sending ticket reply:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send reply'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
