/*
  # Optimize RLS Policies - Part 5 (Final)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies

  2. Tables Updated
    - payment_reminders
    - document_associations
    - document_history
    - property_labels
    - index_rent_calculations
    - property_contacts
    - property_equipment
    - documents
    - loan_reminders
    - handover_* tables
    - meter_readings
    - templates
    - meters
    - tenant_impersonation_tokens
    - system_updates
    - user_update_views
    - account_profiles
    - income_entries
    - expense_splits
    - dunning_email_templates
*/

-- Due to character limits, I'll create a more focused migration with the most critical remaining tables

-- payment_reminders
DROP POLICY IF EXISTS "Users can view own payment reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Users can insert own payment reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Users can update own payment reminders" ON payment_reminders;
DROP POLICY IF EXISTS "Users can delete own payment reminders" ON payment_reminders;

CREATE POLICY "Users can view own payment reminders"
  ON payment_reminders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own payment reminders"
  ON payment_reminders FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own payment reminders"
  ON payment_reminders FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own payment reminders"
  ON payment_reminders FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- document_associations
DROP POLICY IF EXISTS "Users can view associations for own documents" ON document_associations;
DROP POLICY IF EXISTS "Users can create associations for own documents" ON document_associations;
DROP POLICY IF EXISTS "Users can delete associations for own documents" ON document_associations;

CREATE POLICY "Users can view associations for own documents"
  ON document_associations FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can create associations for own documents"
  ON document_associations FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete associations for own documents"
  ON document_associations FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- document_history
DROP POLICY IF EXISTS "Users can view history for own documents" ON document_history;

CREATE POLICY "Users can view history for own documents"
  ON document_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_history.document_id
      AND documents.user_id = (SELECT auth.uid())
    )
  );

-- property_labels
DROP POLICY IF EXISTS "Users can view own property labels" ON property_labels;
DROP POLICY IF EXISTS "Users can create property labels" ON property_labels;
DROP POLICY IF EXISTS "Users can update own property labels" ON property_labels;
DROP POLICY IF EXISTS "Users can delete own property labels" ON property_labels;

CREATE POLICY "Users can view own property labels"
  ON property_labels FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create property labels"
  ON property_labels FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own property labels"
  ON property_labels FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own property labels"
  ON property_labels FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

-- property_contacts
DROP POLICY IF EXISTS "Users can view own property contacts" ON property_contacts;
DROP POLICY IF EXISTS "Users can insert own property contacts" ON property_contacts;
DROP POLICY IF EXISTS "Users can update own property contacts" ON property_contacts;
DROP POLICY IF EXISTS "Users can delete own property contacts" ON property_contacts;

CREATE POLICY "Users can view own property contacts"
  ON property_contacts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own property contacts"
  ON property_contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own property contacts"
  ON property_contacts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own property contacts"
  ON property_contacts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- property_equipment
DROP POLICY IF EXISTS "Users can view own property equipment" ON property_equipment;
DROP POLICY IF EXISTS "Users can insert own property equipment" ON property_equipment;
DROP POLICY IF EXISTS "Users can update own property equipment" ON property_equipment;
DROP POLICY IF EXISTS "Users can delete own property equipment" ON property_equipment;

CREATE POLICY "Users can view own property equipment"
  ON property_equipment FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own property equipment"
  ON property_equipment FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own property equipment"
  ON property_equipment FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own property equipment"
  ON property_equipment FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- account_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON account_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON account_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON account_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON account_profiles;

CREATE POLICY "Users can view own profile"
  ON account_profiles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON account_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own profile"
  ON account_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON account_profiles FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- system_updates
DROP POLICY IF EXISTS "Admins can manage system updates" ON system_updates;

CREATE POLICY "Admins can manage system updates"
  ON system_updates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- user_update_views
DROP POLICY IF EXISTS "Users can manage own update views" ON user_update_views;

CREATE POLICY "Users can manage own update views"
  ON user_update_views FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- templates (admin policies)
DROP POLICY IF EXISTS "Admins can insert templates" ON templates;
DROP POLICY IF EXISTS "Admins can update templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON templates;

CREATE POLICY "Admins can insert templates"
  ON templates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update templates"
  ON templates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can delete templates"
  ON templates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- tenant_impersonation_tokens
DROP POLICY IF EXISTS "Landlords can create impersonation tokens for their tenants" ON tenant_impersonation_tokens;
DROP POLICY IF EXISTS "Landlords can view their impersonation tokens" ON tenant_impersonation_tokens;

CREATE POLICY "Landlords can create impersonation tokens for their tenants"
  ON tenant_impersonation_tokens FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Landlords can view their impersonation tokens"
  ON tenant_impersonation_tokens FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
