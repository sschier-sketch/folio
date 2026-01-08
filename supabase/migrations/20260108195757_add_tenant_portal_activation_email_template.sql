/*
  # Add Tenant Portal Activation Email Template

  1. Changes
    - Insert default email template for tenant portal activation
    - Template includes placeholders for tenant name, portal link, and landlord info
  
  2. Security
    - Uses existing RLS policies on email_templates table
*/

-- Insert tenant portal activation email template
INSERT INTO email_templates (
  template_key,
  template_name,
  description,
  subject,
  body_html,
  body_text,
  variables,
  created_at,
  updated_at
)
VALUES (
  'tenant_portal_activation',
  'Mieterportal-Aktivierung',
  'E-Mail die an Mieter gesendet wird, wenn der Portalzugang aktiviert wird',
  'Ihr Zugang zum Mieterportal',
  E'<p>Sehr geehrte/r {{tenant_name}},</p>
<p>hiermit erhalten Sie Zugang zu Ihrem persönlichen Mieterportal.</p>
<h3>Über das Mieterportal können Sie:</h3>
<ul>
  <li>Dokumente einsehen und herunterladen</li>
  <li>Tickets und Anfragen erstellen</li>
  <li>Zählerstände melden</li>
  <li>Mit Ihrem Vermieter kommunizieren</li>
  <li>Ihre Mietdaten einsehen</li>
</ul>
<h3>So aktivieren Sie Ihr Portal:</h3>
<ol>
  <li>Klicken Sie auf folgenden Link: <a href="{{portal_link}}">{{portal_link}}</a></li>
  <li>Melden Sie sich mit Ihrer E-Mail-Adresse an: <strong>{{tenant_email}}</strong></li>
  <li>Beim ersten Login werden Sie aufgefordert, ein Passwort zu vergeben</li>
  <li>Danach können Sie sich jederzeit mit E-Mail und Passwort anmelden</li>
</ol>
<p>Der Link ist dauerhaft gültig. Sie können sich jederzeit anmelden.</p>
<p>Bei Fragen wenden Sie sich bitte an:<br>
{{landlord_name}}<br>
{{landlord_email}}</p>
<p>Mit freundlichen Grüßen<br>
Ihr Vermieter</p>',
  E'Sehr geehrte/r {{tenant_name}},

hiermit erhalten Sie Zugang zu Ihrem persönlichen Mieterportal.

Über das Mieterportal können Sie:
- Dokumente einsehen und herunterladen
- Tickets und Anfragen erstellen
- Zählerstände melden
- Mit Ihrem Vermieter kommunizieren
- Ihre Mietdaten einsehen

So aktivieren Sie Ihr Portal:

1. Klicken Sie auf folgenden Link:
   {{portal_link}}

2. Melden Sie sich mit Ihrer E-Mail-Adresse an: {{tenant_email}}

3. Beim ersten Login werden Sie aufgefordert, ein Passwort zu vergeben

4. Danach können Sie sich jederzeit mit E-Mail und Passwort anmelden

Der Link ist dauerhaft gültig. Sie können sich jederzeit anmelden.

Bei Fragen wenden Sie sich bitte an:
{{landlord_name}}
{{landlord_email}}

Mit freundlichen Grüßen
Ihr Vermieter',
  '["tenant_name", "tenant_email", "portal_link", "landlord_name", "landlord_email"]'::jsonb,
  now(),
  now()
)
ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  updated_at = now();
