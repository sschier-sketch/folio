/*
  # Fix feedback triggers to use DB email templates

  All three feedback-related triggers were bypassing the admin email templates
  by hardcoding HTML in the trigger and setting `send_raw: true`. This caused
  the templates shown in Admin > Email Templates to appear "unused" even though
  the feature was active.

  ## Changes

  1. `notify_admin_on_new_feedback()` - Now queues email WITHOUT send_raw,
     using template_key and variables so process-email-queue resolves the
     admin_notify_new_feedback template from the DB.

  2. `notify_user_on_feedback_status_change()` - Now queues email WITHOUT
     send_raw, using template_key and variables so process-email-queue resolves
     the feedback_status_changed template from the DB.

  3. `notify_feedback_comment_subscribers()` - Now queues email WITHOUT
     send_raw, using template_key and variables so process-email-queue resolves
     the feedback_new_comment template from the DB.

  ## Template Variables (unchanged)
  - admin_notify_new_feedback: user_email, feedback_text, willing_to_pay
  - feedback_status_changed: user_name, feedback_text, old_status, new_status
  - feedback_new_comment: commenter_name, feedback_text, comment_text

  ## Important Notes
  - The templates in email_templates are now the single source of truth
  - Editing templates in Admin will immediately affect future emails
  - Language resolution uses user_settings.language or account_profiles.language
    with fallback to 'de'
*/

-- 1. Fix notify_admin_on_new_feedback: use template instead of send_raw
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notify boolean;
  v_admin_email text;
  v_user_email text;
  v_feedback_text text;
  v_willing text;
  v_idempotency text;
BEGIN
  BEGIN
    SELECT notify_on_new_feedback, notification_email
    INTO v_notify, v_admin_email
    FROM system_settings
    LIMIT 1;

    IF v_notify IS NOT TRUE OR v_admin_email IS NULL OR v_admin_email = '' THEN
      RETURN NEW;
    END IF;

    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    v_feedback_text := LEFT(NEW.feedback_text, 2000);
    v_willing := CASE WHEN NEW.willing_to_pay THEN 'Ja' ELSE 'Nein' END;
    v_idempotency := 'admin_notify_feedback_' || NEW.id::text;

    INSERT INTO email_logs (
      mail_type, category, to_email, subject, status, idempotency_key, metadata
    ) VALUES (
      'admin_notify_new_feedback',
      'transactional',
      v_admin_email,
      'Neuer Featurewunsch eingegangen',
      'queued',
      v_idempotency,
      jsonb_build_object(
        'template_key', 'admin_notify_new_feedback',
        'language', 'de',
        'variables', jsonb_build_object(
          'user_email', COALESCE(v_user_email, 'Unbekannt'),
          'feedback_text', v_feedback_text,
          'willing_to_pay', v_willing
        )
      )
    );

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admin_on_new_feedback failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;


-- 2. Fix notify_user_on_feedback_status_change: use template instead of send_raw
CREATE OR REPLACE FUNCTION notify_user_on_feedback_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
  v_old_label text;
  v_new_label text;
  v_feedback_excerpt text;
  v_user_language text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT NEW.notify_on_status_change THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF v_user_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    NULLIF(TRIM(ap.first_name || ' ' || ap.last_name), ''),
    split_part(v_user_email, '@', 1)
  )
  INTO v_user_name
  FROM account_profiles ap
  WHERE ap.user_id = NEW.user_id
  LIMIT 1;

  IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
    v_user_name := split_part(v_user_email, '@', 1);
  END IF;

  SELECT COALESCE(
    (SELECT us.language FROM user_settings us WHERE us.user_id = NEW.user_id LIMIT 1),
    'de'
  ) INTO v_user_language;

  v_old_label := CASE OLD.status
    WHEN 'pending' THEN CASE v_user_language WHEN 'en' THEN 'Pending' ELSE 'Ausstehend' END
    WHEN 'reviewed' THEN CASE v_user_language WHEN 'en' THEN 'Under Review' ELSE 'In Pruefung' END
    WHEN 'planned' THEN CASE v_user_language WHEN 'en' THEN 'Planned' ELSE 'Geplant' END
    WHEN 'implemented' THEN CASE v_user_language WHEN 'en' THEN 'Implemented' ELSE 'Umgesetzt' END
    ELSE OLD.status
  END;

  v_new_label := CASE NEW.status
    WHEN 'pending' THEN CASE v_user_language WHEN 'en' THEN 'Pending' ELSE 'Ausstehend' END
    WHEN 'reviewed' THEN CASE v_user_language WHEN 'en' THEN 'Under Review' ELSE 'In Pruefung' END
    WHEN 'planned' THEN CASE v_user_language WHEN 'en' THEN 'Planned' ELSE 'Geplant' END
    WHEN 'implemented' THEN CASE v_user_language WHEN 'en' THEN 'Implemented' ELSE 'Umgesetzt' END
    ELSE NEW.status
  END;

  v_feedback_excerpt := LEFT(NEW.feedback_text, 500);

  BEGIN
    INSERT INTO email_logs (
      to_email, user_id, mail_type, category, subject, status, idempotency_key, metadata
    ) VALUES (
      v_user_email,
      NEW.user_id,
      'feedback_status_changed',
      'transactional',
      'Ihr Featurewunsch: Status aktualisiert',
      'queued',
      'feedback_status_' || NEW.id || '_' || NEW.status || '_' || extract(epoch from now())::text,
      jsonb_build_object(
        'template_key', 'feedback_status_changed',
        'language', v_user_language,
        'variables', jsonb_build_object(
          'user_name', v_user_name,
          'feedback_text', v_feedback_excerpt,
          'old_status', v_old_label,
          'new_status', v_new_label
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue feedback status email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;


-- 3. Fix notify_feedback_comment_subscribers: use template instead of send_raw
CREATE OR REPLACE FUNCTION notify_feedback_comment_subscribers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback RECORD;
  v_commenter_email TEXT;
  v_commenter_name TEXT;
  v_subscriber_email TEXT;
  v_lang TEXT;
  v_feedback_text_short TEXT;
BEGIN
  BEGIN
    SELECT uf.id, uf.feedback_text, uf.user_id, uf.notify_on_status_change
    INTO v_feedback
    FROM user_feedback uf
    WHERE uf.id = NEW.feedback_id;

    IF NOT FOUND THEN RETURN NEW; END IF;

    SELECT COALESCE(au.email, '') INTO v_commenter_email
    FROM auth.users au WHERE au.id = NEW.user_id;

    SELECT COALESCE(
      NULLIF(TRIM(CONCAT(ap.first_name, ' ', ap.last_name)), ''),
      SPLIT_PART(v_commenter_email, '@', 1)
    ) INTO v_commenter_name
    FROM account_profiles ap WHERE ap.user_id = NEW.user_id;

    IF v_commenter_name IS NULL OR v_commenter_name = '' THEN
      v_commenter_name := SPLIT_PART(v_commenter_email, '@', 1);
    END IF;

    v_feedback_text_short := LEFT(v_feedback.feedback_text, 120);
    IF LENGTH(v_feedback.feedback_text) > 120 THEN
      v_feedback_text_short := v_feedback_text_short || '...';
    END IF;

    IF v_feedback.notify_on_status_change = true AND v_feedback.user_id != NEW.user_id THEN
      SELECT COALESCE(us.language, 'de') INTO v_lang
      FROM user_settings us WHERE us.user_id = v_feedback.user_id;
      IF v_lang IS NULL THEN v_lang := 'de'; END IF;

      SELECT COALESCE(au.email, '') INTO v_subscriber_email
      FROM auth.users au WHERE au.id = v_feedback.user_id;

      INSERT INTO email_logs (
        mail_type, category, to_email, user_id, subject, status, metadata
      ) VALUES (
        'feedback_new_comment',
        'informational',
        v_subscriber_email,
        v_feedback.user_id,
        'Neuer Kommentar zu Ihrem Feature-Wunsch',
        'queued',
        jsonb_build_object(
          'template_key', 'feedback_new_comment',
          'language', v_lang,
          'variables', jsonb_build_object(
            'commenter_name', v_commenter_name,
            'feedback_text', v_feedback_text_short,
            'comment_text', LEFT(NEW.comment_text, 500)
          )
        )
      );
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_feedback_comment_subscribers failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
