/*
  # Clean Up Email Templates - Remove Duplicates and Fix Subject Lines

  1. Changes
    - Delete duplicate 'welcome_email' template (keep 'registration')
    - Update subject lines to replace "Folio" with "rentab.ly"
    - Update subject lines for consistency

  2. Removed Templates
    - welcome_email (duplicate of registration)

  3. Updated Templates
    - user_invitation: Subject "Sie wurden zu Folio eingeladen" → "Sie wurden zu rentab.ly eingeladen"
    - registration: Ensure consistent branding
*/

-- Delete duplicate welcome_email template
DELETE FROM email_templates WHERE template_key = 'welcome_email';

-- Update user_invitation subject line to replace Folio with rentab.ly
UPDATE email_templates 
SET subject = 'Sie wurden zu rentab.ly eingeladen',
    updated_at = now()
WHERE template_key = 'user_invitation' AND language = 'de';

-- Update registration template for consistency
UPDATE email_templates 
SET subject = 'Willkommen bei rentab.ly',
    updated_at = now()
WHERE template_key = 'registration' AND language = 'de';