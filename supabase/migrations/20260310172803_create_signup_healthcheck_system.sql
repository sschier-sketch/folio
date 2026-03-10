/*
  # Create signup healthcheck monitoring system

  1. New Tables
    - `signup_health_checks`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz, default now())
      - `success` (boolean, not null) - whether the synthetic signup test passed
      - `error_message` (text, nullable) - error message if failed
      - `duration_ms` (integer, nullable) - how long the test took in milliseconds
      - `details` (jsonb, default '{}') - step-by-step results

  2. New Functions
    - `check_signup_health_status()` - returns aggregated health stats for the admin dashboard
      (last success, last failure, error count 24h, last real registration, etc.)
    - `check_signup_funnel_anomaly()` - analyzes real signup patterns to detect anomalies
      (high failure rate, zero successes despite attempts, etc.)
      Queues an alert email if an anomaly is detected.

  3. Security
    - Enable RLS on `signup_health_checks`
    - Only admins can read health checks
    - Service role can insert (for the edge function)

  4. Important Notes
    - This system is purely additive - it does NOT modify the existing signup flow
    - The synthetic test is executed by an edge function, results stored here
    - Anomaly detection runs alongside the healthcheck and examines
      registration_error_logs + auth.users for pattern analysis
    - Retention: old health check rows auto-cleaned after 30 days
*/

CREATE TABLE IF NOT EXISTS signup_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  error_message text,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE signup_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view signup health checks"
  ON signup_health_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert signup health checks"
  ON signup_health_checks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read signup health checks"
  ON signup_health_checks
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete signup health checks"
  ON signup_health_checks
  FOR DELETE
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_signup_health_checks_created_at
  ON signup_health_checks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signup_health_checks_success
  ON signup_health_checks (success, created_at DESC);

CREATE OR REPLACE FUNCTION check_signup_health_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_last_success timestamptz;
  v_last_failure timestamptz;
  v_last_failure_msg text;
  v_errors_24h bigint;
  v_checks_24h bigint;
  v_failures_24h bigint;
  v_last_real_signup timestamptz;
  v_real_signups_24h bigint;
  v_status text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Zugriff verweigert';
  END IF;

  SELECT created_at INTO v_last_success
  FROM signup_health_checks
  WHERE success = true
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT created_at, error_message INTO v_last_failure, v_last_failure_msg
  FROM signup_health_checks
  WHERE success = false
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT COUNT(*) INTO v_errors_24h
  FROM registration_error_logs
  WHERE created_at > now() - interval '24 hours'
    AND resolved = false;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE success = false)
  INTO v_checks_24h, v_failures_24h
  FROM signup_health_checks
  WHERE created_at > now() - interval '24 hours';

  SELECT created_at INTO v_last_real_signup
  FROM auth.users
  WHERE raw_user_meta_data->>'is_healthcheck_user' IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT COUNT(*) INTO v_real_signups_24h
  FROM auth.users
  WHERE created_at > now() - interval '24 hours'
    AND raw_user_meta_data->>'is_healthcheck_user' IS NULL;

  IF v_last_failure IS NOT NULL
    AND (v_last_success IS NULL OR v_last_failure > v_last_success) THEN
    v_status := 'critical';
  ELSIF v_errors_24h > 3 THEN
    v_status := 'warning';
  ELSIF v_last_success IS NULL AND v_checks_24h = 0 THEN
    v_status := 'unknown';
  ELSE
    v_status := 'healthy';
  END IF;

  v_result := jsonb_build_object(
    'status', v_status,
    'last_success', v_last_success,
    'last_failure', v_last_failure,
    'last_failure_message', v_last_failure_msg,
    'errors_24h', v_errors_24h,
    'checks_24h', v_checks_24h,
    'failures_24h', v_failures_24h,
    'last_real_signup', v_last_real_signup,
    'real_signups_24h', v_real_signups_24h
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION check_signup_funnel_anomaly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_errors_1h bigint;
  v_errors_6h bigint;
  v_successes_6h bigint;
  v_last_healthcheck_failure timestamptz;
  v_last_healthcheck_success timestamptz;
  v_admin_email text;
  v_html text;
  v_now_text text;
  v_idempotency_key text;
  v_existing_id uuid;
BEGIN
  SELECT COUNT(*) INTO v_errors_1h
  FROM registration_error_logs
  WHERE created_at > now() - interval '1 hour'
    AND resolved = false;

  SELECT COUNT(*) INTO v_errors_6h
  FROM registration_error_logs
  WHERE created_at > now() - interval '6 hours'
    AND resolved = false;

  SELECT COUNT(*) INTO v_successes_6h
  FROM auth.users
  WHERE created_at > now() - interval '6 hours'
    AND raw_user_meta_data->>'is_healthcheck_user' IS NULL;

  SELECT created_at INTO v_last_healthcheck_failure
  FROM signup_health_checks
  WHERE success = false
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT created_at INTO v_last_healthcheck_success
  FROM signup_health_checks
  WHERE success = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_errors_1h < 3
    AND NOT (v_errors_6h >= 5 AND v_successes_6h = 0)
    AND NOT (v_last_healthcheck_failure IS NOT NULL
             AND (v_last_healthcheck_success IS NULL OR v_last_healthcheck_failure > v_last_healthcheck_success))
  THEN
    RETURN;
  END IF;

  v_idempotency_key := 'funnel_anomaly:' || date_trunc('hour', now())::text;

  SELECT id INTO v_existing_id
  FROM email_logs
  WHERE idempotency_key = v_idempotency_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT notification_email INTO v_admin_email
  FROM system_settings WHERE id = 1;

  IF v_admin_email IS NULL OR v_admin_email = '' THEN
    RETURN;
  END IF;

  v_now_text := to_char(
    NOW() AT TIME ZONE 'Europe/Berlin',
    'DD.MM.YYYY, HH24:MI'
  ) || ' Uhr';

  v_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">'
    || '<h2 style="color:#dc2626;margin-bottom:16px">Signup-Funnel Anomalie erkannt</h2>'
    || '<p style="color:#4a4a4a;font-size:15px;line-height:1.6">Es wurden ungewoehnliche Muster im Registrierungs-Funnel festgestellt.</p>'
    || '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">'
    || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Zeitpunkt:</strong> ' || v_now_text || '</p>'
    || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Fehler letzte Stunde:</strong> ' || v_errors_1h || '</p>'
    || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Fehler letzte 6h:</strong> ' || v_errors_6h || '</p>'
    || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Erfolgreiche Registrierungen letzte 6h:</strong> ' || v_successes_6h || '</p>'
    || '<p style="margin:0;color:#1a1a2e"><strong>Letzter Healthcheck-Fehler:</strong> '
    || COALESCE(to_char(v_last_healthcheck_failure AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY HH24:MI'), 'keiner') || '</p>'
    || '</div>'
    || '<p style="color:#dc2626;font-size:14px;font-weight:bold;margin-top:16px">Bitte pruefen Sie umgehend, ob die Registrierung funktioniert. Facebook/Meta Ads laufen moeglicherweise ins Leere.</p>'
    || '<p style="color:#888;font-size:12px;margin-top:24px">Diese Benachrichtigung wird maximal einmal pro Stunde gesendet.</p>'
    || '</div>';

  INSERT INTO email_logs (
    mail_type, category, to_email, subject, provider, status,
    idempotency_key, metadata
  ) VALUES (
    'admin_signup_funnel_anomaly', 'transactional', v_admin_email,
    'KRITISCH: Signup-Funnel Anomalie erkannt',
    'resend', 'queued', v_idempotency_key,
    jsonb_build_object(
      'send_raw', true,
      'raw_html', v_html,
      'trigger', 'db_function'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM signup_health_checks
  WHERE created_at < now() - interval '30 days';
END;
$$;
