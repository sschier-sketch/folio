/*
  # Fix expenses status constraint to match application usage

  1. Changes
    - Drop the old `expenses_status_check` constraint
    - Create a new constraint that includes the status values actually used by the application
    - Application uses: 'open', 'paid', 'archived'
    
  2. Notes
    - The old constraint only allowed 'booked', 'open', 'archived'
    - The application was trying to use 'pending' and 'paid'
    - This migration aligns the database constraint with application behavior
*/

-- Drop the old status check constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;

-- Add new constraint with the actual status values used by the app
ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
  CHECK (status IN ('open', 'paid', 'archived'));
