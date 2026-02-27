import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RETENTION_DAYS = 15;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const { data: expiredFiles, error: fetchError } = await supabase
      .from("bank_import_files")
      .select("id, storage_path, user_id, filename")
      .lt("uploaded_at", cutoffDate.toISOString())
      .not("storage_path", "is", null)
      .not("status", "eq", "deleted");

    if (fetchError) {
      throw new Error(`Failed to fetch expired files: ${fetchError.message}`);
    }

    let cleanedCount = 0;
    const errors: string[] = [];

    for (const file of expiredFiles || []) {
      try {
        if (file.storage_path) {
          const { error: storageError } = await supabase.storage
            .from("bank-imports")
            .remove([file.storage_path]);

          if (storageError) {
            errors.push(
              `Storage delete for ${file.id}: ${storageError.message}`
            );
          }
        }

        await supabase
          .from("bank_import_files")
          .update({
            storage_path: null,
            rollback_available: true,
          })
          .eq("id", file.id);

        cleanedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`File ${file.id}: ${msg}`);
      }
    }

    const result = {
      cleaned: cleanedCount,
      total_expired: (expiredFiles || []).length,
      errors: errors.length > 0 ? errors : undefined,
      retention_days: RETENTION_DAYS,
      cutoff_date: cutoffDate.toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
