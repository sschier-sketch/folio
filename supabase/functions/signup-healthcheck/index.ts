import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TEST_EMAIL = "healthcheck-probe@rentab.ly";
const TEST_PASSWORD = "HealthCheck!Probe#2026$Secure";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const details: Record<string, unknown> = {};
  let success = false;
  let errorMessage: string | null = null;
  let testUserId: string | null = null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    details.step_1_cleanup_start = true;
    const { data: existingUsers } =
      await supabaseAdmin.auth.admin.listUsers();
    const existingTest = existingUsers?.users?.find(
      (u) => u.email === TEST_EMAIL
    );

    if (existingTest) {
      details.step_1_existing_user_found = existingTest.id;
      await supabaseAdmin.rpc("admin_delete_user_data", {
        target_user_id: existingTest.id,
      });
      await supabaseAdmin.auth.admin.deleteUser(existingTest.id);
      details.step_1_cleanup_done = true;
    } else {
      details.step_1_no_existing_user = true;
    }

    details.step_2_signup_start = true;
    const signupStart = Date.now();

    const { data: signupData, error: signupError } =
      await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          is_healthcheck_user: true,
          newsletter_opt_in: false,
        },
      });

    details.step_2_signup_duration_ms = Date.now() - signupStart;

    if (signupError) {
      throw new Error(`Signup failed: ${signupError.message}`);
    }

    if (!signupData?.user?.id) {
      throw new Error("Signup returned no user");
    }

    testUserId = signupData.user.id;
    details.step_2_user_created = testUserId;

    details.step_3_verify_start = true;
    await new Promise((r) => setTimeout(r, 1500));

    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, role, referral_code")
      .eq("user_id", testUserId)
      .maybeSingle();

    if (settingsError) {
      throw new Error(`user_settings check failed: ${settingsError.message}`);
    }

    if (!userSettings) {
      throw new Error(
        "user_settings row not created - handle_new_user trigger may be broken"
      );
    }

    details.step_3_user_settings_ok = true;
    details.step_3_role = userSettings.role;

    const { data: accountProfile, error: profileError } = await supabaseAdmin
      .from("account_profiles")
      .select("user_id, address_country")
      .eq("user_id", testUserId)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `account_profiles check failed: ${profileError.message}`
      );
    }

    if (!accountProfile) {
      throw new Error(
        "account_profiles row not created - handle_new_user trigger may be broken"
      );
    }

    details.step_3_account_profile_ok = true;

    const { data: authUser, error: authCheckError } =
      await supabaseAdmin.auth.admin.getUserById(testUserId);

    if (authCheckError || !authUser?.user) {
      throw new Error("Auth user verification failed after creation");
    }

    details.step_3_auth_user_verified = true;

    success = true;
    details.step_4_all_checks_passed = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    details.error = errorMessage;
  } finally {
    if (testUserId) {
      try {
        details.step_5_cleanup_start = true;

        await supabaseAdmin
          .from("registration_error_logs")
          .delete()
          .eq("email", TEST_EMAIL);

        await supabaseAdmin
          .from("email_logs")
          .delete()
          .like("idempotency_key", `%${testUserId}%`);

        await supabaseAdmin.rpc("admin_delete_user_data", {
          target_user_id: testUserId,
        });
        await supabaseAdmin.auth.admin.deleteUser(testUserId);
        details.step_5_cleanup_done = true;
      } catch (cleanupErr) {
        details.step_5_cleanup_error =
          cleanupErr instanceof Error
            ? cleanupErr.message
            : String(cleanupErr);
      }
    }

    const durationMs = Date.now() - startTime;

    try {
      await supabaseAdmin.from("signup_health_checks").insert({
        success,
        error_message: errorMessage,
        duration_ms: durationMs,
        details,
      });
    } catch (logErr) {
      console.error("Failed to log healthcheck result:", logErr);
    }

    if (!success) {
      try {
        await supabaseAdmin.rpc("check_signup_funnel_anomaly");
      } catch {
        // best effort
      }
    }

    try {
      await supabaseAdmin.from("signup_health_checks").delete().lt(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );
    } catch {
      // best effort cleanup
    }
  }

  const body = { success, error_message: errorMessage, duration_ms: Date.now() - startTime, details };

  return new Response(JSON.stringify(body), {
    status: success ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
