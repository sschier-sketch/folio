import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const email = typeof body.email === "string" ? body.email : null;
    const source = typeof body.source === "string" ? body.source : "frontend";
    const step = typeof body.step === "string" ? body.step : null;
    const errorMessage =
      typeof body.error_message === "string"
        ? body.error_message
        : "Unknown error";
    const errorCode =
      typeof body.error_code === "string" ? body.error_code : null;
    const errorDetails =
      typeof body.error_details === "string" ? body.error_details : null;
    const metadata =
      typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : {};

    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;
    delete sanitizedMetadata.access_token;
    delete sanitizedMetadata.refresh_token;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabaseAdmin
      .from("registration_error_logs")
      .insert({
        email: email ? email.substring(0, 320) : null,
        source: source ? source.substring(0, 100) : null,
        step: step ? step.substring(0, 100) : null,
        error_message: errorMessage.substring(0, 2000),
        error_code: errorCode ? errorCode.substring(0, 100) : null,
        error_details: errorDetails ? errorDetails.substring(0, 5000) : null,
        metadata: sanitizedMetadata,
      });

    if (insertError) {
      console.error("Failed to insert registration error log:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to log error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("log-registration-error unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
