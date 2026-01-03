/*
  # Erweitere Ausstattungsmerkmale

  1. Änderungen
    - Füge `fitted_kitchen` (Einbauküche) als boolean zu property_equipment hinzu
    - Füge `wg_suitable` (WG geeignet) als boolean zu property_equipment hinzu
    - Füge `parking_type` (Art des Stellplatzes) als text zu property_equipment hinzu
    
  2. Hinweise
    - Alle neuen Felder sind optional (nullable)
    - Standard-Werte für boolean-Felder werden nicht gesetzt (können NULL sein)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'fitted_kitchen'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN fitted_kitchen boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'wg_suitable'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN wg_suitable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'parking_type'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN parking_type text;
  END IF;
END $$;
