import { useState, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// shared helpers
// ─────────────────────────────────────────────────────────────

function useAdminRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("admin-"),
    });
  };
}

function friendlyErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes("42501")) return "Action refusée : droits insuffisants ou opération interdite.";
  if (msg.includes("confirmation name")) return "Le nom saisi ne correspond pas.";
  if (msg.includes("confirmation email")) return "L'email saisi ne correspond pas.";
  if (msg.includes("Reason is required")) return "Veuillez indiquer une raison (min. 3 caractères).";
  if (msg.includes("already has super_admin")) return "Cet utilisateur est déjà super-admin.";
  if (msg.includes("not found")) return "Élément introuvable.";
  return msg.slice(0, 160);
}

function DialogShell({
  open, onClose, title, description, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-2">{children}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="reason">Raison de l'action <span className="text-destructive">*</span></Label>
      <Textarea
        id="reason"
        placeholder="Expliquez brièvement pourquoi (visible dans l'historique)…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[70px] text-sm"
      />
      <p className="text-[10px] text-muted-foreground">Minimum 3 caractères. Enregistré dans l'audit log.</p>
    </div>
  );
}

type MutationState = { pending: boolean };

// ─────────────────────────────────────────────────────────────
// Shop: Edit
// ─────────────────────────────────────────────────────────────
export function EditOrgDialog({
  open, onClose, shop,
}: {
  open: boolean;
  onClose: () => void;
  shop: { id: string; name: string | null; email: string | null; phone: string | null; siret: string | null };
}) {
  const refresh = useAdminRefresh();
  const [name, setName] = useState(shop.name ?? "");
  const [email, setEmail] = useState(shop.email ?? "");
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [siret, setSiret] = useState(shop.siret ?? "");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_update_organization", {
        _org_id: shop.id, _name: name, _email: email, _phone: phone, _siret: siret, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atelier modifié"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  const valid = reason.trim().length >= 3 && name.trim().length > 0;

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Modifier l'atelier"
      description="Les champs vides seront enregistrés comme vides."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label>Nom</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Téléphone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>SIRET</Label>
        <Input value={siret} onChange={(e) => setSiret(e.target.value)} />
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Shop: Extend trial
// ─────────────────────────────────────────────────────────────
export function ExtendTrialDialog({
  open, onClose, orgId, orgName,
}: { open: boolean; onClose: () => void; orgId: string; orgName: string | null }) {
  const refresh = useAdminRefresh();
  const [days, setDays] = useState("14");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const d = parseInt(days, 10);
      if (!d || d < 1 || d > 365) throw new Error("Nombre de jours invalide (1-365)");
      const { error } = await (supabase as any).rpc("admin_extend_trial", { _org_id: orgId, _days: d, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Essai prolongé"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  const valid = reason.trim().length >= 3 && parseInt(days, 10) >= 1;

  return (
    <DialogShell
      open={open} onClose={onClose}
      title={`Prolonger l'essai — ${orgName ?? ""}`}
      description="Ajoute des jours à la date de fin d'essai."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Prolonger
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label>Nombre de jours à ajouter</Label>
        <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} />
        <p className="text-[10px] text-muted-foreground">Entre 1 et 365 jours.</p>
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Shop: Grant subscription
// ─────────────────────────────────────────────────────────────
export function GrantSubscriptionDialog({
  open, onClose, orgId, orgName,
}: { open: boolean; onClose: () => void; orgId: string; orgName: string | null }) {
  const refresh = useAdminRefresh();
  const [plan, setPlan] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [months, setMonths] = useState("3");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const m = parseInt(months, 10);
      if (!m || m < 1 || m > 36) throw new Error("Durée invalide (1-36)");
      const { error } = await (supabase as any).rpc("admin_grant_subscription", {
        _org_id: orgId, _plan: plan, _months: m, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Abonnement offert"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  const valid = reason.trim().length >= 3 && parseInt(months, 10) >= 1;

  return (
    <DialogShell
      open={open} onClose={onClose}
      title={`Offrir un abonnement — ${orgName ?? ""}`}
      description="Active l'abonnement complimentaire pour la durée choisie."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Offrir
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="quarterly">Trimestriel</SelectItem>
            <SelectItem value="annual">Annuel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Durée (mois)</Label>
        <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} />
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Shop: Toggle subscription ON/OFF
// ─────────────────────────────────────────────────────────────
export function ToggleSubscriptionDialog({
  open, onClose, orgId, orgName, currentStatus,
}: {
  open: boolean; onClose: () => void; orgId: string; orgName: string | null; currentStatus: string | null;
}) {
  const refresh = useAdminRefresh();
  const [reason, setReason] = useState("");
  const turningOn = currentStatus !== "active";

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_set_subscription_active", {
        _org_id: orgId, _active: turningOn, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(turningOn ? "Abonnement activé" : "Abonnement suspendu"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  return (
    <DialogShell
      open={open} onClose={onClose}
      title={turningOn ? "Activer l'abonnement" : "Suspendre l'abonnement"}
      description={turningOn
        ? `L'atelier ${orgName ?? ""} passera en "active". L'accès complet sera rétabli.`
        : `L'atelier ${orgName ?? ""} passera en "trial_expired". L'accès sera bloqué au prochain chargement.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            variant={turningOn ? "default" : "destructive"}
            onClick={() => mutation.mutate()}
            disabled={reason.trim().length < 3 || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {turningOn ? "Activer" : "Suspendre"}
          </Button>
        </>
      }
    >
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Shop: Delete (typed confirmation)
// ─────────────────────────────────────────────────────────────
export function DeleteOrgDialog({
  open, onClose, orgId, orgName,
}: { open: boolean; onClose: () => void; orgId: string; orgName: string | null }) {
  const refresh = useAdminRefresh();
  const [confirmName, setConfirmName] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_delete_organization", {
        _org_id: orgId, _confirm_name: confirmName, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atelier supprimé");
      refresh();
      // Also close parent ShopDetailDialog — the org no longer exists
      onClose();
    },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  const valid = reason.trim().length >= 3 && confirmName.trim() === (orgName ?? "");

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Supprimer l'atelier définitivement"
      description="Cette action est irréversible. Toutes les données (utilisateurs, clients, réparations, factures) seront supprimées."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Supprimer définitivement
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Tapez exactement <b>{orgName ?? "(sans nom)"}</b> ci-dessous pour confirmer.</span>
      </div>
      <div className="space-y-1.5">
        <Label>Nom de l'atelier à taper</Label>
        <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={orgName ?? ""} />
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// User: Edit (full_name)
// ─────────────────────────────────────────────────────────────
export function EditUserDialog({
  open, onClose, user,
}: {
  open: boolean; onClose: () => void; user: { user_id: string; email: string; full_name: string | null };
}) {
  const refresh = useAdminRefresh();
  const [name, setName] = useState(user.full_name ?? "");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_update_user", {
        _user_id: user.user_id, _full_name: name, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Utilisateur modifié"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Modifier l'utilisateur"
      description={user.email}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={reason.trim().length < 3 || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label>Nom complet</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-[10px] text-muted-foreground">L'email ne peut pas être modifié ici.</p>
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// User: Change role
// ─────────────────────────────────────────────────────────────
export function ChangeRoleDialog({
  open, onClose, user, orgId, currentRole,
}: {
  open: boolean;
  onClose: () => void;
  user: { user_id: string; email: string };
  orgId: string;
  currentRole: string;
}) {
  const refresh = useAdminRefresh();
  const [role, setRole] = useState<"admin" | "technician">(currentRole === "admin" ? "technician" : "admin");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_change_user_role", {
        _user_id: user.user_id, _org_id: orgId, _new_role: role, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rôle modifié"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Changer le rôle"
      description={`${user.email} — rôle actuel : ${currentRole}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={reason.trim().length < 3 || mutation.isPending || role === currentRole}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label>Nouveau rôle</Label>
        <Select value={role} onValueChange={(v) => setRole(v as "admin" | "technician")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin (propriétaire)</SelectItem>
            <SelectItem value="technician">Technicien</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// User: Verify email
// ─────────────────────────────────────────────────────────────
export function VerifyEmailDialog({
  open, onClose, user,
}: { open: boolean; onClose: () => void; user: { user_id: string; email: string } }) {
  const refresh = useAdminRefresh();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_verify_user_email", {
        _user_id: user.user_id, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Email marqué comme vérifié"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Valider l'email manuellement"
      description={`Marquer ${user.email} comme vérifié sans envoyer de mail.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={reason.trim().length < 3 || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Valider
          </Button>
        </>
      }
    >
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// User: Reset password (edge function)
// ─────────────────────────────────────────────────────────────
export function ResetPasswordDialog({
  open, onClose, user,
}: { open: boolean; onClose: () => void; user: { user_id: string; email: string } }) {
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      const res = await fetch(
        "https://rkfkibpcrqkchmtoogxq.supabase.co/functions/v1/admin-reset-user-password",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user.user_id, reason: reason.trim() }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
    },
    onSuccess: () => { toast.success("Email de réinitialisation envoyé"); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Réinitialiser le mot de passe"
      description={`Un email sera envoyé à ${user.email} avec un lien de récupération.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={reason.trim().length < 3 || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Envoyer
          </Button>
        </>
      }
    >
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}

// ─────────────────────────────────────────────────────────────
// User: Delete (typed confirmation)
// ─────────────────────────────────────────────────────────────
export function DeleteUserDialog({
  open, onClose, user,
}: { open: boolean; onClose: () => void; user: { user_id: string; email: string } }) {
  const refresh = useAdminRefresh();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("admin_delete_user", {
        _user_id: user.user_id, _confirm_email: confirmEmail, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Utilisateur supprimé"); refresh(); onClose(); },
    onError: (e) => toast.error(friendlyErrorMessage(e)),
  });

  const valid = reason.trim().length >= 3 && confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <DialogShell
      open={open} onClose={onClose}
      title="Supprimer l'utilisateur définitivement"
      description="L'utilisateur, son profil et ses rôles seront supprimés. Action irréversible."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Supprimer
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Tapez exactement <b>{user.email}</b> ci-dessous pour confirmer.</span>
      </div>
      <div className="space-y-1.5">
        <Label>Email à taper</Label>
        <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user.email} />
      </div>
      <ReasonField value={reason} onChange={setReason} />
    </DialogShell>
  );
}
