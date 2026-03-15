/*
  # Fix email template variable mismatches

  Several email templates use placeholder names that do not match what the
  calling code actually passes.  This causes {{placeholders}} to appear
  un-replaced in sent emails.

  ## Changes

  1. **subscription_cancelled** (de+en) – `{{userName}}` -> `{{user_name}}`
     (caller in cancel-subscription sends `user_name`)
  2. **subscription_started** (de+en) – `{{userName}}` -> `{{user_name}}`
     (caller in stripe-webhook sends `user_name`)
  3. **tenant_password_reset** (de+en) – `{{resetLink}}` -> `{{reset_link}}`
     (caller in request-tenant-password-reset sends `reset_link`)
     Also: add `{{tenant_name}}` as the greeting variable (caller will be
     updated to send `tenant_name`)
  4. **trial_ended** (de) – category stays transactional (already correct in DB)
  5. **trial_ending** (de) – ensure template uses `{{user_name}}` for greeting
     (caller will be updated to send `user_name`)
  6. **Create English versions** of trial_ended and trial_ending

  ## Security
  - No RLS changes
  - No new tables
*/

-- 1. Fix subscription_cancelled: {{userName}} -> {{user_name}}
UPDATE email_templates
SET body_html = REPLACE(body_html, '{{userName}}', '{{user_name}}'),
    body_text = REPLACE(body_text, '{{userName}}', '{{user_name}}')
WHERE template_key = 'subscription_cancelled';

-- 2. Fix subscription_started: {{userName}} -> {{user_name}}
UPDATE email_templates
SET body_html = REPLACE(body_html, '{{userName}}', '{{user_name}}'),
    body_text = REPLACE(body_text, '{{userName}}', '{{user_name}}')
WHERE template_key = 'subscription_started';

-- 3. Fix tenant_password_reset: {{resetLink}} -> {{reset_link}}, {{tenantName}} -> {{tenant_name}}
UPDATE email_templates
SET body_html = REPLACE(REPLACE(body_html, '{{resetLink}}', '{{reset_link}}'), '{{tenantName}}', '{{tenant_name}}'),
    body_text = REPLACE(REPLACE(body_text, '{{resetLink}}', '{{reset_link}}'), '{{tenantName}}', '{{tenant_name}}')
WHERE template_key = 'tenant_password_reset';

-- 4. Fix trial_ending: {{userName}} -> {{user_name}}
UPDATE email_templates
SET body_html = REPLACE(body_html, '{{userName}}', '{{user_name}}'),
    body_text = REPLACE(body_text, '{{userName}}', '{{user_name}}')
WHERE template_key = 'trial_ending';

-- 5. Create English trial_ended template if not exists
INSERT INTO email_templates (template_key, language, subject, category, body_html, body_text)
SELECT
  'trial_ended',
  'en',
  'Your rentably trial has ended',
  'transactional',
  REPLACE(
    REPLACE(
      REPLACE(body_html, 'Ihre rentably Testphase ist beendet', 'Your rentably trial has ended'),
      'Ihre Pro-Testphase ist abgelaufen', 'Your Pro trial has expired'
    ),
    'Jetzt upgraden', 'Upgrade now'
  ),
  'Your rentably trial period has ended. Upgrade to Pro to continue using all features: {{upgrade_link}}'
FROM email_templates
WHERE template_key = 'trial_ended' AND language = 'de'
AND NOT EXISTS (
  SELECT 1 FROM email_templates WHERE template_key = 'trial_ended' AND language = 'en'
);

-- 6. Create English trial_ending template if not exists
INSERT INTO email_templates (template_key, language, subject, category, body_html, body_text)
SELECT
  'trial_ending',
  'en',
  'Your Pro trial ends soon – these features will be removed',
  'transactional',
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(body_html, 'Ihre Pro-Testphase endet bald', 'Your Pro trial ends soon'),
        'Ihre Testphase endet am', 'Your trial ends on'
      ),
      'Jetzt upgraden', 'Upgrade now'
    ),
    'diese Funktionen fallen weg', 'these features will be removed'
  ),
  'Hello {{user_name}}, your rentably Pro trial ends in {{days_remaining}} days ({{trial_end_date}}). Upgrade now to keep all features: {{upgrade_link}}'
FROM email_templates
WHERE template_key = 'trial_ending' AND language = 'de'
AND NOT EXISTS (
  SELECT 1 FROM email_templates WHERE template_key = 'trial_ending' AND language = 'en'
);
