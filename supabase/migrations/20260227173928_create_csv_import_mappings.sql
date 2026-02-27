/*
  # CSV Import Mappings

  Stores user-defined column mappings for bank CSV imports.
  Each user can save multiple named mappings (e.g. "Sparkasse CSV", "DKB Export").

  ## New table: csv_import_mappings
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `name` (text) - user-friendly label for this mapping
    - `mapping` (jsonb) - column name assignments (bookingDate, amount, etc.)
    - `settings` (jsonb) - delimiter, decimalSeparator, dateFormat, skipRows, encoding
    - `created_at` / `updated_at` timestamps

  ## Security
    - RLS enabled, user_id = auth.uid() on all operations
*/

CREATE TABLE IF NOT EXISTS public.csv_import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.csv_import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own csv mappings"
  ON public.csv_import_mappings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own csv mappings"
  ON public.csv_import_mappings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own csv mappings"
  ON public.csv_import_mappings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own csv mappings"
  ON public.csv_import_mappings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_csv_import_mappings_user_id ON public.csv_import_mappings(user_id);

CREATE OR REPLACE FUNCTION public.set_csv_import_mappings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_csv_import_mappings_updated_at
  BEFORE UPDATE ON public.csv_import_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_csv_import_mappings_updated_at();
