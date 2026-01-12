/*
  # Optimize RLS Policies - Part 6 (Remaining Tables - Fixed)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies

  2. Tables Updated
    - meters
    - meter_readings  
    - index_rent_calculations
    - loan_reminders
    - income_entries
    - expense_splits
    - dunning_email_templates
    - handover_meter_readings
    - handover_checklist_templates (fixed column name)
    - handover_checklists
    - handover_photos
*/

-- meters
DROP POLICY IF EXISTS "Users can view own meters" ON meters;
DROP POLICY IF EXISTS "Users can insert own meters" ON meters;
DROP POLICY IF EXISTS "Users can update own meters" ON meters;
DROP POLICY IF EXISTS "Users can delete own meters" ON meters;

CREATE POLICY "Users can view own meters"
  ON meters FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own meters"
  ON meters FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own meters"
  ON meters FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own meters"
  ON meters FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- meter_readings
DROP POLICY IF EXISTS "Users can view own meter readings" ON meter_readings;
DROP POLICY IF EXISTS "Users can insert own meter readings" ON meter_readings;
DROP POLICY IF EXISTS "Users can update own meter readings" ON meter_readings;
DROP POLICY IF EXISTS "Users can delete own meter readings" ON meter_readings;

CREATE POLICY "Users can view own meter readings"
  ON meter_readings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own meter readings"
  ON meter_readings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own meter readings"
  ON meter_readings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own meter readings"
  ON meter_readings FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = (SELECT auth.uid())
    )
  );

-- index_rent_calculations
DROP POLICY IF EXISTS "Users can view own index rent calculations" ON index_rent_calculations;
DROP POLICY IF EXISTS "Users can create own index rent calculations" ON index_rent_calculations;
DROP POLICY IF EXISTS "Users can update own index rent calculations" ON index_rent_calculations;
DROP POLICY IF EXISTS "Users can delete own index rent calculations" ON index_rent_calculations;

CREATE POLICY "Users can view own index rent calculations"
  ON index_rent_calculations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own index rent calculations"
  ON index_rent_calculations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own index rent calculations"
  ON index_rent_calculations FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own index rent calculations"
  ON index_rent_calculations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- loan_reminders
DROP POLICY IF EXISTS "Users can view own loan reminders" ON loan_reminders;
DROP POLICY IF EXISTS "Users can insert own loan reminders" ON loan_reminders;
DROP POLICY IF EXISTS "Users can update own loan reminders" ON loan_reminders;
DROP POLICY IF EXISTS "Users can delete own loan reminders" ON loan_reminders;

CREATE POLICY "Users can view own loan reminders"
  ON loan_reminders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_reminders.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own loan reminders"
  ON loan_reminders FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_reminders.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own loan reminders"
  ON loan_reminders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_reminders.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_reminders.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own loan reminders"
  ON loan_reminders FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_reminders.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  );

-- income_entries
DROP POLICY IF EXISTS "Users can view own income entries" ON income_entries;
DROP POLICY IF EXISTS "Users can create own income entries" ON income_entries;
DROP POLICY IF EXISTS "Users can update own income entries" ON income_entries;
DROP POLICY IF EXISTS "Users can delete own income entries" ON income_entries;

CREATE POLICY "Users can view own income entries"
  ON income_entries FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own income entries"
  ON income_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own income entries"
  ON income_entries FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own income entries"
  ON income_entries FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- expense_splits
DROP POLICY IF EXISTS "Users can view own expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Users can create own expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Users can update own expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Users can delete own expense splits" ON expense_splits;

CREATE POLICY "Users can view own expense splits"
  ON expense_splits FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own expense splits"
  ON expense_splits FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own expense splits"
  ON expense_splits FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own expense splits"
  ON expense_splits FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = (SELECT auth.uid())
    )
  );

-- dunning_email_templates
DROP POLICY IF EXISTS "Users can view own templates" ON dunning_email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON dunning_email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON dunning_email_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON dunning_email_templates;

CREATE POLICY "Users can view own templates"
  ON dunning_email_templates FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own templates"
  ON dunning_email_templates FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own templates"
  ON dunning_email_templates FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own templates"
  ON dunning_email_templates FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- handover_meter_readings
DROP POLICY IF EXISTS "Users can view own meter readings" ON handover_meter_readings;
DROP POLICY IF EXISTS "Users can insert own meter readings" ON handover_meter_readings;
DROP POLICY IF EXISTS "Users can update own meter readings" ON handover_meter_readings;
DROP POLICY IF EXISTS "Users can delete own meter readings" ON handover_meter_readings;

CREATE POLICY "Users can view own meter readings"
  ON handover_meter_readings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_meter_readings.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own meter readings"
  ON handover_meter_readings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_meter_readings.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own meter readings"
  ON handover_meter_readings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_meter_readings.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_meter_readings.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own meter readings"
  ON handover_meter_readings FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_meter_readings.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

-- handover_checklist_templates (fixed: using is_system instead of is_system_template)
DROP POLICY IF EXISTS "Users can view system and own templates" ON handover_checklist_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON handover_checklist_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON handover_checklist_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON handover_checklist_templates;

CREATE POLICY "Users can view system and own templates"
  ON handover_checklist_templates FOR SELECT TO authenticated
  USING (is_system = true OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own templates"
  ON handover_checklist_templates FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND is_system = false);

CREATE POLICY "Users can update own templates"
  ON handover_checklist_templates FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND is_system = false)
  WITH CHECK (user_id = (SELECT auth.uid()) AND is_system = false);

CREATE POLICY "Users can delete own templates"
  ON handover_checklist_templates FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND is_system = false);

-- handover_checklists
DROP POLICY IF EXISTS "Users can view own checklists" ON handover_checklists;
DROP POLICY IF EXISTS "Users can insert own checklists" ON handover_checklists;
DROP POLICY IF EXISTS "Users can update own checklists" ON handover_checklists;
DROP POLICY IF EXISTS "Users can delete own checklists" ON handover_checklists;

CREATE POLICY "Users can view own checklists"
  ON handover_checklists FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_checklists.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own checklists"
  ON handover_checklists FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_checklists.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own checklists"
  ON handover_checklists FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_checklists.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_checklists.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own checklists"
  ON handover_checklists FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_checklists.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

-- handover_photos
DROP POLICY IF EXISTS "Users can view own photos" ON handover_photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON handover_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON handover_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON handover_photos;

CREATE POLICY "Users can view own photos"
  ON handover_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_photos.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own photos"
  ON handover_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_photos.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own photos"
  ON handover_photos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_photos.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_photos.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own photos"
  ON handover_photos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM handover_protocols
      WHERE handover_protocols.id = handover_photos.protocol_id
      AND handover_protocols.user_id = (SELECT auth.uid())
    )
  );
