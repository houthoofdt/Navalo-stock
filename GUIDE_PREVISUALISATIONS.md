# Guide des Prévisualisations - Où trouver les boutons

## 1. ✅ COMMANDES REÇUES (Objednávky přijaté)

**Emplacement :** Dans un **modal**

**Comment accéder :**
1. Cliquer sur l'onglet **"Objednávky přijaté"** (Cmd. reçues)
2. Cliquer sur le bouton **"+ Nová objednávka"**
3. Le modal s'ouvre avec le formulaire
4. Remplir les données
5. Le bouton **"👁️ Náhled"** se trouve entre "Zrušit" et "Uložit"

**Ligne HTML :** 1595

---

## 2. ✅ FACTURES REÇUES (Faktury přijaté)

**Emplacement :** Dans un **modal**

**Comment accéder :**
1. Cliquer sur l'onglet **"Faktury přijaté"** (Factures reçues)
2. Cliquer sur le bouton **"+ Nouvelle Facture"**
3. Le modal "Received Invoice" s'ouvre
4. Remplir les données (fournisseur, montants, etc.)
5. Le bouton **"👁️ Náhled"** se trouve entre "Annuler" et "Enregistrer"

**Ligne HTML :** 1044

---

## 3. ✅ RÉCEPTIONS DE STOCK (Příjemky)

**Emplacement :** **Directement visible** dans l'onglet

**Comment accéder :**
1. Cliquer sur l'onglet **"Příjemky"** (Entrées)
2. Le formulaire est déjà visible sur la page
3. Remplir le formulaire de réception (supplier, items, etc.)
4. Le bouton **"👁️ Náhled"** se trouve entre "Annuler" et "✓ Valider la réception"

**Ligne HTML :** 168

---

## Capture d'écran de l'emplacement des boutons

### Commandes Reçues & Factures Reçues (dans modals)
```
┌─────────────────────────────────────────────┐
│  Modal: Nouvelle Commande/Facture           │
├─────────────────────────────────────────────┤
│  [Formulaire avec champs...]                │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  [Annuler]  [👁️ Náhled]  [Enregistrer] │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Réceptions de Stock (directement sur la page)
```
┌─────────────────────────────────────────────┐
│  Onglet: Příjemky (Entrées)                 │
├─────────────────────────────────────────────┤
│  ✏️ Nouvelle réception                       │
│                                             │
│  [Formulaire: Bon#, Date, Fournisseur...]  │
│  [Items...]                                 │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  [Annuler]  [👁️ Náhled]  [✓ Valider]   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Vérification rapide

Ouvrez la console du navigateur (F12) et tapez:

```javascript
// Vérifier que les fonctions existent
console.log(typeof window.showReceivedOrderPreview);      // "function"
console.log(typeof window.showReceivedInvoicePreview);    // "function"
console.log(typeof window.showReceiptPreview);            // "function"

// Vérifier que les modals existent
console.log(!!document.getElementById('receivedOrderPreviewModal'));    // true
console.log(!!document.getElementById('receivedInvoicePreviewModal'));  // true
console.log(!!document.getElementById('receiptPreviewModal'));          // true
```

Si tous retournent les valeurs attendues, l'implémentation est correcte!

---

## Problème possible

Si vous ne voyez pas les boutons **"👁️ Náhled"**, vérifiez:

1. **Le fichier a bien été sauvegardé** - Rechargez la page (Ctrl+F5 ou Cmd+Shift+R)
2. **La console pour erreurs JavaScript** - Ouvrez F12 et regardez les erreurs
3. **Le cache du navigateur** - Videz le cache et rechargez

---

## Test manuel rapide

### Test 1: Factures reçues
```
1. Onglet "Faktury přijaté"
2. Bouton "+ Nouvelle Facture"
3. Modal s'ouvre
4. Cherchez le bouton "👁️ Náhled" en bas du formulaire
```

### Test 2: Réceptions
```
1. Onglet "Příjemky"
2. Le formulaire est déjà visible
3. Cherchez le bouton "👁️ Náhled" en bas du formulaire
   (entre "Annuler" et "✓ Valider la réception")
```

### Test 3: Commandes reçues
```
1. Onglet "Objednávky přijaté"
2. Bouton "+ Nová objednávka"
3. Modal s'ouvre
4. Cherchez le bouton "👁️ Náhled" en bas du formulaire
```
