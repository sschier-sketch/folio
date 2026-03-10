/*
  # Fix feedback status email notification - category constraint violation

  ## Problem
  The `notify_user_on_feedback_status_change` trigger function inserts into
  `email_logs` with `category = 'feedback'`, but the `email_logs_category_check`
  constraint only allows `'transactional'` or `'informational'`.

  This caused the INSERT to fail silently (caught by exception handler),
  so no notification email was ever queued when a feedback status changed.

  ## Fix
  - Change the category from `'feedback'` to `'transactional'` (correct type
    for a status change notification triggered by admin action)
  - Add `'feedback'` as a tag in the metadata `jsonb` so filtering by
    feedback-related emails remains possible
*/

CREATE OR REPLACE FUNCTION notify_user_on_feedback_status_change()
RETURNS TRIGGER
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

  v_html := REPLACE(v_html, '{{user_name}}', v_user_name);
  v_html := REPLACE(v_html, '{{feedback_text}}', v_feedback_excerpt);
  v_html := REPLACE(v_html, '{{old_status}}', v_old_label);
  v_html := REPLACE(v_html, '{{new_status}}', v_new_label);

  BEGIN
    INSERT INTO email_logs (
      to_email,
      mail_type,
      category,
      subject,
      status,
      idempotency_key,
      metadata
    ) VALUES (
      v_user_email,
      'transactional',
      'transactional',
      v_subject,
      'queued',
      'feedback_status_' || NEW.id || '_' || NEW.status || '_' || extract(epoch from now())::text,
      jsonb_build_object(
        'send_raw', true,
        'raw_html', v_html,
        'trigger', 'db_trigger',
        'template_key', 'feedback_status_changed',
        'source', 'feedback'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue feedback status email: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
