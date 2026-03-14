/*
  # Update subscription_started: development box visual style

  - Removes the icon and heading from the "weiterentwickelt" box
  - Changes box background to white (#ffffff)
  - Changes border to dashed blue (#3c8af7)
  - Applies to both DE and EN
*/

UPDATE email_templates
SET
  body_html = replace(
    replace(
      body_html,
      '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8faff; border: 1px solid #e8f0fe; border-radius: 8px;">
<tr><td style="padding: 18px 20px;">
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 13px; font-weight: 700;">&#128640; rentably wird stetig weiterentwickelt</p>
<p style="margin: 0; color: #555; font-size: 13px; line-height: 1.7;">Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.</p>
</td></tr>
</table>',
      '<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px dashed #3c8af7; border-radius: 8px;">
<tr><td style="padding: 18px 20px;">
<p style="margin: 0; color: #555; font-size: 13px; line-height: 1.7;">Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.</p>
</td></tr>
</table>'
    ),
    '',
    ''
  ),
  updated_at = now()
WHERE template_key = 'subscription_started';
