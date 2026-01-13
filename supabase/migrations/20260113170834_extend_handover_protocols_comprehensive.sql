/*
  # Erweitere Übergabeprotokolle für umfassendes rechtssicheres System

  1. Änderungen an `handover_protocols`
    - Füge neue Felder für vollständige Protokollierung hinzu:
      - `landlord_name` (text) - Name des Vermieters
      - `tenant_name` (text) - Name des Mieters
      - `witness_name` (text, nullable) - Name des Zeugen
      - `property_id` (uuid) - Referenz zur Immobilie
      - `unit_id` (uuid, nullable) - Referenz zur Einheit
      - `meters` (jsonb) - Liste der Zählerstände (Typ, Nummer, Stand, Einheit, Datum, Foto-Refs)
      - `keys` (jsonb) - Schlüsselübergabe Details
      - `last_renovation` (text, nullable) - Letzte Renovierung
      - `status` (text) - Entwurf oder Final (draft/final)
      - `updated_at` (timestamptz) - Letzte Aktualisierung
      - `checklist_template` (text, nullable) - Verwendete Vorlage
    
    - Erweitere `checklist_data` um Foto-Referenzen
    - Erweitere `photos` um Tagging (tagType, tagRefId, comment)
    
  2. Security
    - Keine RLS-Änderungen nötig (bestehende Policies bleiben)
*/

-- Füge neue Spalten zur handover_protocols Tabelle hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'landlord_name'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN landlord_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'tenant_name'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN tenant_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'witness_name'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN witness_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'property_id'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'meters'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN meters jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'keys'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN keys jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'last_renovation'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN last_renovation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'status'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'final'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'handover_protocols' AND column_name = 'checklist_template'
  ) THEN
    ALTER TABLE handover_protocols ADD COLUMN checklist_template text;
  END IF;
END $$;

-- Erstelle Index für property_id und unit_id für bessere Performance
CREATE INDEX IF NOT EXISTS idx_handover_protocols_property_id ON handover_protocols(property_id);
CREATE INDEX IF NOT EXISTS idx_handover_protocols_unit_id ON handover_protocols(unit_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_handover_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_handover_protocols_updated_at ON handover_protocols;
CREATE TRIGGER set_handover_protocols_updated_at
  BEFORE UPDATE ON handover_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_handover_protocols_updated_at();