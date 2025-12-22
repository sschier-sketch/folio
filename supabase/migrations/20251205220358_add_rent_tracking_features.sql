/*
  # Erweiterte Mietverwaltung und Mieteingänge

  1. Änderungen an rental_contracts Tabelle
    - `document_path` (text) - Pfad zum hochgeladenen Dokument im Storage
    - `rent_increase_type` (text) - Art der Mieterhöhung: 'none', 'staffel', 'index'
    - `staffel_amount` (numeric) - Betrag der Staffelmiete
    - `staffel_type` (text) - 'percentage' oder 'fixed'
    - `staffel_years` (integer) - Anzahl Jahre für Staffelmiete
    - `index_first_increase_date` (date) - Datum der ersten Indexmieterhöhung

  2. Neue Tabelle: rent_payments
    - `id` (uuid, primary key)
    - `contract_id` (uuid, foreign key) - Referenz zum Mietvertrag
    - `property_id` (uuid, foreign key) - Referenz zur Immobilie
    - `tenant_id` (uuid, foreign key) - Referenz zum Mieter
    - `user_id` (uuid, foreign key) - Referenz zum Benutzer
    - `due_date` (date) - Fälligkeitsdatum
    - `amount` (numeric) - Fälliger Betrag
    - `paid` (boolean) - Bezahlt-Status
    - `paid_date` (date) - Zahlungsdatum
    - `notes` (text) - Notizen
    - `created_at` (timestamptz)

  3. Storage Bucket
    - Bucket für Vertragsdokumente

  4. Security
    - Enable RLS auf rent_payments
    - Policies für rent_payments
    - Storage policies für documents bucket
*/

-- Erweitere rental_contracts Tabelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'document_path'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN document_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'rent_increase_type'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN rent_increase_type text DEFAULT 'none';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'staffel_amount'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN staffel_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'staffel_type'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN staffel_type text DEFAULT 'percentage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'staffel_years'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN staffel_years integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'index_first_increase_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN index_first_increase_date date;
  END IF;
END $$;

-- Erstelle rent_payments Tabelle
CREATE TABLE IF NOT EXISTS rent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean DEFAULT false,
  paid_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

-- Policies für rent_payments
CREATE POLICY "Users can view own rent payments"
  ON rent_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rent payments"
  ON rent_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rent payments"
  ON rent_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rent payments"
  ON rent_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage Bucket für Dokumente (falls nicht existiert)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can upload own contract documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contract-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own contract documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contract-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own contract documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contract-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
