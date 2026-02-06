/*
  # Fix Email Template Links and Variables

  1. Link Fixes
    - registration (de/en): app.rentab.ly/login -> rentab.ly/login
    - subscription_started (de/en): app.rentab.ly/dashboard -> rentab.ly/dashboard
    - referral_reward_earned (de/en): app.rentab.ly/dashboard -> rentab.ly/dashboard
    - user_invitation (de/en): http://rentab.ly/ -> https://rentab.ly/

  2. Notes
    - All links now point to rentab.ly (no subdomain)
    - All links use https
*/

UPDATE email_templates
SET body_html = REPLACE(body_html, 'https://app.rentab.ly/', 'https://rentab.ly/'),
    updated_at = now()
WHERE body_html LIKE '%app.rentab.ly%';

UPDATE email_templates
SET body_html = REPLACE(body_html, 'http://rentab.ly/', 'https://rentab.ly/'),
    updated_at = now()
WHERE body_html LIKE '%http://rentab.ly/%';
