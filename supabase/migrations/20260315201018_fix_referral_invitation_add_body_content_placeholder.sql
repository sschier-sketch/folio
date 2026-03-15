/*
  # Fix referral_invitation template: add {{body_content}} placeholder

  The `send-referral-invitation` edge function builds a custom `bodyContent`
  from the user's preview text and replaces `{{body_content}}` in the template.
  However, the template never had this placeholder, so the user's personal
  message was silently discarded.

  ## Changes
  1. Replace the static body text in `referral_invitation` (de + en) with
     `{{body_content}}` so the edge function can inject the user's custom
     message.
  2. The edge function already handles fallback content when no custom text
     is provided.
*/

-- German template: replace the static body between heading and CTA with {{body_content}}
UPDATE email_templates
SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Entdecke rentably</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Entdecke rentably</h1>
{{body_content}}
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{referral_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt registrieren</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'referral_invitation' AND language = 'de';

-- English template
UPDATE email_templates
SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discover rentably</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Discover rentably</h1>
{{body_content}}
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{referral_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; margin-top: 4px;">Register now</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You received this email because you are a registered rentably user.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mon &ndash; Fri, 9:00 &ndash; 18:00</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Contact</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'referral_invitation' AND language = 'en';
