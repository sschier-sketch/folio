/*
  # Create User Mailboxes System (@rentab.ly personal email aliases)

  1. New Tables
    - `user_mailboxes`
      - `user_id` (uuid, primary key, FK → auth.users)
      - `alias_localpart` (text, unique) – the part before @rentab.ly
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `is_active` (boolean, default true)

  2. Constraints
    - `alias_localpart` is globally UNIQUE
    - Lowercase only, allowed chars: a-z, 0-9, dot, hyphen, underscore
    - Length 3–64 characters
    - No leading/trailing dots, no consecutive dots
    - CHECK constraint enforces all rules at DB level

  3. Helper Functions
    - `sanitize_email_to_alias(email TEXT)` – converts an email local part to a valid alias
      - Transliterates German umlauts (ae, oe, ue, ss)
      - Strips invalid characters
      - Collapses consecutive dots/hyphens/underscores
      - Ensures minimum length
    - `generate_unique_alias(base_alias TEXT)` – appends random suffix on collision
    - `update_user_mailbox_alias(new_alias TEXT)` – RPC for users to change their alias

  4. Backfill
    - All existing auth.users get a mailbox
    - Alias derived from their email login (sanitized + collision-safe)

  5. Trigger
    - On new user creation (auth.users insert), auto-create mailbox

  6. Security
    - RLS enabled on `user_mailboxes`
    - Users can SELECT/UPDATE only their own row
    - Admins (via admin_users table) can SELECT all rows
    - No direct INSERT/DELETE by users (system-managed)

  7. Notes
    - The full email address is virtual: alias_localpart || '@rentab.ly'
    - Collision resolution uses a random 4-char hex suffix (not sequential)
    - Existing communication/tenant-portal tables are untouched
*/

-- ============================================================
-- 1. Create the user_mailboxes table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_mailboxes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_localpart TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT user_mailboxes_alias_unique UNIQUE (alias_localpart),

  CONSTRAINT user_mailboxes_alias_format CHECK (
    alias_localpart ~ '^[a-z0-9][a-z0-9._-]*[a-z0-9]$'
    AND length(alias_localpart) >= 3
    AND length(alias_localpart) <= 64
    AND alias_localpart NOT LIKE '%..%'
  )
);

CREATE INDEX IF NOT EXISTS idx_user_mailboxes_alias ON user_mailboxes (alias_localpart);

-- ============================================================
-- 2. Helper: sanitize an email into a valid alias_localpart
-- ============================================================
CREATE OR REPLACE FUNCTION sanitize_email_to_alias(raw_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  local_part TEXT;
  sanitized TEXT;
BEGIN
  local_part := lower(split_part(raw_email, '@', 1));

  sanitized := local_part;
  sanitized := replace(sanitized, 'ä', 'ae');
  sanitized := replace(sanitized, 'ö', 'oe');
  sanitized := replace(sanitized, 'ü', 'ue');
  sanitized := replace(sanitized, 'ß', 'ss');
  sanitized := replace(sanitized, 'Ä', 'ae');
  sanitized := replace(sanitized, 'Ö', 'oe');
  sanitized := replace(sanitized, 'Ü', 'ue');

  sanitized := regexp_replace(sanitized, '[^a-z0-9._-]', '', 'g');

  sanitized := regexp_replace(sanitized, '\.\.+', '.', 'g');
  sanitized := regexp_replace(sanitized, '--+', '-', 'g');
  sanitized := regexp_replace(sanitized, '__+', '_', 'g');

  sanitized := regexp_replace(sanitized, '^[._-]+', '', 'g');
  sanitized := regexp_replace(sanitized, '[._-]+$', '', 'g');

  IF length(sanitized) < 3 THEN
    sanitized := sanitized || repeat('0', 3 - length(sanitized));
  END IF;

  IF length(sanitized) > 64 THEN
    sanitized := left(sanitized, 64);
    sanitized := regexp_replace(sanitized, '[._-]+$', '', 'g');
  END IF;

  IF length(sanitized) < 3 THEN
    sanitized := 'user';
  END IF;

  RETURN sanitized;
END;
$$;

-- ============================================================
-- 3. Helper: generate a unique alias (append random suffix on collision)
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
    IF NOT EXISTS (SELECT 1 FROM user_mailboxes WHERE alias_localpart = candidate) THEN
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
-- 4. Backfill: create mailboxes for all existing users
-- ============================================================
DO $$
DECLARE
  r RECORD;
  base_alias TEXT;
  final_alias TEXT;
BEGIN
  FOR r IN
    SELECT id, email
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM user_mailboxes)
    ORDER BY created_at ASC
  LOOP
    base_alias := sanitize_email_to_alias(r.email);
    final_alias := generate_unique_alias(base_alias);

    INSERT INTO user_mailboxes (user_id, alias_localpart)
    VALUES (r.id, final_alias)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================
-- 5. Trigger: auto-create mailbox on new user signup
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

DROP TRIGGER IF EXISTS on_auth_user_created_mailbox ON auth.users;
CREATE TRIGGER on_auth_user_created_mailbox
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_mailbox();

-- ============================================================
-- 6. RPC: update_user_mailbox_alias
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
-- 7. RLS Policies
-- ============================================================
ALTER TABLE user_mailboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mailbox"
  ON user_mailboxes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mailboxes"
  ON user_mailboxes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mailbox"
  ON user_mailboxes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
