/*
  # Create Mail Threads System for unified Nachrichten

  1. New Tables
    - `mail_threads`
      - `id` (uuid, PK)
      - `user_id` (uuid, FK → auth.users) – mailbox owner
      - `tenant_id` (uuid, FK → tenants, nullable) – linked tenant
      - `external_email` (text, nullable) – for non-tenant contacts
      - `external_name` (text, nullable) – display name
      - `subject` (text)
      - `folder` (text) – inbox, sent, unknown
      - `status` (text) – unread, read, archived
      - `last_message_at` (timestamptz)
      - `message_count` (int, default 0)
      - `created_at`, `updated_at`

    - `mail_messages`
      - `id` (uuid, PK)
      - `thread_id` (uuid, FK → mail_threads)
      - `user_id` (uuid, FK → auth.users) – mailbox owner
      - `direction` (text) – inbound / outbound
      - `sender_address` (text) – full email
      - `sender_name` (text)
      - `recipient_address` (text) – full email
      - `recipient_name` (text)
      - `body_text` (text) – plain text content
      - `body_html` (text, nullable)
      - `tenant_communication_id` (uuid, FK → tenant_communications, nullable) – links to existing comm
      - `created_at` (timestamptz)

  2. Indexes
    - thread: user_id + folder, last_message_at DESC
    - message: thread_id, created_at

  3. Backfill
    - Converts existing tenant_communications (non-deleted) into threads/messages
    - One thread per tenant per user, aggregating all communications

  4. Security
    - RLS on both tables
    - Users can only access own threads and messages
    - Admins can view all
*/

-- ============================================================
-- 1. mail_threads
-- ============================================================
CREATE TABLE IF NOT EXISTS mail_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  external_email TEXT,
  external_name TEXT,
  subject TEXT NOT NULL DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'unknown')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_threads_user_folder ON mail_threads (user_id, folder, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_threads_tenant ON mail_threads (tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================
-- 2. mail_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES mail_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  sender_address TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT '',
  recipient_address TEXT NOT NULL DEFAULT '',
  recipient_name TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT,
  tenant_communication_id UUID REFERENCES tenant_communications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_messages_thread ON mail_messages (thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_mail_messages_user ON mail_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_tenant_comm ON mail_messages (tenant_communication_id) WHERE tenant_communication_id IS NOT NULL;

-- ============================================================
-- 3. RLS on mail_threads
-- ============================================================
ALTER TABLE mail_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own threads"
  ON mail_threads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all threads"
  ON mail_threads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Users can insert own threads"
  ON mail_threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON mail_threads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON mail_threads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. RLS on mail_messages
-- ============================================================
ALTER TABLE mail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON mail_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages"
  ON mail_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Users can insert own messages"
  ON mail_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON mail_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. Backfill: create threads from existing tenant_communications
-- ============================================================
DO $$
DECLARE
  r RECORD;
  thread_uuid UUID;
  user_alias TEXT;
  tenant_rec RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT tc.user_id, tc.tenant_id
    FROM tenant_communications tc
    WHERE tc.is_deleted = false
    ORDER BY tc.user_id, tc.tenant_id
  LOOP
    SELECT t.first_name, t.last_name, t.email
    INTO tenant_rec
    FROM tenants t WHERE t.id = r.tenant_id;

    SELECT alias_localpart INTO user_alias
    FROM user_mailboxes WHERE user_mailboxes.user_id = r.user_id;

    thread_uuid := gen_random_uuid();

    INSERT INTO mail_threads (id, user_id, tenant_id, subject, folder, status, last_message_at, message_count, created_at)
    SELECT
      thread_uuid,
      r.user_id,
      r.tenant_id,
      COALESCE(tenant_rec.first_name || ' ' || tenant_rec.last_name, 'Mieter'),
      'sent',
      'read',
      MAX(tc.created_at),
      COUNT(*),
      MIN(tc.created_at)
    FROM tenant_communications tc
    WHERE tc.user_id = r.user_id
      AND tc.tenant_id = r.tenant_id
      AND tc.is_deleted = false
      AND tc.is_internal = false;

    INSERT INTO mail_messages (thread_id, user_id, direction, sender_address, sender_name, recipient_address, recipient_name, body_text, tenant_communication_id, created_at)
    SELECT
      thread_uuid,
      tc.user_id,
      'outbound',
      COALESCE(user_alias || '@rentab.ly', ''),
      '',
      COALESCE(tenant_rec.email, ''),
      COALESCE(tenant_rec.first_name || ' ' || tenant_rec.last_name, ''),
      COALESCE(tc.subject || E'\n\n' || tc.content, tc.subject, ''),
      tc.id,
      tc.created_at
    FROM tenant_communications tc
    WHERE tc.user_id = r.user_id
      AND tc.tenant_id = r.tenant_id
      AND tc.is_deleted = false
      AND tc.is_internal = false
    ORDER BY tc.created_at ASC;
  END LOOP;
END;
$$;
