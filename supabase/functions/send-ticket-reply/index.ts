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
      const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ticket.contact_email,
          templateKey: 'ticket_reply',
          variables: {
            recipientName: ticket.contact_name || '',
            ticketNumber: ticket.ticket_number || '',
            ticketSubject: ticket.subject || '',
            replyMessage: message,
            additionalInfo: '',
            senderName: senderName,
          },
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
