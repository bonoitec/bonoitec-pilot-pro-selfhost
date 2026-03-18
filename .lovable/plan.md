

## Problème identifié

Dans `check-subscription/index.ts`, quand Stripe ne trouve aucun abonnement actif (lignes 109-111), la fonction log "No active subscription found" mais **ne met pas à jour l'organisation en DB**. Le `subscription_status` reste `"active"` indéfiniment.

Le hook `useTrialStatus` lit ce statut depuis `get_org_safe_data()` et considère `"active"` = abonné = accès total.

## Correction

### 1. Edge Function `check-subscription` — ajouter la mise à jour DB quand pas d'abonnement actif

Dans le bloc `else` (ligne 109), après le log, récupérer le profil de l'utilisateur et mettre à jour l'organisation :

```typescript
} else {
  logStep("No active subscription found");
  
  // Update org to reflect cancelled/expired subscription
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("organization_id")
    .eq("user_id", userId)
    .single();

  if (profile?.organization_id) {
    // Only downgrade if currently "active" (don't touch trial users)
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("subscription_status")
      .eq("id", profile.organization_id)
      .single();

    if (org?.subscription_status === "active") {
      await supabaseClient
        .from("organizations")
        .update({
          subscription_status: "trial_expired",
          plan_name: null,
        })
        .eq("id", profile.organization_id);
      logStep("Organization downgraded to expired", { orgId: profile.organization_id });
    }
  }
}
```

### 2. Hook `useTrialStatus` — aucun changement nécessaire

Le hook gère déjà `trial_expired` → `isExpired = true` → le `TrialExpiredWall` s'affiche. La correction précédente couvre ce cas.

### Résultat attendu

- Client avec abonnement actif → accès normal ✅
- Client qui annule, période restante pas finie → Stripe dit `active` → accès maintenu ✅  
- Client qui annule, période finie → Stripe dit pas d'abonnement → DB passe à `trial_expired` → mur de paiement affiché ✅
- Utilisateur en essai gratuit → pas touché (statut `trial`, pas `active`) ✅

### Fichier modifié
- `supabase/functions/check-subscription/index.ts` (bloc else lignes 109-111)

