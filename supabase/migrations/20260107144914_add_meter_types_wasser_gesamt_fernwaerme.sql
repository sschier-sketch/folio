/*
  # Erweitere Zählertypen

  1. Änderungen
    - Fügt neue Zählertypen hinzu: wasser_gesamt, fernwaerme
    - Passt die CHECK Constraint an

  2. Sicherheit
    - Keine Änderungen an RLS-Richtlinien erforderlich
*/

-- Drop existing constraint and add new one with extended types
ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_meter_type_check;

ALTER TABLE meters ADD CONSTRAINT meters_meter_type_check 
  CHECK (meter_type IN ('strom', 'gas', 'heizung', 'warmwasser', 'kaltwasser', 'wasser_gesamt', 'fernwaerme', 'sonstiges'));