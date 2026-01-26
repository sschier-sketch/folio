/*
  # Erweiterte Ausstattungsmerkmale für Immobilien

  1. Neue Felder
    - `barrier_free` (boolean) - Barrierefrei
    - `furnished` (boolean) - Möbliert
    - `condition` (text) - Zustand (Erstbezug, Neuwertig, Renoviert, Gepflegt)
    - `flooring` (text) - Bodenbelag (Parkett, Laminat, Fliesen, Teppich, Vinyl, Dielen)

  2. Änderungen
    - Ergänzung der property_equipment Tabelle mit neuen Feldern für detailliertere Immobilienbeschreibungen
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'barrier_free'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN barrier_free boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'furnished'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN furnished boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'condition'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN condition text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_equipment' AND column_name = 'flooring'
  ) THEN
    ALTER TABLE property_equipment ADD COLUMN flooring text;
  END IF;
END $$;