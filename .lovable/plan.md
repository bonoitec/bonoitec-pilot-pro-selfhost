

## Diagnostic

### Problème 1 : L'app "bug" (flickering entre mur d'expiration et dashboard)
Quand tu supprimes et recrées le compte avec le même email, le trigger `handle_new_user` détecte que l'email a déjà utilisé l'essai gratuit via `trial_history`. Il crée donc l'organisation avec `subscription_status = 'trial_expired'`. 

Le hook `useTrialStatus` lit cette valeur de la DB immédiatement → affiche le mur "essai terminé". Puis `check-subscription` s'exécute, trouve l'abonnement Stripe actif, met à jour l'org en "active", et invalide le cache. Résultat : l'UI flicker entre "bloqué" et "débloqué".

### Problème 2 : `subscriptionEnd` toujours `null`
Les logs montrent clairement : `"subscriptionEnd":null,"cancelAtPeriodEnd":true`. Dans la version Stripe API `2025-08-27.basil`, `current_period_end` n'est peut-être plus un simple nombre Unix timestamp. Le check `typeof periodEndTs === "number"` échoue, donc `subscriptionEnd` reste `null`. Conséquence : le bandeau d'annulation ne s'affiche jamais car la condition `cancelAtPeriodEnd && subscriptionEnd` est fausse.

### Problème 3 : Abonnement actif après recréation de compte - normal ?
Oui, c'est **normal et correct**. L'abonnement Stripe est lié à l'email. Si l'email a un abonnement actif sur Stripe, il est retrouvé et l'org est mise à jour. Le problème n'est pas que l'abonnement apparaisse, c'est le flickering au chargement.

---

## Plan de corrections

### 1. Fix `check-subscription` - gestion robuste de `current_period_end`
Dans `supabase/functions/check-subscription/index.ts`, remplacer la conversion de date pour gérer tous les formats possibles (nombre, string, objet Date) :

```typescript
// Au lieu de vérifier typeof === "number" uniquement
const periodEndTs = subscription.current_period_end;
let parsedEnd: number | null = null;
if (typeof periodEndTs === "number") parsedEnd = periodEndTs;
else if (typeof periodEndTs === "string") parsedEnd = Math.floor(new Date(periodEndTs).getTime() / 1000);
if (parsedEnd && parsedEnd > 0) {
  subscriptionEnd = new Date(parsedEnd * 1000).toISOString();
}
```

### 2. Fix le flickering dans `useTrialStatus`
Modifier `useTrialStatus` pour qu'il intègre aussi l'état du hook `useSubscription`. Si `useSubscription` indique `subscribed = true` (même pendant que la DB est encore en "trial_expired"), ne pas considérer comme expiré.

Alternative plus simple : dans `AppLayout`, ne pas afficher le `TrialExpiredWall` tant que `useSubscription.isLoading` est encore `true`. Cela laisse le temps à `check-subscription` de s'exécuter avant de décider de bloquer.

### 3. Fichiers modifiés
- `supabase/functions/check-subscription/index.ts` : conversion de date robuste
- `src/components/AppLayout.tsx` : attendre que `useSubscription` ait terminé avant d'afficher le mur d'expiration
- `src/components/TrialBanner.tsx` : fallback si `subscriptionEnd` est null mais `cancelAtPeriodEnd` est true (afficher le bandeau sans date précise)

