/*
  # Backfill property_id und tenant_id in rent_payments (sicher)

  1. Änderungen
    - Aktualisiert bestehende rent_payments Einträge mit property_id und tenant_id aus rental_contracts
    - Nur für Einträge, bei denen die tenant_id auch in der tenants-Tabelle existiert

  2. Security
    - Keine Änderungen an RLS-Policies
*/

-- Update property_id for existing rent_payments with contract_id
UPDATE rent_payments
SET property_id = rc.property_id
FROM rental_contracts rc
WHERE 
  rent_payments.contract_id = rc.id
  AND rent_payments.property_id IS NULL;

-- Update tenant_id for existing rent_payments with contract_id (only if tenant exists)
UPDATE rent_payments
SET tenant_id = rc.tenant_id
FROM rental_contracts rc
WHERE 
  rent_payments.contract_id = rc.id
  AND rent_payments.tenant_id IS NULL
  AND EXISTS (SELECT 1 FROM tenants WHERE tenants.id = rc.tenant_id);
