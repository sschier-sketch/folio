/*
  # Fix Billing Info Trigger - Add 30-Day Trial for New Users

  1. Problem
    - The `create_billing_info` trigger creates billing_info without trial dates
    - New users register without a trial phase even though the trial system exists
    - The trial setup was previously in `handle_new_user` but got removed during a bugfix

  2. Solution
    - Update `create_billing_info()` to include `trial_started_at` and `trial_ends_at`
    - All new users automatically get a 30-day trial period on registration

  3. Changes
    - Modified `create_billing_info()` function to set trial_started_at = now() and trial_ends_at = now() + 30 days
*/

CREATE OR REPLACE FUNCTION public.create_billing_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.billing_info (
    user_id,
    billing_email,
    subscription_plan,
    subscription_status,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'active',
    now(),
    now() + interval '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
