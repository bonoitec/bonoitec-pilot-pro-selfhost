-- Admin-managed blog feature
--
-- Adds:
--   1. blog_posts table (public SELECT for published only, all mutations via RPC)
--   2. blog-covers storage bucket + RLS (public read, super-admin write)
--   3. admin_audit_log CHECK constraint update (allow 'blog' target_type)
--   4. 5 admin write RPCs (create, update, publish, delete, list) — pattern matches
--      20260413230000_admin_phase2_writes.sql
--   5. public read RPC get_published_blog_posts() for anon/authenticated callers
--
-- All writes go through SECURITY DEFINER RPCs that call _require_super_admin()
-- and _require_reason() and log to admin_audit_log via _admin_log_action().

-- ────────────────────────────────────────────────────────────────────
-- 1. blog_posts table
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (length(slug) BETWEEN 3 AND 120),
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  category text NOT NULL CHECK (length(category) BETWEEN 2 AND 60),
  excerpt text NOT NULL CHECK (length(excerpt) BETWEEN 10 AND 400),
  cover_image_url text,
  author text NOT NULL DEFAULT 'Équipe BonoitecPilot',
  read_time_minutes int CHECK (read_time_minutes BETWEEN 1 AND 60),
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (published = true);

-- No INSERT/UPDATE/DELETE policies — all mutations go through admin_* RPCs.

-- ────────────────────────────────────────────────────────────────────
-- 2. blog-covers storage bucket + RLS
-- ────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Super admin write blog-covers" ON storage.objects;
CREATE POLICY "Super admin write blog-covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-covers' AND public.is_super_admin());

DROP POLICY IF EXISTS "Super admin update blog-covers" ON storage.objects;
CREATE POLICY "Super admin update blog-covers" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-covers' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'blog-covers' AND public.is_super_admin());

DROP POLICY IF EXISTS "Super admin delete blog-covers" ON storage.objects;
CREATE POLICY "Super admin delete blog-covers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-covers' AND public.is_super_admin());

DROP POLICY IF EXISTS "Public read blog-covers" ON storage.objects;
CREATE POLICY "Public read blog-covers" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-covers');

-- ────────────────────────────────────────────────────────────────────
-- 3. Allow 'blog' target_type in admin_audit_log
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_target_type_check;
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_target_type_check
  CHECK (target_type IN ('organization','user','platform','blog'));

-- ────────────────────────────────────────────────────────────────────
-- 4. Admin write RPCs
-- ────────────────────────────────────────────────────────────────────

-- 4a. admin_list_blog_posts — super admin sees everything (drafts + published)
CREATE OR REPLACE FUNCTION public.admin_list_blog_posts(
  _limit int DEFAULT 50,
  _offset int DEFAULT 0,
  _include_drafts boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  category text,
  excerpt text,
  cover_image_url text,
  author text,
  read_time_minutes int,
  sections jsonb,
  published boolean,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clamped_limit int;
  _total bigint;
BEGIN
  PERFORM public._require_super_admin();
  _clamped_limit := GREATEST(1, LEAST(100, COALESCE(_limit, 50)));

  SELECT count(*)::bigint INTO _total
  FROM public.blog_posts p
  WHERE _include_drafts OR p.published = true;

  RETURN QUERY
  SELECT
    p.id, p.slug, p.title, p.category, p.excerpt, p.cover_image_url, p.author,
    p.read_time_minutes, p.sections, p.published, p.published_at,
    p.created_at, p.updated_at,
    _total AS total_count
  FROM public.blog_posts p
  WHERE _include_drafts OR p.published = true
  ORDER BY p.created_at DESC
  LIMIT _clamped_limit
  OFFSET GREATEST(0, COALESCE(_offset, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_blog_posts(int, int, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_blog_posts(int, int, boolean) TO authenticated;

-- 4b. admin_create_blog_post
CREATE OR REPLACE FUNCTION public.admin_create_blog_post(
  _slug text,
  _title text,
  _category text,
  _excerpt text,
  _cover_image_url text,
  _author text,
  _read_time int,
  _sections jsonb,
  _reason text
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_id uuid;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  INSERT INTO public.blog_posts (
    slug, title, category, excerpt, cover_image_url, author,
    read_time_minutes, sections, created_by
  )
  VALUES (
    trim(_slug),
    trim(_title),
    trim(_category),
    trim(_excerpt),
    NULLIF(trim(COALESCE(_cover_image_url, '')), ''),
    COALESCE(NULLIF(trim(COALESCE(_author, '')), ''), 'Équipe BonoitecPilot'),
    _read_time,
    COALESCE(_sections, '[]'::jsonb),
    auth.uid()
  )
  RETURNING id INTO _new_id;

  PERFORM public._admin_log_action(
    'create_blog', 'blog', _new_id, _title,
    jsonb_build_object(
      'reason', _reason,
      'slug', _slug,
      'category', _category,
      'published', false
    )
  );

  RETURN _new_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_create_blog_post(text, text, text, text, text, text, int, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_blog_post(text, text, text, text, text, text, int, jsonb, text) TO authenticated;

-- 4c. admin_update_blog_post
CREATE OR REPLACE FUNCTION public.admin_update_blog_post(
  _id uuid,
  _slug text,
  _title text,
  _category text,
  _excerpt text,
  _cover_image_url text,
  _author text,
  _read_time int,
  _sections jsonb,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _before record;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT id, slug, title, category, excerpt, cover_image_url, author, read_time_minutes
  INTO _before
  FROM public.blog_posts WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'blog post not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.blog_posts
     SET slug = trim(_slug),
         title = trim(_title),
         category = trim(_category),
         excerpt = trim(_excerpt),
         cover_image_url = NULLIF(trim(COALESCE(_cover_image_url, '')), ''),
         author = COALESCE(NULLIF(trim(COALESCE(_author, '')), ''), 'Équipe BonoitecPilot'),
         read_time_minutes = _read_time,
         sections = COALESCE(_sections, '[]'::jsonb),
         updated_at = now()
   WHERE id = _id;

  PERFORM public._admin_log_action(
    'update_blog', 'blog', _id, _title,
    jsonb_build_object(
      'reason', _reason,
      'before', to_jsonb(_before),
      'after', jsonb_build_object(
        'slug', _slug, 'title', _title, 'category', _category,
        'excerpt', _excerpt, 'cover_image_url', _cover_image_url,
        'author', _author, 'read_time_minutes', _read_time
      )
    )
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_update_blog_post(uuid, text, text, text, text, text, text, int, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_blog_post(uuid, text, text, text, text, text, text, int, jsonb, text) TO authenticated;

-- 4d. admin_set_blog_published
CREATE OR REPLACE FUNCTION public.admin_set_blog_published(
  _id uuid,
  _published boolean,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _title text;
  _was_published boolean;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT title, published INTO _title, _was_published
  FROM public.blog_posts WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'blog post not found' USING ERRCODE = 'P0002'; END IF;

  UPDATE public.blog_posts
     SET published = _published,
         published_at = CASE
           WHEN _published AND published_at IS NULL THEN now()
           ELSE published_at
         END,
         updated_at = now()
   WHERE id = _id;

  PERFORM public._admin_log_action(
    CASE WHEN _published THEN 'publish_blog' ELSE 'unpublish_blog' END,
    'blog', _id, _title,
    jsonb_build_object('reason', _reason, 'was_published', _was_published, 'now_published', _published)
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_blog_published(uuid, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_blog_published(uuid, boolean, text) TO authenticated;

-- 4e. admin_delete_blog_post (typed-title confirmation)
CREATE OR REPLACE FUNCTION public.admin_delete_blog_post(
  _id uuid,
  _confirm_title text,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _title text;
  _slug text;
BEGIN
  PERFORM public._require_super_admin();
  PERFORM public._require_reason(_reason);

  SELECT title, slug INTO _title, _slug
  FROM public.blog_posts WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'blog post not found' USING ERRCODE = 'P0002'; END IF;
  IF _confirm_title IS NULL OR trim(_confirm_title) <> COALESCE(_title, '') THEN
    RAISE EXCEPTION 'confirmation title does not match' USING ERRCODE = '22023';
  END IF;

  -- Audit BEFORE delete so the record exists when we log
  PERFORM public._admin_log_action(
    'delete_blog', 'blog', _id, _title,
    jsonb_build_object('reason', _reason, 'slug', _slug, 'deleted_at', now())
  );

  DELETE FROM public.blog_posts WHERE id = _id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_blog_post(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_blog_post(uuid, text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────────
-- 5. Public read RPC
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_published_blog_posts()
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  category text,
  excerpt text,
  cover_image_url text,
  author text,
  read_time_minutes int,
  sections jsonb,
  published_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, slug, title, category, excerpt, cover_image_url, author,
         read_time_minutes, sections, published_at
  FROM public.blog_posts
  WHERE published = true
  ORDER BY published_at DESC NULLS LAST, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_blog_posts() TO anon, authenticated;
