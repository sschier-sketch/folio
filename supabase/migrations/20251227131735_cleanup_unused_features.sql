/*
  # Cleanup: Remove incomplete/unused features
  
  1. Tables to Remove
    - `user_invitations` - Incomplete feature, no email sending, not functional
    - `invoices` - Placeholder feature, no Stripe integration, not functional
  
  2. Notes
    - These features were partially implemented but never completed
    - Removing them keeps the database clean and focused
    - All truly active features remain intact
*/

DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;