/*
  # Fix ticket_reply email templates

  - DE HTML: Hinweis auf direkte Antwort ist bereits vorhanden – Wortlaut leicht verbessert
  - EN HTML: Hinweis war auf Deutsch – auf Englisch übersetzt
  - DE Plain: Hinweis expliziter formuliert (Antwort wird dem Ticket zugeordnet)
  - EN Plain: Hinweis expliziter formuliert
*/

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket-Antwort</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Antwort auf Ihre Anfrage</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{recipientName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">wir haben auf Ihr Ticket <strong style="color: #1E1E24;">#{{ticketNumber}}</strong> geantwortet:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">{{replyMessage}}</p>
</div>
</td></tr>

<tr><td style="padding: 12px 32px 0;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Sie k&ouml;nnen direkt auf diese E-Mail antworten &ndash; Ihre Nachricht wird dann automatisch diesem Ticket zugeordnet.</p>
</td></tr>

<tr><td style="padding: 12px 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px; line-height: 1.5;">{{additionalInfo}}</p>
<p style="margin: 0; color: #ccc; font-size: 11px;">Betreff: {{ticketSubject}}</p>
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
</html>',
  body_text = 'Antwort auf Ihre Anfrage

Hallo {{recipientName}},

wir haben auf Ihr Ticket #{{ticketNumber}} geantwortet.

Betreff: {{ticketSubject}}

{{replyMessage}}

{{additionalInfo}}

Sie können direkt auf diese E-Mail antworten – Ihre Nachricht wird dann automatisch diesem Ticket zugeordnet.

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mo - Fr, 9:00 - 18:00 Uhr
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt'
WHERE template_key = 'ticket_reply' AND language = 'de';

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Reply</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Reply to your request</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{recipientName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">We have responded to your ticket <strong style="color: #1E1E24;">#{{ticketNumber}}</strong>:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">{{replyMessage}}</p>
</div>
</td></tr>

<tr><td style="padding: 12px 32px 0;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">You can reply directly to this email &ndash; your message will automatically be added to this ticket.</p>
</td></tr>

<tr><td style="padding: 12px 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px; line-height: 1.5;">{{additionalInfo}}</p>
<p style="margin: 0; color: #ccc; font-size: 11px;">Subject: {{ticketSubject}}</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are registered as a user at rentably.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mon &ndash; Fri, 9:00 AM &ndash; 6:00 PM</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Contact</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  body_text = 'Reply to Your Request

Hello {{recipientName}},

We have responded to your ticket #{{ticketNumber}}.

Subject: {{ticketSubject}}

{{replyMessage}}

{{additionalInfo}}

You can reply directly to this email – your message will automatically be added to this ticket.

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mon - Fri, 9:00 AM - 6:00 PM
Privacy Policy: https://rentab.ly/datenschutz | Imprint: https://rentab.ly/impressum | Contact: https://rentab.ly/kontakt'
WHERE template_key = 'ticket_reply' AND language = 'en';
