/*
  # Add tenant and document linking to letterxpress_jobs

  1. Modified Tables
    - `letterxpress_jobs`
      - `tenant_id` (uuid, nullable) - Links postal job to a tenant
      - `save_to_tenant_file` (boolean, default false) - Whether to save PDF to tenant file
      - `publish_to_portal` (boolean, default false) - Whether to make PDF visible in tenant portal
      - `document_id` (uuid, nullable) - Reference to property_documents entry if saved

  2. Important Notes
    - tenant_id is nullable because not every letter is linked to a tenant
    - document_id is nullable because the document entry is created only when save_to_tenant_file is true
    - No destructive changes to existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'save_to_tenant_file'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN save_to_tenant_file boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'publish_to_portal'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN publish_to_portal boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN document_id uuid REFERENCES property_documents(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_letterxpress_jobs_tenant_id ON letterxpress_jobs(tenant_id) WHERE tenant_id IS NOT NULL;
