/*
  # Robust Audit Logging - Schema Enhancement

  ## Summary
  Enhances the property_history table to support comprehensive, fault-tolerant
  audit logging across all property-related entities. Creates a logging_failures
  table to capture any errors without ever blocking data writes.

  ## Modified Tables
  ### `property_history`
  - `user_id` - Made nullable (supports system/service-role writes)
  - `event_type` - CHECK constraint removed (supports dynamic event types)
  - `event_description` - Added default empty string
  - New columns:
    - `entity_type` (text) - Type of entity (property, unit, tenant, etc.)
    - `entity_id` (uuid) - ID of the changed entity
    - `action` (text) - create, update, delete
    - `source` (text) - trigger, app, edge, system
    - `changes` (jsonb) - Field-wise diff {field: {old, new}} or snapshot

  ## New Tables
  ### `logging_failures`
  - Error tracking for failed audit log attempts
  - `id` (uuid, primary key)
  - `table_name` (text) - Source table of the failed log
  - `operation` (text) - INSERT/UPDATE/DELETE
  - `record_id` (uuid, nullable) - Affected record
  - `error_message` (text) - Error description
  - `error_detail` (text) - SQL error state code
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on logging_failures (admin-only read access)

  ## Indexes
  - property_history(entity_type, entity_id)
  - property_history(action)
  - property_history(source)
  - property_history(created_at)
  - logging_failures(created_at)
*/

-- 1. Make user_id nullable (supports system/cron/service-role writes)
ALTER TABLE property_history ALTER COLUMN user_id DROP NOT NULL;

-- 2. Remove restrictive CHECK constraint on event_type
ALTER TABLE property_history DROP CONSTRAINT IF EXISTS property_history_event_type_check;

-- 3. Set default for event_description so trigger inserts never fail
ALTER TABLE property_history ALTER COLUMN event_description SET DEFAULT '';

-- 4. Add new columns for richer audit data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_history' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE property_history ADD COLUMN entity_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_history' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE property_history ADD COLUMN entity_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_history' AND column_name = 'action'
  ) THEN
    ALTER TABLE property_history ADD COLUMN action text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_history' AND column_name = 'source'
  ) THEN
    ALTER TABLE property_history ADD COLUMN source text DEFAULT 'app';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_history' AND column_name = 'changes'
  ) THEN
    ALTER TABLE property_history ADD COLUMN changes jsonb;
  END IF;
END $$;

-- 5. Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_property_history_entity
  ON property_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_property_history_action
  ON property_history(action);
CREATE INDEX IF NOT EXISTS idx_property_history_source
  ON property_history(source);
CREATE INDEX IF NOT EXISTS idx_property_history_created_at
  ON property_history(created_at);

-- 6. Create logging_failures table for error tracking
CREATE TABLE IF NOT EXISTS logging_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL DEFAULT '',
  operation text NOT NULL DEFAULT '',
  record_id uuid,
  error_message text,
  error_detail text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE logging_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logging failures"
  ON logging_failures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert logging failures"
  ON logging_failures FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_logging_failures_created_at
  ON logging_failures(created_at);
