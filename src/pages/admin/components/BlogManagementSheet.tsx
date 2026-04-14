import { useState, useEffect, useRef, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Plus, Edit3, Trash2, Eye, EyeOff, Loader2, AlertTriangle, Upload,
  X, Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { slugify, estimateReadTimeMinutes, type BlogSection } from "@/lib/blogPosts";

type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string;
  read_time_minutes: number | null;
  sections: BlogSection[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  total_count: number;
};

const CATEGORIES = ["Organisation", "Facturation", "Gestion", "Relation client", "Productivité", "Application"];
const MAX_COVER_BYTES = 2_000_000;

function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes("42501")) return "Droits insuffisants.";
  if (msg.includes("23505")) return "Ce slug est déjà utilisé. Choisissez-en un autre.";
  if (msg.includes("22023") && msg.includes("Reason")) return "Veuillez indiquer une raison (min. 3 caractères).";
  if (msg.includes("confirmation title")) return "Le titre saisi ne correspond pas.";
  if (msg.includes("not found")) return "Article introuvable.";
  return msg.slice(0, 180);
}

function useAdminRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && ((q.queryKey[0] as string).startsWith("admin-") || (q.queryKey[0] as string).startsWith("public-blog")) });
  };
}

// ─────────────────────────────────────────────────────────────────────
// Reason field (local copy — keeps this file self-contained)
// ─────────────────────────────────────────────────────────────────────
function ReasonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="reason">Raison de l'action <span className="text-destructive">*</span></Label>
      <Textarea
        id="reason"
        placeholder="Pourquoi cette modification ? (visible dans l'historique)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px] text-sm"
      />
      <p className="text-[10px] text-muted-foreground">Minimum 3 caractères. Enregistré dans l'audit log.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Blog form dialog (create + edit)
// ─────────────────────────────────────────────────────────────────────
type FormPost = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string;
  read_time_minutes: number;
  sections: BlogSection[];
};

function BlogFormDialog({
  open, onClose, post, defaultPublished,
}: {
  open: boolean;
  onClose: () => void;
  post: AdminBlogPost | null;
  defaultPublished: boolean;
}) {
  const refresh = useAdminRefresh();
  const [form, setForm] = useState<FormPost>(() => ({
    slug: post?.slug ?? "",
    title: post?.title ?? "",
    category: post?.category ?? CATEGORIES[0],
    excerpt: post?.excerpt ?? "",
    cover_image_url: post?.cover_image_url ?? null,
    author: post?.author ?? "Équipe BonoitecPilot",
    read_time_minutes: post?.read_time_minutes ?? 5,
    sections: post?.sections && post.sections.length > 0 ? post.sections : [{ id: "introduction", title: "Introduction", content: "" }],
  }));
  const [reason, setReason] = useState("");
  const [publishAfter, setPublishAfter] = useState(defaultPublished);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugAutoFilled = useRef(!post || post.slug === slugify(post.title));

  // Reset form when `post` changes
  useEffect(() => {
    if (!open) return;
    setForm({
      slug: post?.slug ?? "",
      title: post?.title ?? "",
      category: post?.category ?? CATEGORIES[0],
      excerpt: post?.excerpt ?? "",
      cover_image_url: post?.cover_image_url ?? null,
      author: post?.author ?? "Équipe BonoitecPilot",
      read_time_minutes: post?.read_time_minutes ?? 5,
      sections: post?.sections && post.sections.length > 0 ? post.sections : [{ id: "introduction", title: "Introduction", content: "" }],
    });
    setReason("");
    setPublishAfter(defaultPublished);
    slugAutoFilled.current = !post || post.slug === slugify(post.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  const handleTitleBlur = () => {
    if (slugAutoFilled.current || !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (file.size > MAX_COVER_BYTES) {
      toast.error(`L'image est trop grande (max ${Math.round(MAX_COVER_BYTES / 1e6)} Mo).`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeSlug = form.slug || slugify(form.title) || "blog";
      const fileName = `${safeSlug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("blog-covers")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("blog-covers").getPublicUrl(fileName);
      setForm((f) => ({ ...f, cover_image_url: pub.publicUrl }));
      toast.success("Image téléversée");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const addSection = () => {
    setForm((f) => ({ ...f, sections: [...f.sections, { id: `section-${f.sections.length + 1}`, title: "", content: "" }] }));
  };
  const removeSection = (idx: number) => {
    setForm((f) => ({ ...f, sections: f.sections.length > 1 ? f.sections.filter((_, i) => i !== idx) : f.sections }));
  };
  const updateSection = (idx: number, key: "title" | "content", value: string) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, [key]: value };
        if (key === "title") updated.id = slugify(value) || `section-${idx + 1}`;
        return updated;
      }),
    }));
  };

  const missing: string[] = [];
  if (form.title.trim().length < 3) missing.push("titre (min. 3 caractères)");
  if (form.slug.trim().length < 3) missing.push("slug");
  if (form.excerpt.trim().length < 10) missing.push("résumé (min. 10 caractères)");
  if (form.sections.length < 1 || form.sections.some((s) => s.title.trim().length === 0))
    missing.push("titre de section");
  if (form.sections.some((s) => s.content.trim().length === 0))
    missing.push("contenu de section");
  if (reason.trim().length < 3) missing.push("raison (min. 3 caractères)");
  const canSubmit = missing.length === 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const args = {
        _slug: form.slug.trim(),
        _title: form.title.trim(),
        _category: form.category.trim(),
        _excerpt: form.excerpt.trim(),
        _cover_image_url: form.cover_image_url,
        _author: form.author.trim() || "Équipe BonoitecPilot",
        _read_time: form.read_time_minutes,
        _sections: form.sections,
        _reason: reason.trim(),
      };
      let id: string;
      if (post?.id) {
        const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> })
          .rpc("admin_update_blog_post", { _id: post.id, ...args });
        if (error) throw error;
        id = post.id;
      } else {
        const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> })
          .rpc("admin_create_blog_post", args);
        if (error) throw error;
        id = data as string;
      }
      // Apply publish state if changed
      if (publishAfter !== (post?.published ?? false)) {
        const { error: pubErr } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> })
          .rpc("admin_set_blog_published", { _id: id, _published: publishAfter, _reason: reason.trim() });
        if (pubErr) throw pubErr;
      }
    },
    onSuccess: () => {
      toast.success(post ? "Article modifié" : "Article créé");
      refresh();
      onClose();
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="font-display">{post ? "Modifier l'article" : "Créer un article"}</DialogTitle>
          <DialogDescription>
            {post ? `Modification de « ${post.title} »` : "Nouvel article pour le blog public."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Titre <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onBlur={handleTitleBlur}
                placeholder="Comment mieux…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL) <span className="text-destructive">*</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  slugAutoFilled.current = false;
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="comment-mieux"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground truncate">bonoitecpilot.fr/blog/{form.slug || "…"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Temps de lecture (min)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.read_time_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, read_time_minutes: parseInt(e.target.value) || 1 }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, read_time_minutes: estimateReadTimeMinutes(f.sections) }))}
                >
                  Auto
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Résumé <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Une phrase qui donne envie de lire…"
              className="min-h-[60px]"
            />
            <p className="text-[10px] text-muted-foreground">{form.excerpt.length}/400</p>
          </div>

          <div className="space-y-1.5">
            <Label>Image de couverture</Label>
            <div className="flex items-center gap-3">
              {form.cover_image_url ? (
                <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-border/40 shrink-0">
                  <img src={form.cover_image_url} alt="preview" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-5 w-5 p-0"
                    onClick={() => setForm((f) => ({ ...f, cover_image_url: null }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-20 w-32 rounded-lg border border-dashed border-border/40 flex items-center justify-center text-muted-foreground shrink-0">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Envoi…" : "Téléverser"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">JPG, PNG ou WEBP. Max 2 Mo.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Auteur</Label>
            <Input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="Équipe BonoitecPilot"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sections de l'article <span className="text-destructive">*</span></Label>
              <Button type="button" variant="outline" size="sm" className="gap-1 h-7" onClick={addSection}>
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            <div className="space-y-3">
              {form.sections.map((s, i) => (
                <div key={i} className="rounded-lg border border-border/40 p-3 space-y-2 bg-muted/20">
                  <div className="flex gap-2">
                    <Input
                      value={s.title}
                      onChange={(e) => updateSection(i, "title", e.target.value)}
                      placeholder={`Section ${i + 1} — titre`}
                      className="flex-1 h-8 text-sm"
                    />
                    {form.sections.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeSection(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={s.content}
                    onChange={(e) => updateSection(i, "content", e.target.value)}
                    placeholder="Contenu de la section. Utilisez deux sauts de ligne pour séparer les paragraphes."
                    className="min-h-[100px] text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={`flex items-start gap-2 p-3 rounded-lg border ${publishAfter ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30"}`}>
            <input
              type="checkbox"
              id="publish-after"
              checked={publishAfter}
              onChange={(e) => setPublishAfter(e.target.checked)}
              className="h-4 w-4 mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="publish-after" className="text-sm font-medium cursor-pointer">
                Publier immédiatement sur le blog
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {publishAfter
                  ? "✓ L'article sera visible sur bonoitecpilot.fr/blog dès l'enregistrement."
                  : "⚠ Décoché : l'article sera enregistré comme brouillon (invisible sur le site)."}
              </p>
            </div>
          </div>

          <ReasonField value={reason} onChange={setReason} />
        </div>

        <DialogFooter className="flex-col sm:flex-col items-stretch gap-2">
          {!canSubmit && (
            <p className="text-[11px] text-warning text-right">
              Champs manquants : <span className="font-medium">{missing.join(", ")}</span>
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending || uploading}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {publishAfter
                ? (post ? "Enregistrer et publier" : "Publier l'article")
                : (post ? "Enregistrer le brouillon" : "Enregistrer comme brouillon")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Delete dialog (typed-title confirmation)
// ─────────────────────────────────────────────────────────────────────
function DeleteBlogDialog({ open, onClose, post }: { open: boolean; onClose: () => void; post: AdminBlogPost | null }) {
  const refresh = useAdminRefresh();
  const [confirmTitle, setConfirmTitle] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) { setConfirmTitle(""); setReason(""); }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!post) return;
      const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> })
        .rpc("admin_delete_blog_post", { _id: post.id, _confirm_title: confirmTitle, _reason: reason.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Article supprimé"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const valid = post && reason.trim().length >= 3 && confirmTitle.trim() === post.title;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Supprimer l'article définitivement</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Tapez exactement <b>{post?.title ?? ""}</b> ci-dessous pour confirmer.</span>
          </div>
          <div className="space-y-1.5">
            <Label>Titre à taper</Label>
            <Input value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} placeholder={post?.title ?? ""} />
          </div>
          <ReasonField value={reason} onChange={setReason} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main sheet
// ─────────────────────────────────────────────────────────────────────
export function BlogManagementSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogPost | null>(null);
  const refresh = useAdminRefresh();

  const { data: posts = [], isLoading } = useQuery<AdminBlogPost[]>({
    queryKey: ["admin-blog-posts"],
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> })
        .rpc("admin_list_blog_posts", { _limit: 100, _offset: 0, _include_drafts: true });
      if (error) throw error;
      return (data ?? []) as AdminBlogPost[];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> })
        .rpc("admin_set_blog_published", { _id: id, _published: published, _reason: published ? "Publication depuis la liste" : "Dépublication depuis la liste" });
      if (error) throw error;
    },
    onSuccess: (_, v) => { toast.success(v.published ? "Publié" : "Dépublié"); refresh(); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const openCreate = () => { setEditingPost(null); setFormOpen(true); };
  const openEdit = (p: AdminBlogPost) => { setEditingPost(p); setFormOpen(true); };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-display">
              <FileText className="h-5 w-5 text-primary" />
              Articles du blog
            </SheetTitle>
            <SheetDescription>
              {posts.length} article{posts.length !== 1 ? "s" : ""} · {posts.filter(p => p.published).length} publié{posts.filter(p => p.published).length !== 1 ? "s" : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            <Button onClick={openCreate} className="w-full gap-2 mb-4">
              <Plus className="h-4 w-4" /> Créer un article
            </Button>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun article pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/40 bg-card p-3 flex gap-3">
                    <div className="h-16 w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium line-clamp-2">{p.title}</p>
                        <Badge variant="outline" className={p.published ? "bg-success/15 text-success border-success/30 shrink-0 text-[9px]" : "bg-muted text-muted-foreground shrink-0 text-[9px]"}>
                          {p.published ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{p.category}</Badge>
                        <span>{format(new Date(p.created_at), "d MMM yyyy", { locale: fr })}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={p.published ? "Dépublier" : "Publier"}
                          disabled={publishMutation.isPending}
                          onClick={() => publishMutation.mutate({ id: p.id, published: !p.published })}
                        >
                          {p.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Modifier" onClick={() => openEdit(p)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Supprimer" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <BlogFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        post={editingPost}
        defaultPublished={editingPost?.published ?? true}
      />

      <DeleteBlogDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        post={deleteTarget}
      />
    </>
  );
}
