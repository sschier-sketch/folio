/*
  # Add admin email notification for new feature requests

  1. New Settings
    - `notify_on_new_feedback` (boolean) added to system_settings

  2. New Email Templates
    - `admin_notify_new_feedback` template (DE + EN)

  3. New Trigger
    - `notify_admin_on_new_feedback()` fires AFTER INSERT on user_feedback
    - Queues email to notification_email if enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'notify_on_new_feedback'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN notify_on_new_feedback boolean DEFAULT true;
  END IF;
END $$;

UPDATE system_settings SET notify_on_new_feedback = true WHERE notify_on_new_feedback IS NULL;

INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'admin_notify_new_feedback',
  'Admin: Neuer Featurewunsch',
  'de',
  'Neuer Featurewunsch eingegangen',
  '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"></head><body><div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#faf8f8;border-radius:8px;padding:30px"><div style="text-align:center;padding-bottom:20px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></div><hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px 0"><h1 style="color:#3c8af7;font-size:24px;margin:0 0 20px 0">Neuer Featurewunsch</h1><div style="color:#141719;font-size:14px;line-height:1.6"><p>Ein neuer Featurewunsch wurde eingereicht:</p><div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0 0 8px 0;font-weight:bold;color:#1a5dc8">Details:</p><p style="margin:0 0 6px 0"><strong>Benutzer:</strong> {{user_email}}</p><p style="margin:0 0 6px 0"><strong>Zahlungsbereitschaft:</strong> {{willing_to_pay}}</p><p style="margin:0 0 0 0"><strong>Featurewunsch:</strong></p><p style="margin:8px 0 0 0;white-space:pre-wrap">{{feedback_text}}</p></div><div style="text-align:center;padding:20px 0"><a href="https://rentab.ly/admin?view=feedback" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:14px 40px;text-decoration:none;font-weight:bold;font-size:16px">Im Admin ansehen</a></div></div><hr style="border:none;border-top:1px solid #ddd;margin:20px 0 0 0"><p style="color:#666;font-size:12px;text-align:center">&copy; 2026 rentab.ly</p></div></body></html>',
  E'Neuer Featurewunsch\n\nEin neuer Featurewunsch wurde eingereicht:\n\nBenutzer: {{user_email}}\nZahlungsbereitschaft: {{willing_to_pay}}\n\nFeaturewunsch:\n{{feedback_text}}\n\nIm Admin ansehen: https://rentab.ly/admin?view=feedback',
  '["user_email", "feedback_text", "willing_to_pay"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

INSERT INTO email_templates (template_key, template_name, language, subject, body_html, body_text, variables, category)
VALUES (
  'admin_notify_new_feedback',
  'Admin: New Feature Request',
  'en',
  'New Feature Request Submitted',
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head><body><div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#faf8f8;border-radius:8px;padding:30px"><div style="text-align:center;padding-bottom:20px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></div><hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px 0"><h1 style="color:#3c8af7;font-size:24px;margin:0 0 20px 0">New Feature Request</h1><div style="color:#141719;font-size:14px;line-height:1.6"><p>A new feature request has been submitted:</p><div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0 0 8px 0;font-weight:bold;color:#1a5dc8">Details:</p><p style="margin:0 0 6px 0"><strong>User:</strong> {{user_email}}</p><p style="margin:0 0 6px 0"><strong>Willing to pay:</strong> {{willing_to_pay}}</p><p style="margin:0 0 0 0"><strong>Feature request:</strong></p><p style="margin:8px 0 0 0;white-space:pre-wrap">{{feedback_text}}</p></div><div style="text-align:center;padding:20px 0"><a href="https://rentab.ly/admin?view=feedback" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:14px 40px;text-decoration:none;font-weight:bold;font-size:16px">View in Admin</a></div></div><hr style="border:none;border-top:1px solid #ddd;margin:20px 0 0 0"><p style="color:#666;font-size:12px;text-align:center">&copy; 2026 rentab.ly</p></div></body></html>',
  E'New Feature Request\n\nA new feature request has been submitted:\n\nUser: {{user_email}}\nWilling to pay: {{willing_to_pay}}\n\nFeature request:\n{{feedback_text}}\n\nView in Admin: https://rentab.ly/admin?view=feedback',
  '["user_email", "feedback_text", "willing_to_pay"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

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
  v_html text;
  v_subject text;
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

  v_subject := 'Neuer Featurewunsch eingegangen';
  v_idempotency := 'admin_notify_feedback_' || NEW.id::text;

  v_html := '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"></head><body>'
    || '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#faf8f8;border-radius:8px;padding:30px">'
    || '<div style="text-align:center;padding-bottom:20px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></div>'
    || '<hr style="border:none;border-top:1px solid #ddd;margin:0 0 20px 0">'
    || '<h1 style="color:#3c8af7;font-size:24px;margin:0 0 20px 0">Neuer Featurewunsch</h1>'
    || '<div style="color:#141719;font-size:14px;line-height:1.6">'
    || '<p>Ein neuer Featurewunsch wurde eingereicht:</p>'
    || '<div style="background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0">'
    || '<p style="margin:0 0 8px 0;font-weight:bold;color:#1a5dc8">Details:</p>'
    || '<p style="margin:0 0 6px 0"><strong>Benutzer:</strong> ' || COALESCE(v_user_email, 'Unbekannt') || '</p>'
    || '<p style="margin:0 0 6px 0"><strong>Zahlungsbereitschaft:</strong> ' || v_willing || '</p>'
    || '<p style="margin:0 0 0 0"><strong>Featurewunsch:</strong></p>'
    || '<p style="margin:8px 0 0 0;white-space:pre-wrap">' || replace(replace(v_feedback_text, '&', '&amp;'), '<', '&lt;') || '</p>'
    || '</div>'
    || '<div style="text-align:center;padding:20px 0"><a href="https://rentab.ly/admin?view=feedback" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:14px 40px;text-decoration:none;font-weight:bold;font-size:16px">Im Admin ansehen</a></div>'
    || '</div>'
    || '<hr style="border:none;border-top:1px solid #ddd;margin:20px 0 0 0">'
    || '<p style="color:#666;font-size:12px;text-align:center">&copy; 2026 rentab.ly</p>'
    || '</div></body></html>';

  INSERT INTO email_logs (
    mail_type, category, to_email, subject, status, idempotency_key,
    metadata
  ) VALUES (
    'admin_notify_new_feedback',
    'transactional',
    v_admin_email,
    v_subject,
    'queued',
    v_idempotency,
    jsonb_build_object(
      'send_raw', true,
      'raw_html', v_html,
      'template_key', 'admin_notify_new_feedback',
      'variables', jsonb_build_object(
        'user_email', COALESCE(v_user_email, 'Unbekannt'),
        'feedback_text', v_feedback_text,
        'willing_to_pay', v_willing
      )
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_new_feedback ON user_feedback;

CREATE TRIGGER trg_notify_admin_on_new_feedback
  AFTER INSERT ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_new_feedback();
