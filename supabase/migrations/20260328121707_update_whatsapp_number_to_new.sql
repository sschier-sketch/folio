/*
  # Update WhatsApp number in all email templates

  1. Changes
    - Replaces old WhatsApp number 493022334468 with new number 4915679796826
    - Updates both HTML body (wa.me links) and plain text body
    - Affects all email templates that contain the old number in their footer

  2. Affected Tables
    - `email_templates`: body_html and body_text columns
*/

UPDATE email_templates
SET body_html = REPLACE(body_html, '493022334468', '4915679796826')
WHERE body_html LIKE '%493022334468%';

UPDATE email_templates
SET body_text = REPLACE(body_text, '493022334468', '4915679796826')
WHERE body_text LIKE '%493022334468%';
