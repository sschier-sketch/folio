/*
  # Automatischer Cron-Job für Indexmieten-Berechnungen
  
  1. Zweck
    - Aktiviert pg_cron Extension für automatische Jobs
    - Erstellt täglichen Cron-Job für Indexmieten-Berechnungen
    - Job läuft täglich um 3:00 Uhr UTC (4:00 MEZ / 5:00 MESZ)
  
  2. Änderungen
    - Aktiviert pg_cron Extension
    - Erstellt Cron-Job der die RPC-Funktion aufruft
    - Dokumentiert Setup für manuelle Konfiguration falls nötig
  
  3. Hinweise
    - Falls pg_cron nicht verfügbar ist, muss der Job manuell über
      die Supabase-Konsole oder externe Scheduler konfiguriert werden
    - Alternative: Vercel Cron Jobs oder GitHub Actions
*/

-- =====================================================
-- 1. AKTIVIERE PG_CRON EXTENSION
-- =====================================================

-- Versuche pg_cron zu aktivieren (funktioniert nur wenn verfügbar)
DO $$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
  RAISE NOTICE 'pg_cron extension activated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not activate pg_cron: %. Manual setup required.', SQLERRM;
END $$;

-- =====================================================
-- 2. ERSTELLE CRON-JOB (falls pg_cron verfügbar)
-- =====================================================

DO $$ 
DECLARE
  v_job_exists boolean;
BEGIN
  -- Prüfe ob pg_cron verfügbar ist
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    
    -- Lösche existierenden Job falls vorhanden
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'daily-index-rent-calculations'
    ) INTO v_job_exists;
    
    IF v_job_exists THEN
      PERFORM cron.unschedule('daily-index-rent-calculations');
      RAISE NOTICE 'Removed existing daily-index-rent-calculations job';
    END IF;
    
    -- Erstelle neuen Cron-Job
    -- Läuft täglich um 3:00 Uhr UTC
    PERFORM cron.schedule(
      'daily-index-rent-calculations',
      '0 3 * * *',
      'SELECT run_automatic_index_rent_calculations()'
    );
    
    RAISE NOTICE 'Created daily cron job for index rent calculations at 3:00 AM UTC';
  ELSE
    RAISE NOTICE 'pg_cron not available. Please configure external scheduler.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron job: %. Manual setup required.', SQLERRM;
END $$;

-- =====================================================
-- 3. DOKUMENTATION FÜR MANUELLE KONFIGURATION
-- =====================================================

COMMENT ON FUNCTION run_automatic_index_rent_calculations() IS 
'Automatische Indexmieten-Berechnung. 
Cron-Schedule: 0 3 * * * (täglich 3:00 Uhr UTC)
Alternativen falls pg_cron nicht verfügbar:
1. Supabase Webhooks mit externem Scheduler (z.B. Vercel Cron)
2. GitHub Actions mit Schedule
3. Manueller Aufruf über Edge Function: /functions/v1/run-index-rent-calculations';
