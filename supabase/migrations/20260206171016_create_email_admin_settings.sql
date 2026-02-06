/*
  # Admin E-Mail Settings: Reserved Aliases & Forwarding Rules

  1. New Tables
    - `reserved_email_aliases`
      - `alias_localpart` (text, primary key) - the blocked local part (e.g. "hello")
      - `reason` (text, nullable) - why it is reserved
      - `created_at` (timestamptz, default now())
    - `email_forwarding_rules`
      - `source_alias` (text, primary key) - local part to forward from (e.g. "willkommen")
      - `forward_to_email` (text, not null) - external email to forward to
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())

  2. Initial Data
    - Reserved aliases: hello, willkommen, info, support, admin, billing, noreply, postmaster

  3. Modified Functions
    - `update_user_mailbox_alias` - now checks reserved_email_aliases before allowing update
    - `generate_unique_alias` - now also skips reserved aliases
    - `handle_new_user_mailbox` - now also skips reserved aliases

  4. Security
    - RLS enabled on both tables
    - Only admins (via admin_users) can SELECT, INSERT, UPDATE, DELETE
    - No public access
*/

-- ============================================================
-- 1. reserved_email_aliases
-- ============================================================
CREATE TABLE IF NOT EXISTS reserved_email_aliases (
  alias_localpart TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reserved_email_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reserved aliases"
  ON reserved_email_aliases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "Admins can insert reserved aliases"
  ON reserved_email_aliases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "Admins can delete reserved aliases"
  ON reserved_email_aliases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

-- ============================================================
-- 2. email_forwarding_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS email_forwarding_rules (
  source_alias TEXT PRIMARY KEY,
  forward_to_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_forwarding_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view forwarding rules"
  ON email_forwarding_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "Admins can insert forwarding rules"
  ON email_forwarding_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "Admins can update forwarding rules"
  ON email_forwarding_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "Admins can delete forwarding rules"
  ON email_forwarding_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

-- ============================================================
-- 3. Backfill initial reserved aliases
-- ============================================================
INSERT INTO reserved_email_aliases (alias_localpart, reason)
VALUES
  ('hello', 'System-Adresse'),
  ('willkommen', 'System-Adresse'),
  ('info', 'System-Adresse'),
  ('support', 'System-Adresse'),
  ('admin', 'System-Adresse'),
  ('billing', 'System-Adresse'),
  ('noreply', 'System-Adresse'),
  ('postmaster', 'System-Adresse')
ON CONFLICT (alias_localpart) DO NOTHING;

-- ============================================================
-- 4. Update update_user_mailbox_alias to check reserved aliases
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_mailbox_alias(new_alias TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned TEXT;
  current_user_id UUID;
  full_address TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  cleaned := lower(trim(new_alias));

  IF length(cleaned) < 3 THEN
    RAISE EXCEPTION 'Alias muss mindestens 3 Zeichen lang sein';
  END IF;

  IF length(cleaned) > 64 THEN
    RAISE EXCEPTION 'Alias darf maximal 64 Zeichen lang sein';
  END IF;

  IF cleaned !~ '^[a-z0-9][a-z0-9._-]*[a-z0-9]$' THEN
    RAISE EXCEPTION 'Alias enthält ungültige Zeichen. Erlaubt: a-z, 0-9, Punkt, Minus, Unterstrich. Muss mit Buchstabe/Zahl beginnen und enden.';
  END IF;

  IF cleaned LIKE '%..%' THEN
    RAISE EXCEPTION 'Alias darf keine aufeinanderfolgenden Punkte enthalten';
  END IF;

  IF EXISTS (
    SELECT 1 FROM reserved_email_aliases
    WHERE alias_localpart = cleaned
  ) THEN
    RAISE EXCEPTION 'Dieser Alias ist reserviert und kann nicht verwendet werden';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_mailboxes
    WHERE alias_localpart = cleaned
    AND user_id != current_user_id
  ) THEN
    RAISE EXCEPTION 'Dieser Alias ist bereits vergeben';
  END IF;

  UPDATE user_mailboxes
  SET alias_localpart = cleaned,
      updated_at = now()
  WHERE user_id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Keine Mailbox für diesen Benutzer gefunden';
  END IF;

  full_address := cleaned || '@rentab.ly';
  RETURN full_address;
END;
$$;

-- ============================================================
-- 5. Update generate_unique_alias to also skip reserved aliases
-- ============================================================
CREATE OR REPLACE FUNCTION generate_unique_alias(base_alias TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
  suffix TEXT;
  attempts INT := 0;
BEGIN
  candidate := base_alias;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM user_mailboxes WHERE alias_localpart = candidate)
       AND NOT EXISTS (SELECT 1 FROM reserved_email_aliases WHERE alias_localpart = candidate)
    THEN
      RETURN candidate;
    END IF;

    attempts := attempts + 1;
    IF attempts > 50 THEN
      RAISE EXCEPTION 'Could not generate unique alias after 50 attempts for base: %', base_alias;
    END IF;

    suffix := '-' || substr(encode(gen_random_bytes(2), 'hex'), 1, 4);
    candidate := left(base_alias, 59) || suffix;
  END LOOP;
END;
$$;

-- ============================================================
-- 6. Update new user trigger to skip reserved aliases
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user_mailbox()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
BEGIN
  base_alias := sanitize_email_to_alias(NEW.email);
  final_alias := generate_unique_alias(base_alias);

  INSERT INTO user_mailboxes (user_id, alias_localpart)
  VALUES (NEW.id, final_alias)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
