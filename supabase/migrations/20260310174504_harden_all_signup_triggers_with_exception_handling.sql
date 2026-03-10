/*
  # Harden all signup triggers with defensive exception handling

  ## Problem
  "Database error saving new user" occurs when ANY of the 6 AFTER INSERT triggers
  on auth.users raises an unhandled exception. Supabase Auth runs all triggers in
  one transaction -- if any fails, user creation is rolled back entirely.

  Previously only `handle_new_user` had defensive exception handling.
  The other 5 triggers were completely unprotected.

  ## Root Cause
  Any unhandled exception in these triggers blocks the entire signup:
  - `create_affiliate_profile`: plain INSERT, no ON CONFLICT, no EXCEPTION
  - `create_default_dunning_templates`: plain INSERT of 3 rows, no ON CONFLICT, no EXCEPTION
  - `handle_new_user_mailbox`: calls generate_unique_alias() which can RAISE EXCEPTION
  - `notify_admin_on_new_registration`: reads system_settings, inserts email_logs, no EXCEPTION
  - `create_billing_info`: has ON CONFLICT but no EXCEPTION handler for other failures

  ## Fix
  Wrap the body of each trigger in BEGIN/EXCEPTION blocks.
  On failure: log to registration_error_logs, then RETURN NEW (allow user creation).
  This matches the pattern already used in handle_new_user.

  ## What is NOT changed
  - handle_new_user (already hardened)
  - No table schema changes
  - No RLS policy changes
  - No constraint changes
  - No frontend changes
*/

-- 1. Harden create_affiliate_profile
CREATE OR REPLACE FUNCTION create_affiliate_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  BEGIN
    LOOP
      new_code := upper(substring(md5(random()::text) from 1 for 8));
      SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    INSERT INTO affiliates (user_id, affiliate_code)
    VALUES (NEW.id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details, metadata
      ) VALUES (
        COALESCE(NEW.email, 'unknown'),
        'db_trigger',
        'create_affiliate_profile',
        SQLERRM,
        SQLSTATE,
        'Exception in create_affiliate_profile trigger',
        jsonb_build_object('user_id', NEW.id, 'trigger', 'create_affiliate_profile')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'create_affiliate_profile: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 2. Harden create_billing_info
CREATE OR REPLACE FUNCTION create_billing_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.billing_info (
      user_id,
      billing_email,
      subscription_plan,
      subscription_status,
      trial_started_at,
      trial_ends_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      'free',
      'active',
      now(),
      now() + interval '30 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details, metadata
      ) VALUES (
        COALESCE(NEW.email, 'unknown'),
        'db_trigger',
        'create_billing_info',
        SQLERRM,
        SQLSTATE,
        'Exception in create_billing_info trigger',
        jsonb_build_object('user_id', NEW.id, 'trigger', 'create_billing_info')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'create_billing_info: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 3. Harden handle_new_user_mailbox
CREATE OR REPLACE FUNCTION handle_new_user_mailbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
BEGIN
  BEGIN
    base_alias := sanitize_email_to_alias(NEW.email);
    final_alias := generate_unique_alias(base_alias);

    INSERT INTO user_mailboxes (user_id, alias_localpart)
    VALUES (NEW.id, final_alias)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details, metadata
      ) VALUES (
        COALESCE(NEW.email, 'unknown'),
        'db_trigger',
        'handle_new_user_mailbox',
        SQLERRM,
        SQLSTATE,
        'Exception in handle_new_user_mailbox trigger',
        jsonb_build_object('user_id', NEW.id, 'trigger', 'handle_new_user_mailbox')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user_mailbox: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 4. Harden notify_admin_on_new_registration
CREATE OR REPLACE FUNCTION notify_admin_on_new_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notify boolean;
  v_email text;
  v_user_email text;
  v_now_text text;
  v_html text;
  v_subject text;
  v_idempotency_key text;
  v_existing_id uuid;
BEGIN
  BEGIN
    IF NEW.raw_user_meta_data->>'is_healthcheck_user' = 'true' THEN
      RETURN NEW;
    END IF;

    SELECT notify_on_new_registration, notification_email
    INTO v_notify, v_email
    FROM public.system_settings
    WHERE id = 1;

    IF v_notify IS NOT TRUE OR v_email IS NULL OR v_email = '' THEN
      RETURN NEW;
    END IF;

    v_user_email := COALESCE(NEW.email, 'unbekannt');

    v_idempotency_key := 'admin_notify_registration:' || NEW.id::text;

    SELECT id INTO v_existing_id
    FROM public.email_logs
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN NEW;
    END IF;

    v_now_text := to_char(
      NOW() AT TIME ZONE 'Europe/Berlin',
      'DD.MM.YYYY, HH24:MI'
    ) || ' Uhr';

    v_subject := 'Neue Registrierung: ' || v_user_email;

    v_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">'
      || '<h2 style="color:#1a1a2e;margin-bottom:16px">Neue Registrierung</h2>'
      || '<p style="color:#4a4a4a;font-size:15px;line-height:1.6">Ein neuer Benutzer hat sich bei Rentably registriert:</p>'
      || '<div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0">'
      || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>E-Mail:</strong> ' || v_user_email || '</p>'
      || '<p style="margin:0;color:#1a1a2e"><strong>Zeitpunkt:</strong> ' || v_now_text || '</p>'
      || '</div>'
      || '<p style="color:#888;font-size:12px;margin-top:24px">Diese Benachrichtigung wurde automatisch gesendet.</p>'
      || '</div>';

    INSERT INTO public.email_logs (
      id,
      mail_type,
      category,
      to_email,
      user_id,
      subject,
      provider,
      status,
      idempotency_key,
      metadata,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'admin_new_registration',
      'transactional',
      v_email,
      NEW.id,
      v_subject,
      'resend',
      'queued',
      v_idempotency_key,
      jsonb_build_object(
        'send_raw', true,
        'raw_html', v_html,
        'trigger', 'db_trigger'
      ),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details, metadata
      ) VALUES (
        COALESCE(NEW.email, 'unknown'),
        'db_trigger',
        'notify_admin_on_new_registration',
        SQLERRM,
        SQLSTATE,
        'Exception in notify_admin_on_new_registration trigger',
        jsonb_build_object('user_id', NEW.id, 'trigger', 'notify_admin_on_new_registration')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_admin_on_new_registration: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 5. Harden create_default_dunning_templates
CREATE OR REPLACE FUNCTION create_default_dunning_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO dunning_email_templates (user_id, dunning_level, subject, message)
    VALUES
    (
      NEW.id,
      1,
      'Freundliche Erinnerung: Mietzahlung',
      'Sehr geehrte/r [TENANT_NAME],

wir möchten Sie freundlich daran erinnern, dass die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] zum [DUE_DATE] fällig war.

Möglicherweise haben Sie die Überweisung vergessen. Bitte überweisen Sie den Betrag zeitnah.

Mit freundlichen Grüßen'
    ),
    (
      NEW.id,
      2,
      'Zahlungsaufforderung: Ausstehende Miete',
      'Sehr geehrte/r [TENANT_NAME],

trotz freundlicher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir fordern Sie hiermit formell auf, den Betrag innerhalb von 7 Tagen zu überweisen. Andernfalls müssen wir weitere Schritte einleiten.

Mit freundlichen Grüßen'
    ),
    (
      NEW.id,
      3,
      'MAHNUNG: Überfällige Mietzahlung',
      'Sehr geehrte/r [TENANT_NAME],

trotz mehrfacher Erinnerung ist die Miete für [PROPERTY_NAME] in Höhe von [AMOUNT] noch nicht eingegangen.

Wir mahnen Sie hiermit offiziell und fordern Sie auf, den ausstehenden Betrag zzgl. Mahngebühren in Höhe von 5,00 € (Gesamt: [TOTAL_AMOUNT]) innerhalb von 5 Tagen zu überweisen.

Bei weiterer Nichtzahlung behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen'
    )
    ON CONFLICT (user_id, dunning_level) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO registration_error_logs (
        email, source, step, error_message, error_code, error_details, metadata
      ) VALUES (
        COALESCE(NEW.email, 'unknown'),
        'db_trigger',
        'create_default_dunning_templates',
        SQLERRM,
        SQLSTATE,
        'Exception in create_default_dunning_templates trigger',
        jsonb_build_object('user_id', NEW.id, 'trigger', 'create_default_dunning_templates')
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'create_default_dunning_templates: failed to log error: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;
