/*
  # Fix: property_id in tenants Tabelle als nullable

  ## Problem
  Die property_id Spalte in der tenants Tabelle ist noch NOT NULL,
  obwohl wir sie nicht mehr benötigen (Immobilie kommt über Contract).

  ## Lösung
  - Mache property_id nullable, um neue Mieter ohne property_id zu ermöglichen
  - Bestehende Daten bleiben unverändert
*/

-- property_id in tenants nullable machen
ALTER TABLE tenants ALTER COLUMN property_id DROP NOT NULL;
