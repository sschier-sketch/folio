/*
  # Add contact ticket confirmation email template

  1. New Templates
    - `contact_ticket_confirmation` (DE + EN)
      - Sent to users when they submit a support ticket via the contact form
      - Variables: `contact_name`, `ticket_number`, `subject`

  2. Notes
    - This is a transactional email confirming receipt of a support request
    - Previously, only the admin was notified; now the submitter also gets a confirmation
*/

INSERT INTO email_templates (
  template_key, language, template_name, subject, description, variables, category,
  body_html, body_text
)
VALUES
(
  'contact_ticket_confirmation',
  'de',
  'Ticket-Eingangsbestätigung',
  'Ihre Anfrage #{{ticket_number}} wurde empfangen - rentab.ly',
  'Bestätigung an den Absender, wenn ein Support-Ticket eingereicht wird',
  '["contact_name","ticket_number","subject"]',
  'transactional',
  '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket-Eingangsbestätigung</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Wir haben Ihre Anfrage erhalten</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{contact_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">vielen Dank für Ihre Nachricht. Ihr Ticket wurde erfolgreich erstellt und unser Team wird sich so schnell wie möglich bei Ihnen melden.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ticket-Details</p>
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Ticket-Nr.:</strong> #{{ticket_number}}</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Betreff:</strong> {{subject}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0; color: #999; font-size: 13px; line-height: 1.5;">Sollten Sie weitere Informationen ergänzen wollen, antworten Sie einfach auf diese E-Mail oder beziehen Sie sich auf die Ticket-Nummer.</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentab.ly</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px;">Die moderne Lösung für professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'Hallo {{contact_name}},

vielen Dank für Ihre Nachricht. Ihr Ticket wurde erfolgreich erstellt und unser Team wird sich so schnell wie möglich bei Ihnen melden.

Ticket-Nr.: #{{ticket_number}}
Betreff: {{subject}}

Sollten Sie weitere Informationen ergänzen wollen, antworten Sie einfach auf diese E-Mail oder beziehen Sie sich auf die Ticket-Nummer.

Mit freundlichen Grüßen
Ihr rentab.ly Team'
),
(
  'contact_ticket_confirmation',
  'en',
  'Ticket Confirmation',
  'Your request #{{ticket_number}} has been received - rentab.ly',
  'Confirmation sent to the submitter when a support ticket is created',
  '["contact_name","ticket_number","subject"]',
  'transactional',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Confirmation</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">We have received your request</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{contact_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Thank you for reaching out. Your ticket has been created and our team will get back to you as soon as possible.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Details</p>
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Ticket No.:</strong> #{{ticket_number}}</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Subject:</strong> {{subject}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0; color: #999; font-size: 13px; line-height: 1.5;">If you would like to add more information, simply reply to this email or reference your ticket number.</p>
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
  'Hello {{contact_name}},

Thank you for reaching out. Your ticket has been created and our team will get back to you as soon as possible.

Ticket No.: #{{ticket_number}}
Subject: {{subject}}

If you would like to add more information, simply reply to this email or reference your ticket number.

Best regards,
Your rentab.ly Team'
)
ON CONFLICT DO NOTHING;
