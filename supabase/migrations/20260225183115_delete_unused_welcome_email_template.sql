/*
  # Delete unused 'welcome' email template

  1. Changes
    - Removes the 'welcome' template_key rows from email_templates
    - This template is a duplicate of 'registration' and was never used in code

  2. Notes
    - The 'registration' template is the active welcome email, sent via send-welcome-email edge function
    - The 'welcome' template was created in an earlier migration but never wired up
*/

DELETE FROM email_templates WHERE template_key = 'welcome';
