/*
  # Add Welcome and Trial Email Templates

  1. New Templates
    - welcome (de): Welcome email after signup
    - trial_ending (de): Trial ending soon reminder
    - trial_ended (de): Trial expired notification

  2. Notes
    - Uses same design as existing email templates
    - Supports variable replacement with {{variable}}
*/

-- Welcome Email (German)
INSERT INTO public.email_templates (template_key, language, template_name, subject, body_html, body_text, description)
VALUES (
  'welcome',
  'de',
  'Willkommens-Email',
  'Willkommen bei Rentably!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #008CFF 0%, #0066CC 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Willkommen bei Rentably!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                Hallo,
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                willkommen bei Rentably! Wir freuen uns, dass Sie sich für unsere Immobilienverwaltungs-Software entschieden haben.
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 30px 0;">
                Ihre 30-tägige kostenlose Testphase hat begonnen. Nutzen Sie alle Pro-Features ohne Einschränkungen!
              </p>
              
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
                <h2 style="font-size: 18px; color: #1e293b; margin: 0 0 16px 0;">Ihre nächsten Schritte:</h2>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li style="margin-bottom: 12px;">Erstellen Sie Ihre erste Immobilie</li>
                  <li style="margin-bottom: 12px;">Fügen Sie Ihre Mieter hinzu</li>
                  <li style="margin-bottom: 12px;">Verwalten Sie Mieteinnahmen und Ausgaben</li>
                  <li style="margin-bottom: 12px;">Nutzen Sie das Mieterportal</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{dashboard_link}}" style="display: inline-block; background: linear-gradient(135deg, #008CFF 0%, #0066CC 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Zum Dashboard
                </a>
              </div>

              <p style="font-size: 14px; line-height: 20px; color: #64748b; margin: 0;">
                Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung!
              </p>
              <p style="font-size: 14px; line-height: 20px; color: #64748b; margin: 10px 0 0 0;">
                Viele Grüße,<br>
                Ihr Rentably Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2024 Rentably. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hallo,

willkommen bei Rentably! Wir freuen uns, dass Sie sich für unsere Immobilienverwaltungs-Software entschieden haben.

Ihre 30-tägige kostenlose Testphase hat begonnen. Nutzen Sie alle Pro-Features ohne Einschränkungen!

Ihre nächsten Schritte:
- Erstellen Sie Ihre erste Immobilie
- Fügen Sie Ihre Mieter hinzu
- Verwalten Sie Mieteinnahmen und Ausgaben
- Nutzen Sie das Mieterportal

Zum Dashboard: {{dashboard_link}}

Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung!

Viele Grüße,
Ihr Rentably Team',
  'Welcome email sent after user registration'
)
ON CONFLICT (template_key, language) DO UPDATE
SET body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    subject = EXCLUDED.subject,
    updated_at = now();

-- Trial Ending Email (German)
INSERT INTO public.email_templates (template_key, language, template_name, subject, body_html, body_text, description)
VALUES (
  'trial_ending',
  'de',
  'Testphase endet bald',
  'Ihre Testphase endet in {{days_remaining}} Tagen',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Ihre Testphase endet bald</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                Hallo,
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                Ihre 30-tägige Testphase endet in <strong>{{days_remaining}} Tagen</strong> am {{trial_end_date}}.
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 30px 0;">
                Upgraden Sie jetzt auf Pro, um alle Features weiterhin ohne Unterbrechung nutzen zu können.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 20px; margin: 0 0 30px 0;">
                <p style="font-size: 14px; line-height: 20px; color: #92400e; margin: 0;">
                  <strong>Nur 9 EUR/Monat</strong> für unbegrenzte Immobilien, Mieter und alle Pro-Features!
                </p>
              </div>

              <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{upgrade_link}}" style="display: inline-block; background: linear-gradient(135deg, #008CFF 0%, #0066CC 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Jetzt auf Pro upgraden
                </a>
              </div>

              <p style="font-size: 14px; line-height: 20px; color: #64748b; margin: 0;">
                Viele Grüße,<br>
                Ihr Rentably Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2024 Rentably. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hallo,

Ihre 30-tägige Testphase endet in {{days_remaining}} Tagen am {{trial_end_date}}.

Upgraden Sie jetzt auf Pro, um alle Features weiterhin ohne Unterbrechung nutzen zu können.

Nur 9 EUR/Monat für unbegrenzte Immobilien, Mieter und alle Pro-Features!

Zum Upgrade: {{upgrade_link}}

Viele Grüße,
Ihr Rentably Team',
  'Trial ending reminder sent 7 days before expiry'
)
ON CONFLICT (template_key, language) DO UPDATE
SET body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    subject = EXCLUDED.subject,
    updated_at = now();

-- Trial Ended Email (German)
INSERT INTO public.email_templates (template_key, language, template_name, subject, body_html, body_text, description)
VALUES (
  'trial_ended',
  'de',
  'Testphase abgelaufen',
  'Ihre Testphase ist abgelaufen',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Testphase abgelaufen</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                Hallo,
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
                Ihre 30-tägige Testphase ist am {{trial_end_date}} abgelaufen.
              </p>
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 30px 0;">
                Ihre Daten bleiben erhalten. Upgraden Sie auf Pro, um wieder vollen Zugriff auf alle Features zu erhalten.
              </p>

              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
                <h2 style="font-size: 18px; color: #1e293b; margin: 0 0 16px 0;">Pro-Features wieder freischalten:</h2>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li style="margin-bottom: 12px;">Unbegrenzte Immobilien und Mieter</li>
                  <li style="margin-bottom: 12px;">Erweiterte Finanzanalysen</li>
                  <li style="margin-bottom: 12px;">Mieterportal</li>
                  <li style="margin-bottom: 12px;">Dokument-Management</li>
                  <li>Und vieles mehr...</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{upgrade_link}}" style="display: inline-block; background: linear-gradient(135deg, #008CFF 0%, #0066CC 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Jetzt upgraden für 9 EUR/Monat
                </a>
              </div>

              <p style="font-size: 14px; line-height: 20px; color: #64748b; margin: 0;">
                Viele Grüße,<br>
                Ihr Rentably Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © 2024 Rentably. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hallo,

Ihre 30-tägige Testphase ist am {{trial_end_date}} abgelaufen.

Ihre Daten bleiben erhalten. Upgraden Sie auf Pro, um wieder vollen Zugriff auf alle Features zu erhalten.

Pro-Features wieder freischalten:
- Unbegrenzte Immobilien und Mieter
- Erweiterte Finanzanalysen
- Mieterportal
- Dokument-Management
- Und vieles mehr...

Zum Upgrade: {{upgrade_link}}

Viele Grüße,
Ihr Rentably Team',
  'Trial expired notification'
)
ON CONFLICT (template_key, language) DO UPDATE
SET body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    subject = EXCLUDED.subject,
    updated_at = now();
