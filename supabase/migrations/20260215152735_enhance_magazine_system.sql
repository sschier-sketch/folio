/*
  # Enhance Magazine System

  1. Modified Tables
    - `mag_posts`
      - `category` (text, default 'allgemein') - Article category for filtering
      - `is_featured` (boolean, default false) - Whether the article is featured on the overview
    - `mag_post_translations`
      - `reading_time_minutes` (integer, default 1) - Estimated reading time in minutes

  2. New Tables
    - `mag_post_faqs`
      - `id` (uuid, primary key)
      - `post_id` (uuid, FK to mag_posts)
      - `question` (text) - FAQ question
      - `answer` (text) - FAQ answer
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz)
    
  3. Storage
    - Creates `magazine-images` public storage bucket for hero images and article images

  4. Security
    - RLS enabled on `mag_post_faqs`
    - Public can read FAQs for published posts
    - Super admins have full access
    - Storage policies for authenticated admin upload and public read
*/

-- 1. Add category and is_featured to mag_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mag_posts' AND column_name = 'category'
  ) THEN
    ALTER TABLE mag_posts ADD COLUMN category text NOT NULL DEFAULT 'allgemein';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mag_posts' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE mag_posts ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add check constraint for category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mag_posts_category_check'
  ) THEN
    ALTER TABLE mag_posts ADD CONSTRAINT mag_posts_category_check
    CHECK (category IN ('finanzen', 'immobilien', 'mietrecht', 'nebenkosten', 'steuern', 'allgemein', 'news'));
  END IF;
END $$;

-- 2. Add reading_time_minutes to mag_post_translations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mag_post_translations' AND column_name = 'reading_time_minutes'
  ) THEN
    ALTER TABLE mag_post_translations ADD COLUMN reading_time_minutes integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- 3. Create mag_post_faqs table
CREATE TABLE IF NOT EXISTS mag_post_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES mag_posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mag_post_faqs_post_id ON mag_post_faqs(post_id);

ALTER TABLE mag_post_faqs ENABLE ROW LEVEL SECURITY;

-- Public can read FAQs for published posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can read FAQs for published posts' AND tablename = 'mag_post_faqs'
  ) THEN
    CREATE POLICY "Public can read FAQs for published posts"
      ON mag_post_faqs FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM mag_posts
          WHERE mag_posts.id = mag_post_faqs.post_id
          AND mag_posts.status = 'PUBLISHED'
        )
      );
  END IF;
END $$;

-- Super admins full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super admins manage FAQs' AND tablename = 'mag_post_faqs'
  ) THEN
    CREATE POLICY "Super admins manage FAQs"
      ON mag_post_faqs FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_super_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_super_admin = true
        )
      );
  END IF;
END $$;

-- 4. Create magazine-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'magazine-images',
  'magazine-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view magazine images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can view magazine images"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'magazine-images');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload magazine images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can upload magazine images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'magazine-images'
        AND EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_super_admin = true
        )
      );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update magazine images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can update magazine images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'magazine-images'
        AND EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_super_admin = true
        )
      );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete magazine images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins can delete magazine images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'magazine-images'
        AND EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_super_admin = true
        )
      );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
