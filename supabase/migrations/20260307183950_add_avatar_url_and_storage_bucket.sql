/*
  # Add Profile Avatar Support

  1. Modified Tables
    - `account_profiles`
      - Added `avatar_url` (text, nullable) - stores the path to the user's profile avatar in storage

  2. Storage
    - Created `profile-avatars` public bucket for storing user profile images

  3. Security
    - Users can upload their own avatars
    - Users can update/delete their own avatars
    - Anyone can view avatars (public bucket)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update own avatar"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'profile-avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view profile avatars' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view profile avatars"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'profile-avatars');
  END IF;
END $$;
