/*
  # Update tenant portal activation email template

  1. Modified Tables
    - `email_templates` - Updated DE and EN versions of `tenant_portal_activation`

  2. Changes
    - Update instructions to match the new dedicated activation page flow:
      - Step 1: Click the button to open the activation page
      - Step 2: Enter your email address
      - Step 3: Set a personal password
      - Step 4: After activation, log in anytime via the tenant portal
    - Button text changed from "Zum Mieterportal" to "Konto jetzt aktivieren"
    - The link now points to /mieterportal-aktivierung (handled by edge function)
*/

UPDATE email_templates
SET
  subject = 'Ihr Zugang zum Mieterportal - rentab.ly',
  body_html = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}</style></head><body><table width="100%" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%"><tr><td align="center" style="padding-bottom:30px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ihr Zugang zum Mieterportal</h1><div style="color:#141719;font-size:14px;line-height:1.6"><p style="margin:0 0 16px 0">Hallo <strong>{{tenant_name}}</strong>,</p><p style="margin:0 0 16px 0">Ihr Vermieter <strong>{{landlord_name}}</strong> hat f&uuml;r Sie einen Zugang zum Mieterportal eingerichtet.</p><p style="margin:0 0 16px 0"><strong>Immobilie:</strong> {{property_address}}</p><table width="100%" style="background:#f0f7ff;border-radius:8px;margin:0 0 16px 0" cellpadding="16"><tr><td><p style="margin:0 0 8px 0;font-weight:bold;color:#1a5dc8">So aktivieren Sie Ihren Zugang:</p><ol style="margin:0;padding-left:20px;color:#141719"><li style="margin-bottom:6px">Klicken Sie auf den Button &quot;Konto jetzt aktivieren&quot; weiter unten</li><li style="margin-bottom:6px">Geben Sie Ihre E-Mail-Adresse ein: <strong>{{tenant_email}}</strong></li><li style="margin-bottom:6px">Legen Sie ein pers&ouml;nliches Passwort fest</li><li style="margin-bottom:0">Nach der Aktivierung k&ouml;nnen Sie sich jederzeit im Mieterportal anmelden</li></ol></td></tr></table><p style="margin:0 0 12px 0"><strong>Im Mieterportal k&ouml;nnen Sie:</strong></p><ul style="margin:0 0 16px 0;padding-left:20px;color:#141719"><li style="margin-bottom:4px">Ihre Vertragsdaten und Mietinformationen einsehen</li><li style="margin-bottom:4px">Dokumente herunterladen</li><li style="margin-bottom:4px">Z&auml;hlerst&auml;nde erfassen und melden</li><li style="margin-bottom:4px">Anfragen und Tickets an Ihren Vermieter senden</li><li style="margin-bottom:0">Ihre Kontaktdaten verwalten</li></ul></div><table width="100%" cellpadding="20"><tr><td align="center"><a href="{{portal_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:14px 40px;text-decoration:none;font-weight:bold;font-size:16px">Konto jetzt aktivieren</a></td></tr></table><div style="color:#141719;font-size:14px;line-height:1.6"><p style="margin:0 0 8px 0;color:#666">Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter:</p><p style="margin:0 0 16px 0;color:#666">{{landlord_name}} &ndash; <a href="mailto:{{landlord_email}}" style="color:#3c8af7">{{landlord_email}}</a></p></div><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">&copy; 2026 <a href="https://rentab.ly" style="color:#3c8af7">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>',
  body_text = 'Ihr Zugang zum Mieterportal

Hallo {{tenant_name}},

Ihr Vermieter {{landlord_name}} hat fuer Sie einen Zugang zum Mieterportal eingerichtet.

Immobilie: {{property_address}}

So aktivieren Sie Ihren Zugang:
1. Oeffnen Sie den folgenden Link: {{portal_link}}
2. Geben Sie Ihre E-Mail-Adresse ein: {{tenant_email}}
3. Legen Sie ein persoenliches Passwort fest
4. Nach der Aktivierung koennen Sie sich jederzeit im Mieterportal anmelden

Im Mieterportal koennen Sie:
- Ihre Vertragsdaten und Mietinformationen einsehen
- Dokumente herunterladen
- Zaehlerstaende erfassen und melden
- Anfragen und Tickets an Ihren Vermieter senden
- Ihre Kontaktdaten verwalten

Konto jetzt aktivieren: {{portal_link}}

Bei Fragen wenden Sie sich bitte direkt an Ihren Vermieter:
{{landlord_name}} - {{landlord_email}}

---
(c) 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'tenant_portal_activation' AND language = 'de';

UPDATE email_templates
SET
  subject = 'Your Access to the Tenant Portal - rentab.ly',
  body_html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}</style></head><body><table width="100%" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%"><tr><td align="center" style="padding-bottom:30px"><a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Your Access to the Tenant Portal</h1><div style="color:#141719;font-size:14px;line-height:1.6"><p style="margin:0 0 16px 0">Hello <strong>{{tenant_name}}</strong>,</p><p style="margin:0 0 16px 0">Your landlord <strong>{{landlord_name}}</strong> has set up tenant portal access for you.</p><p style="margin:0 0 16px 0"><strong>Property:</strong> {{property_address}}</p><table width="100%" style="background:#f0f7ff;border-radius:8px;margin:0 0 16px 0" cellpadding="16"><tr><td><p style="margin:0 0 8px 0;font-weight:bold;color:#1a5dc8">How to activate your account:</p><ol style="margin:0;padding-left:20px;color:#141719"><li style="margin-bottom:6px">Click the &quot;Activate account now&quot; button below</li><li style="margin-bottom:6px">Enter your email address: <strong>{{tenant_email}}</strong></li><li style="margin-bottom:6px">Set a personal password</li><li style="margin-bottom:0">After activation, you can log in to the tenant portal anytime</li></ol></td></tr></table><p style="margin:0 0 12px 0"><strong>In the tenant portal you can:</strong></p><ul style="margin:0 0 16px 0;padding-left:20px;color:#141719"><li style="margin-bottom:4px">View your contract details and rent information</li><li style="margin-bottom:4px">Download documents</li><li style="margin-bottom:4px">Submit meter readings</li><li style="margin-bottom:4px">Create tickets and send messages to your landlord</li><li style="margin-bottom:0">Manage your contact information</li></ul></div><table width="100%" cellpadding="20"><tr><td align="center"><a href="{{portal_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:14px 40px;text-decoration:none;font-weight:bold;font-size:16px">Activate account now</a></td></tr></table><div style="color:#141719;font-size:14px;line-height:1.6"><p style="margin:0 0 8px 0;color:#666">If you have any questions, please contact your landlord directly:</p><p style="margin:0 0 16px 0;color:#666">{{landlord_name}} &ndash; <a href="mailto:{{landlord_email}}" style="color:#3c8af7">{{landlord_email}}</a></p></div><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">&copy; 2026 <a href="https://rentab.ly" style="color:#3c8af7">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>',
  body_text = 'Your Access to the Tenant Portal

Hello {{tenant_name}},

Your landlord {{landlord_name}} has set up tenant portal access for you.

Property: {{property_address}}

How to activate your account:
1. Open the following link: {{portal_link}}
2. Enter your email address: {{tenant_email}}
3. Set a personal password
4. After activation, you can log in to the tenant portal anytime

In the tenant portal you can:
- View your contract details and rent information
- Download documents
- Submit meter readings
- Create tickets and send messages to your landlord
- Manage your contact information

Activate account now: {{portal_link}}

If you have any questions, please contact your landlord directly:
{{landlord_name}} - {{landlord_email}}

---
(c) 2026 rentab.ly',
  updated_at = now()
WHERE template_key = 'tenant_portal_activation' AND language = 'en';
