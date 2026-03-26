/*
  # Fix task_assigned trigger variable name mismatch

  1. Problem
    - The `task_assigned` email template uses `{{userName}}` in its HTML body
    - The `notify_task_assigned()` trigger passes `assigneeName` instead of `userName`
    - Result: the greeting line shows empty name in the sent email

  2. Fix
    - Update the trigger to pass `userName` (matching the template) in addition to `assigneeName`
    - Both values contain the assignee's name
    - No template changes needed -- the HTML already uses `{{userName}}`

  3. No other changes
    - No RLS changes
    - No table changes
    - `task_status_changed` trigger is already correct (tenantName matches template)
*/

CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignee_email text;
  v_assignee_name text;
  v_assigner_name text;
  v_property_name text;
  v_task_category text;
  v_task_priority text;
  v_due_date_str text;
  v_idempotency text;
  v_language text;
BEGIN
  IF OLD.assigned_user_id IS NOT DISTINCT FROM NEW.assigned_user_id THEN
    RETURN NEW;
  END IF;

  IF NOT COALESCE(NEW.notify_assignee, false) THEN
    RETURN NEW;
  END IF;

  IF NEW.assigned_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT u.email INTO v_assignee_email
  FROM auth.users u
  WHERE u.id = NEW.assigned_user_id;

  IF v_assignee_email IS NULL THEN
    RETURN NEW;
  END IF;

  v_language := COALESCE(
    (SELECT us.language FROM user_settings us WHERE us.user_id = NEW.assigned_user_id LIMIT 1),
    'de'
  );

  SELECT
    COALESCE(ap.first_name || ' ' || ap.last_name, ap.first_name, u.email)
  INTO v_assignee_name
  FROM auth.users u
  LEFT JOIN account_profiles ap ON ap.user_id = u.id
  WHERE u.id = NEW.assigned_user_id;

  SELECT
    COALESCE(ap.first_name || ' ' || ap.last_name, ap.first_name, u.email)
  INTO v_assigner_name
  FROM auth.users u
  LEFT JOIN account_profiles ap ON ap.user_id = u.id
  WHERE u.id = NEW.user_id;

  SELECT p.name INTO v_property_name
  FROM properties p
  WHERE p.id = NEW.property_id;

  IF v_language = 'de' THEN
    v_task_category := CASE NEW.category
      WHEN 'wartung' THEN 'Wartung'
      WHEN 'reparatur' THEN 'Reparatur'
      WHEN 'beschwerde' THEN 'Beschwerde'
      ELSE 'Allgemein'
    END;
    v_task_priority := CASE NEW.priority
      WHEN 'high' THEN 'Hoch'
      WHEN 'low' THEN 'Niedrig'
      ELSE 'Mittel'
    END;
  ELSE
    v_task_category := CASE NEW.category
      WHEN 'wartung' THEN 'Maintenance'
      WHEN 'reparatur' THEN 'Repair'
      WHEN 'beschwerde' THEN 'Complaint'
      ELSE 'General'
    END;
    v_task_priority := CASE NEW.priority
      WHEN 'high' THEN 'High'
      WHEN 'low' THEN 'Low'
      ELSE 'Medium'
    END;
  END IF;

  v_due_date_str := CASE
    WHEN NEW.due_date IS NOT NULL THEN to_char(NEW.due_date, 'DD.MM.YYYY')
    ELSE CASE v_language WHEN 'de' THEN 'Nicht festgelegt' ELSE 'Not set' END
  END;

  v_idempotency := 'task_assigned:' || NEW.id || ':' || NEW.assigned_user_id || ':' || to_char(now(), 'YYYYMMDDHH24MI');

  INSERT INTO email_logs (
    mail_type, category, to_email, user_id, subject, status,
    idempotency_key, metadata
  ) VALUES (
    'task_assigned',
    'transactional',
    v_assignee_email,
    NEW.user_id,
    CASE v_language
      WHEN 'de' THEN 'Neue Aufgabe zugewiesen: ' || NEW.title
      ELSE 'New task assigned: ' || NEW.title
    END,
    'queued',
    v_idempotency,
    jsonb_build_object(
      'template_key', 'task_assigned',
      'language', v_language,
      'variables', jsonb_build_object(
        'userName', COALESCE(v_assignee_name, ''),
        'assigneeName', COALESCE(v_assignee_name, ''),
        'taskTitle', NEW.title,
        'taskDescription', COALESCE(NEW.description, ''),
        'propertyName', COALESCE(v_property_name, ''),
        'taskCategory', v_task_category,
        'taskPriority', v_task_priority,
        'dueDate', v_due_date_str,
        'assignedBy', COALESCE(v_assigner_name, '')
      )
    )
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;
