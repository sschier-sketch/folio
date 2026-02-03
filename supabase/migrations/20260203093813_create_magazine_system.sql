/*
  # Magazin/Blog-System

  1. Neue Tabellen
    - `mag_topics` - Themen/Kategorien
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mag_topic_translations` - Übersetzungen für Themen
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key)
      - `locale` (text, 'de' | 'en')
      - `name` (text)
      - `slug` (text, unique per locale)
      - `description` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mag_tags` - Tags für Artikel
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mag_tag_translations` - Übersetzungen für Tags
      - `id` (uuid, primary key)
      - `tag_id` (uuid, foreign key)
      - `locale` (text, 'de' | 'en')
      - `name` (text)
      - `slug` (text, unique per locale)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mag_posts` - Blog-Artikel
      - `id` (uuid, primary key)
      - `status` (text, 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED')
      - `hero_image_url` (text, nullable)
      - `author_name` (text)
      - `primary_topic_id` (uuid, foreign key, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp, nullable)
    
    - `mag_post_translations` - Übersetzungen für Artikel
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key)
      - `locale` (text, 'de' | 'en')
      - `title` (text)
      - `slug` (text, unique per locale)
      - `excerpt` (text, nullable)
      - `content` (text, markdown)
      - `seo_title` (text, nullable)
      - `seo_description` (text, nullable)
      - `og_image_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mag_post_tags` - Many-to-many Beziehung zwischen Posts und Tags
      - `post_id` (uuid, foreign key)
      - `tag_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `mag_slug_history` - Slug-History für 301 Redirects
      - `id` (uuid, primary key)
      - `entity_type` (text, 'post' | 'topic' | 'tag')
      - `entity_id` (uuid)
      - `locale` (text)
      - `old_slug` (text)
      - `new_slug` (text)
      - `changed_at` (timestamp)

  2. Security
    - Enable RLS auf allen Tabellen
    - Public read für PUBLISHED posts
    - Authenticated write für Admins (via admin_users check mit is_super_admin)
*/

-- Topics
CREATE TABLE IF NOT EXISTS mag_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mag_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read topics"
  ON mag_topics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage topics"
  ON mag_topics FOR ALL
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

-- Topic Translations
CREATE TABLE IF NOT EXISTS mag_topic_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES mag_topics(id) ON DELETE CASCADE NOT NULL,
  locale text NOT NULL CHECK (locale IN ('de', 'en')),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(topic_id, locale),
  UNIQUE(locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_mag_topic_translations_topic_id ON mag_topic_translations(topic_id);
CREATE INDEX IF NOT EXISTS idx_mag_topic_translations_locale_slug ON mag_topic_translations(locale, slug);

ALTER TABLE mag_topic_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read topic translations"
  ON mag_topic_translations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage topic translations"
  ON mag_topic_translations FOR ALL
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

-- Tags
CREATE TABLE IF NOT EXISTS mag_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mag_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tags"
  ON mag_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON mag_tags FOR ALL
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

-- Tag Translations
CREATE TABLE IF NOT EXISTS mag_tag_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES mag_tags(id) ON DELETE CASCADE NOT NULL,
  locale text NOT NULL CHECK (locale IN ('de', 'en')),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tag_id, locale),
  UNIQUE(locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_mag_tag_translations_tag_id ON mag_tag_translations(tag_id);
CREATE INDEX IF NOT EXISTS idx_mag_tag_translations_locale_slug ON mag_tag_translations(locale, slug);

ALTER TABLE mag_tag_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tag translations"
  ON mag_tag_translations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage tag translations"
  ON mag_tag_translations FOR ALL
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

-- Posts
CREATE TABLE IF NOT EXISTS mag_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
  hero_image_url text,
  author_name text NOT NULL DEFAULT 'Rentably Team',
  primary_topic_id uuid REFERENCES mag_topics(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mag_posts_status ON mag_posts(status);
CREATE INDEX IF NOT EXISTS idx_mag_posts_published_at ON mag_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mag_posts_topic_id ON mag_posts(primary_topic_id);

ALTER TABLE mag_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON mag_posts FOR SELECT
  TO public
  USING (status = 'PUBLISHED');

CREATE POLICY "Authenticated users can read all posts"
  ON mag_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage posts"
  ON mag_posts FOR ALL
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

-- Post Translations
CREATE TABLE IF NOT EXISTS mag_post_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES mag_posts(id) ON DELETE CASCADE NOT NULL,
  locale text NOT NULL CHECK (locale IN ('de', 'en')),
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, locale),
  UNIQUE(locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_mag_post_translations_post_id ON mag_post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_mag_post_translations_locale_slug ON mag_post_translations(locale, slug);
CREATE INDEX IF NOT EXISTS idx_mag_post_translations_fulltext ON mag_post_translations USING gin(to_tsvector('german', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

ALTER TABLE mag_post_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published post translations"
  ON mag_post_translations FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM mag_posts
      WHERE mag_posts.id = mag_post_translations.post_id
      AND mag_posts.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Authenticated users can read all post translations"
  ON mag_post_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage post translations"
  ON mag_post_translations FOR ALL
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

-- Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS mag_post_tags (
  post_id uuid REFERENCES mag_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES mag_tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_mag_post_tags_post_id ON mag_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_mag_post_tags_tag_id ON mag_post_tags(tag_id);

ALTER TABLE mag_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published post tags"
  ON mag_post_tags FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM mag_posts
      WHERE mag_posts.id = mag_post_tags.post_id
      AND mag_posts.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Authenticated users can read all post tags"
  ON mag_post_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage post tags"
  ON mag_post_tags FOR ALL
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

-- Slug History (for 301 redirects)
CREATE TABLE IF NOT EXISTS mag_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('post', 'topic', 'tag')),
  entity_id uuid NOT NULL,
  locale text NOT NULL CHECK (locale IN ('de', 'en')),
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mag_slug_history_lookup ON mag_slug_history(entity_type, locale, old_slug);

ALTER TABLE mag_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read slug history"
  ON mag_slug_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage slug history"
  ON mag_slug_history FOR ALL
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

-- Trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION mag_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mag_topics_updated_at
  BEFORE UPDATE ON mag_topics
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

CREATE TRIGGER mag_topic_translations_updated_at
  BEFORE UPDATE ON mag_topic_translations
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

CREATE TRIGGER mag_tags_updated_at
  BEFORE UPDATE ON mag_tags
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

CREATE TRIGGER mag_tag_translations_updated_at
  BEFORE UPDATE ON mag_tag_translations
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

CREATE TRIGGER mag_posts_updated_at
  BEFORE UPDATE ON mag_posts
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

CREATE TRIGGER mag_post_translations_updated_at
  BEFORE UPDATE ON mag_post_translations
  FOR EACH ROW
  EXECUTE FUNCTION mag_set_updated_at();

-- Function to track slug changes
CREATE OR REPLACE FUNCTION mag_track_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'mag_post_translations' AND OLD.slug != NEW.slug THEN
    INSERT INTO mag_slug_history (entity_type, entity_id, locale, old_slug, new_slug)
    VALUES ('post', OLD.post_id, OLD.locale, OLD.slug, NEW.slug);
  ELSIF TG_TABLE_NAME = 'mag_topic_translations' AND OLD.slug != NEW.slug THEN
    INSERT INTO mag_slug_history (entity_type, entity_id, locale, old_slug, new_slug)
    VALUES ('topic', OLD.topic_id, OLD.locale, OLD.slug, NEW.slug);
  ELSIF TG_TABLE_NAME = 'mag_tag_translations' AND OLD.slug != NEW.slug THEN
    INSERT INTO mag_slug_history (entity_type, entity_id, locale, old_slug, new_slug)
    VALUES ('tag', OLD.tag_id, OLD.locale, OLD.slug, NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mag_post_translations_slug_change
  AFTER UPDATE ON mag_post_translations
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION mag_track_slug_change();

CREATE TRIGGER mag_topic_translations_slug_change
  AFTER UPDATE ON mag_topic_translations
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION mag_track_slug_change();

CREATE TRIGGER mag_tag_translations_slug_change
  AFTER UPDATE ON mag_tag_translations
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
  EXECUTE FUNCTION mag_track_slug_change();
