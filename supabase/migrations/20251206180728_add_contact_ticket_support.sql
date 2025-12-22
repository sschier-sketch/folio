/*
  # Add Contact Ticket Support

  ## Changes
    - Modify tickets table to support contact form tickets
    - Make property_id optional to allow contact tickets without property
    - Add contact_email and contact_name fields for external contact submissions
    - Add ticket_type field to distinguish between property tickets and contact tickets
    - Add email_thread_id for tracking email conversations
    - Update constraints and indexes

  ## Security
    - Maintain RLS policies
    - Add policy for admin users to view all tickets
*/

-- Make property_id nullable for contact tickets
ALTER TABLE public.tickets 
  ALTER COLUMN property_id DROP NOT NULL;

-- Add new fields for contact tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'ticket_type'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN ticket_type text DEFAULT 'property' CHECK (ticket_type IN ('property', 'contact'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'email_thread_id'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN email_thread_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'last_email_received_at'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN last_email_received_at timestamptz;
  END IF;
END $$;

-- Add check constraint to ensure contact tickets have contact info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_contact_info_check'
  ) THEN
    ALTER TABLE public.tickets 
      ADD CONSTRAINT tickets_contact_info_check 
      CHECK (
        (ticket_type = 'property' AND property_id IS NOT NULL) OR
        (ticket_type = 'contact' AND contact_email IS NOT NULL AND contact_name IS NOT NULL)
      );
  END IF;
END $$;

-- Create index for email thread lookups
CREATE INDEX IF NOT EXISTS idx_tickets_email_thread_id 
  ON public.tickets(email_thread_id) 
  WHERE email_thread_id IS NOT NULL;

-- Create index for contact ticket queries
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type 
  ON public.tickets(ticket_type, user_id, created_at DESC);

-- Add RLS policy for admin users to view all tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admins can view all tickets' 
    AND tablename = 'tickets'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all tickets"
      ON public.tickets
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_settings
          WHERE user_settings.user_id = auth.uid()
          AND user_settings.role = ''admin''
        )
      )';
  END IF;
END $$;

-- Function to generate ticket number for contact tickets
CREATE OR REPLACE FUNCTION public.generate_contact_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  -- Get count of contact tickets today
  SELECT COUNT(*) INTO counter
  FROM public.tickets
  WHERE ticket_type = 'contact'
  AND created_at >= CURRENT_DATE;

  -- Generate ticket number: CONTACT-YYYYMMDD-XXX
  new_number := 'CONTACT-' || 
                TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                LPAD((counter + 1)::text, 3, '0');

  RETURN new_number;
END;
$$;