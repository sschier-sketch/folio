/*
  # Add feedback status change notification system

  1. Modified Tables
    - `user_feedback`
      - `notify_on_status_change` (boolean, default false) - User opt-in to receive
        email notifications when the status of their feature request changes

  2. New Email Templates
    - `feedback_status_changed` (DE) - German template for status change notification
    - `feedback_status_changed` (EN) - English template for status change notification
    - Variables: user_name, feedback_text, old_status, new_status, status_label

  3. New Trigger
    - `notify_user_on_feedback_status_change()` - Fires AFTER UPDATE on user_feedback
      when status column changes. Queues an email to the user if notify_on_status_change is true.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feedback' AND column_name = 'notify_on_status_change'
  ) THEN
    ALTER TABLE user_feedback ADD COLUMN notify_on_status_change boolean DEFAULT false NOT NULL;
  END IF;
END $$;

INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'feedback_status_changed',
  'Featurewunsch Status-Änderung',
  'de',
  'Ihr Featurewunsch: Status aktualisiert',
  '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5"><table width="100%" style="background:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table width="600" style="background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#3c8af7;padding:30px;text-align:center"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="180" style="display:inline-block"></a></td></tr><tr><td style="padding:40px 30px"><h1 style="margin:0 0 20px;color:#141719;font-size:22px;font-weight:700">Statusupdate zu Ihrem Featurewunsch</h1><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">Hallo {{user_name}},</p><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">der Status Ihres Featurewunsches wurde aktualisiert:</p><div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:0 0 20px;border-left:4px solid #3c8af7"><p style="color:#141719;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">{{feedback_text}}</p></div><table width="100%" style="margin:0 0 20px"><tr><td style="padding:12px 16px;background:#f0f0f0;border-radius:8px 8px 0 0"><span style="color:#888;font-size:13px">Alter Status:</span><br><strong style="color:#555;font-size:15px">{{old_status}}</strong></td></tr><tr><td style="padding:12px 16px;background:#e8f4e8;border-radius:0 0 8px 8px"><span style="color:#888;font-size:13px">Neuer Status:</span><br><strong style="color:#16a34a;font-size:15px">{{new_status}}</strong></td></tr></table><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 30px">Vielen Dank für Ihren Beitrag zur Verbesserung von rentab.ly!</p></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center;border-top:1px solid #eee"><p style="color:#999;font-size:12px;margin:0">&copy; 2026 <a href="https://rentab.ly" style="color:#3c8af7;text-decoration:none">rentab.ly</a> - Immobilienverwaltung</p></td></tr></table></td></tr></table></body></html>',
  E'Statusupdate zu Ihrem Featurewunsch\n\nHallo {{user_name}},\n\nder Status Ihres Featurewunsches wurde aktualisiert.\n\nIhr Vorschlag:\n{{feedback_text}}\n\nAlter Status: {{old_status}}\nNeuer Status: {{new_status}}\n\nVielen Dank für Ihren Beitrag!\n\nIhr rentab.ly Team',
  '["user_name", "feedback_text", "old_status", "new_status"]',
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'feedback_status_changed',
  'Feature Request Status Changed',
  'en',
  'Your Feature Request: Status Updated',
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5"><table width="100%" style="background:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table width="600" style="background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#3c8af7;padding:30px;text-align:center"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="180" style="display:inline-block"></a></td></tr><tr><td style="padding:40px 30px"><h1 style="margin:0 0 20px;color:#141719;font-size:22px;font-weight:700">Feature Request Status Update</h1><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">Hello {{user_name}},</p><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">The status of your feature request has been updated:</p><div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:0 0 20px;border-left:4px solid #3c8af7"><p style="color:#141719;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">{{feedback_text}}</p></div><table width="100%" style="margin:0 0 20px"><tr><td style="padding:12px 16px;background:#f0f0f0;border-radius:8px 8px 0 0"><span style="color:#888;font-size:13px">Previous Status:</span><br><strong style="color:#555;font-size:15px">{{old_status}}</strong></td></tr><tr><td style="padding:12px 16px;background:#e8f4e8;border-radius:0 0 8px 8px"><span style="color:#888;font-size:13px">New Status:</span><br><strong style="color:#16a34a;font-size:15px">{{new_status}}</strong></td></tr></table><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 30px">Thank you for your contribution to improving rentab.ly!</p></td></tr><tr><td style="padding:20px 30px;background:#f8f9fa;text-align:center;border-top:1px solid #eee"><p style="color:#999;font-size:12px;margin:0">&copy; 2026 <a href="https://rentab.ly" style="color:#3c8af7;text-decoration:none">rentab.ly</a> - Property Management</p></td></tr></table></td></tr></table></body></html>',
  E'Feature Request Status Update\n\nHello {{user_name}},\n\nThe status of your feature request has been updated.\n\nYour suggestion:\n{{feedback_text}}\n\nPrevious Status: {{old_status}}\nNew Status: {{new_status}}\n\nThank you for your contribution!\n\nYour rentab.ly Team',
  '["user_name", "feedback_text", "old_status", "new_status"]',
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

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
    recipient_email,
    subject,
    body_html,
    body_text,
    template_key,
    status,
    idempotency_key
  ) VALUES (
    v_user_email,
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

DROP TRIGGER IF EXISTS trigger_notify_user_on_feedback_status_change ON user_feedback;
CREATE TRIGGER trigger_notify_user_on_feedback_status_change
  AFTER UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_feedback_status_change();
