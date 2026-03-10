/*
  # Fix feedback status notification trigger using wrong email_logs columns

  1. Bug Fix
    - The `notify_user_on_feedback_status_change()` trigger function was inserting into
      `email_logs` using the old column name `recipient_email` instead of `to_email`
    - It also did not provide required NOT NULL columns `mail_type` and `category`
    - This caused the INSERT to fail silently, rolling back the entire UPDATE transaction
    - As a result, feedback status changes failed for any feedback with
      `notify_on_status_change = true`

  2. Changes
    - Recreate the trigger function with corrected column names:
      `recipient_email` -> `to_email`
      Added `mail_type` = 'transactional'
      Added `category` = 'feedback'
*/

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
  v_template record;
  v_subject text;
  v_html text;
  v_text text;
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

  SELECT COALESCE(ap.first_name || ' ' || ap.last_name, split_part(v_user_email, '@', 1))
  INTO v_user_name
  FROM account_profiles ap
  WHERE ap.user_id = NEW.user_id
  LIMIT 1;

  IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
    v_user_name := split_part(v_user_email, '@', 1);
  END IF;

  SELECT COALESCE(
    (SELECT language FROM account_profiles WHERE user_id = NEW.user_id LIMIT 1),
    'de'
  ) INTO v_user_language;

  v_old_label := CASE OLD.status
    WHEN 'pending' THEN CASE v_user_language WHEN 'en' THEN 'Pending' ELSE 'Ausstehend' END
    WHEN 'reviewed' THEN CASE v_user_language WHEN 'en' THEN 'Under Review' ELSE 'In Prüfung' END
    WHEN 'planned' THEN CASE v_user_language WHEN 'en' THEN 'Planned' ELSE 'Geplant' END
    WHEN 'implemented' THEN CASE v_user_language WHEN 'en' THEN 'Implemented' ELSE 'Umgesetzt' END
    ELSE OLD.status
  END;

  v_new_label := CASE NEW.status
    WHEN 'pending' THEN CASE v_user_language WHEN 'en' THEN 'Pending' ELSE 'Ausstehend' END
    WHEN 'reviewed' THEN CASE v_user_language WHEN 'en' THEN 'Under Review' ELSE 'In Prüfung' END
    WHEN 'planned' THEN CASE v_user_language WHEN 'en' THEN 'Planned' ELSE 'Geplant' END
    WHEN 'implemented' THEN CASE v_user_language WHEN 'en' THEN 'Implemented' ELSE 'Umgesetzt' END
    ELSE NEW.status
  END;

  v_feedback_excerpt := LEFT(NEW.feedback_text, 500);

  SELECT * INTO v_template
  FROM email_templates
  WHERE template_key = 'feedback_status_changed'
    AND language = v_user_language
  LIMIT 1;

  IF v_template IS NULL THEN
    SELECT * INTO v_template
    FROM email_templates
    WHERE template_key = 'feedback_status_changed'
      AND language = 'de'
    LIMIT 1;
  END IF;

  IF v_template IS NULL THEN
    RETURN NEW;
  END IF;

  v_subject := REPLACE(v_template.subject, '{{new_status}}', v_new_label);
  v_html := v_template.body_html;
  v_text := v_template.body_text;

  v_html := REPLACE(v_html, '{{user_name}}', v_user_name);
  v_html := REPLACE(v_html, '{{feedback_text}}', v_feedback_excerpt);
  v_html := REPLACE(v_html, '{{old_status}}', v_old_label);
  v_html := REPLACE(v_html, '{{new_status}}', v_new_label);

  v_text := REPLACE(v_text, '{{user_name}}', v_user_name);
  v_text := REPLACE(v_text, '{{feedback_text}}', v_feedback_excerpt);
  v_text := REPLACE(v_text, '{{old_status}}', v_old_label);
  v_text := REPLACE(v_text, '{{new_status}}', v_new_label);

  INSERT INTO email_logs (
    to_email,
    mail_type,
    category,
    subject,
    body_html,
    body_text,
    template_key,
    status,
    idempotency_key
  ) VALUES (
    v_user_email,
    'transactional',
    'feedback',
    v_subject,
    v_html,
    v_text,
    'feedback_status_changed',
    'queued',
    'feedback_status_' || NEW.id || '_' || NEW.status || '_' || extract(epoch from now())::text
  );

  RETURN NEW;
END;
$$;
