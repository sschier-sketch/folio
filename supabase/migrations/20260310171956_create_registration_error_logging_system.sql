/*
  # Create registration error logging and alerting system

  1. New Tables
    - `registration_error_logs`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz, default now())
      - `email` (text, nullable) - the email address that failed to register
      - `source` (text, nullable) - where the error originated (frontend, trigger, edge_function)
      - `step` (text, nullable) - which step failed (auth_signup, handle_new_user, profile_creation, etc.)
      - `error_message` (text, not null) - the error message
      - `error_code` (text, nullable) - error code if available
      - `error_details` (text, nullable) - additional technical details
      - `metadata` (jsonb, nullable) - extra context (user agent, referral code, etc.)
      - `resolved` (boolean, default false) - whether the error has been acknowledged

  2. Security
    - Enable RLS on `registration_error_logs`
    - Only admins can read error logs
    - Service role can insert (for edge functions)
    - No public access

  3. Functions
    - `notify_admin_on_registration_error()` - trigger function that queues an alert email
      when a new error is logged. Uses the existing email queue system.
      Wrapped in exception handler so it never blocks the error logging itself.

  4. Important Notes
    - This system is purely additive - it does NOT modify the existing signup flow
    - The trigger on registration_error_logs sends alerts asynchronously via email queue
    - If the alert email fails, the error log entry is still preserved
*/

CREATE TABLE IF NOT EXISTS registration_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text,
  source text,
  step text,
  error_message text NOT NULL,
  error_code text,
  error_details text,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false
);

ALTER TABLE registration_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view registration errors"
  ON registration_error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update registration errors"
  ON registration_error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert registration errors"
  ON registration_error_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read registration errors"
  ON registration_error_logs
  FOR SELECT
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_registration_error_logs_created_at
  ON registration_error_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_error_logs_resolved
  ON registration_error_logs (resolved)
  WHERE resolved = false;

CREATE OR REPLACE FUNCTION notify_admin_on_registration_error()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notify boolean;
  v_admin_email text;
  v_now_text text;
  v_html text;
  v_subject text;
BEGIN
  BEGIN
    SELECT notification_email
    INTO v_admin_email
    FROM system_settings
    WHERE id = 1;

    IF v_admin_email IS NULL OR v_admin_email = '' THEN
      RETURN NEW;
    END IF;

    v_now_text := to_char(
      NOW() AT TIME ZONE 'Europe/Berlin',
      'DD.MM.YYYY, HH24:MI'
    ) || ' Uhr';

    v_subject := 'KRITISCH: Registrierung fehlgeschlagen';

    v_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">'
      || '<h2 style="color:#dc2626;margin-bottom:16px">Registrierung fehlgeschlagen</h2>'
      || '<p style="color:#4a4a4a;font-size:15px;line-height:1.6">Ein Fehler ist bei der Registrierung aufgetreten. Bitte umgehend prüfen!</p>'
      || '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">'
      || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Zeitpunkt:</strong> ' || v_now_text || '</p>'
      || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>E-Mail:</strong> ' || COALESCE(NEW.email, 'nicht verfügbar') || '</p>'
      || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Quelle:</strong> ' || COALESCE(NEW.source, '-') || '</p>'
      || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>Schritt:</strong> ' || COALESCE(NEW.step, '-') || '</p>'
      || '<p style="margin:0 0 8px;color:#dc2626"><strong>Fehlermeldung:</strong> ' || LEFT(NEW.error_message, 500) || '</p>';

    IF NEW.error_details IS NOT NULL THEN
      v_html := v_html || '<p style="margin:0;color:#6b7280;font-size:13px"><strong>Details:</strong> ' || LEFT(NEW.error_details, 1000) || '</p>';
    END IF;

    v_html := v_html
      || '</div>'
      || '<p style="color:#dc2626;font-size:14px;font-weight:bold;margin-top:16px">Solange dieser Fehler besteht, können sich keine neuen Benutzer registrieren. Facebook/Meta Ads laufen möglicherweise ins Leere.</p>'
      || '<p style="color:#888;font-size:12px;margin-top:24px">Diese Benachrichtigung wurde automatisch gesendet.</p>'
      || '</div>';

    INSERT INTO email_logs (
      mail_type,
      category,
      to_email,
      subject,
      provider,
      status,
      idempotency_key,
      metadata
    ) VALUES (
      'admin_registration_error',
      'transactional',
      v_admin_email,
      v_subject,
      'resend',
      'queued',
      'reg_error_alert:' || NEW.id::text,
      jsonb_build_object(
        'send_raw', true,
        'raw_html', v_html,
        'trigger', 'db_trigger'
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admin_on_registration_error failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_on_registration_error
  AFTER INSERT ON registration_error_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_registration_error();
