/*
  # Engagement E-Mail Automationen

  1. Neue E-Mail-Templates
    - `inactive_user_with_property` (de) -- Text-only E-Mail an Nutzer die sich >17 Tage nicht eingeloggt haben und eine Immobilie besitzen
    - `no_property_reminder` (de) -- Text-only E-Mail an Nutzer die 17 Tage nach Registrierung keine Immobilie angelegt haben

  2. Neue Automationen (email_automations)
    - "Inaktive Nutzer mit Immobilie" -- cron, pausiert, Absender yvonne@rentab.ly
    - "Keine Immobilie angelegt" -- cron, pausiert, Absender yvonne@rentab.ly

  3. Besonderheiten
    - Beide Templates sind reine Text-E-Mails (kein HTML-Design)
    - Absender ist yvonne@rentab.ly (nicht der Standard hallo@rentab.ly)
    - Beide Automationen starten pausiert (is_active = false)
*/

-- Template 1: Inaktive Nutzer mit Immobilie
INSERT INTO email_templates (template_key, language, template_name, subject, body_html, body_text, description, variables, category)
VALUES (
  'inactive_user_with_property',
  'de',
  'Inaktive Nutzer mit Immobilie (Engagement)',
  'Eine Frage zu Ihrem Account bei Rentably',
  '<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #333; white-space: pre-wrap;">Hallo,

ich hoffe, es geht Ihnen gut 😊

mir ist aufgefallen, dass Sie sich seit einiger Zeit nicht mehr bei Rentably eingeloggt haben. Da Sie sich aktuell noch in der Testphase befinden, wollte ich mich einmal persönlich bei Ihnen melden.

Oft liegt es ja gar nicht am Interesse, sondern eher daran, dass im Alltag die Zeit fehlt oder irgendwo noch Fragen offen sind. Genau dabei unterstütze ich Sie sehr gern.
Falls Sie möchten, verlängere ich Ihre Testphase selbstverständlich kostenlos, damit Sie sich alles in Ruhe anschauen können.

Mich würde außerdem sehr interessieren: Gibt es etwas, das Ihnen aktuell bei Rentably fehlt oder unklar ist? Oder gibt es einen konkreten Grund, warum Sie es bisher noch nicht aktiv nutzen konnten?

Ihr Feedback hilft uns enorm, Rentably weiter zu verbessern.

Wenn Sie möchten, können wir auch gern gemeinsam kurz durch Ihr Konto gehen – ich zeige Ihnen die wichtigsten Funktionen und beantworte alle Fragen.

Ich freue mich auf Ihre Rückmeldung!


Beste Grüße
Yvonne
Account Managerin
Rentably</div>',
  'Hallo,

ich hoffe, es geht Ihnen gut 😊

mir ist aufgefallen, dass Sie sich seit einiger Zeit nicht mehr bei Rentably eingeloggt haben. Da Sie sich aktuell noch in der Testphase befinden, wollte ich mich einmal persönlich bei Ihnen melden.

Oft liegt es ja gar nicht am Interesse, sondern eher daran, dass im Alltag die Zeit fehlt oder irgendwo noch Fragen offen sind. Genau dabei unterstütze ich Sie sehr gern.
Falls Sie möchten, verlängere ich Ihre Testphase selbstverständlich kostenlos, damit Sie sich alles in Ruhe anschauen können.

Mich würde außerdem sehr interessieren: Gibt es etwas, das Ihnen aktuell bei Rentably fehlt oder unklar ist? Oder gibt es einen konkreten Grund, warum Sie es bisher noch nicht aktiv nutzen konnten?

Ihr Feedback hilft uns enorm, Rentably weiter zu verbessern.

Wenn Sie möchten, können wir auch gern gemeinsam kurz durch Ihr Konto gehen – ich zeige Ihnen die wichtigsten Funktionen und beantworte alle Fragen.

Ich freue mich auf Ihre Rückmeldung!


Beste Grüße
Yvonne
Account Managerin
Rentably',
  'Persönliche Engagement-E-Mail an Nutzer die sich länger als 17 Tage nicht eingeloggt haben und mindestens eine Immobilie angelegt haben. Absender: yvonne@rentab.ly',
  '[]'::jsonb,
  'engagement'
)
ON CONFLICT DO NOTHING;

-- Template 2: Keine Immobilie angelegt
INSERT INTO email_templates (template_key, language, template_name, subject, body_html, body_text, description, variables, category)
VALUES (
  'no_property_reminder',
  'de',
  'Keine Immobilie angelegt (Engagement)',
  'Kann ich Sie beim Start mit Rentably unterstützen?',
  '<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #333; white-space: pre-wrap;">Hallo,

vielen Dank, dass Sie sich bei Rentably registriert haben!

ich habe gesehen, dass Sie bisher noch kein Objekt angelegt haben. Gerade der Einstieg ist manchmal der schwierigste Schritt – deshalb wollte ich mich kurz persönlich bei Ihnen melden.

Sehr gern unterstütze ich Sie dabei, Ihre erste Immobilie anzulegen und Rentably optimal für sich einzurichten. Oft reichen schon ein paar Minuten, um alles startklar zu machen.

Natürlich verlängere ich Ihnen auch gern Ihre Testphase kostenlos, damit Sie genügend Zeit haben, alles in Ruhe auszuprobieren.

Mich würde außerdem interessieren: Gibt es etwas, das Ihnen aktuell fehlt oder unklar ist? Oder einen bestimmten Grund, warum Sie noch nicht gestartet sind?

Ihr Feedback ist für uns extrem wertvoll, damit wir Rentably noch besser auf Ihre Bedürfnisse anpassen können.

Wenn Sie möchten, können wir auch gern gemeinsam starten – ich begleite Sie Schritt für Schritt.

Ich freue mich auf Ihre Rückmeldung!

Beste Grüße
Yvonne
Account Managerin
Rentably</div>',
  'Hallo,

vielen Dank, dass Sie sich bei Rentably registriert haben!

ich habe gesehen, dass Sie bisher noch kein Objekt angelegt haben. Gerade der Einstieg ist manchmal der schwierigste Schritt – deshalb wollte ich mich kurz persönlich bei Ihnen melden.

Sehr gern unterstütze ich Sie dabei, Ihre erste Immobilie anzulegen und Rentably optimal für sich einzurichten. Oft reichen schon ein paar Minuten, um alles startklar zu machen.

Natürlich verlängere ich Ihnen auch gern Ihre Testphase kostenlos, damit Sie genügend Zeit haben, alles in Ruhe auszuprobieren.

Mich würde außerdem interessieren: Gibt es etwas, das Ihnen aktuell fehlt oder unklar ist? Oder einen bestimmten Grund, warum Sie noch nicht gestartet sind?

Ihr Feedback ist für uns extrem wertvoll, damit wir Rentably noch besser auf Ihre Bedürfnisse anpassen können.

Wenn Sie möchten, können wir auch gern gemeinsam starten – ich begleite Sie Schritt für Schritt.

Ich freue mich auf Ihre Rückmeldung!

Beste Grüße
Yvonne
Account Managerin
Rentably',
  'Persönliche Engagement-E-Mail an Nutzer die 17 Tage nach Registrierung noch keine Immobilie angelegt haben. Absender: yvonne@rentab.ly',
  '[]'::jsonb,
  'engagement'
)
ON CONFLICT DO NOTHING;

-- Automation 1: Inaktive Nutzer mit Immobilie
INSERT INTO email_automations (name, description, template_key, trigger_type, trigger_event, trigger_config, audience_filter, is_active, edge_function)
VALUES (
  'Inaktive Nutzer mit Immobilie',
  'Persönliche E-Mail an Nutzer die sich länger als 17 Tage nicht eingeloggt haben und mindestens eine Immobilie besitzen. Absender: yvonne@rentab.ly',
  'inactive_user_with_property',
  'cron',
  NULL,
  '{"cron_schedule": "0 8 * * *", "inactive_days": 17, "sender_email": "yvonne@rentab.ly", "sender_name": "Yvonne von Rentably"}'::jsonb,
  '{"segment": "inaktive_nutzer_mit_immobilie", "conditions": ["Letzter Login > 17 Tage", "Mindestens 1 Immobilie angelegt", "Aktive Testphase (Free-Plan)", "Kein Sub-User"]}'::jsonb,
  false,
  'cron-inactive-user-with-property'
);

-- Automation 2: Keine Immobilie angelegt
INSERT INTO email_automations (name, description, template_key, trigger_type, trigger_event, trigger_config, audience_filter, is_active, edge_function)
VALUES (
  'Keine Immobilie angelegt',
  'Persönliche E-Mail an Nutzer die 17 Tage nach Registrierung noch keine Immobilie angelegt haben. Absender: yvonne@rentab.ly',
  'no_property_reminder',
  'cron',
  NULL,
  '{"cron_schedule": "0 8 * * *", "days_after_signup": 17, "sender_email": "yvonne@rentab.ly", "sender_name": "Yvonne von Rentably"}'::jsonb,
  '{"segment": "nutzer_ohne_immobilie", "conditions": ["Registrierung vor 17 Tagen", "Keine Immobilie angelegt", "Aktive Testphase (Free-Plan)", "Kein Sub-User"]}'::jsonb,
  false,
  'cron-no-property-reminder'
);
