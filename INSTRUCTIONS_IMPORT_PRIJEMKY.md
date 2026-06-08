# Instructions: Importer les Prijemky dans l'Historique

## Vue d'ensemble

Pour résoudre les 159 discordances trouvées lors de l'audit du stock, vous devez importer les données de réception (Prijemky) dans la feuille Historique comme mouvements d'ENTREE.

## Étapes à suivre

### 1. Créer la feuille Prijemky dans Google Sheets

1. Ouvrez votre fichier Google Sheets Navalo-stock
2. Créez une nouvelle feuille et nommez-la exactement: **Prijemky**
3. Créez les en-têtes suivants dans la première ligne (colonnes A à I):

   | A  | B    | C            | D          | E           | F      | G      | H         | I     |
   |----|------|--------------|------------|-------------|--------|--------|-----------|-------|
   | ID | Date | N° Příjemky  | Dodavatel  | Nb Articles | Valeur | Devise | Obj. liée | Items |

### 2. Coller les données des réceptions

Copiez et collez toutes vos données de réception (PŘ2026001 à PŘ2026065) dans cette feuille, en commençant à la ligne 2.

**Format attendu pour la colonne Items (colonne I):**
```json
[{"ref":"PE3300-16-06","qty":100,"price":61},{"ref":"PE3300-22","qty":20,"price":180}]
```

**Exemple de ligne complète:**
```
1 | 2026-01-28 | PŘ2026001 | Pioneer | 2 | 12.300,00 | EUR | OP2026002 | [{"ref":"PE3300-16-06","qty":100,"price":61},{"ref":"PE3300-22","qty":20,"price":180}]
```

### 3. Exécuter la fonction d'import

1. Dans Google Sheets, allez dans **Extensions > Apps Script**
2. Dans l'éditeur de script, trouvez la fonction: `etape3_ImporterEtAuditer`
3. Sélectionnez cette fonction dans la liste déroulante en haut
4. Cliquez sur le bouton **Exécuter** ▶️
5. Si demandé, autorisez les permissions nécessaires

### 4. Vérifier les résultats

Après l'exécution, consultez les logs (Affichage > Journaux ou View > Logs):

**Ce que la fonction fait:**

1. **Import des Prijemky:**
   - Lit toutes les lignes de la feuille Prijemky
   - Parse le JSON de la colonne Items
   - Convertit les prix EUR en CZK selon le taux de change du jour
   - Crée une ligne ENTREE dans Historique pour chaque article

2. **Audit automatique:**
   - Recalcule le stock basé sur Stock Initial + ENTREES - SORTIES
   - Compare avec le stock actuel
   - Affiche les discordances restantes

**Résultat attendu:**
```
SUCCESS: 65 receipts processed, 150+ items added to Historique
AUDIT RESULTS:
  Movements analyzed: 1300+
  DISCREPANCIES: 0 (ou beaucoup moins que 159)
```

## Structure des données créées dans Historique

Pour chaque article de chaque réception, une ligne sera ajoutée:

| Date       | Type   | N° Doc    | Référence    | Désignation | Quantité | Prix Unit CZK | Valeur CZK | Partenaire |
|------------|--------|-----------|--------------|-------------|----------|---------------|------------|------------|
| 2026-01-28 | ENTREE | PŘ2026001 | PE3300-16-06 | ...         | 100      | 1525.00       | 152500.00  | Pioneer    |
| 2026-01-28 | ENTREE | PŘ2026001 | PE3300-22    | ...         | 20       | 4500.00       | 90000.00   | Pioneer    |

## Conversion des devises

- **EUR → CZK:** Utilise le taux de change du jour de la réception (récupéré via getExchangeRateForDate)
- **CZK:** Pas de conversion, prix utilisé directement
- Si le taux n'est pas disponible, utilise 25.0 par défaut

## En cas d'erreur

Si des erreurs apparaissent dans les logs:
- Vérifiez le format JSON de la colonne Items
- Vérifiez que les dates sont au format date (pas texte)
- Vérifiez que les références d'articles existent dans Stock
- Les erreurs sont listées mais n'arrêtent pas l'import

## Après l'import réussi

Si l'audit montre encore des discordances acceptables (< 5-10 articles):
- Vous pouvez exécuter `etape2_CorrigerStock(true)` pour forcer la correction
- Cela alignera le Stock sur les valeurs calculées depuis l'Historique

Si l'audit montre 0 discordances:
- ✓ Votre stock est maintenant cohérent avec l'historique!
- Les opérations FIFO futures fonctionneront correctement

## Notes importantes

- Cette fonction **ajoute** des entrées à l'Historique, elle ne les supprime pas
- Si vous exécutez la fonction plusieurs fois, vous aurez des doublons
- En cas de besoin de réimport: supprimez d'abord les lignes ENTREE avec N° Doc = PŘ2026xxx

## Fonctions disponibles

- `etape1_VerifierStock()` - Audit seul sans correction
- `etape2_CorrigerStock(true)` - Forcer la correction du stock selon l'historique
- `etape3_ImporterEtAuditer()` - Import Prijemky + Audit automatique
- `initialiserStockInitial()` - Initialiser le stock du 31.12.2025 (déjà fait)
