import { supabase } from "@/integrations/supabase/client";

export type BlogSection = {
  id: string;
  title: string;
  content: string;
};

export type DbBlogPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string;
  read_time_minutes: number | null;
  sections: BlogSection[];
  published_at: string | null;
};

export async function fetchPublishedPosts(): Promise<DbBlogPost[]> {
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc("get_published_blog_posts", {});
  if (error) throw new Error(error.message);
  return (data ?? []) as DbBlogPost[];
}

export async function fetchPublishedPostBySlug(slug: string): Promise<DbBlogPost | null> {
  const all = await fetchPublishedPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function estimateReadTimeMinutes(sections: BlogSection[]): number {
  const words = sections
    .map((s) => `${s.title} ${s.content}`)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.min(60, Math.round(words / 200)));
}
