/*
  # Erweitere Ableseintervall

  1. Änderungen
    - Fügt neues Ableseintervall hinzu: on_demand (Bei Bedarf)
    - Passt die CHECK Constraint an

  2. Sicherheit
    - Keine Änderungen an RLS-Richtlinien erforderlich
*/

-- Drop existing constraint and add new one with extended intervals
ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_reading_interval_check;

ALTER TABLE meters ADD CONSTRAINT meters_reading_interval_check 
  CHECK (reading_interval IN ('monthly', 'quarterly', 'halfyearly', 'yearly', 'on_demand', 'manual'));