/*
  # Fix index_rent_calculations mail_thread_id foreign key

  1. Changes
    - Change `index_rent_calculations.mail_thread_id` FK delete rule from NO ACTION to SET NULL
    - This allows mail_threads in trash to be deleted without blocking on FK constraint
    - The index rent calculation data is preserved; only the thread reference is cleared

  2. Why
    - The previous NO ACTION rule prevented users from emptying their trash
      when any trashed thread was referenced by an index rent calculation
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'index_rent_calculations_mail_thread_id_fkey'
    AND table_name = 'index_rent_calculations'
  ) THEN
    ALTER TABLE index_rent_calculations
      DROP CONSTRAINT index_rent_calculations_mail_thread_id_fkey;

    ALTER TABLE index_rent_calculations
      ADD CONSTRAINT index_rent_calculations_mail_thread_id_fkey
      FOREIGN KEY (mail_thread_id)
      REFERENCES mail_threads(id)
      ON DELETE SET NULL;
  END IF;
END $$;
