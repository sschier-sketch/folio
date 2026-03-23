/*
  # Fix feedback comment notification: show "Team rentably" for admin comments

  1. Changes
    - Updated `notify_feedback_comment_subscribers` trigger function
    - When the commenter is an admin (exists in `admin_users` table), 
      the commenter name is set to "Team rentably" instead of their personal name
    - This prevents internal admin names from being exposed to users

  2. Important Notes
    - Only affects future email notifications, not past ones
    - Admin detection uses the existing `admin_users` table
*/

CREATE OR REPLACE FUNCTION public.notify_feedback_comment_subscribers()
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
v_idempotency TEXT;
v_is_admin BOOLEAN;
BEGIN
BEGIN
SELECT uf.id, uf.feedback_text, uf.user_id, uf.notify_on_status_change
INTO v_feedback
FROM user_feedback uf
WHERE uf.id = NEW.feedback_id;

IF NOT FOUND THEN RETURN NEW; END IF;

SELECT EXISTS (
  SELECT 1 FROM admin_users au WHERE au.user_id = NEW.user_id
) INTO v_is_admin;

IF v_is_admin THEN
  v_commenter_name := 'Team rentably';
ELSE
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
END IF;

v_feedback_text_short := LEFT(v_feedback.feedback_text, 120);
IF LENGTH(v_feedback.feedback_text) > 120 THEN
v_feedback_text_short := v_feedback_text_short || '...';
END IF;

v_idempotency := 'feedback_comment_' || NEW.id::text;

IF v_feedback.notify_on_status_change = true AND v_feedback.user_id != NEW.user_id THEN
SELECT COALESCE(us.language, 'de') INTO v_lang
FROM user_settings us WHERE us.user_id = v_feedback.user_id;
IF v_lang IS NULL THEN v_lang := 'de'; END IF;

SELECT COALESCE(au.email, '') INTO v_subscriber_email
FROM auth.users au WHERE au.id = v_feedback.user_id;

INSERT INTO email_logs (
mail_type, category, to_email, user_id, subject, status, idempotency_key, metadata
) VALUES (
'feedback_new_comment',
'informational',
v_subscriber_email,
v_feedback.user_id,
'Neuer Kommentar zu Ihrem Feature-Wunsch',
'queued',
v_idempotency,
jsonb_build_object(
'template_key', 'feedback_new_comment',
'language', v_lang,
'variables', jsonb_build_object(
'commenter_name', v_commenter_name,
'feedback_text', v_feedback_text_short,
'comment_text', LEFT(NEW.comment_text, 500)
)
)
)
ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
END IF;

EXCEPTION WHEN OTHERS THEN
RAISE WARNING 'notify_feedback_comment_subscribers failed: %', SQLERRM;
END;

RETURN NEW;
END;
$$;
