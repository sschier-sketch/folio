/*
  # Add missing foreign key from rental_contracts.tenant_id to tenants.id

  1. Data Cleanup
    - Sets tenant_id to NULL on rental_contracts where the referenced tenant
      no longer exists (orphaned references)

  2. Schema Changes
    - Adds foreign key constraint `rental_contracts_tenant_id_fkey`
      from `rental_contracts.tenant_id` to `tenants.id` with ON DELETE SET NULL
    - This enables PostgREST embedded selects (joins) through this relationship

  3. Important
    - Without this FK, Supabase client queries that join rental_contracts
      with tenants via tenant_id fail silently, causing data not to load
      (e.g., index rent calculations list)
*/

UPDATE rental_contracts
SET tenant_id = NULL
WHERE tenant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = rental_contracts.tenant_id);

ALTER TABLE rental_contracts
  ADD CONSTRAINT rental_contracts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
