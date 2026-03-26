/*
  # Create loan_reminder email template

  1. New Templates
    - `loan_reminder` (DE) - Erinnerung fuer Darlehenstermine (Zinsbindungsende, Kreditende, Sondertilgung)
    - `loan_reminder` (EN) - Loan reminder notifications

  2. Variables
    - `reminderLabel` - Type of reminder (e.g. "Ende der Zinsbindung")
    - `eventDate` - The date of the event
    - `daysRemaining` - Days until event
    - `propertyName` - Name of the property
    - `lenderName` - Name of the lender/bank
    - `remainingBalance` - Remaining loan balance formatted
    - `interestRate` - Current interest rate
    - `specialRepaymentInfo` - Optional: max special repayment info
    - `importantNote` - Context-specific advice text

  3. Purpose
    - Previously the process-loan-reminders edge function used hardcoded HTML
    - This template brings loan reminders in line with the standardized email design
*/

INSERT INTO email_templates (id, template_key, template_name, subject, body_html, body_text, variables, language, category, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'loan_reminder',
  'Darlehenstermin-Erinnerung',
  'Erinnerung: {{reminderLabel}} - {{lenderName}}',
  '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Darlehenstermin-Erinnerung</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">{{reminderLabel}}</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hallo,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">dies ist eine automatische Erinnerung f&uuml;r einen wichtigen Termin zu Ihrem Darlehen:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-radius: 6px; padding: 20px 24px; margin: 0 0 20px;">
<table style="width: 100%; border-collapse: collapse;">
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px; width: 160px;">Ereignis:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{reminderLabel}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Datum:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{eventDate}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">In:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{daysRemaining}} Tagen</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Immobilie:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{propertyName}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Kreditgeber:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{lenderName}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Restschuld:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{remainingBalance}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Zinssatz:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{interestRate}}%</td></tr>
{{specialRepaymentInfo}}
</table>
</div>
</td></tr>

<tr><td style="padding: 0 32px 8px;">
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">{{importantNote}}</p>
</td></tr>

<tr><td style="padding: 12px 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Viele Gr&uuml;&szlig;e,<br>Ihr rentably Team</p>
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
  'Erinnerung: {{reminderLabel}} - {{lenderName}}

Hallo,

dies ist eine automatische Erinnerung fuer einen wichtigen Termin zu Ihrem Darlehen:

Ereignis: {{reminderLabel}}
Datum: {{eventDate}}
In: {{daysRemaining}} Tagen
Immobilie: {{propertyName}}
Kreditgeber: {{lenderName}}
Restschuld: {{remainingBalance}}
Zinssatz: {{interestRate}}%
{{specialRepaymentInfo}}

{{importantNote}}

Viele Gruesse,
Ihr rentably Team',
  '["reminderLabel", "eventDate", "daysRemaining", "propertyName", "lenderName", "remainingBalance", "interestRate", "specialRepaymentInfo", "importantNote"]'::jsonb,
  'de',
  'transactional',
  'Automatische Erinnerung fuer wichtige Darlehenstermine (Zinsbindungsende, Kreditende, Sondertilgung)',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, template_key, template_name, subject, body_html, body_text, variables, language, category, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'loan_reminder',
  'Loan Reminder',
  'Reminder: {{reminderLabel}} - {{lenderName}}',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Loan Reminder</title>
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
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">{{reminderLabel}}</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hello,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">This is an automatic reminder for an important date regarding your loan:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<div style="background-color: #f8f9fb; border-radius: 6px; padding: 20px 24px; margin: 0 0 20px;">
<table style="width: 100%; border-collapse: collapse;">
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px; width: 160px;">Event:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{reminderLabel}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Date:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{eventDate}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">In:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{daysRemaining}} days</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Property:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{propertyName}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Lender:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{lenderName}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Balance:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{remainingBalance}}</td></tr>
<tr><td style="padding: 8px 0; font-weight: bold; color: #1E1E24; font-size: 14px;">Interest Rate:</td><td style="padding: 8px 0; color: #555; font-size: 14px;">{{interestRate}}%</td></tr>
{{specialRepaymentInfo}}
</table>
</div>
</td></tr>

<tr><td style="padding: 0 32px 8px;">
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">{{importantNote}}</p>
</td></tr>

<tr><td style="padding: 12px 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Best regards,<br>Your rentably Team</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are a registered user at rentably.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mon &ndash; Fri, 9:00 &ndash; 18:00</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Contact</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'Reminder: {{reminderLabel}} - {{lenderName}}

Hello,

This is an automatic reminder for an important date regarding your loan:

Event: {{reminderLabel}}
Date: {{eventDate}}
In: {{daysRemaining}} days
Property: {{propertyName}}
Lender: {{lenderName}}
Balance: {{remainingBalance}}
Interest Rate: {{interestRate}}%
{{specialRepaymentInfo}}

{{importantNote}}

Best regards,
Your rentably Team',
  '["reminderLabel", "eventDate", "daysRemaining", "propertyName", "lenderName", "remainingBalance", "interestRate", "specialRepaymentInfo", "importantNote"]'::jsonb,
  'en',
  'transactional',
  'Automatic reminder for important loan dates (fixed interest end, loan end, special repayment)',
  now(),
  now()
)
ON CONFLICT DO NOTHING;
