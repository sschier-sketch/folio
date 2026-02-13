/*
  # Comprehensive Fault-Tolerant Audit Triggers

  ## Summary
  Replaces the old log_property_change() audit system with a new robust_audit_trigger()
  that covers all property-related entities. The trigger NEVER blocks data writes -
  all logging is best-effort with triple-layer exception handling.

  ## Changes
  1. Drops 8 old audit triggers (properties, property_units, tenants, rental_contracts,
     property_equipment, property_contacts, maintenance_tasks, property_documents)
  2. Drops old log_property_change() function
  3. Creates new robust_audit_trigger() function with:
     - Field-wise diff for UPDATE (only changed fields logged)
     - Snapshot for INSERT/DELETE
     - Automatic property_id resolution (direct + indirect via joins)
     - Actor detection via auth.uid() + account_profiles
     - Triple-layer exception handling (never blocks writes)
     - Logging failures captured in logging_failures table
  4. Creates AFTER triggers on 25 tables

  ## Tracked Tables (direct property_id)
  properties, property_units, tenants, rental_contracts, loans, rent_payments,
  property_equipment, property_contacts, property_documents, property_images,
  meters, handover_protocols, income_entries, expenses, maintenance_tasks,
  tickets, documents, property_value_history, billing_periods,
  operating_cost_statements, property_labels

  ## Tracked Tables (indirect property_id resolution)
  rental_contract_units (via rental_contracts), meter_readings (via meters),
  tenant_contract_partners (via rental_contracts), deposit_history (via rental_contracts)

  ## Important Notes
  - All triggers are AFTER triggers (fire after the data write)
  - The trigger function catches ALL exceptions at three levels
  - If audit INSERT fails: error goes to logging_failures table
  - If logging_failures INSERT also fails: RAISE WARNING only (never blocks)
  - UPDATE operations that change only updated_at/created_at are skipped
*/

-- ============================================================
-- Step 1: Drop all old audit triggers
-- ============================================================
DROP TRIGGER IF EXISTS audit_properties_changes ON properties;
DROP TRIGGER IF EXISTS audit_property_units_changes ON property_units;
DROP TRIGGER IF EXISTS audit_tenants_changes ON tenants;
DROP TRIGGER IF EXISTS audit_rental_contracts_changes ON rental_contracts;
DROP TRIGGER IF EXISTS audit_property_equipment_changes ON property_equipment;
DROP TRIGGER IF EXISTS audit_property_contacts_changes ON property_contacts;
DROP TRIGGER IF EXISTS audit_maintenance_tasks_changes ON maintenance_tasks;
DROP TRIGGER IF EXISTS audit_property_documents_changes ON property_documents;

-- ============================================================
-- Step 2: Drop old function
-- ============================================================
DROP FUNCTION IF EXISTS log_property_change();

-- ============================================================
-- Step 3: Create the new robust audit trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION robust_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
  v_property_id uuid;
  v_entity_type text;
  v_entity_id uuid;
  v_action text;
  v_changes jsonb;
  v_event_type text;
  v_description text;
  v_record jsonb;
  v_old_record jsonb;
  v_new_record jsonb;
  v_key text;
BEGIN
  BEGIN
    v_action := lower(TG_OP);

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
      v_new_record := to_jsonb(NEW);
    END IF;
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
      v_old_record := to_jsonb(OLD);
    END IF;

    v_record := COALESCE(v_new_record, v_old_record);

    IF v_record ? 'id' THEN
      v_entity_id := (v_record->>'id')::uuid;
    END IF;

    v_entity_type := CASE TG_TABLE_NAME
      WHEN 'properties' THEN 'property'
      WHEN 'property_units' THEN 'unit'
      WHEN 'tenants' THEN 'tenant'
      WHEN 'rental_contracts' THEN 'contract'
      WHEN 'rental_contract_units' THEN 'contract_unit'
      WHEN 'tenant_contract_partners' THEN 'contract_partner'
      WHEN 'loans' THEN 'loan'
      WHEN 'rent_payments' THEN 'payment'
      WHEN 'property_equipment' THEN 'equipment'
      WHEN 'property_contacts' THEN 'contact'
      WHEN 'property_documents' THEN 'document'
      WHEN 'documents' THEN 'document'
      WHEN 'property_images' THEN 'image'
      WHEN 'meters' THEN 'meter'
      WHEN 'meter_readings' THEN 'meter_reading'
      WHEN 'handover_protocols' THEN 'handover'
      WHEN 'income_entries' THEN 'income'
      WHEN 'expenses' THEN 'expense'
      WHEN 'expense_splits' THEN 'expense_split'
      WHEN 'maintenance_tasks' THEN 'maintenance'
      WHEN 'tickets' THEN 'ticket'
      WHEN 'property_value_history' THEN 'valuation'
      WHEN 'property_labels' THEN 'label'
      WHEN 'billing_periods' THEN 'billing_period'
      WHEN 'operating_cost_statements' THEN 'operating_cost'
      WHEN 'deposit_history' THEN 'deposit'
      ELSE TG_TABLE_NAME
    END;

    -- Resolve property_id: direct
    IF TG_TABLE_NAME = 'properties' THEN
      v_property_id := (v_record->>'id')::uuid;
    ELSIF v_record ? 'property_id' AND v_record->>'property_id' IS NOT NULL THEN
      v_property_id := (v_record->>'property_id')::uuid;
    END IF;

    IF v_property_id IS NULL AND TG_OP = 'DELETE'
       AND v_old_record ? 'property_id'
       AND v_old_record->>'property_id' IS NOT NULL THEN
      v_property_id := (v_old_record->>'property_id')::uuid;
    END IF;

    -- Resolve property_id: indirect via joins
    IF v_property_id IS NULL THEN
      BEGIN
        CASE TG_TABLE_NAME
          WHEN 'meter_readings' THEN
            SELECT m.property_id INTO v_property_id
            FROM meters m WHERE m.id = (v_record->>'meter_id')::uuid;
          WHEN 'rental_contract_units' THEN
            SELECT rc.property_id INTO v_property_id
            FROM rental_contracts rc WHERE rc.id = (v_record->>'contract_id')::uuid;
          WHEN 'tenant_contract_partners' THEN
            SELECT rc.property_id INTO v_property_id
            FROM rental_contracts rc WHERE rc.id = (v_record->>'contract_id')::uuid;
          WHEN 'deposit_history' THEN
            SELECT rc.property_id INTO v_property_id
            FROM rental_contracts rc WHERE rc.id = (v_record->>'contract_id')::uuid;
          ELSE
            NULL;
        END CASE;
      EXCEPTION WHEN OTHERS THEN
        v_property_id := NULL;
      END;
    END IF;

    IF v_property_id IS NULL THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- Get actor
    BEGIN
      v_user_id := auth.uid();
      IF v_user_id IS NOT NULL THEN
        SELECT COALESCE(
          NULLIF(TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, '')), ''),
          u.email,
          'Nutzer'
        ) INTO v_user_name
        FROM auth.users u
        LEFT JOIN account_profiles ap ON ap.user_id = u.id
        WHERE u.id = v_user_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;

    IF v_user_name IS NULL OR v_user_name = '' THEN
      v_user_name := 'System';
    END IF;

    -- Compute changes
    BEGIN
      IF TG_OP = 'INSERT' THEN
        v_changes := v_new_record - 'created_at' - 'updated_at';
      ELSIF TG_OP = 'UPDATE' THEN
        v_changes := '{}'::jsonb;
        FOR v_key IN SELECT jsonb_object_keys(v_new_record)
        LOOP
          IF v_key IN ('updated_at', 'created_at') THEN
            CONTINUE;
          END IF;
          IF v_old_record->v_key IS DISTINCT FROM v_new_record->v_key THEN
            v_changes := v_changes || jsonb_build_object(
              v_key, jsonb_build_object(
                'old', v_old_record->v_key,
                'new', v_new_record->v_key
              )
            );
          END IF;
        END LOOP;
        IF v_changes = '{}'::jsonb THEN
          RETURN NEW;
        END IF;
      ELSIF TG_OP = 'DELETE' THEN
        v_changes := v_old_record - 'created_at' - 'updated_at';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_changes := jsonb_build_object('_error', 'Diff konnte nicht berechnet werden: ' || SQLERRM);
    END;

    -- Build event_type with special cases
    v_event_type := v_entity_type || '_' ||
      CASE v_action
        WHEN 'insert' THEN 'created'
        WHEN 'update' THEN 'updated'
        WHEN 'delete' THEN 'deleted'
      END;

    IF TG_TABLE_NAME = 'maintenance_tasks' AND TG_OP = 'UPDATE'
       AND v_new_record->>'status' = 'completed'
       AND (v_old_record->>'status' IS DISTINCT FROM 'completed') THEN
      v_event_type := 'maintenance_completed';
    END IF;

    IF v_entity_type = 'document' AND v_action = 'insert' THEN
      v_event_type := 'document_uploaded';
    END IF;

    -- Build description
    v_description := CASE v_entity_type
      WHEN 'property' THEN 'Immobilie'
      WHEN 'unit' THEN 'Einheit'
      WHEN 'tenant' THEN 'Mieter'
      WHEN 'contract' THEN 'Mietvertrag'
      WHEN 'contract_unit' THEN 'Vertragseinheit'
      WHEN 'contract_partner' THEN 'Vertragspartner'
      WHEN 'loan' THEN 'Darlehen'
      WHEN 'payment' THEN 'Mietzahlung'
      WHEN 'equipment' THEN 'Ausstattung'
      WHEN 'contact' THEN 'Kontakt'
      WHEN 'document' THEN 'Dokument'
      WHEN 'image' THEN 'Foto'
      WHEN 'meter' THEN 'Zaehler'
      WHEN 'meter_reading' THEN 'Zaehlerstand'
      WHEN 'handover' THEN 'Uebergabeprotokoll'
      WHEN 'income' THEN 'Einnahme'
      WHEN 'expense' THEN 'Ausgabe'
      WHEN 'expense_split' THEN 'Kostenverteilung'
      WHEN 'maintenance' THEN 'Wartungsaufgabe'
      WHEN 'ticket' THEN 'Ticket'
      WHEN 'valuation' THEN 'Wertentwicklung'
      WHEN 'label' THEN 'Label'
      WHEN 'billing_period' THEN 'Abrechnungszeitraum'
      WHEN 'operating_cost' THEN 'Betriebskostenabrechnung'
      WHEN 'deposit' THEN 'Kaution'
      ELSE v_entity_type
    END || ' ' || CASE v_action
      WHEN 'insert' THEN 'angelegt'
      WHEN 'update' THEN 'aktualisiert'
      WHEN 'delete' THEN 'geloescht'
    END;

    -- Insert audit log entry
    BEGIN
      INSERT INTO property_history (
        property_id, user_id, event_type, event_description,
        changed_by_name, metadata, entity_type, entity_id,
        action, source, changes
      ) VALUES (
        v_property_id,
        v_user_id,
        v_event_type,
        v_description,
        v_user_name,
        jsonb_build_object('table_name', TG_TABLE_NAME, 'operation', TG_OP),
        v_entity_type,
        v_entity_id,
        v_action,
        'trigger',
        v_changes
      );
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        INSERT INTO logging_failures (
          table_name, operation, record_id, error_message, error_detail
        ) VALUES (
          TG_TABLE_NAME, TG_OP, v_entity_id, SQLERRM, SQLSTATE
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Audit: % on % failed: % (failure log also failed)',
          TG_OP, TG_TABLE_NAME, SQLERRM;
      END;
    END;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit trigger crashed for % on %: %',
      TG_OP, TG_TABLE_NAME, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================
-- Step 4: Create triggers on all property-related tables
-- ============================================================

-- Tables with direct property_id
DROP TRIGGER IF EXISTS audit_log_properties ON properties;
CREATE TRIGGER audit_log_properties
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_units ON property_units;
CREATE TRIGGER audit_log_property_units
  AFTER INSERT OR UPDATE OR DELETE ON property_units
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_tenants ON tenants;
CREATE TRIGGER audit_log_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_rental_contracts ON rental_contracts;
CREATE TRIGGER audit_log_rental_contracts
  AFTER INSERT OR UPDATE OR DELETE ON rental_contracts
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_loans ON loans;
CREATE TRIGGER audit_log_loans
  AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_rent_payments ON rent_payments;
CREATE TRIGGER audit_log_rent_payments
  AFTER INSERT OR UPDATE OR DELETE ON rent_payments
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_equipment ON property_equipment;
CREATE TRIGGER audit_log_property_equipment
  AFTER INSERT OR UPDATE OR DELETE ON property_equipment
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_contacts ON property_contacts;
CREATE TRIGGER audit_log_property_contacts
  AFTER INSERT OR UPDATE OR DELETE ON property_contacts
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_documents ON property_documents;
CREATE TRIGGER audit_log_property_documents
  AFTER INSERT OR UPDATE OR DELETE ON property_documents
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_images ON property_images;
CREATE TRIGGER audit_log_property_images
  AFTER INSERT OR UPDATE OR DELETE ON property_images
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_meters ON meters;
CREATE TRIGGER audit_log_meters
  AFTER INSERT OR UPDATE OR DELETE ON meters
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_handover_protocols ON handover_protocols;
CREATE TRIGGER audit_log_handover_protocols
  AFTER INSERT OR UPDATE OR DELETE ON handover_protocols
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_income_entries ON income_entries;
CREATE TRIGGER audit_log_income_entries
  AFTER INSERT OR UPDATE OR DELETE ON income_entries
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_expenses ON expenses;
CREATE TRIGGER audit_log_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_maintenance_tasks ON maintenance_tasks;
CREATE TRIGGER audit_log_maintenance_tasks
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_tickets ON tickets;
CREATE TRIGGER audit_log_tickets
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_documents ON documents;
CREATE TRIGGER audit_log_documents
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_value_history ON property_value_history;
CREATE TRIGGER audit_log_property_value_history
  AFTER INSERT OR UPDATE OR DELETE ON property_value_history
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_billing_periods ON billing_periods;
CREATE TRIGGER audit_log_billing_periods
  AFTER INSERT OR UPDATE OR DELETE ON billing_periods
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_operating_cost_statements ON operating_cost_statements;
CREATE TRIGGER audit_log_operating_cost_statements
  AFTER INSERT OR UPDATE OR DELETE ON operating_cost_statements
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_property_labels ON property_labels;
CREATE TRIGGER audit_log_property_labels
  AFTER INSERT OR UPDATE OR DELETE ON property_labels
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

-- Tables with indirect property_id resolution
DROP TRIGGER IF EXISTS audit_log_rental_contract_units ON rental_contract_units;
CREATE TRIGGER audit_log_rental_contract_units
  AFTER INSERT OR UPDATE OR DELETE ON rental_contract_units
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_meter_readings ON meter_readings;
CREATE TRIGGER audit_log_meter_readings
  AFTER INSERT OR UPDATE OR DELETE ON meter_readings
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_tenant_contract_partners ON tenant_contract_partners;
CREATE TRIGGER audit_log_tenant_contract_partners
  AFTER INSERT OR UPDATE OR DELETE ON tenant_contract_partners
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();

DROP TRIGGER IF EXISTS audit_log_deposit_history ON deposit_history;
CREATE TRIGGER audit_log_deposit_history
  AFTER INSERT OR UPDATE OR DELETE ON deposit_history
  FOR EACH ROW EXECUTE FUNCTION robust_audit_trigger();
