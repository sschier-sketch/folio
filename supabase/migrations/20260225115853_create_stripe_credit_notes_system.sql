/*
  # Stripe Credit Notes Archive System

  1. New Tables
    - `stripe_credit_notes`
      - `id` (uuid, primary key)
      - `stripe_credit_note_id` (text, unique) - Stripe credit note ID (e.g. cn_xxx)
      - `stripe_invoice_id` (text) - Reference to the original invoice
      - `stripe_customer_id` (text, nullable)
      - `stripe_refund_id` (text, nullable) - Reference to the refund that triggered this
      - `number` (text, nullable) - Credit note number
      - `status` (text) - issued, void
      - `currency` (text)
      - `total` (bigint) - Total credit amount in cents (positive value)
      - `subtotal` (bigint, nullable)
      - `tax` (bigint, nullable)
      - `reason` (text, nullable) - Stripe reason code
      - `memo` (text, nullable) - Human-readable memo
      - `created_at_stripe` (timestamptz)
      - `customer_email` (text, nullable)
      - `customer_name` (text, nullable)
      - `pdf_url` (text, nullable) - Stripe's temporary PDF URL
      - `pdf_storage_path` (text, nullable) - Path in billing bucket
      - `pdf_cached_at` (timestamptz, nullable)
      - `updated_at` (timestamptz)
      - `raw` (jsonb, nullable) - Minimal Stripe payload for debugging

  2. Security
    - RLS enabled on stripe_credit_notes
    - Only admin users can SELECT (same pattern as stripe_invoices)
    - No INSERT/UPDATE/DELETE from client (service role only)

  3. Indexes
    - stripe_credit_note_id (unique, via table constraint)
    - stripe_invoice_id (for join lookups)
    - stripe_refund_id (for idempotency checks)
    - stripe_customer_id
    - created_at_stripe (for date range queries)

  4. Important Notes
    - PDF storage uses same billing bucket at path: stripe/credit_notes/YYYY/MM/{id}_{number}.pdf
    - Idempotency: stripe_refund_id column prevents duplicate credit notes per refund
*/

CREATE TABLE IF NOT EXISTS stripe_credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_credit_note_id text UNIQUE NOT NULL,
  stripe_invoice_id text NOT NULL,
  stripe_customer_id text,
  stripe_refund_id text,
  number text,
  status text NOT NULL DEFAULT 'issued',
  currency text NOT NULL DEFAULT 'eur',
  total bigint NOT NULL DEFAULT 0,
  subtotal bigint,
  tax bigint,
  reason text,
  memo text,
  created_at_stripe timestamptz NOT NULL DEFAULT now(),
  customer_email text,
  customer_name text,
  pdf_url text,
  pdf_storage_path text,
  pdf_cached_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb
);

ALTER TABLE stripe_credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view credit notes"
  ON stripe_credit_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_stripe_credit_notes_invoice_id
  ON stripe_credit_notes (stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_stripe_credit_notes_refund_id
  ON stripe_credit_notes (stripe_refund_id);

CREATE INDEX IF NOT EXISTS idx_stripe_credit_notes_customer_id
  ON stripe_credit_notes (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_credit_notes_created_at_stripe
  ON stripe_credit_notes (created_at_stripe DESC);