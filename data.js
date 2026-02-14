/* ========================================
   NAVALO Stock PAC - Data Module
   Stock réel au 12/01/2026
   ======================================== */

// Prix d'achat des composants (EUR sauf indication contraire)
// Ces prix sont utilisés pour auto-remplir les commandes
// Mis à jour le 12/01/2026 d'après les listes de prix NAVALO
const COMPONENT_PRICES = {
    // === HP13-18 / TX12-18 Components ===
    'WHP15600VSDPC9EQ': { eur: 166.00, czk: null },      // Kompresor Highly TX12-18
    'PE3300-16-06': { eur: 62.00, czk: null },           // EMI Filter Pioneer
    'CV-240180-3FHE': { eur: 275.00, czk: null },        // Driver Invertek 3ph
    '10263239': { eur: 238.00, czk: null },              // Evaporator HTS
    '10263238': { eur: 150.50, czk: null },              // Condenser HTS
    'R513A': { eur: 45.23, czk: null },                  // Refrigerant Chemours /kg
    'POS455': { eur: 120.00, czk: null },                // Control board Siemens
    'DML_053S': { eur: 4.32, czk: null },                // Filter drier Danfoss
    'YCV-15009': { eur: 8.24, czk: null },               // Check valve Sanhua
    '034G6505': { eur: 16.27, czk: null },               // Electric expansion valve ETS5
    'YCQB03L18': { eur: 19.45, czk: null },              // High pressure sensor
    'YCQB02L01': { eur: 18.16, czk: null },              // Low pressure sensor
    'ACB-2UB480W': { eur: 7.00, czk: null },             // High pressure switch
    '00063': { eur: 1.34, czk: null },                   // Schraeder valve / Ventil plnící
    'TG4A': { eur: 3.95, czk: null },                    // Temperature sensor Sensit TGLD-40
    '42816-0512': { eur: 10.00, czk: null },             // Connector Mini-Fit
    'isolation_line': { eur: 0.60, czk: null },          // Isolation line Stovkis
    'connexion_terre_comp': { eur: 1.00, czk: null },    // Connexion terre compressor
    'connexion_terre': { eur: 1.50, czk: null },         // Connexion terre
    '2YSLCYK-J_4G2.5': { eur: 2.50, czk: null },         // Cable compressor BOHM
    
    // === TX9 Components ===
    'WHP05100BSV': { eur: 100.10, czk: null },           // Kompresor Highly TX9
    'WHP05100VUX': { eur: 100.10, czk: null },           // Kompresor Highly TX9 (náhrada)
    '00062_LP_0.7/1.7': { eur: 7.60, czk: null },        // Presostat LP
    '00062_HP_26': { eur: 8.00, czk: null },             // Presostat HP
    '01789': { eur: 12.00, czk: null },                  // Ventil elektromagnet. ALKO
    '801033': { eur: 7.80, czk: null },                  // Cívka elektromagnet. 24V ESC
    '0712174': { eur: 1.60, czk: null },                 // Koncovka svorkovnice
    'B5THx16/1P-SC-M': { eur: 41.30, czk: null },        // Swep B5THx16/1P-SC-M
    '068U2215': { eur: 36.50, czk: null },               // Ventil expanzní TUAE
    'WVFX_10': { eur: 56.20, czk: null },                // Ventil vodní 3/8"
    '04878_AE': { eur: 123.20, czk: null },              // Výparník 800.48/00-0000:00 AA
    '04879_AG': { eur: 97.00, czk: null },               // Kondenzátor 800.48/01-0000:00 AB
    '068U1036': { eur: 9.20, czk: null },                // Tryska k TUAE ventilu
    '060-017166': { eur: 5.10, czk: null },              // Kapilára pro WVFX
    '571903': { eur: 5.00, czk: null },                  // Difuzor TX9HP
    'vsuvka_mosaz_3/8_3/4': { eur: 0.90, czk: null },    // Vsuvka mosazná
    'pas_upinaci_2,5_25mm': { eur: 1.70, czk: null },    // Upínací pás
    '10060': { eur: 0.20, czk: null },                   // Distanční sloupek Highly
    'EPP_SADA_TX9': { eur: 62.10, czk: null },           // Opláštění sada TX9
    '11547_HYDRA': { eur: 6.80, czk: null },             // Capacitátor Hydra
    'R134a': { eur: 13.10, czk: null },                  // Chladivo R134a /kg
    'TX9_kabel_svazek': { eur: 23.00, czk: null },       // Sada kabelových svazků TX9
    
    // === TX9 Tôlerie ===
    'R05092_AlMg3_2mm_A-06': { eur: 4.10, czk: null },   // Držák deskového výměníku
    'R05493_AlMg3_1.5mm_A-02': { eur: 44.10, czk: null },// Deska základová TX9
    'R05494_AlMg3_3mm_A-03': { eur: 3.30, czk: null },   // Držák TX9
    'R05495_AlMg3_1.5mm_A-02': { eur: 2.50, czk: null }, // Plech krycí náběhový
    'R10023_AlMg3_1.5mm': { eur: 9.80, czk: null },      // Klec ventilátoru RH25V
    '11778_n': { eur: 5.10, czk: null },                 // Plech vypouštěcí DN18
    '11779_n': { eur: 1.10, czk: null },                 // Plech protikus
    'R11892_AlMg3_2mm_A-02': { eur: 4.00, czk: null },   // Plech vodící TX9
    '10052_n_A-04': { eur: 3.20, czk: null },            // Plech krycí vypouštěcí
    'R11780_AlMg3_1mm_A-04': { eur: 4.90, czk: null },   // Kryt kondenzátor Hydra
    'R11869_AlMg3_1mm_A-04': { eur: 0.80, czk: null },   // Krytka prostupu kabelů
    
    // === TX9 Tuyauterie Cu ===
    '05393': { eur: 86.10, czk: null },                  // Cu tr 10 z kondenzátoru
    '05095': { eur: 5.00, czk: null },                   // Cu tr. 12 z ekonomizéru
    '05101': { eur: 5.00, czk: null },                   // Cu tr 12 z exp. ventilu
    '01503': { eur: 3.00, czk: null },                   // Cu tr. 6 propojka MOP
    '05107': { eur: 4.50, czk: null },                   // Cu tr. 10 z filtru
    '12196_1': { eur: 5.00, czk: null },                 // Cu tr. 10 vytl. z kompresoru
    '12196_2': { eur: 5.00, czk: null },                 // Cu tr. 10 vytl. z ZK
    '12196_3': { eur: 3.50, czk: null },                 // Propojka bypass 1
    '12196_4': { eur: 3.50, czk: null },                 // Propojka bypass 2
    '12196_5': { eur: 2.50, czk: null },                 // Cu tr. 6 plnící HP
    '12197_1': { eur: 5.00, czk: null },                 // Cu tr. 12 z výparníku
    '12197_2': { eur: 2.50, czk: null },                 // Cu tr. 6 plnící LP
    '05111': { eur: 6.00, czk: null },                   // Sestava tr. z výměníku
    '05109': { eur: 5.00, czk: null },                   // Sestava Cu tr. dochlazování
    '05164': { eur: 5.50, czk: null },                   // Sestava Cu tr.18 vodní
    '12196': { eur: 9.00, czk: null },                   // Sestava vytl. tr.
    '12197': { eur: 8.50, czk: null },                   // Sestava sání
    '12247': { eur: 7.50, czk: null },                   // Sestava TUAE ventilu
    
    // === T9/T11 Specific (prix mis à jour 01/2026) ===
    'C-SBS120H38A': { eur: 160.00, czk: null },          // Kompresor Sanyo C-SBS120H38A
    'C-SBN263H5A': { eur: 110.00, czk: null },           // Kompresor Sanyo 3x230V
    'TGEN2,5_134': { eur: 49.00, czk: null },            // Ventil expanzní TGEN2.5/R134a Danfoss 067N5192
    '03998_AB': { eur: 183.00, czk: null },              // Výparník sušička BPA02AH21
    '03999_AB': { eur: 157.00, czk: null },              // Kondenzátor sušička BPA12AH22
    '6.04726.0000': { eur: 9.10, czk: null },            // Filtr Emerson FDB 084S dehydrátor jednosměrný
    '6.04677.0000': { eur: 8.10, czk: null },            // Průhledítko Sanhua 12mm SYJ-42025
    '4715136': { eur: 32.10, czk: null },                // Presostat HP s pájecí trubičkou PS1-A5L
    '00170': { eur: 0.20, czk: null },                   // Pryžová podložka pod sběrač
    '04451_B': { eur: 74.30, czk: null },                // Chladič sušička
    '01413': { eur: 68.70, czk: null },                  // Sběrač chladiva 1,6l
    '03488': { eur: 4.00, czk: null },                   // Cu tr.D15/1mm z TEV
    '03610': { eur: 4.50, czk: null },                   // Cu tr.D12/1mm z kompresoru
    '01783': { eur: 3.00, czk: null },                   // Cu tr.D12/1mm propojka
    '03620': { eur: 3.50, czk: null },                   // Cu tr.D12/1mm z filtru
    '03621': { eur: 3.50, czk: null },                   // Cu tr.D12/1mm z průhledítka
    '03492': { eur: 2.50, czk: null },                   // Cu tr.D6/1mm z TEV
    '03613': { eur: 5.00, czk: null },                   // Cu tr.D16/1mm z kondenzátoru
    '03649': { eur: 5.00, czk: null },                   // Cu tr.D16/1mm z tr.v.č.03648
    'N00381': { eur: 6.00, czk: null },                  // Cu tr.D18/1mm z výparníku
    'Sada_komplet_Cu': { eur: 45.00, czk: null },        // Kompletní sada Cu T9/T11
    'Sada_komplet_cu_TX18': { eur: 55.00, czk: null },   // Sada trubky TX12-18
    
    // === Autres ===
    'CV-220200-1FHP': { eur: 250.00, czk: null },        // Driver Invertek 1ph (estimé)
    'PE2300-25-06': { eur: 55.00, czk: null },           // EMI filtr 1ph (estimé)
    '034G3860': { eur: 8.50, czk: null },                // Cívka expanzního ventilu
    'MDF3H02': { eur: 10.00, czk: null },                // Ventil elektromagnet. 6mm
    'HQ1K11': { eur: 5.00, czk: null },                  // Cívka 24V 50Hz
    '12384': { eur: 85.00, czk: null },                  // Ventilátor BL-B250B-EC-07
    'R00513': { eur: 75.00, czk: null },                 // Ventilátor RH25V
    '1111111111': { eur: 1.50, czk: null },              // Sloupek TX12-18
    'TX12_el_svazek': { eur: 28.00, czk: null },         // El. svazek TX12-18
    'Plastovy_vytok': { eur: 2.50, czk: null },          // Plastový výtok
    'EPP_komplet_TX12': { eur: 75.00, czk: null },       // EPP TX12-18
    'Repas': { eur: 15.00, czk: null },                  // Sada na repasy
    '17C1961619': { eur: 65.00, czk: null },             // Zilmet plates
};

// Fonction pour obtenir le prix d'un composant
// Priorité: 1) Prix chargés depuis Google Sheets  2) Prix statiques
function getComponentPrice(ref, currency) {
    // Normalize reference for comparison
    const normalizedRef = String(ref || '').trim();

    // First check if we have loaded prices from Google Sheets
    if (typeof loadedComponentPrices !== 'undefined' && loadedComponentPrices[normalizedRef]) {
        const loaded = loadedComponentPrices[normalizedRef];
        let price = null;
        if (currency === 'EUR') {
            // Check for EUR price - accept any positive number
            price = (typeof loaded.eur === 'number' && loaded.eur > 0) ? loaded.eur : null;
        } else if (currency === 'CZK') {
            // Check for CZK price
            price = (typeof loaded.czk === 'number' && loaded.czk > 0) ? loaded.czk : null;
        } else {
            // Try EUR first, then CZK
            if (typeof loaded.eur === 'number' && loaded.eur > 0) {
                price = loaded.eur;
            } else if (typeof loaded.czk === 'number' && loaded.czk > 0) {
                price = loaded.czk;
            }
        }
        if (price !== null) {
            return parseFloat(price);
        }
        // If loaded but no valid price, fall through to static prices
    }

    // Fallback to static prices
    const prices = COMPONENT_PRICES[normalizedRef] || COMPONENT_PRICES[ref];
    if (!prices) return null;

    let price = null;
    if (currency === 'EUR') {
        price = (typeof prices.eur === 'number' && prices.eur > 0) ? prices.eur : null;
    } else if (currency === 'CZK') {
        price = (typeof prices.czk === 'number' && prices.czk > 0) ? prices.czk : null;
    } else {
        if (typeof prices.eur === 'number' && prices.eur > 0) {
            price = prices.eur;
        } else if (typeof prices.czk === 'number' && prices.czk > 0) {
            price = prices.czk;
        }
    }
    return price !== null ? parseFloat(price) : null;
}

// Stock initial avec quantités réelles
const INITIAL_STOCK = {
    // === TX12-18 Components ===
    'WHP15600VSDPC9EQ': { ref: 'WHP15600VSDPC9EQ', name: 'Kompresor WHP15600VSDPC9EQ', category: 'refrigeration', manufacturer: 'Highly', qty: 29, min: 10 },
    'CV-240180-3FHE': { ref: 'CV-240180-3FHE', name: 'Driver Invertek CV-240180-3FHE', category: 'electrique', manufacturer: 'Invertek', qty: 32, min: 10 },
    'CV-220200-1FHP': { ref: 'CV-220200-1FHP', name: 'Driver Invertek CV-220200-1FHP (1ph)', category: 'electrique', manufacturer: 'Invertek', qty: 0, min: 10 },
    '10263239': { ref: '10263239', name: 'Výparník LU-VE', category: 'echangeur', manufacturer: 'LU-VE', qty: 51, min: 10 },
    '10263238': { ref: '10263238', name: 'Kondenzátor LU-VE', category: 'echangeur', manufacturer: 'LU-VE', qty: 60, min: 10 },
    'R513A': { ref: 'R513A', name: 'Chladivo R513A (kg)', category: 'refrigeration', manufacturer: '', qty: 109, min: 20 },
    '1111111111': { ref: '1111111111', name: 'Sloupek pro TX12-18', category: 'mecanique', manufacturer: 'Navalo', qty: 147, min: 30 },
    'POS455': { ref: 'POS455', name: 'Climatix POS455', category: 'electronique', manufacturer: 'Siemens', qty: 53, min: 10 },
    '034G6505': { ref: '034G6505', name: 'Expanzní ventil ETS 5M35L', category: 'refrigeration', manufacturer: 'Danfoss', qty: 44, min: 10 },
    '034G3860': { ref: '034G3860', name: 'Cívka expanzního ventilu - 1m', category: 'refrigeration', manufacturer: 'Danfoss', qty: 34, min: 10 },
    'YCQB03L18': { ref: 'YCQB03L18', name: 'Vysokotlaké čidlo (HP sensor)', category: 'electronique', manufacturer: 'Sanhua', qty: 83, min: 15 },
    'YCQB02L01': { ref: 'YCQB02L01', name: 'Nízkotlaké čidlo (LP sensor)', category: 'electronique', manufacturer: 'Sanhua', qty: 83, min: 15 },
    'ACB-2UB480W': { ref: 'ACB-2UB480W', name: 'HP presostat', category: 'refrigeration', manufacturer: 'Danfoss', qty: 121, min: 15 },
    'TG4A': { ref: 'TG4A', name: 'Teplotní čidlo NTC10k', category: 'electronique', manufacturer: 'Sensit', qty: 101, min: 20 },
    'TX12_el_svazek': { ref: 'TX12_el_svazek', name: 'El. svazek TX12-18', category: 'electrique', manufacturer: 'Navalo', qty: 1, min: 10 },
    'Sada_komplet_cu_TX18': { ref: 'Sada_komplet_cu_TX18', name: 'Sada trubky TX12-18', category: 'tuyauterie', manufacturer: 'Navalo', qty: 46, min: 10 },
    'Plastovy_vytok': { ref: 'Plastovy_vytok', name: 'Plastový výtok', category: 'autre', manufacturer: '', qty: 69, min: 15 },
    'PE3300-16-06': { ref: 'PE3300-16-06', name: 'PE3300-16-06 - EMI filtr 3ph', category: 'electrique', manufacturer: 'Pioneer', qty: 0, min: 10 },
    'PE2300-25-06': { ref: 'PE2300-25-06', name: 'PE2300-25-06 - EMI filtr 1ph', category: 'electrique', manufacturer: 'Pioneer', qty: 0, min: 10 },
    'EPP_komplet_TX12': { ref: 'EPP_komplet_TX12', name: 'EPP TX12-18', category: 'epp', manufacturer: 'JSP/ARPRO', qty: 27, min: 10 },

    // === TX9 Components ===
    'WHP05100VUX': { ref: 'WHP05100VUX', name: 'Kompresor Highly (náhrada za starý)', category: 'refrigeration', manufacturer: 'Highly', qty: 146, min: 10 },
    'WHP05100BSV': { ref: 'WHP05100BSV', name: 'Kompresor Highly', category: 'refrigeration', manufacturer: 'Highly', qty: 2, min: 10 },
    '00063': { ref: '00063', name: 'Ventil plnící ¼"', category: 'refrigeration', manufacturer: '', qty: 841, min: 50 },
    '00062_LP_0.7/1.7': { ref: '00062_LP_0.7/1.7', name: 'Presostat ACB-2UA521W (LP)', category: 'refrigeration', manufacturer: 'Danfoss', qty: 176, min: 20 },
    '00062_HP_26': { ref: '00062_HP_26', name: 'Presostat ACB-2UB507W (HP)', category: 'refrigeration', manufacturer: 'Danfoss', qty: 177, min: 20 },
    'MDF3H02': { ref: 'MDF3H02', name: 'Ventil elektromagneticky 6mm (náhrada)', category: 'refrigeration', manufacturer: '', qty: 141, min: 15 },
    'HQ1K11': { ref: 'HQ1K11', name: 'Cívka 24V 50Hz pro MDF compact (náhrada)', category: 'electrique', manufacturer: '', qty: 141, min: 15 },
    '01789': { ref: '01789', name: 'Ventil elektromagneticky ALKO 110 RB 2T2', category: 'refrigeration', manufacturer: 'ALCO', qty: 0, min: 10 },
    '801033': { ref: '801033', name: 'Cívka elektromagnetická 24V ESC', category: 'electrique', manufacturer: '', qty: 0, min: 10 },
    '0712174': { ref: '0712174', name: 'Koncovka – svorkovnice k elektromag. Ventilu', category: 'electrique', manufacturer: '', qty: 0, min: 10 },
    '068U2215': { ref: '068U2215', name: 'Ventil expanzní TUAE', category: 'refrigeration', manufacturer: 'Danfoss', qty: 209, min: 20 },
    '068U1036': { ref: '068U1036', name: 'Tryska k TUAE ventilu', category: 'refrigeration', manufacturer: 'Danfoss', qty: 185, min: 20 },
    'WVFX_10': { ref: 'WVFX_10', name: 'Ventil vodní 3/8"', category: 'refrigeration', manufacturer: '', qty: 81, min: 15 },
    '060-017166': { ref: '060-017166', name: 'Kapilára pro WVFX', category: 'refrigeration', manufacturer: '', qty: 232, min: 25 },
    'DML_053S': { ref: 'DML_053S', name: 'Filtr dehydrátor DML 053S', category: 'refrigeration', manufacturer: 'Danfoss', qty: 186, min: 20 },
    'YCV-15009': { ref: 'YCV-15009', name: 'Ventil zpětný SANHUA 10mm', category: 'refrigeration', manufacturer: 'Sanhua', qty: 159, min: 20 },
    'B5THx16/1P-SC-M': { ref: 'B5THx16/1P-SC-M', name: 'Swep B5THx16/1P-SC-M', category: 'echangeur', manufacturer: 'Swep', qty: 116, min: 15 },
    '04878_AE': { ref: '04878_AE', name: 'Výparník BP302AH06 - 4coils', category: 'echangeur', manufacturer: '', qty: 110, min: 15 },
    '04879_AG': { ref: '04879_AG', name: 'Kondenzátor BP312AH07 - 4coils', category: 'echangeur', manufacturer: '', qty: 124, min: 15 },
    '11547_HYDRA': { ref: '11547_HYDRA', name: 'Capacitátor MKB MKP 50/500/2149', category: 'electrique', manufacturer: 'Hydra', qty: 155, min: 20 },
    'TX9_kabel_svazek': { ref: 'TX9_kabel_svazek', name: 'Sada kabelových svazků pro sušičku TX9', category: 'electrique', manufacturer: 'Navalo', qty: 170, min: 20 },
    '571903': { ref: '571903', name: 'Difuzor TX9HP', category: 'mecanique', manufacturer: 'Navalo', qty: 53, min: 10 },
    'vsuvka_mosaz_3/8_3/4': { ref: 'vsuvka_mosaz_3/8_3/4', name: 'Vsuvka mosazná redukovaná 3/8" na 3/4"', category: 'mecanique', manufacturer: '', qty: 489, min: 30 },
    'pas_upinaci_2,5_25mm': { ref: 'pas_upinaci_2,5_25mm', name: 'Upínací pás se spojkou 25mm/2,5', category: 'mecanique', manufacturer: '', qty: 396, min: 30 },
    '10060': { ref: '10060', name: 'Distanční sloupek pro kompesor Highly', category: 'mecanique', manufacturer: 'Navalo', qty: 512, min: 50 },
    'R134a': { ref: 'R134a', name: 'Chladivo R134a (kg)', category: 'refrigeration', manufacturer: '', qty: 155, min: 20 },
    '12384': { ref: '12384', name: 'Ventilátor radiální BL-B250B-EC-07', category: 'electrique', manufacturer: '', qty: 159, min: 20 },
    'EPP_SADA_TX9': { ref: 'EPP_SADA_TX9', name: 'Opláštění sada pro TX9', category: 'epp', manufacturer: 'JSP/ARPRO', qty: 91, min: 15 },

    // === TX9 Tôlerie ===
    'R05092_AlMg3_2mm_A-06': { ref: 'R05092_AlMg3_2mm_A-06', name: 'Držák deskového výměníku a elektra TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 78, min: 15 },
    'R05493_AlMg3_1.5mm_A-02': { ref: 'R05493_AlMg3_1.5mm_A-02', name: 'Deska základová TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 53, min: 15 },
    'R05494_AlMg3_3mm_A-03': { ref: 'R05494_AlMg3_3mm_A-03', name: 'Držák TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 161, min: 20 },
    'R05495_AlMg3_1.5mm_A-02': { ref: 'R05495_AlMg3_1.5mm_A-02', name: 'Plech krycí náběhový TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 92, min: 15 },
    'R10023_AlMg3_1.5mm': { ref: 'R10023_AlMg3_1.5mm', name: 'Klec ventilátoru RH25V', category: 'tolerie', manufacturer: 'Navalo', qty: 46, min: 10 },
    '11778_n': { ref: '11778_n', name: 'Plech vypouštěcí DN18', category: 'tolerie', manufacturer: 'Navalo', qty: 267, min: 30 },
    '11779_n': { ref: '11779_n', name: 'Plech protikus vypouštěcího dílu DN18', category: 'tolerie', manufacturer: 'Navalo', qty: 272, min: 30 },
    'R11892_AlMg3_2mm_A-02': { ref: 'R11892_AlMg3_2mm_A-02', name: 'Plech vodící TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '10052_n_A-04': { ref: '10052_n_A-04', name: 'Plech krycí vypouštěcí a přívod chladící vody', category: 'tolerie', manufacturer: 'Navalo', qty: 257, min: 30 },
    'R11780_AlMg3_1mm_A-04': { ref: 'R11780_AlMg3_1mm_A-04', name: 'Kryt pro rozběhový kondenzátor TX9 Hydra', category: 'tolerie', manufacturer: 'Navalo', qty: 76, min: 15 },
    'R11869_AlMg3_1mm_A-04': { ref: 'R11869_AlMg3_1mm_A-04', name: 'Krytka prostupu kabelů TX9', category: 'tolerie', manufacturer: 'Navalo', qty: 84, min: 15 },

    // === TX9 Tuyauterie Cu ===
    '05095': { ref: '05095', name: 'Cu tr. 12 z ekonomizéru do filtru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '05101': { ref: '05101', name: 'Cu tr 12 z exp. ventilu do výparníku TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '01503': { ref: '01503', name: 'Cu tr. 6 propojka MOP s tr.v.č. 05090', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '05107': { ref: '05107', name: 'Cu tr. 10 z filtru do exp.ventilu TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196_1': { ref: '12196_1', name: 'Cu tr. 10 vytl. tr. z kompresoru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196_2': { ref: '12196_2', name: 'Cu tr. 10 vytl. tr. z ZK do kondenzátoru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196_3': { ref: '12196_3', name: 'Propojka bypass 1.část TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196_4': { ref: '12196_4', name: 'Propojka bypass 2.část TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196_5': { ref: '12196_5', name: 'Cu tr. 6 pro plnící ventil HP TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12197_1': { ref: '12197_1', name: 'Cu tr. 12 z výparníku do SLA kompresoru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12197_2': { ref: '12197_2', name: 'Cu tr. 6 do plnící ventil LP TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '05393': { ref: '05393', name: 'Cu tr 10 z kondenzátoru do ekonomizéru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '05111': { ref: '05111', name: 'Sestava tr. z výměníku do vodního ventilu TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 13, min: 15 },
    '05109': { ref: '05109', name: 'Sestava Cu tr. dochlazování z řádu TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '05164': { ref: '05164', name: 'Sestava Cu tr.18 z vodního ventilu do výpustě TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12196': { ref: '12196', name: 'Sestava vytl. tr. do kondenzátoru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12197': { ref: '12197', name: 'Sestava sání do kompresoru TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },
    '12247': { ref: '12247', name: 'Sestava TUAE ventilu TX9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 12, min: 15 },

    // === T9/T11 Specific ===
    'C-SBS120H38A': { ref: 'C-SBS120H38A', name: 'Kompresor Sanyo', category: 'refrigeration', manufacturer: 'Sanyo', qty: 89, min: 10 },
    'C-SBN263H5A': { ref: 'C-SBN263H5A', name: 'Kompresor Sanyo 3x230V', category: 'refrigeration', manufacturer: 'Sanyo', qty: 18, min: 5 },
    'TGEN2,5_134': { ref: 'TGEN2,5_134', name: 'Ventil expanzní TGEN2.5/R134a Danfoss 067N5192', category: 'refrigeration', manufacturer: 'Danfoss', qty: 98, min: 15 },
    '03998_AB': { ref: '03998_AB', name: 'Výparník sušička BPA02AH21 - 4coils', category: 'echangeur', manufacturer: '', qty: 43, min: 10 },
    '03999_AB': { ref: '03999_AB', name: 'Kondenzátor sušička BPA12AH22 - 4coils', category: 'echangeur', manufacturer: '', qty: 48, min: 10 },
    '6.04726.0000': { ref: '6.04726.0000', name: 'Filtr Emerson FDB 084S dehydrátor jednosměrný', category: 'refrigeration', manufacturer: 'Emerson', qty: 65, min: 10 },
    '6.04677.0000': { ref: '6.04677.0000', name: 'Průhledítko Sanhua 12mm SYJ-42025', category: 'refrigeration', manufacturer: 'Sanhua', qty: 67, min: 10 },
    '4715136': { ref: '4715136', name: 'Presostat HP s pájecí trubičkou PS1-A5L', category: 'refrigeration', manufacturer: '', qty: 65, min: 10 },
    '00170': { ref: '00170', name: 'Pryžová podložka pod sběrač', category: 'mecanique', manufacturer: '', qty: 55, min: 10 },
    '04451_B': { ref: '04451_B', name: 'Chladič sušička', category: 'echangeur', manufacturer: '', qty: 85, min: 10 },
    '01413': { ref: '01413', name: 'Sběrač chladiva 1,6l', category: 'refrigeration', manufacturer: '', qty: 30, min: 10 },
    '03488': { ref: '03488', name: 'Cu tr.D15/1mm z TEV TGEN 2,5 do výparníku', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03610': { ref: '03610', name: 'Cu tr.D12/1mm z kompresoru do kondenzátoru', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '01783': { ref: '01783', name: 'Cu tr.D12/1mm propojka z průhledítka do filtru', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03620': { ref: '03620', name: 'Cu tr.D12/1mm z filtru do průhledítka', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03621': { ref: '03621', name: 'Cu tr.D12/1mm z průhledítka do TEV TGEN', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03492': { ref: '03492', name: 'Cu tr.D6/1mm z TEV TGEN2,5 do tr.03245', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03613': { ref: '03613', name: 'Cu tr.D16/1mm z kondenzátoru do chladiče', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    '03649': { ref: '03649', name: 'Cu tr.D16/1mm z tr.v.č.03648 do S.CHL. (díl 2)', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    'N00381': { ref: 'N00381', name: 'Cu tr.D18/1mm z býparníku do sání kompresoru', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },
    'Sada_komplet_Cu': { ref: 'Sada_komplet_Cu', name: 'Kompletní sada Cu trubek na T11 a T9', category: 'tuyauterie', manufacturer: 'Navalo', qty: 30, min: 10 },

    // === Autres ===
    'Repas': { ref: 'Repas', name: 'Sada na repasy strojů', category: 'autre', manufacturer: '', qty: 26, min: 10 },
    '17C1961619': { ref: '17C1961619', name: 'Zilmet ZC190-16 plates', category: 'echangeur', manufacturer: 'Zilmet', qty: 11, min: 5 },
    'R00513': { ref: 'R00513', name: 'Ventilátor RH25V-4IP.ZC AR', category: 'electrique', manufacturer: '', qty: 0, min: 10 },
};

// BOM TX9
const BOM_TX9 = [
    { ref: 'WHP05100BSV', name: 'Kompresor Highly', category: 'refrigeration', qty: 1, manufacturer: 'Highly' },
    { ref: '00063', name: 'Ventil plnící ¼"', category: 'refrigeration', qty: 2, manufacturer: '' },
    { ref: '00062_LP_0.7/1.7', name: 'Presostat ACB-2UA521W (LP)', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '00062_HP_26', name: 'Presostat ACB-2UB507W (HP)', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '01789', name: 'Ventil elektromagneticky ALKO 110 RB 2T2', category: 'refrigeration', qty: 1, manufacturer: 'ALCO' },
    { ref: '801033', name: 'Cívka elektromagnetická 24V ESC', category: 'electrique', qty: 1, manufacturer: '' },
    { ref: '0712174', name: 'Koncovka – svorkovnice k elektromag. Ventilu', category: 'electrique', qty: 1, manufacturer: '' },
    { ref: '068U2215', name: 'Ventil expanzní TUAE', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '068U1036', name: 'Tryska k TUAE ventilu', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'WVFX_10', name: 'Ventil vodní 3/8"', category: 'refrigeration', qty: 1, manufacturer: '' },
    { ref: '060-017166', name: 'Kapilára pro WVFX', category: 'refrigeration', qty: 1, manufacturer: '' },
    { ref: 'DML_053S', name: 'Filtr dehydrátor DML 053S', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'YCV-15009', name: 'Ventil zpětný SANHUA 10mm', category: 'refrigeration', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'R134a', name: 'Chladivo R134a (kg)', category: 'refrigeration', qty: 1.1, manufacturer: '' },
    { ref: 'B5THx16/1P-SC-M', name: 'Swep B5THx16/1P-SC-M', category: 'echangeur', qty: 1, manufacturer: 'Swep' },
    { ref: '04878_AE', name: 'Výparník BP302AH06 - 4coils', category: 'echangeur', qty: 1, manufacturer: '' },
    { ref: '04879_AG', name: 'Kondenzátor BP312AH07 - 4coils', category: 'echangeur', qty: 1, manufacturer: '' },
    { ref: '11547_HYDRA', name: 'Capacitátor MKB MKP 50/500/2149', category: 'electrique', qty: 1, manufacturer: 'Hydra' },
    { ref: 'TX9_kabel_svazek', name: 'Sada kabelových svazků pro sušičku TX9', category: 'electrique', qty: 1, manufacturer: 'Navalo' },
    { ref: '05393', name: 'Cu tr 10 z kondenzátoru do ekonomizéru TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '05095', name: 'Cu tr. 12 z ekonomizéru do filtru TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '05101', name: 'Cu tr 12 z exp. ventilu do výparníku TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '01503', name: 'Cu tr. 6 propojka MOP s tr.v.č. 05090', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '05107', name: 'Cu tr. 10 z filtru do exp.ventilu TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12196_1', name: 'Cu tr. 10 vytl. tr. z kompresoru TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12196_2', name: 'Cu tr. 10 vytl. tr. z ZK do kondenzátoru TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12196_3', name: 'Propojka bypass 1.část TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12196_4', name: 'Propojka bypass 2.část TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12196_5', name: 'Cu tr. 6 pro plnící ventil HP TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12197_1', name: 'Cu tr. 12 z výparníku do SLA kompresoru TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '12197_2', name: 'Cu tr. 6 do plnící ventil LP TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '05111', name: 'Sestava tr. z výměníku do vodního ventilu TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '05109', name: 'Sestava Cu tr. dochlazování z řádu TX9', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: '571903', name: 'Difuzor TX9HP', category: 'mecanique', qty: 1, manufacturer: 'Navalo' },
    { ref: 'vsuvka_mosaz_3/8_3/4', name: 'Vsuvka mosazná redukovaná 3/8" na 3/4"', category: 'mecanique', qty: 2, manufacturer: '' },
    { ref: 'pas_upinaci_2,5_25mm', name: 'Upínací pás se spojkou 25mm/2,5', category: 'mecanique', qty: 2, manufacturer: '' },
    { ref: '10060', name: 'Distanční sloupek pro kompesor Highly', category: 'mecanique', qty: 3, manufacturer: 'Navalo' },
    { ref: 'R05092_AlMg3_2mm_A-06', name: 'Držák deskového výměníku a elektra TX9', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'R05493_AlMg3_1.5mm_A-02', name: 'Deska základová TX9', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'R05494_AlMg3_3mm_A-03', name: 'Držák TX9', category: 'tolerie', qty: 2, manufacturer: 'Navalo' },
    { ref: 'R05495_AlMg3_1.5mm_A-02', name: 'Plech krycí náběhový TX9', category: 'tolerie', qty: 2, manufacturer: 'Navalo' },
    { ref: 'R10023_AlMg3_1.5mm', name: 'Klec ventilátoru RH25V', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: '11778_n', name: 'Plech vypouštěcí DN18', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: '11779_n', name: 'Plech protikus vypouštěcího dílu DN18', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'R11892_AlMg3_2mm_A-02', name: 'Plech vodící TX9', category: 'tolerie', qty: 2, manufacturer: 'Navalo' },
    { ref: '10052_n_A-04', name: 'Plech krycí vypouštěcí a přívod chladící vody', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'R11780_AlMg3_1mm_A-04', name: 'Kryt pro rozběhový kondenzátor TX9 Hydra', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'R11869_AlMg3_1mm_A-04', name: 'Krytka prostupu kabelů TX9', category: 'tolerie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'EPP_SADA_TX9', name: 'Opláštění sada pro TX9', category: 'epp', qty: 1, manufacturer: 'JSP/ARPRO' },
];

// BOM TX12-3PH
const BOM_TX12_3PH = [
    { ref: 'WHP15600VSDPC9EQ', name: 'Kompresor WHP15600VSDPC9EQ', category: 'refrigeration', qty: 1, manufacturer: 'Highly' },
    { ref: 'CV-240180-3FHE', name: 'Driver Invertek CV-240180-3FHE', category: 'electrique', qty: 1, manufacturer: 'Invertek' },
    { ref: '10263239', name: 'Výparník LU-VE', category: 'echangeur', qty: 1, manufacturer: 'LU-VE' },
    { ref: '10263238', name: 'Kondenzátor LU-VE', category: 'echangeur', qty: 1, manufacturer: 'LU-VE' },
    { ref: 'R513A', name: 'Chladivo R513A (kg)', category: 'refrigeration', qty: 1.25, manufacturer: '' },
    { ref: '1111111111', name: 'Sloupek pro TX12-18', category: 'mecanique', qty: 3, manufacturer: 'Navalo' },
    { ref: 'POS455', name: 'Climatix POS455', category: 'electronique', qty: 1, manufacturer: 'Siemens' },
    { ref: 'DML_053S', name: 'Filtr dehydrátor DML 053S', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '034G6505', name: 'Expanzní ventil ETS 5M35L', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '034G3860', name: 'Cívka expanzního ventilu - 1m', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'YCQB03L18', name: 'Vysokotlaké čidlo (HP sensor)', category: 'electronique', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'YCQB02L01', name: 'Nízkotlaké čidlo (LP sensor)', category: 'electronique', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'ACB-2UB480W', name: 'HP presostat', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'TG4A', name: 'Teplotní čidlo NTC10k', category: 'electronique', qty: 2, manufacturer: 'Sensit' },
    { ref: 'TX12_el_svazek', name: 'El. svazek TX12-18', category: 'electrique', qty: 1, manufacturer: 'Navalo' },
    { ref: 'PE3300-16-06', name: 'PE3300-16-06 - EMI filtr 3ph', category: 'electrique', qty: 1, manufacturer: 'Pioneer' },
    { ref: '00063', name: 'Ventil plnící ¼"', category: 'refrigeration', qty: 4, manufacturer: '' },
    { ref: 'YCV-15009', name: 'Ventil zpětný SANHUA 10mm', category: 'refrigeration', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'Sada_komplet_cu_TX18', name: 'Sada trubky TX12-18', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'Plastovy_vytok', name: 'Plastový výtok', category: 'autre', qty: 1, manufacturer: '' },
    { ref: 'EPP_komplet_TX12', name: 'EPP TX12-18', category: 'epp', qty: 1, manufacturer: 'JSP/ARPRO' },
];

// BOM TX12-1PH
const BOM_TX12_1PH = [
    { ref: 'WHP15600VSDPC9EQ', name: 'Kompresor WHP15600VSDPC9EQ', category: 'refrigeration', qty: 1, manufacturer: 'Highly' },
    { ref: 'CV-220200-1FHP', name: 'Driver Invertek CV-220200-1FHP (1ph)', category: 'electrique', qty: 1, manufacturer: 'Invertek' },
    { ref: '10263239', name: 'Výparník LU-VE', category: 'echangeur', qty: 1, manufacturer: 'LU-VE' },
    { ref: '10263238', name: 'Kondenzátor LU-VE', category: 'echangeur', qty: 1, manufacturer: 'LU-VE' },
    { ref: 'R513A', name: 'Chladivo R513A (kg)', category: 'refrigeration', qty: 1.25, manufacturer: '' },
    { ref: '1111111111', name: 'Sloupek pro TX12-18', category: 'mecanique', qty: 3, manufacturer: 'Navalo' },
    { ref: 'POS455', name: 'Climatix POS455', category: 'electronique', qty: 1, manufacturer: 'Siemens' },
    { ref: 'DML_053S', name: 'Filtr dehydrátor DML 053S', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '034G6505', name: 'Expanzní ventil ETS 5M35L', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '034G3860', name: 'Cívka expanzního ventilu - 1m', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'YCQB03L18', name: 'Vysokotlaké čidlo (HP sensor)', category: 'electronique', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'YCQB02L01', name: 'Nízkotlaké čidlo (LP sensor)', category: 'electronique', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'ACB-2UB480W', name: 'HP presostat', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'TG4A', name: 'Teplotní čidlo NTC10k', category: 'electronique', qty: 2, manufacturer: 'Sensit' },
    { ref: 'TX12_el_svazek', name: 'El. svazek TX12-18', category: 'electrique', qty: 1, manufacturer: 'Navalo' },
    { ref: 'PE2300-25-06', name: 'PE2300-25-06 - EMI filtr 1ph', category: 'electrique', qty: 1, manufacturer: 'Pioneer' },
    { ref: '00063', name: 'Ventil plnící ¼"', category: 'refrigeration', qty: 4, manufacturer: '' },
    { ref: 'YCV-15009', name: 'Ventil zpětný SANHUA 10mm', category: 'refrigeration', qty: 1, manufacturer: 'Sanhua' },
    { ref: 'Sada_komplet_cu_TX18', name: 'Sada trubky TX12-18', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
    { ref: 'Plastovy_vytok', name: 'Plastový výtok', category: 'autre', qty: 1, manufacturer: '' },
    { ref: 'EPP_komplet_TX12', name: 'EPP TX12-18', category: 'epp', qty: 1, manufacturer: 'JSP/ARPRO' },
];

// BOM TH11 (sušička / dryer)
const BOM_TH11 = [
    { ref: 'C-SBS120H38A', name: 'Kompresor Sanyo C-SBS120H38A', category: 'refrigeration', qty: 1, manufacturer: 'Sanyo' },
    { ref: '00063', name: 'Ventil plnící ¼"', category: 'refrigeration', qty: 2, manufacturer: '' },
    { ref: '00062_LP_0.7/1.7', name: 'Presostat LP ACB-2UA521W', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '00062_HP_26', name: 'Presostat HP ACB-2UB507W', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: 'TGEN2,5_134', name: 'Ventil expanzní TGEN2.5/R134a Danfoss 067N5192', category: 'refrigeration', qty: 1, manufacturer: 'Danfoss' },
    { ref: '03998_AB', name: 'Výparník sušička BPA02AH21 - 4coils', category: 'echangeur', qty: 1, manufacturer: '' },
    { ref: '03999_AB', name: 'Kondenzátor sušička BPA12AH22 - 4coils', category: 'echangeur', qty: 1, manufacturer: '' },
    { ref: '6.04726.0000', name: 'Filtr Emerson FDB 084S dehydrátor jednosměrný', category: 'refrigeration', qty: 1, manufacturer: 'Emerson' },
    { ref: '6.04677.0000', name: 'Průhledítko Sanhua 12mm SYJ-42025', category: 'refrigeration', qty: 1, manufacturer: 'Sanhua' },
    { ref: '4715136', name: 'Presostat HP s pájecí trubičkou PS1-A5L', category: 'refrigeration', qty: 1, manufacturer: '' },
    { ref: '00170', name: 'Pryžová podložka pod sběrač', category: 'mecanique', qty: 1, manufacturer: '' },
    { ref: '04451_B', name: 'Chladič sušička', category: 'echangeur', qty: 1, manufacturer: '' },
    { ref: 'R134a', name: 'Chladivo R134a (kg)', category: 'refrigeration', qty: 2.7, manufacturer: '' },
    { ref: '01413', name: 'Sběrač chladiva 1,6l', category: 'refrigeration', qty: 1, manufacturer: '' },
    { ref: 'Sada_komplet_Cu', name: 'Kompletní sada Cu trubek T9/T11', category: 'tuyauterie', qty: 1, manufacturer: 'Navalo' },
];

// Combined BOM for app
const SAMPLE_BOM = {
    'TX9': BOM_TX9,
    'TX12-3PH': BOM_TX12_3PH,
    'TX12-1PH': BOM_TX12_1PH,
    'TH11': BOM_TH11
};

// Generate initial stock from data
function generateInitialStock() {
    return {
        components: INITIAL_STOCK,
        pac: { 'TX9': 0, 'TX12-3PH': 0, 'TX12-1PH': 0, 'TH11': 0 }
    };
}

// ========================================
// REPAIR PRICE LIST (for Quotes/Devis)
// ========================================
const REPAIR_PRICE_LIST = {
    categories: ['Main d\'oeuvre', 'Pièces', 'Déplacement', 'Diagnostic'],
    items: [
        // Main d'oeuvre
        { id: 'labor_hour', name: 'Main d\'oeuvre (heure)', price: 500, unit: 'hod', category: 'Main d\'oeuvre' },
        { id: 'labor_overtime', name: 'Heures supplémentaires', price: 750, unit: 'hod', category: 'Main d\'oeuvre' },

        // Diagnostic
        { id: 'diagnostic', name: 'Diagnostic standard', price: 800, unit: 'ks', category: 'Diagnostic' },
        { id: 'diagnostic_advanced', name: 'Diagnostic approfondi', price: 1500, unit: 'ks', category: 'Diagnostic' },

        // Déplacement
        { id: 'travel_km', name: 'Déplacement (km)', price: 8, unit: 'km', category: 'Déplacement' },
        { id: 'travel_flat', name: 'Forfait déplacement', price: 500, unit: 'ks', category: 'Déplacement' },

        // Pièces courantes
        { id: 'compressor_replace', name: 'Remplacement compresseur', price: 3500, unit: 'ks', category: 'Pièces' },
        { id: 'refrigerant_kg', name: 'Chargement réfrigérant', price: 150, unit: 'kg', category: 'Pièces' },
        { id: 'filter_replace', name: 'Remplacement filtre', price: 200, unit: 'ks', category: 'Pièces' },
        { id: 'sensor_replace', name: 'Remplacement capteur', price: 350, unit: 'ks', category: 'Pièces' },
        { id: 'valve_replace', name: 'Remplacement vanne', price: 800, unit: 'ks', category: 'Pièces' },
        { id: 'circuit_board', name: 'Carte électronique', price: 2500, unit: 'ks', category: 'Pièces' },
        { id: 'fan_motor', name: 'Moteur ventilateur', price: 1200, unit: 'ks', category: 'Pièces' },
        { id: 'expansion_valve', name: 'Vanne d\'expansion', price: 650, unit: 'ks', category: 'Pièces' },
        { id: 'pressure_switch', name: 'Pressostat HP/LP', price: 280, unit: 'ks', category: 'Pièces' },
        { id: 'temp_sensor', name: 'Sonde température NTC', price: 180, unit: 'ks', category: 'Pièces' },
    ]
};

// Get repair price list item by ID
function getRepairItem(id) {
    return REPAIR_PRICE_LIST.items.find(item => item.id === id) || null;
}

// Get items by category
function getRepairItemsByCategory(category) {
    return REPAIR_PRICE_LIST.items.filter(item => item.category === category);
}
