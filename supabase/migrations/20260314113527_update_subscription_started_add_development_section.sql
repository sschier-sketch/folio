/*
  # Update subscription_started templates

  Adds a "rentably wird stetig weiterentwickelt" section below the feature box
  in both DE and EN versions of the subscription_started email template.
  Updates both body_html and body_text.
*/

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Willkommen im Pro-Tarif</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0; margin: 0 auto;" />
</a>
</td></tr>

<tr><td style="padding: 32px 32px 0;">
<h1 style="margin: 0 0 12px; color: #1E1E24; font-size: 22px; font-weight: 700; line-height: 1.3;">Ihr Pro-Tarif ist jetzt aktiv</h1>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.7;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,<br>herzlichen Glückwunsch – Sie haben den Pro-Tarif gebucht. Ab sofort stehen Ihnen alle Funktionen von rentably uneingeschränkt zur Verfügung.</p>
</td></tr>

<tr><td style="padding: 0 32px 24px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f6ff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 16px 20px; border-bottom: 1px solid #dde9fa;">
<p style="margin: 0; color: #3c8af7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Ihr Tarif</p>
<p style="margin: 4px 0 0; color: #1E1E24; font-size: 16px; font-weight: 700;">rentably Pro</p>
</td></tr>
<tr><td style="padding: 20px;">
<p style="margin: 0 0 14px; color: #1E1E24; font-size: 13px; font-weight: 700;">Diese Funktionen sind freigeschaltet worden:</p>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
<td width="50%" valign="top" style="padding-right: 8px;">
<table border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Automatischer Bankabgleich</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Ticketsystem &amp; Nachrichten</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Mieterportal</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Betriebskostenabrechnung</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Mahnwesen &amp; Indexmiete</span></td></tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left: 8px;">
<table border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Cashflow &amp; Anlage V</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Dokument-Assistent</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Multi-User-Konten</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">2 GB Dokumentenspeicher</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Prioritäts-Support (24h)</span></td></tr>
</table>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 24px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8faff; border: 1px solid #e8f0fe; border-radius: 8px;">
<tr><td style="padding: 18px 20px;">
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 13px; font-weight: 700;">&#128640; rentably wird stetig weiterentwickelt</p>
<p style="margin: 0; color: #555; font-size: 13px; line-height: 1.7;">Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.</p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 12px;">
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.7;">Entdecken Sie alles, was jetzt für Sie bereitsteht – direkt in Ihrem Dashboard.</p>
</td></tr>

<tr><td style="padding: 0 32px 32px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 14px; font-weight: 700;">Zum Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;">
<a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr
</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  body_text = 'Ihr Pro-Tarif ist jetzt aktiv

Hallo {{userName}},

herzlichen Glückwunsch – Sie haben den Pro-Tarif gebucht. Ab sofort stehen Ihnen alle Funktionen von rentably uneingeschränkt zur Verfügung.

Diese Funktionen sind freigeschaltet worden:

- Automatischer Bankabgleich
- Ticketsystem & Nachrichten
- Mieterportal
- Betriebskostenabrechnung
- Mahnwesen & Indexmiete
- Cashflow & Anlage V
- Dokument-Assistent
- Multi-User-Konten
- 2 GB Dokumentenspeicher
- Prioritäts-Support (24h)

---
rentably wird stetig weiterentwickelt

Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.
---

Entdecken Sie alles, was jetzt für Sie bereitsteht – direkt in Ihrem Dashboard.

Jetzt loslegen: https://rentab.ly/dashboard

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mo - Fr, 9:00 - 18:00 Uhr
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
  updated_at = now()
WHERE template_key = 'subscription_started' AND language = 'de';

UPDATE email_templates
SET
  body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Willkommen im Pro-Tarif</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0; margin: 0 auto;" />
</a>
</td></tr>

<tr><td style="padding: 32px 32px 0;">
<h1 style="margin: 0 0 12px; color: #1E1E24; font-size: 22px; font-weight: 700; line-height: 1.3;">Ihr Pro-Tarif ist jetzt aktiv</h1>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.7;">Hallo <strong style="color: #1E1E24;">{{userName}}</strong>,<br>herzlichen Glückwunsch – Sie haben den Pro-Tarif gebucht. Ab sofort stehen Ihnen alle Funktionen von rentably uneingeschränkt zur Verfügung.</p>
</td></tr>

<tr><td style="padding: 0 32px 24px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f6ff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 16px 20px; border-bottom: 1px solid #dde9fa;">
<p style="margin: 0; color: #3c8af7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Ihr Tarif</p>
<p style="margin: 4px 0 0; color: #1E1E24; font-size: 16px; font-weight: 700;">rentably Pro</p>
</td></tr>
<tr><td style="padding: 20px;">
<p style="margin: 0 0 14px; color: #1E1E24; font-size: 13px; font-weight: 700;">Das ist jetzt alles für Sie freigeschaltet:</p>
<table width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
<td width="50%" valign="top" style="padding-right: 8px;">
<table border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Automatischer Bankabgleich</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Ticketsystem &amp; Nachrichten</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Mieterportal</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Betriebskostenabrechnung</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Mahnwesen &amp; Indexmiete</span></td></tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left: 8px;">
<table border="0" cellpadding="0" cellspacing="0">
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Cashflow &amp; Anlage V</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Dokument-Assistent</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Multi-User-Konten</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">2 GB Dokumentenspeicher</span></td></tr>
<tr><td style="padding: 4px 0;"><span style="color: #3c8af7; font-size: 14px; margin-right: 8px;">&#10003;</span><span style="color: #333; font-size: 13px; line-height: 1.5;">Prioritäts-Support (24h)</span></td></tr>
</table>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 24px;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8faff; border: 1px solid #e8f0fe; border-radius: 8px;">
<tr><td style="padding: 18px 20px;">
<p style="margin: 0 0 6px; color: #1E1E24; font-size: 13px; font-weight: 700;">&#128640; rentably wird stetig weiterentwickelt</p>
<p style="margin: 0; color: #555; font-size: 13px; line-height: 1.7;">Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.</p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 0 32px 12px;">
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.7;">Entdecken Sie alles, was jetzt für Sie bereitsteht – direkt in Ihrem Dashboard.</p>
</td></tr>

<tr><td style="padding: 0 32px 32px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 8px; font-size: 14px; font-weight: 700;">Jetzt loslegen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;">
<a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr
</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  body_text = 'Ihr Pro-Tarif ist jetzt aktiv

Hallo {{userName}},

herzlichen Glückwunsch – Sie haben den Pro-Tarif gebucht. Ab sofort stehen Ihnen alle Funktionen von rentably uneingeschränkt zur Verfügung.

Das ist jetzt alles für Sie freigeschaltet:

- Automatischer Bankabgleich
- Ticketsystem & Nachrichten
- Mieterportal
- Betriebskostenabrechnung
- Mahnwesen & Indexmiete
- Cashflow & Anlage V
- Dokument-Assistent
- Multi-User-Konten
- 2 GB Dokumentenspeicher
- Prioritäts-Support (24h)

---
rentably wird stetig weiterentwickelt

Wir arbeiten kontinuierlich daran, rentably noch besser zu machen – neue Funktionen, Verbesserungen und Optimierungen erscheinen regelmäßig. Als Pro-Nutzer profitieren Sie automatisch von allen zukünftigen Updates ohne Aufpreis.
---

Entdecken Sie alles, was jetzt für Sie bereitsteht – direkt in Ihrem Dashboard.

Jetzt loslegen: https://rentab.ly/dashboard

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mo - Fr, 9:00 - 18:00 Uhr
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
  updated_at = now()
WHERE template_key = 'subscription_started' AND language = 'en';
