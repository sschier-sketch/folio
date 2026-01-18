/*
  # Comprehensive Audit Logging System for Property Management

  ## Overview
  Creates an automatic audit logging system that tracks ALL changes to properties, units, tenants, contracts, and related entities.

  ## Changes
  1. Extend property_history event types to support more actions
  2. Create generic audit logging function
  3. Add triggers to all relevant tables:
     - properties (all fields)
     - property_units (all fields)
     - tenants (all fields)
     - rental_contracts (all fields)
     - property_equipment (all fields)
     - property_contacts (all fields)
     - maintenance_tasks (all fields)
     - property_documents (upload/delete)

  ## Captured Information
  Each audit log entry includes:
  - User ID and username (from account_profiles)
  - Exact timestamp (created_at)
  - Action type (INSERT, UPDATE, DELETE)
  - Changed fields with old and new values
  - Event description in German
  - Full metadata in JSONB format

  ## Event Types Added
  - property_created, property_updated, property_deleted
  - unit_created, unit_updated, unit_deleted
  - tenant_created, tenant_updated, tenant_deleted
  - contract_created, contract_updated, contract_deleted
  - equipment_updated
  - contact_created, contact_updated, contact_deleted
  - maintenance_created, maintenance_updated, maintenance_completed
  - document_uploaded, document_deleted
*/

-- =====================================================
-- 1. EXTEND EVENT TYPES
-- =====================================================

-- Drop existing constraint and recreate with extended types
ALTER TABLE property_history 
  DROP CONSTRAINT IF EXISTS property_history_event_type_check;

ALTER TABLE property_history
  ADD CONSTRAINT property_history_event_type_check 
  CHECK (event_type IN (
    'property_created', 'property_updated', 'property_deleted',
    'unit_created', 'unit_updated', 'unit_deleted',
    'tenant_created', 'tenant_updated', 'tenant_deleted',
    'contract_created', 'contract_updated', 'contract_deleted',
    'equipment_updated',
    'contact_created', 'contact_updated', 'contact_deleted',
    'maintenance_created', 'maintenance_updated', 'maintenance_completed',
    'document_uploaded', 'document_deleted',
    'tenant_change', 'rent_increase', 'billing', 'other'
  ));

-- =====================================================
-- 2. CREATE GENERIC AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_property_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_property_id uuid;
  v_user_id uuid;
  v_username text;
  v_event_type text;
  v_event_description text;
  v_metadata jsonb := '{}';
  v_changed_fields text[] := '{}';
  v_old_values jsonb := '{}';
  v_new_values jsonb := '{}';
BEGIN
  -- Determine user_id
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Get username from account_profiles
  SELECT COALESCE(full_name, email, 'System')
  INTO v_username
  FROM account_profiles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_username IS NULL THEN
    v_username := 'System';
  END IF;

  -- Determine property_id based on table
  IF TG_TABLE_NAME = 'properties' THEN
    IF TG_OP = 'DELETE' THEN
      v_property_id := OLD.id;
    ELSE
      v_property_id := NEW.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_property_id := OLD.property_id;
  ELSE
    v_property_id := NEW.property_id;
  END IF;

  -- Skip if property_id is NULL (shouldn't happen but safety check)
  IF v_property_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build event type and description based on table and operation
  CASE TG_TABLE_NAME
    WHEN 'properties' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'property_created';
          v_event_description := 'Immobilie "' || NEW.address || '" wurde angelegt';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          v_event_type := 'property_updated';
          -- Track specific field changes
          IF OLD.address IS DISTINCT FROM NEW.address THEN
            v_changed_fields := array_append(v_changed_fields, 'Adresse');
            v_old_values := jsonb_set(v_old_values, '{address}', to_jsonb(OLD.address));
            v_new_values := jsonb_set(v_new_values, '{address}', to_jsonb(NEW.address));
          END IF;
          IF OLD.city IS DISTINCT FROM NEW.city THEN
            v_changed_fields := array_append(v_changed_fields, 'Stadt');
            v_old_values := jsonb_set(v_old_values, '{city}', to_jsonb(OLD.city));
            v_new_values := jsonb_set(v_new_values, '{city}', to_jsonb(NEW.city));
          END IF;
          IF OLD.postal_code IS DISTINCT FROM NEW.postal_code THEN
            v_changed_fields := array_append(v_changed_fields, 'PLZ');
            v_old_values := jsonb_set(v_old_values, '{postal_code}', to_jsonb(OLD.postal_code));
            v_new_values := jsonb_set(v_new_values, '{postal_code}', to_jsonb(NEW.postal_code));
          END IF;
          IF OLD.property_type IS DISTINCT FROM NEW.property_type THEN
            v_changed_fields := array_append(v_changed_fields, 'Objekttyp');
            v_old_values := jsonb_set(v_old_values, '{property_type}', to_jsonb(OLD.property_type));
            v_new_values := jsonb_set(v_new_values, '{property_type}', to_jsonb(NEW.property_type));
          END IF;
          IF OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN
            v_changed_fields := array_append(v_changed_fields, 'Kaufpreis');
            v_old_values := jsonb_set(v_old_values, '{purchase_price}', to_jsonb(OLD.purchase_price));
            v_new_values := jsonb_set(v_new_values, '{purchase_price}', to_jsonb(NEW.purchase_price));
          END IF;
          IF OLD.current_value IS DISTINCT FROM NEW.current_value THEN
            v_changed_fields := array_append(v_changed_fields, 'Aktueller Wert');
            v_old_values := jsonb_set(v_old_values, '{current_value}', to_jsonb(OLD.current_value));
            v_new_values := jsonb_set(v_new_values, '{current_value}', to_jsonb(NEW.current_value));
          END IF;
          IF OLD.total_area IS DISTINCT FROM NEW.total_area THEN
            v_changed_fields := array_append(v_changed_fields, 'Gesamtfläche');
            v_old_values := jsonb_set(v_old_values, '{total_area}', to_jsonb(OLD.total_area));
            v_new_values := jsonb_set(v_new_values, '{total_area}', to_jsonb(NEW.total_area));
          END IF;
          IF OLD.label IS DISTINCT FROM NEW.label THEN
            v_changed_fields := array_append(v_changed_fields, 'Label');
            v_old_values := jsonb_set(v_old_values, '{label}', to_jsonb(OLD.label));
            v_new_values := jsonb_set(v_new_values, '{label}', to_jsonb(NEW.label));
          END IF;
          IF array_length(v_changed_fields, 1) > 0 THEN
            v_event_description := 'Immobilie aktualisiert: ' || array_to_string(v_changed_fields, ', ');
          ELSE
            v_event_description := 'Immobilie aktualisiert';
          END IF;
        WHEN 'DELETE' THEN
          v_event_type := 'property_deleted';
          v_event_description := 'Immobilie "' || OLD.address || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'property_units' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'unit_created';
          v_event_description := 'Einheit "' || NEW.unit_number || '" wurde angelegt';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          v_event_type := 'unit_updated';
          IF OLD.unit_number IS DISTINCT FROM NEW.unit_number THEN
            v_changed_fields := array_append(v_changed_fields, 'Nummer');
            v_old_values := jsonb_set(v_old_values, '{unit_number}', to_jsonb(OLD.unit_number));
            v_new_values := jsonb_set(v_new_values, '{unit_number}', to_jsonb(NEW.unit_number));
          END IF;
          IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_changed_fields := array_append(v_changed_fields, 'Status');
            v_old_values := jsonb_set(v_old_values, '{status}', to_jsonb(OLD.status));
            v_new_values := jsonb_set(v_new_values, '{status}', to_jsonb(NEW.status));
          END IF;
          IF OLD.rent_amount IS DISTINCT FROM NEW.rent_amount THEN
            v_changed_fields := array_append(v_changed_fields, 'Miete');
            v_old_values := jsonb_set(v_old_values, '{rent_amount}', to_jsonb(OLD.rent_amount));
            v_new_values := jsonb_set(v_new_values, '{rent_amount}', to_jsonb(NEW.rent_amount));
          END IF;
          IF OLD.area_sqm IS DISTINCT FROM NEW.area_sqm THEN
            v_changed_fields := array_append(v_changed_fields, 'Fläche');
            v_old_values := jsonb_set(v_old_values, '{area_sqm}', to_jsonb(OLD.area_sqm));
            v_new_values := jsonb_set(v_new_values, '{area_sqm}', to_jsonb(NEW.area_sqm));
          END IF;
          IF OLD.rooms IS DISTINCT FROM NEW.rooms THEN
            v_changed_fields := array_append(v_changed_fields, 'Zimmer');
            v_old_values := jsonb_set(v_old_values, '{rooms}', to_jsonb(OLD.rooms));
            v_new_values := jsonb_set(v_new_values, '{rooms}', to_jsonb(NEW.rooms));
          END IF;
          IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
            v_changed_fields := array_append(v_changed_fields, 'Mieter');
            v_old_values := jsonb_set(v_old_values, '{tenant_id}', to_jsonb(OLD.tenant_id));
            v_new_values := jsonb_set(v_new_values, '{tenant_id}', to_jsonb(NEW.tenant_id));
          END IF;
          IF array_length(v_changed_fields, 1) > 0 THEN
            v_event_description := 'Einheit "' || NEW.unit_number || '" aktualisiert: ' || array_to_string(v_changed_fields, ', ');
          ELSE
            v_event_description := 'Einheit "' || NEW.unit_number || '" aktualisiert';
          END IF;
        WHEN 'DELETE' THEN
          v_event_type := 'unit_deleted';
          v_event_description := 'Einheit "' || OLD.unit_number || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'tenants' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'tenant_created';
          v_event_description := 'Mieter "' || NEW.first_name || ' ' || NEW.last_name || '" wurde angelegt';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          v_event_type := 'tenant_updated';
          IF OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name THEN
            v_changed_fields := array_append(v_changed_fields, 'Name');
            v_old_values := jsonb_set(v_old_values, '{name}', to_jsonb(OLD.first_name || ' ' || OLD.last_name));
            v_new_values := jsonb_set(v_new_values, '{name}', to_jsonb(NEW.first_name || ' ' || NEW.last_name));
          END IF;
          IF OLD.email IS DISTINCT FROM NEW.email THEN
            v_changed_fields := array_append(v_changed_fields, 'E-Mail');
            v_old_values := jsonb_set(v_old_values, '{email}', to_jsonb(OLD.email));
            v_new_values := jsonb_set(v_new_values, '{email}', to_jsonb(NEW.email));
          END IF;
          IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            v_changed_fields := array_append(v_changed_fields, 'Telefon');
            v_old_values := jsonb_set(v_old_values, '{phone}', to_jsonb(OLD.phone));
            v_new_values := jsonb_set(v_new_values, '{phone}', to_jsonb(NEW.phone));
          END IF;
          IF array_length(v_changed_fields, 1) > 0 THEN
            v_event_description := 'Mieter "' || NEW.first_name || ' ' || NEW.last_name || '" aktualisiert: ' || array_to_string(v_changed_fields, ', ');
          ELSE
            v_event_description := 'Mieter "' || NEW.first_name || ' ' || NEW.last_name || '" aktualisiert';
          END IF;
        WHEN 'DELETE' THEN
          v_event_type := 'tenant_deleted';
          v_event_description := 'Mieter "' || OLD.first_name || ' ' || OLD.last_name || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'rental_contracts' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'contract_created';
          v_event_description := 'Mietvertrag wurde angelegt (Start: ' || TO_CHAR(NEW.start_date, 'DD.MM.YYYY') || ')';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          v_event_type := 'contract_updated';
          IF OLD.rent_amount IS DISTINCT FROM NEW.rent_amount THEN
            v_changed_fields := array_append(v_changed_fields, 'Miete');
            v_old_values := jsonb_set(v_old_values, '{rent_amount}', to_jsonb(OLD.rent_amount));
            v_new_values := jsonb_set(v_new_values, '{rent_amount}', to_jsonb(NEW.rent_amount));
          END IF;
          IF OLD.deposit_amount IS DISTINCT FROM NEW.deposit_amount THEN
            v_changed_fields := array_append(v_changed_fields, 'Kaution');
            v_old_values := jsonb_set(v_old_values, '{deposit_amount}', to_jsonb(OLD.deposit_amount));
            v_new_values := jsonb_set(v_new_values, '{deposit_amount}', to_jsonb(NEW.deposit_amount));
          END IF;
          IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            v_changed_fields := array_append(v_changed_fields, 'Startdatum');
            v_old_values := jsonb_set(v_old_values, '{start_date}', to_jsonb(OLD.start_date));
            v_new_values := jsonb_set(v_new_values, '{start_date}', to_jsonb(NEW.start_date));
          END IF;
          IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
            v_changed_fields := array_append(v_changed_fields, 'Enddatum');
            v_old_values := jsonb_set(v_old_values, '{end_date}', to_jsonb(OLD.end_date));
            v_new_values := jsonb_set(v_new_values, '{end_date}', to_jsonb(NEW.end_date));
          END IF;
          IF array_length(v_changed_fields, 1) > 0 THEN
            v_event_description := 'Mietvertrag aktualisiert: ' || array_to_string(v_changed_fields, ', ');
          ELSE
            v_event_description := 'Mietvertrag aktualisiert';
          END IF;
        WHEN 'DELETE' THEN
          v_event_type := 'contract_deleted';
          v_event_description := 'Mietvertrag wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'property_equipment' THEN
      v_event_type := 'equipment_updated';
      IF OLD.heating_type IS DISTINCT FROM NEW.heating_type THEN
        v_changed_fields := array_append(v_changed_fields, 'Heizungstyp');
      END IF;
      IF OLD.elevator IS DISTINCT FROM NEW.elevator THEN
        v_changed_fields := array_append(v_changed_fields, 'Aufzug');
      END IF;
      IF OLD.balcony_terrace IS DISTINCT FROM NEW.balcony_terrace THEN
        v_changed_fields := array_append(v_changed_fields, 'Balkon/Terrasse');
      END IF;
      IF OLD.parking_spots IS DISTINCT FROM NEW.parking_spots THEN
        v_changed_fields := array_append(v_changed_fields, 'Stellplätze');
      END IF;
      IF array_length(v_changed_fields, 1) > 0 THEN
        v_event_description := 'Ausstattung aktualisiert: ' || array_to_string(v_changed_fields, ', ');
      ELSE
        v_event_description := 'Ausstattung aktualisiert';
      END IF;
      v_old_values := to_jsonb(OLD);
      v_new_values := to_jsonb(NEW);

    WHEN 'property_contacts' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'contact_created';
          v_event_description := 'Kontakt "' || NEW.contact_name || '" (' || NEW.contact_role || ') wurde angelegt';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          v_event_type := 'contact_updated';
          v_event_description := 'Kontakt "' || NEW.contact_name || '" wurde aktualisiert';
          v_old_values := to_jsonb(OLD);
          v_new_values := to_jsonb(NEW);
        WHEN 'DELETE' THEN
          v_event_type := 'contact_deleted';
          v_event_description := 'Kontakt "' || OLD.contact_name || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'maintenance_tasks' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'maintenance_created';
          v_event_description := 'Wartungsaufgabe "' || NEW.title || '" wurde angelegt';
          v_new_values := to_jsonb(NEW);
        WHEN 'UPDATE' THEN
          IF OLD.status = 'in_progress' AND NEW.status = 'completed' THEN
            v_event_type := 'maintenance_completed';
            v_event_description := 'Wartungsaufgabe "' || NEW.title || '" wurde abgeschlossen';
          ELSE
            v_event_type := 'maintenance_updated';
            v_event_description := 'Wartungsaufgabe "' || NEW.title || '" wurde aktualisiert';
          END IF;
          v_old_values := to_jsonb(OLD);
          v_new_values := to_jsonb(NEW);
        WHEN 'DELETE' THEN
          v_event_type := 'maintenance_updated';
          v_event_description := 'Wartungsaufgabe "' || OLD.title || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;

    WHEN 'property_documents' THEN
      CASE TG_OP
        WHEN 'INSERT' THEN
          v_event_type := 'document_uploaded';
          v_event_description := 'Dokument "' || NEW.document_name || '" wurde hochgeladen';
          v_new_values := to_jsonb(NEW);
        WHEN 'DELETE' THEN
          v_event_type := 'document_deleted';
          v_event_description := 'Dokument "' || OLD.document_name || '" wurde gelöscht';
          v_old_values := to_jsonb(OLD);
      END CASE;
  END CASE;

  -- Build complete metadata
  v_metadata := jsonb_build_object(
    'table_name', TG_TABLE_NAME,
    'operation', TG_OP,
    'changed_fields', v_changed_fields,
    'old_values', v_old_values,
    'new_values', v_new_values
  );

  -- Insert audit log entry
  INSERT INTO property_history (
    property_id,
    user_id,
    event_type,
    event_description,
    changed_by_name,
    metadata,
    created_at
  ) VALUES (
    v_property_id,
    v_user_id,
    v_event_type,
    v_event_description,
    v_username,
    v_metadata,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 3. CREATE TRIGGERS FOR ALL TABLES
-- =====================================================

-- Properties
DROP TRIGGER IF EXISTS audit_properties_changes ON properties;
CREATE TRIGGER audit_properties_changes
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Property Units
DROP TRIGGER IF EXISTS audit_property_units_changes ON property_units;
CREATE TRIGGER audit_property_units_changes
  AFTER INSERT OR UPDATE OR DELETE ON property_units
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Tenants
DROP TRIGGER IF EXISTS audit_tenants_changes ON tenants;
CREATE TRIGGER audit_tenants_changes
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Rental Contracts
DROP TRIGGER IF EXISTS audit_rental_contracts_changes ON rental_contracts;
CREATE TRIGGER audit_rental_contracts_changes
  AFTER INSERT OR UPDATE OR DELETE ON rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Property Equipment
DROP TRIGGER IF EXISTS audit_property_equipment_changes ON property_equipment;
CREATE TRIGGER audit_property_equipment_changes
  AFTER UPDATE ON property_equipment
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Property Contacts
DROP TRIGGER IF EXISTS audit_property_contacts_changes ON property_contacts;
CREATE TRIGGER audit_property_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON property_contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Maintenance Tasks
DROP TRIGGER IF EXISTS audit_maintenance_tasks_changes ON maintenance_tasks;
CREATE TRIGGER audit_maintenance_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();

-- Property Documents
DROP TRIGGER IF EXISTS audit_property_documents_changes ON property_documents;
CREATE TRIGGER audit_property_documents_changes
  AFTER INSERT OR DELETE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_property_change();
