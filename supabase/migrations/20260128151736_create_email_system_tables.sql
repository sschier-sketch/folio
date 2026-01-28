/*
  # Email System: Logging and Cron Management

  1. New Tables
    - `email_logs` (email_outbox)
      - Tracks ALL outgoing emails
      - Supports idempotency
      - Status tracking (queued/sent/failed/skipped)
      - Provider metadata (Resend message ID)

    - `cron_runs`
      - Tracks cron job executions
      - Debugging and monitoring
      - Performance metrics

  2. Security
    - Enable RLS on both tables
    - Admin-only access for viewing logs
    - System can insert/update without user context

  3. Indexes
    - Performance indexes for common queries
    - Unique constraint on idempotency_key
*/

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_type text NOT NULL,
  category text NOT NULL CHECK (category IN ('transactional', 'informational')),
  to_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_code text,
  error_message text,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  CONSTRAINT unique_idempotency_key UNIQUE NULLS NOT DISTINCT (idempotency_key)
);

-- Cron Runs Table
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  processed_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_mail_type ON public.email_logs(mail_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON public.email_logs(category);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);

CREATE INDEX IF NOT EXISTS idx_cron_runs_job_name ON public.cron_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_runs_started_at ON public.cron_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_runs_status ON public.cron_runs(status);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin Only
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all cron runs"
  ON public.cron_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Service Role can insert/update (for Edge Functions)
CREATE POLICY "Service role can manage email logs"
  ON public.email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage cron runs"
  ON public.cron_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.email_logs IS 'Central log of all outgoing emails with idempotency support';
COMMENT ON TABLE public.cron_runs IS 'Execution log for cron jobs';
COMMENT ON COLUMN public.email_logs.idempotency_key IS 'Unique key to prevent duplicate sends (e.g., userId:mailType:date)';
COMMENT ON COLUMN public.email_logs.metadata IS 'Additional context (e.g., invoiceId, cronRunId, referralId)';
