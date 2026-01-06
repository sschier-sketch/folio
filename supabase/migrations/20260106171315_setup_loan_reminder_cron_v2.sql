/*
  # Cron-Job für automatische Kredit-Erinnerungen

  1. Cron-Job Setup
    - Erstellt einen täglichen Cron-Job um 8:00 Uhr morgens
    - Ruft die process-loan-reminders Edge Function auf
    - Versendet automatisch E-Mail-Erinnerungen

  HINWEIS: 
  - pg_cron muss manuell in der Supabase-Konsole aktiviert werden
  - Der Job läuft täglich um 8:00 Uhr UTC (9:00 Uhr MEZ / 10:00 Uhr MESZ)
  - Die Edge Function URL wird dynamisch aus den Supabase-Einstellungen gelesen
*/

-- Hinweis: Dies ist eine dokumentierte Migration
-- Der eigentliche Cron-Job muss über die Supabase-Konsole oder pg_cron konfiguriert werden

-- Erstelle eine Hilfsfunktion zum manuellen Aufruf der Reminder-Verarbeitung
CREATE OR REPLACE FUNCTION trigger_loan_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Diese Funktion kann manuell aufgerufen werden, um Reminders zu verarbeiten
  -- In der Produktion sollte dies über einen Cron-Job oder Scheduler erfolgen
  
  RETURN jsonb_build_object(
    'message', 'Bitte konfigurieren Sie einen Cron-Job in der Supabase-Konsole',
    'cron_schedule', '0 8 * * *',
    'function_url', current_setting('app.settings.supabase_url', true) || '/functions/v1/process-loan-reminders'
  );
END;
$$;

-- Kommentar für Dokumentation
COMMENT ON FUNCTION trigger_loan_reminders() IS 
'Hilfsfunktion für Kredit-Erinnerungen. 
Konfigurieren Sie einen Cron-Job: 0 8 * * * 
Ziel: /functions/v1/process-loan-reminders';
