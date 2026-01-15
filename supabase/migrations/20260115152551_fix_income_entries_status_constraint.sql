/*
  # Korrektur: income_entries Status-Werte

  1. Änderungen
    - Ändere status Check-Constraint von ('verbucht', 'offen', 'ungeklärt', 'archiviert')
      zu ('open', 'paid') für Konsistenz mit expenses Tabelle

  2. Hinweise
    - income_entries und expenses nutzen jetzt die gleichen Status-Werte
*/

-- Entferne alte Check-Constraint
ALTER TABLE income_entries DROP CONSTRAINT IF EXISTS income_entries_status_check;

-- Füge neue Check-Constraint mit korrekten Werten hinzu
ALTER TABLE income_entries 
  ADD CONSTRAINT income_entries_status_check 
  CHECK (status IN ('open', 'paid'));

-- Setze Default auf 'open' statt 'verbucht'
ALTER TABLE income_entries 
  ALTER COLUMN status SET DEFAULT 'open';

-- Update bestehende Einträge (falls vorhanden)
UPDATE income_entries 
SET status = 'open' 
WHERE status IN ('offen', 'ungeklärt', 'verbucht', 'archiviert');
