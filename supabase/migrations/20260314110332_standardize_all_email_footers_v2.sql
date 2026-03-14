/*
  # Standardize All Email Footers

  Replaces every footer variant with a single unified footer design matching
  the contact_ticket_confirmation/de template:

  - © 2026 rentably (linked)
  - "Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind."
    (DE) / "You are receiving this email because you are registered as a user at rentably."  (EN)
  - Datenschutz | Impressum  (linked)

  Also fixes the missing </p> tag in contact_ticket_confirmation/de.
*/

-- Define the canonical footer snippets as SQL constants via a helper approach.
-- We'll use direct UPDATE statements replacing the entire footer section.

-- The canonical footer for DE (replaces everything from the border-top tr onward):
-- <tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
-- <p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
-- <p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
-- <p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
-- </td></tr>
-- </table>

-- Strategy: use regexp_replace to swap the last footer tr block in each template.

DO $$
DECLARE
  footer_de TEXT := '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>';

  footer_en TEXT := '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are registered as a user at rentably.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>';

BEGIN
  -- Update all DE templates
  UPDATE email_templates
  SET body_html = regexp_replace(
    body_html,
    '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">.*?</body>\s*</html>',
    footer_de,
    'ns'
  )
  WHERE language = 'de';

  -- Update all EN templates
  UPDATE email_templates
  SET body_html = regexp_replace(
    body_html,
    '<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">.*?</body>\s*</html>',
    footer_en,
    'ns'
  )
  WHERE language = 'en';
END $$;
