/*
  # Update all email templates: footer contact info + sender name

  1. Changes
     - Replaces the old minimal footer (only Datenschutz | Impressum) in ALL templates
       with an extended footer that includes:
       * hallo@rentab.ly (mailto link)
       * WhatsApp link (wa.me/493022334468)
       * Support hours: Mo – Fr, 9:00 – 18:00 Uhr
       * Datenschutz | Impressum | Kontakt links
     - Updates body_text footers to match
     - Ensures "Rentably" in alt text is written as "rentably" (lowercase r)

  2. Strategy
     - Use regexp_replace to swap out the old footer block in body_html
     - Use regexp_replace to swap out the old footer line in body_text
     - Skip subscription_started as it was already updated in the previous migration

  Notes
     - The old footer pattern ends at </table></body></html>
     - We replace the <tr><td ...footer> block with the new extended version
*/

UPDATE email_templates
SET
  body_html = regexp_replace(
    body_html,
    '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab\.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1\.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind\.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1\.5;"><a href="https://rentab\.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;\|&nbsp;<a href="https://rentab\.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>',
    '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>
</td></tr>',
    'g'
  ),
  body_text = regexp_replace(
    body_text,
    E'© 2026 rentably \\| Datenschutz: https://rentab\\.ly/datenschutz \\| Impressum: https://rentab\\.ly/impressum',
    E'--\nrentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468\nMo - Fr, 9:00 - 18:00 Uhr\nDatenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
    'g'
  ),
  updated_at = now()
WHERE template_key != 'subscription_started';

UPDATE email_templates
SET
  body_html = replace(body_html, 'alt="Rentably"', 'alt="rentably"'),
  updated_at = now()
WHERE body_html LIKE '%alt="Rentably"%';
