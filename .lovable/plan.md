

## Plan — 2 ajustements au PDF de prise en charge

### Ajustement 1 : Regrouper la partie "prise en charge" proprement

**Problème actuel** : Les CGV et l'accord de confidentialité peuvent commencer en milieu/bas de page 1 et se couper sur la page 2, mélangeant le contenu.

**Solution** : Après la section SIGNATURE CLIENT (ligne ~1048), forcer un `doc.addPage()` systématique avant les CONDITIONS GÉNÉRALES. Ainsi :
- **Page 1** = Header, client, appareil, panne, état, estimation, signature (tout regroupé)
- **Page 2** = CGV, accord de confidentialité, photos (séparé proprement)

Rien d'autre ne change : mêmes textes, mêmes champs, même design.

**Fichier** : `src/lib/pdf.ts` (lignes ~1050-1076)
- Remplacer le `checkPage(10, currentY)` avant "CONDITIONS GÉNÉRALES" par un `newPage(); currentY = 14;` forcé.

---

### Ajustement 2 : Ajouter un QR code de suivi sur la page 1

**Données** : L'URL de suivi suit le format `https://bonoitec-pilot-pro.lovable.app/repair/{tracking_code}`. Le `tracking_code` est déjà disponible sur l'objet `repair`.

**Modifications** :

1. **`src/lib/pdf.ts`** :
   - Ajouter `trackingCode?: string` à l'interface `IntakePdfData` (ligne 755)
   - Après la section SIGNATURE et avant le saut de page forcé, ajouter un bloc QR code :
     - Générer le QR via `QRCode.toDataURL(trackingUrl)` (lib déjà importée ligne 3)
     - Dessiner un petit encadré avec le QR code (~24mm) + texte "Scannez pour suivre votre réparation" + code de suivi en texte
   - Le QR code n'apparaît que si `trackingCode` est fourni

2. **`src/components/dialogs/CreateRepairWizard.tsx`** (ligne ~432) :
   - Ajouter `trackingCode: createdRepair.tracking_code` dans les params passés à `generateIntakePDF`

3. **`src/components/dialogs/RepairDetailDialog.tsx`** (ligne ~452) :
   - Ajouter `trackingCode: repair.tracking_code` dans les params passés à `generateIntakePDF`

---

### Résumé des fichiers modifiés
- `src/lib/pdf.ts` — saut de page forcé + bloc QR code + champ `trackingCode`
- `src/components/dialogs/CreateRepairWizard.tsx` — passer `trackingCode`
- `src/components/dialogs/RepairDetailDialog.tsx` — passer `trackingCode`

Aucun changement de design, de texte, de champ ou de structure existante.

