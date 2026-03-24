/*
  # Create recurring tasks generator function and cron job

  ## New Function
  - `generate_recurring_maintenance_tasks()` - Generates new task instances from recurring templates
    - Finds all maintenance_tasks where is_recurring = true AND next_recurrence_date <= CURRENT_DATE
    - Creates an exact copy with status 'open', linked via parent_task_id
    - Advances next_recurrence_date based on recurrence_interval
    - Works independently of whether previous instance is still open (as specified)
    - Returns count of generated tasks

  ## New Cron Job
  - `daily-recurring-maintenance-tasks` - Runs at 00:15 daily

  ## Important Notes
  - Only recurring tasks that have a next_recurrence_date set will be processed
  - The new task inherits: title, description, priority, category, property_id, unit_id,
    tenant_id, assigned_user_id, user_id, cost, notes, notify_tenant_on_status, notify_assignee
  - The new task gets: status='open', new due_date = next_recurrence_date, fresh timestamps
  - is_recurring is NOT copied (only the template/parent is recurring, children are one-offs)
  - parent_task_id points back to the recurring template task
  - No existing data is modified except advancing the next_recurrence_date on the template
*/

-- 1. Create the recurring task generator function
CREATE OR REPLACE FUNCTION public.generate_recurring_maintenance_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task record;
  v_new_id uuid;
  v_next_date date;
  v_count integer := 0;
BEGIN
  FOR v_task IN
    SELECT *
    FROM maintenance_tasks
    WHERE is_recurring = true
      AND next_recurrence_date IS NOT NULL
      AND next_recurrence_date <= CURRENT_DATE
      AND status != 'completed'
  LOOP
    v_new_id := gen_random_uuid();

    INSERT INTO maintenance_tasks (
      id, property_id, unit_id, user_id, title, description,
      status, priority, category, source,
      cost, due_date, notes,
      tenant_id, assigned_user_id, ticket_id,
      parent_task_id,
      is_recurring, recurrence_interval, next_recurrence_date,
      notify_tenant_on_status, notify_assignee,
      email_notification_enabled, notification_days_before,
      created_at, updated_at
    ) VALUES (
      v_new_id,
      v_task.property_id,
      v_task.unit_id,
      v_task.user_id,
      v_task.title,
      v_task.description,
      'open',
      v_task.priority,
      v_task.category,
      'manual',
      v_task.cost,
      v_task.next_recurrence_date,
      v_task.notes,
      v_task.tenant_id,
      v_task.assigned_user_id,
      NULL,
      v_task.id,
      false,
      NULL,
      NULL,
      v_task.notify_tenant_on_status,
      v_task.notify_assignee,
      v_task.email_notification_enabled,
      v_task.notification_days_before,
      now(),
      now()
    );

    v_next_date := CASE v_task.recurrence_interval
      WHEN 'daily'     THEN v_task.next_recurrence_date + INTERVAL '1 day'
      WHEN 'weekly'    THEN v_task.next_recurrence_date + INTERVAL '1 week'
      WHEN 'monthly'   THEN v_task.next_recurrence_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN v_task.next_recurrence_date + INTERVAL '3 months'
      WHEN 'yearly'    THEN v_task.next_recurrence_date + INTERVAL '1 year'
      ELSE v_task.next_recurrence_date + INTERVAL '1 month'
    END;

    UPDATE maintenance_tasks
    SET next_recurrence_date = v_next_date,
        updated_at = now()
    WHERE id = v_task.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 2. Register the daily cron job (00:15 to avoid overlapping with other 00:xx jobs)
SELECT cron.schedule(
  'daily-recurring-maintenance-tasks',
  '15 0 * * *',
  'SELECT public.generate_recurring_maintenance_tasks()'
);

-- 3. Register this cron in admin system health (match existing pattern)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'admin_get_system_health'
  ) THEN
    -- The admin system health function will pick up the new cron job automatically
    -- since it queries cron.job directly
    NULL;
  END IF;
END $$;
