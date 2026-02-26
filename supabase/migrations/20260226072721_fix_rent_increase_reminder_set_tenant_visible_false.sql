/*
  # Fix rent increase reminder tickets - set tenant_visible = false

  1. Changes
    - Updated `create_rent_increase_reminder_tickets()` function to set
      `tenant_visible = false` on newly created tickets
    - These are internal system reminders for the landlord only

  2. Notes
    - Index rent and staffel rent increase reminders are internal notifications
      meant only for the property owner/manager
    - Tenants should not see these in their portal
    - The existing backfill was handled in the previous migration
*/

CREATE OR REPLACE FUNCTION create_rent_increase_reminder_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_ticket_id uuid;
  v_increase_date date;
  v_description text;
BEGIN
  FOR rec IN
    SELECT
      rc.id AS contract_id,
      rc.property_id,
      rc.tenant_id,
      rc.user_id,
      rc.rent_increase_type,
      rc.index_first_increase_date,
      rc.graduated_rent_date,
      rc.staffel_years,
      rc.contract_start
    FROM public.rental_contracts rc
    WHERE rc.rent_increase_type IN ('index', 'staffel', 'graduated')
      AND rc.auto_create_rent_increase_tickets = true
  LOOP
    v_increase_date := NULL;

    IF rec.rent_increase_type = 'index' AND rec.index_first_increase_date IS NOT NULL THEN
      v_increase_date := rec.index_first_increase_date;
      IF v_increase_date < CURRENT_DATE THEN
        v_increase_date := v_increase_date + (
          ((CURRENT_DATE - v_increase_date) / 365 + 1) * INTERVAL '1 year'
        )::interval;
      END IF;
    END IF;

    IF rec.rent_increase_type IN ('staffel', 'graduated') THEN
      IF rec.graduated_rent_date IS NOT NULL AND rec.graduated_rent_date <> '' THEN
        BEGIN
          v_increase_date := rec.graduated_rent_date::date;
          IF v_increase_date < CURRENT_DATE AND rec.staffel_years IS NOT NULL AND rec.staffel_years > 0 THEN
            v_increase_date := v_increase_date + (
              ((CURRENT_DATE - v_increase_date) / (rec.staffel_years * 365) + 1) * (rec.staffel_years || ' years')::interval
            );
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_increase_date := NULL;
        END;
      ELSIF rec.staffel_years IS NOT NULL AND rec.staffel_years > 0 AND rec.contract_start IS NOT NULL THEN
        v_increase_date := rec.contract_start + (rec.staffel_years || ' years')::interval;
        IF v_increase_date < CURRENT_DATE THEN
          v_increase_date := v_increase_date + (
            ((CURRENT_DATE - v_increase_date) / (rec.staffel_years * 365) + 1) * (rec.staffel_years || ' years')::interval
          );
        END IF;
      END IF;
    END IF;

    IF v_increase_date IS NOT NULL
       AND v_increase_date <= (CURRENT_DATE + INTERVAL '90 days')
       AND v_increase_date > CURRENT_DATE
    THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.property_id = rec.property_id
          AND t.tenant_id = rec.tenant_id
          AND t.subject LIKE '%Mieterh%hung%'
          AND t.created_at > (CURRENT_DATE - INTERVAL '60 days')
      ) THEN
        v_description := 'Gemaess Vertrag ist eine Mieterhoehung zum ' ||
          to_char(v_increase_date, 'DD.MM.YYYY') ||
          ' faellig. Bitte pruefen und ggf. Mieterhoehungsschreiben vorbereiten.';

        INSERT INTO public.tickets (
          property_id,
          tenant_id,
          user_id,
          subject,
          status,
          priority,
          category,
          ticket_type,
          tenant_visible,
          created_at,
          updated_at
        ) VALUES (
          rec.property_id,
          rec.tenant_id,
          rec.user_id,
          'Mieterhoehung faellig',
          'open',
          'medium',
          'general',
          'property',
          false,
          now(),
          now()
        )
        RETURNING id INTO v_ticket_id;

        INSERT INTO public.ticket_messages (
          ticket_id,
          sender_type,
          sender_name,
          message
        ) VALUES (
          v_ticket_id,
          'system',
          'System',
          v_description
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;
