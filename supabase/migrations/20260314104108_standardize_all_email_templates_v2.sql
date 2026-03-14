/*
  # Standardize all email templates to unified visual design

  All transactional email templates are updated to match the
  "contact_ticket_confirmation" reference design:
  - White card (600px) centered on #f5f5f5 background
  - White header with centered logo, separated by thin #eee border
  - Body padding: 28px 32px
  - Headings: #1E1E24, 20px, bold
  - Body text: #555, 14px, line-height 1.6
  - Info/detail boxes: #f8f9fb bg with 3px #3c8af7 left border
  - CTA buttons: #3c8af7, border-radius 50px, white text
  - Footer: #eee top border, centered, #999 text 12px + #bbb 11px
  - No colored header bar, no outer background card
  - All existing variables/links/buttons preserved exactly
*/

-- ─── admin_notify_new_feedback DE ────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neuer Featurewunsch</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Neuer Featurewunsch</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ein neuer Featurewunsch wurde eingereicht:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Details</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Benutzer:</strong> {{user_email}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Zahlungsbereitschaft:</strong> {{willing_to_pay}}</p>
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Featurewunsch:</strong></p>
<p style="margin: 4px 0 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{feedback_text}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/admin?view=feedback" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Im Admin ansehen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'admin_notify_new_feedback' AND language = 'de';

-- ─── admin_notify_new_feedback EN ────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Feature Request</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">New Feature Request</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">A new feature request has been submitted:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Details</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>User:</strong> {{user_email}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Willing to pay:</strong> {{willing_to_pay}}</p>
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Feature request:</strong></p>
<p style="margin: 4px 0 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{feedback_text}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/admin?view=feedback" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">View in Admin</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'admin_notify_new_feedback' AND language = 'en';

-- ─── admin_notify_new_ticket DE ───────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neues Support-Ticket</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Neues Support-Ticket</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Es wurde ein neues Support-Ticket eingereicht.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ticket-Details</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Ticket-Nr.:</strong> #{{ticketNumber}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Name:</strong> {{contactName}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>E-Mail:</strong> {{contactEmail}}</p>
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Betreff:</strong> {{subject}}</p>
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Nachricht</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{message}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'admin_notify_new_ticket' AND language = 'de';

-- ─── admin_notify_new_ticket EN ───────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Support Ticket</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">New Support Ticket</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">A new support ticket has been submitted.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Details</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Ticket No.:</strong> #{{ticketNumber}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Name:</strong> {{contactName}}</p>
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Email:</strong> {{contactEmail}}</p>
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Subject:</strong> {{subject}}</p>
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{message}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'admin_notify_new_ticket' AND language = 'en';

-- ─── contract_signed DE ───────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mietvertrag unterzeichnet</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Mietvertrag unterzeichnet</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihr Mietvertrag f&uuml;r <strong style="color: #1E1E24;">{{propertyAddress}}</strong> wurde erfolgreich unterzeichnet. Sie k&ouml;nnen die Details jederzeit in Ihrem Dashboard einsehen.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'contract_signed' AND language = 'de';

-- ─── contract_signed EN ───────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rental Contract Signed</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Rental Contract Signed</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Your rental contract for <strong style="color: #1E1E24;">{{propertyAddress}}</strong> has been successfully signed. You can view the details at any time in your dashboard.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'contract_signed' AND language = 'en';

-- ─── feedback_new_comment DE ──────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neuer Kommentar</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Neuer Kommentar zu Ihrem Feature-Wunsch</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{commenter_name}}</strong> hat einen Kommentar zu Ihrem Feature-Wunsch hinterlassen:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #ddd; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 12px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ihr Wunsch</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">{{feedback_text}}</p>
</div>
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 20px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Kommentar</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;">{{comment_text}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 8px; text-align: center;">
<a href="https://rentab.ly/dashboard?view=feedback" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700;">Zum Feature-Board</a>
</td></tr>

<tr><td style="padding: 16px 32px 28px;">
<p style="margin: 0; color: #bbb; font-size: 12px; line-height: 1.5; text-align: center;">Sie erhalten diese E-Mail, weil Sie Benachrichtigungen f&uuml;r diesen Feature-Wunsch aktiviert haben.</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'feedback_new_comment' AND language = 'de';

-- ─── feedback_new_comment EN ──────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Comment</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">New Comment on Your Feature Request</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{commenter_name}}</strong> has commented on your feature request:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #ddd; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 12px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your request</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">{{feedback_text}}</p>
</div>
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 20px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Comment</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;">{{comment_text}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 8px; text-align: center;">
<a href="https://rentab.ly/dashboard?view=feedback" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700;">Go to Feature Board</a>
</td></tr>

<tr><td style="padding: 16px 32px 28px;">
<p style="margin: 0; color: #bbb; font-size: 12px; line-height: 1.5; text-align: center;">You receive this email because you opted in for notifications on this feature request.</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'feedback_new_comment' AND language = 'en';

-- ─── feedback_status_changed DE ───────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Featurewunsch Status-&Auml;nderung</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Statusupdate zu Ihrem Featurewunsch</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">der Status Ihres Featurewunsches wurde aktualisiert:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 16px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ihr Wunsch</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{feedback_text}}</p>
</div>
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
<tr>
<td width="50%" style="padding: 12px 16px; background-color: #f8f9fb; border-radius: 6px 0 0 6px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Alter Status</p>
<p style="margin: 0; color: #555; font-size: 14px; font-weight: 600;">{{old_status}}</p>
</td>
<td width="4" style="background-color: #fff;"></td>
<td width="50%" style="padding: 12px 16px; background-color: #edf7ed; border-radius: 0 6px 6px 0;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Neuer Status</p>
<p style="margin: 0; color: #16a34a; font-size: 14px; font-weight: 600;">{{new_status}}</p>
</td>
</tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Vielen Dank f&uuml;r Ihren Beitrag zur Verbesserung von rentably!</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'feedback_status_changed' AND language = 'de';

-- ─── feedback_status_changed EN ───────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Feature Request Status Update</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Feature Request Status Update</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">The status of your feature request has been updated:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 16px;">
<p style="margin: 0 0 6px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your request</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{feedback_text}}</p>
</div>
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
<tr>
<td width="50%" style="padding: 12px 16px; background-color: #f8f9fb; border-radius: 6px 0 0 6px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Previous Status</p>
<p style="margin: 0; color: #555; font-size: 14px; font-weight: 600;">{{old_status}}</p>
</td>
<td width="4" style="background-color: #fff;"></td>
<td width="50%" style="padding: 12px 16px; background-color: #edf7ed; border-radius: 0 6px 6px 0;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">New Status</p>
<p style="margin: 0; color: #16a34a; font-size: 14px; font-weight: 600;">{{new_status}}</p>
</td>
</tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Thank you for your contribution to improving rentably!</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'feedback_status_changed' AND language = 'en';

-- ─── login_link DE ────────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ihr Anmelde-Link</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ihr Anmelde-Link</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Sie haben einen Anmelde-Link angefordert. Klicken Sie auf die Schaltfl&auml;che unten, um sich anzumelden. Dieser Link ist aus Sicherheitsgr&uuml;nden nur 15 Minuten g&uuml;ltig.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{login_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt anmelden</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Falls Sie diesen Link nicht angefordert haben, k&ouml;nnen Sie diese E-Mail ignorieren.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'login_link' AND language = 'de';

-- ─── login_link EN ────────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Login Link</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Your Login Link</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">You have requested a login link. Click the button below to log in. For security reasons, this link is only valid for 15 minutes.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{login_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Log in now</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">If you did not request this link, you can safely ignore this email.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'login_link' AND language = 'en';

-- ─── magic_link DE ────────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ihr Anmelde-Link</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ihr Anmelde-Link</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Sie haben einen Magic Link zur Anmeldung bei rentably angefordert. Klicken Sie auf die Schaltfl&auml;che unten, um sich sicher anzumelden. Dieser Link ist aus Sicherheitsgr&uuml;nden nur 15 Minuten g&uuml;ltig.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{magic_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt anmelden</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Falls Sie diesen Link nicht angefordert haben, k&ouml;nnen Sie diese E-Mail ignorieren.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'magic_link' AND language = 'de';

-- ─── magic_link EN ────────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Login Link</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Your Login Link</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">You have requested a magic link to log in to rentably. Click the button below to log in securely. For security reasons, this link is only valid for 15 minutes.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{magic_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Log in now</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">If you did not request this link, you can safely ignore this email.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'magic_link' AND language = 'en';

-- ─── password_reset DE ────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Passwort zur&uuml;cksetzen</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Passwort zur&uuml;cksetzen</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Sie haben eine Anfrage zum Zur&uuml;cksetzen Ihres Passworts gestellt. Klicken Sie auf die Schaltfl&auml;che unten, um ein neues Passwort zu vergeben. Der Link ist aus Sicherheitsgr&uuml;nden nur kurze Zeit g&uuml;ltig.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{resetLink}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Passwort zur&uuml;cksetzen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Falls Sie diese Anfrage nicht gestellt haben, k&ouml;nnen Sie diese E-Mail ignorieren.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'password_reset' AND language = 'de';

-- ─── password_reset EN ────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your password</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Reset your password</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">You have requested to reset your password. Click the button below to set a new password. For security reasons, this link is only valid for a short time.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{resetLink}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Reset Password</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">If you did not request this, you can safely ignore this email.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'password_reset' AND language = 'en';

-- ─── referral_invitation DE ───────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{referrer_name}}</strong> empfiehlt Ihnen rentably &ndash; die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung.</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Registrieren Sie sich jetzt und profitieren Sie von allen Vorteilen.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{referral_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt registrieren</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'referral_invitation' AND language = 'de';

-- ─── referral_invitation EN ───────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{referrer_name}}</strong> recommends rentably &ndash; the modern solution for professional property management.</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Register now and benefit from all features.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{referral_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Register now</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'referral_invitation' AND language = 'en';

-- ─── registration DE ──────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Willkommen bei rentably</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Willkommen bei rentably!</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">vielen Dank f&uuml;r Ihre Registrierung bei rentably! Wir freuen uns, Sie als neues Mitglied begr&uuml;&szlig;en zu d&uuml;rfen. Viel Erfolg mit Ihrer Immobilienverwaltung!</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/login" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zur Anmeldung</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'registration' AND language = 'de';

-- ─── registration EN ──────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to rentably</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Welcome to rentably!</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Thank you for registering at rentably! We are happy to welcome you as a new member. Good luck with your property management!</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/login" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Login</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'registration' AND language = 'en';

-- ─── rent_increase_notification DE ───────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mieterhöhungsankündigung</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ank&uuml;ndigung Mieterhöhung</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">hiermit m&ouml;chten wir Sie &uuml;ber eine Mieterhöhung f&uuml;r <strong style="color: #1E1E24;">{{propertyAddress}}</strong> informieren. Weitere Details finden Sie in Ihrem Dashboard.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'rent_increase_notification' AND language = 'de';

-- ─── rent_increase_notification EN ───────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rent Increase Notification</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Rent Increase Notification</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">We would like to inform you about a rent increase for <strong style="color: #1E1E24;">{{propertyAddress}}</strong>. Further details can be found in your dashboard.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'rent_increase_notification' AND language = 'en';

-- ─── rent_payment_reminder DE ─────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mietzahlungserinnerung</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Erinnerung: Mietzahlung</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">wir m&ouml;chten Sie freundlich an die ausstehende Mietzahlung f&uuml;r <strong style="color: #1E1E24;">{{propertyAddress}}</strong> erinnern. Bitte &uuml;berweisen Sie den f&auml;lligen Betrag zeitnah.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'rent_payment_reminder' AND language = 'de';

-- ─── rent_payment_reminder EN ─────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rent Payment Reminder</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Reminder: Rent Payment</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">We would like to kindly remind you of the outstanding rent payment for <strong style="color: #1E1E24;">{{propertyAddress}}</strong>. Please transfer the due amount promptly.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'rent_payment_reminder' AND language = 'en';

-- ─── subscription_cancelled DE ────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Abonnement gek&uuml;ndigt</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Abonnement gek&uuml;ndigt</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihr Abonnement wurde gek&uuml;ndigt. Sie k&ouml;nnen die Premium-Funktionen noch bis zum Ende Ihres aktuellen Abrechnungszeitraums nutzen. Wir w&uuml;rden uns freuen, Sie in Zukunft wieder begr&uuml;&szlig;en zu d&uuml;rfen.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'subscription_cancelled' AND language = 'de';

-- ─── subscription_cancelled EN ────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscription Cancelled</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Subscription Cancelled</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Your subscription has been cancelled. You can continue to use the premium features until the end of your current billing period. We would be happy to welcome you back in the future.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'subscription_cancelled' AND language = 'en';

-- ─── subscription_started DE ──────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Premium-Abonnement aktiviert</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Premium-Abonnement aktiviert</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihr Premium-Abonnement wurde erfolgreich aktiviert!</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 20px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Ihr Plan</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; font-weight: 700;">{{planName}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'subscription_started' AND language = 'de';

-- ─── subscription_started EN ──────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Premium Subscription Activated</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Premium Subscription Activated</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Your premium subscription has been successfully activated!</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 20px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Your plan</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; font-weight: 700;">{{planName}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Go to Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'subscription_started' AND language = 'en';

-- ─── tenant_password_reset DE ─────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Passwort zur&uuml;cksetzen - Mieterportal</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Passwort zur&uuml;cksetzen &ndash; Mieterportal</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Sie haben eine Anfrage zum Zur&uuml;cksetzen Ihres Passworts f&uuml;r das Mieterportal gestellt. Klicken Sie auf die Schaltfl&auml;che unten, um ein neues Passwort zu vergeben. Der Link ist 1 Stunde g&uuml;ltig.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{resetLink}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Passwort zur&uuml;cksetzen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">Falls Sie diese Anfrage nicht gestellt haben, k&ouml;nnen Sie diese E-Mail ignorieren.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'tenant_password_reset' AND language = 'de';

-- ─── tenant_password_reset EN ─────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Password - Tenant Portal</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Reset Password &ndash; Tenant Portal</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">You have requested to reset your password for the tenant portal. Click the button below to set a new password. The link is valid for 1 hour.</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{resetLink}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Reset Password</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.5;">If you did not request this, you can safely ignore this email.</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'tenant_password_reset' AND language = 'en';

-- ─── tenant_portal_activation DE ─────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ihr Zugang zum Mieterportal</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ihr Zugang zum Mieterportal</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenant_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihr Vermieter <strong style="color: #1E1E24;">{{landlord_name}}</strong> hat f&uuml;r Sie einen Zugang zum Mieterportal eingerichtet.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ihre Immobilie</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;">{{property_address}}</p>
</div>

<div style="background-color: #f8f9fb; border-left: 3px solid #ddd; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 10px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">So aktivieren Sie Ihren Zugang</p>
<ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>Klicken Sie auf &quot;Konto jetzt aktivieren&quot;</li>
<li>Geben Sie Ihre E-Mail-Adresse ein: <strong style="color: #1E1E24;">{{tenant_email}}</strong></li>
<li>Legen Sie ein pers&ouml;nliches Passwort fest</li>
<li>Nach der Aktivierung k&ouml;nnen Sie sich jederzeit anmelden</li>
</ol>
</div>

<div style="margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #1E1E24; font-size: 14px; font-weight: 600;">Im Mieterportal k&ouml;nnen Sie:</p>
<ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>Ihre Vertragsdaten und Mietinformationen einsehen</li>
<li>Dokumente herunterladen</li>
<li>Z&auml;hlerst&auml;nde erfassen und melden</li>
<li>Anfragen und Tickets an Ihren Vermieter senden</li>
<li>Ihre Kontaktdaten verwalten</li>
</ul>
</div>
</td></tr>

<tr><td style="padding: 0 32px 16px; text-align: center;">
<a href="{{portal_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700;">Konto jetzt aktivieren</a>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 13px; line-height: 1.5;">Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter:</p>
<p style="margin: 0; color: #555; font-size: 13px;">{{landlord_name}} &ndash; <a href="mailto:{{landlord_email}}" style="color: #3c8af7; text-decoration: none;">{{landlord_email}}</a></p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'tenant_portal_activation' AND language = 'de';

-- ─── tenant_portal_activation EN ─────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Access to the Tenant Portal</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Your Access to the Tenant Portal</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenant_name}}</strong>,</p>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Your landlord <strong style="color: #1E1E24;">{{landlord_name}}</strong> has set up tenant portal access for you.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your property</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;">{{property_address}}</p>
</div>

<div style="background-color: #f8f9fb; border-left: 3px solid #ddd; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 10px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">How to activate your account</p>
<ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>Click &quot;Activate account now&quot; below</li>
<li>Enter your email address: <strong style="color: #1E1E24;">{{tenant_email}}</strong></li>
<li>Set a personal password</li>
<li>After activation, you can log in to the tenant portal anytime</li>
</ol>
</div>

<div style="margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #1E1E24; font-size: 14px; font-weight: 600;">In the tenant portal you can:</p>
<ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>View your contract details and rent information</li>
<li>Download documents</li>
<li>Submit meter readings</li>
<li>Create tickets and send messages to your landlord</li>
<li>Manage your contact information</li>
</ul>
</div>
</td></tr>

<tr><td style="padding: 0 32px 16px; text-align: center;">
<a href="{{portal_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700;">Activate account now</a>
</td></tr>

<tr><td style="padding: 0 32px 28px;">
<p style="margin: 0 0 4px; color: #999; font-size: 13px; line-height: 1.5;">If you have any questions, please contact your landlord directly:</p>
<p style="margin: 0; color: #555; font-size: 13px;">{{landlord_name}} &ndash; <a href="mailto:{{landlord_email}}" style="color: #3c8af7; text-decoration: none;">{{landlord_email}}</a></p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'tenant_portal_activation' AND language = 'en';

-- ─── trial_ended DE ───────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Testphase abgelaufen</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ihre Testphase ist abgelaufen</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihre 30-t&auml;gige Testphase ist am <strong style="color: #1E1E24;">{{trial_end_date}}</strong> abgelaufen. Ihre Daten bleiben erhalten. Upgraden Sie auf Pro, um wieder vollen Zugriff auf alle Features zu erhalten.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Mit Pro erhalten Sie</p>
<ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>Unbegrenzte Immobilien und Mieter</li>
<li>Erweiterte Finanzanalysen</li>
<li>Mieterportal</li>
<li>Dokument-Management</li>
<li>Und vieles mehr...</li>
</ul>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{upgrade_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt upgraden</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'trial_ended' AND language = 'de';

-- ─── trial_ending DE ──────────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Testphase endet bald</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Ihre Testphase endet bald</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;">Ihre 30-t&auml;gige Testphase endet in <strong style="color: #1E1E24;">{{days_remaining}} Tagen</strong> am <strong style="color: #1E1E24;">{{trial_end_date}}</strong>. Upgraden Sie jetzt auf Pro, um alle Features weiterhin ohne Unterbrechung nutzen zu k&ouml;nnen.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pro-Plan</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;">Nur 9&nbsp;EUR/Monat f&uuml;r unbegrenzte Immobilien, Mieter und alle Pro-Features!</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{upgrade_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Jetzt auf Pro upgraden</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'trial_ending' AND language = 'de';

-- ─── user_invitation DE ───────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Einladung zu rentably</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Einladung zu rentably</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{inviter_name}}</strong> hat Sie eingeladen, rentably zu nutzen.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ihr Zugang</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>E-Mail:</strong> {{invitee_email}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{invitation_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Einladung annehmen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">Die moderne L&ouml;sung f&uuml;r professionelle Immobilienverwaltung</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'user_invitation' AND language = 'de';

-- ─── user_invitation EN ───────────────────────────────────────────
UPDATE email_templates SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invitation to rentably</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Invitation to rentably</h1>
<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.6;"><strong style="color: #1E1E24;">{{inviter_name}}</strong> has invited you to use rentably.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-left: 3px solid #3c8af7; border-radius: 0 6px 6px 0; padding: 20px 24px; margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your access</p>
<p style="margin: 0; color: #1E1E24; font-size: 14px; line-height: 1.6;"><strong>Email:</strong> {{invitee_email}}</p>
</div>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="{{invitation_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-top: 4px;">Accept Invitation</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;">The modern solution for professional property management</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>'
WHERE template_key = 'user_invitation' AND language = 'en';
