/*
  # Task-Ticket Linkage and Notification Triggers

  ## Changes
  1. Add UNIQUE constraint on `maintenance_tasks.ticket_id` to enforce 1:1 ticket-to-task mapping
  2. Add foreign key from `maintenance_tasks.ticket_id` to `tickets.id`
  3. Create trigger function `notify_task_status_change()` that queues an email
     to the tenant when task status changes and `notify_tenant_on_status` is true
  4. Create trigger function `notify_task_assigned()` that queues an email
     to the assigned user when `assigned_user_id` changes and `notify_assignee` is true
  5. Add index on `maintenance_tasks.ticket_id` for fast lookups

  ## Notification Logic
  - Status change: Only fires on actual status column change (old != new)
  - Assignment: Only fires when assigned_user_id changes to a new non-null value
  - Uses email_logs queue (status='queued') processed by existing cron job
  - Idempotency key prevents duplicate emails for same event
  - Looks up tenant email and assignee email from related tables

  ## Security
  - Trigger functions run as SECURITY DEFINER to access email_logs and auth.users
  - No RLS changes needed (existing policies cover maintenance_tasks)
*/

-- 1. Unique constraint on ticket_id (enforces max 1 task per ticket)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'maintenance_tasks_ticket_id_unique'
  ) THEN
    ALTER TABLE maintenance_tasks
      ADD CONSTRAINT maintenance_tasks_ticket_id_unique UNIQUE (ticket_id);
  END IF;
END $$;

-- 2. Foreign key from maintenance_tasks.ticket_id to tickets.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'maintenance_tasks_ticket_id_fkey'
    AND table_name = 'maintenance_tasks'
  ) THEN
    ALTER TABLE maintenance_tasks
      ADD CONSTRAINT maintenance_tasks_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Index on ticket_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_ticket_id
  ON maintenance_tasks(ticket_id) WHERE ticket_id IS NOT NULL;

-- 4. Trigger function: notify tenant on task status change
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_email text;
  v_tenant_name text;
  v_property_name text;
  v_task_category text;
  v_old_status_label text;
  v_new_status_label text;
  v_idempotency text;
  v_language text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT COALESCE(NEW.notify_tenant_on_status, false) THEN
    RETURN NEW;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t.email INTO v_tenant_email
  FROM tenants t
  WHERE t.id = NEW.tenant_id;

  IF v_tenant_email IS NULL OR v_tenant_email = '' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(t.first_name || ' ' || t.last_name, t.first_name, t.last_name, 'Mieter')
  INTO v_tenant_name
  FROM tenants t
  WHERE t.id = NEW.tenant_id;

  SELECT p.name INTO v_property_name
  FROM properties p
  WHERE p.id = NEW.property_id;

  v_language := COALESCE(
    (SELECT us.language FROM user_settings us WHERE us.user_id = NEW.user_id LIMIT 1),
    'de'
  );

  IF v_language = 'de' THEN
    v_task_category := CASE NEW.category
      WHEN 'wartung' THEN 'Wartung'
      WHEN 'reparatur' THEN 'Reparatur'
      WHEN 'beschwerde' THEN 'Beschwerde'
      ELSE 'Allgemein'
    END;
    v_old_status_label := CASE OLD.status
      WHEN 'open' THEN 'Offen'
      WHEN 'in_progress' THEN 'In Bearbeitung'
      WHEN 'completed' THEN 'Erledigt'
      ELSE OLD.status
    END;
    v_new_status_label := CASE NEW.status
      WHEN 'open' THEN 'Offen'
      WHEN 'in_progress' THEN 'In Bearbeitung'
      WHEN 'completed' THEN 'Erledigt'
      ELSE NEW.status
    END;
  ELSE
    v_task_category := CASE NEW.category
      WHEN 'wartung' THEN 'Maintenance'
      WHEN 'reparatur' THEN 'Repair'
      WHEN 'beschwerde' THEN 'Complaint'
      ELSE 'General'
    END;
    v_old_status_label := CASE OLD.status
      WHEN 'open' THEN 'Open'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'completed' THEN 'Completed'
      ELSE OLD.status
    END;
    v_new_status_label := CASE NEW.status
      WHEN 'open' THEN 'Open'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'completed' THEN 'Completed'
      ELSE NEW.status
    END;
  END IF;

  v_idempotency := 'task_status:' || NEW.id || ':' || OLD.status || ':' || NEW.status || ':' || to_char(now(), 'YYYYMMDDHH24MI');

  INSERT INTO email_logs (
    mail_type, category, to_email, user_id, subject, status,
    idempotency_key, metadata
  ) VALUES (
    'task_status_changed',
    'transactional',
    v_tenant_email,
    NEW.user_id,
    CASE v_language
      WHEN 'de' THEN 'Aufgabe aktualisiert: ' || NEW.title
      ELSE 'Task updated: ' || NEW.title
    END,
    'queued',
    v_idempotency,
    jsonb_build_object(
      'template_key', 'task_status_changed',
      'language', v_language,
      'variables', jsonb_build_object(
        'tenantName', v_tenant_name,
        'taskTitle', NEW.title,
        'oldStatus', v_old_status_label,
        'newStatus', v_new_status_label,
        'propertyName', COALESCE(v_property_name, ''),
        'taskCategory', v_task_category
      )
    )
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 5. Create trigger for status change notification
DROP TRIGGER IF EXISTS trg_notify_task_status_change ON maintenance_tasks;
CREATE TRIGGER trg_notify_task_status_change
  AFTER UPDATE ON maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_status_change();

-- 6. Trigger function: notify assignee on task assignment
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

-- 7. Create trigger for assignment notification
DROP TRIGGER IF EXISTS trg_notify_task_assigned ON maintenance_tasks;
CREATE TRIGGER trg_notify_task_assigned
  AFTER UPDATE ON maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Also fire on INSERT for when a task is created with an assigned user
DROP TRIGGER IF EXISTS trg_notify_task_assigned_on_insert ON maintenance_tasks;
CREATE TRIGGER trg_notify_task_assigned_on_insert
  AFTER INSERT ON maintenance_tasks
  FOR EACH ROW
  WHEN (NEW.assigned_user_id IS NOT NULL AND COALESCE(NEW.notify_assignee, false) = true)
  EXECUTE FUNCTION notify_task_assigned();