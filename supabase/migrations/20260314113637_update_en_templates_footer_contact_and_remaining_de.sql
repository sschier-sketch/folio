/*
  # Update EN templates footer + remaining DE plain text footers

  1. EN templates HTML footer: English variant
     "You are receiving this email because you are registered as a user at rentably."
     -> adds email, WhatsApp, hours, contact link

  2. EN templates body_text: adds contact footer

  3. Remaining DE templates that still have old plain-text footer variants
     (admin_notify_*, tenant_password_reset, tenant_portal_activation)

  4. Also fixes any remaining templates where Rentably has capital R in alt text
*/

UPDATE email_templates
SET
  body_html = regexp_replace(
    body_html,
    '<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1\.5;">You are receiving this email because you are registered as a user at rentably\.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1\.5;"><a href="https://rentab\.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy Policy</a>&nbsp;\|&nbsp;<a href="https://rentab\.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a></p>',
    '<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are registered as a user at rentably.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mon &ndash; Fri, 9:00 AM &ndash; 6:00 PM</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Contact</a></p>',
    'g'
  ),
  updated_at = now()
WHERE language = 'en'
  AND body_html LIKE '%You are receiving this email because you are registered as a user at rentably.%';

UPDATE email_templates
SET
  body_text = regexp_replace(
    body_text,
    E'© 2026 rentably',
    E'--\nrentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468\nMon - Fri, 9:00 AM - 6:00 PM\nPrivacy Policy: https://rentab.ly/datenschutz | Imprint: https://rentab.ly/impressum | Contact: https://rentab.ly/kontakt',
    'g'
  ),
  updated_at = now()
WHERE language = 'en'
  AND body_text LIKE '%© 2026 rentably%';

UPDATE email_templates
SET
  body_text = regexp_replace(
    body_text,
    E'© 2026 rentably \\| Datenschutz: https://rentab\\.ly/datenschutz \\| Impressum: https://rentab\\.ly/impressum',
    E'--\nrentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468\nMo - Fr, 9:00 - 18:00 Uhr\nDatenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
    'g'
  ),
  updated_at = now()
WHERE language = 'de'
  AND body_text LIKE '%© 2026 rentably | Datenschutz%';

UPDATE email_templates
SET
  body_html = regexp_replace(
    body_html,
    '<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1\.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind\.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1\.5;"><a href="https://rentab\.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;\|&nbsp;<a href="https://rentab\.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>',
    '<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>',
    'g'
  ),
  updated_at = now()
WHERE language = 'de'
  AND body_html LIKE '%Sie erhalten diese E-Mail%'
  AND body_html NOT LIKE '%hallo@rentab.ly%';

UPDATE email_templates
SET
  body_html = replace(body_html, 'alt="Rentably"', 'alt="rentably"'),
  updated_at = now()
WHERE body_html LIKE '%alt="Rentably"%';
