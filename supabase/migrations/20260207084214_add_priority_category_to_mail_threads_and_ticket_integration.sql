/*
  # Integrate Tenant Tickets into Mail System

  1. Schema Changes
    - Add `priority` column to `mail_threads` (text, nullable: 'low', 'medium', 'high')
    - Add `category` column to `mail_threads` (text, nullable)
    - Add `ticket_id` column to `mail_threads` (uuid, nullable, FK to tickets)
    - Add index on `ticket_id` for fast lookups

  2. Trigger Functions
    - `create_mail_thread_from_ticket()`: When a ticket is created, automatically
      creates a corresponding mail_thread in the landlord's inbox
    - `create_mail_message_from_ticket_message()`: When a ticket_message is created
      by a tenant, creates a corresponding mail_message in the thread

  3. Purpose
    - Tenant portal tickets now appear in the landlord's Nachrichten inbox
    - Priority and category fields allow visual indicators (flags, tags)
    - Eliminates the need for a separate ticket management view
*/

-- Add priority, category, and ticket_id to mail_threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_threads' AND column_name = 'priority'
  ) THEN
    ALTER TABLE mail_threads ADD COLUMN priority text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_threads' AND column_name = 'category'
  ) THEN
    ALTER TABLE mail_threads ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_threads' AND column_name = 'ticket_id'
  ) THEN
    ALTER TABLE mail_threads ADD COLUMN ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mail_threads_ticket_id ON mail_threads(ticket_id);
CREATE INDEX IF NOT EXISTS idx_mail_threads_priority ON mail_threads(priority);

-- Trigger: create mail_thread when a ticket is created
CREATE OR REPLACE FUNCTION create_mail_thread_from_ticket()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_tenant_name text;
  v_tenant_email text;
  v_thread_id uuid;
BEGIN
  SELECT
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
    email
  INTO v_tenant_name, v_tenant_email
  FROM tenants WHERE id = NEW.tenant_id;

  v_tenant_name := TRIM(v_tenant_name);

  INSERT INTO mail_threads (
    user_id, tenant_id, external_email, external_name,
    subject, folder, status, last_message_at, message_count,
    priority, category, ticket_id
  ) VALUES (
    NEW.user_id, NEW.tenant_id, v_tenant_email, v_tenant_name,
    NEW.subject, 'inbox', 'unread', now(), 0,
    NEW.priority, NEW.category, NEW.id
  ) RETURNING id INTO v_thread_id;

  UPDATE tickets SET email_thread_id = v_thread_id::text WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_mail_thread_from_ticket ON tickets;
CREATE TRIGGER trigger_create_mail_thread_from_ticket
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_mail_thread_from_ticket();

-- Trigger: create mail_message when a ticket_message is created by tenant
CREATE OR REPLACE FUNCTION create_mail_message_from_ticket_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_thread_id uuid;
  v_user_id uuid;
  v_tenant_email text;
  v_tenant_name text;
BEGIN
  SELECT
    t.email_thread_id::uuid,
    t.user_id,
    tn.email,
    TRIM(COALESCE(tn.first_name, '') || ' ' || COALESCE(tn.last_name, ''))
  INTO v_thread_id, v_user_id, v_tenant_email, v_tenant_name
  FROM tickets t
  LEFT JOIN tenants tn ON tn.id = t.tenant_id
  WHERE t.id = NEW.ticket_id;

  IF v_thread_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_type = 'tenant' THEN
    INSERT INTO mail_messages (
      thread_id, user_id, direction,
      sender_address, sender_name,
      recipient_address, recipient_name,
      body_text
    ) VALUES (
      v_thread_id, v_user_id, 'inbound',
      COALESCE(v_tenant_email, NEW.sender_email, ''),
      COALESCE(v_tenant_name, NEW.sender_name, ''),
      '', '',
      NEW.message
    );

    UPDATE mail_threads SET
      last_message_at = now(),
      message_count = message_count + 1,
      status = 'unread',
      folder = 'inbox',
      updated_at = now()
    WHERE id = v_thread_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_mail_message_from_ticket_message ON ticket_messages;
CREATE TRIGGER trigger_create_mail_message_from_ticket_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_mail_message_from_ticket_message();

-- Backfill: create mail threads for existing open tickets that don't have one yet
DO $$
DECLARE
  r RECORD;
  v_tenant_name text;
  v_tenant_email text;
  v_thread_id uuid;
  v_msg RECORD;
BEGIN
  FOR r IN
    SELECT t.*
    FROM tickets t
    WHERE t.status IN ('open', 'in_progress')
    AND (t.email_thread_id IS NULL OR t.email_thread_id = '')
    AND t.tenant_id IS NOT NULL
    AND t.user_id IS NOT NULL
  LOOP
    SELECT
      TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
      email
    INTO v_tenant_name, v_tenant_email
    FROM tenants WHERE id = r.tenant_id;

    INSERT INTO mail_threads (
      user_id, tenant_id, external_email, external_name,
      subject, folder, status, last_message_at, message_count,
      priority, category, ticket_id
    ) VALUES (
      r.user_id, r.tenant_id, v_tenant_email, v_tenant_name,
      r.subject, 'inbox', 'unread', COALESCE(r.updated_at, r.created_at, now()), 0,
      r.priority, r.category, r.id
    ) RETURNING id INTO v_thread_id;

    UPDATE tickets SET email_thread_id = v_thread_id::text WHERE id = r.id;

    FOR v_msg IN
      SELECT * FROM ticket_messages
      WHERE ticket_id = r.id AND sender_type = 'tenant'
      ORDER BY created_at ASC
    LOOP
      INSERT INTO mail_messages (
        thread_id, user_id, direction,
        sender_address, sender_name,
        recipient_address, recipient_name,
        body_text, created_at
      ) VALUES (
        v_thread_id, r.user_id, 'inbound',
        COALESCE(v_tenant_email, v_msg.sender_email, ''),
        COALESCE(v_tenant_name, v_msg.sender_name, ''),
        '', '',
        v_msg.message, v_msg.created_at
      );

      UPDATE mail_threads SET
        message_count = message_count + 1,
        last_message_at = GREATEST(last_message_at, v_msg.created_at)
      WHERE id = v_thread_id;
    END LOOP;
  END LOOP;
END $$;
