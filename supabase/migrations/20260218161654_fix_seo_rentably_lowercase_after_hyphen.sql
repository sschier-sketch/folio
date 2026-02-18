/*
  # Fix SEO: rentably always lowercase after hyphen

  1. Changes
    - Updates the title_template in seo_global_settings from '%s – Rentably' to '%s – rentably'
    - Updates the default_title to use lowercase 'rentably' after the dash
    - Updates all existing seo_page_settings titles that contain '– Rentably' or '- Rentably'
      to use lowercase '– rentably' or '- rentably'

  2. Important
    - Ensures brand consistency: rentably is always lowercase after a separator
    - Only modifies title fields, no structural changes
*/

UPDATE seo_global_settings
SET title_template = REPLACE(title_template, '– Rentably', '– rentably'),
    default_title = REPLACE(default_title, '– Rentably', '– rentably');

UPDATE seo_page_settings
SET title = REPLACE(title, '– Rentably', '– rentably')
WHERE title LIKE '%– Rentably%';

UPDATE seo_page_settings
SET title = REPLACE(title, '- Rentably', '- rentably')
WHERE title LIKE '%- Rentably%';

UPDATE seo_page_settings
SET title = REPLACE(title, '- rentably', '– rentably')
WHERE title LIKE '%- rentably%';
