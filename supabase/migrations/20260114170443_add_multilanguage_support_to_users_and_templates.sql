/*
  # Add Multilanguage Support to Users and Email Templates

  1. Changes
    - Add `preferred_language` column to `admin_users` table (default: 'de')
    - Add `language` column to `email_templates` table (default: 'de')
    - Create unique constraint on `email_templates` for (template_key, language)
    - Add trigger to set default language for new users
    - Add default language for all existing users

  2. Security
    - No RLS changes needed (existing policies still apply)
    
  3. Notes
    - Supported languages: 'de' (German), 'en' (English)
    - Each template_key will have one entry per language
    - Users can change their preferred language in profile settings
    - Email sending will use the user's preferred language
*/

-- Add preferred_language column to admin_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN preferred_language text DEFAULT 'de' NOT NULL;
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_preferred_language_check 
      CHECK (preferred_language IN ('de', 'en'));
  END IF;
END $$;

-- Set default language for all existing users
UPDATE admin_users SET preferred_language = 'de' WHERE preferred_language IS NULL;

-- Add language column to email_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_templates' AND column_name = 'language'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN language text DEFAULT 'de' NOT NULL;
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_language_check 
      CHECK (language IN ('de', 'en'));
  END IF;
END $$;

-- Drop old unique constraint if exists and create new one with language
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_templates_template_key_key'
  ) THEN
    ALTER TABLE email_templates DROP CONSTRAINT email_templates_template_key_key;
  END IF;
END $$;

-- Create unique constraint for (template_key, language)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_templates_template_key_language_unique'
  ) THEN
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_template_key_language_unique 
      UNIQUE (template_key, language);
  END IF;
END $$;

-- Update existing templates to explicitly be German
UPDATE email_templates SET language = 'de' WHERE language IS NULL OR language = '';

-- Create index for faster language-based queries
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON email_templates(language);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key_language ON email_templates(template_key, language);
CREATE INDEX IF NOT EXISTS idx_admin_users_preferred_language ON admin_users(preferred_language);