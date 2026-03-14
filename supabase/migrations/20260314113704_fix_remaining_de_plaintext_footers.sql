/*
  # Fix remaining 4 DE templates plain-text footer variants

  These 4 templates have different footer endings in body_text:
  - admin_notify_new_feedback / admin_notify_new_ticket: end with "© 2026 rentably - Die moderne Lösung..."
  - tenant_portal_activation / tenant_password_reset: end with just "© 2026 rentably"

  All get the new contact footer appended.
*/

UPDATE email_templates
SET
  body_text = regexp_replace(
    body_text,
    E'© 2026 rentably - Die moderne Lösung für professionelle Immobilienverwaltung',
    E'--\nrentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468\nMo - Fr, 9:00 - 18:00 Uhr\nDatenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
    'g'
  ),
  updated_at = now()
WHERE template_key IN ('admin_notify_new_feedback', 'admin_notify_new_ticket')
  AND language = 'de';

UPDATE email_templates
SET
  body_text = regexp_replace(
    body_text,
    E'© 2026 rentably$',
    E'--\nrentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468\nMo - Fr, 9:00 - 18:00 Uhr\nDatenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
    'g'
  ),
  updated_at = now()
WHERE template_key IN ('tenant_portal_activation', 'tenant_password_reset')
  AND language = 'de';
