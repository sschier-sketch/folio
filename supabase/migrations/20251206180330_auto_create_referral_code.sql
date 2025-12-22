/*
  # Auto-create referral codes for users

  ## Changes
    - Create function to generate unique referral codes
    - Add trigger to auto-create user_settings with referral code on signup
    - Backfill existing users without referral codes

  ## Notes
    - Ensures every user has a referral code automatically
    - Uses random alphanumeric codes (8 characters)
*/

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.user_settings WHERE referral_code = code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to auto-create user settings with referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    referral_code,
    theme,
    notifications_enabled,
    language,
    role,
    can_invite_users,
    can_manage_properties,
    can_manage_tenants,
    can_manage_finances,
    can_view_analytics
  )
  VALUES (
    NEW.id,
    generate_referral_code(),
    'light',
    true,
    'de',
    'admin',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users without user_settings
INSERT INTO public.user_settings (
  user_id,
  referral_code,
  theme,
  notifications_enabled,
  language,
  role,
  can_invite_users,
  can_manage_properties,
  can_manage_tenants,
  can_manage_finances,
  can_view_analytics
)
SELECT 
  id,
  generate_referral_code(),
  'light',
  true,
  'de',
  'admin',
  true,
  true,
  true,
  true,
  true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;