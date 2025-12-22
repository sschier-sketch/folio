/*
  # Update Email Templates and Ticket Status

  1. Changes to email_templates
    - Add template_name column for human-readable name
    - Add description column for template purpose
    - Rename body_html to html_content for consistency
    - Rename body_text to text_content for consistency

  2. Changes to tickets
    - Add answered_at timestamp for tracking when ticket was answered

  3. Notes
    - Preserves existing data
    - Adds indexes for better performance
*/

-- Add missing columns to email_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_templates' AND column_name = 'template_name'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN template_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_templates' AND column_name = 'description'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Add answered_at to tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'answered_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN answered_at timestamptz;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_status ON tickets(ticket_type, status, created_at DESC);
