/*
  # Create interest_rate_snapshots table

  Stores weekly snapshots of Bundesbank mortgage interest rate time-series data.

  1. New Tables
    - `interest_rate_snapshots`
      - `id` (uuid, primary key) - unique snapshot identifier
      - `source` (text, not null, default 'bundesbank') - data source identifier
      - `fetched_at` (timestamptz, not null, default now()) - when the data was fetched
      - `start_period` (text, nullable) - earliest data point period (YYYY-MM)
      - `end_period` (text, nullable) - latest data point period (YYYY-MM)
      - `series` (jsonb, not null) - full series data with meta and 4 interest rate series
      - `raw_hash` (text, not null) - SHA-256 hash of normalized series JSON for deduplication

  2. Constraints
    - Unique constraint on (source, raw_hash) to prevent duplicate snapshots

  3. Indexes
    - (source, fetched_at DESC) for efficient latest-snapshot lookups

  4. Security
    - RLS enabled
    - Authenticated users can read snapshots
    - Only service_role can insert (edge function)

  5. Notes
    - Series JSON contains 4 Bundesbank BBIM1 housing loan interest rate series
    - raw_hash is computed as SHA-256 of the stable-stringified series data
    - If data hasn't changed, no new row is inserted (idempotent)
*/

CREATE TABLE IF NOT EXISTS public.interest_rate_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'bundesbank',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  start_period text,
  end_period text,
  series jsonb NOT NULL,
  raw_hash text NOT NULL,
  CONSTRAINT interest_rate_snapshots_source_hash_unique UNIQUE (source, raw_hash)
);

CREATE INDEX IF NOT EXISTS idx_interest_rate_snapshots_source_fetched
  ON public.interest_rate_snapshots (source, fetched_at DESC);

ALTER TABLE public.interest_rate_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read interest rate snapshots"
  ON public.interest_rate_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert interest rate snapshots"
  ON public.interest_rate_snapshots
  FOR INSERT
  TO service_role
  WITH CHECK (true);
