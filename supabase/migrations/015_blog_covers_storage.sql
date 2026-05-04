-- Public storage bucket for blog cover images, plus policies.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Anyone can read (covers are shown publicly on the blog page)
DROP POLICY IF EXISTS "Public read blog covers" ON storage.objects;
CREATE POLICY "Public read blog covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-covers');

-- Only admins can upload / update / delete
DROP POLICY IF EXISTS "Admins write blog covers" ON storage.objects;
CREATE POLICY "Admins write blog covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-covers' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update blog covers" ON storage.objects;
CREATE POLICY "Admins update blog covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'blog-covers' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete blog covers" ON storage.objects;
CREATE POLICY "Admins delete blog covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-covers' AND public.is_admin());
