/*
  # Mieter-Portal Authentifizierung

  1. Änderungen an tenants Tabelle
    - `password_hash` (text) - Gehashtes Passwort für Portal-Zugang
    - `password_salt` (text) - Salt für Passwort-Hashing
    - `last_login` (timestamptz) - Zeitpunkt des letzten Logins
    
  2. Hinweise
    - Mieter setzen ihr eigenes Passwort beim ersten Portal-Zugriff
    - Passwort kann über E-Mail zurückgesetzt werden
    - Portal-URL: /portal/:user_id (user_id des Vermieters)
*/

-- Erweitere tenants Tabelle um Authentifizierungsfelder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE tenants ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'password_salt'
  ) THEN
    ALTER TABLE tenants ADD COLUMN password_salt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE tenants ADD COLUMN last_login timestamptz;
  END IF;
END $$;
