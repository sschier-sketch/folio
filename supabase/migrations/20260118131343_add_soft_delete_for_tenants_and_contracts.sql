/*
  # Soft Delete für Mietverhältnisse und Mieter

  1. Änderungen
    - Fügt 'archived' als möglichen Status für rental_contracts hinzu
    - Erstellt Indizes für is_active und status Felder
    - Fügt Trigger hinzu, um Mieter automatisch zu deaktivieren wenn Vertrag archiviert wird
  
  2. Zweck
    - Verhindert Datenverlust bei Löschungen
    - Ermöglicht weiterhin Zugriff auf archivierte Daten für Tickets
    - Historische Daten bleiben erhalten für Berichte
*/

-- Füge Index für is_active auf tenants hinzu (falls nicht vorhanden)
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- Füge Index für status auf rental_contracts hinzu (falls nicht vorhanden)
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);

-- Funktion um Mieter zu deaktivieren wenn Mietverhältnis archiviert wird
CREATE OR REPLACE FUNCTION archive_tenant_on_contract_archive()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Wenn der Contract-Status auf 'archived' oder 'terminated' gesetzt wird
  IF NEW.status IN ('archived', 'terminated') AND OLD.status NOT IN ('archived', 'terminated') THEN
    -- Setze den zugehörigen Mieter auf is_active = false
    IF NEW.tenant_id IS NOT NULL THEN
      UPDATE tenants
      SET is_active = false
      WHERE id = NEW.tenant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger erstellen (falls nicht vorhanden)
DROP TRIGGER IF EXISTS trigger_archive_tenant_on_contract_archive ON rental_contracts;
CREATE TRIGGER trigger_archive_tenant_on_contract_archive
  AFTER UPDATE ON rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION archive_tenant_on_contract_archive();
