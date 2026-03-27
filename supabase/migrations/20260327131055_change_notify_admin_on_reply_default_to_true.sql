/*
  # Change notify_admin_on_reply default to true

  1. Changes
    - Alters the default value of `notify_admin_on_reply` on `tickets` table from `false` to `true`
    - New tickets will now have admin notification enabled by default

  2. Notes
    - Existing tickets are NOT modified; only new tickets get the new default
*/

ALTER TABLE tickets ALTER COLUMN notify_admin_on_reply SET DEFAULT true;
