/*
  # Create Feedback Comments System

  1. New Tables
    - `feedback_comments`
      - `id` (uuid, primary key)
      - `feedback_id` (uuid, FK -> user_feedback)
      - `user_id` (uuid, FK -> auth.users)
      - `comment_text` (text, the comment content)
      - `is_admin_comment` (boolean, whether posted by admin)
      - `edited_at` (timestamptz, null until edited)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `feedback_comments`
    - Authenticated users can read all comments
    - Users can insert their own comments
    - Users can update their own comments
    - Admins can update any comment
    - Admins can delete any comment
    - Users can delete their own comments

  3. Email Notification
    - Add email template `feedback_new_comment` for notifying subscribers
    - DB trigger to queue email when a comment is posted on feedback with notify subscribers

  4. Admin Edit Permissions for Feedback
    - Admins can update feedback_text on any user_feedback (already have update policy)
*/

-- 1. Create feedback_comments table
CREATE TABLE IF NOT EXISTS feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  is_admin_comment boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_user_id ON feedback_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_created_at ON feedback_comments(created_at);

ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read comments
CREATE POLICY "Authenticated users can read feedback comments"
  ON feedback_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own feedback comments"
  ON feedback_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own feedback comments"
  ON feedback_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any comment
CREATE POLICY "Admins can update any feedback comment"
  ON feedback_comments
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Users can delete their own comments
CREATE POLICY "Users can delete own feedback comments"
  ON feedback_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any feedback comment"
  ON feedback_comments
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- 2. Add comment_count to user_feedback for quick display
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN comment_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Trigger to auto-update comment_count on user_feedback
CREATE OR REPLACE FUNCTION update_feedback_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_feedback SET comment_count = comment_count + 1 WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_feedback SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_feedback_comment_count ON feedback_comments;
CREATE TRIGGER trg_update_feedback_comment_count
  AFTER INSERT OR DELETE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_comment_count();

-- 4. Trigger to notify subscribers when a new comment is posted
CREATE OR REPLACE FUNCTION notify_feedback_comment_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback RECORD;
  v_commenter_email TEXT;
  v_commenter_name TEXT;
  v_subscriber RECORD;
  v_template RECORD;
  v_lang TEXT;
  v_html TEXT;
  v_subject TEXT;
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

    -- Notify the feedback author if they opted in and they are not the commenter
    IF v_feedback.notify_on_status_change = true AND v_feedback.user_id != NEW.user_id THEN
      SELECT COALESCE(us.language, 'de') INTO v_lang
      FROM user_settings us WHERE us.user_id = v_feedback.user_id;
      IF v_lang IS NULL THEN v_lang := 'de'; END IF;

      SELECT et.subject, et.body_html INTO v_template
      FROM email_templates et
      WHERE et.template_key = 'feedback_new_comment'
        AND et.language = v_lang
      LIMIT 1;

      IF v_template IS NULL THEN
        SELECT et.subject, et.body_html INTO v_template
        FROM email_templates et
        WHERE et.template_key = 'feedback_new_comment'
          AND et.language = 'de'
        LIMIT 1;
      END IF;

      IF v_template.subject IS NOT NULL THEN
        SELECT COALESCE(au.email, '') INTO v_subscriber.email
        FROM auth.users au WHERE au.id = v_feedback.user_id;

        v_subject := REPLACE(v_template.subject, '{{commenter_name}}', v_commenter_name);
        v_html := REPLACE(v_template.body_html, '{{commenter_name}}', v_commenter_name);
        v_html := REPLACE(v_html, '{{feedback_text}}', v_feedback_text_short);
        v_html := REPLACE(v_html, '{{comment_text}}', LEFT(NEW.comment_text, 500));

        INSERT INTO email_logs (
          mail_type, category, to_email, user_id, subject, status, metadata
        ) VALUES (
          'feedback_new_comment',
          'informational',
          v_subscriber.email,
          v_feedback.user_id,
          v_subject,
          'queued',
          jsonb_build_object(
            'send_raw', true,
            'raw_html', v_html,
            'trigger', 'db_trigger',
            'template_key', 'feedback_new_comment',
            'source', 'feedback_comment'
          )
        );
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_feedback_comment_subscribers failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_feedback_comment_subscribers ON feedback_comments;
CREATE TRIGGER trg_notify_feedback_comment_subscribers
  AFTER INSERT ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_comment_subscribers();

-- 5. Insert email templates for feedback_new_comment
INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'feedback_new_comment',
  'Neuer Kommentar zu Feature-Wunsch',
  'de',
  'Neuer Kommentar zu Ihrem Feature-Wunsch',
  '<!DOCTYPE html><html><body style="font-family:Manrope,Arial,sans-serif;background:#f7f8fa;padding:40px 0;"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;"><img src="https://rentably.de/rentably-logo-new.svg" alt="Rentably" style="height:32px;margin-bottom:24px;" /><h2 style="color:#1a1a2e;margin:0 0 16px;">Neuer Kommentar</h2><p style="color:#6b7280;line-height:1.6;">{{commenter_name}} hat einen Kommentar zu Ihrem Feature-Wunsch hinterlassen:</p><div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #e5e7eb;"><p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Ihr Wunsch:</p><p style="color:#1a1a2e;margin:0;">{{feedback_text}}</p></div><div style="background:#eff4fe;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #2563eb;"><p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Kommentar:</p><p style="color:#1a1a2e;margin:0;">{{comment_text}}</p></div><a href="https://rentably.de/dashboard?view=feedback" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:16px;">Zum Feature-Board</a><p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sie erhalten diese E-Mail, weil Sie Benachrichtigungen fuer diesen Feature-Wunsch aktiviert haben.</p></div></body></html>',
  'Neuer Kommentar von {{commenter_name}} zu Ihrem Feature-Wunsch: "{{feedback_text}}". Kommentar: {{comment_text}}. Zum Feature-Board: https://rentably.de/dashboard?view=feedback',
  '["commenter_name", "feedback_text", "comment_text"]'::jsonb,
  'informational'
)
ON CONFLICT (template_key, language) DO NOTHING;

INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'feedback_new_comment',
  'New Comment on Feature Request',
  'en',
  'New comment on your feature request',
  '<!DOCTYPE html><html><body style="font-family:Manrope,Arial,sans-serif;background:#f7f8fa;padding:40px 0;"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;"><img src="https://rentably.de/rentably-logo-new.svg" alt="Rentably" style="height:32px;margin-bottom:24px;" /><h2 style="color:#1a1a2e;margin:0 0 16px;">New Comment</h2><p style="color:#6b7280;line-height:1.6;">{{commenter_name}} has commented on your feature request:</p><div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #e5e7eb;"><p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Your request:</p><p style="color:#1a1a2e;margin:0;">{{feedback_text}}</p></div><div style="background:#eff4fe;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #2563eb;"><p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Comment:</p><p style="color:#1a1a2e;margin:0;">{{comment_text}}</p></div><a href="https://rentably.de/dashboard?view=feedback" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-top:16px;">Go to Feature Board</a><p style="color:#9ca3af;font-size:12px;margin-top:24px;">You receive this email because you opted in for notifications on this feature request.</p></div></body></html>',
  'New comment from {{commenter_name}} on your feature request: "{{feedback_text}}". Comment: {{comment_text}}. Go to Feature Board: https://rentably.de/dashboard?view=feedback',
  '["commenter_name", "feedback_text", "comment_text"]'::jsonb,
  'informational'
)
ON CONFLICT (template_key, language) DO NOTHING;
