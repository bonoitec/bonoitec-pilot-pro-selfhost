

## Plan: Ajouter trackingUrl dans les emails + email a la creation

### Probleme actuel
- Les templates `status_update` et `repair_completed` supportent deja `trackingUrl` dans le HTML, mais le frontend ne l'envoie jamais dans `data`
- Aucun email n'est envoye lors de la creation d'une reparation

### Corrections

#### 1. Nouveau template `repair_created` dans l'Edge Function `send-email`
Ajout d'un template dedie avec le lien de suivi, la reference et l'appareil.

#### 2. `src/pages/Repairs.tsx` — Ajouter `trackingUrl` dans les emails de changement de statut
Ligne ~63 : ajouter `trackingUrl: \`https://bonoitec-pilot-pro.lovable.app/repair/\${repair.tracking_code}\`` dans l'objet `data`.

#### 3. `src/components/messaging/StatusNotificationSuggester.tsx` — Ajouter `trackingUrl`
Ligne ~77 : meme ajout du `trackingUrl` dans l'objet `data`.

#### 4. `src/components/dialogs/CreateRepairWizard.tsx` — Envoyer un email a la creation
Apres la creation reussie (dans `onSuccess`), si le client a un email, envoyer un email `repair_created` avec le lien de suivi.

#### 5. Redeployer l'Edge Function `send-email`

### Fichiers modifies

| Fichier | Changement |
|---|---|
| `supabase/functions/send-email/index.ts` | Nouveau template `repair_created` |
| `src/pages/Repairs.tsx` | Ajout `trackingUrl` dans data |
| `src/components/messaging/StatusNotificationSuggester.tsx` | Ajout `trackingUrl` dans data |
| `src/components/dialogs/CreateRepairWizard.tsx` | Email automatique apres creation |

