/*
  # Feedback System

  This migration adds a feedback system where users can submit feature requests and ideas:

  ## 1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `feedback_text` (text): The user's feedback/idea
      - `willing_to_pay` (boolean): Whether user is willing to pay
      - `payment_amount` (text): How much they'd pay
      - `status` (text): pending, reviewed, planned, implemented
      - `admin_notes` (text): Internal notes from admins
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Security
    - Enable RLS on feedback table
    - Users can view their own feedback
    - Users can insert their own feedback
    - Only admins can update feedback (for status changes)

  ## 3. Indexes
    - Index on user_id for fast lookups
    - Index on status for admin filtering
*/

-- =====================================================
-- 1. CREATE USER_FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback_text text NOT NULL,
  willing_to_pay boolean DEFAULT false NOT NULL,
  payment_amount text,
  status text DEFAULT 'pending' NOT NULL,
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_feedback_status_check'
  ) THEN
    ALTER TABLE public.user_feedback
    ADD CONSTRAINT user_feedback_status_check
    CHECK (status IN ('pending', 'reviewed', 'planned', 'implemented'));
  END IF;
END $$;

-- =====================================================
-- 2. ENABLE RLS AND CREATE POLICIES
-- =====================================================

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_settings
      WHERE user_settings.user_id = (select auth.uid())
      AND user_settings.role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback"
  ON public.user_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_settings
      WHERE user_settings.user_id = (select auth.uid())
      AND user_settings.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_settings
      WHERE user_settings.user_id = (select auth.uid())
      AND user_settings.role = 'admin'
    )
  );

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- =====================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
