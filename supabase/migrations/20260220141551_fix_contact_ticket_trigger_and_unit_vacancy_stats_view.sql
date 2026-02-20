/*
  # Fix contact form ticket trigger + unit_vacancy_stats SECURITY DEFINER

  ## Problem 1: Contact form broken (500 error)
  The `create_mail_thread_from_ticket` trigger fires on ALL ticket inserts,
  including anonymous contact tickets where `user_id = NULL`.
  It tries to insert into `mail_threads` which has a NOT NULL constraint on `user_id`,
  causing the entire insert to fail.

  ## Fix 1: Skip mail thread creation for contact tickets
  - Modified `create_mail_thread_from_ticket()` to return early when `ticket_type = 'contact'`
  - Contact tickets are anonymous and don't belong to any user's mailbox
  - This is the root cause of the contact form being repeatedly broken after other updates

  ## Problem 2: Security scanner flags unit_vacancy_stats
  The view `public.unit_vacancy_stats` is flagged as SECURITY DEFINER.
  Since the view only reads from `property_units` which has proper RLS policies
  (users can only see units for their own properties), SECURITY INVOKER is safe.

  ## Fix 2: Recreate view with security_invoker = true
  - The underlying `property_units` table has RLS enabled with proper policies
  - Authenticated users can only SELECT units belonging to their own properties
  - The view simply aggregates counts, so RLS on property_units is sufficient

  ## Changes
  1. Modified `create_mail_thread_from_ticket()` - added early return for contact tickets
  2. Recreated `unit_vacancy_stats` view with `security_invoker = true`
*/

-- Fix 1: Update trigger function to skip contact tickets
CREATE OR REPLACE FUNCTION public.create_mail_thread_from_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_name text;
  v_tenant_email text;
  v_thread_id uuid;
BEGIN
  IF NEW.ticket_type = 'contact' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

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
$function$;

-- Fix 2: Recreate unit_vacancy_stats with security_invoker
CREATE OR REPLACE VIEW public.unit_vacancy_stats
WITH (security_invoker = true)
AS
SELECT property_id,
    count(*) FILTER (WHERE status = 'vacant') AS vacant_count,
    count(*) FILTER (WHERE status = 'rented') AS rented_count,
    count(*) FILTER (WHERE status = 'owner_occupied') AS owner_occupied_count,
    count(*) FILTER (WHERE status <> 'owner_occupied') AS rentable_count,
    count(*) AS total_count
FROM property_units
GROUP BY property_id;

GRANT SELECT ON public.unit_vacancy_stats TO authenticated;
GRANT SELECT ON public.unit_vacancy_stats TO service_role;
