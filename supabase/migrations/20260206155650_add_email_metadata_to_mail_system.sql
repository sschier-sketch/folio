/*
  # Add E-Mail Metadata to Mail System

  Extends mail_messages and mail_threads with fields needed for
  inbound e-mail processing via Resend webhooks.

  1. Modified Tables
    - `mail_messages`
      - `email_message_id` (text, nullable) -- RFC 5322 Message-ID for idempotency
      - `in_reply_to` (text, nullable)       -- RFC 5322 In-Reply-To header
      - `email_references` (text[], nullable) -- RFC 5322 References header list
      - `received_at` (timestamptz, nullable) -- original reception timestamp
      - UNIQUE constraint on (user_id, email_message_id) for deduplication

    - `mail_threads`
      - `last_email_message_id` (text, nullable) -- most recent Message-ID (for threading)

  2. New Index
    - Partial unique index on mail_messages(user_id, email_message_id) for idempotency
    - Index on mail_threads(user_id, external_email) for sender lookup

  3. RPC Function
    - `assign_thread_to_tenant(p_thread_id, p_tenant_id)` moves a thread
      from 'unknown' to 'inbox' and links the tenant.

  4. Security
    - RPC is SECURITY DEFINER, validates ownership before executing
*/

-- ============================================================
-- 1. mail_messages: email metadata columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_messages' AND column_name = 'email_message_id'
  ) THEN
    ALTER TABLE mail_messages ADD COLUMN email_message_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_messages' AND column_name = 'in_reply_to'
  ) THEN
    ALTER TABLE mail_messages ADD COLUMN in_reply_to TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_messages' AND column_name = 'email_references'
  ) THEN
    ALTER TABLE mail_messages ADD COLUMN email_references TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_messages' AND column_name = 'received_at'
  ) THEN
    ALTER TABLE mail_messages ADD COLUMN received_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mail_messages_idempotent
  ON mail_messages (user_id, email_message_id)
  WHERE email_message_id IS NOT NULL;

-- ============================================================
-- 2. mail_threads: last email message-id for threading
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_threads' AND column_name = 'last_email_message_id'
  ) THEN
    ALTER TABLE mail_threads ADD COLUMN last_email_message_id TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mail_threads_external_email
  ON mail_threads (user_id, external_email)
  WHERE external_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mail_threads_last_msg_id
  ON mail_threads (user_id, last_email_message_id)
  WHERE last_email_message_id IS NOT NULL;

-- ============================================================
-- 3. RPC: assign unknown thread to a tenant
-- ============================================================
CREATE OR REPLACE FUNCTION assign_thread_to_tenant(
  p_thread_id UUID,
  p_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_owner UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM mail_threads
  WHERE id = p_thread_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO v_tenant_owner
  FROM tenants
  WHERE id = p_tenant_id AND is_deleted = false;

  IF v_tenant_owner IS NULL OR v_tenant_owner != auth.uid() THEN
    RAISE EXCEPTION 'Tenant not found or not owned by user';
  END IF;

  UPDATE mail_threads
  SET
    tenant_id = p_tenant_id,
    folder = 'inbox',
    external_email = COALESCE(
      (SELECT email FROM tenants WHERE id = p_tenant_id),
      external_email
    ),
    updated_at = now()
  WHERE id = p_thread_id;
END;
$$;
