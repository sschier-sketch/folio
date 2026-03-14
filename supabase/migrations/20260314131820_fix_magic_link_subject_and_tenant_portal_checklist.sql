/*
  # Fix email templates: magic_link subject and tenant_portal_activation checklist

  1. magic_link (de + en): subject auf kleingeschriebenes "rentably" korrigieren
  2. tenant_portal_activation (de + en): ul-Liste durch tabellen-basierte Haken-Liste ersetzen
     damit die Haken in allen E-Mail-Clients korrekt angezeigt werden
*/

UPDATE email_templates
SET subject = 'Ihr Anmelde-Link – rentably'
WHERE template_key = 'magic_link' AND language = 'de';

UPDATE email_templates
SET subject = 'Your Login Link – rentably'
WHERE template_key = 'magic_link' AND language = 'en';

UPDATE email_templates
SET body_html = replace(
  body_html,
  '<div style="margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #1E1E24; font-size: 14px; font-weight: 600;">Im Mieterportal k&ouml;nnen Sie:</p>
<ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>Ihre Vertragsdaten und Mietinformationen einsehen</li>
<li>Dokumente herunterladen</li>
<li>Z&auml;hlerst&auml;nde erfassen und melden</li>
<li>Anfragen und Tickets an Ihren Vermieter senden</li>
<li>Ihre Kontaktdaten verwalten</li>
</ul>
</div>',
  '<div style="margin: 0 0 20px;">
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 14px; font-weight: 600;">Im Mieterportal k&ouml;nnen Sie:</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Ihre Vertragsdaten und Mietinformationen einsehen</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Dokumente herunterladen</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Z&auml;hlerst&auml;nde erfassen und melden</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Anfragen und Tickets an Ihren Vermieter senden</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 0;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 0;">Ihre Kontaktdaten verwalten</td></tr>
</table>
</div>'
)
WHERE template_key = 'tenant_portal_activation' AND language = 'de';

UPDATE email_templates
SET body_html = replace(
  body_html,
  '<div style="margin: 0 0 20px;">
<p style="margin: 0 0 8px; color: #1E1E24; font-size: 14px; font-weight: 600;">In the tenant portal you can:</p>
<ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
<li>View your contract details and rent information</li>
<li>Download documents</li>
<li>Submit meter readings</li>
<li>Create tickets and send messages to your landlord</li>
<li>Manage your contact information</li>
</ul>
</div>',
  '<div style="margin: 0 0 20px;">
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 14px; font-weight: 600;">In the tenant portal you can:</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">View your contract details and rent information</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Download documents</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Submit meter readings</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 4px;">Create tickets and send messages to your landlord</td></tr>
<tr><td width="24" valign="top" style="color: #3c8af7; font-size: 14px; line-height: 1.8; padding-bottom: 0;">&#10003;</td><td style="color: #555; font-size: 14px; line-height: 1.8; padding-bottom: 0;">Manage your contact information</td></tr>
</table>
</div>'
)
WHERE template_key = 'tenant_portal_activation' AND language = 'en';
