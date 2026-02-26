/*
  # Add tenant_visible flag to tickets

  1. Changes
    - Add `tenant_visible` column to `tickets` table (boolean, default true)
    - Backfill: set `tenant_visible = false` for system-generated internal tickets
      (tickets with sender_type = 'system' in their messages, like index rent reminders)
    - Update RLS policy so tenant portal (anon) users only see tenant_visible tickets

  2. Security
    - Update anon SELECT policy to enforce tenant_visible = true
    - Landlord (authenticated) users can still see all their tickets regardless

  3. Notes
    - This prevents internal system notifications (index rent reminders, staffel rent reminders)
      from appearing in the tenant portal
    - Existing tenant-created tickets remain visible (tenant_visible defaults to true)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tickets'
    AND column_name = 'tenant_visible'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN tenant_visible boolean DEFAULT true NOT NULL;
  END IF;
END $$;

UPDATE public.tickets t
SET tenant_visible = false
WHERE EXISTS (
  SELECT 1 FROM public.ticket_messages tm
  WHERE tm.ticket_id = t.id
  AND tm.sender_type = 'system'
)
AND NOT EXISTS (
  SELECT 1 FROM public.ticket_messages tm
  WHERE tm.ticket_id = t.id
  AND tm.sender_type IN ('tenant', 'user')
);

DROP POLICY IF EXISTS "Tenants can view own tickets via valid token" ON public.tickets;

CREATE POLICY "Tenants can view own tenant-visible tickets via valid token"
  ON public.tickets
  FOR SELECT
  TO anon
  USING (
    tenant_visible = true
    AND tenant_id IN (
      SELECT tit.tenant_id
      FROM public.tenant_impersonation_tokens tit
      WHERE tit.used_at IS NULL
      AND tit.expires_at > now()
    )
  );
