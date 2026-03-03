# Plan Simplifié - Sous-Traitance avec Assemblage

## Objectif
Gérer l'envoi de composants à un sous-traitant pour assemblage et le retour des kits assemblés, avec suivi de localisation.

## Version MVP - Phase 1

### 1. BOM Simple (hardcodé)
```javascript
const ASSEMBLY_BOM = {
  'KIT-ASSEMBLÉ': [
    { ref: 'TH01', qty: 1, name: 'Composant 1' },
    { ref: 'TH02', qty: 1, name: 'Composant 2' }
  ]
};
```

### 2. Nouveau Tab: "Sous-Traitance"
- Liste des ordres de sous-traitance
- Bouton "+ Nouvel ordre"

### 3. Formulaire "Ordre de Sous-Traitance"
**Champs:**
- Numéro auto (ST-2026-001)
- Sous-traitant (select depuis contacts)
- Kit demandé (select: KIT-ASSEMBLÉ)
- Quantité
- Date limite
- Notes

**Auto-calculé:**
- Composants nécessaires (depuis BOM)
- Composants disponibles (depuis stock)
- Statut:
  - 🟡 En attente (0% livré)
  - 🔵 En cours (1-99% livré)
  - 🟢 Terminé (100% livré)

### 4. Actions sur un Ordre

#### Action 1: "📦 Transférer composants"
- Crée un BL spécial marqué "TRANSFERT SOUS-TRAITANCE"
- Dans les notes: "Ordre ST-2026-001 - Composants pour 30 kits"
- **Important:** Ajoute une propriété `isSubcontractorTransfer: true`
- Stock physique: -X (sortie normale)
- Stock "virtuel chez sous-traitant": +X (noté dans l'ordre)

#### Action 2: "📥 Recevoir kits assemblés"
- Crée une Réception normale
- Kits assemblés: +X
- Met à jour le statut de l'ordre
- Dans les notes: "Ordre ST-2026-001 - Retour 30 kits"

### 5. Tableau de bord Ordre
```
Ordre: ST-2026-001
Kit: KIT-ASSEMBLÉ x 100
Sous-traitant: ACME Assemblage

Composants nécessaires (total):
  TH01: 100 pcs
  TH02: 100 pcs

Composants transférés:
  TH01: 30 pcs (BL-2026-050) ✓
  TH02: 30 pcs (BL-2026-050) ✓

Kits reçus: 30/100 (30%)

Actions disponibles:
  [📦 Transférer composants] [📥 Recevoir kits]
```

## Fichiers à modifier

1. **index.html**
   - Ajouter tab "Sous-Traitance"
   - Ajouter modal "Ordre de Sous-Traitance"
   - Ajouter tableau des ordres

2. **app.js**
   - Ajouter ASSEMBLY_BOM constant
   - Ajouter fonctions gestion ordres
   - Modifier BL pour supporter flag `isSubcontractorTransfer`
   - Ajouter tracking dans les ordres

3. **data.js**
   - Ajouter storage.getSubcontractingOrders()
   - Ajouter storage.saveSubcontractingOrder()

## Avantages Version Simple

✅ Pas de modification majeure du stock existant
✅ Utilise BL et Réceptions existants
✅ Tracking manuel mais clair
✅ Peut tester le concept rapidement
✅ Facile à étendre plus tard

## Limitations Acceptées (pour MVP)

⚠️ BOM hardcodé (1 seul type de kit)
⚠️ Pas de vraie localisation dans le stock
⚠️ Tracking manuel via notes et références
⚠️ Un seul sous-traitant à la fois

## Extensions Futures (Phase 2)

- BOM configurables
- Vraie localisation de stock
- Multi-sous-traitants
- Calcul automatique des coûts
- Historique complet
