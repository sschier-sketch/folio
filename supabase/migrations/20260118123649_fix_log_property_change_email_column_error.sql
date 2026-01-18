/*
  # FIX: log_property_change Email Column Error - FINAL FIX
  
  1. Problem
    - account_profiles hat KEINE email Spalte
    - Funktion versucht email aus account_profiles zu lesen -> FEHLER
    - email existiert nur in auth.users
  
  2. Lösung
    - Username nur aus first_name + last_name von account_profiles
    - Wenn leer, dann email aus auth.users holen
    - Komplettes Exception Handling um JEDEN Fehler abzufangen
    - Trigger darf NIE eine Transaktion scheitern lassen
*/

CREATE OR REPLACE FUNCTION log_property_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_property_id uuid;
  v_user_id uuid;
  v_username text := 'System';
  v_event_type text;
  v_event_description text;
  v_metadata jsonb := '{}';
  v_changed_fields text[] := '{}';
  v_old_values jsonb := '{}';
  v_new_values jsonb := '{}';
BEGIN
  -- Komplettes Exception Handling für maximale Stabilität
  BEGIN
    -- Determine user_id
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.user_id;
    ELSE
      v_user_id := NEW.user_id;
    END IF;

    -- Schritt 1: Versuche Namen aus account_profiles zu holen (OHNE email!)
    BEGIN
      SELECT TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
      INTO v_username
      FROM account_profiles
      WHERE user_id = v_user_id
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_username := NULL;
    END;

    -- Schritt 2: Wenn Name leer oder NULL, hole email aus auth.users
    IF v_username IS NULL OR v_username = '' THEN
      BEGIN
        SELECT email
        INTO v_username
        FROM auth.users
        WHERE id = v_user_id
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        v_username := NULL;
      END;
    END IF;

    -- Schritt 3: Fallback auf 'System' wenn immer noch NULL
    IF v_username IS NULL OR v_username = '' THEN
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

    -- Skip if property_id is NULL
    IF v_property_id IS NULL THEN
      RETURN COALESCE(NEW, OLD);
    END IF;

    -- Build event type and description based on table and operation
    CASE TG_TABLE_NAME
      WHEN 'properties' THEN
        CASE TG_OP
          WHEN 'INSERT' THEN
            v_event_type := 'property_created';
            v_event_description := 'Immobilie "' || COALESCE(NEW.address, 'Unbekannt') || '" wurde angelegt';
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
            IF OLD.zip_code IS DISTINCT FROM NEW.zip_code THEN
              v_changed_fields := array_append(v_changed_fields, 'PLZ');
              v_old_values := jsonb_set(v_old_values, '{zip_code}', to_jsonb(OLD.zip_code));
              v_new_values := jsonb_set(v_new_values, '{zip_code}', to_jsonb(NEW.zip_code));
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
            IF OLD.size_sqm IS DISTINCT FROM NEW.size_sqm THEN
              v_changed_fields := array_append(v_changed_fields, 'Fläche');
              v_old_values := jsonb_set(v_old_values, '{size_sqm}', to_jsonb(OLD.size_sqm));
              v_new_values := jsonb_set(v_new_values, '{size_sqm}', to_jsonb(NEW.size_sqm));
            END IF;
            IF OLD.property_management_type IS DISTINCT FROM NEW.property_management_type THEN
              v_changed_fields := array_append(v_changed_fields, 'Verwaltungsart');
              v_old_values := jsonb_set(v_old_values, '{property_management_type}', to_jsonb(OLD.property_management_type));
              v_new_values := jsonb_set(v_new_values, '{property_management_type}', to_jsonb(NEW.property_management_type));
            END IF;
            IF OLD.ownership_type IS DISTINCT FROM NEW.ownership_type THEN
              v_changed_fields := array_append(v_changed_fields, 'Besitzvariante');
              v_old_values := jsonb_set(v_old_values, '{ownership_type}', to_jsonb(OLD.ownership_type));
              v_new_values := jsonb_set(v_new_values, '{ownership_type}', to_jsonb(NEW.ownership_type));
            END IF;
            
            IF array_length(v_changed_fields, 1) > 0 THEN
              v_event_description := 'Immobilie aktualisiert: ' || array_to_string(v_changed_fields, ', ');
            ELSE
              v_event_description := 'Immobilie aktualisiert';
            END IF;
          WHEN 'DELETE' THEN
            v_event_type := 'property_deleted';
            v_event_description := 'Immobilie "' || COALESCE(OLD.address, 'Unbekannt') || '" wurde gelöscht';
            v_old_values := to_jsonb(OLD);
        END CASE;
      ELSE
        -- For all other tables: simple generic log
        v_event_type := TG_TABLE_NAME || '_' || lower(TG_OP);
        v_event_description := TG_TABLE_NAME || ' ' || TG_OP;
        IF TG_OP = 'DELETE' THEN
          v_old_values := to_jsonb(OLD);
        ELSE
          v_new_values := to_jsonb(NEW);
        END IF;
    END CASE;

    -- Build complete metadata
    v_metadata := jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'changed_fields', v_changed_fields,
      'old_values', v_old_values,
      'new_values', v_new_values
    );

    -- Insert audit log entry mit kompletten Exception Handling
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        -- Logge den Fehler aber lasse die Operation nicht fehlschlagen!
        RAISE WARNING 'Failed to insert audit log for property %: %', v_property_id, SQLERRM;
    END;

  EXCEPTION
    WHEN OTHERS THEN
      -- Wenn IRGENDETWAS schief geht, logge es nur - aber schmeisse keinen Fehler!
      RAISE WARNING 'Error in log_property_change trigger: %', SQLERRM;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;
