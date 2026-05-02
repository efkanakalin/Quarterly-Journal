-- ============================================================
-- 007: Blog posts (Medium-style)
--
-- - Public read için published=true postlar herkese açık
-- - INSERT/UPDATE/DELETE sadece admin
-- - Slug benzersiz; cover_image_url opsiyonel; body markdown
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  excerpt         TEXT,
  cover_image_url TEXT,
  body            TEXT NOT NULL DEFAULT '',
  read_minutes    INT  NOT NULL DEFAULT 1,
  published       BOOLEAN NOT NULL DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug         ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- SELECT:
--  - Yayında olan post'ları HERKES okur (anonim dahil) — landing/SEO için.
--  - Admin draft'ları da görür.
DROP POLICY IF EXISTS "blog_posts_public_select" ON blog_posts;
CREATE POLICY "blog_posts_public_select"
  ON blog_posts FOR SELECT
  USING (
    published = true
    OR public.is_admin()
  );

-- INSERT/UPDATE/DELETE: sadece admin
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON blog_posts;
CREATE POLICY "blog_posts_admin_insert"
  ON blog_posts FOR INSERT
  WITH CHECK (public.is_admin() AND author_id = auth.uid());

DROP POLICY IF EXISTS "blog_posts_admin_update" ON blog_posts;
CREATE POLICY "blog_posts_admin_update"
  ON blog_posts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blog_posts_admin_delete" ON blog_posts;
CREATE POLICY "blog_posts_admin_delete"
  ON blog_posts FOR DELETE
  USING (public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
