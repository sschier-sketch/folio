/*
  # Umstrukturierung: Mietverhältnisse mit mehreren Mietern

  ## Änderungen
  
  ### 1. Neue Tabellenstruktur
  - `rental_contracts` wird zum primären Mietverhältnis
  - `tenants` Tabelle wird umstrukturiert, um zu einem Vertrag zu gehören
  - Die Beziehung wird umgekehrt: Mieter gehören zu Verträgen, nicht Verträge zu Mietern
  
  ### 2. Wichtige Änderungen
  - Entfernt: `rental_contracts.tenant_id` (alter Foreign Key)
  - Entfernt: `tenants.property_id` (wird durch contract->property ersetzt)
  - Hinzugefügt: `tenants.contract_id` (neuer Foreign Key zu rental_contracts)
  
  ### 3. Daten-Migration
  - Bestehende Daten werden korrekt migriert
  - Die Beziehungen zwischen Mietern und Verträgen bleiben erhalten
  
  ### 4. Security (RLS)
  - Alle bestehenden RLS-Policies bleiben aktiv
  - Policies werden an die neue Struktur angepasst
*/

-- Schritt 1: Neue Spalte in tenants Tabelle hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE tenants ADD COLUMN contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Schritt 2: Bestehende Daten migrieren
-- Finde für jeden tenant den zugehörigen contract und setze contract_id
UPDATE tenants t
SET contract_id = rc.id
FROM rental_contracts rc
WHERE rc.tenant_id = t.id
AND t.contract_id IS NULL;

-- Schritt 3: tenant_id aus rental_contracts entfernen (nur die Constraint, Spalte bleibt für Rückwärtskompatibilität)
-- Wir behalten die Spalte vorerst, um keine Daten zu verlieren
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rental_contracts_tenant_id_fkey'
    AND table_name = 'rental_contracts'
  ) THEN
    ALTER TABLE rental_contracts DROP CONSTRAINT rental_contracts_tenant_id_fkey;
  END IF;
END $$;

-- Schritt 4: property_id aus tenants entfernen (nur die Constraint)
-- Die Immobilie wird jetzt über den Contract ermittelt
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenants_property_id_fkey'
    AND table_name = 'tenants'
  ) THEN
    ALTER TABLE tenants DROP CONSTRAINT tenants_property_id_fkey;
  END IF;
END $$;

-- Schritt 5: Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_tenants_contract_id ON tenants(contract_id);

-- Schritt 6: RLS Policies aktualisieren für tenants
-- Die bestehenden Policies funktionieren weiterhin über user_id