/*
  # Add global head HTML to system settings

  1. Modified Tables
    - `system_settings`
      - Added `global_head_html` (text, nullable) - Custom HTML injected into the document head for OG/meta tags
      - Added `global_head_html_updated_at` (timestamptz, nullable) - Timestamp of last head HTML update
      - Added `global_head_html_updated_by` (uuid, nullable) - User who last updated the head HTML

  2. Default Value
    - Sets a default global head HTML template with placeholders for dynamic values
    - Placeholders: {{SITE_URL}}, {{PAGE_URL}}, {{TITLE}}, {{DESCRIPTION}}, {{OG_IMAGE}}

  3. Security
    - Uses existing system_settings RLS policies (admin-only write, public read via RPC)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'global_head_html'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN global_head_html text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'global_head_html_updated_at'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN global_head_html_updated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'global_head_html_updated_by'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN global_head_html_updated_by uuid;
  END IF;
END $$;

UPDATE system_settings
SET global_head_html = '<link rel="canonical" href="{{PAGE_URL}}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="rentably" />
<meta property="og:title" content="{{TITLE}}" />
<meta property="og:description" content="{{DESCRIPTION}}" />
<meta property="og:url" content="{{PAGE_URL}}" />
<meta property="og:image" content="{{OG_IMAGE}}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{TITLE}}" />
<meta name="twitter:description" content="{{DESCRIPTION}}" />
<meta name="twitter:image" content="{{OG_IMAGE}}" />'
WHERE id = 1 AND global_head_html IS NULL;
