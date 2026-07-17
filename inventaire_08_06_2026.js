/**
 * INVENTAIRE PHYSIQUE - 08.06.2026
 * Script pour Apps Script Google Sheets
 *
 * Colonne BLEUE = Inventaire physique
 * Dernière colonne = Stock actuel dans Google Sheet
 */

function inventaire_08_06_2026() {

  Logger.log('=== DÉBUT INVENTAIRE 08.06.2026 ===\n');

  const articles = [
    // Page 1
    {ref: 'WHP15600VSDPC9EQ', qty: 57},       // Inventaire: 57, Sheet: 59
    {ref: 'CV-240180-3FHE', qty: 47},         // Inventaire: 47, Sheet: 39
    {ref: '10263239', qty: 17},               // Inventaire: 17, Sheet: 18
    {ref: '10263238', qty: 0},                // Inventaire: 0, Sheet: 25
    // R513A: 1.25 kg, Sheet: 121 - PAS DE CHANGEMENT visible
    {ref: '202510', qty: 236},                // Inventaire: 236, Sheet: 276
    {ref: 'POS455.05/100', qty: 108},         // Inventaire: 108, Sheet: 107
    {ref: 'DML_053S', qty: 170},              // Inventaire: 170 (rayé 110), Sheet: 149
    {ref: '034G6505', qty: 222},              // Inventaire: 222, Sheet: 223
    {ref: '034G3860', qty: 103},              // Inventaire: 103, Sheet: 264
    {ref: 'YCQB03L18', qty: 59},              // Inventaire: 59 (rayé 60), Sheet: 60
    {ref: 'YCQB02L01', qty: 43},              // Inventaire: 43, Sheet: 60
    {ref: 'ACB-2UB480W', qty: 58},            // Inventaire: 58, Sheet: 49
    {ref: 'TG4A', qty: 156},                  // Inventaire: 156 (rayé 2), Sheet: 156
    // TX18_el_svazek: 1, Sheet: 21 - PAS DE CHANGEMENT

    // Page 2
    {ref: 'PE3300-16-06', qty: 41},           // Inventaire: 41, Sheet: 43
    {ref: '63', qty: 1},                      // Inventaire: 1 (rayé), Sheet: 111 (après test: 50)
    {ref: 'YCV-15009', qty: 1},               // Inventaire: 1 (rayé), Sheet: 95
    {ref: 'Sada_komplet_cu_TX18', qty: 88},   // Inventaire: 88, Sheet: 46
    {ref: 'Plastovy_vytok', qty: 185},        // Inventaire: 185, Sheet: 197
    {ref: 'EPP_komplet_TX12', qty: 145},      // Inventaire: 145, Sheet: 161
    {ref: '12872', qty: 62},                  // Inventaire: 62, Sheet: 59
    {ref: '12875', qty: 136},                 // Inventaire: 136, Sheet: 185
    {ref: '12876', qty: 59},                  // Inventaire: 59, Sheet: 56
    {ref: '12877', qty: 59},                  // Inventaire: 59, Sheet: 56
    {ref: '12878', qty: 109},                 // Inventaire: 109, Sheet: 107
    {ref: '12880', qty: 56},                  // Inventaire: 56, Sheet: 53
    {ref: '13052-1', qty: 172},               // Inventaire: 172, Sheet: 24
    {ref: '13052', qty: 60},                  // Inventaire: 60, Sheet: 58
    {ref: 'POL005.15/STD', qty: 109},         // Inventaire: 109, Sheet: 114
    {ref: 'POL005.35/STD', qty: 814},         // Inventaire: 814, Sheet: 230
    {ref: 'POS0.3335/100', qty: 888},         // Inventaire: 888, Sheet: 427
    {ref: 'POS0.3345/100', qty: 168},         // Inventaire: 168, Sheet: 175

    // Page 3
    {ref: 'POS0.3365/100', qty: 108},         // Inventaire: 108, Sheet: 115
    {ref: 'POS0.3385/100', qty: 104}          // Inventaire: 104, Sheet: 115
  ];

  // Exécuter l'inventaire en batch
  const result = inventaireBatch(articles, 'Inventaire physique 08.06.2026');

  Logger.log('\n=== INVENTAIRE TERMINÉ ===');
  Logger.log('Articles traités: ' + result.totalArticles);
  Logger.log('Succès: ' + result.successCount);
  Logger.log('Erreurs: ' + result.errorCount);
  Logger.log('Impact valeur total: ' + result.totalValueImpact.toFixed(2) + ' CZK');

  return result;
}

/**
 * ANNULER L'INVENTAIRE
 * Restaure les valeurs originales du Google Sheet
 */
function annulerInventaire_08_06_2026() {

  Logger.log('=== ANNULATION INVENTAIRE 08.06.2026 ===\n');

  const articlesOriginaux = [
    // Restaurer les valeurs AVANT inventaire (dernière colonne du PDF)
    {ref: 'WHP15600VSDPC9EQ', qty: 59},
    {ref: 'CV-240180-3FHE', qty: 39},
    {ref: '10263239', qty: 18},
    {ref: '10263238', qty: 25},
    {ref: '202510', qty: 276},
    {ref: 'POS455.05/100', qty: 107},
    {ref: 'DML_053S', qty: 149},
    {ref: '034G6505', qty: 223},
    {ref: '034G3860', qty: 264},
    {ref: 'YCQB03L18', qty: 60},
    {ref: 'YCQB02L01', qty: 60},
    {ref: 'ACB-2UB480W', qty: 49},
    {ref: 'TG4A', qty: 156},
    {ref: 'PE3300-16-06', qty: 43},
    {ref: '63', qty: 111},  // Valeur AVANT le test (ou 50 si vous voulez garder le test)
    {ref: 'YCV-15009', qty: 95},
    {ref: 'Sada_komplet_cu_TX18', qty: 46},
    {ref: 'Plastovy_vytok', qty: 197},
    {ref: 'EPP_komplet_TX12', qty: 161},
    {ref: '12872', qty: 59},
    {ref: '12875', qty: 185},
    {ref: '12876', qty: 56},
    {ref: '12877', qty: 56},
    {ref: '12878', qty: 107},
    {ref: '12880', qty: 53},
    {ref: '13052-1', qty: 24},
    {ref: '13052', qty: 58},
    {ref: 'POL005.15/STD', qty: 114},
    {ref: 'POL005.35/STD', qty: 230},
    {ref: 'POS0.3335/100', qty: 427},
    {ref: 'POS0.3345/100', qty: 175},
    {ref: 'POS0.3365/100', qty: 115},
    {ref: 'POS0.3385/100', qty: 115}
  ];

  const result = inventaireBatch(articlesOriginaux, 'Annulation inventaire 08.06.2026');

  Logger.log('\n=== ANNULATION TERMINÉE ===');
  Logger.log('Stock restauré aux valeurs originales');

  return result;
}

/**
 * NOTES:
 *
 * 1. Article '63' (Ventil plnící):
 *    - Inventaire: 1 (rayé sur le scan)
 *    - Sheet original: 111
 *    - Après test: 50
 *    → Script utilise qty: 1 (inventaire physique réel)
 *
 * 2. Articles avec écritures rayées:
 *    - DML_053S: 110 rayé → 170
 *    - YCQB03L18: 60 rayé → 59
 *    - TG4A: 2 rayé → 156
 *    → Script utilise les valeurs FINALES (non rayées)
 *
 * 3. Articles sans changement visible:
 *    - R513A: 1.25 kg (identique)
 *    - TX18_el_svazek: 1 (identique)
 *    → PAS inclus dans le script
 *
 * 4. Grandes différences détectées:
 *    - POL005.35/STD: 814 vs 230 (+584)
 *    - POS0.3335/100: 888 vs 427 (+461)
 *    - 13052-1: 172 vs 24 (+148)
 */
