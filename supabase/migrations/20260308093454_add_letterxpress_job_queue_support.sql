/*
  # Add LetterXpress Job Queue Support

  1. Modified Tables
    - `letterxpress_jobs`
      - `pending_payload` (jsonb, nullable) - Stores the full PDF payload for async processing
      - `queued_at` (timestamptz, nullable) - When the job was queued for processing
      - `processing_started_at` (timestamptz, nullable) - When processing began
      - `retry_count` (integer, default 0) - Number of retry attempts

  2. Indexes
    - Index on status + queued_at for efficient queue polling

  3. Notes
    - Jobs with status='pending' and a non-null pending_payload are waiting to be sent
    - The process-letterxpress-queue edge function picks these up and submits them
    - After successful submission, pending_payload is cleared and status updated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'pending_payload'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN pending_payload jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'queued_at'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN queued_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'processing_started_at'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN processing_started_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_jobs' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE letterxpress_jobs ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_letterxpress_jobs_pending_queue
  ON letterxpress_jobs (status, queued_at)
  WHERE status = 'pending';
