/*
  # Ticket-Zuweisungen und E-Mail-Benachrichtigungen

  ## Änderungen
  
  1. Neue Spalten in tickets Tabelle
    - `created_by_name` - Name des Erstellers (gespeichert für Historie)
    - `assigned_user_id` - Zuweisung an einen Benutzer (optional)
    - `notify_user_by_email` - E-Mail-Benachrichtigung an zugewiesenen Benutzer
    - `notify_tenant_by_email` - E-Mail-Benachrichtigung an zugewiesenen Mieter
    
  2. Security
    - RLS-Policies bleiben aktiv
*/

-- Neue Spalten hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'created_by_name'
  ) THEN
    ALTER TABLE tickets ADD COLUMN created_by_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'notify_user_by_email'
  ) THEN
    ALTER TABLE tickets ADD COLUMN notify_user_by_email boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'notify_tenant_by_email'
  ) THEN
    ALTER TABLE tickets ADD COLUMN notify_tenant_by_email boolean DEFAULT false;
  END IF;
END $$;

-- Index für bessere Performance bei Zuweisungen
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user_id ON tickets(assigned_user_id);

-- Bestehende Tickets mit Ersteller-Namen aktualisieren
UPDATE tickets t
SET created_by_name = u.email
FROM auth.users u
WHERE t.user_id = u.id
AND t.created_by_name IS NULL;
