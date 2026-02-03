/*
  # Update New User Trigger for Newsletter Opt-in
  
  1. Changes
    - Update handle_new_user trigger to save newsletter_opt_in from metadata
  
  2. Purpose
    - Store user's newsletter consent preference during registration
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO account_profiles (
    user_id,
    email,
    newsletter_opt_in
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  );

  INSERT INTO admin_users (user_id, role, can_manage_users, can_manage_settings, can_view_analytics)
  VALUES (NEW.id, 'owner', true, true, true);

  UPDATE admin_users
  SET full_name = COALESCE(
    (SELECT CONCAT(first_name, ' ', last_name)
     FROM account_profiles
     WHERE user_id = NEW.id AND first_name IS NOT NULL AND last_name IS NOT NULL),
    NEW.email
  ),
  email = NEW.email
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;