/*
  # Übergabeprotokolle System

  1. Neue Tabellen
    - `handover_protocols` - Haupt-Protokoll-Tabelle
    - `handover_meter_readings` - Zählerstände
    - `handover_checklist_templates` - Vorlagen für Checklisten
    - `handover_checklists` - Checklist-Instanzen pro Protokoll
    - `handover_photos` - Fotos pro Protokoll

  2. Security
    - Enable RLS auf allen Tabellen
    - Policies für authenticated users
*/

-- Enums erstellen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'protocol_type') THEN
    CREATE TYPE protocol_type AS ENUM ('move_in', 'move_out');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'protocol_status') THEN
    CREATE TYPE protocol_status AS ENUM ('draft', 'final');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meter_type') THEN
    CREATE TYPE meter_type AS ENUM ('electricity', 'water', 'heating', 'hot_water', 'other');
  END IF;
END $$;

-- Haupttabelle: Übergabeprotokolle
CREATE TABLE IF NOT EXISTS handover_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid,
  unit_id uuid,
  contract_id uuid,
  tenant_name text,
  protocol_type protocol_type NOT NULL,
  handover_date date NOT NULL,
  status protocol_status DEFAULT 'draft' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Zählerstände
CREATE TABLE IF NOT EXISTS handover_meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL,
  meter_type meter_type NOT NULL,
  meter_number text,
  reading text NOT NULL,
  unit text DEFAULT 'kWh' NOT NULL,
  reading_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Checklisten-Vorlagen
CREATE TABLE IF NOT EXISTS handover_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  user_id uuid,
  category text,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Checklisten (Instanzen pro Protokoll)
CREATE TABLE IF NOT EXISTS handover_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL,
  title text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fotos
CREATE TABLE IF NOT EXISTS handover_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL,
  file_path text NOT NULL,
  title text,
  comment text,
  taken_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS aktivieren
ALTER TABLE handover_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_photos ENABLE ROW LEVEL SECURITY;

-- Policies für handover_protocols
CREATE POLICY "Users can view own protocols"
  ON handover_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols"
  ON handover_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols"
  ON handover_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols"
  ON handover_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies für handover_meter_readings
CREATE POLICY "Users can view own meter readings"
  ON handover_meter_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_meter_readings.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meter readings"
  ON handover_meter_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_meter_readings.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meter readings"
  ON handover_meter_readings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_meter_readings.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meter readings"
  ON handover_meter_readings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_meter_readings.protocol_id
      AND user_id = auth.uid()
    )
  );

-- Policies für handover_checklist_templates
CREATE POLICY "Users can view system and own templates"
  ON handover_checklist_templates FOR SELECT
  TO authenticated
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own templates"
  ON handover_checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own templates"
  ON handover_checklist_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own templates"
  ON handover_checklist_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_system = false);

-- Policies für handover_checklists
CREATE POLICY "Users can view own checklists"
  ON handover_checklists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_checklists.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checklists"
  ON handover_checklists FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_checklists.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own checklists"
  ON handover_checklists FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_checklists.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own checklists"
  ON handover_checklists FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_checklists.protocol_id
      AND user_id = auth.uid()
    )
  );

-- Policies für handover_photos
CREATE POLICY "Users can view own photos"
  ON handover_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_photos.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own photos"
  ON handover_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_photos.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos"
  ON handover_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_photos.protocol_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos"
  ON handover_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE id = handover_photos.protocol_id
      AND user_id = auth.uid()
    )
  );

-- Vordefinierte Checklisten-Vorlagen einfügen
INSERT INTO handover_checklist_templates (name, is_system, category, items)
VALUES 
  (
    'Standard Wohnungsübergabe',
    true,
    'Allgemein',
    '[
      {"text": "Alle Schlüssel übergeben/erhalten", "order": 1},
      {"text": "Zustand der Wände prüfen", "order": 2},
      {"text": "Zustand der Böden prüfen", "order": 3},
      {"text": "Zustand der Fenster und Türen prüfen", "order": 4},
      {"text": "Funktionsfähigkeit der Heizung prüfen", "order": 5},
      {"text": "Funktionsfähigkeit der Wasserhähne prüfen", "order": 6},
      {"text": "Zustand der Sanitäranlagen prüfen", "order": 7},
      {"text": "Funktionsfähigkeit elektrischer Anlagen prüfen", "order": 8},
      {"text": "Zustand der Küche prüfen (falls vorhanden)", "order": 9},
      {"text": "Briefkasten-Schlüssel übergeben/erhalten", "order": 10}
    ]'::jsonb
  ),
  (
    'Detaillierte Wohnungsübergabe',
    true,
    'Detailliert',
    '[
      {"text": "Haustürschlüssel übergeben", "order": 1},
      {"text": "Wohnungstürschlüssel übergeben", "order": 2},
      {"text": "Kellerschlüssel übergeben", "order": 3},
      {"text": "Briefkastenschlüssel übergeben", "order": 4},
      {"text": "Wände im Wohnzimmer", "order": 5},
      {"text": "Wände im Schlafzimmer", "order": 6},
      {"text": "Wände im Badezimmer", "order": 7},
      {"text": "Wände in der Küche", "order": 8},
      {"text": "Wände im Flur", "order": 9},
      {"text": "Bodenbelag Wohnzimmer", "order": 10},
      {"text": "Bodenbelag Schlafzimmer", "order": 11},
      {"text": "Bodenbelag Badezimmer", "order": 12},
      {"text": "Bodenbelag Küche", "order": 13},
      {"text": "Bodenbelag Flur", "order": 14},
      {"text": "Fenster Wohnzimmer", "order": 15},
      {"text": "Fenster Schlafzimmer", "order": 16},
      {"text": "Fenster Badezimmer", "order": 17},
      {"text": "Fenster Küche", "order": 18},
      {"text": "Eingangstür", "order": 19},
      {"text": "Balkontür (falls vorhanden)", "order": 20},
      {"text": "Heizkörper Wohnzimmer", "order": 21},
      {"text": "Heizkörper Schlafzimmer", "order": 22},
      {"text": "Heizkörper Badezimmer", "order": 23},
      {"text": "Wasserhahn Badezimmer", "order": 24},
      {"text": "Wasserhahn Küche", "order": 25},
      {"text": "Dusche/Badewanne", "order": 26},
      {"text": "WC", "order": 27},
      {"text": "Waschbecken Badezimmer", "order": 28},
      {"text": "Spüle Küche", "order": 29},
      {"text": "Lichtschalter und Steckdosen", "order": 30},
      {"text": "Küchenzeile (falls vorhanden)", "order": 31},
      {"text": "Einbaugeräte (falls vorhanden)", "order": 32}
    ]'::jsonb
  ),
  (
    'Nur Schlüsselübergabe',
    true,
    'Minimal',
    '[
      {"text": "Haustürschlüssel", "order": 1},
      {"text": "Wohnungstürschlüssel", "order": 2},
      {"text": "Kellerschlüssel", "order": 3},
      {"text": "Briefkastenschlüssel", "order": 4},
      {"text": "Sonstige Schlüssel", "order": 5}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;
