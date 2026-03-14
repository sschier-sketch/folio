/*
  # Delete unused login_link email templates

  The `login_link` template_key is a duplicate of `magic_link` and is never
  referenced by any edge function or application code. It only causes confusion
  in the admin UI (shows as "inactive"). This migration removes both language
  variants (de + en).
*/

DELETE FROM email_templates WHERE template_key = 'login_link';
