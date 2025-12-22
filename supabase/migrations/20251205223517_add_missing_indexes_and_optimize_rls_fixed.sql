/*
  # Performance and Security Optimizations

  This migration addresses performance and security issues:

  ## 1. Missing Foreign Key Indexes
  Adds indexes for all foreign key columns to improve query performance:
    - documents (user_id)
    - loans (user_id)
    - rent_payments (contract_id, property_id, tenant_id, user_id)
    - rental_contracts (user_id)
    - tickets (tenant_id)
    - user_invitations (invitee_user_id)
    - user_referrals (referred_user_id)

  ## 2. RLS Policy Optimization
  Updates all RLS policies to use (select auth.uid()) instead of auth.uid()
  to prevent re-evaluation on each row for better performance at scale.
  Affects policies on:
    - tickets
    - ticket_messages
    - documents
    - loans
    - user_invitations
    - tenants
    - user_referrals
    - properties
    - user_settings
    - rental_contracts
    - rent_payments

  ## 3. Function Security
  Updates function search_path to prevent search_path manipulation attacks:
    - generate_ticket_number
    - set_ticket_number
    - update_updated_at
    - generate_referral_code
    - create_user_settings
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Index for documents.user_id
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Index for loans.user_id
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);

-- Indexes for rent_payments foreign keys
CREATE INDEX IF NOT EXISTS idx_rent_payments_contract_id ON public.rent_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON public.rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id ON public.rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_user_id ON public.rent_payments(user_id);

-- Index for rental_contracts.user_id
CREATE INDEX IF NOT EXISTS idx_rental_contracts_user_id ON public.rental_contracts(user_id);

-- Index for tickets.tenant_id
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON public.tickets(tenant_id);

-- Index for user_invitations.invitee_user_id
CREATE INDEX IF NOT EXISTS idx_user_invitations_invitee_user_id ON public.user_invitations(invitee_user_id);

-- Index for user_referrals.referred_user_id
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_user_id ON public.user_referrals(referred_user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES
-- =====================================================

-- Properties table policies
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
CREATE POLICY "Users can view own properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
CREATE POLICY "Users can insert own properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
CREATE POLICY "Users can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
CREATE POLICY "Users can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Tenants table policies
DROP POLICY IF EXISTS "Users can view own tenants" ON public.tenants;
CREATE POLICY "Users can view own tenants"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tenants" ON public.tenants;
CREATE POLICY "Users can insert own tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tenants" ON public.tenants;
CREATE POLICY "Users can update own tenants"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own tenants" ON public.tenants;
CREATE POLICY "Users can delete own tenants"
  ON public.tenants FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Tickets table policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
CREATE POLICY "Users can insert own tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
CREATE POLICY "Users can update own tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own tickets" ON public.tickets;
CREATE POLICY "Users can delete own tickets"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Ticket messages table policies
DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for own tickets"
  ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages for own tickets" ON public.ticket_messages;
CREATE POLICY "Users can insert messages for own tickets"
  ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (select auth.uid())
    )
  );

-- Documents table policies
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Loans table policies
DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
CREATE POLICY "Users can insert own loans"
  ON public.loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own loans" ON public.loans;
CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- User invitations table policies
DROP POLICY IF EXISTS "Users can view own invitations" ON public.user_invitations;
CREATE POLICY "Users can view own invitations"
  ON public.user_invitations FOR SELECT
  TO authenticated
  USING (inviter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create invitations" ON public.user_invitations;
CREATE POLICY "Users can create invitations"
  ON public.user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own invitations" ON public.user_invitations;
CREATE POLICY "Users can update own invitations"
  ON public.user_invitations FOR UPDATE
  TO authenticated
  USING (inviter_id = (select auth.uid()))
  WITH CHECK (inviter_id = (select auth.uid()));

-- User referrals table policies
DROP POLICY IF EXISTS "Users can view own referrals" ON public.user_referrals;
CREATE POLICY "Users can view own referrals"
  ON public.user_referrals FOR SELECT
  TO authenticated
  USING (referrer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create referrals" ON public.user_referrals;
CREATE POLICY "Users can create referrals"
  ON public.user_referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own referrals" ON public.user_referrals;
CREATE POLICY "Users can update own referrals"
  ON public.user_referrals FOR UPDATE
  TO authenticated
  USING (referrer_id = (select auth.uid()))
  WITH CHECK (referrer_id = (select auth.uid()));

-- User settings table policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own settings" ON public.user_settings;
CREATE POLICY "Users can create own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Rental contracts table policies
DROP POLICY IF EXISTS "Users can view own rental contracts" ON public.rental_contracts;
CREATE POLICY "Users can view own rental contracts"
  ON public.rental_contracts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own rental contracts" ON public.rental_contracts;
CREATE POLICY "Users can insert own rental contracts"
  ON public.rental_contracts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own rental contracts" ON public.rental_contracts;
CREATE POLICY "Users can update own rental contracts"
  ON public.rental_contracts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own rental contracts" ON public.rental_contracts;
CREATE POLICY "Users can delete own rental contracts"
  ON public.rental_contracts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Rent payments table policies
DROP POLICY IF EXISTS "Users can view own rent payments" ON public.rent_payments;
CREATE POLICY "Users can view own rent payments"
  ON public.rent_payments FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own rent payments" ON public.rent_payments;
CREATE POLICY "Users can insert own rent payments"
  ON public.rent_payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own rent payments" ON public.rent_payments;
CREATE POLICY "Users can update own rent payments"
  ON public.rent_payments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own rent payments" ON public.rent_payments;
CREATE POLICY "Users can delete own rent payments"
  ON public.rent_payments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 3. SECURE FUNCTION SEARCH PATHS
-- =====================================================

-- Update generate_ticket_number function with secure search_path
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number text;
  year_str text;
  counter int;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS INTEGER)), 0) + 1
  INTO counter
  FROM tickets
  WHERE ticket_number LIKE year_str || '%';
  
  new_number := year_str || LPAD(counter::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Update set_ticket_number function with secure search_path
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_updated_at function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update generate_referral_code function with secure search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    SELECT EXISTS(SELECT 1 FROM user_settings WHERE referral_code = code)
    INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Update create_user_settings function with secure search_path
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, referral_code)
  VALUES (NEW.id, generate_referral_code())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
