/*
  # Cleanup: Remove unused documents table
  
  1. Changes
    - Drop `documents` table (not used in application)
    - This table was planned but never implemented in the frontend
  
  2. Notes
    - No data loss risk as table is not in use
    - Keeping the codebase clean and maintainable
*/

DROP TABLE IF EXISTS documents CASCADE;