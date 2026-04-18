-- One-off cleanup: remove the 'test' blog post that was created while
-- exercising the admin blog CRUD. Idempotent — deletes zero rows if the
-- post doesn't exist (because someone already removed it via the admin UI).
--
-- Narrow predicate on BOTH slug AND title to make accidental data loss
-- impossible; the admin-facing production data does not use this combo.
DELETE FROM public.blog_posts
WHERE slug = 'test'
  AND title = 'test';
