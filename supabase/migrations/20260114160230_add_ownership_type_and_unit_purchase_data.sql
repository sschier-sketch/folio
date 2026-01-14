/*
  # Besitzvarianten und Einheiten-Kaufdaten

  1. Änderungen an der properties-Tabelle
    - Neues Feld `ownership_type` hinzugefügt
      - 'full_property': Gesamte Immobilie im Besitz
      - 'units_only': Nur einzelne Einheiten im Besitz
    - Standard: 'full_property' für Rückwärtskompatibilität

  2. Änderungen an der property_units-Tabelle
    - Kaufdaten für Einheiten im Teileigentum:
      - `purchase_price`: Kaufpreis der Einheit
      - `current_value`: Aktueller Wert der Einheit
      - `purchase_date`: Kaufdatum der Einheit
      - `broker_costs`: Maklerkosten
      - `notary_costs`: Notarkosten
      - `lawyer_costs`: Anwaltskosten
      - `real_estate_transfer_tax`: Grunderwerbsteuer
      - `registration_costs`: Eintragungskosten
      - `expert_costs`: Gutachterkosten
      - `additional_purchase_costs`: Weitere Nebenkosten (JSON)

  3. Wichtige Hinweise
    - Diese Felder werden nur verwendet, wenn ownership_type = 'units_only'
    - Bei 'full_property' bleiben die Kaufdaten auf Immobilienebene
    - Die ownership_type-Einstellung kann nachträglich geändert werden
*/

-- Füge ownership_type zur properties-Tabelle hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'ownership_type'
  ) THEN
    ALTER TABLE properties 
    ADD COLUMN ownership_type text DEFAULT 'full_property' 
    CHECK (ownership_type IN ('full_property', 'units_only'));
  END IF;
END $$;

-- Füge Kaufdaten-Felder zur property_units-Tabelle hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE property_units ADD COLUMN purchase_price numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'current_value'
  ) THEN
    ALTER TABLE property_units ADD COLUMN current_value numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE property_units ADD COLUMN purchase_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'broker_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN broker_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'notary_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN notary_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'lawyer_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN lawyer_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'real_estate_transfer_tax'
  ) THEN
    ALTER TABLE property_units ADD COLUMN real_estate_transfer_tax numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'registration_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN registration_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'expert_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN expert_costs numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'additional_purchase_costs'
  ) THEN
    ALTER TABLE property_units ADD COLUMN additional_purchase_costs jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Kommentar für Dokumentation
COMMENT ON COLUMN properties.ownership_type IS 'Bestimmt, ob die gesamte Immobilie (full_property) oder nur einzelne Einheiten (units_only) im Besitz sind';
COMMENT ON COLUMN property_units.purchase_price IS 'Kaufpreis der Einheit (nur relevant bei ownership_type = units_only)';
COMMENT ON COLUMN property_units.current_value IS 'Aktueller Wert der Einheit (nur relevant bei ownership_type = units_only)';
