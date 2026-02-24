/*
  # Update ticket reply email template for admin support replies

  1. Changes
    - Replaces the existing `ticket_reply` email template (de + en)
    - New template shows the full reply message including signature directly in the email
    - Uses the standard rentably email design with logo linking to https://rentab.ly
    - Removes the "Ticket ansehen" button since contact ticket replies go to external users
    - Template variables: recipientName, ticketNumber, ticketSubject, replyMessage, additionalInfo, senderName

  2. Important Notes
    - The replyMessage variable now includes the signature (appended by the admin UI)
    - The email displays the full message so recipients can read it without logging in
*/

UPDATE email_templates
SET
  subject = 'Re: {{ticketSubject}} [Ticket #{{ticketNumber}}]',
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

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px; line-height: 1.5;">{{additionalInfo}}</p>
<p style="margin: 0; color: #ccc; font-size: 11px;">Betreff: {{ticketSubject}}</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentab.ly</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px;">Die moderne Loesung fuer professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  body_text = 'Antwort auf Ihre Anfrage

Hallo {{recipientName}},

wir haben auf Ihr Ticket #{{ticketNumber}} geantwortet:

{{replyMessage}}

{{additionalInfo}}

Betreff: {{ticketSubject}}

---
rentab.ly - Die moderne Loesung fuer professionelle Immobilienverwaltung',
  variables = '["recipientName", "ticketNumber", "ticketSubject", "replyMessage", "additionalInfo", "senderName"]'::jsonb
WHERE template_key = 'ticket_reply' AND language = 'de';


UPDATE email_templates
SET
  subject = 'Re: {{ticketSubject}} [Ticket #{{ticketNumber}}]',
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

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px; line-height: 1.5;">{{additionalInfo}}</p>
<p style="margin: 0; color: #ccc; font-size: 11px;">Subject: {{ticketSubject}}</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentab.ly</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  body_text = 'Reply to your request

Hello {{recipientName}},

We have responded to your ticket #{{ticketNumber}}:

{{replyMessage}}

{{additionalInfo}}

Subject: {{ticketSubject}}

---
rentab.ly - The modern solution for professional property management',
  variables = '["recipientName", "ticketNumber", "ticketSubject", "replyMessage", "additionalInfo", "senderName"]'::jsonb
WHERE template_key = 'ticket_reply' AND language = 'en';
