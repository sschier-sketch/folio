/*
  # Create Property Value History Tracking

  1. New Tables
    - `property_value_history`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `user_id` (uuid, foreign key to auth.users)
      - `value` (numeric) - Property value at this point in time
      - `recorded_at` (timestamptz) - When this value was recorded
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `property_value_history` table
    - Add policies for users to manage their own property value history

  3. Indexes
    - Add index on property_id for faster lookups
    - Add index on user_id for faster user-specific queries
    - Add index on recorded_at for time-based queries
*/

-- Create property value history table
CREATE TABLE IF NOT EXISTS property_value_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value numeric(15,2) NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_value_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own property value history"
  ON property_value_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property value history"
  ON property_value_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own property value history"
  ON property_value_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_value_history_property_id 
  ON property_value_history(property_id);

CREATE INDEX IF NOT EXISTS idx_property_value_history_user_id 
  ON property_value_history(user_id);

CREATE INDEX IF NOT EXISTS idx_property_value_history_recorded_at 
  ON property_value_history(recorded_at DESC);

-- Create a function to automatically record property value changes
CREATE OR REPLACE FUNCTION record_property_value_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only record if current_value has changed
  IF (TG_OP = 'UPDATE' AND OLD.current_value IS DISTINCT FROM NEW.current_value) OR
     (TG_OP = 'INSERT' AND NEW.current_value IS NOT NULL AND NEW.current_value > 0) THEN
    INSERT INTO property_value_history (property_id, user_id, value, recorded_at)
    VALUES (NEW.id, NEW.user_id, NEW.current_value, now());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically record value changes
DROP TRIGGER IF EXISTS trigger_record_property_value_change ON properties;
CREATE TRIGGER trigger_record_property_value_change
  AFTER INSERT OR UPDATE OF current_value ON properties
  FOR EACH ROW
  EXECUTE FUNCTION record_property_value_change();

-- Backfill existing property values into history
INSERT INTO property_value_history (property_id, user_id, value, recorded_at)
SELECT 
  id,
  user_id,
  current_value,
  COALESCE(updated_at, created_at, now()) as recorded_at
FROM properties
WHERE current_value IS NOT NULL AND current_value > 0
ON CONFLICT DO NOTHING;