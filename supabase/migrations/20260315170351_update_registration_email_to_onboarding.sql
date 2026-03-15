/*
  # Update Registration Email to Onboarding Template

  1. Changes
    - Updates the German "registration" email template with a new onboarding design
    - New subject line and preheader for better open rates
    - New HTML body with 3-step onboarding cards, secondary import hint, trial note, and primary CTA
    - New plain-text body matching the same content structure
    - Header (logo) and footer (copyright, contact, legal links) preserved from existing template
    - Template variables preserved: {{userName}}, {{dashboard_link}}, {{user_email}}

  2. Design Direction
    - Mirrors the rentably marketing website aesthetic: clean, modern SaaS style
    - Primary blue #3c8af7, dark text #1E1E24, muted gray tones
    - Step cards with numbered circles in brand blue
    - Generous whitespace, clear hierarchy, single prominent CTA
    - Mobile-responsive table-based layout

  3. Security
    - No schema changes, only data update on existing row
*/

UPDATE email_templates
SET
  subject = 'Willkommen bei rentably – starten Sie jetzt mit Ihren ersten 3 Schritten',
  body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Willkommen bei rentably</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<!-- ============ HEADER (unchanged) ============ -->
<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<!-- ============ HERO ============ -->
<tr><td style="padding: 36px 32px 0;">
<h1 style="margin: 0 0 16px; color: #1E1E24; font-size: 22px; font-weight: 700; line-height: 1.35;">Willkommen bei rentably</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.65;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,</p>
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.65;">Ihr 30-t&auml;giger Pro-Test ist jetzt aktiv. Damit Sie direkt loslegen k&ouml;nnen, zeigen wir Ihnen die drei wichtigsten ersten Schritte f&uuml;r den Start.</p>
</td></tr>

<!-- ============ 3 STEPS ============ -->
<tr><td style="padding: 28px 32px 0;">
<table width="100%" border="0" cellpadding="0" cellspacing="0">

<!-- Step 1 -->
<tr><td style="padding-bottom: 12px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #eef2f6;">
<tr>
<td width="56" valign="top" style="padding: 20px 0 20px 18px;">
<div style="width: 36px; height: 36px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #DDE7FF; text-align: center; line-height: 36px; font-size: 14px; font-weight: 700; color: #3c8af7;">1</div>
</td>
<td valign="top" style="padding: 20px 18px 20px 6px;">
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; font-weight: 700; line-height: 1.3;">Objekt anlegen</p>
<p style="margin: 0; color: #666; font-size: 13px; line-height: 1.55;">Legen Sie Ihr erstes Objekt an und schaffen Sie die Grundlage f&uuml;r eine strukturierte Verwaltung.</p>
</td>
</tr>
</table>
</td></tr>

<!-- Step 2 -->
<tr><td style="padding-bottom: 12px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #eef2f6;">
<tr>
<td width="56" valign="top" style="padding: 20px 0 20px 18px;">
<div style="width: 36px; height: 36px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #DDE7FF; text-align: center; line-height: 36px; font-size: 14px; font-weight: 700; color: #3c8af7;">2</div>
</td>
<td valign="top" style="padding: 20px 18px 20px 6px;">
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; font-weight: 700; line-height: 1.3;">Einheit anlegen</p>
<p style="margin: 0; color: #666; font-size: 13px; line-height: 1.55;">Erfassen Sie die passende Einheit, damit Sie Ihre Fl&auml;chen und Mietobjekte vollst&auml;ndig abbilden k&ouml;nnen.</p>
</td>
</tr>
</table>
</td></tr>

<!-- Step 3 -->
<tr><td style="padding-bottom: 0;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #eef2f6;">
<tr>
<td width="56" valign="top" style="padding: 20px 0 20px 18px;">
<div style="width: 36px; height: 36px; border-radius: 50%; background-color: #EEF4FF; border: 1px solid #DDE7FF; text-align: center; line-height: 36px; font-size: 14px; font-weight: 700; color: #3c8af7;">3</div>
</td>
<td valign="top" style="padding: 20px 18px 20px 6px;">
<p style="margin: 0 0 4px; color: #1E1E24; font-size: 14px; font-weight: 700; line-height: 1.3;">Mietverh&auml;ltnis erfassen</p>
<p style="margin: 0; color: #666; font-size: 13px; line-height: 1.55;">Hinterlegen Sie die wichtigsten Vertrags- und Mietdaten, um Ihre Vermietung sauber und vollst&auml;ndig zu verwalten.</p>
</td>
</tr>
</table>
</td></tr>

</table>
</td></tr>

<!-- ============ SECONDARY HINT ============ -->
<tr><td style="padding: 24px 32px 0;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 6px; border-left: 3px solid #e2e8f0;">
<tr><td style="padding: 14px 16px;">
<p style="margin: 0 0 3px; color: #1E1E24; font-size: 13px; font-weight: 600; line-height: 1.3;">Sie verwalten bereits mehrere Objekte?</p>
<p style="margin: 0; color: #888; font-size: 12px; line-height: 1.55;">Importieren Sie bestehende Daten und sparen Sie Zeit beim Einstieg.</p>
</td></tr>
</table>
</td></tr>

<!-- ============ TRIAL NOTE ============ -->
<tr><td style="padding: 24px 32px 0;">
<p style="margin: 0; color: #888; font-size: 13px; line-height: 1.6; text-align: center;">W&auml;hrend Ihrer 30-t&auml;gigen Testphase nutzen Sie rentably im vollen Pro-Umfang und lernen alle Funktionen direkt in der Praxis kennen.</p>
</td></tr>

<!-- ============ PRIMARY CTA ============ -->
<tr><td style="padding: 28px 32px 36px; text-align: center;">
<a href="{{dashboard_link}}" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.01em;">Jetzt loslegen</a>
</td></tr>

<!-- ============ FOOTER (unchanged) ============ -->
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
  body_text = 'Willkommen bei rentably

Hallo {{userName}},

Ihr 30-taegiger Pro-Test ist jetzt aktiv. Damit Sie direkt loslegen koennen, zeigen wir Ihnen die drei wichtigsten ersten Schritte fuer den Start.


Ihre ersten 3 Schritte
-----------------------

1. Objekt anlegen
   Legen Sie Ihr erstes Objekt an und schaffen Sie die Grundlage fuer eine strukturierte Verwaltung.

2. Einheit anlegen
   Erfassen Sie die passende Einheit, damit Sie Ihre Flaechen und Mietobjekte vollstaendig abbilden koennen.

3. Mietverhaeltnis erfassen
   Hinterlegen Sie die wichtigsten Vertrags- und Mietdaten, um Ihre Vermietung sauber und vollstaendig zu verwalten.


Sie verwalten bereits mehrere Objekte?
Importieren Sie bestehende Daten und sparen Sie Zeit beim Einstieg.


Waehrend Ihrer 30-taegigen Testphase nutzen Sie rentably im vollen Pro-Umfang und lernen alle Funktionen direkt in der Praxis kennen.

Jetzt loslegen: {{dashboard_link}}


--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mo - Fr, 9:00 - 18:00 Uhr
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
  variables = '["userName", "dashboard_link", "user_email"]'::jsonb,
  updated_at = now()
WHERE template_key = 'registration' AND language = 'de';
