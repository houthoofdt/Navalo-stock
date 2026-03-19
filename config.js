/* ========================================
   NAVALO Stock PAC - Configuration v4
   With Contacts Management & Full i18n
   ======================================== */

const CONFIG = {
    // URL de l'API Google Apps Script
    API_URL: 'https://script.google.com/macros/s/AKfycbynxyR7NItwsBCOBQc8SoGwt0BELBjuDbtD1IEh_aAe3OMqafLBJiyTcNV4Pyb_mTyq/exec',
    
    // Mode de stockage: 'local' ou 'googlesheets'
    STORAGE_MODE: 'googlesheets',

    // Mode hybride: travail en local avec synchronisation automatique vers Google Sheets
    // ⚡ RECOMMANDÉ pour meilleures performances
    // ⚠️ DÉSACTIVÉ: force lecture depuis Google Sheets pour éviter données obsolètes
    HYBRID_MODE: false,

    // Intervalle de synchronisation en millisecondes (par défaut 5 minutes)
    // 60000 = 1 min, 300000 = 5 min, 600000 = 10 min
    // ⚡ Réduit à 30s pour sync plus rapide
    SYNC_INTERVAL: 30000,

    // Informations entreprise
    COMPANY: {
        name: 'NAVALO s.r.o.',
        address: 'Radvanická 140/60, 715 00 Michálkovice',
        country: 'Czech Republic',
        ico: '25352695',
        dic: 'CZ25352695',
        phone: '731 501 291',
        email: 'navalo@navalo.cz',

        // Coordonnées bancaires
        bank: {
            CZK: {
                name: 'Komerční banka, a.s.',
                account: '19-3261060267/0100',
                iban: 'CZ6001000000193261060267',
                bic: 'KOMBCZPPXXX'
            },
            EUR: {
                name: 'Komerční banka, a.s.',
                account: '131-3597170267/0100',
                iban: 'CZ2701000001313597170267',
                bic: 'KOMBCZPPXXX'
            }
        }
    },

    // Fournisseurs prédéfinis
    SUPPLIERS: [
        { id: 'danfoss', name: 'Danfoss', currency: 'EUR' },
        { id: 'invertek', name: 'Invertek', currency: 'EUR' },
        { id: 'sanhua', name: 'Sanhua', currency: 'EUR' },
        { id: 'luve', name: 'LU-VE', currency: 'EUR' },
        { id: 'highly', name: 'Highly/Welling', currency: 'EUR' },
        { id: 'siemens', name: 'Siemens', currency: 'EUR' },
        { id: 'swep', name: 'Swep', currency: 'EUR' },
        { id: 'pioneer', name: 'Pioneer', currency: 'EUR' },
        { id: 'emerson', name: 'Emerson', currency: 'EUR' },
        { id: 'sanyo', name: 'Sanyo/Panasonic', currency: 'EUR' },
        { id: 'sensit', name: 'Sensit', currency: 'CZK' },
        { id: 'hydra', name: 'Hydra', currency: 'CZK' },
        { id: 'jsp', name: 'JSP/ARPRO', currency: 'CZK' },
        { id: 'navalo', name: 'Navalo (interne)', currency: 'CZK' },
        { id: 'autre', name: 'Autre', currency: 'CZK' }
    ],
    
    // Devises supportées
    CURRENCIES: ['CZK', 'EUR'],
    
    // TVA par défaut
    DEFAULT_VAT_RATE: 21,
    
    // Modèles PAC - Configuration dynamique
    // Pour ajouter un modèle: ajouter ici + ajouter BOM dans data.js
    PAC_MODELS: [
        { id: 'TX9', name: 'TX9', partNumber: '566255', fullName: '566255 Tepelné čerpadlo s izolaci EPP' },
        { id: 'TX12-3PH', name: 'TX12-18 3ph', partNumber: '582489-S1', fullName: '582489-S1 HP unit TX12-18 Complete 3F' },
        { id: 'TX12-1PH', name: 'TX12-18 1ph', partNumber: '582493-S1', fullName: '582493-S1 HP unit TX12-18 Complete 1F' },
        { id: 'TH11', name: 'TH11', partNumber: '552661-S1', fullName: '552661-S1 Cabinet T11-16HP 380-415V 3AC 50Hz assembly' },
        { id: 'TIZ_TH11', name: 'TIZ_TH11', partNumber: 'TIZ_TH11', fullName: 'TIZ_TH11 Kit à assembler' }
    ],
    
    // Catégories (FR)
    CATEGORIES: {
        refrigeration: 'Réfrigération',
        electrique: 'Électrique',
        mecanique: 'Mécanique',
        electronique: 'Électronique',
        echangeur: 'Échangeur',
        tuyauterie: 'Tuyauterie Cu',
        tolerie: 'Tôlerie',
        epp: 'EPP / Isolation',
        autre: 'Autre'
    },
    
    // Catégories (CZ)
    CATEGORIES_CZ: {
        refrigeration: 'Chlazení',
        electrique: 'Elektrické',
        mecanique: 'Mechanické',
        electronique: 'Elektronické',
        echangeur: 'Výměník',
        tuyauterie: 'Měděné potrubí',
        tolerie: 'Plechové díly',
        epp: 'EPP / Izolace',
        autre: 'Ostatní'
    }
};

function checkConfig() {
    if (CONFIG.API_URL === 'VOTRE_URL_APPS_SCRIPT_ICI' || CONFIG.API_URL === '') {
        console.warn('⚠️ API_URL non configurée. Utilisation du mode local.');
        CONFIG.STORAGE_MODE = 'local';
        return false;
    }
    return true;
}
