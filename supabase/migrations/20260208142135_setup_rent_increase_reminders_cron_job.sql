/*
  # Automatischer Cron-Job fuer Mieterhoeungs-Erinnerungen

  1. Zweck
    - Erstellt taeglichen Cron-Job fuer automatische Mieterhoeungs-Erinnerungen
    - Job laeuft taeglich um 4:00 Uhr UTC (5:00 MEZ / 6:00 MESZ)
    - Ruft die existierende Funktion create_rent_increase_reminder_tickets() auf
    - Erstellt Tickets 3 Monate vor faelligen Mieterhoehungen

  2. Aenderungen
    - Erstellt Cron-Job der die bestehende PostgreSQL-Funktion aufruft
    - Keine neuen Tabellen oder Spalten

  3. Hinweise
    - Die Funktion prueft nur Vertraege mit auto_create_rent_increase_tickets = true
    - Duplikate werden automatisch verhindert (90-Tage Lookback)
    - Erinnerungen werden als Tickets mit Prioritaet 'medium' erstellt
    - Falls pg_cron nicht verfuegbar ist, kann die Edge Function
      /functions/v1/create-rent-increase-reminders als Alternative genutzt werden
*/

-- =====================================================
-- 1. ERSTELLE CRON-JOB (falls pg_cron verfuegbar)
-- =====================================================

DO $$ 
DECLARE
  v_job_exists boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'daily-rent-increase-reminders'
    ) INTO v_job_exists;
    
    IF v_job_exists THEN
      PERFORM cron.unschedule('daily-rent-increase-reminders');
      RAISE NOTICE 'Removed existing daily-rent-increase-reminders job';
    END IF;
    
    PERFORM cron.schedule(
      'daily-rent-increase-reminders',
      '0 4 * * *',
      'SELECT * FROM create_rent_increase_reminder_tickets()'
    );
    
    RAISE NOTICE 'Created daily cron job for rent increase reminders at 4:00 AM UTC';
  ELSE
    RAISE NOTICE 'pg_cron not available. Please configure external scheduler or use Edge Function /functions/v1/create-rent-increase-reminders';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron job: %. Manual setup required.', SQLERRM;
END $$;

-- =====================================================
-- 2. DOKUMENTATION
-- =====================================================

COMMENT ON FUNCTION create_rent_increase_reminder_tickets() IS 
'Automatische Mieterhoeungs-Erinnerungen.
Erstellt Tickets 3 Monate vor faelligen Mieterhoehungen fuer Vertraege mit aktivierter Erinnerungsfunktion.
Cron-Schedule: 0 4 * * * (taeglich 4:00 Uhr UTC)
Alternativen falls pg_cron nicht verfuegbar:
1. Edge Function: /functions/v1/create-rent-increase-reminders
2. Supabase Webhooks mit externem Scheduler
3. Manueller Aufruf ueber die Edge Function';
