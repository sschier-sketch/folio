import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const formData: ContactFormData = await req.json();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return new Response(
        JSON.stringify({ error: "Alle Felder sind erforderlich" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ error: "Ungültige E-Mail-Adresse" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: ticketNumberData } = await supabase.rpc(
      "generate_contact_ticket_number"
    );
    const ticketNumber = ticketNumberData || `CONTACT-${Date.now()}`;

    const { data: newTicket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        user_id: null,
        ticket_number: ticketNumber,
        ticket_type: "contact",
        subject: formData.subject,
        contact_name: formData.name,
        contact_email: formData.email,
        status: "open",
        priority: "medium",
        category: "inquiry",
        created_by_name: formData.name,
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      throw new Error("Failed to create ticket");
    }

    const { error: messageError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: newTicket.id,
        sender_type: "contact",
        sender_name: formData.name,
        sender_email: formData.email,
        message: formData.message,
      });

    if (messageError) {
      console.error("Error creating message:", messageError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber: ticketNumber,
        message: "Ihre Nachricht wurde erfolgreich gesendet",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in submit-contact-form function:", error);
    return new Response(
      JSON.stringify({
        error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
