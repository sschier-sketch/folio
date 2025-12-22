/*
  # Fix Security and Performance Issues

  ## 1. Foreign Key Indexes
    - Add missing index on admin_activity_log.target_user_id

  ## 2. RLS Policy Optimization
    Replace `auth.uid()` with `(select auth.uid())` in all policies to avoid re-evaluation per row:
    - feedback_votes (3 policies)
    - stripe_customers (2 policies)
    - stripe_subscriptions (2 policies)
    - stripe_orders (2 policies)
    - admin_users (2 policies)
    - email_templates (2 policies)
    - admin_activity_log (2 policies)

  ## 3. Remove Unused Indexes
    Remove 24 unused indexes to reduce storage and maintenance overhead

  ## 4. Consolidate Duplicate Policies
    Remove duplicate SELECT policies on:
    - admin_users
    - stripe_customers
    - stripe_subscriptions
    - stripe_orders
    - user_feedback

  ## 5. Secure Function Search Paths
    Fix mutable search_path for:
    - create_rent_increase_reminder_tickets
    - update_feedback_vote_counts

  ## Notes
    - All changes are backward compatible
    - Performance improvements at scale
    - Reduced storage overhead from unused indexes
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_user_id 
  ON public.admin_activity_log(target_user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - FEEDBACK_VOTES
-- =====================================================

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.feedback_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.feedback_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.feedback_votes;

CREATE POLICY "Users can delete their own votes"
  ON public.feedback_votes
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own votes"
  ON public.feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own votes"
  ON public.feedback_votes
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - STRIPE_CUSTOMERS
-- =====================================================

DROP POLICY IF EXISTS "Users can read own customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.stripe_customers;

-- Create single optimized policy
CREATE POLICY "Users can view their own customer data"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - STRIPE_SUBSCRIPTIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can read own subscription data" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;

-- Create single optimized policy
CREATE POLICY "Users can view their own subscription data"
  ON public.stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id 
      FROM public.stripe_customers 
      WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - STRIPE_ORDERS
-- =====================================================

DROP POLICY IF EXISTS "Users can read own order data" ON public.stripe_orders;
DROP POLICY IF EXISTS "Users can view their own order data" ON public.stripe_orders;

-- Create single optimized policy
CREATE POLICY "Users can view their own order data"
  ON public.stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id 
      FROM public.stripe_customers 
      WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - ADMIN_USERS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admins" ON public.admin_users;

-- Create single optimized policy
CREATE POLICY "Admins can view admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = (select auth.uid())
      AND au.is_super_admin = true
    )
  );

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - EMAIL_TEMPLATES
-- =====================================================

DROP POLICY IF EXISTS "Only admins can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Only admins can view email templates" ON public.email_templates;

CREATE POLICY "Only admins can view email templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Only admins can update email templates"
  ON public.email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - ADMIN_ACTIVITY_LOG
-- =====================================================

DROP POLICY IF EXISTS "Only admins can insert activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Only admins can view activity log" ON public.admin_activity_log;

CREATE POLICY "Only admins can view activity log"
  ON public.admin_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Only admins can insert activity log"
  ON public.admin_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. CONSOLIDATE USER_FEEDBACK POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Anyone can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;

-- Create single comprehensive policy
CREATE POLICY "Users can view feedback"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 10. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_documents_entity;
DROP INDEX IF EXISTS public.idx_documents_user_id;
DROP INDEX IF EXISTS public.idx_loans_user_id;
DROP INDEX IF EXISTS public.idx_tenants_contract_id;
DROP INDEX IF EXISTS public.idx_user_invitations_email;
DROP INDEX IF EXISTS public.idx_user_invitations_invitee_user_id;
DROP INDEX IF EXISTS public.idx_user_referrals_code;
DROP INDEX IF EXISTS public.idx_user_referrals_referred_user_id;
DROP INDEX IF EXISTS public.idx_user_settings_referral_code;
DROP INDEX IF EXISTS public.idx_billing_info_stripe_customer;
DROP INDEX IF EXISTS public.idx_feedback_votes_feedback_id;
DROP INDEX IF EXISTS public.idx_invoices_invoice_number;
DROP INDEX IF EXISTS public.idx_invoices_stripe_invoice_id;
DROP INDEX IF EXISTS public.idx_rent_payments_property_id;
DROP INDEX IF EXISTS public.idx_user_feedback_status;
DROP INDEX IF EXISTS public.idx_user_feedback_created_at;
DROP INDEX IF EXISTS public.idx_user_feedback_upvotes;
DROP INDEX IF EXISTS public.idx_tickets_property_id;
DROP INDEX IF EXISTS public.idx_tickets_tenant_id;
DROP INDEX IF EXISTS public.idx_tickets_assigned_user_id;
DROP INDEX IF EXISTS public.idx_rental_contracts_tenant_id;
DROP INDEX IF EXISTS public.idx_rental_contracts_user_id;
DROP INDEX IF EXISTS public.idx_email_templates_key;
DROP INDEX IF EXISTS public.idx_admin_activity_admin_user;
DROP INDEX IF EXISTS public.idx_admin_activity_created;

-- =====================================================
-- 11. SECURE FUNCTION SEARCH PATHS
-- =====================================================

-- Recreate create_rent_increase_reminder_tickets with secure search_path
DROP FUNCTION IF EXISTS public.create_rent_increase_reminder_tickets();

CREATE OR REPLACE FUNCTION public.create_rent_increase_reminder_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.tickets (
    property_id,
    tenant_id,
    title,
    description,
    status,
    priority,
    category,
    created_at,
    updated_at
  )
  SELECT
    rc.property_id,
    rc.tenant_id,
    'Mieterhöhung fällig' AS title,
    'Gemäß Vertrag ist eine Mieterhöhung zum ' || 
    to_char(rc.next_rent_increase_date, 'DD.MM.YYYY') || 
    ' fällig. Bitte prüfen und ggf. Mieterhöhungsschreiben vorbereiten.' AS description,
    'open' AS status,
    'medium' AS priority,
    'general' AS category,
    now() AS created_at,
    now() AS updated_at
  FROM public.rental_contracts rc
  WHERE rc.next_rent_increase_date IS NOT NULL
    AND rc.next_rent_increase_date <= (CURRENT_DATE + INTERVAL '30 days')
    AND rc.next_rent_increase_date > CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.property_id = rc.property_id
        AND t.tenant_id = rc.tenant_id
        AND t.title LIKE '%Mieterhöhung%'
        AND t.created_at > (CURRENT_DATE - INTERVAL '60 days')
    );
END;
$$;

-- Drop trigger and recreate update_feedback_vote_counts with secure search_path
DROP TRIGGER IF EXISTS feedback_votes_count_trigger ON public.feedback_votes;

DROP FUNCTION IF EXISTS public.update_feedback_vote_counts();

CREATE OR REPLACE FUNCTION public.update_feedback_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.user_feedback
      SET upvotes = upvotes + 1
      WHERE id = NEW.feedback_id;
    ELSE
      UPDATE public.user_feedback
      SET downvotes = downvotes + 1
      WHERE id = NEW.feedback_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE public.user_feedback
        SET upvotes = upvotes + 1, downvotes = downvotes - 1
        WHERE id = NEW.feedback_id;
      ELSE
        UPDATE public.user_feedback
        SET upvotes = upvotes - 1, downvotes = downvotes + 1
        WHERE id = NEW.feedback_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.user_feedback
      SET upvotes = upvotes - 1
      WHERE id = OLD.feedback_id;
    ELSE
      UPDATE public.user_feedback
      SET downvotes = downvotes - 1
      WHERE id = OLD.feedback_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

-- Recreate trigger
CREATE TRIGGER feedback_votes_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_vote_counts();