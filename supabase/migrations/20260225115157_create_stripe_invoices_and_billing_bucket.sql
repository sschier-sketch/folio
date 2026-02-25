/*
  # Stripe Invoices Archive & Billing Storage Bucket

  1. New Tables
    - `stripe_invoices`
      - `id` (uuid, primary key)
      - `stripe_invoice_id` (text, unique) - Stripe invoice ID (e.g. in_xxx)
      - `stripe_customer_id` (text, nullable)
      - `invoice_number` (text, nullable)
      - `status` (text) - open, paid, void, uncollectible, draft
      - `currency` (text)
      - `total` (bigint) - amount in cents
      - `tax` (bigint, nullable) - tax in cents
      - `subtotal` (bigint, nullable) - subtotal in cents
      - `created_at_stripe` (timestamptz)
      - `period_start` (timestamptz, nullable)
      - `period_end` (timestamptz, nullable)
      - `customer_email` (text, nullable)
      - `customer_name` (text, nullable)
      - `hosted_invoice_url` (text, nullable)
      - `invoice_pdf_url` (text, nullable) - Stripe's temporary PDF URL (reference only)
      - `pdf_storage_path` (text, nullable) - path in billing bucket
      - `pdf_cached_at` (timestamptz, nullable)
      - `updated_at` (timestamptz)
      - `raw` (jsonb, nullable) - minimal Stripe payload for debugging

  2. Storage
    - Creates private `billing` bucket for PDF archival
    - Path convention: stripe/invoices/YYYY/MM/{stripe_invoice_id}_{invoice_number}.pdf

  3. Security
    - RLS enabled on stripe_invoices
    - Only admin users can SELECT
    - No INSERT/UPDATE/DELETE from client (service role only)
    - Billing bucket is private, no public access

  4. Indexes
    - stripe_invoice_id (unique)
    - stripe_customer_id
    - status
    - created_at_stripe
    - customer_email

  5. Cron Job
    - Daily sync at 03:30 Europe/Berlin via pg_net calling sync-stripe-invoices edge function
*/

CREATE TABLE IF NOT EXISTS stripe_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_customer_id text,
  invoice_number text,
  status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'eur',
  total bigint NOT NULL DEFAULT 0,
  tax bigint,
  subtotal bigint,
  created_at_stripe timestamptz NOT NULL DEFAULT now(),
  period_start timestamptz,
  period_end timestamptz,
  customer_email text,
  customer_name text,
  hosted_invoice_url text,
  invoice_pdf_url text,
  pdf_storage_path text,
  pdf_cached_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb
);

ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invoices"
  ON stripe_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_id
  ON stripe_invoices (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status
  ON stripe_invoices (status);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_created_at_stripe
  ON stripe_invoices (created_at_stripe DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_email
  ON stripe_invoices (customer_email);

INSERT INTO storage.buckets (id, name, public)
VALUES ('billing', 'billing', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.trigger_sync_stripe_invoices_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://mypuvkzsgwanilduniup.supabase.co';
  END IF;

  v_service_role_key := current_setting('app.settings.service_role_key', true);

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/sync-stripe-invoices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
    ),
    body := '{"source": "cron"}'::jsonb
  );
END;
$$;

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'sync-stripe-invoices-daily';

SELECT cron.schedule(
  'sync-stripe-invoices-daily',
  '30 3 * * *',
  $$SELECT public.trigger_sync_stripe_invoices_daily()$$
);