/*
  # Update Kündigungsbestätigung email template metadata

  1. Modified Tables
    - `email_templates`: Update the kuendigungsbestaetigung template
      - Set proper template_name for admin display
      - Set description explaining the template
      - Set variables list for admin reference
  2. Notes
    - Makes the template properly editable in the admin email templates view
*/

UPDATE email_templates
SET
  template_name = 'Kündigungsbestätigung',
  description = 'Wird an den Mieter gesendet, wenn über den Dokument-Assistenten eine Kündigungsbestätigung erstellt und per E-Mail versendet wird.',
  variables = '["tenantName", "propertyAddress", "landlordName"]'::jsonb
WHERE template_key = 'kuendigungsbestaetigung';
