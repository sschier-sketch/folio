/*
  # Add Sitemap Generation System

  1. Modified Tables
    - `seo_global_settings`
      - `sitemap_enabled` (boolean, default true) - Toggle to enable/disable automatic sitemap generation
      - `sitemap_xml_cache` (text, nullable) - Cached sitemap XML content
      - `sitemap_generated_at` (timestamptz, nullable) - Timestamp of last sitemap generation

  2. Cron Job
    - Creates a daily cron job `daily-sitemap-generation` running at 4:00 AM UTC
    - Calls the sitemap edge function via pg_net to regenerate the sitemap

  3. Important Notes
    - Sitemap generation is enabled by default
    - The cached XML is refreshed daily via the cron job
    - The sitemap edge function can also be called on-demand
*/

-- 1. Add sitemap columns to seo_global_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_global_settings' AND column_name = 'sitemap_enabled'
  ) THEN
    ALTER TABLE seo_global_settings ADD COLUMN sitemap_enabled boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_global_settings' AND column_name = 'sitemap_xml_cache'
  ) THEN
    ALTER TABLE seo_global_settings ADD COLUMN sitemap_xml_cache text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_global_settings' AND column_name = 'sitemap_generated_at'
  ) THEN
    ALTER TABLE seo_global_settings ADD COLUMN sitemap_generated_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- 2. Create cron job for daily sitemap generation
DO $$
DECLARE
  v_job_exists boolean;
  v_supabase_url text;
  v_service_key text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'daily-sitemap-generation'
    ) INTO v_job_exists;

    IF v_job_exists THEN
      PERFORM cron.unschedule('daily-sitemap-generation');
    END IF;

    SELECT decrypted_secret INTO v_supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;

    IF v_supabase_url IS NULL THEN
      SELECT current_setting('app.settings.supabase_url', true) INTO v_supabase_url;
    END IF;

    IF v_supabase_url IS NULL THEN
      v_supabase_url := current_setting('request.headers', true)::json->>'host';
      IF v_supabase_url IS NOT NULL THEN
        v_supabase_url := 'https://' || v_supabase_url;
      END IF;
    END IF;

    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM cron.schedule(
        'daily-sitemap-generation',
        '0 4 * * *',
        format(
          'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb)',
          v_supabase_url || '/functions/v1/sitemap',
          json_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key
          )::text,
          json_build_object('action', 'regenerate')::text
        )
      );
      RAISE NOTICE 'Created daily sitemap generation cron job at 4:00 AM UTC';
    ELSE
      RAISE NOTICE 'Could not determine Supabase URL or service key. Manual cron setup required.';
    END IF;
  ELSE
    RAISE NOTICE 'pg_cron not available. Please configure external scheduler for sitemap generation.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create sitemap cron job: %. Manual setup required.', SQLERRM;
END $$;
