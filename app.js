/* ========================================
   NAVALO Stock PAC - Application v4.3
   Complete with i18n, Contacts, History PAC only
   ======================================== */
console.log('=== APP.JS VERSION 4.3 LOADED ===');

let currentBomModel = null;
let currentStock = null;
let currentBom = null;
let currentDelivery = null;
let currentPO = null;
let currentInvoice = null;
let pendingOrders = {};
let exchangeRate = 25.0;
let currentLang = 'fr';
let editingInvoiceNumber = null;
let editingRecInvId = null;
let editingPOId = null;
let editingContactId = null;
let currentReceivedInvoiceFile = null;
let currentReceivedOrderFile = null;
let loadedComponentPrices = {}; // Prices loaded from Google Sheets
let currentPrintDocNumber = ''; // Current document number for PDF filename
let editingSubcontractingOrderId = null;
let _updatingReceivedOrders = false;
let autoRefreshInterval = null;
let currentRepairQuotePreview = null;

// ========================================
// BOM (Bill of Materials) - ASSEMBLY DEFINITIONS
// ========================================

const ASSEMBLY_BOM = {
    'KIT-ASSEMBLÉ': {
        name: 'Kit Assemblé Standard',
        components: [
            { ref: 'TH01', qty: 1 },
            { ref: 'TH02', qty: 1 }
        ],
        assemblyCost: 50 // CZK par kit
    },
    'TIZ_TX9': {
        name: 'Kit TIZ TX9',
        components: [
            { ref: '00062_LP_0.7/1.7', qty: 1 },
            { ref: '00062_HP_26', qty: 1 },
            { ref: '068U2215', qty: 1 },
            { ref: '060-017166', qty: 1 },
            { ref: 'DML_053S', qty: 1 },
            { ref: 'YCV-15009', qty: 1 },
            { ref: 'MDF3H02', qty: 1 }
        ],
        assemblyCost: 2450 // CZK par kit (travail + tubes)
    },
    'TIZ_TH11': {
        name: 'Kit TIZ TH11',
        components: [
            { ref: '00062_LP_0.7/1.7', qty: 1 },
            { ref: '00062_HP_26', qty: 1 },
            { ref: '6.04726.0000', qty: 1 },
            { ref: '6.04677.0000', qty: 1 },
            { ref: 'TGEN2,5_134', qty: 1 },
            { ref: '63', qty: 2 }
        ],
        assemblyCost: 2195 // CZK par kit (travail + tubes)
    }
};

// ========================================
// PAC MODELS HELPER FUNCTIONS
// ========================================

function getPacModels() {
    return CONFIG?.PAC_MODELS || [];
}

function getPacModelById(id) {
    return getPacModels().find(m => m.id === id);
}

function getPacModelIds() {
    return getPacModels().map(m => m.id);
}

function getDefaultPacModel() {
    const models = getPacModels();
    return models.length > 0 ? models[0].id : null;
}

function modelIdToKey(id) {
    // Convert model ID to a safe key for objects/IDs (lowercase, no special chars)
    return id.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function getDeliveryQuantities() {
    const quantities = {};
    getPacModels().forEach(model => {
        const key = modelIdToKey(model.id);
        const input = document.getElementById(`del-qty-${key}`);
        quantities[model.id] = parseInt(input?.value || 0);
    });
    return quantities;
}

function getRecOrderQuantities() {
    const result = { quantities: {}, prices: {} };
    getPacModels().forEach(model => {
        const qtyInput = document.getElementById(`recOrdQty-${model.id}`);
        const priceInput = document.getElementById(`recOrdPrice-${model.id}`);
        result.quantities[model.id] = parseInt(qtyInput?.value || 0);
        result.prices[model.id] = parseFloat(priceInput?.value || 0);
    });
    return result;
}

// ========================================
// TRANSLATIONS
// ========================================

const TRANSLATIONS = {
    fr: {
        appTitle: 'NAVALO Stock PAC', stockValue: 'Valeur', loading: 'Chargement...',
        modeLocal: 'Mode Local', modeGoogleSheets: 'Google Sheets',
        navStock: 'Stock', navEntrees: 'Entrées', navSorties: 'Livraisons',
        navCommandes: 'Commandes', navFactures: 'Factures', navPrijate: 'Factures reçues',
        navBom: 'BOM', navHistorique: 'Historique', navContacts: 'Contacts',
        stockTitle: 'État du Stock', search: 'Rechercher...', filterAll: 'Tous',
        filterLow: 'Stock bas', filterCritical: 'Rupture', stockValueTitle: 'Valeur du Stock',
        alertsTitle: 'Alertes', componentsToOrder: 'composants à commander',
        productionCapacity: 'Capacité Production', reference: 'Référence',
        designation: 'Désignation', category: 'Catégorie', inStock: 'En Stock',
        onOrder: 'En Cmd', totalAvailable: 'Dispo Total', demand: 'Demande', shortage: 'Manque', min: 'Min',
        valueCZK: 'Valeur (CZK)', status: 'Statut', statusOk: 'OK',
        statusLow: 'Bas', statusCritical: 'Rupture',
        entryTitle: 'Réception Marchandises', newReceipt: 'Nouvelle réception',
        receiptsHistory: 'Historique des réceptions', cancelReceipt: 'Annuler réception',
        confirmCancelReceipt: 'Annuler cette réception? Les quantités seront retirées du stock.',
        receiptNumber: 'N° Bon de réception', date: 'Date', linkToPO: 'Lier à commande',
        none: '-- Aucune --', supplier: 'Fournisseur', currency: 'Devise',
        articlesWithPrice: 'Articles (avec prix unitaire)', refPlaceholder: 'Référence...',
        qtyPlaceholder: 'Qté', pricePlaceholder: 'Prix unit.', addLine: '+ Ajouter', addCustomItem: '+ Article libre', customItemPlaceholder: 'Description article/service',
        saveReceipt: 'Enregistrer', clear: 'Annuler',
        deliveryTitle: 'Livraisons / Sorties', newDelivery: 'Nouvelle livraison',
        client: 'Client', clientAddress: 'Adresse client', bomPreview: 'Aperçu BOM',
        insufficientStock: 'Stock insuffisant!', component: 'Composant',
        required: 'Requis', available: 'Dispo', missing: 'Manque',
        createDelivery: 'Créer BL', deliveryHistory: 'Historique BL',
        totalPAC: 'Total PAC', invoiced: 'Facturé', no: 'Non', view: 'Voir',
        createInvoice: 'Créer facture',
        poTitle: 'Bons de Commande', newPO: 'Nouvelle Commande',
        filterDraft: 'Brouillon', filterSent: 'Envoyé', filterReceived: 'Reçu',
        filterCancelled: 'Annulé', pendingPO: 'En cours', draftPO: 'Brouillons',
        expectedDeliveries: 'Livraisons attendues', poNumber: 'N° Commande',
        articles: 'Articles', totalValue: 'Valeur Totale', edit: 'Modifier',
        markSent: 'Marquer envoyé', markReceived: 'Marquer reçu',
        cancel: 'Annuler', close: 'Fermer', delete: 'Supprimer', expectedDeliveryDate: 'Livraison souhaitée',
        notes: 'Notes', total: 'Total', save: 'Enregistrer',
        suggestedOrders: 'Commandes suggérées', toOrder: 'à commander',
        invoiceTitle: 'Factures Émises', newInvoice: 'Nouvelle Facture',
        filterPaid: 'Payé', filterUnpaid: 'Non payé', totalInvoiced: 'Total facturé',
        unpaidInvoices: 'Non payées', overdueInvoices: 'En retard',
        invoiceNumber: 'N° Facture', dueDate: 'Échéance', subtotal: 'Sous-total HT',
        vat: 'TVA', totalTTC: 'Total TTC', print: 'Imprimer', markPaid: 'Marquer payé',
        receivedInvTitle: 'Factures Reçues', newReceivedInv: 'Nouvelle Facture',
        internalNumber: 'N° Interne', invoiceNumberExt: 'N° Facture fournisseur',
        varSymbol: 'Var. symbol', supplierIco: 'IČO Fournisseur',
        supplierDic: 'DIČ Fournisseur', issueDate: 'Date émission',
        taxDate: 'DUZP', subtotalHT: 'Montant HT', vatRate: 'Taux TVA',
        vatAmount: 'Montant TVA', linkPO: 'Lier à commande', linkReceipt: 'Lier à příjemka', attachFile: 'Joindre fichier', viewFile: 'Voir fichier',
        saveInvoice: 'Enregistrer', paid: 'Payé', unpaid: 'Non payé',
        overdue: 'En retard', viewPDF: 'Voir PDF', export: 'Exporter',
        bomTitle: 'Nomenclatures (BOM)', selectModel: 'Modèle', qty: 'Qté',
        bomCost: 'Coût de fabrication', unitPriceCol: 'Prix Unit.', lineTotalCol: 'Total Ligne',
        quotesTitle: 'Devis / Offres de prix', totalQuotes: 'Total Devis', newQuote: 'Nouveau devis', validUntil: 'Validité',
        historyTitle: 'Historique des mouvements', historyType: 'Type',
        historyAll: 'Tous', historyIn: 'Entrées', historyOut: 'Sorties', filterByRef: 'Filtrer par référence...',
        docNumber: 'N° Doc', priceUnit: 'Prix Unit.', value: 'Valeur',
        partner: 'Partenaire', entryType: 'ENTRÉE', exitType: 'SORTIE',
        contactsTitle: 'Gestion des Contacts', newContact: 'Nouveau Contact',
        contactType: 'Type', contactSupplier: 'Fournisseur', contactClient: 'Client',
        contactBoth: 'Les deux', companyName: 'Nom société', address: 'Adresse',
        ico: 'IČO', dic: 'DIČ', phone: 'Téléphone', email: 'Email',
        defaultCurrency: 'Devise par défaut', bankAccount: 'Compte bancaire',
        iban: 'IBAN', bic: 'BIC', contactNotes: 'Notes', saveContact: 'Enregistrer',
        editContact: 'Modifier', deleteContact: 'Supprimer', selectContact: 'Sélectionner...',
        selectSupplierFirst: 'Sélectionner un fournisseur', noOrdersForSupplier: 'Aucune commande', noReceiptsForSupplier: 'Aucune réception',
        deliveryNote: 'BON DE LIVRAISON', purchaseOrder: 'BON DE COMMANDE',
        invoice: 'FACTURE', proforma: 'FACTURE PROFORMA',
        from: 'De', to: 'À', sender: 'Expéditeur', recipient: 'Destinataire',
        customer: 'Client', quantity: 'Quantité', unit: 'Unité',
        unitPrice: 'Prix Unit.', totalIncVat: 'TOTAL TTC',
        invoiceDateLabel: 'Date de facture', dueDateLabel: "Date d'échéance",
        paymentTerms: 'Conditions de paiement', bankDetails: 'Coordonnées bancaires',
        orderNumber: 'Commande N°', orderDate: 'Date de commande',
        confirmOrder: 'Merci de confirmer la réception de cette commande.',
        blNumber: 'BL N°', pieces: 'pcs', signatures: 'Signatures',
        senderSignature: 'Expéditeur', recipientSignature: 'Destinataire',
        confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
        confirmMarkPaid: 'Marquer comme payé ?', saved: 'Enregistré',
        deleted: 'Supprimé', error: 'Erreur', success: 'Succès', noData: 'Aucune donnée',
        selectAtLeastOne: 'Sélectionnez au moins un élément',
        // Received Orders
        navObjPrijate: 'Cmd. reçues', receivedOrdersTitle: 'Commandes reçues',
        newReceivedOrder: 'Nouvelle commande', clientOrderNum: 'N° cmd client', ticketNumber: 'N° Ticket', linkedOrder: 'Commande liée', none: 'Aucune', orderNum: 'N° Commande',
        deliveryDate: 'Date livraison', recOrdNew: 'Nouvelle', recOrdConfirmed: 'Confirmée',
        recOrdDelivered: 'Livrée', recOrdInvoiced: 'Facturée', toDeliver: 'À livrer',
        orderConfirmation: 'Confirmation de commande', products: 'Produits',
        linkedRecOrder: 'Lier à commande', paymentMethod: 'Mode de paiement',
        confirmOrderStatus: 'Confirmer', markDelivered: 'Marquer livrée',
        createConfirmation: 'Créer confirmation',
        // Exchange rate
        exchangeRateDUZP: 'Taux CNB au DUZP (EUR/CZK)',
        czkEquivalent: 'Équivalent en CZK au taux',
        subtotalCZK: 'Base HT en CZK', vatCZK: 'TVA en CZK', totalCZK: 'Total TTC en CZK',
        // Auto-refresh
        dataRefreshed: 'Données actualisées',
        // Tax document
        taxDocTitle: 'DAŇOVÝ DOKLAD K PŘIJATÉ PLATBĚ',
        paymentDate: 'Date de paiement',
        taxableDate: 'Date imposable',
        generateTaxDoc: 'Générer daňový doklad',
        alreadyPaid: 'DÉJÀ PAYÉ',
        exchangeRateLabel: 'Taux de change',
        paidByAdvance: 'Payé par avance',
        toPay: 'À payer',
        // Proforma deduction
        proformaDeduction: 'Déduction avance',
        linkedProforma: 'Avance liée',
        proformaTotal: 'Montant avance',
        paymentExchangeRate: 'Taux lors du paiement',
        proformaCZK: 'Avance en CZK',
        remainingToPay: 'Reste à payer',
        invoiceExchangeRate: 'Taux facture (DUZP)',
        remainingCZK: 'Reste en CZK',
        // Stock Adjustments
        navAdjustments: 'Ajustements',
        adjustmentsTitle: 'Ajustements de Stock',
        adjustmentTitle: 'Ajustement de stock',
        adjustStock: 'Ajuster',
        currentQty: 'Qté actuelle',
        newQty: 'Nouvelle quantité',
        qtyBefore: 'Qté avant',
        qtyAfter: 'Qté après',
        qtyChange: 'Changement',
        changePreview: 'Changement',
        reason: 'Raison',
        reasonDetails: 'Détails',
        reasonInventory: 'Inventaire physique',
        reasonDamage: 'Dommage/casse',
        reasonTheft: 'Vol/perte',
        reasonFound: 'Trouvé/retrouvé',
        reasonError: 'Correction erreur',
        reasonObsolete: 'Obsolète/périmé',
        reasonOther: 'Autre',
        valueImpact: 'Impact valeur',
        userName: 'Utilisateur',
        optional: 'Optionnel',
        actions: 'Actions',
        confirmLargeAdjustment: 'ATTENTION: Grand ajustement détecté. Voulez-vous continuer?',
        adjustmentSaved: 'Ajustement enregistré',
        noChangeError: 'Aucun changement de quantité',
        manufacturers: 'Marques fournies',
        manufacturersHint: 'Marques/fabricants séparés par des virgules (pour filtrage dans commandes)',
        manufacturer: 'Fabricant',
        stockComponents: 'Composants du stock',
        addStockComponent: 'Composant',
        // Repair Quotes
        navRepairQuotes: 'Devis Réparations',
        repairQuotesTitle: 'Devis de Réparation',
        repairQuote: 'Devis de réparation',
        newRepairQuote: 'Nouveau devis',
        repairQuoteNumber: 'N° Devis',
        repairQuoteConverted: 'Devis converti en facture',
        clientInfo: 'Informations client',
        pacsList: 'Pompes à chaleur à réparer',
        addPAC: 'Ajouter PAC',
        pacSerial: 'N° Série PAC',
        pacModel: 'Modèle',
        selectModel: 'Sélectionner modèle',
        components: 'Composants',
        selectComponent: 'Sélectionner composant',
        addComponent: 'Ajouter composant',
        services: 'Services',
        laborHours: 'Main d\'œuvre (heures)',
        refrigerantKg: 'Réfrigérant (kg)',
        disposalKg: 'Élimination (kg)',
        pacSubtotal: 'Sous-total PAC',
        removePAC: 'Retirer cette PAC',
        removeComponent: 'Retirer',
        pricePerUnit: 'Prix/unité',
        lineTotal: 'Total ligne',
        emptyPACs: 'Aucune PAC ajoutée',
        clickAddPAC: 'Cliquez sur "Ajouter PAC" pour commencer',
        convertToInvoice: 'Convertir en facture',
        quoteDate: 'Date devis',
        totalRepairQuotes: 'Total devis',
        pendingQuotes: 'En attente',
        acceptedQuotes: 'Acceptés',
        warrantyRepairs: 'Réparations garantie',
        repairsUnit: 'réparations',
        companyCosts: 'coûts entreprise',
        fixDuplicates: 'Corriger doublons',
        allStatuses: 'Tous statuts',
        statusPending: 'En attente',
        statusAccepted: 'Accepté',
        statusRejected: 'Refusé',
        statusInvoiced: 'Facturé',
        accept: 'Accepter',
        confirmAcceptQuote: 'Accepter ce devis et créer une facture automatiquement?\n\nLes composants seront déduits du stock.',
        quoteAccepted: 'Devis accepté',
        deleteAcceptedQuote: 'Voulez-vous supprimer le devis accepté maintenant qu\'il a été converti en facture?',
        sendEmail: 'Envoyer email',
        emailSent: 'Email envoyé',
        emailError: 'Erreur lors de l\'envoi',
        // Preview
        preview: 'Aperçu',
        receivedOrderPreview: 'Aperçu de la commande reçue',
        receivedInvoicePreview: 'Aperçu de la facture reçue',
        receiptPreview: 'Aperçu de la réception',
        stockReceipt: 'Réception de stock',
        receivedOrder: 'COMMANDE REÇUE',
        receivedInvoice: 'FACTURE REÇUE',
        exchangeRate: 'Taux de change',
        deliveryProgress: 'Progression',
        // Subcontracting
        subcontracting: 'Sous-Traitance',
        orderNotFound: 'Commande non trouvée',
        invalidKitType: 'Type de kit invalide',
        fillAllFields: 'Veuillez remplir tous les champs',
        orderUpdated: 'Commande mise à jour',
        orderCreated: 'Commande créée',
        orderDeleted: 'Commande supprimée',
        quantityTooHigh: 'Quantité trop élevée',
        assemblyCost: 'Coût assemblage',
        totalCost: 'Coût total'
    },
    cz: {
        appTitle: 'NAVALO Skladové hospodářství', stockValue: 'Hodnota',
        loading: 'Načítání...', modeLocal: 'Lokální režim', modeGoogleSheets: 'Google Sheets',
        navStock: 'Sklad', navEntrees: 'Příjemky', navSorties: 'Dodávky',
        navCommandes: 'Objednávky', navFactures: 'Faktury', navPrijate: 'Faktury přijaté',
        navBom: 'Kusovník', navHistorique: 'Historie', navContacts: 'Kontakty',
        stockTitle: 'Stav skladu', search: 'Hledat...', filterAll: 'Vše',
        filterLow: 'Nízký stav', filterCritical: 'Vyprodáno',
        stockValueTitle: 'Hodnota skladu', alertsTitle: 'Upozornění',
        componentsToOrder: 'komponent k objednání', productionCapacity: 'Výrobní kapacita',
        reference: 'Reference', designation: 'Popis', category: 'Kategorie',
        inStock: 'Na skladě', onOrder: 'Objednáno', totalAvailable: 'Celkem k disp.', demand: 'Poptávka', shortage: 'Chybí',
        min: 'Min', valueCZK: 'Hodnota (CZK)', status: 'Stav',
        statusOk: 'OK', statusLow: 'Nízký', statusCritical: 'Vyprodáno',
        entryTitle: 'Příjem zboží', newReceipt: 'Nová příjemka',
        receiptsHistory: 'Historie příjemek', cancelReceipt: 'Stornovat příjemku',
        confirmCancelReceipt: 'Stornovat tuto příjemku? Množství bude odebráno ze skladu.',
        receiptNumber: 'Číslo příjemky', date: 'Datum', linkToPO: 'Navázat na obj.',
        none: '-- Žádná --', supplier: 'Dodavatel', currency: 'Měna',
        articlesWithPrice: 'Položky (s jedn. cenou)', refPlaceholder: 'Reference...',
        qtyPlaceholder: 'Množství', pricePlaceholder: 'Jedn. cena', addLine: '+ Přidat', addCustomItem: '+ Vlastní položka', customItemPlaceholder: 'Popis položky/služby',
        saveReceipt: 'Uložit', clear: 'Vymazat',
        deliveryTitle: 'Dodávky / Výdeje', newDelivery: 'Nová dodávka',
        client: 'Zákazník', clientAddress: 'Adresa zákazníka', bomPreview: 'Náhled kusovníku',
        insufficientStock: 'Nedostatečný sklad!', component: 'Komponenta',
        required: 'Potřeba', available: 'K dispozici', missing: 'Chybí',
        createDelivery: 'Vytvořit DL', deliveryHistory: 'Historie DL',
        totalPAC: 'Celkem TČ', invoiced: 'Fakturováno', no: 'Ne', view: 'Zobrazit',
        createInvoice: 'Vytvořit fakturu',
        poTitle: 'Objednávky', newPO: 'Nová objednávka',
        filterDraft: 'Koncept', filterSent: 'Odesláno', filterReceived: 'Přijato',
        filterCancelled: 'Zrušeno', pendingPO: 'Aktivní', draftPO: 'Koncepty',
        expectedDeliveries: 'Očekávané dodávky', poNumber: 'Číslo obj.',
        articles: 'Položky', totalValue: 'Celková hodnota', edit: 'Upravit',
        markSent: 'Označit odesláno', markReceived: 'Označit přijato',
        cancel: 'Zrušit', close: 'Zavřít', delete: 'Smazat', expectedDeliveryDate: 'Požad. dodání',
        notes: 'Poznámky', total: 'Celkem', save: 'Uložit',
        suggestedOrders: 'Doporučené objednávky', toOrder: 'k objednání',
        invoiceTitle: 'Vydané faktury', newInvoice: 'Nová faktura',
        filterPaid: 'Zaplaceno', filterUnpaid: 'Nezaplaceno',
        totalInvoiced: 'Celkem fakturováno', unpaidInvoices: 'Nezaplacené',
        overdueInvoices: 'Po splatnosti', invoiceNumber: 'Číslo faktury',
        dueDate: 'Splatnost', subtotal: 'Základ daně', vat: 'DPH',
        totalTTC: 'Celkem s DPH', print: 'Tisknout', markPaid: 'Označit zaplaceno',
        receivedInvTitle: 'Přijaté faktury', newReceivedInv: 'Nová faktura',
        internalNumber: 'Interní číslo', invoiceNumberExt: 'Číslo fakt. dodavatele',
        varSymbol: 'Var. symbol', supplierIco: 'IČO dodavatele',
        supplierDic: 'DIČ dodavatele', issueDate: 'Datum vystavení',
        taxDate: 'DUZP', subtotalHT: 'Základ daně', vatRate: 'Sazba DPH',
        vatAmount: 'DPH', linkPO: 'Navázat na obj.', linkReceipt: 'Navázat na příjemku', attachFile: 'Připojit soubor', viewFile: 'Zobrazit soubor',
        saveInvoice: 'Uložit', paid: 'Zaplaceno', unpaid: 'Nezaplaceno',
        overdue: 'Po splatnosti', viewPDF: 'Zobrazit PDF', export: 'Exportovat',
        bomTitle: 'Kusovníky (BOM)', selectModel: 'Model', qty: 'Mn.',
        bomCost: 'Výrobní náklady', unitPriceCol: 'Jedn. cena', lineTotalCol: 'Celkem',
        quotesTitle: 'Nabídky / Cenové nabídky', totalQuotes: 'Celkem nabídky', newQuote: 'Nová nabídka', validUntil: 'Platnost',
        historyTitle: 'Historie pohybů', historyType: 'Typ',
        historyAll: 'Vše', historyIn: 'Příjmy', historyOut: 'Výdeje', filterByRef: 'Filtrovat podle reference...',
        docNumber: 'Číslo dok.', priceUnit: 'Jedn. cena', value: 'Hodnota',
        partner: 'Partner', entryType: 'PŘÍJEM', exitType: 'VÝDEJ',
        contactsTitle: 'Správa kontaktů', newContact: 'Nový kontakt',
        contactType: 'Typ', contactSupplier: 'Dodavatel', contactClient: 'Zákazník',
        contactBoth: 'Oba', companyName: 'Název firmy', address: 'Adresa',
        ico: 'IČO', dic: 'DIČ', phone: 'Telefon', email: 'Email',
        defaultCurrency: 'Výchozí měna', bankAccount: 'Bankovní účet',
        iban: 'IBAN', bic: 'BIC', contactNotes: 'Poznámky', saveContact: 'Uložit',
        editContact: 'Upravit', deleteContact: 'Smazat', selectContact: 'Vybrat...',
        selectSupplierFirst: 'Vyberte dodavatele', noOrdersForSupplier: 'Žádné objednávky', noReceiptsForSupplier: 'Žádné příjemky',
        deliveryNote: 'DODACÍ LIST', purchaseOrder: 'OBJEDNÁVKA',
        invoice: 'FAKTURA', proforma: 'PROFORMA FAKTURA',
        from: 'Od', to: 'Komu', sender: 'Odesílatel', recipient: 'Příjemce',
        customer: 'Zákazník', quantity: 'Množství', unit: 'Jednotka',
        unitPrice: 'Jedn. cena', totalIncVat: 'CELKEM S DPH',
        invoiceDateLabel: 'Datum vystavení', dueDateLabel: 'Datum splatnosti',
        paymentTerms: 'Platební podmínky', bankDetails: 'Bankovní spojení',
        orderNumber: 'Objednávka č.', orderDate: 'Datum objednávky',
        confirmOrder: 'Prosíme o potvrzení přijetí této objednávky.',
        blNumber: 'DL č.', pieces: 'ks', signatures: 'Podpisy',
        senderSignature: 'Odesílatel', recipientSignature: 'Příjemce',
        confirmDelete: 'Opravdu chcete smazat?', confirmMarkPaid: 'Označit jako zaplaceno?',
        saved: 'Uloženo', deleted: 'Smazáno', error: 'Chyba', success: 'Úspěch',
        noData: 'Žádná data', selectAtLeastOne: 'Vyberte alespoň jednu položku',
        // Received Orders
        navObjPrijate: 'Obj. přijaté', receivedOrdersTitle: 'Přijaté objednávky',
        newReceivedOrder: 'Nová objednávka', clientOrderNum: 'Číslo obj. zákazníka', ticketNumber: 'Číslo tiketu', linkedOrder: 'Propojená objednávka', none: 'Žádná', orderNum: 'Číslo objednávky',
        deliveryDate: 'Datum dodání', recOrdNew: 'Nová', recOrdConfirmed: 'Potvrzeno',
        recOrdDelivered: 'Dodáno', recOrdInvoiced: 'Fakturováno', toDeliver: 'K dodání',
        orderConfirmation: 'Potvrzení objednávky', products: 'Produkty',
        linkedRecOrder: 'Navázat na obj.', paymentMethod: 'Způsob platby',
        confirmOrderStatus: 'Potvrdit', markDelivered: 'Označit dodáno',
        createConfirmation: 'Vytvořit potvrzení',
        // Exchange rate
        exchangeRateDUZP: 'Kurz ČNB k DUZP (EUR/CZK)',
        czkEquivalent: 'Ekvivalent v CZK dle kurzu',
        subtotalCZK: 'Základ daně v CZK', vatCZK: 'DPH v CZK', totalCZK: 'Celkem s DPH v CZK',
        // Auto-refresh
        dataRefreshed: 'Data aktualizována',
        // Tax document
        taxDocTitle: 'DAŇOVÝ DOKLAD K PŘIJATÉ PLATBĚ',
        paymentDate: 'Datum přijetí platby',
        taxableDate: 'Datum zdanitelného plnění',
        generateTaxDoc: 'Vytvořit daňový doklad',
        alreadyPaid: 'JIŽ UHRAZENO',
        exchangeRateLabel: 'Směnný kurz',
        paidByAdvance: 'Uhrazeno zálohami',
        toPay: 'K úhradě',
        // Proforma deduction
        proformaDeduction: 'Odpočet zálohy',
        linkedProforma: 'Záloha',
        proformaTotal: 'Částka zálohy',
        paymentExchangeRate: 'Kurz při platbě zálohy',
        proformaCZK: 'Záloha v CZK',
        remainingToPay: 'Zbývá k úhradě',
        invoiceExchangeRate: 'Kurz faktury (k DUZP)',
        remainingCZK: 'Zbývá v CZK',
        // Stock Adjustments
        navAdjustments: 'Úpravy',
        adjustmentsTitle: 'Úpravy skladu',
        adjustmentTitle: 'Úprava skladu',
        adjustStock: 'Upravit',
        currentQty: 'Současná množství',
        newQty: 'Nové množství',
        qtyBefore: 'Mn. před',
        qtyAfter: 'Mn. po',
        qtyChange: 'Změna',
        changePreview: 'Změna',
        reason: 'Důvod',
        reasonDetails: 'Detaily',
        reasonInventory: 'Fyzická inventura',
        reasonDamage: 'Poškození',
        reasonTheft: 'Krádež/ztráta',
        reasonFound: 'Nalezeno',
        reasonError: 'Oprava chyby',
        reasonObsolete: 'Zastaralé',
        reasonOther: 'Jiné',
        valueImpact: 'Dopad hodnoty',
        userName: 'Uživatel',
        optional: 'Volitelné',
        actions: 'Akce',
        confirmLargeAdjustment: 'POZOR: Velká úprava detekována. Chcete pokračovat?',
        adjustmentSaved: 'Úprava uložena',
        noChangeError: 'Žádná změna množství',
        manufacturers: 'Dodávané značky',
        manufacturersHint: 'Značky/výrobci oddělené čárkami (pro filtrování v objednávkách)',
        manufacturer: 'Výrobce',
        stockComponents: 'Skladové komponenty',
        addStockComponent: 'Komponenta',
        // Repair Quotes
        navRepairQuotes: 'Nabídky oprav',
        repairQuotesTitle: 'Nabídky oprav',
        repairQuote: 'Nabídka opravy',
        newRepairQuote: 'Nová nabídka',
        repairQuoteNumber: 'Číslo nabídky',
        repairQuoteConverted: 'Nabídka převedena na fakturu',
        clientInfo: 'Informace o zákazníkovi',
        pacsList: 'Tepelná čerpadla k opravě',
        addPAC: 'Přidat TČ',
        pacSerial: 'Sériové č. TČ',
        pacModel: 'Model',
        selectModel: 'Vybrat model',
        components: 'Komponenty',
        selectComponent: 'Vybrat komponentu',
        addComponent: 'Přidat komponentu',
        services: 'Služby',
        laborHours: 'Pracovní hodiny',
        refrigerantKg: 'Chladivo (kg)',
        disposalKg: 'Likvidace (kg)',
        pacSubtotal: 'Mezisoučet TČ',
        removePAC: 'Odebrat toto TČ',
        removeComponent: 'Odebrat',
        pricePerUnit: 'Cena/jednotka',
        lineTotal: 'Celkem řádek',
        emptyPACs: 'Žádná TČ nepřidána',
        clickAddPAC: 'Klikněte na "Přidat TČ" pro začátek',
        convertToInvoice: 'Převést na fakturu',
        quoteDate: 'Datum nabídky',
        totalRepairQuotes: 'Celkem nabídky',
        pendingQuotes: 'Čeká',
        acceptedQuotes: 'Přijato',
        warrantyRepairs: 'Záruční opravy',
        repairsUnit: 'oprav',
        companyCosts: 'náklady společnosti',
        fixDuplicates: 'Opravit duplikáty',
        allStatuses: 'Všechny stavy',
        statusPending: 'Čeká',
        statusAccepted: 'Přijato',
        statusRejected: 'Odmítnuto',
        statusInvoiced: 'Fakturováno',
        accept: 'Přijmout',
        confirmAcceptQuote: 'Přijmout tuto nabídku a automaticky vytvořit fakturu?\n\nKomponenty budou odečteny ze skladu.',
        quoteAccepted: 'Nabídka přijata',
        deleteAcceptedQuote: 'Chcete smazat přijatou nabídku, nyní když byla převedena na fakturu?',
        sendEmail: 'Odeslat email',
        emailSent: 'Email odeslán',
        emailError: 'Chyba při odesílání',
        // Preview
        preview: 'Náhled',
        receivedOrderPreview: 'Náhled přijaté objednávky',
        receivedInvoicePreview: 'Náhled přijaté faktury',
        receiptPreview: 'Náhled příjemky',
        stockReceipt: 'Příjemka',
        receivedOrder: 'PŘIJATÁ OBJEDNÁVKA',
        receivedInvoice: 'PŘIJATÁ FAKTURA',
        exchangeRate: 'Směnný kurz',
        deliveryProgress: 'Postup dodávky',
        // Subcontracting
        subcontracting: 'Subdodávka',
        orderNotFound: 'Objednávka nenalezena',
        invalidKitType: 'Neplatný typ sady',
        fillAllFields: 'Vyplňte všechna pole',
        orderUpdated: 'Objednávka aktualizována',
        orderCreated: 'Objednávka vytvořena',
        orderDeleted: 'Objednávka smazána',
        quantityTooHigh: 'Příliš vysoké množství',
        assemblyCost: 'Náklady na montáž',
        totalCost: 'Celkové náklady'
    }
};

function t(key) {
    return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['fr']?.[key] || key;
}

function changeLanguage() {
    currentLang = document.getElementById('languageSelect').value;
    localStorage.setItem('navalo_lang', currentLang);
    updateAllLabels();
    showToast(`${currentLang === 'fr' ? 'Langue: Français' : 'Jazyk: Čeština'}`, 'info');
}

function updateAllLabels() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[currentLang]?.[key]) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[currentLang]?.[key]) el.placeholder = t(key);
    });
    document.getElementById('stockSearch')?.setAttribute('placeholder', t('search'));
    refreshAllData();
}

// ========================================
// INITIALIZATION
// ========================================

// ========================================
// MIGRATION FOR PARTIAL DELIVERIES & RECEIPTS
// ========================================

function migratePurchaseOrdersToPartial() {
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    let migrated = false;

    pos.forEach(po => {
        // Check if migration is needed
        if (!po.deliveredQuantities || !po.remainingQuantities || !po.receipts) {
            migrated = true;

            // Initialize new fields
            po.deliveredQuantities = po.deliveredQuantities || {};
            po.remainingQuantities = po.remainingQuantities || {};
            po.receipts = po.receipts || [];

            const poStatus = (po.status || 'Brouillon').toLowerCase();

            if (poStatus === 'reçu' || po.status === 'Reçu') {
                // Assume full receipt for already received POs
                (po.items || []).forEach(item => {
                    po.deliveredQuantities[item.ref] = item.qty;
                    po.remainingQuantities[item.ref] = 0;
                });
            } else {
                // For draft/sent POs, all quantities are remaining
                (po.items || []).forEach(item => {
                    po.deliveredQuantities[item.ref] = 0;
                    po.remainingQuantities[item.ref] = item.qty;
                });
            }
        }
    });

    if (migrated) {
        localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
        console.log('✓ Migrated purchase orders to support partial receipts');
    }
}

function migrateReceivedOrdersToPartial() {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    let migrated = false;

    orders.forEach(order => {
        // Check if migration is needed
        if (!order.deliveredQuantities || !order.remainingQuantities || !order.deliveries) {
            migrated = true;

            // Initialize new fields
            order.deliveredQuantities = order.deliveredQuantities || {};
            order.remainingQuantities = order.remainingQuantities || {};
            order.deliveries = order.deliveries || [];

            const orderStatus = (order.status || 'new').toLowerCase().trim();

            if (orderStatus === 'delivered') {
                // Assume full delivery for already delivered orders
                Object.keys(order.quantities || {}).forEach(model => {
                    order.deliveredQuantities[model] = order.quantities[model] || 0;
                    order.remainingQuantities[model] = 0;
                });
            } else {
                // For new/confirmed orders, all quantities are remaining
                Object.keys(order.quantities || {}).forEach(model => {
                    order.deliveredQuantities[model] = 0;
                    order.remainingQuantities[model] = order.quantities[model] || 0;
                });
            }
        }
    });

    if (migrated) {
        localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
        console.log('✓ Migrated received orders to support partial deliveries');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    currentLang = localStorage.getItem('navalo_lang') || 'fr';
    document.getElementById('languageSelect').value = currentLang;

    // Initialize dynamic PAC model UI elements
    initializePacModelUI();

    await storage.init();

    // Run migrations for partial deliveries & receipts
    migratePurchaseOrdersToPartial();
    migrateReceivedOrdersToPartial();
    
    const statusEl = document.getElementById('syncStatus');
    if (storage.getMode() === 'googlesheets') {
        statusEl.textContent = '● Google Sheets';
        statusEl.style.color = '#10b981';
    } else {
        statusEl.textContent = `● ${t('modeLocal')}`;
        statusEl.style.color = '#f59e0b';
    }
    
    exchangeRate = storage.getExchangeRate('EUR');
    document.getElementById('exchangeRate').textContent = `EUR: ${exchangeRate.toFixed(2)} CZK`;
    
    currentBomModel = getDefaultPacModel();
    
    await refreshAllData();
    setupNavigation();
    setupForms();
    setupFilters();
    populateSupplierSelects();
    populateClientSelects();
    updateAllLabels();

    // Initialize sync indicator for hybrid mode
    if (storage.isHybridMode()) {
        updateSyncIndicator();
        console.log('⚡ Mode hybride activé - synchronisation automatique toutes les', storage.syncInterval / 1000, 's');
    }

    // Event listener for contact type change (show/hide manufacturers field)
    const contactTypeSelect = document.getElementById('contactType');
    if (contactTypeSelect) {
        contactTypeSelect.addEventListener('change', function() {
            const manufacturersField = document.getElementById('manufacturersFieldGroup');
            const type = this.value;
            if (type === 'supplier' || type === 'both') {
                manufacturersField.style.display = 'block';
            } else {
                manufacturersField.style.display = 'none';
            }
        });
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('entryDate')) document.getElementById('entryDate').value = today;
    if (document.getElementById('entryBonNum')) document.getElementById('entryBonNum').value = await getNextReceiptNumber();

    // Auto-refresh for multi-user sync (every 30 seconds)
    if (storage.getMode() === 'googlesheets') {
        startAutoRefresh();
    }
    if (document.getElementById('deliveryDate')) document.getElementById('deliveryDate').value = today;
});

// ========================================
// DYNAMIC PAC MODEL UI GENERATION
// ========================================

function initializePacModelUI() {
    const models = getPacModels();
    
    // Stock capacity cards
    const stockCapacityContainer = document.getElementById('stockCapacityContainer');
    if (stockCapacityContainer) {
        stockCapacityContainer.innerHTML = models.map(m => 
            `<div class="pac-item"><span>${m.name}</span><span id="capacity-${modelIdToKey(m.id)}">0</span></div>`
        ).join('');
    }
    
    // Delivery cards
    const deliveryCardsContainer = document.getElementById('deliveryCardsContainer');
    if (deliveryCardsContainer) {
        deliveryCardsContainer.innerHTML = models.map(m => {
            const key = modelIdToKey(m.id);
            return `
                <div class="delivery-card">
                    <div class="model-name">${m.name}</div>
                    <div class="model-stock"><span data-i18n="productionCapacity">Capacité</span>: <span id="del-capacity-${key}">0</span></div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="adjustDeliveryQty('${m.id}', -1)">−</button>
                        <input type="number" id="del-qty-${key}" value="0" min="0" onchange="updateBomPreview()">
                        <button class="qty-btn" onclick="adjustDeliveryQty('${m.id}', 1)">+</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // BOM model select
    const bomModelSelect = document.getElementById('bomModelSelect');
    if (bomModelSelect) {
        bomModelSelect.innerHTML = models.map(m => 
            `<option value="${m.id}">${m.name}</option>`
        ).join('');
    }
    
    // Received orders "to deliver" stats
    const recOrderToDeliverContainer = document.getElementById('recOrderToDeliverContainer');
    if (recOrderToDeliverContainer) {
        recOrderToDeliverContainer.innerHTML = models.map(m => 
            `<div class="pac-item"><span>${m.name}</span><span id="recOrder-${modelIdToKey(m.id)}">0</span></div>`
        ).join('');
    }
    
    // Received orders table header - insert model columns before "Hodnota"
    const recOrdersTableHeader = document.getElementById('recOrdersTableHeader');
    if (recOrdersTableHeader) {
        const hodnotaTh = recOrdersTableHeader.querySelector('[data-i18n="totalValue"]');
        if (hodnotaTh) {
            models.forEach(m => {
                const th = document.createElement('th');
                th.textContent = m.name;
                th.className = 'text-center';
                hodnotaTh.parentNode.insertBefore(th, hodnotaTh);
            });
        }
    }
    
    // Received order modal - model inputs
    const recOrdModelsContainer = document.getElementById('recOrdModelsContainer');
    if (recOrdModelsContainer) {
        recOrdModelsContainer.innerHTML = models.map(m => `
            <div class="form-group">
                <label>${m.name}</label>
                <div class="qty-price-row">
                    <input type="number" id="recOrdQty-${m.id}" min="0" value="0" onchange="calculateRecOrdTotal()">
                    <input type="number" id="recOrdPrice-${m.id}" step="0.01" min="0" placeholder="Cena/ks" onchange="calculateRecOrdTotal()">
                </div>
            </div>
        `).join('');
    }
}

// ========================================
// DATA REFRESH
// ========================================

async function refreshAllData() {
    try {
        // Force reload from Google Sheets on first page load
        if (!sessionStorage.getItem('navalo_initial_load_done')) {
            console.log('🔄 Premier chargement - vidage du cache local pour forcer Google Sheets');
            Object.keys(localStorage).filter(k => k.startsWith('navalo_')).forEach(k => {
                // Keep only language preference
                if (k !== 'navalo_lang') {
                    localStorage.removeItem(k);
                }
            });
            sessionStorage.setItem('navalo_initial_load_done', 'true');
        }

        const stockData = await storage.getStockWithValue();
        currentStock = stockData.components || {};
        
        const totalValue = stockData.totalValue || 0;
        document.getElementById('totalStockValue').textContent = `${t('stockValue')}: ${formatCurrency(totalValue)} CZK`;
        document.getElementById('stockValueDisplay').textContent = formatCurrency(totalValue);
        
        // Load component prices from Google Sheets
        try {
            console.log('📦 Storage mode:', storage.getMode());
            if (storage.getMode() === 'googlesheets') {
                const prices = await storage.getComponentPrices();
                console.log('📦 Raw prices response:', prices);
                console.log('📦 Type of prices:', typeof prices);
                if (prices && typeof prices === 'object' && !prices.error) {
                    loadedComponentPrices = prices;
                    console.log('📦 Loaded', Object.keys(loadedComponentPrices).length, 'component prices from Google Sheets');
                    // Debug: show first 3 entries
                    const firstKeys = Object.keys(loadedComponentPrices).slice(0, 3);
                    firstKeys.forEach(k => {
                        console.log(`📦 Price sample - ${k}:`, loadedComponentPrices[k]);
                    });
                } else if (prices && prices.error) {
                    console.error('📦 Error loading prices:', prices.error);
                }
            }
        } catch (e) {
            console.warn('Failed to load component prices:', e);
        }
        
        try {
            currentBom = await storage.getBom();
            if (!currentBom || Object.keys(currentBom).length === 0) {
                currentBom = typeof SAMPLE_BOM !== 'undefined' ? SAMPLE_BOM : {};
            }
        } catch (e) {
            currentBom = typeof SAMPLE_BOM !== 'undefined' ? SAMPLE_BOM : {};
        }
        
        updateStockDisplay();
        await updateHistoryDisplay();
        await updateReceiptsHistoryDisplay();
        await updateDeliveriesDisplay();
        await updatePurchaseOrdersDisplay();
        await updateInvoicesDisplay();
        await updateReceivedInvoicesDisplay();
        await updateReceivedOrdersDisplay();
        await updateAdjustmentsDisplay();
        await updateRepairQuotesDisplay();
        await loadContactsFromStorage();
        updateContactsDisplay();
        updateBomDisplay();
        calculateCapacity();
        updateAlerts();
        updateSuggestedOrders();
        populateLinkedPOSelect();
        populateComponentSelects();
        populateDeliveryOrderSelect(); // Update delivery orders dropdown
    } catch (e) {
        console.error('Refresh error:', e);
    }
}

// ========================================
// STOCK DISPLAY
// ========================================

function updateStockDisplay() {
    const tbody = document.getElementById('stockTableBody');
    const search = (document.getElementById('stockSearch')?.value || '').toLowerCase();
    const filter = document.getElementById('stockFilter')?.value || 'all';

    if (!currentStock) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }

    const pendingQty = {};
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    // Include Brouillon, Envoyé, and Partiel (partial receipts)
    pos.filter(p => p.status === 'Envoyé' || p.status === 'Brouillon' || p.status === 'Partiel').forEach(po => {
        (po.items || []).forEach(item => {
            // Use remainingQuantities instead of total qty
            const remainingQty = po.remainingQuantities?.[item.ref] ?? item.qty;
            if (remainingQty > 0) {
                pendingQty[item.ref] = (pendingQty[item.ref] || 0) + remainingQty;
            }
        });
    });

    // Calculate demand from received orders (not delivered/invoiced)
    const demand = {};
    const receivedOrders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const activeOrders = receivedOrders.filter(o =>
        o.status !== 'delivered' && o.status !== 'invoiced' && o.status !== 'cancelled'
    );

    activeOrders.forEach(order => {
        // Calculate demand from PAC quantities
        if (order.quantities && currentBom) {
            Object.entries(order.quantities).forEach(([model, qty]) => {
                if (qty > 0 && currentBom[model]) {
                    currentBom[model].forEach(bomItem => {
                        const ref = bomItem.ref;
                        const qtyNeeded = bomItem.qty * qty;
                        demand[ref] = (demand[ref] || 0) + qtyNeeded;
                    });
                }
            });
        }

        // Add stockComponents demand
        if (order.stockComponents && Array.isArray(order.stockComponents)) {
            order.stockComponents.forEach(comp => {
                if (comp.ref && comp.qty > 0) {
                    demand[comp.ref] = (demand[comp.ref] || 0) + comp.qty;
                }
            });
        }
    });

    const categories = currentLang === 'cz' ? (CONFIG?.CATEGORIES_CZ || {}) : (CONFIG?.CATEGORIES || {});
    
    let filtered = Object.entries(currentStock).filter(([ref, data]) => {
        const matchSearch = !search || ref.toLowerCase().includes(search) ||
            (data.name && data.name.toLowerCase().includes(search));
        const totalAvail = (data.qty || 0) + (pendingQty[ref] || 0);
        const componentDemand = demand[ref] || 0;
        const shortage = componentDemand - totalAvail;
        const minQty = data.min || 0;

        if (filter === 'low') return matchSearch && shortage > 0;
        if (filter === 'critical') return matchSearch && (data.qty || 0) <= 0;
        return matchSearch;
    });

    tbody.innerHTML = filtered.map(([ref, data]) => {
        const qty = data.qty || 0;
        const onOrder = pendingQty[ref] || 0;
        const componentDemand = demand[ref] || 0;
        const totalAvail = qty + onOrder;
        const shortage = componentDemand - totalAvail;
        const minQty = data.min || 0;
        const value = data.value || 0;
        const cat = categories[data.category] || data.category || '-';

        let statusClass = 'status-ok', statusText = t('statusOk');
        if (qty <= 0) { statusClass = 'status-critical'; statusText = t('statusCritical'); }
        else if (shortage > 0) { statusClass = 'status-low'; statusText = t('statusLow'); }

        const manufacturerDisplay = data.manufacturer || '-';

        // Highlight shortage in red if missing material
        const shortageClass = shortage > 0 ? 'text-error font-bold' : shortage < 0 ? 'text-success' : '';
        const shortageDisplay = shortage > 0 ? `⚠️ ${shortage}` : shortage < 0 ? `✓ ${Math.abs(shortage)}` : '-';

        return `<tr class="${qty <= 0 ? 'row-error' : shortage > 0 ? 'row-warning' : ''}">
            <td><code style="cursor: pointer; color: #2563eb;" onclick="filterHistoryByComponent('${ref}')" title="Voir l'historique">${ref}</code></td>
            <td>${data.name || ref}</td>
            <td class="text-muted">${manufacturerDisplay}</td>
            <td>${cat}</td>
            <td class="text-right font-bold">${qty}</td>
            <td class="text-right ${onOrder > 0 ? 'text-info' : ''}">${onOrder > 0 ? '+' + onOrder : '-'}</td>
            <td class="text-right ${componentDemand > 0 ? 'text-primary font-bold' : ''}">${componentDemand > 0 ? componentDemand : '-'}</td>
            <td class="text-right ${shortageClass}">${shortageDisplay}</td>
            <td class="text-right text-muted">${minQty}</td>
            <td class="text-right">${formatCurrency(value)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-icon" onclick="openAdjustmentModal('${ref}')" title="${t('adjustStock')}">
                    ⚙️
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ========================================
// HISTORY DISPLAY
// ========================================

async function updateHistoryDisplay() {
    try {
        console.log('=== updateHistoryDisplay START ===');
        const history = await storage.getHistory(200);
        console.log('Raw history data length:', history?.length || 0);

        const tbody = document.getElementById('historyTableBody');
        if (!tbody) {
            console.log('ERROR: historyTableBody element not found!');
            return;
        }

        const typeFilter = document.getElementById('historyType')?.value || 'all';
        const componentFilterInput = document.getElementById('historyComponentFilter');
        const componentFilter = (componentFilterInput?.value || '').trim();

        console.log('Filter input element exists:', !!componentFilterInput);
        console.log('Filter input value:', componentFilterInput?.value);
        console.log('Type filter:', typeFilter);
        console.log('Component filter (trimmed):', componentFilter);

        let filtered = Array.isArray(history) ? history : [];
        console.log('Initial filtered length:', filtered.length);

        // Log first few entries to see data structure
        if (filtered.length > 0) {
            console.log('Sample history entry:', JSON.stringify(filtered[0], null, 2));
            console.log('First 5 refs:', filtered.slice(0, 5).map(h => h.ref));
        }

        // Filter by type
        if (typeFilter !== 'all') {
            const beforeLength = filtered.length;
            filtered = filtered.filter(h => h.type === typeFilter);
            console.log(`Type filter: ${beforeLength} → ${filtered.length}`);
        }

        // Filter by component reference (case-insensitive)
        if (componentFilter) {
            const filterLower = componentFilter.toLowerCase();
            console.log('Filtering by:', filterLower);

            const beforeLength = filtered.length;
            filtered = filtered.filter(h => {
                // Convert to string first to handle numbers or other types
                const ref = String(h.ref || '').toLowerCase();
                const name = String(h.name || '').toLowerCase();
                const matches = ref.includes(filterLower) || name.includes(filterLower);

                // Log first few matches/non-matches for debugging
                if (beforeLength <= 10 || matches) {
                    console.log(`Checking: ref="${h.ref}" name="${h.name}" matches=${matches}`);
                }

                return matches;
            });
            console.log(`Component filter: ${beforeLength} → ${filtered.length}`);
        }

        console.log('Final filtered length:', filtered.length);

        if (filtered.length === 0) {
            console.log('No results after filtering');
            tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }

        const displayCount = Math.min(filtered.length, 100);
        console.log(`Rendering ${displayCount} rows`);

        tbody.innerHTML = filtered.slice(0, 100).map(h => {
            const typeLabel = h.type === 'ENTRÉE' ? t('entryType') : t('exitType');
            return `<tr>
                <td>${formatDate(h.date)}</td>
                <td><span class="type-badge ${h.type === 'ENTRÉE' ? 'type-in' : 'type-out'}">${typeLabel}</span></td>
                <td>${h.docNum || '-'}</td>
                <td><code>${h.ref}</code></td>
                <td class="font-bold">${h.qty > 0 ? '+' + h.qty : h.qty}</td>
                <td>${formatCurrency(h.priceUnit || 0)}</td>
                <td>${formatCurrency(h.value || 0)}</td>
                <td>${h.partner || '-'}</td>
            </tr>`;
        }).join('');

        console.log('=== updateHistoryDisplay END ===');
    } catch (e) {
        console.error('History error:', e);
        console.error('Error stack:', e.stack);
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">Erreur: ${e.message}</td></tr>`;
        }
    }
}

function filterHistoryByComponent(ref) {
    // Switch to history tab
    const historyTab = document.querySelector('[data-tab="historique"]');
    if (historyTab) {
        historyTab.click();
    }

    // Set the filter
    const filterInput = document.getElementById('historyComponentFilter');
    if (filterInput) {
        filterInput.value = ref;
    }

    // Update display
    setTimeout(() => {
        updateHistoryDisplay();
        // Scroll to top of history table
        const historySection = document.getElementById('tab-historique');
        if (historySection) {
            historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// ========================================
// CONTACTS MANAGEMENT
// ========================================

// Contacts are now loaded from Google Sheets via currentContacts variable
let currentContacts = [];

function getContacts() {
    return currentContacts.length > 0 ? currentContacts : JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
}

async function loadContactsFromStorage() {
    try {
        console.log('📇 Loading contacts, storage mode:', storage.getMode());
        const contacts = await storage.getContacts();
        console.log('📇 Raw contacts response:', contacts);
        if (contacts && Array.isArray(contacts)) {
            currentContacts = contacts;
            // Also save to localStorage as backup
            localStorage.setItem('navalo_contacts', JSON.stringify(contacts));
            console.log('📇 Loaded', contacts.length, 'contacts from Google Sheets');
            if (contacts.length > 0) {
                console.log('📇 First contact:', contacts[0]);
            }
        } else if (contacts && contacts.error) {
            console.error('📇 Error from API:', contacts.error);
        }
    } catch (e) {
        console.warn('📇 Failed to load contacts from Google Sheets:', e);
        currentContacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
    }
    return currentContacts;
}

async function saveContactToStorage(contact) {
    try {
        console.log('📇 Saving contact:', contact);
        const result = await storage.saveContact(contact);
        console.log('📇 Save result:', result);
        if (result && result.success) {
            // Refresh contacts from server
            await loadContactsFromStorage();
            return result;
        }
        return result;
    } catch (e) {
        console.error('📇 Failed to save contact to Google Sheets:', e);
        // Fallback to localStorage
        let contacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
        if (contact.id) {
            const index = contacts.findIndex(c => c.id === contact.id);
            if (index >= 0) contacts[index] = contact;
            else contacts.unshift(contact);
        } else {
            contact.id = 'CONTACT-' + Date.now();
            contacts.unshift(contact);
        }
        localStorage.setItem('navalo_contacts', JSON.stringify(contacts));
        currentContacts = contacts;
        return { success: true, id: contact.id };
    }
}

function openContactModal(type = 'supplier') {
    editingContactId = null;
    document.getElementById('contactModalTitle').textContent = t('newContact');
    document.getElementById('contactForm').reset();
    document.getElementById('contactType').value = type;
    // Show manufacturers field for suppliers
    const manufacturersField = document.getElementById('manufacturersFieldGroup');
    if (type === 'supplier' || type === 'both') {
        manufacturersField.style.display = 'block';
    } else {
        manufacturersField.style.display = 'none';
    }
    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
    editingContactId = null;
}

function editContact(id) {
    const contacts = getContacts();
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    editingContactId = id;
    document.getElementById('contactModalTitle').textContent = t('editContact');
    document.getElementById('contactType').value = contact.type || 'supplier';
    document.getElementById('contactName').value = contact.name || '';
    document.getElementById('contactAddress').value = contact.address || '';
    document.getElementById('contactIco').value = contact.ico || '';
    document.getElementById('contactDic').value = contact.dic || '';
    document.getElementById('contactPhone').value = contact.phone || '';
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactCurrency').value = contact.currency || 'EUR';
    document.getElementById('contactBankAccount').value = contact.bankAccount || '';
    document.getElementById('contactIban').value = contact.iban || '';
    document.getElementById('contactBic').value = contact.bic || '';
    document.getElementById('contactNotes').value = contact.notes || '';
    document.getElementById('contactManufacturers').value = contact.manufacturers || '';
    // Show manufacturers field for suppliers
    const manufacturersField = document.getElementById('manufacturersFieldGroup');
    const type = contact.type || 'supplier';
    if (type === 'supplier' || type === 'both') {
        manufacturersField.style.display = 'block';
    } else {
        manufacturersField.style.display = 'none';
    }
    document.getElementById('contactModal').classList.add('active');
}

async function saveContact() {
    const type = document.getElementById('contactType').value;
    const contact = {
        id: editingContactId || null,
        type: type,
        name: document.getElementById('contactName').value,
        address: document.getElementById('contactAddress').value,
        ico: document.getElementById('contactIco').value,
        dic: document.getElementById('contactDic').value,
        phone: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmail').value,
        currency: document.getElementById('contactCurrency').value,
        bankAccount: document.getElementById('contactBankAccount').value,
        iban: document.getElementById('contactIban').value,
        bic: document.getElementById('contactBic').value,
        notes: document.getElementById('contactNotes').value,
        manufacturers: (type === 'supplier' || type === 'both') ? document.getElementById('contactManufacturers').value : '',
        updatedAt: new Date().toISOString()
    };

    if (!contact.name) { showToast(t('error'), 'error'); return; }

    // If editing, preserve createdAt
    if (editingContactId) {
        const existingContact = getContacts().find(c => c.id === editingContactId);
        if (existingContact) contact.createdAt = existingContact.createdAt;
    } else {
        contact.createdAt = new Date().toISOString();
    }

    try {
        const result = await saveContactToStorage(contact);
        if (result && result.success) {
            closeContactModal();
            updateContactsDisplay();
            populateSupplierSelects();
            populateClientSelects();
            showToast(t('saved'), 'success');
        } else {
            showToast(t('error'), 'error');
        }
    } catch (e) {
        console.error('Error saving contact:', e);
        showToast(t('error'), 'error');
    }
}

async function deleteContact(id) {
    if (!confirm(t('confirmDelete'))) return;

    try {
        const result = await storage.deleteContact(id);
        if (result && result.success) {
            await loadContactsFromStorage();
        } else {
            // Fallback: remove from local storage
            let contacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
            contacts = contacts.filter(c => c.id !== id);
            localStorage.setItem('navalo_contacts', JSON.stringify(contacts));
            currentContacts = contacts;
        }
        updateContactsDisplay();
        populateSupplierSelects();
        populateClientSelects();
        showToast(t('deleted'), 'success');
    } catch (e) {
        console.error('Error deleting contact:', e);
        // Fallback to local deletion
        let contacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
        contacts = contacts.filter(c => c.id !== id);
        localStorage.setItem('navalo_contacts', JSON.stringify(contacts));
        currentContacts = contacts;
        updateContactsDisplay();
        populateSupplierSelects();
        populateClientSelects();
        showToast(t('deleted'), 'success');
    }
}

function updateContactsDisplay() {
    const contacts = getContacts();
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;
    
    if (contacts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = contacts.map(c => {
        const typeLabel = c.type === 'supplier' ? t('contactSupplier') : c.type === 'client' ? t('contactClient') : t('contactBoth');
        return `<tr>
            <td><strong>${c.name}</strong></td>
            <td><span class="badge ${c.type === 'supplier' ? 'badge-info' : 'badge-success'}">${typeLabel}</span></td>
            <td>${c.ico || '-'}</td>
            <td>${c.dic || '-'}</td>
            <td>${c.currency || '-'}</td>
            <td class="text-muted">${c.address ? c.address.substring(0, 30) + '...' : '-'}</td>
            <td>
                <button class="btn-icon" onclick="editContact('${c.id}')" title="${t('edit')}">✏️</button>
                <button class="btn-icon" onclick="deleteContact('${c.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function populateSupplierSelects() {
    const contacts = getContacts().filter(c => c.type === 'supplier' || c.type === 'both');
    const defaultSuppliers = CONFIG?.SUPPLIERS || [];
    
    ['entrySupplier', 'poSupplier', 'recInvSupplier'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = `<option value="">${t('selectContact')}</option>`;
        
        if (contacts.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = t('contactsTitle');
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                opt.dataset.currency = c.currency;
                opt.dataset.ico = c.ico || '';
                opt.dataset.dic = c.dic || '';
                opt.dataset.address = c.address || '';
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }
        
        const defaultGroup = document.createElement('optgroup');
        defaultGroup.label = currentLang === 'cz' ? 'Předdefinovaní' : 'Prédéfinis';
        defaultSuppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = s.name;
            opt.dataset.currency = s.currency;
            defaultGroup.appendChild(opt);
        });
        select.appendChild(defaultGroup);
        if (currentValue) select.value = currentValue;
    });
}

function populateClientSelects() {
    const contacts = getContacts().filter(c => c.type === 'client' || c.type === 'both');
    const defaultClient = CONFIG?.DEFAULT_CLIENT;
    const select = document.getElementById('deliveryClient');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = `<option value="">${t('selectContact')}</option>`;
    
    if (defaultClient) {
        const opt = document.createElement('option');
        opt.value = defaultClient.name;
        opt.textContent = defaultClient.name;
        opt.dataset.address = defaultClient.address;
        opt.dataset.ico = defaultClient.ico;
        opt.dataset.dic = defaultClient.dic;
        select.appendChild(opt);
    }
    
    contacts.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        opt.dataset.address = c.address || '';
        opt.dataset.ico = c.ico || '';
        opt.dataset.dic = c.dic || '';
        select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
    
    // Also populate linked orders select
    populateDeliveryOrderSelect();
}

function onDeliveryClientChange() {
    const select = document.getElementById('deliveryClient');
    const opt = select.options[select.selectedIndex];
    if (opt?.dataset?.address) {
        document.getElementById('deliveryClientAddress').value = opt.dataset.address;
    }
}

function onSupplierChange(selectId) {
    const select = document.getElementById(selectId);
    const opt = select.options[select.selectedIndex];
    const supplierName = select.value;
    
    if (selectId === 'recInvSupplier' && opt) {
        if (opt.dataset.ico) document.getElementById('recInvSupplierIco').value = opt.dataset.ico;
        if (opt.dataset.dic) document.getElementById('recInvSupplierDic').value = opt.dataset.dic;
    }
    if (selectId === 'entrySupplier' && opt?.dataset?.currency) {
        document.getElementById('entryCurrency').value = opt.dataset.currency;
    }
    if (selectId === 'poSupplier') {
        if (opt?.dataset?.currency) {
            document.getElementById('poCurrency').value = opt.dataset.currency;
            onPOCurrencyChange();
        }
        // Filter components by selected supplier
        populateComponentSelectsBySupplier('poItems', supplierName);
    }
}

// Populate component selects filtered by supplier/manufacturer
function populateComponentSelectsBySupplier(containerId, supplierName) {
    if (!currentStock) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    console.log('🔍 Filtering components for supplier:', supplierName);

    container.querySelectorAll('.item-ref').forEach(select => {
        const current = select.value;
        select.innerHTML = `<option value="">${t('refPlaceholder')}</option>`;

        // Filter components by manufacturer if supplier is selected
        let components = Object.entries(currentStock).sort((a, b) => a[0].localeCompare(b[0]));
        const totalBefore = components.length;

        if (supplierName) {
            // Get the contact to check if it has manufacturers specified
            const contacts = getContacts();
            const contact = contacts.find(c => c.name === supplierName);
            const contactManufacturers = contact && contact.manufacturers ?
                contact.manufacturers.split(',').map(m => m.trim().toLowerCase()).filter(m => m) :
                [];

            console.log('  → Contact manufacturers:', contactManufacturers.length > 0 ? contactManufacturers : 'none specified');

            const supplierLower = supplierName.toLowerCase();
            components = components.filter(([ref, data]) => {
                const manufacturer = String(data.manufacturer || '').toLowerCase().trim();
                const name = String(data.name || '').toLowerCase();

                // If contact has manufacturers specified, use that list
                if (contactManufacturers.length > 0) {
                    // Include components without manufacturer (generic items)
                    if (!manufacturer) {
                        return true;
                    }
                    // Include components matching the specified manufacturers
                    return contactManufacturers.some(cm =>
                        manufacturer.includes(cm) || cm.includes(manufacturer)
                    );
                }

                // If no manufacturers specified in contact, use strict matching
                // Only include components that match the supplier name in manufacturer or name
                if (!manufacturer) {
                    // Don't include ALL empty manufacturers - only if name contains supplier
                    return name.includes(supplierLower);
                }

                return manufacturer.includes(supplierLower) ||
                       supplierLower.includes(manufacturer) ||
                       name.includes(supplierLower);
            });

            console.log(`  → Filtered from ${totalBefore} to ${components.length} components`);
            console.log('  → Sample manufacturers:', components.slice(0, 5).map(([r, d]) => d.manufacturer || '(vide)'));
        }

        components.forEach(([ref, data]) => {
            const opt = document.createElement('option');
            opt.value = ref;
            const price = getComponentPrice(ref, 'EUR');
            const priceStr = price ? ` (${formatCurrency(price)} €)` : '';
            const manufacturer = data.manufacturer ? ` [${data.manufacturer}]` : '';
            opt.textContent = `${ref} - ${data.name || ref}${manufacturer}${priceStr}`;
            select.appendChild(opt);
        });

        if (current) select.value = current;
    });
}

// ========================================
// DELIVERY - NO FIFO VALUE ON BL
// ========================================

function adjustDeliveryQty(modelId, delta) {
    const key = modelIdToKey(modelId);
    const input = document.getElementById(`del-qty-${key}`);
    if (input) {
        input.value = Math.max(0, parseInt(input.value || 0) + delta);
        updateBomPreview();
    }
}

function updateBomPreview() {
    const quantities = getDeliveryQuantities();
    
    const hasDelivery = Object.values(quantities).some(q => q > 0);
    const section = document.getElementById('bomPreviewSection');
    
    if (!hasDelivery) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    
    const required = {};
    Object.entries(quantities).forEach(([modelId, qty]) => {
        if (qty <= 0) return;
        (currentBom[modelId] || []).forEach(item => {
            if (!required[item.ref]) {
                required[item.ref] = { name: item.name, qty: 0, available: currentStock[item.ref]?.qty || 0 };
            }
            required[item.ref].qty += item.qty * qty;
        });
    });
    
    const errors = Object.entries(required).filter(([_, d]) => d.available < d.qty);
    
    document.getElementById('bomPreviewContent').innerHTML = `
        ${errors.length > 0 ? `<div class="alert alert-error">⚠️ ${t('insufficientStock')}</div>` : ''}
        <table class="data-table compact">
            <thead><tr><th>${t('component')}</th><th>${t('required')}</th><th>${t('available')}</th><th>${t('status')}</th></tr></thead>
            <tbody>
                ${Object.entries(required).map(([ref, d]) => {
                    const ok = d.available >= d.qty;
                    return `<tr class="${ok ? '' : 'row-error'}">
                        <td>${d.name}</td><td>${d.qty}</td><td>${d.available}</td>
                        <td><span class="status-badge ${ok ? 'status-ok' : 'status-critical'}">${ok ? 'OK' : t('missing')}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function processDelivery() {
    const items = getDeliveryItems();

    // Check if at least one item is selected
    const hasPac = Object.values(items.pac).some(q => q > 0);
    const hasComponents = items.components.length > 0;
    const hasCustom = items.custom.length > 0;

    if (!hasPac && !hasComponents && !hasCustom) {
        showToast('Veuillez sélectionner au moins un article à livrer', 'error');
        return;
    }

    const linkedOrderId = document.getElementById('deliveryLinkedOrder')?.value || '';

    // Validate partial delivery if order is linked (only for PAC)
    if (linkedOrderId && hasPac) {
        const validation = storage.validatePartialDelivery(linkedOrderId, items.pac);
        if (!validation.valid) {
            showToast('Livraison impossible: ' + validation.errors.join('; '), 'error');
            return;
        }
    }

    const clientSelect = document.getElementById('deliveryClient');
    // Get client name from selected option, or use fallback stored in data attribute
    let clientName = clientSelect?.selectedOptions[0]?.text || '';
    if (!clientName || clientName === (t('selectContact') || '-- Sélectionner --')) {
        clientName = clientSelect?.dataset?.clientNameFallback || '';
    }
    const clientId = clientSelect?.value || '';

    console.log('processDelivery - clientName:', clientName, 'clientId:', clientId);

    // Get repair quote data if this delivery is created from a repair quote
    let repairQuoteData = null;
    const deliveryForm = document.getElementById('tab-sorties');
    if (deliveryForm?.dataset?.repairQuoteData) {
        try {
            repairQuoteData = JSON.parse(deliveryForm.dataset.repairQuoteData);
        } catch (e) {
            console.warn('Could not parse repairQuoteData:', e);
        }
    }

    const data = {
        client: clientName,
        clientId: clientId,
        clientAddress: document.getElementById('deliveryClientAddress').value,
        date: document.getElementById('deliveryDate').value,
        linkedOrderId,
        clientOrderNumber: document.getElementById('deliveryClientOrderNum')?.value || '',
        items, // Pass all items: { pac: {}, components: [], custom: [] }
        repairQuoteData // Pass repair quote data if available
    };

    try {
        const result = await storage.processDelivery(data);
        if (result.success) {
            const totalItems = result.totalPac + result.totalComponents + result.totalCustom;
            showToast(`BL ${result.blNumber} - ${totalItems} articles livrés`, 'success');
            currentDelivery = { ...data, blNumber: result.blNumber, value: result.totalValue, repairQuoteData };
            showDeliveryNote(currentDelivery);
            clearDeliveryForm();
            await refreshAllData();
        } else {
            if (result.errors) {
                const errorMsg = result.errors.map(e => `${e.name}: requis ${e.required}, disponible ${e.available}`).join('\n');
                showToast('Stock insuffisant:\n' + errorMsg, 'error');
            } else {
                showToast(t('insufficientStock'), 'error');
            }
        }
    } catch (e) {
        console.error('Delivery error:', e);
        showToast(t('error') + ': ' + e.message, 'error');
    }
}

// ========================================
// DELIVERY - FLEXIBLE ITEMS (Components + Custom)
// ========================================

function addDeliveryComponentRow(ref = '', qty = '', componentName = '') {
    const container = document.getElementById('deliveryComponentsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;';

    // Create select with stock components
    const select = document.createElement('select');
    select.className = 'item-ref';
    select.style.flex = '2';
    select.innerHTML = `<option value="">Sélectionner un composant...</option>`;

    // Check if ref exists in current stock
    let refFoundInStock = false;

    // Populate with current stock
    Object.entries(currentStock || {}).forEach(([compRef, data]) => {
        const opt = document.createElement('option');
        opt.value = compRef;
        opt.textContent = `${data.name || compRef} (Stock: ${data.qty || 0})`;
        opt.dataset.available = data.qty || 0;
        select.appendChild(opt);
        if (compRef === ref) {
            refFoundInStock = true;
        }
    });

    // If ref is provided but not found in stock, add it as an option anyway
    if (ref && !refFoundInStock) {
        const opt = document.createElement('option');
        opt.value = ref;
        opt.textContent = `${componentName || ref} (non trouvé en stock)`;
        opt.dataset.available = 0;
        select.appendChild(opt);
        console.warn(`Component ${ref} not found in currentStock, added manually`);
    }

    if (ref) select.value = ref;

    // Create quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'item-qty';
    qtyInput.placeholder = 'Qté';
    qtyInput.min = '1';
    qtyInput.style.flex = '1';
    qtyInput.value = qty || '';

    // Update max based on selected component
    select.addEventListener('change', function() {
        const selectedOpt = this.options[this.selectedIndex];
        const available = selectedOpt.dataset.available || 0;
        qtyInput.max = available;
        qtyInput.placeholder = `Max: ${available}`;
    });

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-icon btn-remove';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => row.remove();

    row.appendChild(select);
    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

function addDeliveryCustomItemRow(name = '', qty = '') {
    const container = document.getElementById('deliveryCustomItemsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;';

    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'item-custom-name';
    nameInput.placeholder = 'Description (ex: Entretien machine TX9)';
    nameInput.style.flex = '2';
    nameInput.value = name || '';

    // Quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'item-qty';
    qtyInput.placeholder = 'Qté';
    qtyInput.min = '1';
    qtyInput.style.flex = '1';
    qtyInput.value = qty || '';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-icon btn-remove';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => row.remove();

    row.appendChild(nameInput);
    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

function getDeliveryItems() {
    const items = {
        pac: {},
        components: [],
        custom: []
    };

    // Get PAC quantities (existing)
    getPacModels().forEach(m => {
        const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
        const qty = parseInt(input?.value || 0);
        if (qty > 0) {
            items.pac[m.id] = qty;
        }
    });

    // Get stock components
    const componentRows = document.querySelectorAll('#deliveryComponentsContainer .item-row');
    componentRows.forEach(row => {
        const select = row.querySelector('.item-ref');
        const qtyInput = row.querySelector('.item-qty');
        const ref = select?.value;
        const qty = parseInt(qtyInput?.value || 0);

        if (ref && qty > 0) {
            const opt = select.options[select.selectedIndex];
            items.components.push({
                ref,
                name: opt.textContent.split(' (Stock:')[0],
                qty
            });
        }
    });

    // Get custom items
    const customRows = document.querySelectorAll('#deliveryCustomItemsContainer .item-row');
    customRows.forEach(row => {
        const nameInput = row.querySelector('.item-custom-name');
        const qtyInput = row.querySelector('.item-qty');
        const name = nameInput?.value.trim();
        const qty = parseInt(qtyInput?.value || 0);

        if (name && qty > 0) {
            items.custom.push({ name, qty });
        }
    });

    return items;
}

function clearDeliveryForm() {
    getPacModels().forEach(m => {
        const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
        if (input) input.value = 0;
    });
    document.getElementById('bomPreviewSection').style.display = 'none';
    document.getElementById('deliveryLinkedOrder').value = '';
    document.getElementById('deliveryClientOrderNum').value = '';

    // Clear component and custom item rows
    document.getElementById('deliveryComponentsContainer').innerHTML = '';
    document.getElementById('deliveryCustomItemsContainer').innerHTML = '';

    // Clear repair quote data
    const deliveryForm = document.getElementById('tab-sorties');
    if (deliveryForm) {
        delete deliveryForm.dataset.repairQuoteData;
    }

    // Clear client fallback
    const clientSelect = document.getElementById('deliveryClient');
    if (clientSelect) {
        delete clientSelect.dataset.clientNameFallback;
    }

    // Hide order status
    const statusDiv = document.getElementById('deliveryOrderStatus');
    if (statusDiv) statusDiv.style.display = 'none';
}

async function deleteDelivery(id) {
    if (!confirm(t('confirmDelete'))) return;

    // Find the delivery to restore stock
    let deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
    const delivery = deliveries.find(d => d.id === id);

    // Reconstruct quantities from delivery record (declared outside if block for scope)
    const quantities = {};
    if (delivery) {
        if (delivery.tx9 > 0) quantities['TX9'] = delivery.tx9;
        if (delivery.tx12_3ph > 0) quantities['TX12-3PH'] = delivery.tx12_3ph;
        if (delivery.tx12_1ph > 0) quantities['TX12-1PH'] = delivery.tx12_1ph;
        if (delivery.th11 > 0) quantities['TH11'] = delivery.th11;

        // Also check for quantities object (if stored directly)
        if (delivery.quantities) {
            Object.entries(delivery.quantities).forEach(([model, qty]) => {
                if (qty > 0) quantities[model] = qty;
            });
        }
    }

    // Delete from Google Sheets FIRST if connected (server-side stock restore)
    if (storage.getMode() === 'googlesheets') {
        try {
            const restoreData = { id };
            if (delivery) {
                restoreData.quantities = quantities;
                restoreData.blNumber = delivery.blNumber;
            }
            await storage.deleteDelivery(restoreData);
        } catch (e) {
            console.warn('Failed to delete delivery from Google Sheets:', e);
        }
    } else if (delivery) {
        // Local mode only: restore stock using BOM
        const bom = currentBom || JSON.parse(localStorage.getItem('navalo_bom') || '{}');
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');

        Object.entries(quantities).forEach(([model, qty]) => {
            const bomItems = bom[model] || [];
            bomItems.forEach(item => {
                if (stock[item.ref]) {
                    stock[item.ref].qty = (stock[item.ref].qty || 0) + (item.qty * qty);
                } else {
                    stock[item.ref] = { qty: item.qty * qty, name: item.name };
                }
            });
        });

        localStorage.setItem('navalo_stock', JSON.stringify(stock));
    }

    // Remove history entries for this delivery's BL number (local)
    if (delivery && delivery.blNumber) {
        let history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        history = history.filter(h => h.docNum !== delivery.blNumber);
        localStorage.setItem('navalo_history', JSON.stringify(history));
    }

    // Delete from localStorage
    deliveries = deliveries.filter(d => d.id !== id);
    localStorage.setItem('navalo_deliveries', JSON.stringify(deliveries));
    await refreshAllData();
    showToast(t('deleted'), 'success');
}

function populateDeliveryOrderSelect() {
    const select = document.getElementById('deliveryLinkedOrder');
    if (!select) {
        console.warn('deliveryLinkedOrder select not found');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    console.log('📋 Loading orders for delivery dropdown:', orders.length);
    select.innerHTML = `<option value="">${t('none')}</option>`;

    let needsSave = false;

    // Filter: show only orders with remaining quantities > 0 OR status is not delivered
    orders.forEach(order => {
        // Initialize remaining quantities if not present (retrocompatibility)
        if (!order.remainingQuantities) {
            order.remainingQuantities = { ...order.quantities };
            needsSave = true;
        }
        if (!order.deliveredQuantities) {
            order.deliveredQuantities = {};
            needsSave = true;
        }
        if (!order.deliveries) {
            order.deliveries = [];
            needsSave = true;
        }

        // Check if there are remaining quantities OR order is not fully delivered
        const hasRemaining = Object.values(order.remainingQuantities || {}).some(q => q > 0);
        const notDelivered = order.status !== 'delivered' && !order.delivered;

        console.log(`📋 Order ${order.orderNumber}: hasRemaining=${hasRemaining}, notDelivered=${notDelivered}, status=${order.status}, remaining:`, order.remainingQuantities);

        if (hasRemaining || notDelivered) {
            const opt = document.createElement('option');
            opt.value = order.id;
            opt.dataset.client = order.client;
            opt.dataset.address = order.address;
            opt.dataset.clientOrderNumber = order.clientOrderNumber || '';
            opt.dataset.quantities = JSON.stringify(order.quantities || {});
            opt.dataset.remainingQuantities = JSON.stringify(order.remainingQuantities || {});
            opt.dataset.deliveredQuantities = JSON.stringify(order.deliveredQuantities || {});

            // Build progression display: "OP2026001 - Client [TX9:2/5, TX12-3PH:0/3]"
            const progressParts = [];
            Object.keys(order.quantities || {}).forEach(model => {
                const total = order.quantities[model] || 0;
                const delivered = (order.deliveredQuantities || {})[model] || 0;
                if (total > 0) {
                    progressParts.push(`${model}:${delivered}/${total}`);
                }
            });

            const progressText = progressParts.length > 0 ? ` [${progressParts.join(', ')}]` : '';
            opt.textContent = `${order.orderNumber} - ${order.client}${progressText}`;

            select.appendChild(opt);
        }
    });

    // Save changes if any orders were initialized
    if (needsSave) {
        localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
        console.log('✅ Orders initialized with partial delivery fields');
    }
}

function onDeliveryOrderChange() {
    const select = document.getElementById('deliveryLinkedOrder');
    const opt = select.options[select.selectedIndex];

    if (opt && opt.value) {
        // Get full order data from localStorage
        const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const order = orders.find(o => o.id === opt.value);

        // Pre-fill client info
        if (opt.dataset.client) {
            document.getElementById('deliveryClient').value = opt.dataset.client;
            onDeliveryClientChange();
        }
        if (opt.dataset.address) {
            document.getElementById('deliveryClientAddress').value = opt.dataset.address;
        }
        if (opt.dataset.clientOrderNumber) {
            document.getElementById('deliveryClientOrderNum').value = opt.dataset.clientOrderNumber;
        }

        // Pre-fill stock components from order
        if (order && order.stockComponents && order.stockComponents.length > 0) {
            // Clear existing components
            document.getElementById('deliveryComponentsContainer').innerHTML = '';
            // Add each component
            order.stockComponents.forEach(item => {
                addDeliveryComponentRow(item.ref, item.qty);
            });
        } else {
            // Clear if no components
            document.getElementById('deliveryComponentsContainer').innerHTML = '';
        }

        // Pre-fill custom items from order
        if (order && order.customItems && order.customItems.length > 0) {
            // Clear existing items
            document.getElementById('deliveryCustomItemsContainer').innerHTML = '';
            // Add each item
            order.customItems.forEach(item => {
                addDeliveryCustomItemRow(item.name, item.qty);
            });
        } else {
            // Clear if no items
            document.getElementById('deliveryCustomItemsContainer').innerHTML = '';
        }

        // Pre-fill quantities with REMAINING quantities instead of total quantities
        try {
            const remainingQuantities = JSON.parse(opt.dataset.remainingQuantities || '{}');
            const deliveredQuantities = JSON.parse(opt.dataset.deliveredQuantities || '{}');

            getPacModels().forEach(m => {
                const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
                if (input) {
                    const remaining = remainingQuantities[m.id] || 0;
                    const delivered = deliveredQuantities[m.id] || 0;

                    // Pre-fill with remaining quantity
                    input.value = remaining;

                    // Set max attribute to prevent over-delivery
                    input.setAttribute('max', remaining);
                }
            });

            // Show delivery status info
            const statusDiv = document.getElementById('deliveryOrderStatus');
            const statusContent = document.getElementById('deliveryOrderStatusContent');
            if (statusDiv && statusContent) {
                let statusHtml = '<div class="partial-delivery-info">';
                statusHtml += '<strong>Restant à livrer:</strong> ';
                const remainingParts = [];
                Object.entries(remainingQuantities).forEach(([model, qty]) => {
                    if (qty > 0) {
                        remainingParts.push(`${model}: ${qty}`);
                    }
                });
                statusHtml += remainingParts.join(', ') || 'Aucun';

                if (Object.keys(deliveredQuantities).length > 0) {
                    statusHtml += '<br><strong>Déjà livré:</strong> ';
                    const deliveredParts = [];
                    Object.entries(deliveredQuantities).forEach(([model, qty]) => {
                        if (qty > 0) {
                            deliveredParts.push(`${model}: ${qty}`);
                        }
                    });
                    statusHtml += deliveredParts.join(', ');
                }
                statusHtml += '</div>';

                statusContent.innerHTML = statusHtml;
                statusDiv.style.display = 'block';
            }

            updateBomPreview();
        } catch(e) {
            console.error('Error in onDeliveryOrderChange:', e);
        }
    } else {
        // Clear status info when no order selected
        const statusDiv = document.getElementById('deliveryOrderStatus');
        if (statusDiv) {
            statusDiv.style.display = 'none';
        }
        // Remove max attributes
        getPacModels().forEach(m => {
            const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
            if (input) {
                input.removeAttribute('max');
            }
        });
    }
}

async function viewDelivery(id) {
    const deliveries = await storage.getDeliveries(100);
    const d = deliveries.find(x => x.id === id);
    if (d) {
        // Support new format (items) and old format (quantities)
        if (!d.items && !d.quantities) {
            // Build quantities from old field names for backwards compatibility
            const quantities = {};
            if (d.tx9 !== undefined) quantities['TX9'] = d.tx9;
            if (d.tx12_3ph !== undefined) quantities['TX12-3PH'] = d.tx12_3ph;
            if (d.tx12_1ph !== undefined) quantities['TX12-1PH'] = d.tx12_1ph;
            if (d.th11 !== undefined) quantities['TH11'] = d.th11;
            d.quantities = quantities;
        }
        currentDelivery = d;
        showDeliveryNote(currentDelivery);
    }
}

function showDeliveryNote(d) {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };
    const pcs = t('pieces');

    // Get linked order info if available
    let orderInfo = '';
    if (d.linkedOrderNumber || d.clientOrderNumber) {
        orderInfo = `<p><strong>${t('clientOrderNum')}:</strong> ${d.clientOrderNumber || d.linkedOrderNumber}</p>`;
    }

    let itemsHtml = '';
    let total = 0;

    // Check if this is a repair quote delivery
    if (d.repairQuoteData && d.repairQuoteData.pacs && d.repairQuoteData.pacs.length > 0) {
        // Display in repair quote format with PAC structure
        let pacNumber = 1;
        d.repairQuoteData.pacs.forEach(pac => {
            const allianceSerial = pac.serialAlliance ? ` | Alliance S/N: ${pac.serialAlliance}` : '';

            // PAC header
            itemsHtml += `
                <tr style="background: #dbeafe;">
                    <td colspan="3"><strong>PAC #${pacNumber} - ${pac.model} (S/N: ${pac.serial || 'N/A'}${allianceSerial})</strong></td>
                </tr>
            `;

            // Components
            if (pac.components && pac.components.length > 0) {
                pac.components.forEach(comp => {
                    if (comp.qty > 0) {
                        itemsHtml += `
                            <tr>
                                <td style="padding-left: 20px;">${comp.name || comp.ref}</td>
                                <td style="text-align:center">${comp.qty}</td>
                                <td>${pcs}</td>
                            </tr>
                        `;
                        total += comp.qty;
                    }
                });
            }

            // Refrigerant (if any)
            if (pac.services && pac.services.refrigerant > 0) {
                const refQty = Math.round(pac.services.refrigerant);
                itemsHtml += `
                    <tr>
                        <td style="padding-left: 20px;">Fluide frigorigène R134a</td>
                        <td style="text-align:center">${refQty}</td>
                        <td>kg</td>
                    </tr>
                `;
                total += refQty;
            }

            pacNumber++;
        });

        // Add quote reference
        if (d.repairQuoteData.quoteNumber) {
            orderInfo += `<p><strong>Devis:</strong> ${d.repairQuoteData.quoteNumber}</p>`;
        }
        if (d.repairQuoteData.ticketNumber) {
            orderInfo += `<p><strong>Ticket:</strong> ${d.repairQuoteData.ticketNumber}</p>`;
        }
    } else {
        // Standard delivery format
        const q = d.items?.pac || d.quantities || {};
        const components = d.items?.components || [];
        const customItems = d.items?.custom || [];

        const models = getPacModels();
        const totalPac = models.reduce((sum, m) => sum + (q[m.id] || 0), 0);
        const totalComponents = components.reduce((sum, c) => sum + c.qty, 0);
        const totalCustom = customItems.reduce((sum, c) => sum + c.qty, 0);
        total = totalPac + totalComponents + totalCustom;

        // Generate PAC items rows
        const pacItemsHtml = models.map(m => {
            const qty = q[m.id] || 0;
            return qty > 0 ? `<tr><td>${m.fullName}</td><td>${qty}</td><td>${pcs}</td></tr>` : '';
        }).join('');

        // Generate component items rows
        const componentItemsHtml = components.map(c =>
            `<tr><td>${c.name}</td><td>${c.qty}</td><td>${pcs}</td></tr>`
        ).join('');

        // Generate custom items rows
        const customItemsHtml = customItems.map(c =>
            `<tr><td>${c.name}</td><td>${c.qty}</td><td>${pcs}</td></tr>`
        ).join('');

        itemsHtml = pacItemsHtml + componentItemsHtml + customItemsHtml;
    }

    document.getElementById('deliveryPreview').innerHTML = `
        <div class="delivery-note">
            <div class="dn-header">
                <div class="dn-company"><h2>${config.COMPANY.name}</h2><p>${config.COMPANY.address}</p></div>
                <div class="dn-info"><h1>${d.blNumber}</h1><p>${t('date')}: ${formatDate(d.date)}</p>${orderInfo}</div>
            </div>
            <h2 class="dn-title">${t('deliveryNote')}</h2>
            <div class="dn-addresses">
                <div class="dn-address"><h4>${t('sender')}</h4><div class="dn-address-box"><strong>${config.COMPANY.name}</strong><br>${config.COMPANY.address}</div></div>
                <div class="dn-address"><h4>${t('recipient')}</h4><div class="dn-address-box"><strong>${d.client}</strong><br>${d.clientAddress || ''}</div></div>
            </div>
            <table class="dn-table">
                <thead><tr><th>${t('designation')}</th><th>${t('quantity')}</th><th>${t('unit')}</th></tr></thead>
                <tbody>
                    ${itemsHtml}
                    <tr class="dn-total"><td><strong>TOTAL</strong></td><td><strong>${total}</strong></td><td>${pcs}</td></tr>
                </tbody>
            </table>
            <div class="dn-signatures">
                <div class="dn-signature"><div class="dn-signature-line"></div><p>${t('senderSignature')}</p></div>
                <div class="dn-signature"><div class="dn-signature-line"></div><p>${t('recipientSignature')}</p></div>
            </div>
        </div>
    `;
    document.getElementById('deliveryModal').classList.add('active');
}

function closeDeliveryModal() { document.getElementById('deliveryModal').classList.remove('active'); }
function printDelivery() {
    const originalTitle = document.title;
    document.title = currentDelivery?.blNumber || 'BL';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

// ========================================
// RECEIVED INVOICES - FP2026XXX
// ========================================

async function getNextReceivedInvoiceNumber(consume = false) {
    const year = new Date().getFullYear();
    let maxFromInvoices = 0;

    // Get max invoice number from Google Sheets (source of truth)
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getReceivedInvoices(500);
            if (Array.isArray(remoteInvoices)) {
                remoteInvoices.forEach(inv => {
                    if (inv.internalNumber) {
                        const match = inv.internalNumber.match(/FP(\d{4})(\d{3})/);
                        if (match && parseInt(match[1]) === year) {
                            const num = parseInt(match[2]);
                            if (num > maxFromInvoices) maxFromInvoices = num;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to read invoices from GS:', e);
        }
    } else {
        // Fallback to localStorage if not connected to GS
        const localInvoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
        localInvoices.forEach(inv => {
            if (inv.internalNumber) {
                const match = inv.internalNumber.match(/FP(\d{4})(\d{3})/);
                if (match && parseInt(match[1]) === year) {
                    const num = parseInt(match[2]);
                    if (num > maxFromInvoices) maxFromInvoices = num;
                }
            }
        });
    }

    // Next number = max existing + 1 (deleted numbers become available again)
    const nextNum = maxFromInvoices + 1;
    const fpNumber = `FP${year}${String(nextNum).padStart(3, '0')}`;
    console.log(`📋 Next FP number: ${fpNumber} (max invoice in GS: ${maxFromInvoices})`);

    return fpNumber;
}

async function getNextReceivedProformaNumber(consume = false) {
    const year = new Date().getFullYear();
    let maxFromInvoices = 0;

    // Get max proforma number from Google Sheets (source of truth)
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getReceivedInvoices(500);
            if (Array.isArray(remoteInvoices)) {
                remoteInvoices.forEach(inv => {
                    if (inv.internalNumber) {
                        const match = inv.internalNumber.match(/FPP(\d{4})(\d{3})/);
                        if (match && parseInt(match[1]) === year) {
                            const num = parseInt(match[2]);
                            if (num > maxFromInvoices) maxFromInvoices = num;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to read invoices from GS:', e);
        }
    } else {
        // Fallback to localStorage if not connected to GS
        const localInvoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
        localInvoices.forEach(inv => {
            if (inv.internalNumber) {
                const match = inv.internalNumber.match(/FPP(\d{4})(\d{3})/);
                if (match && parseInt(match[1]) === year) {
                    const num = parseInt(match[2]);
                    if (num > maxFromInvoices) maxFromInvoices = num;
                }
            }
        });
    }

    // Next number = max existing + 1 (deleted numbers become available again)
    const nextNum = maxFromInvoices + 1;
    const fppNumber = `FPP${year}${String(nextNum).padStart(3, '0')}`;
    console.log(`📋 Next FPP number: ${fppNumber} (max proforma in GS: ${maxFromInvoices})`);

    return fppNumber;
}

async function updateRecInvInternalNumber() {
    if (editingRecInvId) return; // Don't change number when editing
    const isProforma = document.getElementById('recInvIsProforma')?.checked || false;
    if (isProforma) {
        document.getElementById('recInvInternalNum').value = await getNextReceivedProformaNumber();
    } else {
        document.getElementById('recInvInternalNum').value = await getNextReceivedInvoiceNumber();
    }
}

// Toggle proforma-specific fields for received invoices
function toggleRecInvProformaFields() {
    const isProforma = document.getElementById('recInvIsProforma')?.checked || false;
    const depositGroup = document.getElementById('recInvDepositPercentGroup');
    const linkedProformaRow = document.getElementById('recInvLinkedProformaRow');

    if (isProforma) {
        // Show deposit percent for proforma
        if (depositGroup) depositGroup.style.display = 'block';
        // Hide linked proforma (can't link proforma to another proforma)
        if (linkedProformaRow) linkedProformaRow.style.display = 'none';
    } else {
        // Hide deposit percent for regular invoice
        if (depositGroup) depositGroup.style.display = 'none';
        // Show linked proforma selector for regular invoice
        if (linkedProformaRow) linkedProformaRow.style.display = 'flex';
        // Populate paid proformas
        populateRecInvPaidProformas();
    }
}

// Populate dropdown with received proformas for deduction
async function populateRecInvPaidProformas() {
    console.log('🔍 populateRecInvPaidProformas() called');
    const select = document.getElementById('recInvLinkedProforma');
    if (!select) {
        console.log('❌ recInvLinkedProforma select not found!');
        return;
    }
    console.log('✓ Select element found');

    select.innerHTML = '<option value="">Chargement...</option>';

    // Get invoices from both localStorage and Google Sheets
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');

    // Also try to get from storage (Google Sheets if connected)
    try {
        const remoteInvoices = await storage.getReceivedInvoices(200);
        console.log('DEBUG - Remote invoices from Google Sheets:', remoteInvoices?.length || 0);
        if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
            // Merge: combine local and remote, prioritizing local for proforma fields
            const localMap = new Map(invoices.map(i => [i.id, i]));
            const merged = remoteInvoices.map(remote => {
                const local = localMap.get(remote.id);
                if (local) {
                    // If local has isProforma but remote doesn't, keep local value
                    return {
                        ...remote,
                        isProforma: local.isProforma !== undefined ? local.isProforma : remote.isProforma,
                        depositPercent: local.depositPercent !== undefined ? local.depositPercent : remote.depositPercent
                    };
                }
                return remote;
            });
            // Add local-only invoices
            const remoteIds = new Set(remoteInvoices.map(i => i.id));
            const localOnly = invoices.filter(i => !remoteIds.has(i.id));
            invoices = [...merged, ...localOnly];
        }
    } catch (e) {
        console.warn('Could not fetch remote invoices:', e);
    }

    console.log('All received invoices for proforma selector:', invoices.length);
    console.log('DEBUG - All invoices isProforma values:', invoices.map(inv => ({
        id: inv.id,
        num: inv.internalNumber,
        isProforma: inv.isProforma,
        typeOfIsProforma: typeof inv.isProforma
    })));

    select.innerHTML = '<option value="">-- Aucune --</option>';

    // Show all proformas, with paid ones first (check boolean, string, and FPP prefix)
    const proformas = invoices.filter(inv => {
        const isP = inv.isProforma === true || inv.isProforma === 'true' || inv.isProforma === 'TRUE' || (inv.internalNumber && inv.internalNumber.startsWith('FPP'));
        console.log(`Checking ${inv.internalNumber}: isProforma=${inv.isProforma} (${typeof inv.isProforma}) => ${isP}`);
        return isP;
    });
    console.log('Proformas found:', proformas.length, proformas.map(p => ({num: p.internalNumber, isProforma: p.isProforma, paid: p.paid})));

    if (proformas.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- Aucune proforma trouvée --';
        opt.disabled = true;
        select.appendChild(opt);
        return;
    }

    // Sort: paid first, then by date
    proformas.sort((a, b) => {
        if (a.paid && !b.paid) return -1;
        if (!a.paid && b.paid) return 1;
        return 0;
    });

    proformas.forEach(pf => {
        const depositPercent = pf.depositPercent || 100;
        const depositAmount = (pf.total || 0) * (depositPercent / 100);
        const opt = document.createElement('option');
        opt.value = pf.id;
        const paidStatus = pf.paid ? '✓ PAYÉ' : '⏳ Non payé';
        opt.textContent = `${pf.internalNumber || pf.number} - ${pf.supplier} - ${formatCurrency(depositAmount)} ${pf.currency || 'CZK'} [${paidStatus}]`;
        opt.dataset.total = depositAmount;
        opt.dataset.subtotal = (pf.subtotal || 0) * (depositPercent / 100);
        opt.dataset.vat = (pf.vat || 0) * (depositPercent / 100);
        opt.dataset.currency = pf.currency || 'CZK';
        opt.dataset.supplier = pf.supplier;
        opt.dataset.paid = pf.paid ? 'true' : 'false';
        // Disable non-paid proformas (can't deduct what wasn't paid)
        if (!pf.paid) {
            opt.disabled = true;
            opt.style.color = '#999';
        }
        select.appendChild(opt);
    });
}

// Update proforma deduction amount when selecting a proforma
function updateRecInvProformaDeduction() {
    const select = document.getElementById('recInvLinkedProforma');
    const deductionField = document.getElementById('recInvProformaDeduction');
    const remainingField = document.getElementById('recInvRemainingAmount');
    const totalField = document.getElementById('recInvTotal');

    if (!select || !deductionField || !remainingField) return;

    const selectedOption = select.selectedOptions[0];
    const total = parseFloat(totalField?.value) || 0;

    if (selectedOption && selectedOption.value) {
        const deduction = parseFloat(selectedOption.dataset.total) || 0;
        deductionField.value = deduction.toFixed(2);
        remainingField.value = (total - deduction).toFixed(2);
    } else {
        deductionField.value = '';
        remainingField.value = total.toFixed(2);
    }
}

async function getNextReceiptNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();

    // Get existing receipts - prefer Google Sheets data
    let existingReceipts = JSON.parse(localStorage.getItem('navalo_receipts') || '[]');
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteReceipts = await storage.getReceipts(500);
            if (Array.isArray(remoteReceipts) && remoteReceipts.length > 0) {
                existingReceipts = remoteReceipts;
            }
        } catch (e) {
            console.warn('Failed to get receipts from GS for number generation:', e);
        }
    }

    let maxNum = 0;
    existingReceipts.forEach(r => {
        if (r.receiptNumber) {
            const match = String(r.receiptNumber).match(/PŘ(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    if (config.pr_year !== year) { config.pr_year = year; config.next_pr = 1; }
    const configNum = config.next_pr || 1;
    const nextNum = Math.max(configNum, maxNum + 1);

    const prNumber = `PŘ${year}${String(nextNum).padStart(3, '0')}`;
    if (consume) {
        config.next_pr = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
        // Also update config in Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                await storage.updateConfig({ next_pr: config.next_pr, pr_year: config.pr_year });
            } catch (e) {
                console.warn('Failed to update config in GS:', e);
            }
        }
    }
    return prNumber;
}

async function openReceivedInvoiceModal() {
    console.log('📋 openReceivedInvoiceModal() called');
    editingRecInvId = null;
    document.getElementById('recInvModalTitle').textContent = t('newReceivedInv');
    document.getElementById('receivedInvoiceForm').reset();
    document.getElementById('recInvFileName').textContent = '';
    currentReceivedInvoiceFile = null;
    const proformaCheckbox = document.getElementById('recInvIsProforma');
    if (proformaCheckbox) proformaCheckbox.checked = false;
    document.getElementById('recInvInternalNum').value = await getNextReceivedInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recInvDate').value = today;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    document.getElementById('recInvDueDate').value = dueDate.toISOString().split('T')[0];
    document.getElementById('recInvVatRate').value = CONFIG?.DEFAULT_VAT_RATE || 21;

    // Initialize proforma fields
    document.getElementById('recInvDepositPercent').value = 100;
    document.getElementById('recInvDepositPercentGroup').style.display = 'none';
    document.getElementById('recInvLinkedProformaRow').style.display = 'flex';
    try {
        await populateRecInvPaidProformas();
    } catch (e) {
        console.error('❌ Error populating proformas:', e);
    }
    document.getElementById('recInvLinkedProforma').value = '';
    document.getElementById('recInvProformaDeduction').value = '';
    document.getElementById('recInvRemainingAmount').value = '';

    // Initialize with placeholder (no supplier selected yet)
    populateRecInvPOSelect(null);
    populateRecInvReceiptSelect(null);
    document.getElementById('receivedInvoiceModal').classList.add('active');
}

function editReceivedInvoice(id) {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    editingRecInvId = id;
    document.getElementById('recInvModalTitle').textContent = t('edit');
    document.getElementById('recInvInternalNum').value = inv.internalNumber || '';
    document.getElementById('recInvNumber').value = inv.number || '';
    document.getElementById('recInvVarSymbol').value = inv.varSymbol || '';
    document.getElementById('recInvSupplier').value = inv.supplier || '';
    document.getElementById('recInvSupplierIco').value = inv.supplierIco || '';
    document.getElementById('recInvSupplierDic').value = inv.supplierDic || '';
    document.getElementById('recInvDate').value = formatDateForInput(inv.date);
    document.getElementById('recInvDueDate').value = formatDateForInput(inv.dueDate);
    document.getElementById('recInvTaxDate').value = formatDateForInput(inv.taxDate);
    document.getElementById('recInvSubtotal').value = inv.subtotal || '';
    document.getElementById('recInvVatRate').value = inv.vatRate || 21;
    document.getElementById('recInvVat').value = inv.vat || '';
    document.getElementById('recInvTotal').value = inv.total || '';
    document.getElementById('recInvCurrency').value = inv.currency || 'CZK';
    document.getElementById('recInvNotes').value = inv.notes || '';
    if (inv.fileName) document.getElementById('recInvFileName').textContent = inv.fileName;
    const proformaCheckbox = document.getElementById('recInvIsProforma');
    if (proformaCheckbox) proformaCheckbox.checked = inv.isProforma || false;

    // Handle proforma-specific fields
    if (inv.isProforma) {
        document.getElementById('recInvDepositPercent').value = inv.depositPercent || 100;
        document.getElementById('recInvDepositPercentGroup').style.display = 'block';
        document.getElementById('recInvLinkedProformaRow').style.display = 'none';
    } else {
        document.getElementById('recInvDepositPercentGroup').style.display = 'none';
        document.getElementById('recInvLinkedProformaRow').style.display = 'flex';
        populateRecInvPaidProformas();
        if (inv.linkedProformaId) {
            document.getElementById('recInvLinkedProforma').value = inv.linkedProformaId;
            updateRecInvProformaDeduction();
        }
    }

    // Populate selects filtered by supplier
    populateRecInvPOSelect(inv.supplier || null);
    populateRecInvReceiptSelect(inv.supplier || null);

    // Set values after populating
    document.getElementById('recInvLinkedPO').value = inv.linkedPO || '';
    document.getElementById('recInvLinkedReceipt').value = inv.linkedReceipt || '';

    document.getElementById('receivedInvoiceModal').classList.add('active');
}

function closeReceivedInvoiceModal() {
    document.getElementById('receivedInvoiceModal').classList.remove('active');
    editingRecInvId = null;
    currentReceivedInvoiceFile = null;
}

function populateRecInvPOSelect(supplierFilter = null) {
    const select = document.getElementById('recInvLinkedPO');
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    
    // If no supplier, show placeholder
    if (!supplierFilter) {
        select.innerHTML = `<option value="">${t('selectSupplierFirst')}</option>`;
        return;
    }
    
    select.innerHTML = `<option value="">${t('none')}</option>`;
    
    // Filter by supplier
    const filtered = pos.filter(p => 
        (p.status === 'Envoyé' || p.status === 'Reçu') && 
        p.supplier === supplierFilter
    );
    
    if (filtered.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = `-- ${t('noOrdersForSupplier')} --`;
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        filtered.forEach(po => {
            const opt = document.createElement('option');
            opt.value = po.poNumber;
            opt.textContent = `${po.poNumber} (${formatDate(po.date)})`;
            select.appendChild(opt);
        });
    }
}

function populateRecInvReceiptSelect(supplierFilter = null) {
    const select = document.getElementById('recInvLinkedReceipt');
    if (!select) return;
    
    // If no supplier, show placeholder
    if (!supplierFilter) {
        select.innerHTML = `<option value="">${t('selectSupplierFirst')}</option>`;
        return;
    }
    
    // First check receipts from Google Sheets
    let receipts = JSON.parse(localStorage.getItem('navalo_receipts') || '[]');
    
    // Filter by supplier
    if (receipts.length > 0) {
        receipts = receipts.filter(r => r.supplier === supplierFilter);
    }
    
    // If no receipts from Google Sheets, fallback to history
    if (receipts.length === 0) {
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const entries = history.filter(h => 
            (h.type === 'ENTRÉE' || h.type === 'PŘÍJEM') && 
            new Date(h.date) >= sixMonthsAgo &&
            (h.partner === supplierFilter || h.supplier === supplierFilter)
        );
        
        // Group by docNum to get unique receipts
        const receiptGroups = {};
        entries.forEach(entry => {
            const key = entry.docNum || entry.bonNum || `AUTO-${entry.date}`;
            if (!receiptGroups[key]) {
                receiptGroups[key] = {
                    receiptNumber: key,
                    date: entry.date,
                    supplier: entry.partner || entry.supplier || ''
                };
            }
        });
        
        receipts = Object.values(receiptGroups);
    }
    
    // Sort by date descending
    receipts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    select.innerHTML = `<option value="">${t('none')}</option>`;
    
    if (receipts.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = `-- ${t('noReceiptsForSupplier') || 'Žádné příjemky'} --`;
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        receipts.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.receiptNumber || r.docNum;
            opt.textContent = `${r.receiptNumber || r.docNum} (${formatDate(r.date)})`;
            select.appendChild(opt);
        });
    }
}

// Called when supplier changes in received invoice form
function onRecInvSupplierChange() {
    const supplierSelect = document.getElementById('recInvSupplier');
    const supplierText = supplierSelect.options[supplierSelect.selectedIndex]?.text || '';
    
    // Update currency and other fields based on supplier
    onSupplierChange('recInvSupplier');
    
    // Filter linked PO and Receipt lists by selected supplier
    if (supplierText && supplierText !== t('selectContact')) {
        populateRecInvPOSelect(supplierText);
        populateRecInvReceiptSelect(supplierText);
    } else {
        populateRecInvPOSelect(null);
        populateRecInvReceiptSelect(null);
    }
}

function onRecInvFileSelect(input) {
    if (input.files && input.files[0]) {
        currentReceivedInvoiceFile = input.files[0];
        document.getElementById('recInvFileName').textContent = input.files[0].name;
    }
}

function calculateRecInvVat() {
    const subtotal = parseFloat(document.getElementById('recInvSubtotal').value) || 0;
    const vatRate = parseFloat(document.getElementById('recInvVatRate').value) || 0;
    const rounding = document.getElementById('recInvRounding')?.value || 'none';

    let vat = Math.round(subtotal * vatRate) / 100;
    let total = subtotal + vat;

    // Apply rounding if selected
    if (rounding !== 'none') {
        const roundTo = parseFloat(rounding);
        total = Math.round(total / roundTo) * roundTo;
        // Recalculate VAT to match rounded total
        vat = total - subtotal;
    }

    document.getElementById('recInvVat').value = vat.toFixed(2);
    document.getElementById('recInvTotal').value = total.toFixed(2);

    // Update remaining amount if there's a linked proforma
    updateRecInvProformaDeduction();
}

async function saveReceivedInvoice() {
    let fileData = null;
    if (currentReceivedInvoiceFile) {
        try { fileData = await fileToBase64(currentReceivedInvoiceFile); } catch (e) { console.error(e); }
    }
    
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    let existingFileData = null, existingFileName = null, existingFileType = null;
    let existingDriveInfo = {};
    
    if (editingRecInvId) {
        const existingInv = invoices.find(i => i.id === editingRecInvId);
        if (existingInv && !fileData) {
            existingFileData = existingInv.fileData;
            existingFileName = existingInv.fileName;
            existingFileType = existingInv.fileType;
        }
        if (existingInv) {
            existingDriveInfo = {
                driveFileId: existingInv.driveFileId,
                driveFileUrl: existingInv.driveFileUrl,
                driveDownloadUrl: existingInv.driveDownloadUrl
            };
        }
    }
    
    // Get proforma state and internal number
    const isProforma = document.getElementById('recInvIsProforma')?.checked || false;
    let internalNumber = document.getElementById('recInvInternalNum').value;
    if (!editingRecInvId) {
        // Consume the number only when creating new invoice
        internalNumber = isProforma ? await getNextReceivedProformaNumber(true) : await getNextReceivedInvoiceNumber(true);
    }

    // Get linked proforma info for regular invoices
    let linkedProformaData = null;
    if (!isProforma) {
        const linkedProformaId = document.getElementById('recInvLinkedProforma')?.value;
        if (linkedProformaId) {
            const allInvoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
            const linkedProforma = allInvoices.find(i => i.id === linkedProformaId);
            if (linkedProforma) {
                const depositPercent = linkedProforma.depositPercent || 100;
                linkedProformaData = {
                    id: linkedProforma.id,
                    internalNumber: linkedProforma.internalNumber,
                    subtotal: linkedProforma.subtotal * (depositPercent / 100),
                    vat: linkedProforma.vat * (depositPercent / 100),
                    total: linkedProforma.total * (depositPercent / 100)
                };
            }
        }
    }

    const invoice = {
        id: editingRecInvId || 'RINV-' + Date.now(),
        internalNumber: internalNumber,
        isProforma: isProforma,
        depositPercent: isProforma ? (parseFloat(document.getElementById('recInvDepositPercent')?.value) || 100) : null,
        number: document.getElementById('recInvNumber').value,
        varSymbol: document.getElementById('recInvVarSymbol').value,
        supplier: document.getElementById('recInvSupplier').value,
        supplierIco: document.getElementById('recInvSupplierIco').value,
        supplierDic: document.getElementById('recInvSupplierDic').value,
        date: document.getElementById('recInvDate').value,
        dueDate: document.getElementById('recInvDueDate').value,
        taxDate: document.getElementById('recInvTaxDate').value,
        subtotal: parseFloat(document.getElementById('recInvSubtotal').value) || 0,
        vatRate: parseFloat(document.getElementById('recInvVatRate').value) || 0,
        vat: parseFloat(document.getElementById('recInvVat').value) || 0,
        total: parseFloat(document.getElementById('recInvTotal').value) || 0,
        currency: document.getElementById('recInvCurrency').value,
        notes: document.getElementById('recInvNotes').value,
        linkedPO: document.getElementById('recInvLinkedPO').value,
        linkedReceipt: document.getElementById('recInvLinkedReceipt').value,
        linkedProformaId: linkedProformaData?.id || null,
        linkedProforma: linkedProformaData,
        paid: false, paidDate: null,
        fileName: fileData ? document.getElementById('recInvFileName').textContent : existingFileName,
        fileData: fileData || existingFileData,
        fileType: fileData ? currentReceivedInvoiceFile?.type : existingFileType,
        createdAt: new Date().toISOString(),
        ...existingDriveInfo
    };

    console.log('DEBUG - Saving invoice with isProforma:', invoice.isProforma, 'depositPercent:', invoice.depositPercent);

    if (editingRecInvId) {
        const index = invoices.findIndex(i => i.id === editingRecInvId);
        if (index >= 0) {
            invoice.paid = invoices[index].paid;
            invoice.paidDate = invoices[index].paidDate;
            invoice.createdAt = invoices[index].createdAt;
            invoices[index] = invoice;
        }
    } else { invoices.unshift(invoice); }
    
    localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
    
    // Sync to Google Sheets if connected
    try {
        if (storage.getMode() === 'googlesheets') {
            console.log('📤 Syncing received invoice to Google Sheets...', invoice.id);
            
            // Always use create - it will handle both new and existing by ID
            const result = await storage.createReceivedInvoice({
                id: invoice.id,
                internalNumber: invoice.internalNumber,
                number: invoice.number,
                supplier: invoice.supplier,
                date: invoice.date,
                dueDate: invoice.dueDate,
                taxDate: invoice.taxDate,
                subtotal: invoice.subtotal,
                vat: invoice.vat,
                total: invoice.total,
                currency: invoice.currency,
                linkedReceipt: invoice.linkedReceipt,
                notes: invoice.notes,
                isProforma: invoice.isProforma,
                depositPercent: invoice.depositPercent,
                linkedProformaId: invoice.linkedProformaId,
                linkedProformaData: invoice.linkedProforma
            });
            console.log('✅ Google Sheets sync result:', result);
            
            if (!result.success) {
                console.error('❌ Sync failed:', result.error);
                showToast('Sync GS failed: ' + (result.error || 'Unknown error'), 'warning');
            }
        }
    } catch (e) {
        console.error('❌ Sync to Google Sheets failed:', e);
        showToast('Sync error: ' + e.message, 'warning');
    }
    
    editingRecInvId = null;
    closeReceivedInvoiceModal();
    updateReceivedInvoicesDisplay();
    showToast(`${invoice.internalNumber} ${t('saved')}`, 'success');
}

let _populatingSupplierFilter = false;

function populateRecInvSupplierFilter() {
    const select = document.getElementById('recInvSupplierFilter');
    if (!select) return;

    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const suppliers = [...new Set(invoices.map(inv => inv.supplier).filter(Boolean))].sort();

    const currentValue = select.value;
    _populatingSupplierFilter = true;
    select.innerHTML = '<option value="">Tous fournisseurs</option>';
    suppliers.forEach(supplier => {
        const opt = document.createElement('option');
        opt.value = supplier;
        opt.textContent = supplier;
        select.appendChild(opt);
    });
    // Restore previous selection if still valid
    if (currentValue && suppliers.includes(currentValue)) {
        select.value = currentValue;
    }
    _populatingSupplierFilter = false;
}

let _updatingReceivedInvoices = false;

async function updateReceivedInvoicesDisplay() {
    // Prevent recursive calls triggered by DOM changes in populateRecInvSupplierFilter
    if (_updatingReceivedInvoices || _populatingSupplierFilter) return;
    _updatingReceivedInvoices = true;
    try {
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    
    // Load from Google Sheets if connected - GS is the source of truth
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getReceivedInvoices(100);
            if (Array.isArray(remoteInvoices)) {
                console.log('📦 Loaded', remoteInvoices.length, 'received invoices from Google Sheets');
                if (remoteInvoices.length > 0) {
                    console.log('🔍 Sample invoice fields:', Object.keys(remoteInvoices[0]));
                    console.log('🔍 Sample invoice data:', JSON.stringify(remoteInvoices[0], null, 2));
                }
                
                // GS is the source of truth - only keep local items that have fileData
                // (fileData is not stored in GS, so we merge it from local)
                const localFileData = {};
                invoices.forEach(inv => {
                    if (inv.fileData || inv.driveFileId || inv.driveFileUrl) {
                        localFileData[inv.id] = {
                            fileData: inv.fileData,
                            fileName: inv.fileName,
                            fileType: inv.fileType,
                            driveFileId: inv.driveFileId,
                            driveFileUrl: inv.driveFileUrl,
                            driveDownloadUrl: inv.driveDownloadUrl,
                            varSymbol: inv.varSymbol,
                            supplierIco: inv.supplierIco,
                            supplierDic: inv.supplierDic
                        };
                    }
                    // Also index by internalNumber for matching
                    if (inv.internalNumber && (inv.fileData || inv.driveFileId || inv.driveFileUrl)) {
                        localFileData[inv.internalNumber] = localFileData[inv.id];
                    }
                });
                
                // Merge file data into remote invoices
                invoices = remoteInvoices.map(remote => {
                    const localData = localFileData[remote.id] || localFileData[remote.internalNumber] || {};
                    return { ...remote, ...localData };
                });
                
                localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
            }
        } catch (e) {
            console.warn('Failed to load received invoices from Google Sheets:', e);
        }
    }

    // Populate supplier filter dropdown
    populateRecInvSupplierFilter();

    const typeFilter = document.getElementById('recInvTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('recInvStatusFilter')?.value || '';
    const supplierFilter = document.getElementById('recInvSupplierFilter')?.value || '';
    const monthFilter = document.getElementById('recInvMonthFilter')?.value || '';
    const sortOrder = document.getElementById('recInvSortOrder')?.value || 'date-desc';

    // Helper to check proforma status (handles boolean, string values, and FPP prefix for legacy data)
    const isProformaInv = (inv) => inv.isProforma === true || inv.isProforma === 'true' || inv.isProforma === 'TRUE' || (inv.internalNumber && inv.internalNumber.startsWith('FPP'));

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !isProformaInv(inv));
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => isProformaInv(inv));
    if (statusFilter === 'paid') filtered = filtered.filter(inv => inv.paid);
    else if (statusFilter === 'unpaid') filtered = filtered.filter(inv => !inv.paid);
    if (supplierFilter) filtered = filtered.filter(inv => inv.supplier === supplierFilter);
    if (monthFilter) filtered = filtered.filter(inv => inv.date?.startsWith(monthFilter));

    // Sort by selected order
    const [sortField, sortDir] = sortOrder.split('-');
    filtered.sort((a, b) => {
        const dateA = a[sortField] ? new Date(a[sortField]) : new Date(0);
        const dateB = b[sortField] ? new Date(b[sortField]) : new Date(0);
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const unpaid = invoices.filter(inv => !inv.paid);
    const unpaidValue = unpaid.reduce((sum, inv) => sum + (inv.currency === 'CZK' ? inv.total : inv.total * exchangeRate), 0);
    const overdue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date());
    
    const els = {
        total: document.getElementById('recInvTotalCount'),
        unpaid: document.getElementById('recInvUnpaidCount'),
        value: document.getElementById('recInvUnpaidValue'),
        overdue: document.getElementById('recInvOverdueCount')
    };
    if (els.total) els.total.textContent = invoices.length;
    if (els.unpaid) els.unpaid.textContent = unpaid.length;
    if (els.value) els.value.textContent = formatCurrency(unpaidValue);
    if (els.overdue) els.overdue.textContent = overdue.length;
    
    const tbody = document.getElementById('receivedInvoicesTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(inv => {
        const isOverdue = !inv.paid && inv.dueDate && new Date(inv.dueDate) < new Date();
        const statusLabel = inv.paid ? t('paid') : (isOverdue ? t('overdue') : t('unpaid'));
        const statusClass = inv.paid ? 'badge-success' : (isOverdue ? 'badge-danger' : 'badge-warning');
        
        // Google Drive buttons
        let driveButtons = '';
        if (inv.driveFileUrl) {
            // Already uploaded to Drive - show link
            driveButtons = `<a href="${inv.driveFileUrl}" target="_blank" class="btn-icon" title="Otevřít v Google Drive" draggable="true">📁</a>`;
        } else if (inv.fileData) {
            // Has file but not uploaded - show upload button
            driveButtons = `<button class="btn-icon" onclick="uploadInvoiceToDrive('${inv.id}')" title="Nahrát na Google Drive">☁️</button>`;
        }
        
        const proformaBadge = inv.isProforma ? '<span class="badge badge-proforma" style="margin-left: 4px;">PROFORMA</span>' : '';
        const hasFile = inv.fileData || inv.driveFileUrl || inv.driveDownloadUrl;

        return `<tr class="${isOverdue ? 'row-warning' : ''}">
            <td><strong>${inv.internalNumber || '-'}</strong>${proformaBadge}</td>
            <td>${inv.number}${inv.fileData ? ' 📎' : ''}${inv.driveFileUrl ? ' ☁️' : ''}</td>
            <td>${inv.supplier}</td>
            <td>${formatDate(inv.date)}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td>${inv.linkedReceipt || '-'}</td>
            <td class="text-right">${formatCurrency(inv.subtotal)}</td>
            <td class="text-right">${formatCurrency(inv.vat)}</td>
            <td class="text-right"><strong>${formatCurrency(inv.total)} ${inv.currency}</strong></td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>
                ${hasFile ? `<button class="btn-icon" onclick="viewReceivedInvoicePDF('${inv.id}')" title="${t('viewPDF')}">👁️</button>` : ''}
                ${driveButtons}
                <button class="btn-icon" onclick="editReceivedInvoice('${inv.id}')" title="${t('edit')}">✏️</button>
                ${inv.isProforma ? `<button class="btn-icon" onclick="convertReceivedProformaToInvoice('${inv.id}')" title="Convertir en facture">🔄</button>` : ''}
                ${!inv.paid ? `<button class="btn-icon" onclick="markRecInvPaid('${inv.id}')" title="${t('markPaid')}">💰</button>` : ''}
                <button class="btn-icon" onclick="deleteRecInv('${inv.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
    } finally {
        _updatingReceivedInvoices = false;
    }
}

function viewReceivedInvoicePDF(id) {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const inv = invoices.find(i => i.id === id);
    if (!inv) { showToast(t('noData'), 'warning'); return; }

    // Priority: local fileData > Google Drive URL > Download URL
    if (inv.fileData) {
        const win = window.open();
        if (win) {
            win.document.write(`<html><head><title>${inv.internalNumber}</title></head><body style="margin:0"><embed src="${inv.fileData}" type="${inv.fileType || 'application/pdf'}" width="100%" height="100%"></body></html>`);
        } else {
            const link = document.createElement('a');
            link.href = inv.fileData;
            link.download = inv.fileName || `faktura_${inv.internalNumber}.pdf`;
            link.click();
        }
    } else if (inv.driveFileUrl) {
        window.open(inv.driveFileUrl, '_blank');
    } else if (inv.driveDownloadUrl) {
        window.open(inv.driveDownloadUrl, '_blank');
    } else {
        showToast(t('noData'), 'warning');
    }
}

async function uploadInvoiceToDrive(id) {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const inv = invoices.find(i => i.id === id);
    
    if (!inv?.fileData) {
        showToast('Žádný soubor k nahrání', 'warning');
        return;
    }
    
    showToast('Nahrávání na Google Drive...', 'info');
    
    try {
        const result = await storage.uploadToDrive({
            fileName: inv.fileName || `${inv.internalNumber}_${inv.supplier}.pdf`,
            fileData: inv.fileData,
            fileType: inv.fileType || 'application/pdf',
            invoiceId: inv.id
        });
        
        if (result.success) {
            // Update local invoice with Drive link
            const index = invoices.findIndex(i => i.id === id);
            if (index >= 0) {
                invoices[index].driveFileId = result.fileId;
                invoices[index].driveFileUrl = result.fileUrl;
                invoices[index].driveDownloadUrl = result.downloadUrl;
                localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));

                // Sync Drive info back to Google Sheets
                if (storage.getMode() === 'googlesheets') {
                    try {
                        await storage.updateReceivedInvoice({
                            id: inv.id,
                            driveFileId: result.fileId,
                            driveFileUrl: result.fileUrl,
                            driveDownloadUrl: result.downloadUrl
                        });
                        console.log('✅ Drive info synced to Google Sheets');
                    } catch (e) {
                        console.warn('Failed to sync Drive info to GS:', e);
                    }
                }
            }

            await updateReceivedInvoicesDisplay();
            showToast('✅ Nahráno na Google Drive', 'success');
            
            // Open the file in new tab
            window.open(result.fileUrl, '_blank');
        } else {
            showToast('Chyba: ' + (result.error || 'Upload failed'), 'error');
        }
    } catch (e) {
        console.error('Upload to Drive failed:', e);
        showToast('Chyba při nahrávání: ' + e.message, 'error');
    }
}

async function uploadAllInvoicesToDrive() {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const toUpload = invoices.filter(inv => inv.fileData && !inv.driveFileUrl);
    
    if (toUpload.length === 0) {
        showToast('Žádné faktury k nahrání', 'info');
        return;
    }
    
    showToast(`Nahrávání ${toUpload.length} faktur...`, 'info');
    
    let uploaded = 0;
    for (const inv of toUpload) {
        try {
            await uploadInvoiceToDrive(inv.id);
            uploaded++;
        } catch (e) {
            console.error('Failed to upload:', inv.id, e);
        }
    }
    
    showToast(`✅ Nahráno ${uploaded}/${toUpload.length} faktur`, 'success');
}

async function markRecInvPaid(id) {
    if (!confirm(t('confirmMarkPaid'))) return;
    
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const index = invoices.findIndex(inv => inv.id === id || inv.internalNumber === id);
    
    if (index >= 0) {
        const paidDate = new Date().toISOString();
        invoices[index].paid = true;
        invoices[index].paidDate = paidDate;
        localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
        
        // Sync to Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                console.log('💰 Marking invoice as paid in Google Sheets:', id);
                const result = await storage.updateReceivedInvoice({
                    invId: invoices[index].id,
                    paid: true,
                    paidDate: paidDate
                });
                console.log('✅ Google Sheets update result:', result);
            } catch (e) {
                console.error('❌ Failed to sync paid status to Google Sheets:', e);
            }
        }
        
        // Update display locally (don't reload from GS which would overwrite)
        updateReceivedInvoicesDisplayLocal();
        showToast(t('saved'), 'success');
    }
}

// Local display update for received invoices (no GS reload)
function updateReceivedInvoicesDisplayLocal() {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');

    // Populate supplier filter dropdown
    populateRecInvSupplierFilter();

    const typeFilter = document.getElementById('recInvTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('recInvStatusFilter')?.value || '';
    const supplierFilter = document.getElementById('recInvSupplierFilter')?.value || '';
    const monthFilter = document.getElementById('recInvMonthFilter')?.value || '';
    const sortOrder = document.getElementById('recInvSortOrder')?.value || 'date-desc';

    // Helper to check proforma status (handles boolean, string values, and FPP prefix for legacy data)
    const isProformaInv = (inv) => inv.isProforma === true || inv.isProforma === 'true' || inv.isProforma === 'TRUE' || (inv.internalNumber && inv.internalNumber.startsWith('FPP'));

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !isProformaInv(inv));
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => isProformaInv(inv));
    if (statusFilter === 'paid') filtered = filtered.filter(inv => inv.paid);
    else if (statusFilter === 'unpaid') filtered = filtered.filter(inv => !inv.paid);
    if (supplierFilter) filtered = filtered.filter(inv => inv.supplier === supplierFilter);
    if (monthFilter) filtered = filtered.filter(inv => inv.date?.startsWith(monthFilter));

    // Sort by selected order
    const [sortField, sortDir] = sortOrder.split('-');
    filtered.sort((a, b) => {
        const dateA = a[sortField] ? new Date(a[sortField]) : new Date(0);
        const dateB = b[sortField] ? new Date(b[sortField]) : new Date(0);
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const unpaid = invoices.filter(inv => !inv.paid);
    const unpaidValue = unpaid.reduce((sum, inv) => sum + (inv.currency === 'CZK' ? inv.total : inv.total * exchangeRate), 0);
    const overdue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date());

    const els = {
        total: document.getElementById('recInvTotalCount'),
        unpaid: document.getElementById('recInvUnpaidCount'),
        value: document.getElementById('recInvUnpaidValue'),
        overdue: document.getElementById('recInvOverdueCount')
    };
    if (els.total) els.total.textContent = invoices.length;
    if (els.unpaid) els.unpaid.textContent = unpaid.length;
    if (els.value) els.value.textContent = formatCurrency(unpaidValue);
    if (els.overdue) els.overdue.textContent = overdue.length;
    
    const tbody = document.getElementById('receivedInvoicesTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(inv => {
        const isOverdue = !inv.paid && inv.dueDate && new Date(inv.dueDate) < new Date();
        const statusLabel = inv.paid ? t('paid') : (isOverdue ? t('overdue') : t('unpaid'));
        const statusClass = inv.paid ? 'badge-success' : (isOverdue ? 'badge-danger' : 'badge-warning');
        
        let driveButtons = '';
        if (inv.driveFileUrl) {
            driveButtons = `<a href="${inv.driveFileUrl}" target="_blank" class="btn-icon" title="Otevřít v Google Drive" draggable="true">📁</a>`;
        } else if (inv.fileData) {
            driveButtons = `<button class="btn-icon" onclick="uploadInvoiceToDrive('${inv.id}')" title="Nahrát na Google Drive">☁️</button>`;
        }
        
        const hasFileLocal = inv.fileData || inv.driveFileUrl || inv.driveDownloadUrl;

        return `<tr class="${isOverdue ? 'row-warning' : ''}">
            <td><strong>${inv.internalNumber || '-'}</strong></td>
            <td>${inv.number || ''}${inv.fileData ? ' 📎' : ''}${inv.driveFileUrl ? ' ☁️' : ''}</td>
            <td>${inv.supplier}</td>
            <td>${formatDate(inv.date)}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td>${inv.linkedReceipt || '-'}</td>
            <td class="text-right">${formatCurrency(inv.subtotal)}</td>
            <td class="text-right">${formatCurrency(inv.vat)}</td>
            <td class="text-right"><strong>${formatCurrency(inv.total)} ${inv.currency}</strong></td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>
                ${hasFileLocal ? `<button class="btn-icon" onclick="viewReceivedInvoicePDF('${inv.id}')" title="${t('viewPDF')}">👁️</button>` : ''}
                ${driveButtons}
                <button class="btn-icon" onclick="editReceivedInvoice('${inv.id}')" title="${t('edit')}">✏️</button>
                ${!inv.paid ? `<button class="btn-icon" onclick="markRecInvPaid('${inv.id}')" title="${t('markPaid')}">💰</button>` : ''}
                <button class="btn-icon" onclick="deleteRecInv('${inv.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

async function convertReceivedProformaToInvoice(proformaId) {
    if (!confirm('Convertir cette proforma fournisseur en facture définitive ?')) return;

    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const proformaIndex = invoices.findIndex(i => i.id === proformaId);
    if (proformaIndex < 0) return;

    const proforma = invoices[proformaIndex];

    // Create new invoice from proforma
    const newInternalNumber = await getNextReceivedInvoiceNumber(true);
    const newInvoice = {
        ...proforma,
        id: 'RINV-' + Date.now(),
        internalNumber: newInternalNumber,
        isProforma: false,
        linkedProforma: proforma.internalNumber, // Keep reference to original proforma
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    // Update due date to 14 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    newInvoice.dueDate = dueDate.toISOString().split('T')[0];

    // Mark proforma as converted
    invoices[proformaIndex].convertedToInvoice = newInternalNumber;
    invoices[proformaIndex].convertedAt = new Date().toISOString();

    // Add new invoice
    invoices.unshift(newInvoice);

    localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
    await updateReceivedInvoicesDisplay();
    showToast(`Proforma ${proforma.internalNumber} convertie en facture ${newInternalNumber}`, 'success');
}

async function deleteRecInv(id) {
    if (!confirm(t('confirmDelete'))) return;

    // Delete from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            await storage.deleteReceivedInvoice(id);
        } catch (e) {
            console.warn('Failed to delete from Google Sheets:', e);
        }
    }

    // Delete from localStorage
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const remaining = invoices.filter(inv => inv.id !== id);
    localStorage.setItem('navalo_received_invoices', JSON.stringify(remaining));
    await updateReceivedInvoicesDisplay();
    showToast(t('deleted'), 'success');
}

function exportReceivedInvoices() {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const headers = 'Int. číslo;Číslo faktury;Dodavatel;IČO;DIČ;Datum;Splatnost;DUZP;Základ;DPH;Celkem;Měna;Stav;Datum platby';
    let csv = headers + '\n';
    invoices.forEach(inv => {
        const status = inv.paid ? 'Zaplaceno' : 'Nezaplaceno';
        csv += `${inv.internalNumber || ''};${inv.number};${inv.supplier};${inv.supplierIco || ''};${inv.supplierDic || ''};${inv.date};${inv.dueDate};${inv.taxDate || ''};${inv.subtotal};${inv.vat};${inv.total};${inv.currency};${status};${inv.paidDate || ''}\n`;
    });
    downloadCSV(csv, `faktury_prijate_${new Date().toISOString().split('T')[0]}.csv`);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========================================
// UTILITIES
// ========================================

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${{success:'✓',error:'✕',warning:'⚠',info:'ℹ'}[type]||'ℹ'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDate(d) {
    if (!d) return '-';
    // Handle YYYY-MM-DD or ISO format string to avoid timezone issues
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
        const [year, month, day] = d.split(/[-T]/);
        return `${parseInt(day)}. ${parseInt(month)}. ${year}`;
    }
    // Handle Date object or timestamp - use UTC to avoid timezone shift
    const date = new Date(d);
    if (isNaN(date.getTime())) return '-';
    // Use UTC methods to avoid local timezone conversion
    return `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`;
}
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format (exact or with time suffix), extract date part
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 10);
    }
    // Try to parse and convert to YYYY-MM-DD using UTC to avoid timezone shift
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatCurrency(n) { return new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0); }

function downloadCSV(content, filename) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

async function exportHistory() {
    const history = await storage.getHistory(1000);
    const csv = ['Date;Type;N° Doc;Référence;Qté;Prix CZK;Valeur;Partenaire',
        ...history.map(h => [formatDate(h.date), h.type, h.docNum, h.ref, h.qty, h.priceUnit, h.value, h.partner].join(';'))
    ].join('\n');
    downloadCSV(csv, `historique-${new Date().toISOString().split('T')[0]}.csv`);
}

// ========================================
// NAVIGATION & SETUP
// ========================================

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
        });
    });
}

function setupForms() {
    document.getElementById('entryForm')?.addEventListener('submit', async (e) => { e.preventDefault(); await processReceipt(); });
}

function setupFilters() {
    document.getElementById('stockSearch')?.addEventListener('input', updateStockDisplay);
    document.getElementById('stockFilter')?.addEventListener('change', updateStockDisplay);
    document.getElementById('historyType')?.addEventListener('change', updateHistoryDisplay);
}

// ========================================
// RECEIPT PROCESSING
// ========================================

async function processReceipt() {
    const bonNum = document.getElementById('entryBonNum').value;
    const date = document.getElementById('entryDate').value;
    const supplier = document.getElementById('entrySupplier').value;
    const currency = document.getElementById('entryCurrency').value;
    const linkedPO = document.getElementById('entryLinkedPO').value;
    
    const items = [];
    document.querySelectorAll('#entryItems .item-row').forEach(row => {
        const ref = row.querySelector('.item-ref').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        if (ref && qty > 0) items.push({ ref, qty, price });
    });
    
    if (items.length === 0) { showToast(t('selectAtLeastOne'), 'error'); return; }

    // Validate partial receipt if PO is linked
    if (linkedPO) {
        const validation = storage.validatePartialReceipt(linkedPO, items);
        if (!validation.valid) {
            showToast('Réception impossible: ' + validation.errors.join('; '), 'error');
            return;
        }
    }

    try {
        const result = await storage.processReceipt({ bonNum, items, supplier, date, currency, linkedPO });
        if (result.success) {
            // Consume the receipt number if it matches expected pattern
            if (bonNum.startsWith('PŘ')) {
                await getNextReceiptNumber(true); // Increment the counter
            }
            // Note: PO status is now automatically updated in storage.processReceipt
            showToast(`${bonNum} ${t('saved')}`, 'success');
            await clearEntryForm();
            await refreshAllData();
        } else { showToast(result.error || t('error'), 'error'); }
    } catch (e) { showToast(t('error'), 'error'); }
}

async function clearEntryForm() {
    document.getElementById('entryForm')?.reset();
    document.getElementById('entryBonNum').value = await getNextReceiptNumber();
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('entryLinkedPO').value = '';
    document.getElementById('entryItems').innerHTML = `
        <div class="item-row">
            <select class="item-ref" required><option value="">${t('refPlaceholder')}</option></select>
            <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="0.01" step="0.01" required>
            <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01">
            <button type="button" class="btn-icon btn-remove" onclick="removeItemRow(this)">✕</button>
        </div>`;
    populateComponentSelects();
}

function addItemRow() {
    const container = document.getElementById('entryItems');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <select class="item-ref" required><option value="">${t('refPlaceholder')}</option></select>
        <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="0.01" step="0.01" required>
        <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01">
        <button type="button" class="btn-icon btn-remove" onclick="removeItemRow(this)">✕</button>`;
    container.appendChild(row);
    populateComponentSelects();
}

function removeItemRow(btn) {
    const container = btn.closest('.item-row').parentElement;
    if (container.children.length > 1) btn.closest('.item-row').remove();
}

function populateComponentSelects() {
    if (!currentStock) return;
    document.querySelectorAll('.item-ref').forEach(select => {
        const current = select.value;
        select.innerHTML = `<option value="">${t('refPlaceholder')}</option>`;
        Object.entries(currentStock).sort((a, b) => a[0].localeCompare(b[0])).forEach(([ref, data]) => {
            const opt = document.createElement('option');
            opt.value = ref;
            opt.textContent = `${ref} - ${data.name || ref}`;
            select.appendChild(opt);
        });
        if (current) select.value = current;
    });
}

async function populateLinkedPOSelect(supplierFilter = null) {
    const select = document.getElementById('entryLinkedPO');
    if (!select) return;

    // If no supplier filter, show placeholder only
    if (!supplierFilter) {
        select.innerHTML = `<option value="">${t('selectSupplierFirst') || 'Vyberte dodavatele'}</option>`;
        return;
    }

    let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');

    // Try to load from Google Sheets if empty
    if (pos.length === 0 && storage.getMode() === 'googlesheets') {
        try {
            select.innerHTML = `<option value="">${t('loading') || 'Načítání...'}...</option>`;
            pos = await storage.getPurchaseOrders(200);
            if (Array.isArray(pos)) {
                localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
            } else {
                pos = [];
            }
        } catch (e) {
            console.warn('Failed to load POs from Google Sheets:', e);
            pos = [];
        }
    }

    select.innerHTML = `<option value="">${t('none')}</option>`;

    let needsSave = false;

    // Filter by supplier and status (Envoyé or Partiel, not Reçu)
    let filtered = pos.filter(p => {
        if (p.supplier !== supplierFilter) return false;

        // Initialize fields if missing
        if (!p.remainingQuantities) {
            p.remainingQuantities = {};
            (p.items || []).forEach(item => {
                p.remainingQuantities[item.ref] = item.qty;
            });
            needsSave = true;
        }
        if (!p.deliveredQuantities) {
            p.deliveredQuantities = {};
            needsSave = true;
        }
        if (!p.receipts) {
            p.receipts = [];
            needsSave = true;
        }

        // Show POs that are not fully received
        const hasRemaining = Object.values(p.remainingQuantities || {}).some(q => q > 0);
        const notFullyReceived = p.status !== 'Reçu';

        return hasRemaining || notFullyReceived;
    });

    if (filtered.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = `-- ${t('noOrdersForSupplier') || 'Žádné objednávky'} --`;
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        filtered.forEach(po => {
            const opt = document.createElement('option');
            opt.value = po.id;

            // Build progression display
            const progressParts = [];
            (po.items || []).forEach(item => {
                const total = item.qty;
                const delivered = (po.deliveredQuantities || {})[item.ref] || 0;
                if (total > 0) {
                    progressParts.push(`${item.ref}:${delivered}/${total}`);
                }
            });

            const progressText = progressParts.length > 0 ? ` [${progressParts.join(', ')}]` : '';
            opt.textContent = `${po.poNumber} (${formatDate(po.date)})${progressText}`;

            opt.dataset.supplier = po.supplier;
            opt.dataset.currency = po.currency;
            select.appendChild(opt);
        });
    }

    // Save changes if any POs were initialized
    if (needsSave) {
        localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
        console.log('✅ POs initialized with partial receipt fields');
    }
}

// Called when supplier changes in entry form
async function onEntrySupplierChange() {
    const supplierSelect = document.getElementById('entrySupplier');
    const supplierText = supplierSelect.options[supplierSelect.selectedIndex]?.text || '';

    // Update currency based on supplier
    onSupplierChange('entrySupplier');

    // Filter linked PO list by selected supplier
    if (supplierText && supplierText !== t('selectContact')) {
        await populateLinkedPOSelect(supplierText);
    } else {
        // Clear the PO list if no supplier selected
        const select = document.getElementById('entryLinkedPO');
        if (select) {
            select.innerHTML = `<option value="">${t('none')}</option>`;
        }
    }
}

async function loadPOItems() {
    const poId = document.getElementById('entryLinkedPO').value;
    if (!poId) return;
    
    let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    
    // Try to load from Google Sheets if empty
    if (pos.length === 0 && storage.getMode() === 'googlesheets') {
        try {
            pos = await storage.getPurchaseOrders(200);
            if (Array.isArray(pos)) {
                localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
            }
        } catch (e) { console.warn('Failed to load POs:', e); }
    }
    
    const po = pos.find(p => p.id === poId);
    if (po) {
        // Set supplier - find the option with matching text
        const supplierSelect = document.getElementById('entrySupplier');
        for (let i = 0; i < supplierSelect.options.length; i++) {
            if (supplierSelect.options[i].text === po.supplier) {
                supplierSelect.selectedIndex = i;
                break;
            }
        }
        
        document.getElementById('entryCurrency').value = po.currency;
        // Keep the PŘ number, don't overwrite with PO number

        // Initialize remainingQuantities if not present
        if (!po.remainingQuantities) {
            po.remainingQuantities = {};
            (po.items || []).forEach(item => {
                po.remainingQuantities[item.ref] = item.qty;
            });
        }
        if (!po.deliveredQuantities) {
            po.deliveredQuantities = {};
        }

        const container = document.getElementById('entryItems');
        container.innerHTML = '';
        (po.items || []).forEach(item => {
            const remainingQty = po.remainingQuantities[item.ref] || 0;
            const deliveredQty = po.deliveredQuantities[item.ref] || 0;

            // Only show items with remaining quantity > 0
            if (remainingQty > 0) {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.innerHTML = `
                    <select class="item-ref" required><option value="">${t('refPlaceholder')}</option></select>
                    <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="0.01" step="0.01" max="${remainingQty}" required value="${remainingQty}">
                    <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" value="${item.price || ''}">
                    <button type="button" class="btn-icon btn-remove" onclick="removeItemRow(this)">✕</button>`;
                container.appendChild(row);
            }
        });
        populateComponentSelects();

        // Set the refs for items with remaining quantity
        const rows = container.querySelectorAll('.item-row');
        let rowIndex = 0;
        (po.items || []).forEach(item => {
            const remainingQty = po.remainingQuantities[item.ref] || 0;
            if (remainingQty > 0 && rows[rowIndex]) {
                rows[rowIndex].querySelector('.item-ref').value = item.ref;
                rowIndex++;
            }
        });

        // Show status message
        const receiptsCount = (po.receipts || []).length;
        const statusParts = (po.items || []).map(item => {
            const total = item.qty;
            const delivered = po.deliveredQuantities[item.ref] || 0;
            const remaining = po.remainingQuantities[item.ref] || total;
            return `${item.ref}: ${delivered}/${total}`;
        });
        const statusMsg = receiptsCount > 0 ?
            `${po.poNumber} - ${receiptsCount} réception(s) - ${statusParts.join(', ')}` :
            `${po.poNumber} - Nouvelle réception`;
        showToast(statusMsg, 'info');
    }
}

function updateEntryCurrency() { onSupplierChange('entrySupplier'); }

// ========================================
// RECEIPTS HISTORY (PŘÍJEMKY)
// ========================================

async function updateReceiptsHistoryDisplay() {
    const tbody = document.getElementById('receiptsHistoryTableBody');
    if (!tbody) return;
    
    let receipts = [];
    
    // Load from Google Sheets if connected - GS is the source of truth
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteReceipts = await storage.getReceipts(200);
            if (Array.isArray(remoteReceipts)) {
                receipts = remoteReceipts;
                localStorage.setItem('navalo_receipts', JSON.stringify(receipts));
                console.log('📦 Loaded', receipts.length, 'receipts from Google Sheets');
            }
        } catch (e) {
            console.warn('Failed to load receipts from Google Sheets:', e);
        }
    }
    
    // Only use local fallback if GS returned nothing (offline mode)
    if (receipts.length === 0 && storage.getMode() !== 'googlesheets') {
        receipts = JSON.parse(localStorage.getItem('navalo_receipts') || '[]');
    }
    
    // Sort by date descending
    receipts.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (receipts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }

    // Load POs once for lookup
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');

    tbody.innerHTML = receipts.map(r => {
        const itemCount = r.itemCount || r.items?.length || 0;
        const totalValue = r.totalValue || (r.items || []).reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0);
        const itemsPreview = (r.items || []).slice(0, 2).map(i => `${i.ref}: ${i.qty}`).join(', ');
        const moreItems = itemCount > 2 ? ` +${itemCount - 2}` : '';
        const safeKey = (r.id || r._key || r.receiptNumber).replace(/'/g, "\\'");

        // Look up PO number instead of showing internal ID
        let poDisplay = '-';
        if (r.linkedPO) {
            const po = pos.find(p => p.id === r.linkedPO);
            poDisplay = po ? po.poNumber : r.linkedPO;
        }

        return `<tr>
            <td><strong>${r.receiptNumber}</strong></td>
            <td>${formatDate(r.date)}</td>
            <td>${r.supplier}</td>
            <td>${poDisplay}</td>
            <td title="${(r.items || []).map(i => `${i.ref}: ${i.qty}`).join('\n')}">${itemsPreview}${moreItems}</td>
            <td class="text-right">${totalValue > 0 ? formatCurrency(totalValue) : '-'}</td>
            <td>${r.currency}</td>
            <td>
                <button class="btn-icon" onclick="viewReceiptDetails('${safeKey}')" title="${t('view')}">👁️</button>
                <button class="btn-icon" onclick="cancelReceipt('${safeKey}')" title="${t('cancelReceipt')}">↩️</button>
            </td>
        </tr>`;
    }).join('');
}

function viewReceiptDetails(key) {
    // First check receipts from Google Sheets
    const receipts = JSON.parse(localStorage.getItem('navalo_receipts') || '[]');
    let receipt = receipts.find(r => r.id === key || r.receiptNumber === key);
    
    if (receipt) {
        // Receipt found in Google Sheets data
        const items = receipt.items || [];
        const totalValue = receipt.totalValue || items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0);
        
        const itemsHtml = items.map(item => `
            <tr>
                <td>${item.ref}</td>
                <td>${item.name || '-'}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${item.price ? formatCurrency(item.price) : '-'}</td>
                <td class="text-right">${item.price ? formatCurrency(item.qty * item.price) : '-'}</td>
            </tr>
        `).join('');
        
        showReceiptModal(receipt.receiptNumber, receipt.date, receipt.supplier, receipt.linkedPO, receipt.currency, itemsHtml, totalValue);
        return;
    }
    
    // Fallback to history
    const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
    const entries = history.filter(h => h.type === 'ENTRÉE' || h.type === 'PŘÍJEM');
    
    // Find entries matching this key
    let matchedEntries = [];
    
    // Check if it's an IMPORT key
    if (key.startsWith('IMPORT-')) {
        const parts = key.split('-');
        const groups = {};
        entries.forEach((entry, i) => {
            let entryKey = entry.docNum || entry.bonNum;
            if (!entryKey || entryKey === 'undefined' || entryKey === 'null') {
                entryKey = `IMPORT-${(entry.date || '').split('T')[0]}-${i}`;
            }
            if (!groups[entryKey]) groups[entryKey] = [];
            groups[entryKey].push(entry);
        });
        matchedEntries = groups[key] || [];
    } else {
        matchedEntries = entries.filter(h => h.docNum === key || h.bonNum === key);
    }
    
    if (matchedEntries.length === 0) {
        showToast(t('noData'), 'warning');
        return;
    }
    
    // Build receipt from grouped entries
    receipt = {
        receiptNumber: key.startsWith('IMPORT-') ? `#${key.split('-')[4] || '?'}` : key,
        date: matchedEntries[0].date,
        supplier: matchedEntries[0].partner || matchedEntries[0].supplier || '-',
        linkedPO: matchedEntries[0].linkedPO || '',
        currency: matchedEntries[0].currency || 'CZK',
        items: matchedEntries.map(e => ({
            ref: e.ref, name: e.name || e.ref, qty: e.qty, price: e.priceUnit || 0
        }))
    };
    
    const items = receipt.items || [];
    const totalValue = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0);
    
    const itemsHtml = items.map(item => `
        <tr>
            <td>${item.ref}</td>
            <td>${item.name || '-'}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">${item.price ? formatCurrency(item.price) : '-'}</td>
            <td class="text-right">${item.price ? formatCurrency(item.qty * item.price) : '-'}</td>
        </tr>
    `).join('');
    
    showReceiptModal(receipt.receiptNumber, receipt.date, receipt.supplier, receipt.linkedPO, receipt.currency, itemsHtml, totalValue);
}

function showReceiptModal(docNum, date, supplier, linkedPO, currency, itemsHtml, totalValue) {
    // Look up actual PO number instead of displaying internal ID
    let poNumber = linkedPO;
    if (linkedPO) {
        const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        const po = pos.find(p => p.id === linkedPO);
        if (po) poNumber = po.poNumber;
    }

    const content = `
        <div class="receipt-details">
            <div class="receipt-header">
                <h2>${docNum}</h2>
                <p><strong>${t('date')}:</strong> ${formatDate(date)}</p>
                <p><strong>${t('supplier')}:</strong> ${supplier}</p>
                ${linkedPO ? `<p><strong>${t('linkPO')}:</strong> ${poNumber}</p>` : ''}
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>${t('reference')}</th>
                        <th>${t('designation')}</th>
                        <th class="text-right">${t('quantity')}</th>
                        <th class="text-right">${t('unitPrice')}</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="text-right"><strong>Total:</strong></td>
                        <td class="text-right"><strong>${formatCurrency(totalValue)} ${currency}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    const safeKey = docNum.replace(/'/g, "\\'");
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'receiptDetailsModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${t('receiptNumber')}: ${docNum}</h3>
                <button class="modal-close" onclick="closeReceiptDetailsModal()">✕</button>
            </div>
            ${content}
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeReceiptDetailsModal()">${t('close')}</button>
                <button class="btn btn-danger" onclick="closeReceiptDetailsModal(); cancelReceipt('${safeKey}');">↩️ ${t('cancelReceipt')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeReceiptDetailsModal() {
    const modal = document.getElementById('receiptDetailsModal');
    if (modal) modal.remove();
}

async function cancelReceipt(key) {
    if (!confirm(t('confirmCancelReceipt'))) return;
    
    const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
    const allEntries = history.filter(h => h.type === 'ENTRÉE' || h.type === 'PŘÍJEM');
    
    // Find entries to remove based on key type
    let entriesToRemove = [];
    let indicesToRemove = [];
    
    if (key.startsWith('IMPORT-')) {
        // Build groups with same logic as display
        const groups = {};
        allEntries.forEach((entry, i) => {
            let entryKey = entry.docNum || entry.bonNum;
            if (!entryKey || entryKey === 'undefined' || entryKey === 'null') {
                entryKey = `IMPORT-${(entry.date || '').split('T')[0]}-${i}`;
            }
            if (!groups[entryKey]) groups[entryKey] = { entries: [], indices: [] };
            groups[entryKey].entries.push(entry);
            // Find the original index in history
            const histIdx = history.findIndex(h => h === entry);
            if (histIdx >= 0) groups[entryKey].indices.push(histIdx);
        });
        
        if (groups[key]) {
            entriesToRemove = groups[key].entries;
            indicesToRemove = groups[key].indices;
        }
    } else {
        // Normal docNum search
        history.forEach((h, idx) => {
            if ((h.type === 'ENTRÉE' || h.type === 'PŘÍJEM') && 
                (h.docNum === key || h.bonNum === key)) {
                entriesToRemove.push(h);
                indicesToRemove.push(idx);
            }
        });
    }
    
    if (entriesToRemove.length === 0) {
        showToast(t('noData'), 'error');
        return;
    }
    
    // Remove quantities from stock
    const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
    let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
    
    for (const entry of entriesToRemove) {
        if (stock[entry.ref]) {
            stock[entry.ref].qty = Math.max(0, (stock[entry.ref].qty || 0) - entry.qty);
        }
        // Remove from FIFO lots by ref and date
        lots = lots.filter(l => !(l.ref === entry.ref && l.date === entry.date && l.bonNum === entry.docNum));
    }
    
    // Remove entries from history (in reverse order to preserve indices)
    const newHistory = history.filter((h, idx) => !indicesToRemove.includes(idx));
    
    // Save
    localStorage.setItem('navalo_stock', JSON.stringify(stock));
    localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
    localStorage.setItem('navalo_history', JSON.stringify(newHistory));
    
    showToast(`${t('deleted')}`, 'success');
    await refreshAllData();
}

// ========================================
// DELIVERIES DISPLAY
// ========================================

async function updateDeliveriesDisplay() {
    try {
        // Get local deliveries first
        let deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');

        // Merge with Google Sheets data if connected
        if (storage.getMode() === 'googlesheets') {
            try {
                const remoteDeliveries = await storage.getDeliveries(20);
                if (Array.isArray(remoteDeliveries) && remoteDeliveries.length > 0) {
                    console.log('🚚 Merging deliveries. Local:', deliveries.length, 'Remote:', remoteDeliveries.length);

                    // Keep local-only deliveries (not yet in Google Sheets)
                    const localOnlyDeliveries = deliveries.filter(local =>
                        !remoteDeliveries.find(r => r.id === local.id || r.blNumber === local.blNumber)
                    );

                    if (localOnlyDeliveries.length > 0) {
                        console.log(`📦 Keeping ${localOnlyDeliveries.length} local-only deliveries`);
                        deliveries = [...remoteDeliveries, ...localOnlyDeliveries];
                    } else {
                        deliveries = remoteDeliveries;
                    }
                }
            } catch (e) {
                console.warn('Failed to load deliveries from Google Sheets:', e);
            }
        }

        const tbody = document.getElementById('blTableBody');
        if (!tbody) return;

        if (!Array.isArray(deliveries) || deliveries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }
        
        tbody.innerHTML = deliveries.map(d => {
            const invoiced = d.invoiceNumber ? true : false;
            const clientOrderNum = d.clientOrderNumber || d.linkedOrderNumber || '';

            // Build linked order info
            let linkedOrderInfo = '';
            if (d.linkedOrderNumber) {
                linkedOrderInfo = `<small>📋 ${d.linkedOrderNumber}</small>`;
            }

            // Build partial delivery badge
            let partialBadge = '';
            if (d.isPartial) {
                partialBadge = ' <span class="badge badge-warning-alt" style="font-size: 0.7em;">Partielle</span>';
            }

            return `<tr>
                <td><strong>${d.blNumber}</strong>${partialBadge}</td>
                <td>${formatDate(d.date)}</td>
                <td>${d.client}${linkedOrderInfo ? '<br>' + linkedOrderInfo : ''}</td>
                <td>${clientOrderNum ? `<small>${clientOrderNum}</small>` : '-'}</td>
                <td>${d.total} PAC</td>
                <td>${formatCurrency(d.value || 0)} CZK</td>
                <td>${invoiced ? `<span class="status-badge status-ok">${d.invoiceNumber}</span>` : `<span class="status-badge">${t('no')}</span>`}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="viewDelivery('${d.id}')" title="${t('view')}">👁️</button>
                    ${d.linkedOrderId ? `<button class="btn btn-outline btn-small" onclick="viewOrderFromDelivery('${d.linkedOrderId}')" title="Voir commande">📋</button>` : ''}
                    ${!invoiced ? `<button class="btn btn-secondary btn-small" onclick="createInvoiceFromBL('${d.id}')" title="${t('createInvoice')}">🧾</button>` : ''}
                    <button class="btn btn-outline btn-small" onclick="deleteDelivery('${d.id}')" title="${t('delete')}">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('Deliveries error:', e); }
}

// ========================================
// PURCHASE ORDERS
// ========================================

function openPOModal() {
    editingPOId = null;
    document.getElementById('poModalTitle').textContent = t('newPO');
    document.getElementById('poSupplier').value = '';
    document.getElementById('poCurrency').value = 'EUR';
    document.getElementById('poExpectedDate').value = '';
    document.getElementById('poModal').classList.add('active');
    document.getElementById('poItems').innerHTML = '';
    addPOItemRow(); // Add one default item row
    updatePOTotal();
}

function closePOModal() { document.getElementById('poModal').classList.remove('active'); editingPOId = null; }

function addPOItemRow(ref = '', qty = '') {
    const container = document.getElementById('poItems');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <select class="item-ref" onchange="updatePOTotal(); autoFillPrice(this)"><option value="">${t('refPlaceholder')}</option></select>
        <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="1" value="${qty}" onchange="updatePOTotal()">
        <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" onchange="updatePOTotal()">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); updatePOTotal()">✕</button>`;
    container.appendChild(row);

    // Filter by selected supplier
    const supplierName = document.getElementById('poSupplier').value;
    populateComponentSelectsBySupplier('poItems', supplierName);

    if (ref) setTimeout(() => { row.querySelector('.item-ref').value = ref; autoFillPrice(row.querySelector('.item-ref')); updatePOTotal(); }, 50);
}

function addPOCustomItemRow(name = '', qty = '', price = '') {
    const container = document.getElementById('poItems');
    const row = document.createElement('div');
    row.className = 'item-row item-row-custom';
    row.innerHTML = `
        <input type="text" class="item-ref item-custom-name" placeholder="${t('customItemPlaceholder') || 'Description article/service'}" value="${name}" oninput="updatePOTotal()">
        <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="1" value="${qty}" onchange="updatePOTotal()">
        <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" value="${price}" onchange="updatePOTotal()">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); updatePOTotal()">✕</button>`;
    container.appendChild(row);
}

// Auto-fill price when component is selected
function autoFillPrice(selectEl) {
    const row = selectEl.closest('.item-row');
    const ref = selectEl.value;
    const priceInput = row.querySelector('.item-price');
    const currency = document.getElementById('poCurrency')?.value || 'EUR';
    
    if (ref && priceInput && !priceInput.value) {
        const price = getComponentPrice(ref, currency);
        if (price && typeof price === 'number') {
            priceInput.value = price.toFixed(2);
        } else if (price) {
            priceInput.value = parseFloat(price).toFixed(2);
        }
    }
}

function updatePOTotal() {
    let total = 0;
    document.querySelectorAll('#poItems .item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += qty * price;
    });
    document.getElementById('poTotal').textContent = formatCurrency(total);
}

async function createPurchaseOrder() {
    const supplier = document.getElementById('poSupplier').value;
    const currency = document.getElementById('poCurrency').value;
    const expectedDate = document.getElementById('poExpectedDate').value;
    
    const items = [];
    document.querySelectorAll('#poItems .item-row').forEach(row => {
        const ref = row.querySelector('.item-ref').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        if (ref && qty > 0) {
            const comp = currentStock[ref];
            items.push({ ref, qty, price, name: comp?.name || ref });
        }
    });
    
    if (!supplier || items.length === 0) { showToast(t('selectAtLeastOne'), 'error'); return; }
    
    if (editingPOId) {
        let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        const index = pos.findIndex(p => p.id === editingPOId);
        if (index >= 0) {
            let totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
            pos[index] = { ...pos[index], supplier, currency, expectedDate, items, itemCount: items.length, totalValue, updatedAt: new Date().toISOString() };
            localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
            
            // Sync update to Google Sheets
            if (storage.getMode() === 'googlesheets') {
                try {
                    await storage.updatePurchaseOrder({ 
                        poId: editingPOId, 
                        supplier, currency, expectedDate, items, 
                        itemCount: items.length, totalValue 
                    });
                } catch (e) { console.warn('Failed to sync PO update to Google Sheets:', e); }
            }
            
            showToast(`${pos[index].poNumber} ${t('saved')}`, 'success');
            editingPOId = null;
            closePOModal();
            await refreshAllData();
        }
    } else {
        try {
            const result = await storage.createPurchaseOrder({ supplier, items, currency, expectedDate });
            if (result.success) {
                showToast(`${result.poNumber} ${t('saved')}`, 'success');
                closePOModal();
                await refreshAllData();
            } else { showToast(result.error || t('error'), 'error'); }
        } catch (e) { showToast(t('error') + ': ' + e.message, 'error'); }
    }
}

async function editPO(poId) {
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    const po = pos.find(p => p.id === poId);
    if (!po) { showToast(t('error'), 'error'); return; }
    
    editingPOId = poId;
    document.getElementById('poSupplier').value = po.supplier;
    document.getElementById('poCurrency').value = po.currency;
    document.getElementById('poExpectedDate').value = po.expectedDate || '';
    document.getElementById('poItems').innerHTML = '';
    (po.items || []).forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <select class="item-ref" required onchange="updatePOTotal()"><option value="">${t('refPlaceholder')}</option></select>
            <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="1" value="${item.qty}" required onchange="updatePOTotal()">
            <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" value="${item.price || ''}" onchange="updatePOTotal()">
            <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); updatePOTotal()">✕</button>`;
        document.getElementById('poItems').appendChild(row);
    });
    populateComponentSelects();
    const rows = document.querySelectorAll('#poItems .item-row');
    (po.items || []).forEach((item, i) => { if (rows[i]) rows[i].querySelector('.item-ref').value = item.ref; });
    updatePOTotal();
    document.getElementById('poModalTitle').textContent = t('edit');
    document.getElementById('poModal').classList.add('active');
}

async function deletePO(poId) {
    if (!confirm(t('confirmDelete'))) return;
    
    // Delete from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            await storage.deletePurchaseOrder(poId);
        } catch (e) {
            console.warn('Failed to delete from Google Sheets:', e);
        }
    }
    
    let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]').filter(p => p.id !== poId);
    localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
    await refreshAllData();
    showToast(t('deleted'), 'success');
}

async function sendPO(poId) {
    // Update localStorage
    let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    const index = pos.findIndex(p => p.id === poId);
    if (index >= 0) {
        pos[index].status = 'Envoyé';
        localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
    }
    
    // Sync to Google Sheets
    if (storage.getMode() === 'googlesheets') {
        await storage.updatePurchaseOrder({ poId, status: 'Envoyé' });
    }
    showToast(t('saved'), 'success');
    await updatePurchaseOrdersDisplay();
}

async function cancelPO(poId) {
    if (!confirm(t('confirmDelete'))) return;
    
    // Update localStorage
    let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    const index = pos.findIndex(p => p.id === poId);
    if (index >= 0) {
        pos[index].status = 'Annulé';
        localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
    }
    
    // Sync to Google Sheets
    if (storage.getMode() === 'googlesheets') {
        await storage.updatePurchaseOrder({ poId, status: 'Annulé' });
    }
    showToast(t('saved'), 'success');
    await updatePurchaseOrdersDisplay();
}

async function markPOReceived(poId) {
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    const po = pos.find(p => p.id === poId);
    if (!po) {
        console.error('PO not found:', poId);
        return;
    }

    console.log('📦 markPOReceived - PO:', po.poNumber);
    console.log('📦 PO items:', po.items);

    if (!po.items || po.items.length === 0) {
        showToast('Erreur: La commande n\'a pas d\'articles', 'error');
        return;
    }

    if (confirm(`${po.poNumber} - ${t('markReceived')}?\n\nCela va ajouter ${po.items.length} article(s) au stock.`)) {
        try {
            console.log('📦 Calling processReceipt with:', {
                bonNum: po.poNumber,
                items: po.items,
                supplier: po.supplier,
                currency: po.currency
            });

            const result = await storage.processReceipt({
                bonNum: po.poNumber, items: po.items, supplier: po.supplier,
                date: new Date().toISOString(), currency: po.currency, linkedPO: poId
            });

            console.log('📦 processReceipt result:', result);

            if (result.success) {
                // Update localStorage
                const index = pos.findIndex(p => p.id === poId);
                if (index >= 0) {
                    pos[index].status = 'Reçu';
                    localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
                }

                // Sync to Google Sheets
                if (storage.getMode() === 'googlesheets') {
                    await storage.updatePurchaseOrder({ poId, status: 'Reçu' });
                }

                const totalQty = po.items.reduce((sum, item) => sum + (item.qty || 0), 0);
                showToast(`${po.poNumber} reçu - ${totalQty} articles ajoutés au stock`, 'success');
                await refreshAllData();
            } else {
                console.error('processReceipt failed:', result);
                showToast('Erreur: ' + (result.error || 'Échec de la réception'), 'error');
            }
        } catch (e) {
            console.error('markPOReceived error:', e);
            showToast(t('error') + ': ' + e.message, 'error');
        }
    }
}

async function viewPO(poId) {
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    currentPO = pos.find(p => p.id === poId);
    if (currentPO) showPOPreview(currentPO);
}

function showPOPreview(po) {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };
    let itemsHtml = '', total = 0;
    (po.items || []).forEach((item, i) => {
        const lineTotal = (item.qty || 0) * (item.price || 0);
        total += lineTotal;
        const comp = currentStock[item.ref];
        itemsHtml += `<tr>
            <td>${i + 1}</td><td><code>${item.ref}</code></td><td>${comp?.name || item.name || item.ref}</td>
            <td class="text-right">${item.qty}</td><td class="text-right">${item.price ? formatCurrency(item.price) : '-'}</td>
            <td class="text-right">${item.price ? formatCurrency(lineTotal) : '-'}</td>
        </tr>`;
    });

    // Get supplier details from contacts
    const contacts = getContacts();
    const supplierContact = contacts.find(c => c.name === po.supplier);
    let supplierHtml = `<strong>${po.supplier}</strong>`;
    if (supplierContact) {
        if (supplierContact.address) supplierHtml += `<br>${supplierContact.address}`;
        if (supplierContact.ico) supplierHtml += `<br>IČO: ${supplierContact.ico}`;
        if (supplierContact.email) supplierHtml += `<br>${supplierContact.email}`;
        if (supplierContact.phone) supplierHtml += `<br>${supplierContact.phone}`;
    }

    document.getElementById('poPreview').innerHTML = `
        <div class="delivery-note po-note">
            <div class="dn-header">
                <div class="dn-company"><h2>${config.COMPANY.name}</h2><p>${config.COMPANY.address}</p></div>
                <div class="dn-info">
                    <h1>${t('purchaseOrder')}</h1>
                    <h2>${po.poNumber}</h2>
                    <p>${t('date')}: ${formatDate(po.date)}</p>
                    ${po.expectedDate ? `<p><strong>${t('expectedDeliveryDate')}:</strong> ${formatDate(po.expectedDate)}</p>` : ''}
                </div>
            </div>
            <div class="dn-addresses">
                <div class="dn-address"><h4>${t('from')}</h4><div class="dn-address-box"><strong>${config.COMPANY.name}</strong><br>${config.COMPANY.address}</div></div>
                <div class="dn-address"><h4>${t('to')}</h4><div class="dn-address-box">${supplierHtml}</div></div>
            </div>
            <table class="dn-table">
                <thead><tr><th>#</th><th>${t('reference')}</th><th>${t('designation')}</th><th class="text-right">${t('qty')}</th><th class="text-right">${t('unitPrice')}</th><th class="text-right">${t('total')}</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot><tr class="dn-total"><td colspan="5" class="text-right"><strong>TOTAL</strong></td><td class="text-right"><strong>${formatCurrency(total)} ${po.currency}</strong></td></tr></tfoot>
            </table>
            <div class="po-footer"><p>${t('confirmOrder')}</p></div>
        </div>`;
    document.getElementById('poPreviewModal').classList.add('active');
}

function closePOPreviewModal() { document.getElementById('poPreviewModal').classList.remove('active'); }
function printPO() {
    const originalTitle = document.title;
    document.title = currentPO?.poNumber || 'Commande';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

async function sendPurchaseOrderByEmail() {
    if (!currentPO) {
        showToast('Aucune commande sélectionnée', 'error');
        return;
    }

    // Get supplier email
    const contacts = getContacts();
    const supplier = contacts.find(c => c.name === currentPO.supplier);

    if (!supplier || !supplier.email) {
        showToast('Email du fournisseur non trouvé. Veuillez ajouter un email dans les contacts.', 'error');
        return;
    }

    // Confirm send and ask for CC addresses
    if (!confirm(`Envoyer la commande ${currentPO.poNumber} à ${supplier.email}?`)) {
        return;
    }

    // Ask for CC addresses
    const ccAddresses = prompt(
        `Ajouter des adresses en copie (CC)?\n\nSéparez les adresses par des virgules ou points-virgules.\nExemple: email1@domain.com, email2@domain.com\n\nLaissez vide si pas de copie.`,
        ''
    );

    try {
        // Get the PO HTML
        const poHtml = document.getElementById('poPreview').innerHTML;

        // Prepare email data
        const emailData = {
            to: supplier.email,
            replyTo: 'tomas.karas@hotjet.cz',
            subject: `Objednávka ${currentPO.poNumber} - ${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            body: `Dobrý den,\n\nV příloze naleznete naši objednávku ${currentPO.poNumber}.\n\nPro odpověď kontaktujte: tomas.karas@hotjet.cz\n\nS pozdravem,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            htmlContent: poHtml,
            documentNumber: currentPO.poNumber,
            documentType: 'Objednávka'
        };

        // Add CC if provided
        if (ccAddresses && ccAddresses.trim()) {
            emailData.cc = ccAddresses.trim();
        }

        // Send via Google Apps Script
        const result = await storage.apiPost('sendEmail', emailData);

        if (result && result.success) {
            showToast(`Commande envoyée à ${supplier.email}`, 'success');
        } else {
            throw new Error(result?.error || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Error sending purchase order:', error);
        showToast('Erreur lors de l\'envoi: ' + error.message, 'error');
    }
}

async function updatePurchaseOrdersDisplay() {
    try {
        let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        
        // Load from Google Sheets if connected
        if (storage.getMode() === 'googlesheets') {
            try {
                const remotePOs = await storage.getPurchaseOrders(200);
                if (Array.isArray(remotePOs) && remotePOs.length > 0) {
                    pos = remotePOs;
                    localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
                    console.log('📦 Loaded', pos.length, 'purchase orders from Google Sheets');
                }
            } catch (e) {
                console.warn('Failed to load purchase orders from Google Sheets:', e);
            }
        }
        
        const tbody = document.getElementById('poTableBody');
        const statusFilter = document.getElementById('poStatusFilter')?.value || 'all';
        
        if (!tbody) return;
        if (!Array.isArray(pos) || pos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">${t('noData')}</td></tr>`;
            updatePOStats([]);
            return;
        }
        
        let filtered = pos;
        if (statusFilter !== 'all') filtered = pos.filter(po => po.status === statusFilter);
        updatePOStats(pos);
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }
        
        tbody.innerHTML = filtered.map(po => {
            const statusClass = po.status === 'Reçu' ? 'status-ok' : po.status === 'Envoyé' ? 'status-low' : po.status === 'Annulé' ? 'status-critical' : '';
            return `<tr>
                <td><strong>${po.poNumber}</strong></td>
                <td>${formatDate(po.date)}</td>
                <td>${po.supplier}</td>
                <td>${po.itemCount}</td>
                <td>${formatCurrency(po.totalValue)} ${po.currency}</td>
                <td><span class="status-badge ${statusClass}">${po.status}</span></td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="viewPO('${po.id}')" title="${t('view')}">👁️</button>
                    ${po.status === 'Brouillon' || po.status === 'Envoyé' ? `<button class="btn btn-outline btn-small" onclick="editPO('${po.id}')" title="${t('edit')}">✏️</button>` : ''}
                    ${po.status === 'Brouillon' ? `<button class="btn btn-secondary btn-small" onclick="sendPO('${po.id}')" title="${t('markSent')}">📤</button>` : ''}
                    ${po.status === 'Envoyé' ? `<button class="btn btn-primary btn-small" onclick="markPOReceived('${po.id}')" title="${t('markReceived')}">✓</button>` : ''}
                    ${po.status === 'Brouillon' || po.status === 'Envoyé' ? `<button class="btn btn-outline btn-small" onclick="cancelPO('${po.id}')" title="${t('cancel')}">✕</button>` : ''}
                    <button class="btn btn-outline btn-small" onclick="deletePO('${po.id}')" title="${t('delete')}">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('PO error:', e); }
}

function updatePOStats(pos) {
    const drafts = pos.filter(p => p.status === 'Brouillon');
    const sent = pos.filter(p => p.status === 'Envoyé');
    const received = pos.filter(p => p.status === 'Reçu');
    const pendingValue = [...drafts, ...sent].reduce((sum, po) => sum + (po.totalValue || 0), 0);
    
    document.getElementById('poDraftCount').textContent = drafts.length;
    document.getElementById('poSentCount').textContent = sent.length;
    document.getElementById('poReceivedCount').textContent = received.length;
    document.getElementById('poPendingValue').textContent = formatCurrency(pendingValue);
}

function onPOCurrencyChange() { updatePOTotal(); }

function exportPurchaseOrders() {
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    let csv = 'Číslo;Datum;Dodavatel;Položky;Hodnota;Měna;Stav\n';
    pos.forEach(po => { csv += `${po.poNumber};${formatDate(po.date)};${po.supplier};${po.itemCount};${po.totalValue};${po.currency};${po.status}\n`; });
    downloadCSV(csv, `objednavky_${new Date().toISOString().split('T')[0]}.csv`);
}

// ========================================
// INVOICES (ISSUED)
// ========================================

async function updateInvoicesDisplay() {
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');

    // Load from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getInvoices(200);
            if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
                invoices = remoteInvoices;
                localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
                console.log('📦 Loaded', invoices.length, 'issued invoices from Google Sheets');
                console.log('🔍 Premier invoice - clientOrderNumber:', invoices[0]?.clientOrderNumber);
            }
        } catch (e) {
            console.warn('Failed to load invoices from Google Sheets:', e);
        }
    }

    // Normalize isProforma field for all invoices
    invoices = invoices.map(inv => ({
        ...inv,
        isProforma: inv.isProforma || inv.type === 'proforma' || (inv.number && String(inv.number).startsWith('PF'))
    }));

    // Update localStorage with normalized data
    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));

    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    
    if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-muted text-center">${t('noData')}</td></tr>`;
        updateInvoiceStats([]);
        return;
    }
    
    const typeFilter = document.getElementById('invoiceTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all';
    const monthFilter = document.getElementById('invoiceMonthFilter')?.value || '';

    // Helper to check proforma status (handles boolean, string values, and ZL prefix for legacy data)
    const isProformaInv = (inv) => inv.isProforma === true || inv.isProforma === 'true' || inv.isProforma === 'TRUE' || (inv.number && inv.number.startsWith('ZL'));

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !isProformaInv(inv));
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => isProformaInv(inv));
    if (statusFilter === 'paid') filtered = filtered.filter(inv => inv.paid);
    else if (statusFilter === 'unpaid') filtered = filtered.filter(inv => !inv.paid);
    if (monthFilter) filtered = filtered.filter(inv => inv.date?.substring(0, 7) === monthFilter);
    
    updateInvoiceStats(invoices);
    
    tbody.innerHTML = filtered.map(inv => {
        const isOverdue = !inv.paid && new Date(inv.dueDate) < new Date();
        const statusClass = inv.paid ? 'status-ok' : (isOverdue ? 'status-critical' : 'status-low');
        const statusText = inv.paid ? t('paid') : (isOverdue ? t('overdue') : t('unpaid'));
        const depositInfo = inv.isProforma && inv.depositPercent && inv.depositPercent < 100 ? ` ${inv.depositPercent}%` : '';
        const proformaBadge = inv.isProforma ? `<span class="badge badge-proforma" style="margin-left: 4px;">ZÁLOHA${depositInfo}</span>` : '';
        return `<tr class="${isOverdue && !inv.paid ? 'row-warning' : ''}">
            <td><strong>${inv.number}</strong>${proformaBadge}</td>
            <td>${formatDate(inv.date)}</td>
            <td>${inv.client}</td>
            <td>${inv.clientOrderNumber || inv.linkedOrderNumber || '-'}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td class="text-right">${formatCurrency(inv.subtotal || 0)}</td>
            <td class="text-right">${formatCurrency(inv.vat || 0)}</td>
            <td class="text-right font-bold">${formatCurrency(inv.total)} ${inv.currency}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-outline btn-small" onclick="viewInvoice('${inv.number}')" title="${t('view')}">👁️</button>
                ${inv.isProforma && !inv.paid ? `<button class="btn btn-secondary btn-small" onclick="markProformaPaidAndGenerateTaxDoc('${inv.number}')" title="Zaplaceno → Daňový doklad">💰📄</button>` : ''}
                ${inv.isProforma && inv.paid ? `<button class="btn btn-primary btn-small" onclick="generateTaxDocument('${inv.number}')" title="Daňový doklad">📄</button>` : ''}
                ${inv.isProforma ? `<button class="btn btn-outline btn-small" onclick="convertProformaToInvoice('${inv.number}')" title="Convertir en facture">🔄</button>` : ''}
                ${!inv.paid && !inv.isProforma ? `<button class="btn btn-primary btn-small" onclick="markInvoicePaid('${inv.number}')" title="${t('markPaid')}">💰</button>` : ''}
                <button class="btn btn-outline btn-small" onclick="editInvoice('${inv.number}')" title="${t('edit')}">✏️</button>
                <button class="btn btn-outline btn-small" onclick="deleteInvoice('${inv.number}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function updateInvoiceStats(invoices) {
    const unpaid = invoices.filter(inv => !inv.paid);
    const overdue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date());
    const rate = exchangeRate || 24.25;
    const unpaidTotal = unpaid.reduce((sum, inv) => {
        const total = inv.total || 0;
        // Convert EUR invoices to CZK for the summary
        if (inv.currency === 'EUR') {
            const invRate = inv.exchangeRate || rate;
            return sum + (total * invRate);
        }
        return sum + total;
    }, 0);

    document.getElementById('invoiceTotalCount').textContent = invoices.length;
    document.getElementById('invoiceUnpaidCount').textContent = unpaid.length;
    document.getElementById('invoiceUnpaidValue').textContent = formatCurrency(unpaidTotal);
    const overdueEl = document.getElementById('invoiceOverdueCount');
    if (overdueEl) overdueEl.textContent = overdue.length;
}

// Generate deduction line item HTML for invoice table (7-column format)
function generateProformaDeductionItemHtml(inv) {
    if (!inv.linkedProforma) return '';

    const pf = inv.linkedProforma;
    const vatRate = inv.vatRate || 21;
    const curr = inv.currency || 'CZK';
    // DD number from stored data or derive from proforma number
    const ddNumber = pf.ddNumber || pf.number.replace(/^(ZL|PI|PF)-?/, 'DD-');
    const orderRef = inv.clientOrderNumber || inv.linkedOrderNumber || '';

    // Calculate the unit price (per item) for the deduction line
    // Total includes VAT, so we need subtotal and vat separately
    const deductionSubtotal = pf.subtotal;
    const deductionVat = pf.vat;
    const deductionTotal = pf.total;

    return `
        <tr style="color: #dc2626;">
            <td>Záloha daňový doklad k přijaté platbě ${ddNumber}${orderRef ? ` na objednávku ${orderRef}` : ''}</td>
            <td class="text-center">1</td>
            <td class="text-center">ks</td>
            <td class="text-right">-${formatCurrency(deductionSubtotal)} ${curr}</td>
            <td class="text-right">-${formatCurrency(deductionSubtotal)} ${curr}</td>
            <td class="text-center">${vatRate}%</td>
            <td class="text-right">-${formatCurrency(deductionTotal)} ${curr}</td>
        </tr>
    `;
}

// Generate CZK conversion section with proforma deduction (shows both invoice and DD rates)
// Generate deposit amount section for proforma invoices
function generateProformaDepositHtml(inv, totalWithVat, currency) {
    // Only for proformas
    if (!inv.isProforma && inv.type !== 'proforma' && !(inv.number && String(inv.number).startsWith('PF'))) {
        return '';
    }

    const depositPercent = inv.depositPercent || 100;
    const depositAmount = totalWithVat * depositPercent / 100;

    // Always show the "K úhradě" section, highlight if deposit < 100%
    const isPartialDeposit = depositPercent < 100;
    const bgColor = isPartialDeposit ? '#fff3cd' : '#d4edda';
    const borderColor = isPartialDeposit ? '#ffc107' : '#28a745';

    return `
        <div style="margin-top: 10px; padding: 10px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 4px;">
            ${isPartialDeposit ? `<div style="font-size: 10px; color: #856404; margin-bottom: 5px;"><strong>Záloha: ${depositPercent}%</strong> z celkové částky ${formatCurrency(totalWithVat)} ${currency}</div>` : ''}
            <div style="text-align: right; font-size: 14px; font-weight: bold; color: #000;">
                K úhradě: <span style="font-size: 18px;">${formatCurrency(depositAmount)} ${currency}</span>
            </div>
        </div>
    `;
}

function generateProformaDeductionHtml(inv) {
    if (!inv.linkedProforma) return '';

    const pf = inv.linkedProforma;
    const pfRate = pf.paidExchangeRate;
    const invoiceRate = inv.exchangeRate;
    const ddNumber = pf.ddNumber || pf.number.replace(/^(ZL|PI|PF)-?/, 'DD-');

    // Calculate net amounts (after deduction)
    const netSubtotal = inv.subtotal - pf.subtotal;
    const netVat = inv.vat - pf.vat;
    const netTotal = inv.total - pf.total;

    if (inv.currency === 'EUR' && invoiceRate) {
        // CZK amounts for the invoice (at invoice rate)
        const invSubtotalCZK = inv.subtotal * invoiceRate;
        const invVatCZK = inv.vat * invoiceRate;
        const invTotalCZK = inv.total * invoiceRate;

        // CZK amounts for the DD/proforma (at payment rate)
        const ddSubtotalCZK = pf.paidSubtotalCZK || (pf.subtotal * (pfRate || invoiceRate));
        const ddVatCZK = pf.paidVatCZK || (pf.vat * (pfRate || invoiceRate));
        const ddTotalCZK = pf.paidAmountCZK || (pf.total * (pfRate || invoiceRate));

        return `
            <div class="inv-czk-conversion" style="margin-top: 8px; padding: 6px; background: #fafafa; border: 1px solid #ccc; font-size: 8px; color: #555;">
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; border-right: 1px solid #ddd; padding-right: 10px;">
                        <div style="font-weight: bold; font-size: 8px; margin-bottom: 3px;">Faktura ${inv.number}</div>
                        <div style="font-size: 7px; margin-bottom: 2px;">Směnný kurz 1 EUR = ${invoiceRate.toFixed(3)} Kč</div>
                        <table style="width: 100%; font-size: 7px;">
                            <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(invSubtotalCZK)} Kč</td></tr>
                            <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(invVatCZK)} Kč</td></tr>
                            <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(invTotalCZK)} Kč</td></tr>
                        </table>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 8px; margin-bottom: 3px;">${ddNumber}</div>
                        <div style="font-size: 7px; margin-bottom: 2px;">Směnný kurz 1 EUR = ${(pfRate || invoiceRate).toFixed(3)} Kč</div>
                        <table style="width: 100%; font-size: 7px;">
                            <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(ddSubtotalCZK)} Kč</td></tr>
                            <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(ddVatCZK)} Kč</td></tr>
                            <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(ddTotalCZK)} Kč</td></tr>
                        </table>
                    </div>
                </div>
                <div style="margin-top: 6px; padding: 5px; border: 1px solid #000; background: #fff;">
                    <table style="width: 100%; font-size: 8px;">
                        <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(netSubtotal)} EUR</td></tr>
                        <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(netVat)} EUR</td></tr>
                        <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(netTotal)} EUR</td></tr>
                        <tr><td>Uhrazeno zálohami:</td><td style="text-align: right;">${formatCurrency(pf.total)} EUR</td></tr>
                    </table>
                    <div style="margin-top: 5px; text-align: right; font-size: 11px; font-weight: bold; color: #000;">
                        K úhradě: <span style="font-size: 14px;">${formatCurrency(netTotal)} EUR</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // CZK invoice with proforma deduction
        return `
            <div class="inv-czk-conversion" style="margin-top: 8px; padding: 6px; background: #fafafa; border: 1px solid #ccc; font-size: 8px; color: #555;">
                <div style="padding: 5px; border: 1px solid #000; background: #fff;">
                    <table style="width: 100%; font-size: 8px;">
                        <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(netSubtotal)} Kč</td></tr>
                        <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(netVat)} Kč</td></tr>
                        <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(netTotal)} Kč</td></tr>
                        <tr><td>Uhrazeno zálohami (${ddNumber}):</td><td style="text-align: right;">${formatCurrency(pf.total)} Kč</td></tr>
                    </table>
                    <div style="margin-top: 5px; text-align: right; font-size: 11px; font-weight: bold; color: #000;">
                        K úhradě: <span style="font-size: 14px;">${formatCurrency(netTotal)} Kč</span>
                    </div>
                </div>
            </div>
        `;
    }
}

function viewInvoice(invNumber) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) return;
    currentInvoice = inv;

    const config = CONFIG || {};
    const company = config.COMPANY || {};
    // Use saved vatRate, default to 21 if not set (but check for 0 properly)
    const vatRate = typeof inv.vatRate === 'number' ? inv.vatRate : 21;

    // VS = just the numeric part of invoice number (FV2026005 -> 2026005)
    const varSymbol = inv.varSymbol || inv.number.replace(/\D/g, '');

    // Generate items HTML with full columns: Popis | Množství | MJ | Cena za MJ | Celkem bez DPH | DPH | Celkem s DPH
    const curr = inv.currency || 'CZK';
    let isUnderPacHeader = false;
    let itemsHtml = (inv.items || []).map(item => {
        // Special formatting for PAC headers (like in repair quote)
        if (item.isPacHeader) {
            isUnderPacHeader = true;
            return `
        <tr style="background-color: #dbeafe;">
            <td colspan="7" style="padding: 10px; border-top: 2px solid #3b82f6; font-weight: bold; font-size: 11px;">
                ${item.name}
            </td>
        </tr>
    `;
        }

        const itemSubtotal = item.qty * item.price;
        const itemVat = itemSubtotal * vatRate / 100;
        const itemTotal = itemSubtotal + itemVat;
        // Add slight indent for items under PAC header
        const indent = isUnderPacHeader ? 'padding-left: 20px;' : '';
        return `
        <tr>
            <td style="${indent}">${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-center">ks</td>
            <td class="text-right">${formatCurrency(item.price)} ${curr}</td>
            <td class="text-right">${formatCurrency(itemSubtotal)} ${curr}</td>
            <td class="text-center">${vatRate}%</td>
            <td class="text-right">${formatCurrency(itemTotal)} ${curr}</td>
        </tr>
    `;
    }).join('');

    // Add proforma deduction line if applicable
    itemsHtml += generateProformaDeductionItemHtml(inv);

    // Calculate net totals (after proforma deduction)
    const hasProformaDeduction = inv.linkedProforma && inv.linkedProforma.total > 0;
    const netSubtotal = hasProformaDeduction ? inv.subtotal - inv.linkedProforma.subtotal : inv.subtotal;
    const netVat = hasProformaDeduction ? inv.vat - inv.linkedProforma.vat : inv.vat;
    const netTotal = hasProformaDeduction ? inv.total - inv.linkedProforma.total : inv.total;

    const bankInfo = inv.currency === 'EUR' ? company.bank?.EUR : company.bank?.CZK;
    
    // CZK conversion section for EUR invoices (NOT for proforma, NOT when proforma deduction exists)
    let czkConversionHtml = '';
    if (inv.currency === 'EUR' && inv.exchangeRate && !inv.isProforma && !hasProformaDeduction) {
        const rate = parseFloat(inv.exchangeRate);
        const subtotalCZK = inv.subtotal * rate;
        const vatCZK = inv.vat * rate;
        const totalCZK = inv.total * rate;

        czkConversionHtml = `
            <div class="inv-czk-conversion" style="margin-top: 8px; padding: 6px; border: 1px solid #ccc; font-size: 8px; color: #666; background: #fafafa;">
                <div style="margin-bottom: 3px;">Ekvivalent v CZK dle kurzu ČNB ${rate.toFixed(3)} CZK/EUR (k DUZP ${formatDate(inv.taxDate || inv.date)})</div>
                <table style="width: 100%; font-size: 8px;">
                    <tr><td>Základ daně v CZK:</td><td style="text-align: right;">${formatCurrency(subtotalCZK)} CZK</td></tr>
                    <tr><td>DPH v CZK (${inv.vatRate || 21}%):</td><td style="text-align: right;">${formatCurrency(vatCZK)} CZK</td></tr>
                    <tr><td><strong>Celkem s DPH v CZK:</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalCZK)} CZK</strong></td></tr>
                </table>
            </div>
        `;
    }
    
    const invoiceTitle = inv.isProforma ? 'ZÁLOHOVÁ FAKTURA' : 'DAŇOVÝ DOKLAD FAKTURA';
    const proformaBanner = inv.isProforma ? '<div style="background: #8b5cf6; color: white; text-align: center; padding: 0.3rem; font-weight: bold; margin-bottom: 0.5rem; border-radius: 4px; font-size: 10px;">⚠️ PROFORMA - Document non fiscal</div>' : '';

    document.getElementById('invoicePreview').innerHTML = `
        <div class="invoice-doc">
            <div class="inv-title" style="text-align: center; font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                ${invoiceTitle} ${inv.number}
            </div>
            ${proformaBanner}
            <div class="inv-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div class="inv-company" style="flex: 1;">
                    <strong style="font-size: 12px;">${company.name || 'NAVALO s.r.o.'}</strong><br>
                    <span style="font-size: 10px;">${company.address || ''}</span><br>
                    <span style="font-size: 10px;">IČO: ${company.ico || ''} | DIČ: ${company.dic || ''}</span>
                </div>
                <div class="inv-info" style="text-align: right; font-size: 10px;">
                    <p style="margin: 2px 0;">Datum vystavení: ${formatDate(inv.date)}</p>
                    ${!inv.isProforma ? `<p style="margin: 2px 0;">DUZP: ${formatDate(inv.taxDate || inv.date)}</p>` : ''}
                    <p style="margin: 2px 0;">Splatnost: ${formatDate(inv.dueDate)}</p>
                    <p style="margin: 2px 0;">Variabilní symbol: ${varSymbol}</p>
                    ${inv.linkedOrderNumber ? `<p style="margin: 2px 0;"><strong>Číslo objednávky:</strong> ${inv.linkedOrderNumber}</p>` : ''}
                    <p style="margin: 2px 0;"><strong>Číslo obj. zákazníka:</strong> ${inv.clientOrderNumber || '-'}</p>
                </div>
            </div>
            <div class="inv-parties" style="display: flex; gap: 20px; margin-bottom: 10px;">
                <div class="inv-party" style="flex: 1;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">DODAVATEL</div>
                    <div class="inv-party-box" style="border: 1px solid #000; padding: 8px; font-size: 10px;">
                        <strong>${company.name || 'NAVALO s.r.o.'}</strong><br>
                        ${company.address || ''}<br>
                        IČO: ${company.ico || ''}<br>
                        DIČ: ${company.dic || ''}
                    </div>
                </div>
                <div class="inv-party" style="flex: 1;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">ZÁKAZNÍK</div>
                    <div class="inv-party-box" style="border: 1px solid #000; padding: 8px; font-size: 10px;">
                        <strong>${inv.client}</strong><br>
                        ${inv.clientAddress || ''}<br>
                        IČO: ${inv.clientIco || ''}<br>
                        DIČ: ${inv.clientDic || ''}
                    </div>
                </div>
            </div>
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Popis položky</th>
                        <th>Množství</th>
                        <th>MJ</th>
                        <th>Cena za MJ</th>
                        <th>Celkem bez DPH</th>
                        <th>DPH</th>
                        <th>Celkem s DPH</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr class="inv-total">
                        <td colspan="4" class="text-right"><strong>Celkem:</strong></td>
                        <td class="text-right">${formatCurrency(netSubtotal)} ${curr}</td>
                        <td class="text-right">${formatCurrency(netVat)} ${curr}</td>
                        <td class="text-right">${formatCurrency(netTotal)} ${curr}</td>
                    </tr>
                </tfoot>
            </table>
            ${generateProformaDeductionHtml(inv)}
            ${czkConversionHtml}
            ${generateProformaDepositHtml(inv, netTotal, curr)}
            <div class="inv-payment" style="margin-top: 10px; padding: 8px; border: 1px solid #000; font-size: 9px;">
                <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px;">Bankovní spojení</div>
                <strong>${bankInfo?.name || ''}</strong><br>
                Účet: ${bankInfo?.account || ''}<br>
                IBAN: ${bankInfo?.iban || ''}<br>
                BIC: ${bankInfo?.bic || ''}
            </div>
            <div style="margin-top: 15px; font-size: 9px;">
                <strong>Vyhotovil:</strong> Taňa Milatová
            </div>
        </div>
    `;
    const modal = document.getElementById('invoicePreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

async function openFreeInvoiceModal() {
    editingInvoiceNumber = null;
    document.getElementById('invoiceModalTitle').textContent = t('newInvoice');
    document.getElementById('invoiceForm').reset();
    const proformaCheckbox = document.getElementById('invIsProforma');
    if (proformaCheckbox) proformaCheckbox.checked = false;

    // Reset deposit percentage field (hidden for regular invoices)
    const depositGroup = document.getElementById('depositPercentGroup');
    const depositInput = document.getElementById('invDepositPercent');
    if (depositGroup) depositGroup.style.display = 'none';
    if (depositInput) depositInput.value = 100;

    document.getElementById('invNumber').value = await getNextInvoiceNumber();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invDate').value = today;
    document.getElementById('invTaxDate').value = today;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    document.getElementById('invDueDate').value = dueDate.toISOString().split('T')[0];
    document.getElementById('invVatRate').value = CONFIG?.DEFAULT_VAT_RATE || 21;
    document.getElementById('invCurrency').value = 'CZK';
    document.getElementById('invExchangeRate').value = exchangeRate.toFixed(3);
    document.getElementById('invExchangeRateGroup').style.display = 'none';

    populateClientSelect('invClient');
    populateRecOrderSelect();
    populatePaidProformaSelect();
    document.getElementById('invClientOrderNum').value = '';
    document.getElementById('invItems').innerHTML = '';
    addInvoiceItemRow();

    document.getElementById('invoiceModal').classList.add('active');
}

// Populate dropdown with paid proformas for deduction
function populatePaidProformaSelect() {
    const select = document.getElementById('invLinkedProforma');
    if (!select) return;

    select.innerHTML = '<option value="">-- Žádná --</option>';

    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    // Filter: proformas that are paid and not already used in another invoice
    // Check both isProforma flag and type === 'proforma' (from Google Sheets)
    const paidProformas = invoices.filter(inv => {
        const isProformaDoc = inv.isProforma || inv.type === 'proforma' || (inv.number && String(inv.number).startsWith('PF'));
        return isProformaDoc && inv.paid && !inv.usedInInvoice;
    });

    paidProformas.forEach(pf => {
        const opt = document.createElement('option');
        opt.value = pf.number;

        // Use tax document amounts (with 21% VAT) - these are the deposit amounts with VAT
        const depositPercent = pf.depositPercent || 100;
        const fullSubtotal = (pf.items || []).reduce((sum, item) => sum + (item.qty * item.price), 0);
        const taxDocSubtotal = pf.taxDocSubtotal || (fullSubtotal * depositPercent / 100);
        const taxDocVat = pf.taxDocVat || Math.round(taxDocSubtotal * 21) / 100;
        const taxDocTotal = pf.taxDocTotal || (taxDocSubtotal + taxDocVat);

        const rateInfo = pf.paidExchangeRate ? ` (kurz: ${pf.paidExchangeRate.toFixed(3)})` : '';
        const percentInfo = depositPercent < 100 ? ` [${depositPercent}%]` : '';
        opt.textContent = `${pf.number} - ${pf.client} - ${formatCurrency(taxDocTotal)} ${pf.currency} s DPH${percentInfo}${rateInfo}`;
        opt.dataset.client = pf.client;
        opt.dataset.currency = pf.currency;
        // Store tax document amounts (with VAT) - this is the deposit amount to deduct
        opt.dataset.total = taxDocTotal;
        opt.dataset.subtotal = taxDocSubtotal;
        opt.dataset.vat = taxDocVat;
        opt.dataset.depositPercent = depositPercent;
        opt.dataset.paidExchangeRate = pf.paidExchangeRate || '';
        opt.dataset.paidAmountCZK = pf.paidAmountCZK || '';
        opt.dataset.paidSubtotalCZK = pf.paidSubtotalCZK || '';
        opt.dataset.paidVatCZK = pf.paidVatCZK || '';
        // DD number for reference
        opt.dataset.ddNumber = pf.number.replace(/^(ZL|PI|PF)-?/, 'DD-');
        select.appendChild(opt);
    });
}

// Handle proforma selection for deduction
function onLinkedProformaChange() {
    const select = document.getElementById('invLinkedProforma');
    if (!select || !select.value) return;

    const opt = select.options[select.selectedIndex];
    const proformaClient = opt.dataset.client;
    const proformaCurrency = opt.dataset.currency;

    // Auto-select same client if not selected
    const clientSelect = document.getElementById('invClient');
    if (clientSelect && !clientSelect.value) {
        const contacts = getContacts();
        const clientContact = contacts.find(c => c.name === proformaClient);
        if (clientContact) {
            clientSelect.value = clientContact.id;
            onClientChange();
        }
    }

    // Set same currency
    if (proformaCurrency) {
        document.getElementById('invCurrency').value = proformaCurrency;
        onInvCurrencyChange();
    }
}

async function onInvTaxDateChange() {
    const currency = document.getElementById('invCurrency').value;
    if (currency === 'EUR') {
        const taxDate = document.getElementById('invTaxDate').value;
        if (taxDate) {
            try {
                const rateInfo = await storage.getExchangeRateForDate('EUR', taxDate);
                if (rateInfo && rateInfo.rate) {
                    document.getElementById('invExchangeRate').value = rateInfo.rate.toFixed(3);
                    console.log(`✅ CNB rate for ${taxDate}: ${rateInfo.rate.toFixed(3)}`);
                } else {
                    console.warn('⚠️ No rate found for date, using default');
                    document.getElementById('invExchangeRate').value = exchangeRate.toFixed(3);
                }
            } catch (error) {
                console.error('Error fetching exchange rate:', error);
                document.getElementById('invExchangeRate').value = exchangeRate.toFixed(3);
            }
        }
    }
    calculateInvoiceTotal();
}

function onInvCurrencyChange() {
    const currency = document.getElementById('invCurrency').value;
    const rateGroup = document.getElementById('invExchangeRateGroup');
    if (currency === 'EUR') {
        rateGroup.style.display = 'block';
        // Fetch rate for tax date if available, otherwise use current rate
        const taxDate = document.getElementById('invTaxDate').value;
        if (taxDate) {
            onInvTaxDateChange();
        } else {
            document.getElementById('invExchangeRate').value = exchangeRate.toFixed(3);
        }
    } else {
        rateGroup.style.display = 'none';
    }
    calculateInvoiceTotal();
}

async function createInvoiceFromBL(blId) {
    // Fetch deliveries from storage (supports both GS and localStorage)
    let deliveries;
    try {
        deliveries = await storage.getDeliveries(100);
    } catch (e) {
        deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
    }
    const delivery = deliveries.find(d => d.id === blId);
    if (!delivery) {
        showToast('Livraison introuvable', 'error');
        return;
    }
    
    openFreeInvoiceModal();
    
    // Fill client info
    const contacts = getContacts();
    const client = contacts.find(c => c.name === delivery.client);
    if (client) {
        document.getElementById('invClient').value = client.id;
        onClientChange();
    } else if (delivery.client === CONFIG?.DEFAULT_CLIENT?.name) {
        document.getElementById('invClient').value = 'default';
        onClientChange();
    }
    
    // Try to find matching received order for prices
    const receivedOrders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const qty = delivery.quantities ? { ...delivery.quantities } : {};
    // Reconstruct quantities from flat fields (backward compatibility)
    if (delivery.tx9 > 0) qty['TX9'] = delivery.tx9;
    if (delivery.tx12_3ph > 0) qty['TX12-3PH'] = delivery.tx12_3ph;
    if (delivery.tx12_1ph > 0) qty['TX12-1PH'] = delivery.tx12_1ph;
    if (delivery.th11 > 0) qty['TH11'] = delivery.th11;
    const models = getPacModels();
    
    // Find a received order for same client with matching quantities
    let matchingOrder = receivedOrders.find(o => {
        if (o.client !== delivery.client) return false;
        if (o.status !== 'confirmed' && o.status !== 'delivered') return false;
        // Check all model quantities match
        return models.every(m => (o.quantities?.[m.id] || 0) === (qty[m.id] || 0));
    });
    
    // If no exact match, find any recent order from same client with prices
    if (!matchingOrder) {
        matchingOrder = receivedOrders.find(o => 
            o.client === delivery.client && 
            models.some(m => (o.prices?.[m.id] || 0) > 0)
        );
    }
    
    // Set currency from matching order or default to EUR
    const currency = matchingOrder?.currency || 'EUR';
    document.getElementById('invCurrency').value = currency;
    onInvCurrencyChange();
    
    // Add items from delivery with prices
    document.getElementById('invItems').innerHTML = '';
    models.forEach(model => {
        const modelQty = qty[model.id] || 0;
        const modelPrice = matchingOrder?.prices?.[model.id] || 0;
        if (modelQty > 0) {
            addInvoiceItemRow(model.fullName, modelQty, modelPrice);
        }
    });
    
    // Link to matching order if found
    if (matchingOrder) {
        document.getElementById('invLinkedOrder').value = matchingOrder.id;
        document.getElementById('invNotes').value = `BL: ${delivery.blNumber} | Obj.: ${matchingOrder.orderNumber}`;
    } else {
        document.getElementById('invNotes').value = `BL: ${delivery.blNumber}`;
    }
    
    // Store delivery ID for later update
    document.getElementById('invoiceForm').dataset.deliveryId = blId;
    
    calculateInvoiceTotal();
}
async function markInvoicePaid(invNumber) {
    if (!confirm(t('confirmMarkPaid'))) return;
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const index = invoices.findIndex(inv => inv.number === invNumber);
    if (index >= 0) {
        invoices[index].paid = true;
        invoices[index].paidDate = new Date().toISOString();
        localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
        // Also update in Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                await storage.createInvoice(invoices[index]);
            } catch (e) {
                console.error('Error updating invoice in Google Sheets:', e);
            }
        }
        await updateInvoicesDisplay();
        showToast(t('saved'), 'success');
    }
}
async function deleteInvoice(invNumber) {
    if (!confirm(t('confirmDelete'))) return;
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]').filter(inv => inv.number !== invNumber);
    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
    // Note: Deletion in Google Sheets would need a separate API endpoint
    await updateInvoicesDisplay();
    showToast(t('deleted'), 'success');
}
function exportInvoices() {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    let csv = 'Číslo;Datum;Zákazník;Splatnost;Základ;DPH;Celkem;Měna;Stav\n';
    invoices.forEach(inv => { csv += `${inv.number};${inv.date};${inv.client};${inv.dueDate};${inv.subtotal || 0};${inv.vat || 0};${inv.total};${inv.currency};${inv.paid ? 'Zaplaceno' : 'Nezaplaceno'}\n`; });
    downloadCSV(csv, `faktury_${new Date().toISOString().split('T')[0]}.csv`);
}

// ========================================
// BOM DISPLAY
// ========================================

function changeBomModel() {
    currentBomModel = document.getElementById('bomModelSelect')?.value || 'TX9';
    updateBomDisplay();
}

function updateBomDisplay() {
    const tbody = document.getElementById('bomTableBody');
    if (!tbody || !currentBom) return;
    
    const bomItems = currentBom[currentBomModel] || [];
    if (bomItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">${t('noData')}</td></tr>`;
        document.getElementById('bomTotalCost')?.remove();
        return;
    }
    
    let totalCost = 0;

    // Debug: log loaded prices
    const loadedCount = Object.keys(loadedComponentPrices || {}).length;
    console.log('🔍 BOM Display - loadedComponentPrices count:', loadedCount);
    if (loadedCount > 0) {
        console.log('🔍 BOM Display - first 3 loaded refs:', Object.keys(loadedComponentPrices).slice(0, 3));
    } else {
        console.log('🔍 BOM Display - No prices loaded from Google Sheets, using static COMPONENT_PRICES');
    }

    tbody.innerHTML = bomItems.map((item, idx) => {
        const stock = currentStock[item.ref]?.qty || 0;
        const ok = stock >= item.qty;
        // Try EUR price first, then CZK price converted to EUR
        let unitPrice = getComponentPrice(item.ref, 'EUR');
        const priceCZK = getComponentPrice(item.ref, 'CZK');

        // Debug log for first few items
        if (idx < 3) {
            const staticPrice = typeof COMPONENT_PRICES !== 'undefined' ? COMPONENT_PRICES[item.ref] : null;
            console.log(`🔍 BOM [${idx}] ${item.ref}: EUR=${unitPrice}, CZK=${priceCZK}, static=`, staticPrice);
        }

        if (!unitPrice || unitPrice === 0) {
            if (priceCZK && priceCZK > 0) {
                // Convert CZK to EUR (approximate rate)
                unitPrice = priceCZK / (exchangeRate || 25);
            }
        }
        // Ensure unitPrice is a valid number
        unitPrice = parseFloat(unitPrice) || 0;
        const itemQty = parseFloat(item.qty) || 0;
        const lineTotal = unitPrice * itemQty;

        // Debug: check for NaN
        if (isNaN(lineTotal)) {
            console.error(`❌ NaN detected for ${item.ref}: unitPrice=${unitPrice}, qty=${item.qty}, lineTotal=${lineTotal}`);
        }

        totalCost += lineTotal;
        
        return `<tr class="${ok ? '' : 'row-warning'}">
            <td><code>${item.ref}</code></td>
            <td>${item.name}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">${stock}</td>
            <td class="text-right">${unitPrice > 0 ? formatCurrency(unitPrice) + ' €' : '-'}</td>
            <td class="text-right">${lineTotal > 0 ? formatCurrency(lineTotal) + ' €' : '-'}</td>
            <td><span class="status-badge ${ok ? 'status-ok' : 'status-critical'}">${ok ? 'OK' : t('missing')}</span></td>
        </tr>`;
    }).join('');

    // Debug: show totalCost before adding total row
    console.log('🔍 BOM totalCost before display:', totalCost, 'formatted:', formatCurrency(totalCost));

    // Add total row
    tbody.innerHTML += `<tr class="total-row" style="font-weight: bold; background: #f0f9ff;">
        <td colspan="5" class="text-right">${t('bomCost') || 'Coût de fabrication'}:</td>
        <td class="text-right" style="color: #2563eb;">${formatCurrency(totalCost)} €</td>
        <td></td>
    </tr>`;
}

// ========================================
// CAPACITY & ALERTS
// ========================================

function calculateCapacity() {
    if (!currentBom || !currentStock) return;
    
    getPacModels().forEach(model => {
        const bomItems = currentBom[model.id] || [];
        let minCapacity = Infinity;
        bomItems.forEach(item => {
            const stock = currentStock[item.ref]?.qty || 0;
            const capacity = Math.floor(stock / item.qty);
            if (capacity < minCapacity) minCapacity = capacity;
        });
        const cap = minCapacity === Infinity ? 0 : minCapacity;
        const key = modelIdToKey(model.id);
        const id = `capacity-${key}`;
        const delId = `del-capacity-${key}`;
        if (document.getElementById(id)) document.getElementById(id).textContent = cap;
        if (document.getElementById(delId)) document.getElementById(delId).textContent = cap;
    });
}

function updateAlerts() {
    if (!currentStock) return;
    const alerts = Object.entries(currentStock).filter(([_, data]) => (data.qty || 0) <= (data.min || 0));
    document.getElementById('alertCount').textContent = alerts.length;
}

function updateSuggestedOrders() {
    const tbody = document.getElementById('suggestionsTableBody');
    if (!tbody || !currentStock) return;
    
    const pendingQty = {};
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    pos.filter(p => p.status === 'Envoyé' || p.status === 'Brouillon').forEach(po => {
        (po.items || []).forEach(item => { pendingQty[item.ref] = (pendingQty[item.ref] || 0) + item.qty; });
    });
    
    const suggestions = Object.entries(currentStock)
        .filter(([_, data]) => {
            const total = (data.qty || 0) + (pendingQty[_] || 0);
            return total < (data.min || 0);
        })
        .map(([ref, data]) => ({
            ref, name: data.name, stock: data.qty || 0, onOrder: pendingQty[ref] || 0,
            total: (data.qty || 0) + (pendingQty[ref] || 0), min: data.min || 0,
            suggested: Math.max(0, (data.min || 0) - (data.qty || 0) - (pendingQty[ref] || 0) + Math.ceil((data.min || 0) * 0.5))
        }));
    
    if (suggestions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">✓ ${t('statusOk')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = suggestions.map(s => `<tr class="row-warning">
        <td><code>${s.ref}</code></td>
        <td>${s.name}</td>
        <td class="text-right">${s.stock}</td>
        <td class="text-right ${s.onOrder > 0 ? 'text-info' : ''}">${s.onOrder > 0 ? '+' + s.onOrder : '-'}</td>
        <td class="text-right">${s.total}</td>
        <td class="text-right">${s.min}</td>
        <td class="text-right font-bold">${s.suggested}</td>
        <td><button class="btn btn-secondary btn-small" onclick="addPOItemRow('${s.ref}', ${s.suggested}); openPOModal();">+ PO</button></td>
    </tr>`).join('');
}

// ========================================
// ISSUED INVOICES - FV2026XXX
// ========================================

async function getNextInvoiceNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();

    // Get existing invoices - prefer Google Sheets data
    let existingInvoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getInvoices(500);
            if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
                existingInvoices = remoteInvoices;
            }
        } catch (e) {
            console.warn('Failed to get invoices from GS for number generation:', e);
        }
    }

    let maxNum = 0;
    existingInvoices.forEach(inv => {
        if (inv.number) {
            const match = String(inv.number).match(/FV(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    if (config.fv_year !== year) { config.fv_year = year; config.next_fv = 1; }
    const configNum = config.next_fv || 1;
    const nextNum = Math.max(configNum, maxNum + 1);

    const fvNumber = `FV${year}${String(nextNum).padStart(3, '0')}`;
    if (consume) {
        config.next_fv = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
        // Also update config in Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                await storage.updateConfig({ next_fv: config.next_fv, fv_year: config.fv_year });
            } catch (e) {
                console.warn('Failed to update config in GS:', e);
            }
        }
    }
    return fvNumber;
}

async function getNextProformaNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();

    // Get existing invoices - prefer Google Sheets data
    let existingInvoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getInvoices(500);
            if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
                existingInvoices = remoteInvoices;
            }
        } catch (e) {
            console.warn('Failed to get invoices from GS for number generation:', e);
        }
    }

    let maxNum = 0;
    existingInvoices.forEach(inv => {
        if (inv.number && inv.isProforma) {
            const match = String(inv.number).match(/PF(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    if (config.pf_year !== year) { config.pf_year = year; config.next_pf = 1; }
    const configNum = config.next_pf || 1;
    const nextNum = Math.max(configNum, maxNum + 1);

    const pfNumber = `PF${year}${String(nextNum).padStart(3, '0')}`;
    if (consume) {
        config.next_pf = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
        // Also update config in Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                await storage.updateConfig({ next_pf: config.next_pf, pf_year: config.pf_year });
            } catch (e) {
                console.warn('Failed to update config in GS:', e);
            }
        }
    }
    return pfNumber;
}

async function updateInvoiceNumber() {
    if (editingInvoiceNumber) return; // Don't change number when editing
    const isProforma = document.getElementById('invIsProforma')?.checked || false;
    const vatRateInput = document.getElementById('invVatRate');
    const exchangeRateGroup = document.getElementById('invExchangeRateGroup');
    const depositPercentGroup = document.getElementById('depositPercentGroup');

    if (isProforma) {
        // Keep VAT at 21% for proformas - show full amount to customer
        if (vatRateInput && !vatRateInput.value) {
            vatRateInput.value = 21;
        }
        // Hide exchange rate for proformas
        if (exchangeRateGroup) exchangeRateGroup.style.display = 'none';
        // Show deposit percentage field
        if (depositPercentGroup) depositPercentGroup.style.display = 'block';
        // Recalculate and update deposit amount
        calculateInvoiceTotal();
        calculateDepositAmount();
        // Then get the proforma number (async)
        document.getElementById('invNumber').value = await getNextProformaNumber();
    } else {
        // Show exchange rate if EUR
        const currency = document.getElementById('invCurrency')?.value;
        if (exchangeRateGroup && currency === 'EUR') {
            exchangeRateGroup.style.display = 'block';
        }
        // Hide deposit percentage field
        if (depositPercentGroup) depositPercentGroup.style.display = 'none';
        // Recalculate
        calculateInvoiceTotal();
        // Then get the invoice number (async)
        document.getElementById('invNumber').value = await getNextInvoiceNumber();
    }
}

// Calculate deposit amount based on percentage of total WITH VAT
function calculateDepositAmount() {
    const total = parseFloat(document.getElementById('invTotal')?.value) || 0;
    const depositPercent = parseFloat(document.getElementById('invDepositPercent')?.value) || 100;
    const currency = document.getElementById('invCurrency')?.value || 'CZK';

    const depositAmount = total * depositPercent / 100;

    const displayEl = document.getElementById('depositAmountDisplay');
    const currencyEl = document.getElementById('depositCurrencyDisplay');
    if (displayEl) displayEl.textContent = formatCurrency(depositAmount);
    if (currencyEl) currencyEl.textContent = currency;

    return depositAmount;
}

async function convertProformaToInvoice(proformaNumber) {
    if (!confirm('Convertir cette proforma en facture définitive ?')) return;

    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const proformaIndex = invoices.findIndex(i => i.number === proformaNumber);
    if (proformaIndex < 0) {
        showToast('Proforma non trouvée', 'error');
        return;
    }

    const proforma = invoices[proformaIndex];

    // Create new invoice from proforma
    const newInvoiceNumber = await getNextInvoiceNumber(true);
    const newInvoice = {
        ...proforma,
        number: newInvoiceNumber,
        varSymbol: newInvoiceNumber.replace(/\D/g, ''),
        isProforma: false,
        type: 'standard',
        vatRate: 21, // Restore VAT for final invoice
        linkedProforma: {
            number: proformaNumber,
            ddNumber: proforma.ddNumber || proformaNumber.replace(/^(ZL|PI|PF)-?/, 'DD-'),
            total: proforma.taxDocTotal || proforma.total,
            subtotal: proforma.taxDocSubtotal || proforma.subtotal,
            vat: proforma.taxDocVat || proforma.vat,
            currency: proforma.currency,
            paidExchangeRate: proforma.paidExchangeRate || null,
            paidAmountCZK: proforma.paidAmountCZK || null,
            paidSubtotalCZK: proforma.paidSubtotalCZK || null,
            paidVatCZK: proforma.paidVatCZK || null
        },
        date: new Date().toISOString().split('T')[0],
        taxDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        paid: false,
        paidDate: null
    };

    // Recalculate totals with 21% VAT
    const subtotal = (proforma.items || []).reduce((sum, item) => sum + (item.qty * item.price), 0);
    newInvoice.subtotal = subtotal;
    newInvoice.vat = Math.round(subtotal * 21) / 100;
    newInvoice.total = subtotal + newInvoice.vat;

    // Update due date to 14 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    newInvoice.dueDate = dueDate.toISOString().split('T')[0];

    // Mark proforma as converted
    invoices[proformaIndex].convertedToInvoice = newInvoiceNumber;
    invoices[proformaIndex].convertedAt = new Date().toISOString();
    invoices[proformaIndex].usedInInvoice = newInvoiceNumber;

    // Add new invoice
    invoices.unshift(newInvoice);

    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));

    // Sync to Google Sheets
    if (storage.getMode() === 'googlesheets') {
        try {
            // Save new invoice to Google Sheets
            await storage.createInvoice(newInvoice);
            // Update proforma in Google Sheets
            await storage.createInvoice(invoices[proformaIndex + 1]); // +1 because we unshifted
        } catch (e) {
            console.error('Error syncing to Google Sheets:', e);
        }
    }

    await updateInvoicesDisplay();
    showToast(`Proforma ${proformaNumber} convertie en facture ${newInvoiceNumber}`, 'success');
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('active');
    editingInvoiceNumber = null;
}

function closeInvoicePreviewModal() {
    const modal = document.getElementById('invoicePreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

function printInvoice() {
    const originalTitle = document.title;
    document.title = currentInvoice?.number || 'Facture';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

async function sendInvoiceByEmail() {
    if (!currentInvoice) {
        showToast('Aucune facture sélectionnée', 'error');
        return;
    }

    // Get client email
    const contacts = getContacts();
    const client = contacts.find(c => c.name === currentInvoice.client);

    if (!client || !client.email) {
        showToast('Email du client non trouvé. Veuillez ajouter un email dans les contacts.', 'error');
        return;
    }

    // Confirm send and ask for CC addresses
    if (!confirm(`Envoyer la facture ${currentInvoice.number} à ${client.email}?`)) {
        return;
    }

    // Ask for CC addresses
    const ccAddresses = prompt(
        `Ajouter des adresses en copie (CC)?\n\nSéparez les adresses par des virgules ou points-virgules.\nExemple: email1@domain.com, email2@domain.com\n\nLaissez vide si pas de copie.`,
        ''
    );

    try {
        // Get the invoice HTML
        const invoiceHtml = document.getElementById('invoicePreview').innerHTML;

        // Prepare email data
        const emailData = {
            to: client.email,
            replyTo: 'tmilatova@email.cz',
            subject: `Faktura ${currentInvoice.number} - ${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            body: `Dobrý den,\n\nV příloze naleznete fakturu ${currentInvoice.number}.\n\nPro odpověď kontaktujte: tmilatova@email.cz\n\nS pozdravem,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            htmlContent: invoiceHtml,
            documentNumber: currentInvoice.number,
            documentType: currentInvoice.isProforma ? 'Proforma' : 'Faktura'
        };

        // Add CC if provided
        if (ccAddresses && ccAddresses.trim()) {
            emailData.cc = ccAddresses.trim();
        }

        // Send via Google Apps Script
        const result = await storage.apiPost('sendEmail', emailData);

        if (result && result.success) {
            showToast(`Facture envoyée à ${client.email}`, 'success');
        } else {
            throw new Error(result?.error || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Error sending invoice:', error);
        showToast('Erreur lors de l\'envoi: ' + error.message, 'error');
    }
}

// ========================================
// DAŇOVÝ DOKLAD K PŘIJATÉ PLATBĚ
// ========================================

async function generateTaxDocument(invNumber) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) {
        showToast('Facture non trouvée', 'error');
        return;
    }

    // Set currentInvoice for email sending
    currentInvoice = inv;

    // Use stored payment date if available, otherwise ask
    let paymentDate = inv.paidDate;
    if (!paymentDate) {
        paymentDate = prompt('Datum přijetí platby (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (!paymentDate) return;
    }

    // Use stored exchange rate if available, otherwise fetch/ask
    let rate = inv.paidExchangeRate || null;
    if (!rate && inv.currency === 'EUR') {
        if (storage.getMode() === 'googlesheets') {
            try {
                const rateInfo = await storage.getExchangeRateForDate('EUR', paymentDate);
                if (rateInfo && rateInfo.rate) {
                    rate = rateInfo.rate;
                }
            } catch (e) {
                console.warn('Failed to fetch CNB rate:', e);
            }
        }
        if (!rate) {
            rate = parseFloat(prompt('Kurz ČNB EUR/CZK:', '24.5')) || 24.5;
        }
    }

    // Generate tax document number (DD-XXXXX based on proforma number)
    const ddNumber = inv.number.replace(/^(ZL|FV|PI|PF)-?/, 'DD-');

    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const bankInfo = inv.currency === 'EUR' ? company.bank?.EUR : company.bank?.CZK;

    // Tax document always has 21% VAT
    // Use deposit percentage to calculate the correct amounts
    const taxVatRate = 21;
    const depositPercent = inv.depositPercent || 100;
    const proformaSubtotal = inv.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    // Tax document subtotal = proforma subtotal × deposit%
    const taxDocSubtotal = proformaSubtotal * depositPercent / 100;
    const taxDocVat = Math.round(taxDocSubtotal * taxVatRate) / 100;
    const taxDocTotal = taxDocSubtotal + taxDocVat;

    // Calculate CZK amounts
    const subtotalCZK = inv.currency === 'EUR' && rate ? taxDocSubtotal * rate : taxDocSubtotal;
    const vatCZK = inv.currency === 'EUR' && rate ? taxDocVat * rate : taxDocVat;
    const totalCZK = inv.currency === 'EUR' && rate ? taxDocTotal * rate : taxDocTotal;

    // Items HTML - recalculate with 21% VAT and deposit percentage
    const curr = inv.currency || 'CZK';
    const depositLabel = depositPercent < 100 ? ` (záloha ${depositPercent}%)` : '';
    const itemsHtml = (inv.items || []).map(item => {
        // Apply deposit percentage to amounts
        const itemSubtotal = item.qty * item.price * depositPercent / 100;
        const itemVat = itemSubtotal * taxVatRate / 100;
        const itemTotal = itemSubtotal + itemVat;
        const displayQty = depositPercent < 100 ? `${depositPercent}%` : item.qty;
        return `
        <tr>
            <td>${item.name}${depositLabel}</td>
            <td class="text-center">${displayQty}</td>
            <td class="text-center">${depositPercent < 100 ? '' : 'ks'}</td>
            <td class="text-right">${depositPercent < 100 ? '' : formatCurrency(item.price) + ' ' + curr}</td>
            <td class="text-right">${formatCurrency(itemSubtotal)} ${curr}</td>
            <td class="text-center">${taxVatRate}%</td>
            <td class="text-right">${formatCurrency(itemTotal)} ${curr}</td>
        </tr>
    `;
    }).join('');

    // Format dates for display
    const formatDateCZ = (d) => {
        if (!d) return '';
        // Handle ISO date strings (e.g., "2026-01-31T23:00:00.000Z")
        const dateStr = String(d).split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length !== 3) return String(d);
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    const docHtml = `
        <div class="tax-doc" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px;">
            <h1 style="text-align: center; margin-bottom: 20px; font-size: 16px;">${t('taxDocTitle')} ${ddNumber}</h1>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="width: 48%;">
                    <strong style="font-size: 14px;">${company.name || 'NAVALO s.r.o.'}</strong><br>
                    ${(company.address || '').replace(', ', '<br>')}<br><br>
                    <strong>IČO:</strong> ${company.ico || ''}<br>
                    <strong>DIČ:</strong> ${company.dic || ''}<br>
                    Plátce DPH<br><br>
                    <strong>TELEFON:</strong> 731 501 291<br>
                    <strong>ÚČET:</strong> ${bankInfo?.account || ''}<br>
                    <strong>BANKA:</strong> ${bankInfo?.name || ''}<br>
                    <strong>IBAN:</strong> ${bankInfo?.iban || ''}<br>
                    <strong>SWIFT:</strong> ${bankInfo?.bic || ''}
                </div>
                <div style="width: 48%; border: 1px solid #000; padding: 10px;">
                    <strong>Odběratel</strong><br><br>
                    <strong style="font-size: 13px;">${inv.client}</strong><br>
                    ${inv.clientAddress || ''}<br><br>
                    <strong>IČO:</strong> ${inv.clientIco || ''}<br>
                    <strong>DIČ:</strong> ${inv.clientDic || ''}<br><br>
                    <table style="width: 100%; font-size: 11px;">
                        <tr><td>Forma úhrady:</td><td>peněžní převod</td></tr>
                        ${inv.linkedOrderNumber ? `<tr><td>Číslo naší obj.:</td><td><strong>${inv.linkedOrderNumber}</strong></td></tr>` : ''}
                        ${inv.clientOrderNumber ? `<tr><td style="color: #0066cc;"><strong>Číslo obj. zákazníka:</strong></td><td style="color: #0066cc;"><strong>${inv.clientOrderNumber}</strong></td></tr>` : ''}
                        <tr><td>Variabilní symbol:</td><td>${inv.varSymbol || inv.number.replace(/\D/g, '')}</td></tr>
                        <tr><td>Datum vystavení:</td><td>${formatDateCZ(new Date().toISOString().split('T')[0])}</td></tr>
                        <tr><td>Datum zdanitelného plnění:</td><td>${formatDateCZ(paymentDate)}</td></tr>
                        <tr><td>Datum přijetí platby:</td><td>${formatDateCZ(paymentDate)}</td></tr>
                    </table>
                </div>
            </div>

            <p style="margin: 15px 0;">Zasíláme Vám daňový doklad k přijaté platbě k záloze ${inv.number}${depositPercent < 100 ? ` (${depositPercent}% záloha)` : ''} ${inv.notes || ''}</p>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #000; padding: 6px; text-align: left;">Popis položky</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">Množství</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">MJ</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Cena za MJ</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Celkem bez DPH</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">DPH</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Celkem s DPH</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="4" style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>Celkem:</strong></td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocSubtotal)} ${curr}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocVat)} ${curr}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocTotal)} ${curr}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
                <div style="width: 300px;">
                    ${inv.currency === 'EUR' && rate ? `
                    <p style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                        <strong>Směnný kurz: 1 EUR = ${rate.toFixed(3)} Kč</strong>
                    </p>
                    <table style="width: 100%; font-size: 11px;">
                        <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(subtotalCZK)} Kč</td></tr>
                        <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(vatCZK)} Kč</td></tr>
                        <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(totalCZK)} Kč</td></tr>
                        <tr><td>K úhradě:</td><td style="text-align: right;">0,00 Kč</td></tr>
                    </table>
                    <table style="width: 100%; font-size: 11px; margin-top: 10px; border: 1px solid #000;">
                        <tr><td style="padding: 4px;">Celková částka bez DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocSubtotal)} EUR</td></tr>
                        <tr><td style="padding: 4px;">DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocVat)} EUR</td></tr>
                        <tr><td style="padding: 4px;">Celková částka s DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} EUR</td></tr>
                        <tr><td style="padding: 4px;">Uhrazeno zálohami:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} EUR</td></tr>
                    </table>
                    ` : `
                    <table style="width: 100%; font-size: 11px; border: 1px solid #000;">
                        <tr><td style="padding: 4px;">Celková částka bez DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocSubtotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocVat)} Kč</td></tr>
                        <tr><td style="padding: 4px;">Celková částka s DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">Uhrazeno zálohami:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">K úhradě:</td><td style="text-align: right; padding: 4px;">0,00 Kč</td></tr>
                    </table>
                    `}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 50px; border-top: 1px solid #000; padding-top: 10px;">
                <div style="width: 30%;">
                    <small>Vyhotovil: Taňa Milatová</small>
                </div>
                <div style="width: 30%; text-align: center;">
                    <small>Převzal:</small>
                </div>
                <div style="width: 30%; text-align: right;">
                    <small>K úhradě:</small><br>
                    <strong style="font-size: 16px; color: green;">${t('alreadyPaid')}</strong>
                </div>
            </div>
        </div>
    `;

    const modal = document.getElementById('invoicePreviewModal');
    document.getElementById('invoicePreview').innerHTML = docHtml;
    modal.style.display = 'flex';
    modal.classList.add('active');
}

async function markProformaPaidAndGenerateTaxDoc(invNumber) {
    // Ask for payment date first
    const paymentDate = prompt('Datum přijetí platby (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!paymentDate) return;

    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const idx = invoices.findIndex(i => i.number === invNumber);
    if (idx < 0) return;

    const inv = invoices[idx];

    // Set currentInvoice for email sending
    currentInvoice = inv;

    // Get CNB exchange rate for payment date
    let paidExchangeRate = null;
    if (inv.currency === 'EUR' && storage.getMode() === 'googlesheets') {
        try {
            const rateInfo = await storage.getExchangeRateForDate('EUR', paymentDate);
            if (rateInfo && rateInfo.rate) {
                paidExchangeRate = rateInfo.rate;
            }
        } catch (e) {
            console.warn('Failed to fetch CNB rate:', e);
        }
    }
    if (!paidExchangeRate && inv.currency === 'EUR') {
        paidExchangeRate = parseFloat(prompt('Kurz ČNB EUR/CZK:', '24.5')) || 24.5;
    }

    // Calculate tax document amounts with 21% VAT
    // depositAmount is % of total WITH VAT - we need to extract the base
    const taxVatRate = 21;
    const proformaSubtotal = inv.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const depositPercent = inv.depositPercent || 100;
    // Tax document base = proforma subtotal * deposit %
    const taxDocSubtotal = proformaSubtotal * depositPercent / 100;
    const taxDocVat = Math.round(taxDocSubtotal * taxVatRate) / 100;
    const taxDocTotal = taxDocSubtotal + taxDocVat;

    // Mark as paid and store the tax document amounts
    invoices[idx].paid = true;
    invoices[idx].paidDate = paymentDate;
    invoices[idx].paidExchangeRate = paidExchangeRate;
    // Store amounts with VAT for the tax document (DD)
    invoices[idx].taxDocSubtotal = taxDocSubtotal;
    invoices[idx].taxDocVat = taxDocVat;
    invoices[idx].taxDocTotal = taxDocTotal;
    invoices[idx].depositPercent = depositPercent;
    if (inv.currency === 'EUR' && paidExchangeRate) {
        invoices[idx].paidAmountCZK = taxDocTotal * paidExchangeRate;
        invoices[idx].paidSubtotalCZK = taxDocSubtotal * paidExchangeRate;
        invoices[idx].paidVatCZK = taxDocVat * paidExchangeRate;
    }
    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));

    // Sync to Google Sheets
    if (storage.getMode() === 'googlesheets') {
        try {
            await storage.createInvoice(invoices[idx]);
        } catch (e) {
            console.error('Error syncing paid proforma to Google Sheets:', e);
        }
    }

    updateInvoicesDisplay();

    // Generate tax document with the rate
    await generateTaxDocumentWithRate(invNumber, paymentDate, paidExchangeRate);
}

async function generateTaxDocumentWithDate(invNumber, paymentDate) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) {
        showToast('Facture non trouvée', 'error');
        return;
    }

    // Get CNB exchange rate for payment date
    let rate = inv.paidExchangeRate || null;
    if (!rate && inv.currency === 'EUR' && storage.getMode() === 'googlesheets') {
        try {
            const rateInfo = await storage.getExchangeRateForDate('EUR', paymentDate);
            if (rateInfo && rateInfo.rate) {
                rate = rateInfo.rate;
            }
        } catch (e) {
            console.warn('Failed to fetch CNB rate:', e);
        }
    }
    if (!rate && inv.currency === 'EUR') {
        rate = parseFloat(prompt('Kurz ČNB EUR/CZK:', '24.5')) || 24.5;
    }

    await generateTaxDocumentWithRate(invNumber, paymentDate, rate);
}

async function generateTaxDocumentWithRate(invNumber, paymentDate, rate) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) {
        showToast('Facture non trouvée', 'error');
        return;
    }

    // Generate the document (reuse the same logic)
    const ddNumber = inv.number.replace(/^(ZL|FV|PI|PF)-?/, 'DD-');
    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const bankInfo = inv.currency === 'EUR' ? company.bank?.EUR : company.bank?.CZK;

    // Tax document always has 21% VAT
    // Use deposit percentage to calculate the correct amounts
    const taxVatRate = 21;
    const depositPercent = inv.depositPercent || 100;
    const proformaSubtotal = inv.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    // Tax document subtotal = proforma subtotal × deposit%
    const taxDocSubtotal = proformaSubtotal * depositPercent / 100;
    const taxDocVat = Math.round(taxDocSubtotal * taxVatRate) / 100;
    const taxDocTotal = taxDocSubtotal + taxDocVat;

    const subtotalCZK = inv.currency === 'EUR' && rate ? taxDocSubtotal * rate : taxDocSubtotal;
    const vatCZK = inv.currency === 'EUR' && rate ? taxDocVat * rate : taxDocVat;
    const totalCZK = inv.currency === 'EUR' && rate ? taxDocTotal * rate : taxDocTotal;

    const curr = inv.currency || 'CZK';

    // For tax document, show items with deposit percentage applied
    const depositLabel = depositPercent < 100 ? ` (záloha ${depositPercent}%)` : '';
    const itemsHtml = (inv.items || []).map(item => {
        // Apply deposit percentage to quantities/amounts
        const itemSubtotal = item.qty * item.price * depositPercent / 100;
        const itemVat = itemSubtotal * taxVatRate / 100;
        const itemTotal = itemSubtotal + itemVat;
        const displayQty = depositPercent < 100 ? `${depositPercent}%` : item.qty;
        return `
        <tr>
            <td>${item.name}${depositLabel}</td>
            <td class="text-center">${displayQty}</td>
            <td class="text-center">${depositPercent < 100 ? '' : 'ks'}</td>
            <td class="text-right">${depositPercent < 100 ? '' : formatCurrency(item.price) + ' ' + curr}</td>
            <td class="text-right">${formatCurrency(itemSubtotal)} ${curr}</td>
            <td class="text-center">${taxVatRate}%</td>
            <td class="text-right">${formatCurrency(itemTotal)} ${curr}</td>
        </tr>
    `;
    }).join('');

    const formatDateCZ = (d) => {
        if (!d) return '';
        // Handle ISO date strings (e.g., "2026-01-31T23:00:00.000Z")
        const dateStr = String(d).split('T')[0];
        const parts = dateStr.split('-');
        if (parts.length !== 3) return String(d);
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    const docHtml = `
        <div class="tax-doc" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px;">
            <h1 style="text-align: center; margin-bottom: 20px; font-size: 16px;">${t('taxDocTitle')} ${ddNumber}</h1>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="width: 48%;">
                    <strong style="font-size: 14px;">${company.name || 'NAVALO s.r.o.'}</strong><br>
                    ${(company.address || '').replace(/, /g, '<br>')}<br><br>
                    <strong>IČO:</strong> ${company.ico || ''}<br>
                    <strong>DIČ:</strong> ${company.dic || ''}<br>
                    Plátce DPH<br><br>
                    <strong>TELEFON:</strong> 731 501 291<br>
                    <strong>ÚČET:</strong> ${bankInfo?.account || ''}<br>
                    <strong>BANKA:</strong> ${bankInfo?.name || ''}<br>
                    <strong>IBAN:</strong> ${bankInfo?.iban || ''}<br>
                    <strong>SWIFT:</strong> ${bankInfo?.bic || ''}
                </div>
                <div style="width: 48%; border: 1px solid #000; padding: 10px;">
                    <strong>Odběratel</strong><br><br>
                    <strong style="font-size: 13px;">${inv.client}</strong><br>
                    ${inv.clientAddress || ''}<br><br>
                    <strong>IČO:</strong> ${inv.clientIco || ''}<br>
                    <strong>DIČ:</strong> ${inv.clientDic || ''}<br><br>
                    <table style="width: 100%; font-size: 11px;">
                        <tr><td>Forma úhrady:</td><td>peněžní převod</td></tr>
                        ${inv.linkedOrderNumber ? `<tr><td>Číslo naší obj.:</td><td><strong>${inv.linkedOrderNumber}</strong></td></tr>` : ''}
                        ${inv.clientOrderNumber ? `<tr><td style="color: #0066cc;"><strong>Číslo obj. zákazníka:</strong></td><td style="color: #0066cc;"><strong>${inv.clientOrderNumber}</strong></td></tr>` : ''}
                        <tr><td>Variabilní symbol:</td><td>${inv.varSymbol || inv.number.replace(/\D/g, '')}</td></tr>
                        <tr><td>Datum vystavení:</td><td>${formatDateCZ(new Date().toISOString().split('T')[0])}</td></tr>
                        <tr><td>Datum zdanitelného plnění:</td><td>${formatDateCZ(paymentDate)}</td></tr>
                        <tr><td>Datum přijetí platby:</td><td>${formatDateCZ(paymentDate)}</td></tr>
                    </table>
                </div>
            </div>

            <p style="margin: 15px 0;">Zasíláme Vám daňový doklad k přijaté platbě k záloze ${inv.number}${depositPercent < 100 ? ` (${depositPercent}% záloha)` : ''} ${inv.notes || ''}</p>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid #000; padding: 6px; text-align: left;">Popis položky</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">Množství</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">MJ</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Cena za MJ</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Celkem bez DPH</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">DPH</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: right;">Celkem s DPH</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                    <tr>
                        <td colspan="4" style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>Celkem:</strong></td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocSubtotal)} ${curr}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocVat)} ${curr}</td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(taxDocTotal)} ${curr}</td>
                    </tr>
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
                <div style="width: 300px;">
                    ${inv.currency === 'EUR' && rate ? `
                    <p style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                        <strong>Směnný kurz: 1 EUR = ${rate.toFixed(3)} Kč</strong>
                    </p>
                    <table style="width: 100%; font-size: 11px;">
                        <tr><td>Celková částka bez DPH:</td><td style="text-align: right;">${formatCurrency(subtotalCZK)} Kč</td></tr>
                        <tr><td>DPH:</td><td style="text-align: right;">${formatCurrency(vatCZK)} Kč</td></tr>
                        <tr><td>Celková částka s DPH:</td><td style="text-align: right;">${formatCurrency(totalCZK)} Kč</td></tr>
                        <tr><td>K úhradě:</td><td style="text-align: right;">0,00 Kč</td></tr>
                    </table>
                    <table style="width: 100%; font-size: 11px; margin-top: 10px; border: 1px solid #000;">
                        <tr><td style="padding: 4px;">Celková částka bez DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocSubtotal)} EUR</td></tr>
                        <tr><td style="padding: 4px;">DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocVat)} EUR</td></tr>
                        <tr><td style="padding: 4px;">Celková částka s DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} EUR</td></tr>
                        <tr><td style="padding: 4px;">Uhrazeno zálohami:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} EUR</td></tr>
                    </table>
                    ` : `
                    <table style="width: 100%; font-size: 11px; border: 1px solid #000;">
                        <tr><td style="padding: 4px;">Celková částka bez DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocSubtotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocVat)} Kč</td></tr>
                        <tr><td style="padding: 4px;">Celková částka s DPH:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">Uhrazeno zálohami:</td><td style="text-align: right; padding: 4px;">${formatCurrency(taxDocTotal)} Kč</td></tr>
                        <tr><td style="padding: 4px;">K úhradě:</td><td style="text-align: right; padding: 4px;">0,00 Kč</td></tr>
                    </table>
                    `}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 50px; border-top: 1px solid #000; padding-top: 10px;">
                <div style="width: 30%;">
                    <small>Vyhotovil: Taňa Milatová</small>
                </div>
                <div style="width: 30%; text-align: center;">
                    <small>Převzal:</small>
                </div>
                <div style="width: 30%; text-align: right;">
                    <small>K úhradě:</small><br>
                    <strong style="font-size: 16px; color: green;">${t('alreadyPaid')}</strong>
                </div>
            </div>
        </div>
    `;

    const modal = document.getElementById('invoicePreviewModal');
    document.getElementById('invoicePreview').innerHTML = docHtml;
    modal.style.display = 'flex';
    modal.classList.add('active');
}

// Export for global access
window.generateTaxDocument = generateTaxDocument;
window.markProformaPaidAndGenerateTaxDoc = markProformaPaidAndGenerateTaxDoc;
window.generateTaxDocumentWithDate = generateTaxDocumentWithDate;
window.populatePaidProformaSelect = populatePaidProformaSelect;
window.onLinkedProformaChange = onLinkedProformaChange;
window.generateProformaDeductionHtml = generateProformaDeductionHtml;
window.generateProformaDeductionItemHtml = generateProformaDeductionItemHtml;
window.onInvTaxDateChange = onInvTaxDateChange;
window.onInvCurrencyChange = onInvCurrencyChange;

function populateClientSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const contacts = getContacts().filter(c => c.type === 'client' || c.type === 'both');
    select.innerHTML = '<option value="">Vybrat...</option>';
    
    // Add default client
    const defaultClient = CONFIG?.DEFAULT_CLIENT;
    if (defaultClient) {
        const opt = document.createElement('option');
        opt.value = 'default';
        opt.textContent = defaultClient.name;
        select.appendChild(opt);
    }
    
    contacts.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function populateRecOrderSelect() {
    const select = document.getElementById('invLinkedOrder');
    if (!select) return;
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    select.innerHTML = '<option value="">-- Žádná --</option>';
    orders.filter(o => o.status !== 'invoiced').forEach(ord => {
        const opt = document.createElement('option');
        opt.value = ord.id;
        opt.textContent = `${ord.orderNumber} - ${ord.client}`;
        select.appendChild(opt);
    });
}

function onClientChange() {
    const selectId = document.getElementById('invClient').value;
    let client = null;
    
    if (selectId === 'default') {
        client = CONFIG?.DEFAULT_CLIENT;
    } else {
        client = getContacts().find(c => c.id === selectId);
    }
    
    if (client) {
        document.getElementById('invClientIco').value = client.ico || '';
        document.getElementById('invClientDic').value = client.dic || '';
        document.getElementById('invClientAddress').value = client.address || '';
    }
}

function loadRecOrderToInvoice() {
    const orderId = document.getElementById('invLinkedOrder').value;
    if (!orderId) return;

    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Set client
    const contacts = getContacts();
    const client = contacts.find(c => c.name === order.client);
    if (client) {
        document.getElementById('invClient').value = client.id;
        onClientChange();
    }
    document.getElementById('invCurrency').value = order.currency || 'EUR';
    onInvCurrencyChange();

    // Add items dynamically based on PAC models
    document.getElementById('invItems').innerHTML = '';
    const models = getPacModels();
    models.forEach(model => {
        const qty = order.quantities?.[model.id] || 0;
        const price = order.prices?.[model.id] || 0;
        if (qty > 0) {
            addInvoiceItemRow(model.fullName, qty, price);
        }
    });

    // Add stock components
    if (order.stockComponents && Array.isArray(order.stockComponents)) {
        order.stockComponents.forEach(item => {
            if (item.qty > 0) {
                const itemName = item.name || item.ref || 'Composant';
                addInvoiceItemRow(itemName, item.qty, item.price);
            }
        });
    }

    // Add custom items
    if (order.customItems && Array.isArray(order.customItems)) {
        order.customItems.forEach(item => {
            if (item.qty > 0) {
                addInvoiceItemRow(item.name, item.qty, item.price);
            }
        });
    }

    document.getElementById('invNotes').value = `Obj.: ${order.orderNumber}`;
    document.getElementById('invClientOrderNum').value = order.clientOrderNumber || '';
    calculateInvoiceTotal();

    // AUTOMATICALLY link paid proforma if exists for this order
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const paidProforma = invoices.find(inv => {
        const isProformaDoc = inv.isProforma || inv.type === 'proforma' || (inv.number && String(inv.number).startsWith('PF'));
        const isForThisOrder = inv.linkedOrder === orderId;
        const isPaid = inv.isPaid || inv.paid;
        const notUsed = !inv.usedInInvoice;
        return isProformaDoc && isForThisOrder && isPaid && notUsed;
    });

    if (paidProforma) {
        // Repopulate the proforma select to ensure it's in the list
        populatePaidProformaSelect();
        // Select the proforma
        const proformaSelect = document.getElementById('invLinkedProforma');
        if (proformaSelect) {
            proformaSelect.value = paidProforma.number;
            // Trigger the change event to update the display
            onLinkedProformaChange();
        }
    }
}

function addInvoiceItemRow(name = '', qty = 1, price = 0) {
    const container = document.getElementById('invItems');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" class="inv-item-name" placeholder="Název položky" value="${name}" required>
        <input type="number" class="inv-item-qty" placeholder="Množství" min="1" value="${qty}" onchange="calculateInvoiceTotal()">
        <input type="number" class="inv-item-price" placeholder="Cena/ks" step="0.01" min="0" value="${price}" onchange="calculateInvoiceTotal()">
        <input type="number" class="inv-item-total" placeholder="Celkem" step="0.01" readonly class="input-readonly">
        <button type="button" class="btn-icon btn-remove" onclick="removeInvItemRow(this)">✕</button>
    `;
    container.appendChild(row);
    calculateInvoiceTotal();
}

// Add PAC header row for repair quote invoices
function addInvoicePacHeaderRow(pacInfo) {
    const container = document.getElementById('invItems');
    const row = document.createElement('div');
    row.className = 'item-row pac-header-row';
    row.style.cssText = 'background: #dbeafe; padding: 8px; border-radius: 4px; margin-bottom: 4px;';
    row.innerHTML = `
        <input type="text" class="inv-item-name pac-header" value="${pacInfo}" readonly style="flex: 4; font-weight: bold; background: transparent; border: none;">
        <input type="hidden" class="inv-item-qty" value="0">
        <input type="hidden" class="inv-item-price" value="0">
        <input type="hidden" class="inv-item-total" value="0">
        <input type="hidden" class="is-pac-header" value="true">
        <button type="button" class="btn-icon btn-remove" onclick="removeInvItemRow(this)">✕</button>
    `;
    container.appendChild(row);
}

function removeInvItemRow(btn) {
    btn.closest('.item-row').remove();
    calculateInvoiceTotal();
}

function calculateInvoiceTotal() {
    const rows = document.querySelectorAll('#invItems .item-row');
    let subtotal = 0;

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.inv-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.inv-item-price')?.value) || 0;
        const total = qty * price;
        const totalInput = row.querySelector('.inv-item-total');
        if (totalInput) totalInput.value = total.toFixed(2);
        subtotal += total;
    });

    // Get VAT rate - use 0 if empty or explicitly 0
    const vatRateInput = document.getElementById('invVatRate');
    const vatRate = vatRateInput && vatRateInput.value !== '' ? parseFloat(vatRateInput.value) : 21;

    // Calculate VAT: subtotal * rate / 100 (rate 0 = no VAT)
    const vat = subtotal * vatRate / 100;
    const total = subtotal + vat;

    document.getElementById('invSubtotal').value = subtotal.toFixed(2);
    document.getElementById('invVat').value = vat.toFixed(2);
    document.getElementById('invTotal').value = total.toFixed(2);

    // Update deposit amount if proforma
    if (document.getElementById('invIsProforma')?.checked) {
        calculateDepositAmount();
    }
}

async function saveIssuedInvoice() {
    const items = [];
    document.querySelectorAll('#invItems .item-row').forEach(row => {
        const name = row.querySelector('.inv-item-name')?.value;
        const qty = parseFloat(row.querySelector('.inv-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.inv-item-price')?.value) || 0;
        const isPacHeader = row.querySelector('.is-pac-header')?.value === 'true';

        if (isPacHeader && name) {
            // PAC header row - save with special flag
            items.push({ name, qty: 0, price: 0, total: 0, isPacHeader: true });
        } else if (name && qty > 0) {
            items.push({ name, qty, price, total: qty * price });
        }
    });

    if (items.length === 0) {
        showToast(t('selectAtLeastOne'), 'error');
        return;
    }

    // Get proforma state and invoice number from form
    const proformaCheckbox = document.getElementById('invIsProforma');
    const isProforma = proformaCheckbox ? proformaCheckbox.checked : false;
    let invNumber = document.getElementById('invNumber').value.trim();

    // DEBUG: Show what we're reading
    console.log('=== SAVE DEBUG ===');
    console.log('Checkbox element:', proformaCheckbox);
    console.log('Checkbox checked:', proformaCheckbox?.checked);
    console.log('isProforma:', isProforma);
    console.log('invNumber from form:', invNumber);

    // Validate that the number matches the document type
    const isPFNumber = invNumber.startsWith('PF');
    const isFVNumber = invNumber.startsWith('FV');

    if (!editingInvoiceNumber) {
        // For new documents, get the correct number and consume it (increment counter)
        if (isProforma) {
            // Get proforma number and consume it
            const pfNumber = await getNextProformaNumber(true);
            // Use the displayed number if it's already a PF number, otherwise use the new one
            if (!isPFNumber) {
                invNumber = pfNumber;
            }
            // If displayed number is PF, keep it (it should match pfNumber)
        } else {
            // Get invoice number and consume it
            const fvNumber = await getNextInvoiceNumber(true);
            // Use the displayed number if it's already an FV number, otherwise use the new one
            if (!isFVNumber) {
                invNumber = fvNumber;
            }
            // If displayed number is FV, keep it (it should match fvNumber)
        }
    }

    console.log('=== FINAL VALUES ===');
    console.log('Final invNumber:', invNumber);
    console.log('Final isProforma:', isProforma);

    const currency = document.getElementById('invCurrency').value;
    const subtotal = parseFloat(document.getElementById('invSubtotal').value) || 0;
    const total = parseFloat(document.getElementById('invTotal').value) || 0;

    // Deposit info for proformas - deposit is % of total WITH VAT
    const depositPercent = isProforma ? (parseFloat(document.getElementById('invDepositPercent')?.value) || 100) : 100;
    const depositAmount = total * depositPercent / 100;

    const invoice = {
        number: invNumber,
        isProforma: isProforma,
        type: isProforma ? 'proforma' : 'standard',
        varSymbol: document.getElementById('invVarSymbol').value || invNumber.replace(/\D/g, ''),
        client: document.getElementById('invClient').options[document.getElementById('invClient').selectedIndex]?.text || '',
        clientIco: document.getElementById('invClientIco').value,
        clientDic: document.getElementById('invClientDic').value,
        clientAddress: document.getElementById('invClientAddress').value,
        date: document.getElementById('invDate').value,
        dueDate: document.getElementById('invDueDate').value,
        taxDate: document.getElementById('invTaxDate').value,
        items: items,
        subtotal: subtotal,
        vatRate: typeof parseFloat(document.getElementById('invVatRate').value) === 'number' ? parseFloat(document.getElementById('invVatRate').value) : 21,
        vat: parseFloat(document.getElementById('invVat').value) || 0,
        total: parseFloat(document.getElementById('invTotal').value) || 0,
        currency: currency,
        exchangeRate: (currency === 'EUR' && !isProforma) ? parseFloat(document.getElementById('invExchangeRate').value) || exchangeRate : null,
        paymentMethod: document.getElementById('invPaymentMethod').value,
        notes: document.getElementById('invNotes').value,
        linkedOrder: document.getElementById('invLinkedOrder').value,
        linkedOrderNumber: '', // Will be filled from linked order
        clientOrderNumber: document.getElementById('invClientOrderNum')?.value || '', // From form or linked order
        linkedProforma: null, // Proforma deduction info
        // Deposit/acompte info for proformas
        depositPercent: isProforma ? depositPercent : null,
        depositAmount: isProforma ? depositAmount : null,
        paid: false,
        paidDate: null,
        createdAt: new Date().toISOString()
    };

    // DEBUG: Log clientOrderNumber
    console.log('🔍 SAVE INVOICE DEBUG:');
    console.log('  - Champ invClientOrderNum existe?', !!document.getElementById('invClientOrderNum'));
    console.log('  - Valeur du champ:', document.getElementById('invClientOrderNum')?.value);
    console.log('  - clientOrderNumber dans invoice:', invoice.clientOrderNumber);

    // Get linked proforma for deduction
    const proformaSelect = document.getElementById('invLinkedProforma');
    if (proformaSelect && proformaSelect.value) {
        const opt = proformaSelect.options[proformaSelect.selectedIndex];
        invoice.linkedProforma = {
            number: proformaSelect.value,
            ddNumber: opt.dataset.ddNumber || proformaSelect.value.replace(/^(ZL|PI|PF)-?/, 'DD-'),
            total: parseFloat(opt.dataset.total) || 0,
            subtotal: parseFloat(opt.dataset.subtotal) || 0,
            vat: parseFloat(opt.dataset.vat) || 0,
            currency: opt.dataset.currency || invoice.currency,
            paidExchangeRate: parseFloat(opt.dataset.paidExchangeRate) || null,
            paidAmountCZK: parseFloat(opt.dataset.paidAmountCZK) || null,
            paidSubtotalCZK: parseFloat(opt.dataset.paidSubtotalCZK) || null,
            paidVatCZK: parseFloat(opt.dataset.paidVatCZK) || null
        };
    }

    // Get order details if linked - use cached data from localStorage (synced from GS)
    if (invoice.linkedOrder) {
        const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const linkedOrderData = orders.find(o => o.id === invoice.linkedOrder);
        if (linkedOrderData) {
            invoice.linkedOrderNumber = linkedOrderData.orderNumber || '';
            // Only fill clientOrderNumber from linked order if not already set in form
            if (!invoice.clientOrderNumber) {
                invoice.clientOrderNumber = linkedOrderData.clientOrderNumber || '';
            }
            console.log('  - Après récupération commande liée, clientOrderNumber:', invoice.clientOrderNumber);
        }
    }

    console.log('  - FINAL clientOrderNumber avant sauvegarde:', invoice.clientOrderNumber);

    // Save to Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            console.log('=== SENDING TO GOOGLE SHEETS ===');
            console.log('Invoice number:', invoice.number);
            console.log('isProforma:', invoice.isProforma);
            console.log('Full invoice object:', JSON.stringify(invoice, null, 2));
            const result = await storage.createInvoice(invoice);
            console.log('Google Sheets response:', result);
            if (!result.success) {
                console.error('Failed to save invoice to Google Sheets:', result.error);
            }
        } catch (e) {
            console.error('Error saving invoice to Google Sheets:', e);
        }
    }

    // Also save to localStorage as cache
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');

    if (editingInvoiceNumber) {
        const index = invoices.findIndex(i => i.number === editingInvoiceNumber);
        if (index >= 0) {
            invoice.paid = invoices[index].paid;
            invoice.paidDate = invoices[index].paidDate;
            invoice.createdAt = invoices[index].createdAt;
            invoices[index] = invoice;
        }
    } else {
        invoices.unshift(invoice);
    }

    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));

    // Mark linked proforma as used
    if (invoice.linkedProforma && invoice.linkedProforma.number) {
        const proformaIdx = invoices.findIndex(i => i.number === invoice.linkedProforma.number);
        if (proformaIdx >= 0) {
            invoices[proformaIdx].usedInInvoice = invoice.number;
            localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
            // Also update in Google Sheets
            if (storage.getMode() === 'googlesheets') {
                try {
                    await storage.createInvoice(invoices[proformaIdx]);
                } catch (e) {
                    console.error('Error updating proforma in Google Sheets:', e);
                }
            }
        }
    }

    // Update linked order status
    if (invoice.linkedOrder) {
        let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === invoice.linkedOrder);
        if (orderIndex >= 0) {
            orders[orderIndex].status = 'invoiced';
            orders[orderIndex].invoiceNumber = invoice.number;
            localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
            // Also update in Google Sheets
            if (storage.getMode() === 'googlesheets') {
                try {
                    await storage.updateReceivedOrder(orders[orderIndex]);
                } catch (e) {
                    console.error('Error updating order in Google Sheets:', e);
                }
            }
        }
    }

    // Update linked delivery status
    const deliveryId = document.getElementById('invoiceForm').dataset.deliveryId;
    if (deliveryId) {
        let deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
        const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);
        if (deliveryIndex >= 0) {
            deliveries[deliveryIndex].invoiceNumber = invoice.number;
            deliveries[deliveryIndex].invoiceDate = invoice.date;
            localStorage.setItem('navalo_deliveries', JSON.stringify(deliveries));
        }
        // Clear the dataset
        delete document.getElementById('invoiceForm').dataset.deliveryId;
    }

    // Deduct stock if this invoice was converted from a repair quote
    if (window.currentRepairQuoteForStockDeduction &&
        window.currentRepairQuoteForStockDeduction.components.length > 0 &&
        storage.getMode() === 'googlesheets') {
        try {
            console.log('🔧 Deducting stock for repair quote conversion...', window.currentRepairQuoteForStockDeduction);
            const deductResult = await storage.deductStockForComponents(
                window.currentRepairQuoteForStockDeduction.components,
                invoice.number,
                window.currentRepairQuoteForStockDeduction.client,
                new Date().toISOString()
            );

            if (deductResult.success) {
                console.log('✅ Stock deducted for repair invoice:', deductResult.deductedComponents, 'components');
            } else {
                console.error('❌ Stock deduction failed:', deductResult.errors);
                // Show warning but don't block invoice creation
                const errorMsg = deductResult.errors.map(e => `${e.ref}: ${e.error}`).join('\n');
                showToast('Facture créée mais erreur déduction stock:\n' + errorMsg, 'warning');
            }
        } catch (e) {
            console.error('❌ Failed to deduct stock for repair invoice:', e);
            showToast('Facture créée mais erreur lors de la déduction du stock: ' + e.message, 'warning');
        } finally {
            // Clear the repair quote data
            window.currentRepairQuoteForStockDeduction = null;
        }
    }

    closeInvoiceModal();
    await updateInvoicesDisplay();
    await updateDeliveriesDisplay();
    await updateReceivedOrdersDisplay();
    showToast(`${invoice.number} ${t('saved')}`, 'success');
}

function editInvoice(invNumber) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) return;
    
    editingInvoiceNumber = invNumber;
    document.getElementById('invoiceModalTitle').textContent = t('edit');
    document.getElementById('invNumber').value = inv.number;
    document.getElementById('invVarSymbol').value = inv.varSymbol || '';
    document.getElementById('invDate').value = formatDateForInput(inv.date);
    document.getElementById('invDueDate').value = formatDateForInput(inv.dueDate);
    document.getElementById('invTaxDate').value = formatDateForInput(inv.taxDate);
    document.getElementById('invVatRate').value = inv.vatRate || 21;
    document.getElementById('invCurrency').value = inv.currency || 'CZK';
    document.getElementById('invPaymentMethod').value = inv.paymentMethod || 'bank';
    document.getElementById('invNotes').value = inv.notes || '';
    document.getElementById('invClientAddress').value = inv.clientAddress || '';
    document.getElementById('invClientIco').value = inv.clientIco || '';
    document.getElementById('invClientDic').value = inv.clientDic || '';
    document.getElementById('invClientOrderNum').value = inv.clientOrderNumber || '';
    // Check if this is a proforma using all indicators
    const isProformaDoc = inv.isProforma || inv.type === 'proforma' || (inv.number && String(inv.number).startsWith('PF'));
    const proformaCheckbox = document.getElementById('invIsProforma');
    if (proformaCheckbox) proformaCheckbox.checked = isProformaDoc;

    // Handle deposit percentage for proformas
    const depositGroup = document.getElementById('depositPercentGroup');
    const depositInput = document.getElementById('invDepositPercent');
    if (isProformaDoc) {
        if (depositGroup) depositGroup.style.display = 'block';
        if (depositInput) depositInput.value = inv.depositPercent || 100;
    } else {
        if (depositGroup) depositGroup.style.display = 'none';
        if (depositInput) depositInput.value = 100;
    }

    // Exchange rate for EUR invoices
    if (inv.currency === 'EUR') {
        document.getElementById('invExchangeRateGroup').style.display = 'block';
        document.getElementById('invExchangeRate').value = inv.exchangeRate || exchangeRate;
    } else {
        document.getElementById('invExchangeRateGroup').style.display = 'none';
    }
    
    populateClientSelect('invClient');
    populateRecOrderSelect();
    populatePaidProformaSelect();

    // Select the client (find by name since inv.client contains the name, not ID)
    if (inv.client) {
        const clientSelect = document.getElementById('invClient');
        const contacts = getContacts().filter(c => c.type === 'client' || c.type === 'both');
        const matchingClient = contacts.find(c => c.name === inv.client);
        if (matchingClient) {
            clientSelect.value = matchingClient.id;
        } else if (inv.client === (CONFIG?.DEFAULT_CLIENT?.name)) {
            clientSelect.value = 'default';
        }
        // Trigger client change to populate address fields
        onClientChange();
    }

    // Select linked order if exists
    if (inv.linkedOrder) {
        document.getElementById('invLinkedOrder').value = inv.linkedOrder;
    }

    // Select linked proforma if exists
    if (inv.linkedProforma && inv.linkedProforma.number) {
        const proformaSelect = document.getElementById('invLinkedProforma');
        if (proformaSelect) {
            proformaSelect.value = inv.linkedProforma.number;
        }
    }

    // Load items
    document.getElementById('invItems').innerHTML = '';
    (inv.items || []).forEach(item => {
        addInvoiceItemRow(item.name, item.qty, item.price);
    });

    calculateInvoiceTotal();
    document.getElementById('invoiceModal').classList.add('active');
}

// ========================================
// QUOTES / DEVIS - DEV2026XXX
// ========================================

let editingQuoteId = null;

function getNextQuoteNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();

    const existingQuotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    let maxNum = 0;

    existingQuotes.forEach(q => {
        if (q.number) {
            const match = String(q.number).match(/DEV(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    if (config.dev_year !== year) { config.dev_year = year; config.next_dev = 1; }
    const configNum = config.next_dev || 1;
    const nextNum = Math.max(configNum, maxNum + 1);

    const devNumber = `DEV${year}${String(nextNum).padStart(3, '0')}`;
    if (consume) {
        config.next_dev = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
    }
    return devNumber;
}

function openQuoteModal() {
    editingQuoteId = null;
    document.getElementById('quoteModalTitle').textContent = t('newQuote') || 'Nouveau Devis';
    document.getElementById('quoteForm').reset();
    document.getElementById('quoteNumber').value = getNextQuoteNumber();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quoteDate').value = today;
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
    document.getElementById('quoteValidUntil').value = validUntil.toISOString().split('T')[0];

    document.getElementById('quoteVatRate').value = CONFIG?.DEFAULT_VAT_RATE || 21;
    document.getElementById('quoteCurrency').value = 'CZK';

    populateQuoteClientDatalist();
    populateQuoteItemSelect();

    document.getElementById('quoteItems').innerHTML = '';
    addQuoteItemRow();

    document.getElementById('quoteModal').classList.add('active');
}

function populateQuoteClientDatalist() {
    const datalist = document.getElementById('quoteClientList');
    if (!datalist) return;

    datalist.innerHTML = '';
    const contacts = getContacts();

    contacts.forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.name;
        option.dataset.id = contact.id;
        option.dataset.address = contact.address || '';
        option.dataset.ico = contact.ico || '';
        option.dataset.dic = contact.dic || '';
        datalist.appendChild(option);
    });
}

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('active');
    editingQuoteId = null;
}

function closeQuotePreviewModal() {
    document.getElementById('quotePreviewModal').classList.remove('active');
}

function previewQuoteBeforeSave() {
    // Build quote object from form
    const items = [];
    document.querySelectorAll('#quoteItems .item-row').forEach(row => {
        const name = row.querySelector('.quote-item-name')?.value;
        const qty = parseFloat(row.querySelector('.quote-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.quote-item-price')?.value) || 0;
        if (name && qty > 0) {
            items.push({ name, qty, price, total: qty * price });
        }
    });

    if (items.length === 0) {
        showToast('Přidejte alespoň jednu položku', 'error');
        return;
    }

    const quote = {
        number: document.getElementById('quoteNumber').value,
        client: document.getElementById('quoteClientName').value || '',
        clientAddress: document.getElementById('quoteClientAddress').value,
        clientIco: document.getElementById('quoteClientIco').value,
        clientDic: document.getElementById('quoteClientDic').value,
        date: document.getElementById('quoteDate').value,
        validUntil: document.getElementById('quoteValidUntil').value,
        items: items,
        subtotal: parseFloat(document.getElementById('quoteSubtotal').value) || 0,
        vatRate: parseFloat(document.getElementById('quoteVatRate').value) || 21,
        vat: parseFloat(document.getElementById('quoteVat').value) || 0,
        total: parseFloat(document.getElementById('quoteTotal').value) || 0,
        currency: document.getElementById('quoteCurrency').value,
        notes: document.getElementById('quoteNotes').value
    };

    const preview = document.getElementById('quotePreview');
    preview.innerHTML = generateQuoteHTML(quote);
    document.getElementById('quotePreviewModal').classList.add('active');
}

function populateQuoteItemSelect() {
    const select = document.getElementById('quoteItemSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Vyberte položku --</option>';

    // Use currentStock (loaded from server) or fallback to localStorage
    const stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');

    if (stock && Object.keys(stock).length > 0) {
        const stockGroup = document.createElement('optgroup');
        stockGroup.label = 'Skladové položky';

        // Sort by name
        const sortedItems = Object.entries(stock).sort((a, b) => {
            const nameA = (a[1].name || a[0]).toLowerCase();
            const nameB = (b[1].name || b[0]).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        sortedItems.forEach(([ref, item]) => {
            const opt = document.createElement('option');
            opt.value = `stock_${ref}`;
            const price = item.lastPrice || item.price || 0;
            const qty = item.qty || item.quantity || 0;
            opt.textContent = `${item.name || ref} - ${formatCurrency(price)} CZK (sklad: ${qty})`;
            opt.dataset.price = price;
            opt.dataset.name = item.name || ref;
            opt.dataset.unit = 'ks';
            opt.dataset.ref = ref;
            stockGroup.appendChild(opt);
        });
        select.appendChild(stockGroup);
    }
}

function addQuoteItemFromList() {
    const select = document.getElementById('quoteItemSelect');
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption.value) return;

    const name = selectedOption.dataset.name;
    const price = parseFloat(selectedOption.dataset.price) || 0;

    addQuoteItemRow(name, 1, price);
    select.value = '';
    calculateQuoteTotal();
}

function addQuoteItemRow(name = '', qty = 1, price = 0) {
    const container = document.getElementById('quoteItems');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" class="quote-item-name flex-2" placeholder="Description" value="${name}">
        <input type="number" class="quote-item-qty" placeholder="Qté" value="${qty}" min="0" step="0.1" onchange="calculateQuoteTotal()">
        <input type="number" class="quote-item-price" placeholder="Prix unit." value="${price}" step="0.01" onchange="calculateQuoteTotal()">
        <span class="quote-item-total text-right" style="min-width: 80px;">${formatCurrency(qty * price)}</span>
        <button type="button" class="btn-icon btn-remove" onclick="this.parentElement.remove(); calculateQuoteTotal();">✕</button>
    `;
    container.appendChild(row);
    calculateQuoteTotal();
}

function calculateQuoteTotal() {
    let subtotal = 0;
    document.querySelectorAll('#quoteItems .item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.quote-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.quote-item-price')?.value) || 0;
        const lineTotal = qty * price;
        subtotal += lineTotal;
        const totalSpan = row.querySelector('.quote-item-total');
        if (totalSpan) totalSpan.textContent = formatCurrency(lineTotal);
    });

    const vatRate = parseFloat(document.getElementById('quoteVatRate').value) || 0;
    const vat = Math.round(subtotal * vatRate) / 100;
    const total = subtotal + vat;

    document.getElementById('quoteSubtotal').value = subtotal.toFixed(2);
    document.getElementById('quoteVat').value = vat.toFixed(2);
    document.getElementById('quoteTotal').value = total.toFixed(2);
}

function onQuoteClientInput() {
    const input = document.getElementById('quoteClientName');
    const clientName = input.value;
    if (!clientName) return;

    const contacts = getContacts();
    const client = contacts.find(c => c.name.toLowerCase() === clientName.toLowerCase());

    if (client) {
        document.getElementById('quoteClientAddress').value = client.address || '';
        document.getElementById('quoteClientIco').value = client.ico || '';
        document.getElementById('quoteClientDic').value = client.dic || '';
    }
}

async function saveQuote() {
    const items = [];
    document.querySelectorAll('#quoteItems .item-row').forEach(row => {
        const name = row.querySelector('.quote-item-name')?.value;
        const qty = parseFloat(row.querySelector('.quote-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.quote-item-price')?.value) || 0;
        if (name && qty > 0) {
            items.push({ name, qty, price, total: qty * price });
        }
    });

    if (items.length === 0) {
        showToast(t('selectAtLeastOne') || 'Přidejte alespoň jednu položku', 'error');
        return;
    }

    let quoteNumber = document.getElementById('quoteNumber').value;
    if (!editingQuoteId) {
        quoteNumber = getNextQuoteNumber(true);
    }

    const quote = {
        id: editingQuoteId || 'DEV-' + Date.now(),
        number: quoteNumber,
        client: document.getElementById('quoteClientName').value || '',
        clientAddress: document.getElementById('quoteClientAddress').value,
        clientIco: document.getElementById('quoteClientIco').value,
        clientDic: document.getElementById('quoteClientDic').value,
        date: document.getElementById('quoteDate').value,
        validUntil: document.getElementById('quoteValidUntil').value,
        items: items,
        subtotal: parseFloat(document.getElementById('quoteSubtotal').value) || 0,
        vatRate: parseFloat(document.getElementById('quoteVatRate').value) || 21,
        vat: parseFloat(document.getElementById('quoteVat').value) || 0,
        total: parseFloat(document.getElementById('quoteTotal').value) || 0,
        currency: document.getElementById('quoteCurrency').value,
        notes: document.getElementById('quoteNotes').value,
        status: 'draft',
        createdAt: new Date().toISOString()
    };

    try {
        let result;
        if (editingQuoteId) {
            // Update existing quote
            result = await storage.updateQuote(quote);
        } else {
            // Create new quote
            result = await storage.createQuote(quote);
        }

        if (result.success) {
            // Also update localStorage for quick access
            let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
            if (editingQuoteId) {
                const index = quotes.findIndex(q => q.id === editingQuoteId);
                if (index >= 0) {
                    quote.createdAt = quotes[index].createdAt;
                    quote.status = quotes[index].status;
                    quotes[index] = quote;
                }
            } else {
                // Use ID from server if available
                if (result.quoteId) quote.id = result.quoteId;
                if (result.quoteNumber) quote.number = result.quoteNumber;
                quotes.unshift(quote);
            }
            localStorage.setItem('navalo_quotes', JSON.stringify(quotes));

            closeQuoteModal();
            updateQuotesDisplay();
            showToast(`${quote.number} ${t('saved')}`, 'success');
        } else {
            showToast('Chyba: ' + (result.error || 'Nelze uložit'), 'error');
        }
    } catch (error) {
        console.error('Error saving quote:', error);
        showToast('Chyba při ukládání: ' + error.message, 'error');
    }
}

function editQuote(id) {
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    editingQuoteId = id;
    document.getElementById('quoteModalTitle').textContent = t('edit') || 'Modifier';
    document.getElementById('quoteNumber').value = quote.number;
    document.getElementById('quoteDate').value = formatDateForInput(quote.date);
    document.getElementById('quoteValidUntil').value = formatDateForInput(quote.validUntil);
    document.getElementById('quoteClientName').value = quote.client || '';
    document.getElementById('quoteClientAddress').value = quote.clientAddress || '';
    document.getElementById('quoteClientIco').value = quote.clientIco || '';
    document.getElementById('quoteClientDic').value = quote.clientDic || '';
    document.getElementById('quoteVatRate').value = quote.vatRate || 21;
    document.getElementById('quoteCurrency').value = quote.currency || 'CZK';
    document.getElementById('quoteNotes').value = quote.notes || '';

    populateQuoteClientDatalist();
    populateQuoteItemSelect();

    // Load items
    document.getElementById('quoteItems').innerHTML = '';
    if (quote.items && quote.items.length > 0) {
        quote.items.forEach(item => {
            addQuoteItemRow(item.name, item.qty, item.price);
        });
    }

    calculateQuoteTotal();
    document.getElementById('quoteModal').classList.add('active');
}

async function deleteQuote(id) {
    if (!confirm(t('confirmDelete') || 'Smazat tuto nabídku?')) return;

    try {
        await storage.deleteQuote(id);

        // Also update localStorage
        let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
        quotes = quotes.filter(q => q.id !== id);
        localStorage.setItem('navalo_quotes', JSON.stringify(quotes));

        updateQuotesDisplay();
        showToast(t('deleted') || 'Smazáno', 'success');
    } catch (error) {
        console.error('Error deleting quote:', error);
        showToast('Chyba při mazání: ' + error.message, 'error');
    }
}

async function updateQuoteStatus(id, status) {
    let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const index = quotes.findIndex(q => q.id === id);
    if (index >= 0) {
        quotes[index].status = status;
        localStorage.setItem('navalo_quotes', JSON.stringify(quotes));

        // Sync with server
        try {
            await storage.updateQuote(quotes[index]);
        } catch (error) {
            console.warn('Failed to sync quote status:', error);
        }

        updateQuotesDisplay();
        showToast(t('saved'), 'success');
    }
}

async function updateQuotesDisplay() {
    // Try to get from storage (Google Sheets or localStorage)
    let quotes;
    try {
        quotes = await storage.getQuotes(100);
        // Update localStorage cache
        localStorage.setItem('navalo_quotes', JSON.stringify(quotes));
    } catch (error) {
        console.warn('Failed to fetch quotes, using localStorage:', error);
        quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    }

    const statusFilter = document.getElementById('quoteStatusFilter')?.value || 'all';
    const monthFilter = document.getElementById('quoteMonthFilter')?.value || '';

    let filtered = quotes;
    if (statusFilter !== 'all') filtered = filtered.filter(q => q.status === statusFilter);
    if (monthFilter) filtered = filtered.filter(q => q.date?.substring(0, 7) === monthFilter);

    // Update stats
    const pending = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
    const accepted = quotes.filter(q => q.status === 'accepted');
    const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);

    const els = {
        total: document.getElementById('quoteTotalCount'),
        pending: document.getElementById('quotePendingCount'),
        accepted: document.getElementById('quoteAcceptedCount'),
        value: document.getElementById('quoteValue')
    };
    if (els.total) els.total.textContent = quotes.length;
    if (els.pending) els.pending.textContent = pending.length;
    if (els.accepted) els.accepted.textContent = accepted.length;
    if (els.value) els.value.textContent = formatCurrency(totalValue);

    const tbody = document.getElementById('quotesTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }

    const statusLabels = {
        'draft': { label: 'Koncept', class: 'badge-secondary' },
        'sent': { label: 'Odesláno', class: 'badge-info' },
        'accepted': { label: 'Přijato', class: 'badge-success' },
        'rejected': { label: 'Odmítnuto', class: 'badge-danger' }
    };

    tbody.innerHTML = filtered.map(q => {
        const isExpired = new Date(q.validUntil) < new Date() && q.status !== 'accepted';
        const statusInfo = statusLabels[q.status] || statusLabels['draft'];

        return `<tr class="${isExpired ? 'row-warning' : ''}">
            <td><strong>${q.number}</strong></td>
            <td>${formatDate(q.date)}</td>
            <td>${q.client}</td>
            <td>${formatDate(q.validUntil)}</td>
            <td class="text-right">${formatCurrency(q.subtotal)}</td>
            <td class="text-right">${formatCurrency(q.vat)}</td>
            <td class="text-right font-bold">${formatCurrency(q.total)} ${q.currency}</td>
            <td><span class="badge ${statusInfo.class}">${statusInfo.label}</span></td>
            <td>
                <button class="btn-icon" onclick="previewQuote('${q.id}')" title="Aperçu">👁️</button>
                <button class="btn-icon" onclick="editQuote('${q.id}')" title="${t('edit')}">✏️</button>
                ${q.status === 'draft' ? `<button class="btn-icon" onclick="updateQuoteStatus('${q.id}', 'sent')" title="Marquer envoyé">📤</button>` : ''}
                ${q.status === 'sent' ? `<button class="btn-icon" onclick="updateQuoteStatus('${q.id}', 'accepted')" title="Marquer accepté">✅</button>` : ''}
                ${q.status === 'accepted' ? `<button class="btn-icon" onclick="convertQuoteToInvoiceById('${q.id}')" title="Convertir en facture">🧾</button>` : ''}
                <button class="btn-icon" onclick="deleteQuote('${q.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function previewQuote(id) {
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    window.currentPreviewQuoteId = id;

    const preview = document.getElementById('quotePreview');
    preview.innerHTML = generateQuoteHTML(quote);
    document.getElementById('quotePreviewModal').classList.add('active');
}

function generateQuoteHTML(quote) {
    // Handle field name variations (localStorage vs Google Sheets)
    const clientAddress = quote.clientAddress || quote.address || '';
    const validUntil = quote.validUntil || quote.validityDate || '';
    const vatRate = quote.vatRate || 21;
    const currency = quote.currency || 'CZK';

    const itemsHtml = (quote.items || []).map(item => `
        <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">${formatCurrency(item.price)} ${currency}</td>
            <td class="text-right">${formatCurrency(item.total)} ${currency}</td>
        </tr>
    `).join('');

    const company = CONFIG?.COMPANY || {};

    return `
    <div class="quote-doc">
        <div class="inv-header">
            <div class="inv-company">
                <h2>${company.name || 'NAVALO s.r.o.'}</h2>
                <p>${company.address || ''}</p>
                <p>IČO: ${company.ico || ''} | DIČ: ${company.dic || ''}</p>
                <p>Tel: ${company.phone || ''} | ${company.email || ''}</p>
            </div>
            <div class="inv-info">
                <h1>NABÍDKA č. ${quote.number}</h1>
                <p><strong>Datum:</strong> ${formatDate(quote.date)}</p>
                <p><strong>Platnost do:</strong> ${validUntil ? formatDate(validUntil) : '-'}</p>
            </div>
        </div>

        <div class="inv-parties">
            <div class="inv-party">
                <h4>Odběratel</h4>
                <div class="inv-party-box">
                    <strong>${quote.client || ''}</strong><br>
                    ${clientAddress ? clientAddress + '<br>' : ''}
                    ${quote.clientIco ? `IČO: ${quote.clientIco}` : ''}
                    ${quote.clientDic ? ` | DIČ: ${quote.clientDic}` : ''}
                </div>
            </div>
        </div>

        <table class="inv-table">
            <thead>
                <tr>
                    <th>Popis</th>
                    <th class="text-center">Množství</th>
                    <th class="text-right">Cena/ks</th>
                    <th class="text-right">Celkem</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-right">Základ:</td>
                    <td class="text-right">${formatCurrency(quote.subtotal || 0)} ${currency}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-right">DPH (${vatRate}%):</td>
                    <td class="text-right">${formatCurrency(quote.vat || 0)} ${currency}</td>
                </tr>
                <tr class="inv-total">
                    <td colspan="3" class="text-right"><strong>Celkem s DPH:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(quote.total || 0)} ${currency}</strong></td>
                </tr>
            </tfoot>
        </table>

        ${quote.notes ? `<div class="oc-notes"><h4>Poznámky / Podmínky</h4><p>${quote.notes}</p></div>` : ''}

        <div class="oc-footer">
            <p>Tato nabídka je platná do ${validUntil ? formatDate(validUntil) : '-'}.</p>
            <p>V případě dotazů nás kontaktujte na ${company.email || 'navalo@navalo.cz'}</p>
        </div>
    </div>
    `;
}

function printQuote() {
    const originalTitle = document.title;
    const id = window.currentPreviewQuoteId;
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const quote = quotes.find(q => q.id === id);
    document.title = quote?.number || 'Devis';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

function convertQuoteToInvoice() {
    const id = window.currentPreviewQuoteId;
    if (id) convertQuoteToInvoiceById(id);
}

function convertQuoteToInvoiceById(id) {
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    // Open invoice modal with quote data prefilled
    openFreeInvoiceModal();

    // Fill in client info
    document.getElementById('invClientAddress').value = quote.clientAddress || '';
    document.getElementById('invClientIco').value = quote.clientIco || '';
    document.getElementById('invClientDic').value = quote.clientDic || '';

    // Set currency and VAT rate
    document.getElementById('invCurrency').value = quote.currency || 'CZK';
    document.getElementById('invVatRate').value = quote.vatRate || 21;

    // Add items
    document.getElementById('invItems').innerHTML = '';
    if (quote.items && quote.items.length > 0) {
        quote.items.forEach(item => {
            addInvoiceItemRow();
            const rows = document.querySelectorAll('#invItems .item-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.inv-item-name').value = item.name;
            lastRow.querySelector('.inv-item-qty').value = item.qty;
            lastRow.querySelector('.inv-item-price').value = item.price;
        });
    }

    // Update quote status
    updateQuoteStatus(id, 'accepted');

    calculateInvoiceTotal();
    closeQuotePreviewModal();
    showToast('Devis converti - complétez la facture', 'info');
}

function exportQuotes() {
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const csv = ['N° Devis;Date;Client;Validité;HT;TVA;TTC;Devise;Statut',
        ...quotes.map(q => `${q.number};${q.date};${q.client};${q.validUntil};${q.subtotal};${q.vat};${q.total};${q.currency};${q.status}`)
    ].join('\n');
    downloadCSV(csv, `devis_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Export terminé', 'success');
}

// Export quote functions to window
window.openQuoteModal = openQuoteModal;
window.closeQuoteModal = closeQuoteModal;
window.closeQuotePreviewModal = closeQuotePreviewModal;
window.previewQuoteBeforeSave = previewQuoteBeforeSave;
window.onQuoteClientInput = onQuoteClientInput;
window.saveQuote = saveQuote;
window.editQuote = editQuote;
window.deleteQuote = deleteQuote;
window.previewQuote = previewQuote;
window.printQuote = printQuote;
window.convertQuoteToInvoice = convertQuoteToInvoice;
window.convertQuoteToInvoiceById = convertQuoteToInvoiceById;
window.updateQuoteStatus = updateQuoteStatus;
window.addQuoteItemRow = addQuoteItemRow;
window.addQuoteItemFromList = addQuoteItemFromList;
window.calculateQuoteTotal = calculateQuoteTotal;
window.onQuoteClientChange = onQuoteClientChange;
window.exportQuotes = exportQuotes;
window.updateQuotesDisplay = updateQuotesDisplay;

// ========================================
// RECEIVED ORDERS - OP2026XXX
// ========================================

let editingRecOrderId = null;

async function getNextRecOrderNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();
    
    // Get existing orders - they should already be synced from Google Sheets to localStorage
    // by updateReceivedOrdersDisplay() which runs on refresh
    let existingOrders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    
    // If in Google Sheets mode and no local data, try to load from remote
    if (existingOrders.length === 0 && typeof storage !== 'undefined' && storage.getMode() === 'googlesheets') {
        try {
            const remoteOrders = await storage.getReceivedOrders(200);
            if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
                existingOrders = remoteOrders;
                localStorage.setItem('navalo_received_orders', JSON.stringify(existingOrders));
            }
        } catch (e) {
            console.warn('Could not load orders from Google Sheets:', e);
        }
    }
    
    let maxNum = 0;
    existingOrders.forEach(order => {
        if (order.orderNumber) {
            // Extract number from OP2026XXX format
            const match = order.orderNumber.match(/OP(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });
    
    // Use the higher of: config counter or max existing + 1
    if (config.op_year !== year) { config.op_year = year; config.next_op = 1; }
    const configNum = config.next_op || 1;
    const nextNum = Math.max(configNum, maxNum + 1);
    
    const opNumber = `OP${year}${String(nextNum).padStart(3, '0')}`;
    
    // Only increment if actually consuming the number (when saving)
    if (consume) {
        config.next_op = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
    }
    return opNumber;
}

async function openReceivedOrderModal() {
    editingRecOrderId = null;
    document.getElementById('recOrderModalTitle').textContent = t('newReceivedOrder');
    document.getElementById('receivedOrderForm').reset();

    // Reset file
    currentReceivedOrderFile = null;
    document.getElementById('recOrdFileName').textContent = '';

    // Clear stock components and custom items
    document.getElementById('recOrdStockComponents').innerHTML = '';
    document.getElementById('recOrdCustomItems').innerHTML = '';

    // Get next order number (async to check Google Sheets)
    const nextNum = await getNextRecOrderNumber(false);
    document.getElementById('recOrdNumber').value = nextNum;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recOrdDate').value = today;
    const deliveryDate = new Date(); deliveryDate.setDate(deliveryDate.getDate() + 14);
    document.getElementById('recOrdDeliveryDate').value = deliveryDate.toISOString().split('T')[0];

    populateClientSelect('recOrdClient');
    document.getElementById('receivedOrderModal').classList.add('active');
}

function closeReceivedOrderModal() {
    document.getElementById('receivedOrderModal').classList.remove('active');
    editingRecOrderId = null;
}

function onRecOrdFileSelect(input) {
    console.log('onRecOrdFileSelect called', input.files);
    if (input.files && input.files[0]) {
        currentReceivedOrderFile = input.files[0];
        document.getElementById('recOrdFileName').textContent = input.files[0].name;
        console.log('File selected:', currentReceivedOrderFile.name);
    }
}

function viewReceivedOrderFile(orderId) {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Priority: Google Drive > Local file
    if (order.driveFileUrl) {
        window.open(order.driveFileUrl, '_blank');
    } else if (order.driveDownloadUrl) {
        window.open(order.driveDownloadUrl, '_blank');
    } else if (order.fileData) {
        if (order.fileType?.includes('pdf')) {
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>${order.orderNumber}</title></head><body style="margin:0"><embed src="${order.fileData}" type="${order.fileType || 'application/pdf'}" width="100%" height="100%"></body></html>`);
        } else {
            const link = document.createElement('a');
            link.href = order.fileData;
            link.download = order.fileName || `${order.orderNumber}.pdf`;
            link.click();
        }
    }
}

async function uploadReceivedOrderToDrive(id) {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === id);

    if (!order?.fileData) {
        showToast('Žádný soubor k nahrání', 'warning');
        return;
    }

    showToast('Nahrávání na Google Drive...', 'info');

    try {
        const result = await storage.uploadToDrive({
            fileName: order.fileName || `${order.orderNumber}_${order.client}.pdf`,
            fileData: order.fileData,
            fileType: order.fileType || 'application/pdf',
            orderId: order.id,
            folderName: 'NAVALO_Objednavky_Prijate'
        });

        if (result.success) {
            // Update local order with Drive link
            const index = orders.findIndex(o => o.id === id);
            if (index >= 0) {
                orders[index].driveFileId = result.fileId;
                orders[index].driveFileUrl = result.fileUrl;
                orders[index].driveDownloadUrl = result.downloadUrl;
                localStorage.setItem('navalo_received_orders', JSON.stringify(orders));

                // Sync Drive info back to Google Sheets
                if (storage.getMode() === 'googlesheets') {
                    try {
                        await storage.updateReceivedOrder({
                            roId: order.id,
                            driveFileId: result.fileId,
                            driveFileUrl: result.fileUrl,
                            driveDownloadUrl: result.downloadUrl
                        });
                        console.log('✅ Drive info synced to Google Sheets');
                    } catch (e) {
                        console.warn('Failed to sync Drive info to GS:', e);
                    }
                }
            }

            await updateReceivedOrdersDisplay();
            showToast('✅ Nahráno na Google Drive', 'success');

            // Open the file in new tab
            window.open(result.fileUrl, '_blank');
        } else {
            showToast('Chyba: ' + (result.error || 'Upload failed'), 'error');
        }
    } catch (e) {
        console.error('Upload to Drive failed:', e);
        showToast('Chyba při nahrávání: ' + e.message, 'error');
    }
}

function onRecOrdClientChange() {
    const selectId = document.getElementById('recOrdClient').value;
    let client = null;
    
    if (selectId === 'default') {
        client = CONFIG?.DEFAULT_CLIENT;
    } else {
        client = getContacts().find(c => c.id === selectId);
    }
    
    if (client) {
        document.getElementById('recOrdClientIco').value = client.ico || '';
        document.getElementById('recOrdClientDic').value = client.dic || '';
        document.getElementById('recOrdAddress').value = client.address || '';
    }
}

function addRecOrdCustomItem(name = '', qty = 1, price = 0) {
    const container = document.getElementById('recOrdCustomItems');
    const row = document.createElement('div');
    row.className = 'item-row item-row-custom';
    row.innerHTML = `
        <input type="text" class="recOrd-item-name" placeholder="Description" value="${name}" oninput="calculateRecOrdTotal()">
        <input type="number" class="recOrd-item-qty" placeholder="Qté" min="1" value="${qty}" onchange="calculateRecOrdTotal()">
        <input type="number" class="recOrd-item-price" placeholder="Prix unit." min="0" step="0.01" value="${price}" onchange="calculateRecOrdTotal()">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); calculateRecOrdTotal()">✕</button>
    `;
    container.appendChild(row);
}

function getRecOrdCustomItems() {
    const items = [];
    document.querySelectorAll('#recOrdCustomItems .item-row').forEach(row => {
        const name = row.querySelector('.recOrd-item-name')?.value || '';
        const qty = parseFloat(row.querySelector('.recOrd-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.recOrd-item-price')?.value) || 0;
        if (name && qty > 0) {
            items.push({ name, qty, price, total: qty * price });
        }
    });
    return items;
}

function addRecOrdStockComponent(ref = '', qty = 1, price = 0) {
    const container = document.getElementById('recOrdStockComponents');
    const row = document.createElement('div');
    row.className = 'item-row item-row-stock';

    // Build select with stock components
    let selectOptions = `<option value="">-- ${t('refPlaceholder')} --</option>`;
    if (currentStock) {
        const sortedComponents = Object.entries(currentStock).sort((a, b) => a[0].localeCompare(b[0]));
        sortedComponents.forEach(([compRef, data]) => {
            const componentPrice = getComponentPrice(compRef, 'EUR');
            const priceStr = componentPrice ? ` (${formatCurrency(componentPrice)} €)` : '';
            const manufacturer = data.manufacturer ? ` [${data.manufacturer}]` : '';
            const selected = ref === compRef ? 'selected' : '';
            selectOptions += `<option value="${compRef}" data-price="${componentPrice || 0}" ${selected}>${compRef} - ${data.name || compRef}${manufacturer}${priceStr}</option>`;
        });
    }

    row.innerHTML = `
        <select class="recOrd-stock-ref" onchange="onRecOrdStockComponentChange(this); calculateRecOrdTotal()">
            ${selectOptions}
        </select>
        <input type="number" class="recOrd-stock-qty" placeholder="Qté" min="1" value="${qty}" onchange="calculateRecOrdTotal()">
        <input type="number" class="recOrd-stock-price" placeholder="Prix de vente" min="0" step="0.01" value="${price}" onchange="calculateRecOrdTotal()">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); calculateRecOrdTotal()">✕</button>
    `;
    container.appendChild(row);
}

function onRecOrdStockComponentChange(select) {
    const row = select.closest('.item-row');
    const priceInput = row.querySelector('.recOrd-stock-price');
    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption.dataset.price || 0;
    priceInput.value = parseFloat(price).toFixed(2);
}

function getRecOrdStockComponents() {
    const items = [];
    const rows = document.querySelectorAll('#recOrdStockComponents .item-row');
    console.log('getRecOrdStockComponents - found rows:', rows.length);

    rows.forEach((row, index) => {
        const ref = row.querySelector('.recOrd-stock-ref')?.value || '';
        const qty = parseFloat(row.querySelector('.recOrd-stock-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.recOrd-stock-price')?.value) || 0;
        console.log(`Row ${index}: ref=${ref}, qty=${qty}, price=${price}`);

        if (ref && qty > 0) {
            const componentData = currentStock[ref];
            items.push({
                ref,
                name: componentData?.name || ref,
                qty,
                price,
                total: qty * price
            });
        }
    });
    console.log('getRecOrdStockComponents - returning:', items);
    return items;
}

window.addRecOrdStockComponent = addRecOrdStockComponent;

function calculateRecOrdTotal() {
    const models = getPacModels();
    let subtotal = 0;

    // PAC models
    models.forEach(model => {
        const qty = parseInt(document.getElementById(`recOrdQty-${model.id}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`recOrdPrice-${model.id}`)?.value) || 0;
        subtotal += qty * price;
    });

    // Stock components
    document.querySelectorAll('#recOrdStockComponents .item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.recOrd-stock-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.recOrd-stock-price')?.value) || 0;
        subtotal += qty * price;
    });

    // Custom items
    document.querySelectorAll('#recOrdCustomItems .item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.recOrd-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.recOrd-item-price')?.value) || 0;
        subtotal += qty * price;
    });

    const total = subtotal * 1.21;

    document.getElementById('recOrdSubtotal').value = subtotal.toFixed(2);
    document.getElementById('recOrdTotal').value = total.toFixed(2);
}

async function saveReceivedOrder() {
    // Handle file upload
    console.log('saveReceivedOrder - currentReceivedOrderFile:', currentReceivedOrderFile);
    let fileData = null;
    if (currentReceivedOrderFile) {
        try {
            fileData = await fileToBase64(currentReceivedOrderFile);
            console.log('File converted to base64, length:', fileData?.length);
        } catch (e) { console.error('File conversion error:', e); }
    }

    const models = getPacModels();
    const quantities = {};
    const prices = {};
    let hasQty = false;

    models.forEach(model => {
        const qty = parseInt(document.getElementById(`recOrdQty-${model.id}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`recOrdPrice-${model.id}`)?.value) || 0;
        quantities[model.id] = qty;
        prices[model.id] = price;
        if (qty > 0) hasQty = true;
    });

    // Check if there are stock components and custom items
    const stockComponents = getRecOrdStockComponents();
    const customItems = getRecOrdCustomItems();

    // Debug
    console.log('=== SAVE RECEIVED ORDER DEBUG ===');
    console.log('Stock components:', stockComponents);
    console.log('Custom items:', customItems);
    console.log('Quantities:', quantities);
    console.log('================================');

    const hasStockComponents = stockComponents.length > 0;
    const hasCustomItems = customItems.length > 0;

    if (!hasQty && !hasStockComponents && !hasCustomItems) {
        showToast(t('selectAtLeastOne'), 'error');
        return;
    }
    
    // Get order number - consume only if new order
    let orderNumber = document.getElementById('recOrdNumber').value;
    if (!editingRecOrderId) {
        // New order - consume the number (increment counter)
        orderNumber = await getNextRecOrderNumber(true);
        document.getElementById('recOrdNumber').value = orderNumber;
    }
    
    // Get existing file data if editing
    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    let existingFileData = null, existingFileName = null, existingFileType = null;

    if (editingRecOrderId) {
        const existingOrder = orders.find(o => o.id === editingRecOrderId);
        if (existingOrder && !fileData) {
            existingFileData = existingOrder.fileData;
            existingFileName = existingOrder.fileName;
            existingFileType = existingOrder.fileType;
        }
    }

    const order = {
        id: editingRecOrderId || 'RECORD-' + Date.now(),
        orderNumber: orderNumber,
        clientOrderNumber: document.getElementById('recOrdClientNum').value,
        date: document.getElementById('recOrdDate').value,
        client: document.getElementById('recOrdClient').options[document.getElementById('recOrdClient').selectedIndex]?.text || '',
        clientIco: document.getElementById('recOrdClientIco').value,
        clientDic: document.getElementById('recOrdClientDic').value,
        address: document.getElementById('recOrdAddress').value,
        deliveryDate: document.getElementById('recOrdDeliveryDate').value,
        currency: document.getElementById('recOrdCurrency').value,
        quantities: quantities,
        prices: prices,
        stockComponents: stockComponents,
        customItems: customItems,
        subtotal: parseFloat(document.getElementById('recOrdSubtotal').value) || 0,
        total: parseFloat(document.getElementById('recOrdTotal').value) || 0,
        notes: document.getElementById('recOrdNotes').value,
        fileData: fileData || existingFileData,
        fileName: fileData ? currentReceivedOrderFile?.name : existingFileName,
        fileType: fileData ? currentReceivedOrderFile?.type : existingFileType,
        status: 'new',
        createdAt: new Date().toISOString()
    };

    if (editingRecOrderId) {
        const index = orders.findIndex(o => o.id === editingRecOrderId);
        if (index >= 0) {
            order.status = orders[index].status;
            order.createdAt = orders[index].createdAt;
            orders[index] = order;
        }
    } else {
        orders.unshift(order);
    }
    
    localStorage.setItem('navalo_received_orders', JSON.stringify(orders));

    // Sync to Google Sheets if connected
    // Note: Google Sheets API doesn't support stockComponents/customItems yet,
    // but we preserve them locally when reloading from Google Sheets
    try {
        if (storage.getMode() === 'googlesheets') {
            if (editingRecOrderId) {
                // Update existing order
                const result = await storage.updateReceivedOrder({ 
                    roId: order.id, 
                    ...order 
                });
                console.log('Google Sheets update result:', result);
            } else {
                // Create new order
                const result = await storage.createReceivedOrder(order);
                console.log('Google Sheets create result:', result);
                // Update local order with server-assigned ID if returned
                if (result.roId) {
                    order.id = result.roId;
                    orders[0].id = result.roId;
                    localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
                }
            }
        }
    } catch (e) {
        console.error('Sync to Google Sheets failed:', e);
    }
    
    closeReceivedOrderModal();
    await updateReceivedOrdersDisplay();
    populateDeliveryOrderSelect(); // Refresh delivery order dropdown immediately
    showToast(`${order.orderNumber} ${t('saved')}`, 'success');
}

function editReceivedOrder(id) {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    editingRecOrderId = id;
    document.getElementById('recOrderModalTitle').textContent = t('edit');
    document.getElementById('recOrdNumber').value = order.orderNumber;
    document.getElementById('recOrdClientNum').value = order.clientOrderNumber || '';
    document.getElementById('recOrdDate').value = formatDateForInput(order.date);
    document.getElementById('recOrdDeliveryDate').value = formatDateForInput(order.deliveryDate);
    document.getElementById('recOrdAddress').value = order.address || '';
    document.getElementById('recOrdClientIco').value = order.clientIco || '';
    document.getElementById('recOrdClientDic').value = order.clientDic || '';
    document.getElementById('recOrdCurrency').value = order.currency || 'EUR';
    
    // Load model quantities and prices dynamically
    getPacModels().forEach(model => {
        const qtyInput = document.getElementById(`recOrdQty-${model.id}`);
        const priceInput = document.getElementById(`recOrdPrice-${model.id}`);
        if (qtyInput) qtyInput.value = order.quantities?.[model.id] || 0;
        if (priceInput) priceInput.value = order.prices?.[model.id] || '';
    });
    
    document.getElementById('recOrdNotes').value = order.notes || '';

    // Load custom items
    document.getElementById('recOrdCustomItems').innerHTML = '';
    if (order.customItems && order.customItems.length > 0) {
        order.customItems.forEach(item => {
            addRecOrdCustomItem(item.name, item.qty, item.price);
        });
    }

    // Load stock components
    document.getElementById('recOrdStockComponents').innerHTML = '';
    if (order.stockComponents && order.stockComponents.length > 0) {
        order.stockComponents.forEach(item => {
            addRecOrdStockComponent(item.ref, item.qty, item.price);
        });
    }

    // Display existing file if any
    currentReceivedOrderFile = null;
    document.getElementById('recOrdFileName').textContent = order.fileName || '';

    populateClientSelect('recOrdClient');
    calculateRecOrdTotal();
    document.getElementById('receivedOrderModal').classList.add('active');
}

async function updateReceivedOrdersDisplay() {
    // Prevent concurrent updates that cause UI flickering
    if (_updatingReceivedOrders) return;
    _updatingReceivedOrders = true;

    try {
        let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');

        // Load from Google Sheets if connected
        console.log('📋 Checking received orders sync. Mode:', storage.getMode());
        if (storage.getMode() === 'googlesheets') {
            try {
                console.log('📋 Fetching received orders from Google Sheets...');
                const remoteOrders = await storage.getReceivedOrders(100);
                console.log('📋 Received orders from API:', remoteOrders ? remoteOrders.length : 'null/undefined', 'Array?', Array.isArray(remoteOrders));
                if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
                    // Preserve local data not stored in Google Sheets
                    const localOrders = orders;
                    console.log('🔄 Merging remote orders with local data. Local:', localOrders.length, 'Remote:', remoteOrders.length);

                    // Update existing orders from Google Sheets
                    const mergedOrders = remoteOrders.map(remote => {
                        const local = localOrders.find(l => l.id === remote.id || l.orderNumber === remote.orderNumber);

                        if (local) {
                            console.log(`✅ Match for ${remote.orderNumber}: stockComponents=${!!local.stockComponents} (${local.stockComponents?.length || 0}), customItems=${!!local.customItems} (${local.customItems?.length || 0})`);

                            // Preserve file data
                            if (local.fileData && !remote.fileData) {
                                remote.fileData = local.fileData;
                                remote.fileName = local.fileName;
                                remote.fileType = local.fileType;
                            }
                            // Preserve stock components and custom items (not supported by Google Sheets API yet)
                            if (local.stockComponents && !remote.stockComponents) {
                                remote.stockComponents = local.stockComponents;
                                console.log(`  📦 Preserved ${local.stockComponents.length} stock components`);
                            }
                            if (local.customItems && !remote.customItems) {
                                remote.customItems = local.customItems;
                                console.log(`  ✏️ Preserved ${local.customItems.length} custom items`);
                            }
                        } else {
                            console.log(`⚠️ No match for ${remote.orderNumber} (ID: ${remote.id})`);
                        }
                        return remote;
                    });

                    // Add local-only orders (not yet in Google Sheets)
                    const localOnlyOrders = localOrders.filter(local =>
                        !remoteOrders.find(r => r.id === local.id || r.orderNumber === local.orderNumber)
                    );

                    if (localOnlyOrders.length > 0) {
                        console.log(`📦 Keeping ${localOnlyOrders.length} local-only orders:`, localOnlyOrders.map(o => o.orderNumber));
                        mergedOrders.push(...localOnlyOrders);
                    }

                    orders = mergedOrders;
                    localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
                }
            } catch (e) {
                console.warn('Failed to load received orders from Google Sheets:', e);
            }
        }

        const statusFilter = document.getElementById('recOrderStatusFilter')?.value || '';
        const monthFilter = document.getElementById('recOrderMonthFilter')?.value || '';

        let filtered = orders;
        if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
        if (monthFilter) filtered = filtered.filter(o => o.date?.startsWith(monthFilter));

        // Update stats - normalize status for filtering
        const normalizeStatus = (s) => (s || 'new').toLowerCase().trim();
        const newOrders = orders.filter(o => normalizeStatus(o.status) === 'new' || !o.status);
        const confirmedOrders = orders.filter(o => normalizeStatus(o.status) === 'confirmed');
        const toDeliver = orders.filter(o => ['new', 'confirmed', ''].includes(normalizeStatus(o.status)) || !o.status);

        // Calculate to-deliver quantities dynamically
        const models = getPacModels();
        models.forEach(model => {
            const key = modelIdToKey(model.id);
            const toDeliverQty = toDeliver.reduce((sum, o) => sum + (o.quantities?.[model.id] || 0), 0);
            const el = document.getElementById(`recOrder-${key}`);
            if (el) el.textContent = toDeliverQty;
        });

        const totalEl = document.getElementById('recOrderTotalCount');
        const newEl = document.getElementById('recOrderNewCount');
        const confirmedEl = document.getElementById('recOrderConfirmedCount');

        if (totalEl) totalEl.textContent = orders.length;
        if (newEl) newEl.textContent = newOrders.length;
        if (confirmedEl) confirmedEl.textContent = confirmedOrders.length;

        const tbody = document.getElementById('receivedOrdersTableBody');
        if (!tbody) return;

        const numCols = 6 + models.length + 3; // base columns + models + value/status/actions

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${numCols}" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }

        const statusLabels = { new: t('recOrdNew'), confirmed: t('recOrdConfirmed'), delivered: t('recOrdDelivered'), invoiced: t('recOrdInvoiced') };
        const statusClasses = { new: 'badge-warning', confirmed: 'badge-info', delivered: 'badge-success', invoiced: 'badge-success' };

        tbody.innerHTML = filtered.map(order => {
            // Generate model quantity cells dynamically
            const modelCells = models.map(model =>
                `<td class="text-center">${order.quantities?.[model.id] || 0}</td>`
            ).join('');

            // Normalize status - handle undefined, null, empty string
            const orderStatus = (order.status || 'new').toLowerCase().trim();
            const canConfirm = orderStatus === 'new' || orderStatus === '' || !order.status;
            const canDeliver = orderStatus === 'confirmed';
            const canInvoice = orderStatus === 'delivered';
            const hasFileLocal = order.fileData;
            const hasFileDrive = order.driveFileUrl || order.driveFileId;
            const hasFile = hasFileLocal || hasFileDrive;

            // Drive upload button: show if file exists but not yet on Drive
            let driveButtons = '';
            if (hasFileLocal && !hasFileDrive) {
                driveButtons = `<button class="btn-icon" onclick="uploadReceivedOrderToDrive('${order.id}')" title="Nahrát na Google Drive">☁️</button>`;
            }

            return `
            <tr>
                <td><strong>${order.orderNumber}</strong>${hasFileLocal ? ' 📎' : ''}${hasFileDrive ? ' ☁️' : ''}</td>
                <td>${order.clientOrderNumber || '-'}</td>
                <td>${formatDate(order.date)}</td>
                <td>${order.client}</td>
                <td>${formatDate(order.deliveryDate)}</td>
                ${modelCells}
                <td class="text-right">${formatCurrency(order.total)} ${order.currency}</td>
                <td><span class="badge ${statusClasses[orderStatus] || 'badge-warning'}">${statusLabels[orderStatus] || t('recOrdNew')}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewOrderConfirmation('${order.id}')" title="${t('view')}">👁️</button>
                    ${hasFile ? `<button class="btn-icon" onclick="viewReceivedOrderFile('${order.id}')" title="${t('viewFile')}">📄</button>` : ''}
                    ${driveButtons}
                    ${canConfirm ? `<button class="btn-icon" onclick="confirmReceivedOrder('${order.id}')" title="${t('confirmOrderStatus')}">✓</button>` : ''}
                    ${canDeliver ? `<button class="btn-icon" onclick="markOrderDelivered('${order.id}')" title="${t('markDelivered')}">📦</button>` : ''}
                    ${canInvoice ? `<button class="btn-icon" onclick="createInvoiceFromOrder('${order.id}')" title="${t('createInvoice')}">🧾</button>` : ''}
                    <button class="btn-icon" onclick="editReceivedOrder('${order.id}')" title="${t('edit')}">✏️</button>
                    <button class="btn-icon" onclick="deleteReceivedOrder('${order.id}')" title="${t('delete')}">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } finally {
        _updatingReceivedOrders = false;
    }
}

async function confirmReceivedOrder(id) {
    console.log('🔄 confirmReceivedOrder called with id:', id);
    
    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    console.log('📋 Found', orders.length, 'orders in localStorage');
    
    const index = orders.findIndex(o => o.id === id);
    console.log('📍 Order index:', index);
    
    if (index >= 0) {
        console.log('📝 Current status:', orders[index].status);
        orders[index].status = 'confirmed';
        orders[index].confirmedDate = new Date().toISOString();
        localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
        console.log('✅ localStorage updated to confirmed');
        
        // Sync to Google Sheets FIRST
        if (storage.getMode() === 'googlesheets') {
            try {
                console.log('🔄 Syncing to Google Sheets...');
                const result = await storage.updateReceivedOrder({
                    roId: id,
                    status: 'confirmed'
                });
                console.log('✅ Google Sheets sync result:', result);
            } catch (e) {
                console.error('❌ Failed to sync to Google Sheets:', e);
            }
        }
        
        // Update display WITHOUT reloading from Google Sheets
        updateReceivedOrdersDisplayLocal();
        showToast(t('saved'), 'success');
        viewOrderConfirmation(id);
    } else {
        console.error('❌ Order not found with id:', id);
        showToast('Order not found', 'error');
    }
}

async function markOrderDelivered(id) {
    console.log('🔄 markOrderDelivered called with id:', id);

    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const index = orders.findIndex(o => o.id === id);

    if (index >= 0) {
        const order = orders[index];
        console.log('📝 Current status:', order.status);

        // Deduct stock for stockComponents BEFORE marking as delivered
        if (storage.getMode() === 'googlesheets' && order.stockComponents && order.stockComponents.length > 0) {
            try {
                console.log('📦 Deducting stock for order components...', order.stockComponents);
                const deductResult = await storage.deductStockForComponents(
                    order.stockComponents,
                    order.orderNumber || id,
                    order.client || 'Client',
                    new Date().toISOString()
                );

                if (!deductResult.success) {
                    console.error('❌ Stock deduction failed:', deductResult.errors);
                    const errorMsg = deductResult.errors.map(e => `${e.ref}: ${e.error}`).join('\n');
                    showToast('Erreur déduction stock:\n' + errorMsg, 'error');
                    return;
                }
                console.log('✅ Stock deducted:', deductResult.deductedComponents, 'components');
            } catch (e) {
                console.error('❌ Failed to deduct stock:', e);
                showToast('Erreur lors de la déduction du stock: ' + e.message, 'error');
                return;
            }
        }

        order.status = 'delivered';
        order.delivered = true;
        order.deliveredDate = new Date().toISOString();
        localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
        console.log('✅ localStorage updated to delivered');

        // Sync to Google Sheets
        if (storage.getMode() === 'googlesheets') {
            try {
                console.log('🔄 Syncing delivered status to Google Sheets...');
                const result = await storage.updateReceivedOrder({
                    roId: id,
                    status: 'delivered',
                    delivered: true
                });
                console.log('✅ Google Sheets sync result:', result);
            } catch (e) {
                console.error('❌ Failed to sync to Google Sheets:', e);
            }
        }

        // Update display WITHOUT reloading from Google Sheets
        updateReceivedOrdersDisplayLocal();
        showToast(t('saved'), 'success');
    } else {
        console.error('❌ Order not found with id:', id);
        showToast('Order not found', 'error');
    }
}

// Display function that uses LOCAL data only (no Google Sheets reload)
function updateReceivedOrdersDisplayLocal() {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const statusFilter = document.getElementById('recOrderStatusFilter')?.value || 'all';
    
    let filtered = orders;
    if (statusFilter !== 'all') {
        filtered = orders.filter(o => (o.status || 'new').toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Update stats - normalize status for filtering
    const normalizeStatus = (s) => (s || 'new').toLowerCase().trim();
    const newOrders = orders.filter(o => normalizeStatus(o.status) === 'new' || !o.status);
    const confirmedOrders = orders.filter(o => normalizeStatus(o.status) === 'confirmed');
    const toDeliver = orders.filter(o => ['new', 'confirmed', ''].includes(normalizeStatus(o.status)) || !o.status);
    
    // Calculate to-deliver quantities dynamically
    const models = getPacModels();
    models.forEach(model => {
        const key = modelIdToKey(model.id);
        const toDeliverQty = toDeliver.reduce((sum, o) => sum + (o.quantities?.[model.id] || 0), 0);
        const el = document.getElementById(`recOrder-${key}`);
        if (el) el.textContent = toDeliverQty;
    });
    
    const totalEl = document.getElementById('recOrderTotalCount');
    const newEl = document.getElementById('recOrderNewCount');
    const confirmedEl = document.getElementById('recOrderConfirmedCount');
    
    if (totalEl) totalEl.textContent = orders.length;
    if (newEl) newEl.textContent = newOrders.length;
    if (confirmedEl) confirmedEl.textContent = confirmedOrders.length;
    
    const tbody = document.getElementById('receivedOrdersTableBody');
    if (!tbody) return;

    const numCols = 6 + models.length + 4; // Added 1 for Progression column
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${numCols}" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    const statusLabels = { new: t('recOrdNew'), confirmed: t('recOrdConfirmed'), partial: 'Partielle', delivered: t('recOrdDelivered'), invoiced: t('recOrdInvoiced') };
    const statusClasses = { new: 'badge-warning', confirmed: 'badge-info', partial: 'badge-warning-alt', delivered: 'badge-success', invoiced: 'badge-success' };

    tbody.innerHTML = filtered.map(order => {
        const modelCells = models.map(model =>
            `<td class="text-center">${order.quantities?.[model.id] || 0}</td>`
        ).join('');

        const orderStatus = (order.status || 'new').toLowerCase().trim();
        const canConfirm = orderStatus === 'new' || orderStatus === '' || !order.status;
        const canDeliver = orderStatus === 'confirmed';
        const canInvoice = orderStatus === 'delivered';
        const hasFileLocal = order.fileData;
        const hasFileDrive = order.driveFileUrl || order.driveFileId;
        const hasFile = hasFileLocal || hasFileDrive;

        let driveButtons = '';
        if (hasFileLocal && !hasFileDrive) {
            driveButtons = `<button class="btn-icon" onclick="uploadReceivedOrderToDrive('${order.id}')" title="Nahrát na Google Drive">☁️</button>`;
        }

        // Build progression cell
        let progressionCell = '<td class="text-center">-</td>';
        if (order.deliveries && order.deliveries.length > 0) {
            const progressParts = [];
            Object.keys(order.quantities || {}).forEach(model => {
                const total = order.quantities[model] || 0;
                const delivered = (order.deliveredQuantities || {})[model] || 0;
                if (total > 0) {
                    progressParts.push(`${model}:${delivered}/${total}`);
                }
            });
            const deliveryCount = order.deliveries.length;
            progressionCell = `<td class="text-center"><small>${deliveryCount} livraison${deliveryCount > 1 ? 's' : ''}<br>${progressParts.join(', ')}</small></td>`;
        }

        return `
        <tr>
            <td><strong>${order.orderNumber}</strong>${hasFileLocal ? ' 📎' : ''}${hasFileDrive ? ' ☁️' : ''}</td>
            <td>${order.clientOrderNumber || '-'}</td>
            <td>${formatDate(order.date)}</td>
            <td>${order.client}</td>
            <td>${formatDate(order.deliveryDate)}</td>
            ${modelCells}
            <td class="text-right">${formatCurrency(order.total)} ${order.currency}</td>
            ${progressionCell}
            <td><span class="badge ${statusClasses[orderStatus] || 'badge-warning'}">${statusLabels[orderStatus] || t('recOrdNew')}</span></td>
            <td>
                <button class="btn-icon" onclick="viewOrderConfirmation('${order.id}')" title="${t('view')}">👁️</button>
                ${hasFile ? `<button class="btn-icon" onclick="viewReceivedOrderFile('${order.id}')" title="${t('viewFile')}">📄</button>` : ''}
                ${driveButtons}
                ${canConfirm ? `<button class="btn-icon" onclick="confirmReceivedOrder('${order.id}')" title="${t('confirmOrderStatus')}">✓</button>` : ''}
                ${canDeliver ? `<button class="btn-icon" onclick="markOrderDelivered('${order.id}')" title="${t('markDelivered')}">📦</button>` : ''}
                ${canInvoice ? `<button class="btn-icon" onclick="createInvoiceFromOrder('${order.id}')" title="${t('createInvoice')}">🧾</button>` : ''}
                <button class="btn-icon" onclick="editReceivedOrder('${order.id}')" title="${t('edit')}">✏️</button>
                <button class="btn-icon" onclick="deleteReceivedOrder('${order.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

function createInvoiceFromOrder(orderId) {
    document.getElementById('invoiceModal').classList.remove('active');
    openFreeInvoiceModal();
    document.getElementById('invLinkedOrder').value = orderId;
    loadRecOrderToInvoice();
}

async function deleteReceivedOrder(id) {
    if (!confirm(t('confirmDelete'))) return;
    
    // Delete from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            await storage.deleteReceivedOrder(id);
        } catch (e) {
            console.warn('Failed to delete from Google Sheets:', e);
        }
    }
    
    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
    await updateReceivedOrdersDisplay();
    showToast(t('deleted'), 'success');
}

function exportReceivedOrders() {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const models = getPacModels();
    const modelHeaders = models.map(m => m.name).join(';');
    let csv = `Číslo;Číslo obj. zák.;Datum;Zákazník;Dodání;${modelHeaders};Hodnota;Měna;Stav\n`;
    orders.forEach(o => {
        const modelQtys = models.map(m => o.quantities?.[m.id] || 0).join(';');
        csv += `${o.orderNumber};${o.clientOrderNumber || ''};${o.date};${o.client};${o.deliveryDate};${modelQtys};${o.total};${o.currency};${o.status}\n`;
    });
    downloadCSV(csv, `objednavky_prijate_${new Date().toISOString().split('T')[0]}.csv`);
}

function viewOrderFromDelivery(orderId) {
    // Navigate to received orders tab and view the order
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    const navBtn = document.querySelector('[data-tab="received-orders"]');
    if (navBtn) navBtn.classList.add('active');

    const tabContent = document.getElementById('tab-received-orders');
    if (tabContent) tabContent.classList.add('active');

    viewOrderConfirmation(orderId);
}

function viewOrderConfirmation(id) {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === id);
    if (!order) return;
    window.currentReceivedOrder = order;

    // Debug: log order data
    console.log('=== ORDER CONFIRMATION DEBUG ===');
    console.log('Order ID:', id);
    console.log('Order data:', order);
    console.log('Quantities:', order.quantities);
    console.log('Stock components:', order.stockComponents);
    console.log('Custom items:', order.customItems);
    console.log('Subtotal:', order.subtotal);
    console.log('Total:', order.total);
    console.log('===============================');

    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const pcs = t('pieces');
    const models = getPacModels();
    
    // Generate items rows dynamically and calculate subtotal
    let calculatedSubtotal = 0;
    let itemsHtml = models.map(model => {
        const qty = order.quantities?.[model.id] || 0;
        const price = order.prices?.[model.id] || 0;
        if (qty > 0) {
            const lineTotal = qty * price;
            calculatedSubtotal += lineTotal;
            return `<tr><td>${model.fullName}</td><td class="text-right">${qty}</td><td class="text-right">${formatCurrency(price)} ${order.currency}</td><td class="text-right">${formatCurrency(lineTotal)} ${order.currency}</td></tr>`;
        }
        return '';
    }).join('');

    // Add stock components
    if (order.stockComponents && order.stockComponents.length > 0) {
        order.stockComponents.forEach(item => {
            const lineTotal = item.qty * item.price;
            calculatedSubtotal += lineTotal;
            itemsHtml += `<tr><td>${item.ref} - ${item.name}</td><td class="text-right">${item.qty}</td><td class="text-right">${formatCurrency(item.price)} ${order.currency}</td><td class="text-right">${formatCurrency(lineTotal)} ${order.currency}</td></tr>`;
        });
    }

    // Add custom items
    if (order.customItems && order.customItems.length > 0) {
        order.customItems.forEach(item => {
            const lineTotal = item.qty * item.price;
            calculatedSubtotal += lineTotal;
            itemsHtml += `<tr><td>${item.name}</td><td class="text-right">${item.qty}</td><td class="text-right">${formatCurrency(item.price)} ${order.currency}</td><td class="text-right">${formatCurrency(lineTotal)} ${order.currency}</td></tr>`;
        });
    }

    // Use stored subtotal or calculated one
    const subtotal = order.subtotal || calculatedSubtotal;
    const vatRate = order.vatRate || 21;
    const vat = subtotal * vatRate / 100;
    const total = order.total || (subtotal + vat);
    
    document.getElementById('orderConfirmPreview').innerHTML = `
        <div class="order-confirm-doc">
            <div class="oc-header">
                <div class="oc-company">
                    <h2>${company.name || 'NAVALO s.r.o.'}</h2>
                    <p>${company.address || ''}</p>
                    <p>IČO: ${company.ico || ''} | DIČ: ${company.dic || ''}</p>
                </div>
                <div class="oc-info">
                    <h1>${t('orderConfirmation')}</h1>
                    <p><strong>${order.orderNumber}</strong></p>
                    <p>${t('date')}: ${formatDate(order.confirmedDate || new Date().toISOString())}</p>
                </div>
            </div>
            <div class="oc-parties">
                <div class="oc-party">
                    <h4>${t('supplier')}</h4>
                    <div class="oc-party-box">
                        <strong>${company.name || 'NAVALO s.r.o.'}</strong><br>
                        ${company.address || ''}<br>
                        IČO: ${company.ico || ''}<br>
                        DIČ: ${company.dic || ''}
                    </div>
                </div>
                <div class="oc-party">
                    <h4>${t('customer')}</h4>
                    <div class="oc-party-box">
                        <strong>${order.client}</strong><br>
                        ${order.address || ''}<br>
                        IČO: ${order.clientIco || ''}<br>
                        DIČ: ${order.clientDic || ''}
                    </div>
                </div>
            </div>
            <div class="oc-reference">
                <p><strong>${t('clientOrderNum')}:</strong> ${order.clientOrderNumber || '-'}</p>
                <p><strong>${t('deliveryDate')}:</strong> ${formatDate(order.deliveryDate)}</p>
            </div>
            <table class="oc-table">
                <thead>
                    <tr>
                        <th>${t('designation')}</th>
                        <th>${t('quantity')}</th>
                        <th>${t('unitPrice')}</th>
                        <th>${t('total')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr><td colspan="3" class="text-right">${t('subtotal')} HT:</td><td class="text-right">${formatCurrency(subtotal)} ${order.currency}</td></tr>
                    <tr><td colspan="3" class="text-right">${t('vat')} (${vatRate}%):</td><td class="text-right">${formatCurrency(vat)} ${order.currency}</td></tr>
                    <tr class="oc-total"><td colspan="3" class="text-right"><strong>${t('totalTTC')}:</strong></td><td class="text-right"><strong>${formatCurrency(total)} ${order.currency}</strong></td></tr>
                </tfoot>
            </table>
            ${order.notes ? `<div class="oc-notes"><strong>${t('notes')}:</strong> ${order.notes}</div>` : ''}
            <div class="oc-footer">
                <p>Děkujeme za Vaši objednávku. Toto potvrzení slouží jako závazná akceptace objednávky.</p>
                <div class="oc-signature">
                    <div class="oc-signature-line"></div>
                    <p>${company.name || 'NAVALO s.r.o.'}</p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('orderConfirmModal').classList.add('active');
}

function closeOrderConfirmModal() {
    document.getElementById('orderConfirmModal').classList.remove('active');
}

function printOrderConfirm() {
    const originalTitle = document.title;
    document.title = window.currentReceivedOrder?.orderNumber || 'Confirmation';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

// ========================================
// DIAGNOSTIC FUNCTIONS
// ========================================

async function testGoogleSheetsConnection() {
    console.log('=== TEST GOOGLE SHEETS CONNECTION ===');
    console.log('Mode:', storage.getMode());
    console.log('API URL:', CONFIG?.API_URL || 'NOT SET');
    
    if (storage.getMode() !== 'googlesheets') {
        console.error('❌ Mode is not googlesheets! Check CONFIG.STORAGE_MODE and CONFIG.API_URL');
        return false;
    }
    
    try {
        // Test GET request
        console.log('Testing GET request (getStock)...');
        const stock = await storage.getStockWithValue();
        console.log('✅ GET works! Stock components:', Object.keys(stock.components || {}).length);
        
        // Test POST request with a dummy order
        console.log('Testing POST request (createReceivedOrder)...');
        const testOrder = {
            id: 'TEST-' + Date.now(),
            orderNumber: 'TEST-DELETE-ME',
            client: 'Test Client',
            date: new Date().toISOString().split('T')[0],
            quantities: { 'TX9': 1, 'TX12-3PH': 0, 'TX12-1PH': 0, 'TH11': 0 },
            prices: { 'TX9': 100, 'TX12-3PH': 0, 'TX12-1PH': 0, 'TH11': 0 },
            total: 100,
            currency: 'EUR',
            status: 'test',
            notes: 'TEST - DELETE ME'
        };
        
        const result = await storage.createReceivedOrder(testOrder);
        console.log('POST result:', result);
        
        if (result.success) {
            console.log('✅ POST works! Order created in Google Sheets');
            alert('✅ Connexion OK! Vérifiez la feuille Commandes_Recues dans Google Sheets.');
            return true;
        } else {
            console.error('❌ POST failed:', result.error);
            alert('❌ POST failed: ' + (result.error || 'Unknown error'));
            return false;
        }
    } catch (e) {
        console.error('❌ Connection error:', e);
        alert('❌ Erreur de connexion: ' + e.message);
        return false;
    }
}

// Make it available globally for console testing
window.testGoogleSheetsConnection = testGoogleSheetsConnection;

// ========================================
// AUTO-REFRESH FOR MULTI-USER SYNC
// ========================================

let autoRefreshPaused = false;
let _refreshInProgress = false;  // Guard to prevent concurrent refreshes
let _eventListenersAdded = false;  // Ensure listeners are only added once
const AUTO_REFRESH_DELAY = 30000; // 30 seconds

function startAutoRefresh() {
    if (autoRefreshInterval) return; // Already running

    autoRefreshInterval = setInterval(async () => {
        if (autoRefreshPaused) return;
        if (document.hidden) return; // Don't refresh if tab is not visible
        if (_refreshInProgress) return; // Don't start new refresh if one is in progress

        try {
            // Show refreshing indicator
            const statusEl = document.getElementById('syncStatus');
            const originalText = statusEl.textContent;
            statusEl.textContent = '🔄 Sync...';

            // Refresh data from Google Sheets
            await refreshFromGoogleSheets();

            // Restore indicator
            statusEl.textContent = originalText;
        } catch (e) {
            console.warn('Auto-refresh failed:', e);
        }
    }, AUTO_REFRESH_DELAY);

    // Only add event listeners once
    if (!_eventListenersAdded) {
        _eventListenersAdded = true;

        // Pause when user is editing (focus on input/textarea)
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                autoRefreshPaused = true;
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                autoRefreshPaused = false;
            }
        });

        // Refresh when tab becomes visible again
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden && storage.getMode() === 'googlesheets' && !_refreshInProgress) {
                await refreshFromGoogleSheets();
            }
        });
    }

    console.log('🔄 Auto-refresh started (every 30s)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏹️ Auto-refresh stopped');
    }
}

async function refreshFromGoogleSheets() {
    // Prevent concurrent refreshes that cause UI flickering
    if (_refreshInProgress) {
        console.log('⏳ Refresh already in progress, skipping...');
        return;
    }
    _refreshInProgress = true;

    // Refresh only the dynamic data that other users might modify
    try {
        // Stock data
        const stockData = await storage.getStockWithValue();
        if (stockData.components) {
            currentStock = stockData.components;
            updateStockDisplay();
            
            const totalValue = stockData.totalValue || 0;
            document.getElementById('totalStockValue').textContent = `${t('stockValue')}: ${formatCurrency(totalValue)} CZK`;
            document.getElementById('stockValueDisplay').textContent = formatCurrency(totalValue);
        }
        
        // Received orders
        await updateReceivedOrdersDisplay();
        
        // Received invoices
        await updateReceivedInvoicesDisplay();
        
        // Purchase orders
        updatePurchaseOrdersDisplay();
        
        // Deliveries
        updateDeliveriesDisplay();
        
        // Update alerts
        updateAlerts();
        calculateCapacity();
        
    } catch (e) {
        console.warn('Refresh from Google Sheets failed:', e);
    } finally {
        _refreshInProgress = false;
    }
}

// Manual refresh button handler
function manualRefresh() {
    const statusEl = document.getElementById('syncStatus');
    statusEl.textContent = '🔄 Sync...';
    
    refreshFromGoogleSheets().then(() => {
        statusEl.textContent = '● Google Sheets';
        statusEl.style.color = '#10b981';
        showToast(t('dataRefreshed') || 'Données actualisées', 'success');
    }).catch(() => {
        statusEl.textContent = '● Google Sheets';
        statusEl.style.color = '#10b981';
    });
}

// Export for global access
window.manualRefresh = manualRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.startAutoRefresh = startAutoRefresh;

// Export order confirmation functions for onclick handlers
window.confirmReceivedOrder = confirmReceivedOrder;
window.markOrderDelivered = markOrderDelivered;
window.viewOrderConfirmation = viewOrderConfirmation;
window.createInvoiceFromOrder = createInvoiceFromOrder;
window.loadRecOrderToInvoice = loadRecOrderToInvoice;
window.deleteReceivedOrder = deleteReceivedOrder;
window.editReceivedOrder = editReceivedOrder;
window.viewReceivedOrderFile = viewReceivedOrderFile;
window.uploadReceivedOrderToDrive = uploadReceivedOrderToDrive;
window.addRecOrdCustomItem = addRecOrdCustomItem;
window.onRecOrdFileSelect = onRecOrdFileSelect;
window.calculateRecOrdTotal = calculateRecOrdTotal;
window.onRecOrdClientChange = onRecOrdClientChange;

// Export Google Drive functions
window.uploadInvoiceToDrive = uploadInvoiceToDrive;
window.uploadAllInvoicesToDrive = uploadAllInvoicesToDrive;

// Export received invoice functions
window.markRecInvPaid = markRecInvPaid;
window.deleteRecInv = deleteRecInv;
window.editReceivedInvoice = editReceivedInvoice;
window.viewReceivedInvoicePDF = viewReceivedInvoicePDF;
window.toggleRecInvProformaFields = toggleRecInvProformaFields;
window.populateRecInvPaidProformas = populateRecInvPaidProformas;
window.updateRecInvProformaDeduction = updateRecInvProformaDeduction;

// Function to clear local data and resync from Google Sheets
async function clearLocalAndResync() {
    if (!confirm('Toto smaže všechna lokální data a znovu načte z Google Sheets. Pokračovat?')) return;
    
    console.log('🗑️ Clearing local data...');
    
    // Clear local storage keys related to data
    const keysToRemove = [
        'navalo_received_invoices',
        'navalo_receipts',
        'navalo_purchase_orders',
        'navalo_received_orders',
        'navalo_invoices',
        'navalo_deliveries'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('  Removed:', key);
    });
    
    console.log('🔄 Reloading from Google Sheets...');
    await refreshAllData();
    
    showToast('Data resynchronizována z Google Sheets', 'success');
}

window.clearLocalAndResync = clearLocalAndResync;

// Force refresh stock from Google Sheets (bypasses local cache)
async function forceRefreshStock() {
    console.log('🔄 Force refreshing stock from Google Sheets...');
    showToast('Rafraîchissement du stock...', 'info');

    try {
        const stockData = await storage.forceRefreshStock();
        if (stockData && stockData.components) {
            currentStock = stockData.components;
            updateStockDisplay();

            const totalValue = stockData.totalValue || 0;
            document.getElementById('totalStockValue').textContent = `${t('stockValue')}: ${formatCurrency(totalValue)} CZK`;
            document.getElementById('stockValueDisplay').textContent = formatCurrency(totalValue);

            showToast('Stock mis à jour depuis Google Sheets', 'success');
            console.log('✅ Stock refreshed:', Object.keys(currentStock).length, 'components');
        }
    } catch (e) {
        console.error('Force refresh failed:', e);
        showToast('Erreur: ' + e.message, 'error');
    }
}

window.forceRefreshStock = forceRefreshStock;

// ========================================
// STOCK ADJUSTMENTS
// ========================================

let currentAdjustmentRef = null;

function openAdjustmentModal(ref) {
    if (!currentStock || !currentStock[ref]) {
        showToast(t('error'), 'error');
        return;
    }

    currentAdjustmentRef = ref;
    const data = currentStock[ref];
    const currentQty = data.qty || 0;

    document.getElementById('adjRef').value = ref;
    document.getElementById('adjName').value = data.name || ref;
    document.getElementById('adjCurrentQty').value = currentQty;
    document.getElementById('adjNewQty').value = currentQty;
    document.getElementById('adjReason').value = '';
    document.getElementById('adjReasonText').value = '';
    document.getElementById('adjDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('adjUserName').value = '';

    document.getElementById('adjPreview').style.display = 'none';
    updateCharCounter();

    document.getElementById('adjustmentModal').classList.add('active');
}

function closeAdjustmentModal() {
    currentAdjustmentRef = null;
    document.getElementById('adjustmentModal').classList.remove('active');
}

function updateAdjustmentPreview() {
    const currentQty = parseFloat(document.getElementById('adjCurrentQty').value) || 0;
    const newQty = parseFloat(document.getElementById('adjNewQty').value);

    if (isNaN(newQty)) {
        document.getElementById('adjPreview').style.display = 'none';
        return;
    }

    const change = newQty - currentQty;
    const previewDiv = document.getElementById('adjPreview');
    const previewValue = document.getElementById('adjPreviewValue');

    if (change === 0) {
        previewDiv.style.display = 'none';
        return;
    }

    previewDiv.style.display = 'block';
    const sign = change > 0 ? '+' : '';
    const className = change > 0 ? 'qty-increase' : 'qty-decrease';
    previewValue.innerHTML = `<span class="${className}">${sign}${change}</span>`;
}

function updateCharCounter() {
    const textarea = document.getElementById('adjReasonText');
    const counter = document.getElementById('charCount');
    const count = textarea.value.length;
    counter.textContent = count;
}

async function saveAdjustment() {
    const ref = currentAdjustmentRef;
    if (!ref) return;

    const currentQty = parseFloat(document.getElementById('adjCurrentQty').value) || 0;
    const newQty = parseFloat(document.getElementById('adjNewQty').value);
    const reason = document.getElementById('adjReason').value;
    const reasonText = document.getElementById('adjReasonText').value.trim();
    const date = document.getElementById('adjDate').value;
    const userName = document.getElementById('adjUserName').value.trim() || 'Unknown';

    // Validation
    if (isNaN(newQty) || newQty < 0) {
        showToast(t('error') + ': ' + t('newQty'), 'error');
        return;
    }

    if (!reason || !reasonText) {
        showToast(t('error') + ': ' + t('reasonDetails'), 'error');
        return;
    }

    const change = newQty - currentQty;

    if (change === 0) {
        showToast(t('noChangeError'), 'warning');
        return;
    }

    // Confirmation for large adjustments
    if (Math.abs(change) > 100 || (currentQty > 0 && Math.abs(change / currentQty) > 0.5)) {
        if (!confirm(t('confirmLargeAdjustment'))) {
            return;
        }
    }

    try {
        const result = await storage.processAdjustment({
            ref,
            newQty,
            reason,
            reasonText,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            userName
        });

        if (result.success) {
            showToast(t('adjustmentSaved') + ` (${result.docNum})`, 'success');
            closeAdjustmentModal();
            await refreshAllData();
        } else {
            showToast(t('error') + ': ' + (result.error || 'Unknown'), 'error');
        }
    } catch (e) {
        console.error('Adjustment error:', e);
        showToast(t('error') + ': ' + e.message, 'error');
    }
}

async function updateAdjustmentsDisplay() {
    try {
        const adjustments = await storage.getAdjustments(100);
        const tbody = document.getElementById('adjustmentsTableBody');
        if (!tbody) return;

        if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }

        tbody.innerHTML = adjustments.map(adj => {
            const date = new Date(adj.date).toLocaleDateString(currentLang === 'cz' ? 'cs-CZ' : 'fr-FR');
            const changeClass = adj.qtyChange > 0 ? 'qty-increase' : 'qty-decrease';
            const changeSign = adj.qtyChange > 0 ? '+' : '';

            // Get reason translation
            const reasonKey = 'reason' + adj.reason.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            const reasonLabel = t(reasonKey) || adj.reason;

            return `<tr>
                <td>${date}</td>
                <td><code>${adj.docNum}</code></td>
                <td><code>${adj.ref}</code></td>
                <td>${adj.name}</td>
                <td class="text-right">${adj.qtyBefore}</td>
                <td class="text-right">${adj.qtyAfter}</td>
                <td class="text-right ${changeClass}"><strong>${changeSign}${adj.qtyChange}</strong></td>
                <td>${reasonLabel}</td>
                <td class="text-right ${adj.valueImpact >= 0 ? 'qty-increase' : 'qty-decrease'}">${formatCurrency(adj.valueImpact)}</td>
                <td>${adj.userName}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error('Error loading adjustments:', e);
    }
}

window.openAdjustmentModal = openAdjustmentModal;
window.closeAdjustmentModal = closeAdjustmentModal;
window.updateAdjustmentPreview = updateAdjustmentPreview;
window.updateCharCounter = updateCharCounter;
window.saveAdjustment = saveAdjustment;

// ========================================
// HYBRID MODE - SYNC MANAGEMENT
// ========================================

function updateSyncIndicator() {
    if (!storage.isHybridMode()) {
        document.getElementById('hybridSyncIndicator').style.display = 'none';
        return;
    }

    const indicator = document.getElementById('hybridSyncIndicator');
    const icon = document.getElementById('syncIndicatorIcon');
    const text = document.getElementById('syncIndicatorText');

    indicator.style.display = 'flex';

    const syncInfo = storage.getSyncInfo();
    if (!syncInfo) return;

    const { status, queue } = syncInfo;
    const pending = queue.filter(i => i.status === 'pending').length;
    const errors = queue.filter(i => i.status === 'error').length;

    // Update icon and text based on status
    if (pending > 0) {
        icon.textContent = '⏳';
        icon.title = `${pending} opération(s) en attente`;
        text.textContent = `${pending} en attente`;
        text.className = 'sync-pending';
    } else if (errors > 0) {
        icon.textContent = '⚠️';
        icon.title = `${errors} erreur(s) de synchronisation`;
        text.textContent = `${errors} erreur(s)`;
        text.className = 'sync-error';
    } else if (status.lastSync) {
        icon.textContent = '✓';
        const lastSync = new Date(status.lastSync);
        const elapsed = Math.floor((Date.now() - lastSync.getTime()) / 1000);
        let timeStr = '';
        if (elapsed < 60) {
            timeStr = `${elapsed}s`;
        } else if (elapsed < 3600) {
            timeStr = `${Math.floor(elapsed / 60)}min`;
        } else {
            timeStr = `${Math.floor(elapsed / 3600)}h`;
        }
        icon.title = `Dernière sync: ${lastSync.toLocaleTimeString()}`;
        text.textContent = `Sync ${timeStr}`;
        text.className = 'sync-ok';
    } else {
        icon.textContent = '🔄';
        text.textContent = 'Jamais synchronisé';
        text.className = 'sync-pending';
    }
}

async function syncNowManual() {
    const btn = event.target;
    const originalText = btn.textContent;

    btn.textContent = '⟳';
    btn.disabled = true;

    try {
        showToast(currentLang === 'cz' ? 'Synchronizace...' : 'Synchronisation...', 'info');
        const result = await storage.syncNow();

        if (result.success) {
            showToast(currentLang === 'cz' ? 'Synchronizace dokončena' : 'Synchronisation terminée', 'success');
            updateSyncIndicator();
        } else {
            showToast(result.error || 'Erreur', 'error');
        }
    } catch (error) {
        console.error('Sync error:', error);
        showToast(currentLang === 'cz' ? 'Chyba synchronizace' : 'Erreur de synchronisation', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Listen to sync status changes
window.addEventListener('syncStatusChanged', () => {
    updateSyncIndicator();
});

// Update sync indicator every 10 seconds
setInterval(() => {
    if (storage.isHybridMode()) {
        updateSyncIndicator();
    }
}, 10000);

window.syncNowManual = syncNowManual;

// ========================================
//  REPAIR QUOTES FUNCTIONS
// ========================================

let currentRepairQuote = null;
let pacCounter = 0;

async function openRepairQuoteModal(quoteId = null) {
    currentRepairQuote = quoteId;
    pacCounter = 0;

    const modal = document.getElementById('repairQuoteModal');
    const form = document.getElementById('repairQuoteForm');
    const title = document.getElementById('repairQuoteModalTitle');

    form.reset();
    document.getElementById('repairPACsList').innerHTML = '';

    // Populate client select
    populateRepairQuoteClientSelect();

    if (quoteId) {
        // Edit mode - load existing quote
        title.textContent = t('editRepairQuote') || 'Modifier devis';
        await loadRepairQuoteData(quoteId);
    } else {
        // New quote mode
        title.textContent = t('newRepairQuote');
        document.getElementById('repairQuoteDate').valueAsDate = new Date();

        // Generate quote number - check existing quotes to find next available
        await generateNextRepairQuoteNumber();
    }

    modal.style.display = 'flex';
}

async function generateNextRepairQuoteNumber() {
    const year = new Date().getFullYear();
    let maxNum = 0;

    try {
        // Get all existing repair quotes
        const quotes = await storage.getRepairQuotes(500);

        // Find the highest number for this year
        quotes.forEach(quote => {
            if (quote.quoteNumber) {
                const match = String(quote.quoteNumber).match(/DV(\d{4})(\d{3})/);
                if (match && parseInt(match[1]) === year) {
                    const num = parseInt(match[2]);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
    } catch (e) {
        console.error('Error fetching quotes for number generation:', e);
    }

    const nextNum = maxNum + 1;
    document.getElementById('repairQuoteNumber').value = `DV${year}${String(nextNum).padStart(3, '0')}`;
}

async function loadRepairQuoteData(quoteId) {
    // Get quote from storage
    const quotes = await storage.getRepairQuotes(100);
    const quote = quotes.find(q => q.id === quoteId);

    if (!quote) {
        showToast('Devis non trouvé', 'error');
        return;
    }

    // Load basic fields
    document.getElementById('repairQuoteNumber').value = quote.quoteNumber || '';
    document.getElementById('repairQuoteTicketNum').value = quote.ticketNumber || '';
    document.getElementById('repairQuoteClientOrderNum').value = quote.clientOrderNumber || '';
    document.getElementById('repairQuoteDate').value = formatDateForInput(quote.date);
    document.getElementById('repairQuoteNotes').value = quote.notes || '';

    // Select client
    const clientSelect = document.getElementById('repairQuoteClient');
    if (quote.clientId) {
        clientSelect.value = quote.clientId;
        await onRepairQuoteClientChange();

        // Restore linked order after orders are loaded
        if (quote.linkedOrderId) {
            const linkedOrderSelect = document.getElementById('repairQuoteLinkedOrder');
            linkedOrderSelect.value = quote.linkedOrderId;
        }
    }

    // Override address if stored
    if (quote.address) {
        document.getElementById('repairQuoteAddress').value = quote.address;
    }

    // Load PACs
    if (quote.pacs && quote.pacs.length > 0) {
        quote.pacs.forEach(pac => {
            addPACToRepairQuote();
            const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacCounter}"]`);

            if (pacCard) {
                // Set PAC basic info
                pacCard.querySelector('.pac-serial').value = pac.serial || '';
                pacCard.querySelector('.pac-model').value = pac.model || '';
                pacCard.querySelector('.pac-notes').value = pac.notes || '';

                // Set warranty status
                if (pac.underWarranty) {
                    pacCard.querySelector('.pac-under-warranty').checked = true;
                }

                // Load services
                pacCard.querySelector('.service-labor').value = pac.services?.labor || 0;
                pacCard.querySelector('.service-refrigerant').value = pac.services?.refrigerant || 0;
                pacCard.querySelector('.service-disposal').value = pac.services?.disposal || 0;

                // Load components
                if (pac.components && pac.components.length > 0) {
                    pac.components.forEach(comp => {
                        addComponentToPACWithRef(pacCounter, comp.ref);

                        // Find the just-added component row and set quantity
                        const componentsList = pacCard.querySelector('.pac-components-list');
                        const lastRow = componentsList.lastElementChild;
                        if (lastRow) {
                            lastRow.querySelector('.component-qty').value = comp.qty || 1;
                            // Trigger calculation
                            const event = new Event('change', { bubbles: true });
                            lastRow.querySelector('.component-qty').dispatchEvent(event);
                        }
                    });
                }

                // Recalculate totals for this PAC
                calculatePACSubtotal(pacCounter);
            }
        });
    }

    calculateRepairQuoteTotal();
}

function populateRepairQuoteClientSelect() {
    const select = document.getElementById('repairQuoteClient');
    if (!select) return;

    const contacts = getContacts();
    const clients = contacts.filter(c => c.type === 'client' || c.type === 'both');

    select.innerHTML = `<option value="">${t('selectContact') || '-- Sélectionner --'}</option>`;
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

async function onRepairQuoteClientChange() {
    const select = document.getElementById('repairQuoteClient');
    const clientId = select.value;
    const linkedOrderSelect = document.getElementById('repairQuoteLinkedOrder');

    // Reset linked order select
    linkedOrderSelect.innerHTML = '<option value="">-- Aucune --</option>';

    if (!clientId) {
        document.getElementById('repairQuoteAddress').value = '';
        return;
    }

    const contacts = getContacts();
    const client = contacts.find(c => c.id === clientId);

    if (client) {
        document.getElementById('repairQuoteAddress').value = client.address || '';
    }

    // Populate linked orders for this client
    try {
        const orders = await storage.getReceivedOrders(500);
        const clientOrders = orders.filter(o => o.clientId === clientId || o.client === client?.name);

        clientOrders.forEach(order => {
            const opt = document.createElement('option');
            opt.value = order.id;
            opt.textContent = `${order.orderNumber} - ${formatDate(order.date)}${order.clientOrderNumber ? ` (${order.clientOrderNumber})` : ''}`;
            opt.dataset.clientOrderNumber = order.clientOrderNumber || '';
            opt.dataset.ticketNumber = order.ticketNumber || '';
            linkedOrderSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading client orders:', e);
    }
}

function onRepairQuoteLinkedOrderChange() {
    const select = document.getElementById('repairQuoteLinkedOrder');
    const selectedOption = select.selectedOptions[0];

    if (!selectedOption || !selectedOption.value) {
        return;
    }

    // Auto-fill client order number
    const clientOrderNumber = selectedOption.dataset.clientOrderNumber;
    if (clientOrderNumber) {
        document.getElementById('repairQuoteClientOrderNum').value = clientOrderNumber;
    }

    // Auto-fill ticket number if available
    const ticketNumber = selectedOption.dataset.ticketNumber;
    if (ticketNumber) {
        document.getElementById('repairQuoteTicketNum').value = ticketNumber;
    }
}

function closeRepairQuoteModal() {
    document.getElementById('repairQuoteModal').style.display = 'none';
    currentRepairQuote = null;
    pacCounter = 0;
}

function addPACToRepairQuote() {
    pacCounter++;
    const pacsList = document.getElementById('repairPACsList');

    const pacCard = document.createElement('div');
    pacCard.className = 'pac-card';
    pacCard.dataset.pacIndex = pacCounter;

    pacCard.innerHTML = `
        <div class="pac-card-header">
            <div class="pac-card-title">
                <span class="pac-card-number">${pacCounter}</span>
                <span>PAC #${pacCounter}</span>
            </div>
            <button type="button" class="btn-remove-pac" onclick="removePACFromQuote(${pacCounter})" title="${t('removePAC')}">
                ✕
            </button>
        </div>
        <div class="pac-card-body">
            <div class="pac-basic-info">
                <div class="form-group">
                    <label>${t('pacSerial')} *</label>
                    <input type="text" class="pac-serial" required placeholder="TX9-2024-001">
                </div>
                <div class="form-group">
                    <label>Sériové číslo Alliance</label>
                    <input type="text" class="pac-serial-alliance" placeholder="Alliance S/N">
                </div>
                <div class="form-group">
                    <label>${t('pacModel')} *</label>
                    <select class="pac-model" required onchange="updateComponentsForPAC(${pacCounter})">
                        <option value="">${t('selectModel')}</option>
                        <option value="TX9">TX9</option>
                        <option value="TH11">TH11</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" class="pac-under-warranty" onchange="onWarrantyChange(${pacCounter})">
                        <span>Pod zárukou (zdarma)</span>
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label>Poznámky k TČ</label>
                <textarea class="pac-notes" rows="2" placeholder="Poznámky, závady, diagnostika..."></textarea>
            </div>

            <div class="pac-components-section">
                <h5>${t('components')}</h5>
                <div class="pac-components-list" data-pac="${pacCounter}">
                    <!-- Component rows will be added here -->
                </div>
                <button type="button" class="btn btn-secondary btn-small btn-add-component" onclick="addComponentToPAC(${pacCounter})">
                    + ${t('addComponent')}
                </button>
            </div>

            <div class="pac-services-section">
                <h5>${t('services')}</h5>
                <div class="services-grid">
                    <div class="form-group">
                        <label>${t('laborHours')}</label>
                        <input type="number" class="service-labor" min="0" step="0.5" value="0" onchange="calculatePACSubtotal(${pacCounter})">
                        <span class="component-price-display">30 EUR/hod</span>
                    </div>
                    <div class="form-group">
                        <label>${t('refrigerantKg')}</label>
                        <input type="number" class="service-refrigerant" min="0" step="0.01" value="0" onchange="calculatePACSubtotal(${pacCounter})">
                        <span class="component-price-display">25 EUR/kg</span>
                    </div>
                    <div class="form-group">
                        <label>${t('disposalKg')}</label>
                        <input type="number" class="service-disposal" min="0" step="0.1" value="0" onchange="calculatePACSubtotal(${pacCounter})">
                        <span class="component-price-display">17 EUR/kg</span>
                    </div>
                </div>
            </div>

            <div class="pac-subtotal">
                <div class="pac-subtotal-label">${t('pacSubtotal')}:</div>
                <div class="pac-subtotal-value" id="pacSubtotal${pacCounter}">0.00 EUR</div>
            </div>
        </div>
    `;

    pacsList.appendChild(pacCard);
    calculateRepairQuoteTotal();
}

function removePACFromQuote(pacIndex) {
    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    if (pacCard && confirm(t('confirmDelete'))) {
        pacCard.remove();
        calculateRepairQuoteTotal();
    }
}

function updateComponentsForPAC(pacIndex) {
    // Suggestion automatique du compresseur principal
    const modelComponentMap = {
        'TX9': 'WHP05100BSV',       // TX9 → Compressor HIGHLY (230 EUR)
        'TH11': 'C-SBS120H38A'      // TH11 → Compressor Sanyo (424 EUR)
    };

    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    if (!pacCard) return;

    const modelSelect = pacCard.querySelector('.pac-model');
    const selectedModel = modelSelect.value;

    if (!selectedModel) {
        calculatePACSubtotal(pacIndex);
        return;
    }

    // Get the suggested component reference for this model
    const suggestedRef = modelComponentMap[selectedModel];

    if (suggestedRef) {
        // Get the component from repair price list
        const repairComponent = getRepairComponent(suggestedRef, selectedModel);

        if (repairComponent) {
            const componentsList = document.querySelector(`.pac-components-list[data-pac="${pacIndex}"]`);

            // Only suggest if no components have been added yet
            if (componentsList.children.length === 0) {
                if (confirm(`Ajouter automatiquement le composant ${repairComponent.name} (${repairComponent.price} EUR)?`)) {
                    // Add the suggested component
                    addComponentToPACWithRef(pacIndex, suggestedRef);
                }
            }
        }
    }

    calculatePACSubtotal(pacIndex);
}

function addComponentToPACWithRef(pacIndex, componentRef) {
    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    if (!pacCard) return;

    const modelSelect = pacCard.querySelector('.pac-model');
    const selectedModel = modelSelect.value;

    // Get repair components for this model
    const repairComponents = getRepairComponentsByModel(selectedModel);
    const component = repairComponents.find(c => c.ref === componentRef);

    if (!component) return;

    const componentsList = document.querySelector(`.pac-components-list[data-pac="${pacIndex}"]`);
    const componentIndex = componentsList.children.length;

    const componentRow = document.createElement('div');
    componentRow.className = 'component-row';
    componentRow.dataset.componentIndex = componentIndex;

    // Build options from repair components for this model
    let optionsHTML = `<option value="">${t('selectComponent')}</option>`;
    repairComponents.forEach(comp => {
        const selected = comp.ref === componentRef ? 'selected' : '';
        optionsHTML += `<option value="${comp.ref}" data-price="${comp.price}" ${selected}>${comp.name} (${comp.price} EUR)</option>`;
    });

    componentRow.innerHTML = `
        <div class="form-group">
            <label>${t('component')}</label>
            <select class="component-select" onchange="updateComponentPrice(${pacIndex}, ${componentIndex})">
                ${optionsHTML}
            </select>
        </div>
        <div class="form-group">
            <label>${t('qty')}</label>
            <input type="number" class="component-qty" min="1" value="1" onchange="calculatePACSubtotal(${pacIndex})">
        </div>
        <div class="form-group">
            <label>${t('pricePerUnit')}</label>
            <input type="number" class="component-price" step="0.01" value="${component.price}" readonly class="input-readonly">
        </div>
        <div class="form-group">
            <label>${t('lineTotal')}</label>
            <input type="number" class="component-total" step="0.01" value="${component.price}" readonly class="input-readonly">
        </div>
        <button type="button" class="btn-remove-component" onclick="removeComponentFromPAC(${pacIndex}, ${componentIndex})" title="${t('removeComponent')}">✕</button>
    `;

    componentsList.appendChild(componentRow);
    calculatePACSubtotal(pacIndex);
}

function addComponentToPAC(pacIndex) {
    const componentsList = document.querySelector(`.pac-components-list[data-pac="${pacIndex}"]`);
    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    const modelSelect = pacCard.querySelector('.pac-model');
    const selectedModel = modelSelect.value;

    if (!selectedModel) {
        showToast(t('selectModel'), 'warning');
        modelSelect.focus();
        return;
    }

    // Get repair components for selected model
    const components = getRepairComponentsByModel(selectedModel);

    if (!components || components.length === 0) {
        showToast('Aucun composant disponible pour ce modèle', 'warning');
        return;
    }

    const componentIndex = componentsList.children.length;
    const componentRow = document.createElement('div');
    componentRow.className = 'component-row';
    componentRow.dataset.componentIndex = componentIndex;

    // Build options from repair price list
    let optionsHTML = `<option value="">${t('selectComponent')}</option>`;
    components.forEach(comp => {
        optionsHTML += `<option value="${comp.ref}" data-price="${comp.price}">${comp.name} (${comp.price} EUR)</option>`;
    });

    componentRow.innerHTML = `
        <div class="form-group">
            <label>${t('component')}</label>
            <select class="component-select" onchange="updateComponentPrice(${pacIndex}, ${componentIndex})">
                ${optionsHTML}
            </select>
        </div>
        <div class="form-group">
            <label>${t('qty')}</label>
            <input type="number" class="component-qty" min="1" value="1" onchange="calculatePACSubtotal(${pacIndex})">
        </div>
        <div class="form-group">
            <label>${t('pricePerUnit')}</label>
            <input type="number" class="component-price" step="0.01" value="0" readonly class="input-readonly">
        </div>
        <div class="form-group">
            <label>${t('lineTotal')}</label>
            <input type="number" class="component-total" step="0.01" value="0" readonly class="input-readonly">
        </div>
        <button type="button" class="btn-remove-component" onclick="removeComponentFromPAC(${pacIndex}, ${componentIndex})" title="${t('removeComponent')}">
            ✕
        </button>
    `;

    componentsList.appendChild(componentRow);
}

function removeComponentFromPAC(pacIndex, componentIndex) {
    const componentsList = document.querySelector(`.pac-components-list[data-pac="${pacIndex}"]`);
    const componentRow = componentsList.querySelector(`[data-component-index="${componentIndex}"]`);
    if (componentRow) {
        componentRow.remove();
        calculatePACSubtotal(pacIndex);
    }
}

function updateComponentPrice(pacIndex, componentIndex) {
    const componentsList = document.querySelector(`.pac-components-list[data-pac="${pacIndex}"]`);
    const componentRow = componentsList.querySelector(`[data-component-index="${componentIndex}"]`);
    const select = componentRow.querySelector('.component-select');
    const selectedOption = select.options[select.selectedIndex];
    const price = parseFloat(selectedOption.dataset.price) || 0;

    componentRow.querySelector('.component-price').value = price.toFixed(2);
    calculatePACSubtotal(pacIndex);
}

function calculatePACSubtotal(pacIndex) {
    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    if (!pacCard) return;

    // Check if under warranty
    const underWarranty = pacCard.querySelector('.pac-under-warranty').checked;

    let subtotal = 0;

    // ALWAYS calculate components total (even under warranty, to show what was done)
    const componentsList = pacCard.querySelector('.pac-components-list');
    componentsList.querySelectorAll('.component-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.component-qty').value) || 0;
        const price = parseFloat(row.querySelector('.component-price').value) || 0;
        const total = qty * price;
        row.querySelector('.component-total').value = total.toFixed(2);
        subtotal += total;
    });

    // ALWAYS calculate services total (even under warranty, to show what was done)
    const labor = parseFloat(pacCard.querySelector('.service-labor').value) || 0;
    const refrigerant = parseFloat(pacCard.querySelector('.service-refrigerant').value) || 0;
    const disposal = parseFloat(pacCard.querySelector('.service-disposal').value) || 0;

    const serviceRates = getServiceRates();
    subtotal += labor * serviceRates.labor.price;
    subtotal += refrigerant * serviceRates.refrigerantR134a.price;
    subtotal += disposal * serviceRates.disposal.price;

    // Update PAC subtotal display
    const subtotalElement = document.getElementById(`pacSubtotal${pacIndex}`);
    if (subtotalElement) {
        if (underWarranty) {
            // Show calculated total crossed out, then 0.00
            subtotalElement.innerHTML = `<span style="text-decoration: line-through; color: #999;">${subtotal.toFixed(2)} EUR</span> → <strong style="color: #22c55e;">0.00 EUR (pod zárukou)</strong>`;
        } else {
            subtotalElement.textContent = `${subtotal.toFixed(2)} EUR`;
        }
    }

    calculateRepairQuoteTotal();
}

function onWarrantyChange(pacIndex) {
    const pacCard = document.querySelector(`.pac-card[data-pac-index="${pacIndex}"]`);
    if (!pacCard) return;

    // Just recalculate totals - don't disable fields
    // User can still add/edit components and services, but total will be 0
    calculatePACSubtotal(pacIndex);
}

function calculateRepairQuoteTotal() {
    let totalHT = 0;

    // Sum all PAC subtotals (recalculate from data, not from displayed text)
    document.querySelectorAll('.pac-card').forEach(pacCard => {
        const underWarranty = pacCard.querySelector('.pac-under-warranty')?.checked || false;

        if (underWarranty) {
            // Under warranty = 0
            totalHT += 0;
        } else {
            // Calculate PAC subtotal
            let pacSubtotal = 0;

            // Components
            const componentsList = pacCard.querySelector('.pac-components-list');
            componentsList.querySelectorAll('.component-row').forEach(row => {
                const qty = parseFloat(row.querySelector('.component-qty').value) || 0;
                const price = parseFloat(row.querySelector('.component-price').value) || 0;
                pacSubtotal += qty * price;
            });

            // Services
            const labor = parseFloat(pacCard.querySelector('.service-labor').value) || 0;
            const refrigerant = parseFloat(pacCard.querySelector('.service-refrigerant').value) || 0;
            const disposal = parseFloat(pacCard.querySelector('.service-disposal').value) || 0;

            const serviceRates = getServiceRates();
            pacSubtotal += labor * serviceRates.labor.price;
            pacSubtotal += refrigerant * serviceRates.refrigerantR134a.price;
            pacSubtotal += disposal * serviceRates.disposal.price;

            totalHT += pacSubtotal;
        }
    });

    const vatRate = 0.21; // 21% VAT
    const vatAmount = totalHT * vatRate;
    const totalTTC = totalHT + vatAmount;

    document.getElementById('repairQuoteSubtotal').textContent = `${totalHT.toFixed(2)} EUR`;
    document.getElementById('repairQuoteVAT').textContent = `${vatAmount.toFixed(2)} EUR`;
    document.getElementById('repairQuoteTotal').textContent = `${totalTTC.toFixed(2)} EUR`;
}

async function saveRepairQuote() {
    const form = document.getElementById('repairQuoteForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Check if at least one PAC is added
    const pacCards = document.querySelectorAll('.pac-card');
    if (pacCards.length === 0) {
        showToast(t('emptyPACs') || 'Ajoutez au moins une PAC', 'warning');
        return;
    }

    // Get client name from contacts
    const clientSelect = document.getElementById('repairQuoteClient');
    const clientId = clientSelect.value;
    const clientName = clientSelect.options[clientSelect.selectedIndex].textContent;

    // Get linked order info
    const linkedOrderSelect = document.getElementById('repairQuoteLinkedOrder');
    const linkedOrderId = linkedOrderSelect?.value || '';
    const linkedOrderNumber = linkedOrderId ? linkedOrderSelect.options[linkedOrderSelect.selectedIndex]?.textContent.split(' - ')[0] : '';

    // Collect form data
    const quoteData = {
        quoteNumber: document.getElementById('repairQuoteNumber').value,
        ticketNumber: document.getElementById('repairQuoteTicketNum').value,
        clientOrderNumber: document.getElementById('repairQuoteClientOrderNum').value,
        linkedOrderId: linkedOrderId,
        linkedOrderNumber: linkedOrderNumber,
        date: document.getElementById('repairQuoteDate').value,
        clientId: clientId,
        client: clientName,
        address: document.getElementById('repairQuoteAddress').value,
        pacs: [],
        notes: document.getElementById('repairQuoteNotes').value,
        status: 'pending'
    };

    // Collect PAC data
    pacCards.forEach(pacCard => {
        const pacIndex = pacCard.dataset.pacIndex;
        const pacData = {
            serial: pacCard.querySelector('.pac-serial').value,
            serialAlliance: pacCard.querySelector('.pac-serial-alliance')?.value || '',
            model: pacCard.querySelector('.pac-model').value,
            notes: pacCard.querySelector('.pac-notes')?.value || '',
            underWarranty: pacCard.querySelector('.pac-under-warranty')?.checked || false,
            components: [],
            services: {
                labor: parseFloat(pacCard.querySelector('.service-labor').value) || 0,
                refrigerant: parseFloat(pacCard.querySelector('.service-refrigerant').value) || 0,
                disposal: parseFloat(pacCard.querySelector('.service-disposal').value) || 0
            },
            subtotal: parseFloat(document.getElementById(`pacSubtotal${pacIndex}`).textContent.replace(' EUR', '').replace(' (pod zárukou)', '')) || 0
        };

        // Collect components
        const componentsList = pacCard.querySelector('.pac-components-list');
        componentsList.querySelectorAll('.component-row').forEach(row => {
            const select = row.querySelector('.component-select');
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption.value) {
                pacData.components.push({
                    ref: selectedOption.value,
                    name: selectedOption.textContent.split(' (')[0],
                    qty: parseFloat(row.querySelector('.component-qty').value) || 0,
                    priceUnit: parseFloat(row.querySelector('.component-price').value) || 0,
                    total: parseFloat(row.querySelector('.component-total').value) || 0
                });
            }
        });

        quoteData.pacs.push(pacData);
    });

    // Calculate totals
    const subtotalText = document.getElementById('repairQuoteSubtotal').textContent;
    const vatText = document.getElementById('repairQuoteVAT').textContent;
    const totalText = document.getElementById('repairQuoteTotal').textContent;

    quoteData.subtotal = parseFloat(subtotalText.replace(' EUR', '')) || 0;
    quoteData.vat = parseFloat(vatText.replace(' EUR', '')) || 0;
    quoteData.total = parseFloat(totalText.replace(' EUR', '')) || 0;

    // Save to storage
    try {
        if (currentRepairQuote) {
            // Update existing quote via storage API
            quoteData.id = currentRepairQuote;
            quoteData.updatedAt = new Date().toISOString();
            const result = await storage.updateRepairQuote(quoteData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to update repair quote');
            }

            console.log('✅ Repair quote updated:', result);
        } else {
            // Create new - use storage API
            const result = await storage.createRepairQuote(quoteData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to create repair quote');
            }

            console.log('✅ Repair quote created:', result);
        }

        showToast(t('saved'), 'success');
        closeRepairQuoteModal();
        await updateRepairQuotesDisplay();
    } catch (error) {
        console.error('Error saving repair quote:', error);
        showToast(t('error') + ': ' + error.message, 'error');
    }
}

async function updateRepairQuotesDisplay() {
    const quotes = await storage.getRepairQuotes(100);

    // Update summary cards
    const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const pendingCount = quotes.filter(q => q.status === 'pending').length;
    const acceptedCount = quotes.filter(q => q.status === 'accepted').length;

    // Calculate warranty repair statistics
    let warrantyRepairCount = 0;
    let warrantyRepairTotalCost = 0;

    quotes.forEach(quote => {
        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach(pac => {
                if (pac.underWarranty) {
                    warrantyRepairCount++;

                    // Calculate internal cost of warranty repair
                    // Components: use actual stock cost (we need to get from stock)
                    if (pac.components && Array.isArray(pac.components)) {
                        pac.components.forEach(comp => {
                            // Use 70% of repair price as estimated cost (since we don't have direct access to stock cost here)
                            const estimatedCost = comp.priceUnit * 0.7;
                            warrantyRepairTotalCost += comp.qty * estimatedCost;
                        });
                    }

                    // Labor: internal cost ~20 EUR/hour (lower than selling price of 30 EUR/h)
                    if (pac.services && pac.services.labor) {
                        warrantyRepairTotalCost += pac.services.labor * 20;
                    }

                    // Refrigerant: cost ~18 EUR/kg (lower than selling price of 25 EUR/kg)
                    if (pac.services && pac.services.refrigerant) {
                        warrantyRepairTotalCost += pac.services.refrigerant * 18;
                    }

                    // Disposal: cost ~12 EUR/kg (lower than selling price of 17 EUR/kg)
                    if (pac.services && pac.services.disposal) {
                        warrantyRepairTotalCost += pac.services.disposal * 12;
                    }
                }
            });
        }
    });

    const totalCountElement = document.getElementById('repairQuoteTotalCount');
    const totalValueElement = document.getElementById('repairQuoteValue');
    const pendingElement = document.getElementById('repairQuotePendingCount');
    const acceptedElement = document.getElementById('repairQuoteAcceptedCount');
    const warrantyCountElement = document.getElementById('warrantyRepairCount');
    const warrantyCostElement = document.getElementById('warrantyRepairCost');

    if (totalCountElement) totalCountElement.textContent = quotes.length;
    if (totalValueElement) totalValueElement.textContent = totalValue.toFixed(0);
    if (pendingElement) pendingElement.textContent = pendingCount;
    if (acceptedElement) acceptedElement.textContent = acceptedCount;
    if (warrantyCountElement) warrantyCountElement.textContent = warrantyRepairCount;
    if (warrantyCostElement) warrantyCostElement.textContent = warrantyRepairTotalCost.toFixed(0);

    // Update table
    const tbody = document.getElementById('repairQuotesTableBody');
    if (!tbody) return;

    if (quotes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">${t('noData')}</td></tr>`;
        return;
    }

    tbody.innerHTML = quotes.map(quote => {
        const statusClass = quote.status === 'accepted' ? 'status-confirmed' :
                           quote.status === 'rejected' ? 'status-cancelled' :
                           quote.status === 'invoiced' ? 'status-delivered' : '';

        const pacCount = quote.pacs?.length || 0;

        // Build status display with invoice link if invoiced
        let statusDisplay = '';
        if (quote.status === 'invoiced' && quote.invoiceNumber) {
            statusDisplay = `<span class="status-badge ${statusClass}">✓ ${quote.invoiceNumber}</span>`;
        } else {
            statusDisplay = `<span class="status-badge ${statusClass}">${t('status' + quote.status.charAt(0).toUpperCase() + quote.status.slice(1)) || quote.status}</span>`;
        }

        return `
            <tr>
                <td>${formatDate(quote.date) || '-'}</td>
                <td><strong>${quote.quoteNumber || '-'}</strong>${quote.ticketNumber ? `<br><small style="color:#666;">Ticket: ${quote.ticketNumber}</small>` : ''}</td>
                <td>${quote.client || '-'}</td>
                <td>${pacCount}</td>
                <td>${(parseFloat(quote.subtotal) || 0).toFixed(2)} EUR</td>
                <td>${statusDisplay}</td>
                <td>
                    <button class="btn-icon" onclick="viewRepairQuote('${quote.id}')" title="${t('view')}">👁️</button>
                    ${quote.status !== 'invoiced' ? `<button class="btn-icon" onclick="openRepairQuoteModal('${quote.id}')" title="${t('edit')}">✏️</button>` : ''}
                    ${(quote.status === 'pending' || quote.status === 'sent') ? `<button class="btn-icon" onclick="acceptRepairQuote('${quote.id}')" title="${t('accept')}" style="background:#22c55e;color:white;">✓</button>` : ''}
                    ${quote.status === 'invoiced' && quote.invoiceNumber ? `<button class="btn-icon" onclick="viewInvoice('${quote.invoiceNumber}')" title="Voir facture ${quote.invoiceNumber}">🧾</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function getServiceRates() {
    // Return service rates from REPAIR_PRICE_LIST in data.js
    if (typeof REPAIR_PRICE_LIST !== 'undefined' && REPAIR_PRICE_LIST.services) {
        return REPAIR_PRICE_LIST.services;
    }
    // Fallback to default rates if REPAIR_PRICE_LIST is not loaded
    return {
        labor: { price: 30, unit: 'EUR/hod', label: 'Main d\'œuvre' },
        refrigerantR134a: { price: 25, unit: 'EUR/kg', label: 'Réfrigérant R134a' },
        disposal: { price: 17, unit: 'EUR/kg', label: 'Élimination réfrigérant' }
    };
}

async function viewRepairQuote(quoteId) {
    const quotes = await storage.getRepairQuotes(100);
    const quote = quotes.find(q => q.id === quoteId);

    if (!quote) {
        showToast(t('error'), 'error');
        return;
    }

    currentRepairQuotePreview = quoteId;
    showRepairQuotePreview(quote);
}

function showRepairQuotePreview(quote) {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };
    const serviceRates = getServiceRates();

    // Build PACs table
    let pacsTableHtml = '';
    let pacNumber = 1;

    // Safety check for pacs array
    const pacs = quote.pacs || [];
    if (pacs.length === 0) {
        pacsTableHtml = '<tr><td colspan="5" class="text-center text-muted">Žádné PAC</td></tr>';
    }

    pacs.forEach(pac => {
        // PAC header
        const warrantyBadge = pac.underWarranty ? ' <span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; margin-left: 8px;">POD ZÁRUKOU - ZDARMA</span>' : '';
        const allianceSerial = pac.serialAlliance ? ` | Alliance S/N: ${pac.serialAlliance}` : '';
        pacsTableHtml += `
            <tr class="pac-separator">
                <td colspan="5"><strong>PAC #${pacNumber} - ${pac.model} (S/N: ${pac.serial}${allianceSerial})</strong>${warrantyBadge}</td>
            </tr>
        `;

        // Add notes if present
        if (pac.notes) {
            pacsTableHtml += `
                <tr class="pac-notes-row">
                    <td colspan="5" style="background: #f3f4f6; padding: 8px; font-size: 0.9em; border-left: 3px solid #3b82f6;">
                        <strong>Poznámky:</strong> ${pac.notes.replace(/\n/g, '<br>')}
                    </td>
                </tr>
            `;
        }

        // Column headers after notes
        pacsTableHtml += `
            <tr style="background: #e5e7eb; font-weight: bold; font-size: 0.9em;">
                <th style="text-align:left; padding: 6px;">${t('designation')}</th>
                <th style="text-align:left; padding: 6px;">${t('reference')}</th>
                <th style="text-align:center; padding: 6px;">${t('qty')}</th>
                <th style="text-align:right; padding: 6px;">${t('pricePerUnit')}</th>
                <th style="text-align:right; padding: 6px;">${t('total')}</th>
            </tr>
        `;

        // Components (show even if under warranty)
        if (pac.components && pac.components.length > 0) {
            pac.components.forEach(comp => {
                pacsTableHtml += `
                    <tr>
                        <td>${comp.name}</td>
                        <td>${comp.ref}</td>
                        <td style="text-align:center">${comp.qty}</td>
                        <td style="text-align:right">${comp.priceUnit.toFixed(2)} EUR</td>
                        <td style="text-align:right">${comp.total.toFixed(2)} EUR</td>
                    </tr>
                `;
            });
        }

        // Services (show even if under warranty)
        const services = pac.services || {};
        if (services.labor > 0) {
            pacsTableHtml += `
                <tr>
                    <td>${t('laborHours')}</td>
                    <td>SERVICE</td>
                    <td style="text-align:center">${services.labor} h</td>
                    <td style="text-align:right">${serviceRates.labor.price} EUR/h</td>
                    <td style="text-align:right">${(services.labor * serviceRates.labor.price).toFixed(2)} EUR</td>
                </tr>
            `;
        }

        if (services.refrigerant > 0) {
            pacsTableHtml += `
                <tr>
                    <td>${t('refrigerantKg')}</td>
                    <td>R134a</td>
                    <td style="text-align:center">${services.refrigerant.toFixed(2)} kg</td>
                    <td style="text-align:right">${serviceRates.refrigerantR134a.price} EUR/kg</td>
                    <td style="text-align:right">${(services.refrigerant * serviceRates.refrigerantR134a.price).toFixed(2)} EUR</td>
                </tr>
            `;
        }

        if (services.disposal > 0) {
            pacsTableHtml += `
                <tr>
                    <td>${t('disposalKg')}</td>
                    <td>SERVICE</td>
                    <td style="text-align:center">${services.disposal} kg</td>
                    <td style="text-align:right">${serviceRates.disposal.price} EUR/kg</td>
                    <td style="text-align:right">${(services.disposal * serviceRates.disposal.price).toFixed(2)} EUR</td>
                </tr>
            `;
        }

        // PAC subtotal (show crossed-out price if under warranty)
        if (pac.underWarranty) {
            // Calculate what the total would be without warranty
            let calculatedTotal = 0;
            if (pac.components) {
                calculatedTotal += pac.components.reduce((sum, comp) => sum + comp.total, 0);
            }
            calculatedTotal += (pac.services.labor || 0) * serviceRates.labor.price;
            calculatedTotal += (pac.services.refrigerant || 0) * serviceRates.refrigerantR134a.price;
            calculatedTotal += (pac.services.disposal || 0) * serviceRates.disposal.price;

            pacsTableHtml += `
                <tr class="pac-subtotal">
                    <td colspan="4" style="text-align:right"><strong>${t('pacSubtotal')}:</strong></td>
                    <td style="text-align:right">
                        <span style="text-decoration: line-through; color: #999;">${calculatedTotal.toFixed(2)} EUR</span>
                        → <strong style="color: #22c55e;">0.00 EUR</strong>
                    </td>
                </tr>
            `;
        } else {
            pacsTableHtml += `
                <tr class="pac-subtotal">
                    <td colspan="4" style="text-align:right"><strong>${t('pacSubtotal')}:</strong></td>
                    <td style="text-align:right"><strong>${(parseFloat(pac.subtotal) || 0).toFixed(2)} EUR</strong></td>
                </tr>
            `;
        }

        pacNumber++;
    });

    const previewHtml = `
        <div class="delivery-note">
            <div class="dn-header">
                <div class="dn-company">
                    <h2>${config.COMPANY.name}</h2>
                    <p>${config.COMPANY.address}</p>
                </div>
                <div class="dn-info">
                    <h1>${quote.quoteNumber}</h1>
                    <p>${t('date')}: ${formatDate(quote.date)}</p>
                    ${quote.ticketNumber ? `<p style="color: #10b981; font-weight: bold;">${t('ticketNumber')}: ${quote.ticketNumber}</p>` : ''}
                    ${quote.clientOrderNumber ? `<p style="color: #0066cc; font-weight: bold;">${t('clientOrderNum')}: ${quote.clientOrderNumber}</p>` : ''}
                </div>
            </div>

            <h2 class="dn-title">${t('repairQuotesTitle')}</h2>

            <div class="dn-addresses">
                <div class="dn-address">
                    <h4>${t('sender')}</h4>
                    <div class="dn-address-box">
                        <strong>${config.COMPANY.name}</strong><br>
                        ${config.COMPANY.address}
                    </div>
                </div>
                <div class="dn-address">
                    <h4>${t('client')}</h4>
                    <div class="dn-address-box">
                        <strong>${quote.client}</strong><br>
                        ${quote.address || ''}
                    </div>
                </div>
            </div>

            <table class="dn-table">
                <tbody>
                    ${pacsTableHtml}
                </tbody>
            </table>

            <div class="dn-totals">
                <div class="dn-total-row">
                    <span>${t('subtotalHT')}:</span>
                    <span>${(parseFloat(quote.subtotal) || 0).toFixed(2)} EUR</span>
                </div>
                <div class="dn-total-row">
                    <span>${t('vatAmount')} (21%):</span>
                    <span>${(parseFloat(quote.vat || quote.vatAmount) || 0).toFixed(2)} EUR</span>
                </div>
                <div class="dn-total-row dn-total-main">
                    <span>${t('totalTTC')}:</span>
                    <span>${(parseFloat(quote.total) || 0).toFixed(2)} EUR</span>
                </div>
            </div>

            ${quote.notes ? `<div class="dn-notes"><strong>${t('notes')}:</strong><br>${quote.notes}</div>` : ''}
        </div>
    `;

    document.getElementById('repairQuotePreview').innerHTML = previewHtml;
    const modal = document.getElementById('repairQuotePreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active'); // Enable print CSS

    // Reset scroll to top when opening preview
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal-content');
        const previewDiv = document.getElementById('repairQuotePreview');
        if (modalContent) modalContent.scrollTop = 0;
        if (previewDiv) previewDiv.scrollTop = 0;
    }, 50);
}

function closeRepairQuotePreviewModal() {
    const modal = document.getElementById('repairQuotePreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    currentRepairQuotePreview = null;
}

async function printRepairQuote() {
    const originalTitle = document.title;
    const quotes = await storage.getRepairQuotes(100);
    const quote = quotes.find(q => q.id === currentRepairQuotePreview);
    document.title = quote?.quoteNumber || 'Devis';

    // Force scroll to top and remove scroll constraints
    const modal = document.getElementById('repairQuotePreviewModal');
    const modalContent = modal?.querySelector('.modal-content');
    const previewDiv = document.getElementById('repairQuotePreview');

    // Save original styles
    const originalModalStyles = modalContent ? {
        overflow: modalContent.style.overflow,
        maxHeight: modalContent.style.maxHeight
    } : null;
    const originalPreviewStyles = previewDiv ? {
        overflow: previewDiv.style.overflow,
        maxHeight: previewDiv.style.maxHeight
    } : null;

    // Reset scroll and remove constraints
    if (modalContent) {
        modalContent.scrollTop = 0;
        modalContent.style.overflow = 'visible';
        modalContent.style.maxHeight = 'none';
    }
    if (previewDiv) {
        previewDiv.scrollTop = 0;
        previewDiv.style.overflow = 'visible';
        previewDiv.style.maxHeight = 'none';
    }

    // Wait for changes to apply, then print
    setTimeout(() => {
        window.print();

        // Restore original styles after print
        setTimeout(() => {
            document.title = originalTitle;
            if (modalContent && originalModalStyles) {
                modalContent.style.overflow = originalModalStyles.overflow;
                modalContent.style.maxHeight = originalModalStyles.maxHeight;
            }
            if (previewDiv && originalPreviewStyles) {
                previewDiv.style.overflow = originalPreviewStyles.overflow;
                previewDiv.style.maxHeight = originalPreviewStyles.maxHeight;
            }
        }, 500);
    }, 100);
}

async function convertRepairQuoteToInvoice(quoteId) {
    try {
        // Get repair quote data
        const quotes = await storage.getRepairQuotes(100);
        const quote = quotes.find(q => q.id === quoteId);

        if (!quote) {
            showToast(t('error') + ': Devis non trouvé', 'error');
            return;
        }

        console.log('Converting repair quote to invoice:', quote);

        // Get client info
        let clientName = quote.client || '';
        let clientAddress = quote.address || '';
        let clientIco = '';
        let clientDic = '';

        if (quote.clientId) {
            const contacts = await storage.getContacts();
            const contact = contacts.find(c => c.id === quote.clientId);
            if (contact) {
                clientName = contact.name || clientName;
                clientAddress = contact.address || clientAddress;
                clientIco = contact.ico || '';
                clientDic = contact.dic || '';
            }
        }

        // Extract components for stock deduction
        const componentsForDeduction = [];
        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach(pac => {
                if (pac.components && Array.isArray(pac.components)) {
                    pac.components.forEach(comp => {
                        if (comp.qty > 0 && comp.ref) {
                            componentsForDeduction.push({
                                ref: comp.ref,
                                name: comp.name || comp.ref,
                                qty: comp.qty
                            });
                        }
                    });
                }
            });
        }

        // Store for use after invoice is saved (using window object for global access)
        window.currentRepairQuoteForStockDeduction = {
            quoteId: quote.id,
            quoteNumber: quote.quoteNumber,
            client: clientName || quote.clientId || 'Client',
            components: componentsForDeduction
        };
        console.log('Stored repair quote components for stock deduction:', window.currentRepairQuoteForStockDeduction);

        // Close preview modal
        closeRepairQuotePreviewModal();

        // Open invoice modal
        await openFreeInvoiceModal();

        // Note: Variable symbol is set automatically from invoice number in openFreeInvoiceModal
        // Don't override it with client order number - that goes in invClientOrderNum field

        // Populate client - invoice select uses client ID as value
        const clientSelect = document.getElementById('invClient');
        if (clientSelect && quote.clientId) {
            // Find option by client ID
            const options = Array.from(clientSelect.options);
            const matchingOption = options.find(opt => opt.value === quote.clientId);
            if (matchingOption) {
                clientSelect.value = quote.clientId;
                console.log('Client set via ID:', quote.clientId);
            } else {
                console.warn('Client ID not found in options:', quote.clientId);
            }
            // Trigger change event to load address
            const event = new Event('change', { bubbles: true });
            clientSelect.dispatchEvent(event);
        }

        // Also set client info fields directly as fallback
        if (clientAddress) {
            document.getElementById('invClientAddress').value = clientAddress;
        }
        if (clientIco) {
            document.getElementById('invClientIco').value = clientIco;
        }
        if (clientDic) {
            document.getElementById('invClientDic').value = clientDic;
        }

        // Clear default items
        document.getElementById('invItems').innerHTML = '';

        // Build PAC info for notes
        const pacInfoLines = [];

        console.log('Quote PACs for invoice:', quote.pacs);

        // Add items from repair quote
        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach((pac, index) => {
                console.log(`PAC ${index + 1}:`, pac);

                // Add PAC header row
                const allianceSerial = pac.serialAlliance ? ` | Alliance S/N: ${pac.serialAlliance}` : '';
                const pacHeader = `PAC #${index + 1} - ${pac.model} (S/N: ${pac.serial || 'N/A'}${allianceSerial})`;
                addInvoicePacHeaderRow(pacHeader);

                // Store PAC info for notes as well
                pacInfoLines.push(pacHeader);

                // Add components - use total if priceUnit is not set
                if (pac.components && Array.isArray(pac.components)) {
                    pac.components.forEach(comp => {
                        console.log('Component:', comp);
                        const qty = parseFloat(comp.qty) || 0;
                        const price = parseFloat(comp.priceUnit) || parseFloat(comp.price) || (comp.total ? comp.total / qty : 0);
                        if (qty > 0) {
                            addInvoiceItemRow(comp.name || comp.ref, qty, price);
                        }
                    });
                }

                // Add services
                const serviceRates = getServiceRates();
                if (pac.services) {
                    console.log('Services:', pac.services);
                    if (pac.services.labor > 0) {
                        addInvoiceItemRow(`Main d'œuvre`, pac.services.labor, serviceRates.labor.price);
                    }
                    if (pac.services.refrigerant > 0) {
                        addInvoiceItemRow(`Fluide frigorigène`, pac.services.refrigerant, serviceRates.refrigerantR134a.price);
                    }
                    if (pac.services.disposal > 0) {
                        addInvoiceItemRow(`Élimination déchets`, pac.services.disposal, serviceRates.disposal.price);
                    }
                }
            });
        } else {
            console.warn('No PACs found in quote or pacs is not an array');
        }

        // If no items were added, add at least one empty row
        if (document.getElementById('invItems').children.length === 0) {
            console.warn('No invoice items were added, adding default empty row');
            addInvoiceItemRow();
        }

        // Set currency to EUR (repair quotes are in EUR)
        const currencySelect = document.getElementById('invCurrency');
        if (currencySelect) {
            currencySelect.value = 'EUR';
            const event = new Event('change', { bubbles: true });
            currencySelect.dispatchEvent(event);
        }

        // Calculate total
        calculateInvoiceTotal();

        // Build notes with all info
        const notesField = document.getElementById('invNotes');
        if (notesField) {
            let notes = `Devis réparation: ${quote.quoteNumber}`;
            if (quote.ticketNumber) {
                notes += `\nTicket: ${quote.ticketNumber}`;
            }
            if (quote.clientOrderNumber) {
                notes += `\nCommande client: ${quote.clientOrderNumber}`;
            }
            if (pacInfoLines.length > 0) {
                notes += '\n\n' + pacInfoLines.join('\n');
            }
            if (quote.notes) {
                notes += '\n\n' + quote.notes;
            }
            notesField.value = notes.trim();
        }

        // Set client order number field if it exists
        const clientOrderField = document.getElementById('invClientOrderNum');
        if (clientOrderField && quote.clientOrderNumber) {
            clientOrderField.value = quote.clientOrderNumber;
        }

        // Set linked order if exists
        const linkedOrderField = document.getElementById('invLinkedOrder');
        if (linkedOrderField && quote.linkedOrderId) {
            linkedOrderField.value = quote.linkedOrderId;
        }

        // Show invoice modal
        document.getElementById('invoiceModal').classList.add('active');

        showToast(t('repairQuoteConverted') || 'Devis converti en facture', 'success');
    } catch (error) {
        console.error('Error converting repair quote to invoice:', error);
        showToast('Erreur lors de la conversion: ' + error.message, 'error');
    }
}

async function acceptRepairQuote(quoteId) {
    if (!confirm(t('confirmAcceptQuote') || 'Accepter ce devis et créer une facture automatiquement?\n\nLes composants seront déduits du stock.')) {
        return;
    }

    try {
        // Get repair quote
        const quotes = await storage.getRepairQuotes(100);
        const quote = quotes.find(q => q.id === quoteId);

        if (!quote) {
            showToast(t('error') + ': Devis non trouvé', 'error');
            return;
        }

        // Get correct client info from contacts
        let clientName = quote.client || quote.clientName || 'Client';
        let clientAddress = quote.address || '';
        let clientIco = '';
        let clientDic = '';

        if (quote.clientId) {
            const contacts = await storage.getContacts();
            const contact = contacts.find(c => c.id === quote.clientId);
            if (contact) {
                clientName = contact.name || clientName;
                clientAddress = contact.address || clientAddress;
                clientIco = contact.ico || '';
                clientDic = contact.dic || '';
            }
        }

        // Don't update quote status yet - will update after invoice is created
        console.log('🔧 Creating invoice from repair quote...');

        // Extract components for stock deduction (exclude PAC headers)
        const componentsForDeduction = [];
        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach(pac => {
                if (pac.components && Array.isArray(pac.components)) {
                    pac.components.forEach(comp => {
                        if (comp.qty > 0 && comp.ref) {
                            componentsForDeduction.push({
                                ref: comp.ref,
                                name: comp.name || comp.ref,
                                qty: comp.qty
                            });
                        }
                    });
                }
            });
        }

        // Generate invoice number using FV format
        const invoices = await storage.getInvoices(1000);
        const year = new Date().getFullYear();

        // Find max number from FV invoices for this year
        let maxNum = 0;
        invoices.forEach(inv => {
            if (inv.number) {
                const match = String(inv.number).match(/FV(\d{4})(\d{3})/);
                if (match && parseInt(match[1]) === year) {
                    const num = parseInt(match[2]);
                    if (num > maxNum) maxNum = num;
                }
            }
        });

        const nextNum = maxNum + 1;
        const invoiceNumber = `FV${year}${String(nextNum).padStart(3, '0')}`;

        // Build invoice items
        const serviceRates = getServiceRates();
        const items = [];

        // Track PAC info for notes
        const pacInfoLines = [];

        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach((pac, index) => {
                const pacInfo = `PAC ${index + 1}: ${pac.model} - S/N ${pac.serial || 'N/A'}${pac.serialAlliance ? ` (Alliance: ${pac.serialAlliance})` : ''}`;
                pacInfoLines.push(pacInfo);

                // Add components
                if (pac.components && Array.isArray(pac.components)) {
                    pac.components.forEach(comp => {
                        if (comp.qty > 0 && comp.priceUnit > 0) {
                            items.push({
                                name: comp.name || comp.ref,
                                description: comp.name || comp.ref,
                                qty: comp.qty,
                                price: comp.priceUnit,
                                pricePerUnit: comp.priceUnit
                            });
                        }
                    });
                }

                // Add services with correct quantities and unit prices
                if (pac.services) {
                    if (pac.services.labor > 0) {
                        items.push({
                            name: `Main d'œuvre`,
                            description: `Main d'œuvre`,
                            qty: pac.services.labor,  // Hours
                            price: serviceRates.labor.price,  // EUR/hour
                            pricePerUnit: serviceRates.labor.price
                        });
                    }
                    if (pac.services.refrigerant > 0) {
                        items.push({
                            name: `Fluide frigorigène`,
                            description: `Fluide frigorigène`,
                            qty: pac.services.refrigerant,  // kg
                            price: serviceRates.refrigerantR134a.price,  // EUR/kg
                            pricePerUnit: serviceRates.refrigerantR134a.price
                        });
                    }
                    if (pac.services.disposal > 0) {
                        items.push({
                            name: `Élimination déchets`,
                            description: `Élimination déchets`,
                            qty: pac.services.disposal,  // kg
                            price: serviceRates.disposal.price,  // EUR/kg
                            pricePerUnit: serviceRates.disposal.price
                        });
                    }
                }
            });
        }

        // Build notes with PAC info, ticket, and client order
        let invoiceNotes = `Devis réparation: ${quote.quoteNumber}`;
        if (quote.ticketNumber) {
            invoiceNotes += `\nTicket: ${quote.ticketNumber}`;
        }
        if (quote.clientOrderNumber) {
            invoiceNotes += `\nCommande client: ${quote.clientOrderNumber}`;
        }
        if (pacInfoLines.length > 0) {
            invoiceNotes += '\n\n' + pacInfoLines.join('\n');
        }
        if (quote.notes) {
            invoiceNotes += '\n\n' + quote.notes;
        }

        // Get local dates (avoid timezone issues)
        const now = new Date();
        const invoiceDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dueDateTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const dueDate = `${dueDateTime.getFullYear()}-${String(dueDateTime.getMonth() + 1).padStart(2, '0')}-${String(dueDateTime.getDate()).padStart(2, '0')}`;

        // Get CNB exchange rate for EUR
        let exchangeRateValue = null;
        try {
            const rateInfo = await storage.getExchangeRateForDate('EUR', invoiceDate);
            if (rateInfo && rateInfo.rate) {
                exchangeRateValue = rateInfo.rate;
                console.log(`✅ CNB rate for ${invoiceDate}: ${exchangeRateValue.toFixed(3)}`);
            }
        } catch (e) {
            console.warn('Failed to fetch CNB rate:', e);
        }

        // Create invoice object
        const subtotal = parseFloat(quote.subtotal) || 0;

        // Use client order number as varSymbol if available, otherwise use invoice number
        const varSymbol = quote.clientOrderNumber || invoiceNumber.replace(/\D/g, '');

        const invoice = {
            number: invoiceNumber,
            varSymbol: varSymbol,
            date: invoiceDate,
            taxDate: invoiceDate,
            dueDate: dueDate,
            clientId: quote.clientId,
            client: clientName,
            clientAddress: clientAddress,
            clientIco: clientIco,
            clientDic: clientDic,
            items: items,
            currency: 'EUR',
            exchangeRate: exchangeRateValue,
            subtotal: subtotal,
            vatRate: 21,
            vat: subtotal * 0.21,
            total: subtotal * 1.21,
            notes: invoiceNotes.trim(),
            paid: false,
            clientOrderNumber: quote.clientOrderNumber || '',
            linkedOrder: quote.linkedOrderId || '',
            linkedOrderNumber: quote.linkedOrderNumber || ''
        };

        // Save invoice
        await storage.createInvoice(invoice);
        console.log('✅ Invoice created:', invoiceNumber);

        // Update quote status to invoiced and store invoice number
        quote.status = 'invoiced';
        quote.invoiceNumber = invoiceNumber;
        quote.invoiceDate = invoiceDate;
        await storage.saveRepairQuotes(quotes);
        console.log('✅ Quote status updated to invoiced');

        // Deduct stock for components
        if (componentsForDeduction.length > 0 && storage.getMode() === 'googlesheets') {
            try {
                console.log('🔧 Deducting stock for repair quote acceptance...', componentsForDeduction);
                const deductResult = await storage.deductStockForComponents(
                    componentsForDeduction,
                    invoice.number,
                    invoice.client,
                    invoiceDate
                );

                if (deductResult.success) {
                    console.log('✅ Stock deducted:', deductResult.deductedComponents, 'components');
                } else {
                    console.error('❌ Stock deduction failed:', deductResult.errors);
                    const errorMsg = deductResult.errors.map(e => `${e.ref}: ${e.error}`).join('\n');
                    showToast('Facture créée mais erreur déduction stock:\n' + errorMsg, 'warning');
                }
            } catch (e) {
                console.error('❌ Failed to deduct stock:', e);
                showToast('Facture créée mais erreur lors de la déduction du stock: ' + e.message, 'warning');
            }
        }

        // Update displays
        await updateRepairQuotesDisplay();
        await updateInvoicesDisplay();

        showToast(`✅ Faktura ${invoiceNumber} vytvořena z nabídky ${quote.quoteNumber}`, 'success');

    } catch (error) {
        console.error('Error accepting repair quote:', error);
        showToast('Chyba při přijetí: ' + error.message, 'error');
    }
}

async function deleteRepairQuote(quoteId) {
    try {
        await storage.deleteRepairQuote(quoteId);
        await updateRepairQuotesDisplay();
        showToast(t('deleted') || 'Supprimé', 'success');
    } catch (error) {
        console.error('Error deleting repair quote:', error);
        showToast('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

async function sendRepairQuoteByEmail() {
    if (!currentRepairQuotePreview) {
        showToast(t('error') || 'Erreur', 'error');
        return;
    }

    try {
        // Get the quote
        const quotes = await storage.getRepairQuotes(100);
        const quote = quotes.find(q => q.id === currentRepairQuotePreview);

        if (!quote) {
            showToast(t('error') + ': Devis non trouvé', 'error');
            return;
        }

        // Get client email
        const contacts = await storage.getContacts();
        const client = contacts.find(c => c.id === quote.clientId);

        if (!client || !client.email) {
            showToast('Email du client non trouvé. Veuillez ajouter un email dans les contacts.', 'error');
            return;
        }

        // Confirm send
        if (!confirm(`Envoyer le devis ${quote.quoteNumber} à ${client.email}?`)) {
            return;
        }

        // Ask for CC addresses
        const ccAddresses = prompt(
            `Ajouter des adresses en copie (CC)?\n\nSéparez les adresses par des virgules ou points-virgules.\nExemple: email1@domain.com, email2@domain.com\n\nLaissez vide si pas de copie.`,
            ''
        );

        // Get the quote HTML
        const quoteHtml = document.getElementById('repairQuotePreview').innerHTML;

        // Prepare email data
        const emailData = {
            to: client.email,
            replyTo: 'tomas.karas@hotjet.cz',
            subject: `${currentLang === 'cz' ? 'Nabídka opravy' : 'Devis de réparation'} ${quote.quoteNumber} - ${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            body: currentLang === 'cz' ?
                `Dobrý den,\n\nV příloze naleznete nabídku opravy ${quote.quoteNumber}.\n\nPro odpověď kontaktujte: tomas.karas@hotjet.cz\n\nS pozdravem,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}` :
                `Bonjour,\n\nVous trouverez en pièce jointe notre devis de réparation ${quote.quoteNumber}.\n\nPour toute réponse, contactez: tomas.karas@hotjet.cz\n\nCordialement,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            htmlContent: quoteHtml,
            documentNumber: quote.quoteNumber,
            documentType: currentLang === 'cz' ? 'Nabídka opravy' : 'Devis de réparation'
        };

        // Add CC if provided
        if (ccAddresses && ccAddresses.trim()) {
            emailData.cc = ccAddresses.trim();
        }

        // Send via Google Apps Script
        const result = await storage.apiPost('sendEmail', emailData);

        if (result && result.success) {
            showToast(`${t('emailSent')} - ${client.email}`, 'success');

            // Update quote status to 'sent' if it was 'pending'
            if (quote.status === 'pending') {
                await storage.updateRepairQuoteStatus(quote.id, 'sent');
                await updateRepairQuotesDisplay();
            }
        } else {
            throw new Error(result?.error || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Error sending repair quote:', error);
        showToast(t('emailError') + ': ' + error.message, 'error');
    }
}

// Helper function to find refrigerant component reference in stock
function findRefrigerantRef() {
    if (!currentStock) return null;
    // Common refrigerant references
    const refrigerantKeywords = ['r134a', 'r410a', 'r32', 'refrigerant', 'frigorigene', 'fluide'];
    for (const [ref, data] of Object.entries(currentStock)) {
        const refLower = ref.toLowerCase();
        const nameLower = (data.name || '').toLowerCase();
        for (const keyword of refrigerantKeywords) {
            if (refLower.includes(keyword) || nameLower.includes(keyword)) {
                return ref;
            }
        }
    }
    return null;
}

// Create delivery note from repair quote
async function createDeliveryFromRepairQuote(quoteId) {
    try {
        const quotes = await storage.getRepairQuotes(100);
        const quote = quotes.find(q => q.id === quoteId);

        if (!quote) {
            showToast('Devis non trouvé', 'error');
            return;
        }

        // Get client info
        let clientName = quote.client || '';
        let clientAddress = quote.address || '';

        if (quote.clientId) {
            const contacts = await storage.getContacts();
            const contact = contacts.find(c => c.id === quote.clientId);
            if (contact) {
                clientName = contact.name || clientName;
                clientAddress = contact.address || clientAddress;
            }
        }

        // Close preview modal
        closeRepairQuotePreviewModal();

        // Navigate to delivery tab (sorties)
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelector('.nav-btn[data-tab="sorties"]')?.classList.add('active');
        document.getElementById('tab-sorties')?.classList.add('active');

        // Wait for tab to be visible
        await new Promise(resolve => setTimeout(resolve, 100));

        // Ensure client selects are populated
        populateClientSelects();

        // Set today's date
        document.getElementById('deliveryDate').valueAsDate = new Date();

        // Fill client info - delivery client select uses name as value, not ID
        const clientSelect = document.getElementById('deliveryClient');
        if (clientSelect && clientName) {
            // Find option by client name (delivery select uses name as value)
            const options = Array.from(clientSelect.options);
            const matchingOption = options.find(opt => opt.value === clientName || opt.textContent === clientName);
            if (matchingOption) {
                clientSelect.value = matchingOption.value;
                console.log('Client set via matching option:', matchingOption.value);
            } else {
                // Add the client as a new option if not found
                const newOpt = document.createElement('option');
                newOpt.value = clientName;
                newOpt.textContent = clientName;
                newOpt.dataset.address = clientAddress;
                clientSelect.appendChild(newOpt);
                clientSelect.value = clientName;
                console.log('Client added as new option:', clientName);
            }
            const event = new Event('change', { bubbles: true });
            clientSelect.dispatchEvent(event);
        }

        // Store client name as data attribute for fallback
        if (clientSelect) {
            clientSelect.dataset.clientNameFallback = clientName;
        }

        // Fill client order number
        const clientOrderField = document.getElementById('deliveryClientOrderNum');
        if (clientOrderField && quote.clientOrderNumber) {
            clientOrderField.value = quote.clientOrderNumber;
        }

        // Fill address
        const addressField = document.getElementById('deliveryClientAddress');
        if (addressField) {
            addressField.value = clientAddress;
        }

        // Store repair quote data for the delivery note
        // This will be saved with the delivery and displayed in the same format as the quote
        const repairQuoteData = {
            quoteNumber: quote.quoteNumber,
            ticketNumber: quote.ticketNumber,
            pacs: quote.pacs || []
        };

        // Store in a hidden field or data attribute for later use
        const deliveryForm = document.getElementById('tab-sorties');
        if (deliveryForm) {
            deliveryForm.dataset.repairQuoteData = JSON.stringify(repairQuoteData);
        }

        // Ensure stock is loaded before adding components
        if (!currentStock || Object.keys(currentStock).length === 0) {
            console.log('Loading stock data before adding components...');
            try {
                const stockData = await storage.getStockWithValue();
                if (stockData && stockData.components) {
                    currentStock = stockData.components;
                }
            } catch (e) {
                console.warn('Could not load stock:', e);
            }
        }

        // Add components to the components container (for stock deduction)
        const componentsContainer = document.getElementById('deliveryComponentsContainer');
        const customItemsContainer = document.getElementById('deliveryCustomItemsContainer');

        if (componentsContainer) {
            componentsContainer.innerHTML = ''; // Clear existing component items
        }
        if (customItemsContainer) {
            customItemsContainer.innerHTML = ''; // Clear existing custom items
        }

        let componentsAdded = 0;
        let customItemsAdded = 0;

        if (quote.pacs && Array.isArray(quote.pacs)) {
            quote.pacs.forEach((pac, pacIndex) => {
                // Add components to COMPONENTS container (will be deducted from stock)
                if (pac.components && Array.isArray(pac.components)) {
                    pac.components.forEach(comp => {
                        if (comp.qty > 0 && comp.ref) {
                            // Use addDeliveryComponentRow for stock deduction (pass name as 3rd param)
                            addDeliveryComponentRow(comp.ref, comp.qty, comp.name || comp.ref);
                            componentsAdded++;
                        }
                    });
                }

                // Add refrigerant as component if it has a ref, otherwise as custom item
                if (pac.services && pac.services.refrigerant > 0) {
                    const refQty = Math.round(pac.services.refrigerant);
                    // Try to find refrigerant component ref (R134a or similar)
                    const refrigerantRef = findRefrigerantRef();
                    if (refrigerantRef) {
                        addDeliveryComponentRow(refrigerantRef, refQty);
                        componentsAdded++;
                    } else {
                        addDeliveryCustomItemRow(`Fluide frigorigène R134a (PAC ${pacIndex + 1})`, refQty);
                        customItemsAdded++;
                    }
                }
            });
        }
        console.log(`Components added for stock deduction: ${componentsAdded}, Custom items: ${customItemsAdded}`);

        // Set notes with PAC info
        const notesField = document.getElementById('deliveryNotes');
        if (notesField) {
            let notes = `Devis: ${quote.quoteNumber}`;
            if (quote.ticketNumber) {
                notes += ` | Ticket: ${quote.ticketNumber}`;
            }
            quote.pacs?.forEach((pac, index) => {
                notes += `\nPAC ${index + 1}: ${pac.model} - S/N ${pac.serial || 'N/A'}`;
            });
            notesField.value = notes;
        }

        showToast('Dodací list předvyplněn z nabídky', 'success');
    } catch (error) {
        console.error('Error creating delivery from repair quote:', error);
        showToast('Chyba: ' + error.message, 'error');
    }
}

// Make functions globally accessible
window.openRepairQuoteModal = openRepairQuoteModal;
window.closeRepairQuoteModal = closeRepairQuoteModal;
window.populateRepairQuoteClientSelect = populateRepairQuoteClientSelect;
window.onRepairQuoteClientChange = onRepairQuoteClientChange;
window.onRepairQuoteLinkedOrderChange = onRepairQuoteLinkedOrderChange;
window.addPACToRepairQuote = addPACToRepairQuote;
window.removePACFromQuote = removePACFromQuote;
window.updateComponentsForPAC = updateComponentsForPAC;
window.addComponentToPAC = addComponentToPAC;
window.removeComponentFromPAC = removeComponentFromPAC;
window.updateComponentPrice = updateComponentPrice;
window.calculatePACSubtotal = calculatePACSubtotal;
window.calculateRepairQuoteTotal = calculateRepairQuoteTotal;
window.saveRepairQuote = saveRepairQuote;
window.updateRepairQuotesDisplay = updateRepairQuotesDisplay;
window.viewRepairQuote = viewRepairQuote;
window.showRepairQuotePreview = showRepairQuotePreview;
window.closeRepairQuotePreviewModal = closeRepairQuotePreviewModal;
window.printRepairQuote = printRepairQuote;
window.convertRepairQuoteToInvoice = convertRepairQuoteToInvoice;
window.createDeliveryFromRepairQuote = createDeliveryFromRepairQuote;
window.acceptRepairQuote = acceptRepairQuote;
window.deleteRepairQuote = deleteRepairQuote;
window.sendRepairQuoteByEmail = sendRepairQuoteByEmail;

// ========================================
//  END REPAIR QUOTES FUNCTIONS
// ========================================

// Function to fix duplicate repair quote numbers
async function fixDuplicateRepairQuoteNumbers() {
    if (!confirm('Voulez-vous renuméroter tous les devis de réparation avec des numéros uniques?\n\nCela corrigera les doublons (DV2026001, DV2026001, DV2026001) en (DV2026001, DV2026002, DV2026003)')) {
        return;
    }

    try {
        console.log('🔧 Fixing duplicate repair quote numbers...');

        // Get all repair quotes
        const quotes = await storage.getRepairQuotes(1000);

        if (!quotes || quotes.length === 0) {
            showToast('Žádné nabídky k opravě', 'info');
            return;
        }

        console.log('Found', quotes.length, 'repair quotes');

        // Sort by creation date (oldest first)
        quotes.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

        // Track numbers used per year
        const usedNumbers = {};
        const updates = [];

        quotes.forEach((quote, index) => {
            const quoteDate = new Date(quote.date || quote.createdAt);
            const year = quoteDate.getFullYear();

            // Initialize year counter if needed
            if (!usedNumbers[year]) {
                usedNumbers[year] = 0;
            }

            // Increment counter for this year
            usedNumbers[year]++;

            // Generate new unique number
            const newNumber = `DV${year}${String(usedNumbers[year]).padStart(3, '0')}`;

            // If number changed, track the update
            if (quote.quoteNumber !== newNumber) {
                console.log(`  Renumbering: ${quote.quoteNumber} → ${newNumber}`);
                updates.push({
                    id: quote.id,
                    oldNumber: quote.quoteNumber,
                    newNumber: newNumber,
                    quote: quote
                });
            }
        });

        if (updates.length === 0) {
            showToast('Aucun doublon trouvé', 'success');
            return;
        }

        console.log(`Found ${updates.length} quotes to renumber`);

        // Update in Google Sheets if in googlesheets mode
        if (storage.getMode() === 'googlesheets') {
            for (const update of updates) {
                // Update quote number
                update.quote.quoteNumber = update.newNumber;

                // Call backend to update (we'll need to add this to Code.gs)
                try {
                    await storage.apiPost('updateRepairQuote', {
                        id: update.id,
                        quoteNumber: update.newNumber,
                        quote: update.quote
                    });
                    console.log(`  ✅ Updated ${update.oldNumber} → ${update.newNumber} in Google Sheets`);
                } catch (error) {
                    console.error(`  ❌ Failed to update ${update.id}:`, error);
                }
            }
        }

        // Update in localStorage
        let localQuotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
        updates.forEach(update => {
            const index = localQuotes.findIndex(q => q.id === update.id);
            if (index >= 0) {
                localQuotes[index].quoteNumber = update.newNumber;
            }
        });
        localStorage.setItem('navalo_repair_quotes', JSON.stringify(localQuotes));

        // Update counter to next number
        const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
        const currentYear = new Date().getFullYear();
        config.next_repair_quote = (usedNumbers[currentYear] || 0) + 1;
        config.year = currentYear;
        localStorage.setItem('navalo_config', JSON.stringify(config));

        console.log(`✅ Fixed ${updates.length} duplicate numbers`);
        console.log(`Next number will be: DV${currentYear}${String(config.next_repair_quote).padStart(3, '0')}`);

        showToast(`${updates.length} nabídek úspěšně přečíslováno`, 'success');

        // Refresh display
        await updateRepairQuotesDisplay();

    } catch (error) {
        console.error('Error fixing duplicate numbers:', error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

window.fixDuplicateRepairQuoteNumbers = fixDuplicateRepairQuoteNumbers;

// Function to clear all local cache and reload from Google Sheets
async function clearLocalCache() {
    // Check for pending sync operations first
    const syncQueue = JSON.parse(localStorage.getItem('navalo_sync_queue') || '[]');
    const pendingSyncs = syncQueue.filter(item => item.status === 'pending' || item.status === 'error');

    if (pendingSyncs.length > 0) {
        const syncWarning = currentLang === 'cz'
            ? `⚠️ VAROVÁNÍ: ${pendingSyncs.length} operací čeká na synchronizaci!\n\nPokud pokračujete, ZTRATÍTE tato data:\n- Nesynchronizované změny\n- Nové objednávky/dodávky\n\nDoporučujeme:\n1. Počkat 30 sekund na dokončení synchronizace\n2. Nebo kliknout na tlačítko sync (↻) pro manuální synchronizaci\n\nOpravdu chcete pokračovat a ZTRATIT tato data?`
            : `⚠️ ATTENTION : ${pendingSyncs.length} opérations en attente de synchronisation !\n\nSi vous continuez, vous PERDREZ ces données :\n- Modifications non synchronisées\n- Nouvelles commandes/livraisons\n\nRecommandation :\n1. Attendre 30 secondes pour la synchronisation\n2. Ou cliquer sur le bouton sync (↻) pour synchroniser manuellement\n\nVoulez-vous vraiment continuer et PERDRE ces données ?`;

        if (!confirm(syncWarning)) {
            showToast(currentLang === 'cz' ? 'Synchronizujte nejprve data' : 'Synchronisez d\'abord vos données', 'warning');
            return;
        }
    }

    const message = currentLang === 'cz'
        ? 'Smazat lokální cache a znovu načíst vše z Google Sheets?\n\nToto vymaže:\n- Všechny faktury\n- Příjemky\n- Objednávky\n- Konfiguraci číslování\n\nData v Google Sheets zůstanou zachována.'
        : 'Effacer le cache local et recharger depuis Google Sheets ?\n\nCeci effacera :\n- Toutes les factures en cache\n- Les réceptions\n- Les commandes\n- La configuration de numérotation\n\nLes données dans Google Sheets seront conservées.';

    if (!confirm(message)) return;

    console.log('🗑️ Clearing all local cache...');

    // List of all navalo localStorage keys to clear (except language preference)
    const keysToRemove = [
        'navalo_invoices',
        'navalo_received_invoices',
        'navalo_receipts',
        'navalo_purchase_orders',
        'navalo_received_orders',
        'navalo_deliveries',
        'navalo_stock',
        'navalo_stock_lots',
        'navalo_history',
        'navalo_contacts',
        'navalo_config',
        'navalo_bom',
        'navalo_pac_stock',
        'navalo_quotes',
        'navalo_adjustments',
        'navalo_sync_queue',
        'navalo_sync_status'
    ];

    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log('  ✓ Removed:', key);
        }
    });

    const toastMsg = currentLang === 'cz' ? 'Cache smazána, načítám z Google Sheets...' : 'Cache effacé, rechargement depuis Google Sheets...';
    showToast(toastMsg, 'info');

    // Reload the page to get fresh data from Google Sheets
    setTimeout(() => {
        location.reload();
    }, 500);
}

window.clearLocalCache = clearLocalCache;

// ========================================
// PREVIEW FUNCTIONS FOR DOCUMENTS
// ========================================

// RECEIVED ORDERS PREVIEW
function showReceivedOrderPreview() {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '', ico: '', dic: '' } };

    // Get form data
    const formData = {
        orderNumber: document.getElementById('recOrdNumber').value,
        clientOrderNumber: document.getElementById('recOrdClientNum').value,
        date: document.getElementById('recOrdDate').value,
        client: document.getElementById('recOrdClient').selectedOptions[0]?.text || '',
        clientAddress: document.getElementById('recOrdAddress').value,
        clientIco: document.getElementById('recOrdClientIco').value,
        clientDic: document.getElementById('recOrdClientDic').value,
        deliveryDate: document.getElementById('recOrdDeliveryDate').value,
        notes: document.getElementById('recOrdNotes').value,
        currency: document.getElementById('recOrdCurrency').value,
        quantities: {},
        customItems: [],
        stockComponents: []
    };

    // Get PAC quantities and prices
    const models = getPacModels();
    let subtotal = 0;
    models.forEach(m => {
        const qtyInput = document.getElementById(`recOrdQty-${m.id}`);
        const priceInput = document.getElementById(`recOrdPrice-${m.id}`);
        const qty = parseInt(qtyInput?.value) || 0;
        const price = parseFloat(priceInput?.value) || 0;
        if (qty > 0) {
            formData.quantities[m.id] = { qty, price };
            subtotal += qty * price;
        }
    });

    // Get custom items
    document.querySelectorAll('#recOrdCustomItems .custom-item-row').forEach(row => {
        const name = row.querySelector('.custom-item-name')?.value;
        const qty = parseFloat(row.querySelector('.custom-item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.custom-item-price')?.value) || 0;
        if (name && qty > 0) {
            formData.customItems.push({ name, qty, price });
            subtotal += qty * price;
        }
    });

    // Get stock components
    document.querySelectorAll('#recOrdStockComponents .stock-comp-row').forEach(row => {
        const select = row.querySelector('.stock-comp-select');
        const ref = select?.value;
        const name = select?.selectedOptions[0]?.text || '';
        const qty = parseFloat(row.querySelector('.stock-comp-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.stock-comp-price')?.value) || 0;
        if (ref && qty > 0) {
            formData.stockComponents.push({ ref, name, qty, price });
            subtotal += qty * price;
        }
    });

    formData.subtotal = subtotal;
    formData.vat = subtotal * 0.21;
    formData.total = subtotal + formData.vat;

    // Generate HTML
    const previewHtml = generateReceivedOrderHTML(formData, config);

    // Display
    document.getElementById('receivedOrderPreview').innerHTML = previewHtml;
    const modal = document.getElementById('receivedOrderPreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function generateReceivedOrderHTML(order, config) {
    const models = getPacModels();

    // Build PAC items
    let pacItemsHtml = '';
    models.forEach(m => {
        const data = order.quantities[m.id];
        if (data && data.qty > 0) {
            const total = data.qty * data.price;
            pacItemsHtml += `
                <tr>
                    <td>${m.fullName}</td>
                    <td class="text-right">${data.qty}</td>
                    <td class="text-right">${formatCurrency(data.price)} ${order.currency}</td>
                    <td class="text-right"><strong>${formatCurrency(total)} ${order.currency}</strong></td>
                </tr>
            `;
        }
    });

    // Build custom items
    let customItemsHtml = '';
    (order.customItems || []).forEach(item => {
        const total = item.qty * item.price;
        customItemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${formatCurrency(item.price)} ${order.currency}</td>
                <td class="text-right"><strong>${formatCurrency(total)} ${order.currency}</strong></td>
            </tr>
        `;
    });

    // Build stock components
    let stockItemsHtml = '';
    (order.stockComponents || []).forEach(item => {
        const total = item.qty * item.price;
        stockItemsHtml += `
            <tr>
                <td>${item.ref} - ${item.name}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${formatCurrency(item.price)} ${order.currency}</td>
                <td class="text-right"><strong>${formatCurrency(total)} ${order.currency}</strong></td>
            </tr>
        `;
    });

    const allItemsHtml = pacItemsHtml + customItemsHtml + stockItemsHtml;

    return `
        <div class="ro-doc">
            <div class="ro-header">
                <div class="ro-company">
                    <h2>${config.COMPANY.name}</h2>
                    <p>${config.COMPANY.address}</p>
                    ${config.COMPANY.ico ? `<p>IČO: ${config.COMPANY.ico}</p>` : ''}
                </div>
                <div class="ro-info">
                    <h1>${t('receivedOrder')}</h1>
                    <p><strong>${t('orderNumber')}:</strong> ${order.orderNumber}</p>
                    <p><strong>${t('date')}:</strong> ${formatDate(order.date)}</p>
                    ${order.clientOrderNumber ? `<p><strong>${t('clientOrderNum')}:</strong> ${order.clientOrderNumber}</p>` : ''}
                </div>
            </div>

            <div class="ro-client">
                <h3>${t('client')}</h3>
                <div class="ro-client-box">
                    <p><strong>${order.client}</strong></p>
                    ${order.clientAddress ? `<p>${order.clientAddress}</p>` : ''}
                    ${order.clientIco ? `<p>IČO: ${order.clientIco}</p>` : ''}
                    ${order.clientDic ? `<p>DIČ: ${order.clientDic}</p>` : ''}
                </div>
            </div>

            <table class="ro-table">
                <thead>
                    <tr>
                        <th>${t('designation')}</th>
                        <th>${t('quantity')}</th>
                        <th>${t('priceUnit')}</th>
                        <th>${t('total')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${allItemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>${t('subtotal')}</strong></td>
                        <td class="text-right"><strong>${formatCurrency(order.subtotal)} ${order.currency}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="3">DPH 21%</td>
                        <td class="text-right">${formatCurrency(order.vat)} ${order.currency}</td>
                    </tr>
                    <tr class="ro-total">
                        <td colspan="3"><strong>${t('total')}</strong></td>
                        <td class="text-right"><strong>${formatCurrency(order.total)} ${order.currency}</strong></td>
                    </tr>
                </tfoot>
            </table>

            ${order.deliveryDate ? `<p><strong>${t('deliveryDate')}:</strong> ${formatDate(order.deliveryDate)}</p>` : ''}
            ${order.notes ? `<div class="ro-notes"><strong>${t('notes')}:</strong><br>${order.notes}</div>` : ''}
        </div>
    `;
}

function closeReceivedOrderPreviewModal() {
    const modal = document.getElementById('receivedOrderPreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

function printReceivedOrder() {
    const originalTitle = document.title;
    const orderNum = document.getElementById('recOrdNumber').value;
    document.title = orderNum || 'Objednávka';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

// RECEIVED INVOICES PREVIEW
function showReceivedInvoicePreview() {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };

    // Get form data
    const formData = {
        internalNumber: document.getElementById('recInvInternalNum').value,
        invoiceNumber: document.getElementById('recInvNumber').value,
        supplier: document.getElementById('recInvSupplier').selectedOptions[0]?.text || '',
        date: document.getElementById('recInvDate').value,
        dueDate: document.getElementById('recInvDueDate').value,
        taxDate: document.getElementById('recInvTaxDate').value,
        currency: document.getElementById('recInvCurrency').value,
        subtotal: parseFloat(document.getElementById('recInvSubtotal').value) || 0,
        vatRate: parseFloat(document.getElementById('recInvVatRate').value) || 21,
        vat: parseFloat(document.getElementById('recInvVat').value) || 0,
        total: parseFloat(document.getElementById('recInvTotal').value) || 0,
        notes: document.getElementById('recInvNotes').value
    };

    // Generate HTML
    const previewHtml = generateReceivedInvoiceHTML(formData, config);

    // Display
    document.getElementById('receivedInvoicePreview').innerHTML = previewHtml;
    const modal = document.getElementById('receivedInvoicePreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function generateReceivedInvoiceHTML(invoice, config) {
    return `
        <div class="ri-doc">
            <div class="ri-header">
                <div class="ri-company">
                    <h2>${config.COMPANY.name}</h2>
                    <p>${config.COMPANY.address}</p>
                </div>
                <div class="ri-info">
                    <h1>${t('receivedInvoice')}</h1>
                    <p><strong>${t('internalNumber')}:</strong> ${invoice.internalNumber}</p>
                    <p><strong>${t('invoiceNumberExt')}:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>${t('date')}:</strong> ${formatDate(invoice.date)}</p>
                    <p><strong>${t('dueDate')}:</strong> ${formatDate(invoice.dueDate)}</p>
                    ${invoice.taxDate ? `<p><strong>${t('taxDate')}:</strong> ${formatDate(invoice.taxDate)}</p>` : ''}
                </div>
            </div>

            <div class="ri-supplier">
                <h3>${t('supplier')}</h3>
                <div class="ri-supplier-box">
                    <p><strong>${invoice.supplier}</strong></p>
                </div>
            </div>

            <div class="ri-totals">
                <div class="ri-total-row">
                    <span>${t('subtotalHT')}:</span>
                    <span>${formatCurrency(invoice.subtotal)} ${invoice.currency}</span>
                </div>
                <div class="ri-total-row">
                    <span>DPH ${invoice.vatRate}%:</span>
                    <span>${formatCurrency(invoice.vat)} ${invoice.currency}</span>
                </div>
                <div class="ri-total-row ri-total-main">
                    <span><strong>${t('total')}:</strong></span>
                    <span><strong>${formatCurrency(invoice.total)} ${invoice.currency}</strong></span>
                </div>
            </div>

            ${invoice.notes ? `<div class="ri-notes"><strong>${t('notes')}:</strong><br>${invoice.notes}</div>` : ''}
        </div>
    `;
}

function closeReceivedInvoicePreviewModal() {
    const modal = document.getElementById('receivedInvoicePreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

function printReceivedInvoice() {
    const originalTitle = document.title;
    const invoiceNum = document.getElementById('recInvNumber').value;
    document.title = invoiceNum || 'Faktura';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

// STOCK RECEIPTS PREVIEW
function showReceiptPreview() {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };

    // Get form data
    const formData = {
        supplier: document.getElementById('entrySupplier').selectedOptions[0]?.text || '',
        bonNum: document.getElementById('entryBonNum').value,
        date: document.getElementById('entryDate').value,
        currency: document.getElementById('entryCurrency').value,
        items: []
    };

    // Get items
    document.querySelectorAll('#entryItems .item-row').forEach(row => {
        const select = row.querySelector('.item-ref');
        const ref = select?.value;
        if (ref) {
            const name = select.selectedOptions[0]?.text || '';
            const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
            const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            if (qty > 0) {
                formData.items.push({
                    ref,
                    name,
                    qty,
                    price,
                    total: qty * price
                });
            }
        }
    });

    // Calculate totals
    const exchangeRate = storage.getExchangeRate(formData.currency);
    formData.exchangeRate = exchangeRate;
    formData.subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    formData.subtotalCZK = formData.subtotal * exchangeRate;

    // Generate HTML
    const previewHtml = generateReceiptHTML(formData, config);

    // Display
    document.getElementById('receiptPreview').innerHTML = previewHtml;
    const modal = document.getElementById('receiptPreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function generateReceiptHTML(receipt, config) {
    let itemsHtml = receipt.items.map(item => {
        const priceCZK = item.price * receipt.exchangeRate;
        const totalCZK = item.total * receipt.exchangeRate;
        return `
            <tr>
                <td>${item.ref}</td>
                <td>${item.name}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${formatCurrency(item.price)} ${receipt.currency}</td>
                <td class="text-right">${formatCurrency(priceCZK)} CZK</td>
                <td class="text-right"><strong>${formatCurrency(totalCZK)} CZK</strong></td>
            </tr>
        `;
    }).join('');

    return `
        <div class="receipt-doc">
            <div class="receipt-header">
                <div class="receipt-company">
                    <h2>${config.COMPANY.name}</h2>
                    <p>${config.COMPANY.address}</p>
                </div>
                <div class="receipt-info">
                    <h1>${t('stockReceipt')}</h1>
                    <p><strong>${t('receiptNumber')}:</strong> ${receipt.bonNum}</p>
                    <p><strong>${t('date')}:</strong> ${formatDate(receipt.date)}</p>
                </div>
            </div>

            <div class="receipt-supplier">
                <h3>${t('supplier')}</h3>
                <p><strong>${receipt.supplier}</strong></p>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>${t('reference')}</th>
                        <th>${t('designation')}</th>
                        <th>${t('quantity')}</th>
                        <th>${t('priceUnit')} ${receipt.currency}</th>
                        <th>P.U. CZK</th>
                        <th>${t('total')} CZK</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>${t('exchangeRate')} ${receipt.currency}/CZK:</span>
                    <span>${receipt.exchangeRate.toFixed(3)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>${t('total')} ${receipt.currency}:</span>
                    <span>${formatCurrency(receipt.subtotal)} ${receipt.currency}</span>
                </div>
                <div class="receipt-total-row receipt-total-main">
                    <span><strong>${t('total')} CZK:</strong></span>
                    <span><strong>${formatCurrency(receipt.subtotalCZK)} CZK</strong></span>
                </div>
            </div>
        </div>
    `;
}

function closeReceiptPreviewModal() {
    const modal = document.getElementById('receiptPreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

function printReceipt() {
    const originalTitle = document.title;
    const bonNum = document.getElementById('entryBonNum').value;
    document.title = bonNum || 'Příjemka';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
}

// DELIVERY PREVIEW (BEFORE SAVE)
function previewDeliveryBeforeSave() {
    // Collect delivery data from form
    const clientSelect = document.getElementById('deliveryClient');
    let clientName = clientSelect?.selectedOptions[0]?.text || '';
    // Use fallback if no client selected
    if (!clientName || clientName === (t('selectContact') || '-- Sélectionner --')) {
        clientName = clientSelect?.dataset?.clientNameFallback || '';
    }

    const deliveryData = {
        client: clientName,
        clientAddress: document.getElementById('deliveryClientAddress')?.value || '',
        clientOrderNum: document.getElementById('deliveryClientOrderNum')?.value || '',
        clientOrderNumber: document.getElementById('deliveryClientOrderNum')?.value || '',
        date: new Date().toISOString().split('T')[0],
        blNumber: 'PREVIEW',
        items: {
            pac: {},
            components: [],
            custom: []
        }
    };

    // Get PAC quantities
    getPacModels().forEach(m => {
        const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
        const qty = parseInt(input?.value) || 0;
        if (qty > 0) {
            deliveryData.items.pac[m.id] = qty;
        }
    });

    // Get components from stock
    const componentRows = document.querySelectorAll('#deliveryComponentsContainer .item-row');
    componentRows.forEach(row => {
        const select = row.querySelector('.item-ref');
        const qtyInput = row.querySelector('.item-qty');
        const ref = select?.value;
        const qty = parseInt(qtyInput?.value) || 0;
        if (ref && qty > 0) {
            // Get component name from the select option text
            const selectedOption = select.options[select.selectedIndex];
            const fullText = selectedOption?.textContent || ref;
            // Extract name before "(Stock: X)"
            const name = fullText.split(' (Stock:')[0] || ref;
            deliveryData.items.components.push({ ref, name, qty });
        }
    });

    // Get custom items
    const customRows = document.querySelectorAll('#deliveryCustomItemsContainer .item-row');
    customRows.forEach(row => {
        const nameInput = row.querySelector('.item-custom-name');
        const qtyInput = row.querySelector('.item-qty');
        const name = nameInput?.value?.trim();
        const qty = parseInt(qtyInput?.value) || 0;
        if (name && qty > 0) {
            deliveryData.items.custom.push({ name, qty });
        }
    });

    // Use existing showDeliveryNote function
    showDeliveryNote(deliveryData);
}

// PURCHASE ORDER PREVIEW (BEFORE SAVE)
function previewPOBeforeSave() {
    // Collect PO data from form
    const poData = {
        poNumber: 'PREVIEW',
        supplier: document.getElementById('poSupplier')?.selectedOptions[0]?.text || '',
        date: new Date().toISOString().split('T')[0],
        expectedDate: document.getElementById('poExpectedDate')?.value || '',
        currency: document.getElementById('poCurrency')?.value || 'EUR',
        items: []
    };

    // Get items
    const itemRows = document.querySelectorAll('#poItems .item-row');
    itemRows.forEach(row => {
        // Check if it's a custom item (has input instead of select)
        const nameInput = row.querySelector('.item-custom-name');
        if (nameInput) {
            // Custom item
            const name = nameInput.value;
            const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
            const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            if (name && qty > 0) {
                poData.items.push({
                    ref: '',
                    name,
                    qty,
                    price,
                    total: qty * price
                });
            }
        } else {
            // Regular item with reference
            const select = row.querySelector('.item-ref');
            const qtyInput = row.querySelector('.item-qty');
            const priceInput = row.querySelector('.item-price');

            const ref = select?.value;
            const qty = parseFloat(qtyInput?.value) || 0;
            const price = parseFloat(priceInput?.value) || 0;

            if (ref && qty > 0) {
                const name = select?.selectedOptions[0]?.text || ref;
                poData.items.push({
                    ref,
                    name,
                    qty,
                    price,
                    total: qty * price
                });
            }
        }
    });

    // Use existing showPOPreview function
    showPOPreview(poData);
}

// CLIENT INVOICE PREVIEW (BEFORE SAVE)
function previewInvoiceBeforeSave() {
    // Collect invoice data from form
    const invoiceData = {
        number: document.getElementById('invNumber')?.value || 'PREVIEW',
        varSymbol: document.getElementById('invVarSymbol')?.value || '',
        client: document.getElementById('invClient')?.selectedOptions[0]?.text || '',
        clientIco: document.getElementById('invClientIco')?.value || '',
        clientDic: document.getElementById('invClientDic')?.value || '',
        clientAddress: document.getElementById('invClientAddress')?.value || '',
        issueDate: document.getElementById('invDate')?.value || '',
        date: document.getElementById('invDate')?.value || '',
        dueDate: document.getElementById('invDueDate')?.value || '',
        taxDate: document.getElementById('invTaxDate')?.value || '',
        currency: document.getElementById('invCurrency')?.value || 'CZK',
        items: [],
        notes: document.getElementById('invNotes')?.value || '',
        linkedOrderNumber: '',
        clientOrderNumber: document.getElementById('invClientOrderNum')?.value || ''
    };

    // Get linked order info if available
    const linkedOrderId = document.getElementById('invLinkedOrder')?.value;
    if (linkedOrderId) {
        const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const linkedOrderData = orders.find(o => o.id === linkedOrderId);
        if (linkedOrderData) {
            invoiceData.linkedOrderNumber = linkedOrderData.orderNumber || '';
            // Only fill from linked order if not already set in form
            if (!invoiceData.clientOrderNumber) {
                invoiceData.clientOrderNumber = linkedOrderData.clientOrderNumber || '';
            }
        }
    }

    // Get linked proforma info if available (for deposit deduction)
    const linkedProformaNumber = document.getElementById('invLinkedProforma')?.value;
    console.log('Preview - Linked proforma number:', linkedProformaNumber);

    if (linkedProformaNumber && linkedProformaNumber !== '') {
        const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
        const proformaInvoice = invoices.find(i => i.number === linkedProformaNumber);
        console.log('Preview - Found proforma invoice:', proformaInvoice);

        if (proformaInvoice && (proformaInvoice.isPaid || proformaInvoice.paid)) {
            // Calculate tax document amounts (deposit amounts with VAT)
            const depositPercent = proformaInvoice.depositPercent || 100;
            const fullSubtotal = (proformaInvoice.items || []).reduce((sum, item) => sum + (item.qty * item.price), 0);
            const taxDocSubtotal = proformaInvoice.taxDocSubtotal || (fullSubtotal * depositPercent / 100);
            const taxDocVat = proformaInvoice.taxDocVat || (taxDocSubtotal * 21 / 100);
            const taxDocTotal = proformaInvoice.taxDocTotal || (taxDocSubtotal + taxDocVat);

            invoiceData.linkedProforma = {
                id: proformaInvoice.id,
                number: proformaInvoice.number,
                ddNumber: proformaInvoice.ddNumber || proformaInvoice.number.replace(/^(ZL|PI|PF)-?/, 'DD-'),
                subtotal: taxDocSubtotal,
                vat: taxDocVat,
                total: taxDocTotal,
                paidExchangeRate: parseFloat(proformaInvoice.paidExchangeRate || proformaInvoice.exchangeRate) || null,
                paidSubtotalCZK: parseFloat(proformaInvoice.paidSubtotalCZK) || null,
                paidVatCZK: parseFloat(proformaInvoice.paidVatCZK) || null,
                paidAmountCZK: parseFloat(proformaInvoice.paidAmountCZK) || null
            };

            console.log('Preview - Linked proforma data:', invoiceData.linkedProforma);
        } else {
            console.log('Preview - Proforma not found or not paid');
        }
    }

    // Get proforma status and deposit percentage
    const proformaCheckbox = document.getElementById('invIsProforma');
    invoiceData.isProforma = proformaCheckbox ? proformaCheckbox.checked : false;
    invoiceData.type = invoiceData.isProforma ? 'proforma' : 'standard';
    if (invoiceData.isProforma) {
        invoiceData.depositPercent = parseFloat(document.getElementById('invDepositPercent')?.value) || 100;
        // Proforma should not have exchange rate
        invoiceData.exchangeRate = null;
    } else if (invoiceData.currency === 'EUR') {
        // Only non-proforma EUR invoices have exchange rate
        invoiceData.exchangeRate = parseFloat(document.getElementById('invExchangeRate')?.value) || null;
    }

    // Get items from invoice form
    const itemRows = document.querySelectorAll('#invItems .item-row');
    itemRows.forEach(row => {
        const nameInput = row.querySelector('.inv-item-name');
        const qtyInput = row.querySelector('.inv-item-qty');
        const priceInput = row.querySelector('.inv-item-price');
        const isPacHeaderInput = row.querySelector('.is-pac-header');

        const name = nameInput?.value;
        const qty = parseFloat(qtyInput?.value) || 0;
        const price = parseFloat(priceInput?.value) || 0;
        const isPacHeader = isPacHeaderInput?.value === 'true';

        if (isPacHeader && name) {
            // PAC header row
            invoiceData.items.push({
                name,
                qty: 0,
                unit: '',
                price: 0,
                total: 0,
                isPacHeader: true
            });
        } else if (name && qty > 0) {
            invoiceData.items.push({
                name,
                qty,
                unit: 'ks',
                price,
                total: qty * price
            });
        }
    });

    // Calculate totals
    invoiceData.subtotal = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
    const vatRate = parseFloat(document.getElementById('invVatRate')?.value) || 21;
    invoiceData.vat = invoiceData.subtotal * (vatRate / 100);
    invoiceData.total = invoiceData.subtotal + invoiceData.vat;
    invoiceData.vatRate = vatRate;

    // Generate preview HTML
    const previewHtml = generateInvoicePreviewHTML(invoiceData);

    // Set currentInvoice for email sending
    currentInvoice = invoiceData;

    // Show in invoice preview modal
    document.getElementById('invoicePreview').innerHTML = previewHtml;
    const modal = document.getElementById('invoicePreviewModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function generateInvoicePreviewHTML(inv) {
    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const curr = inv.currency || 'CZK';
    const vatRate = inv.vatRate || 21;
    const varSymbol = inv.varSymbol || inv.number.replace(/\D/g, '');

    // Generate items HTML with full 7 columns: Popis | Množství | MJ | Cena za MJ | Celkem bez DPH | DPH | Celkem s DPH
    let isUnderPacHeader = false;
    let itemsHtml = (inv.items || []).map(item => {
        // Special formatting for PAC headers (like in repair quote)
        if (item.isPacHeader) {
            isUnderPacHeader = true;
            return `
        <tr style="background-color: #dbeafe;">
            <td colspan="7" style="padding: 10px; border-top: 2px solid #3b82f6; font-weight: bold; font-size: 11px;">
                ${item.name}
            </td>
        </tr>
        `;
        }

        const itemSubtotal = item.qty * item.price;
        const itemVat = itemSubtotal * vatRate / 100;
        const itemTotal = itemSubtotal + itemVat;
        // Add slight indent for items under PAC header
        const indent = isUnderPacHeader ? 'padding-left: 20px;' : '';
        return `
        <tr>
            <td style="${indent}">${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-center">ks</td>
            <td class="text-right">${formatCurrency(item.price)} ${curr}</td>
            <td class="text-right">${formatCurrency(itemSubtotal)} ${curr}</td>
            <td class="text-center">${vatRate}%</td>
            <td class="text-right">${formatCurrency(itemTotal)} ${curr}</td>
        </tr>
        `;
    }).join('');

    // Add proforma deduction line if applicable
    console.log('generateInvoicePreviewHTML - inv.linkedProforma:', inv.linkedProforma);
    const deductionHtml = generateProformaDeductionItemHtml(inv);
    console.log('generateInvoicePreviewHTML - deduction HTML length:', deductionHtml.length);
    itemsHtml += deductionHtml;

    // Calculate net totals (after proforma deduction)
    const hasProformaDeduction = inv.linkedProforma && inv.linkedProforma.total > 0;
    console.log('generateInvoicePreviewHTML - hasProformaDeduction:', hasProformaDeduction);
    const netSubtotal = hasProformaDeduction ? inv.subtotal - inv.linkedProforma.subtotal : inv.subtotal;
    const netVat = hasProformaDeduction ? inv.vat - inv.linkedProforma.vat : inv.vat;
    const netTotal = hasProformaDeduction ? inv.total - inv.linkedProforma.total : inv.total;
    console.log('generateInvoicePreviewHTML - Net totals:', { netSubtotal, netVat, netTotal });

    // Banking info
    const bankInfo = curr === 'EUR' ? company.bank?.EUR : company.bank?.CZK;

    // Determine document type and title
    const isProforma = inv.isProforma || inv.type === 'proforma' || (inv.number && String(inv.number).startsWith('PF'));

    // CZK conversion for EUR invoices (NOT shown for proforma, NOT shown when there's proforma deduction)
    let czkConversionHtml = '';
    if (curr === 'EUR' && inv.exchangeRate && !isProforma && !hasProformaDeduction) {
        const rate = parseFloat(inv.exchangeRate) || exchangeRate;
        const subtotalCZK = inv.subtotal * rate;
        const vatCZK = inv.vat * rate;
        const totalCZK = inv.total * rate;

        czkConversionHtml = `
            <div class="inv-czk-conversion" style="margin-top: 8px; padding: 6px; border: 1px solid #ccc; font-size: 8px; color: #666; background: #fafafa;">
                <div style="margin-bottom: 3px;">Ekvivalent v CZK dle kurzu ČNB ${rate.toFixed(3)} CZK/EUR (k DUZP ${formatDate(inv.taxDate || inv.issueDate)})</div>
                <table style="width: 100%; font-size: 8px;">
                    <tr><td>Základ daně v CZK:</td><td style="text-align: right;">${formatCurrency(subtotalCZK)} CZK</td></tr>
                    <tr><td>DPH v CZK (${vatRate}%):</td><td style="text-align: right;">${formatCurrency(vatCZK)} CZK</td></tr>
                    <tr><td><strong>Celkem s DPH v CZK:</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalCZK)} CZK</strong></td></tr>
                </table>
            </div>
        `;
    }
    const invoiceTitle = isProforma ? 'ZÁLOHOVÁ FAKTURA (PROFORMA)' : 'DAŇOVÝ DOKLAD FAKTURA';
    const depositInfo = isProforma && inv.depositPercent && inv.depositPercent < 100 ? ` - Záloha ${inv.depositPercent}%` : '';
    const proformaBanner = isProforma ? `
        <div style="background: #8b5cf6; color: white; text-align: center; padding: 0.5rem; font-weight: bold; margin-bottom: 0.5rem; border-radius: 4px; font-size: 11px;">
            ⚠️ PROFORMA - Zálohová faktura${depositInfo} - Není daňovým dokladem
        </div>
    ` : '';

    return `
        <div class="invoice-doc">
            <div class="inv-title" style="text-align: center; font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
                ${invoiceTitle} ${inv.number}
            </div>
            ${proformaBanner}
            <div class="inv-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div class="inv-company" style="flex: 1;">
                    <strong style="font-size: 12px;">${company.name || 'NAVALO s.r.o.'}</strong><br>
                    <span style="font-size: 10px;">${company.address || ''}</span><br>
                    <span style="font-size: 10px;">IČO: ${company.ico || ''} | DIČ: ${company.dic || ''}</span>
                </div>
                <div class="inv-info" style="text-align: right; font-size: 10px;">
                    <p style="margin: 2px 0;">Datum vystavení: ${formatDate(inv.issueDate || inv.date)}</p>
                    ${!isProforma ? `<p style="margin: 2px 0;">DUZP: ${formatDate(inv.taxDate || inv.issueDate || inv.date)}</p>` : ''}
                    <p style="margin: 2px 0;">Splatnost: ${formatDate(inv.dueDate)}</p>
                    <p style="margin: 2px 0;">Variabilní symbol: ${varSymbol}</p>
                    ${inv.linkedOrderNumber ? `<p style="margin: 2px 0;"><strong>Číslo objednávky:</strong> ${inv.linkedOrderNumber}</p>` : ''}
                    <p style="margin: 2px 0;"><strong>Číslo obj. zákazníka:</strong> ${inv.clientOrderNumber || '-'}</p>
                </div>
            </div>
            <div class="inv-parties" style="display: flex; gap: 20px; margin-bottom: 10px;">
                <div class="inv-party" style="flex: 1;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">DODAVATEL</div>
                    <div class="inv-party-box" style="border: 1px solid #000; padding: 8px; font-size: 10px;">
                        <strong>${company.name || 'NAVALO s.r.o.'}</strong><br>
                        ${company.address || ''}<br>
                        IČO: ${company.ico || ''}<br>
                        DIČ: ${company.dic || ''}
                    </div>
                </div>
                <div class="inv-party" style="flex: 1;">
                    <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">ZÁKAZNÍK</div>
                    <div class="inv-party-box" style="border: 1px solid #000; padding: 8px; font-size: 10px;">
                        <strong>${inv.client}</strong><br>
                        ${inv.clientAddress || ''}<br>
                        IČO: ${inv.clientIco || ''}<br>
                        DIČ: ${inv.clientDic || ''}
                    </div>
                </div>
            </div>
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Popis položky</th>
                        <th>Množství</th>
                        <th>MJ</th>
                        <th>Cena za MJ</th>
                        <th>Celkem bez DPH</th>
                        <th>DPH</th>
                        <th>Celkem s DPH</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr class="inv-total">
                        <td colspan="4" class="text-right"><strong>Celkem:</strong></td>
                        <td class="text-right">${formatCurrency(netSubtotal)} ${curr}</td>
                        <td class="text-right">${formatCurrency(netVat)} ${curr}</td>
                        <td class="text-right">${formatCurrency(netTotal)} ${curr}</td>
                    </tr>
                </tfoot>
            </table>
            ${generateProformaDeductionHtml(inv)}
            ${czkConversionHtml}
            ${generateProformaDepositHtml(inv, netTotal, curr)}
            <div class="inv-payment" style="margin-top: 10px; padding: 8px; border: 1px solid #000; font-size: 9px;">
                <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px;">Bankovní spojení</div>
                <strong>${bankInfo?.name || ''}</strong><br>
                Účet: ${bankInfo?.account || ''}<br>
                IBAN: ${bankInfo?.iban || ''}<br>
                BIC: ${bankInfo?.bic || ''}
            </div>
            <div style="margin-top: 15px; font-size: 9px;">
                <strong>Vyhotovil:</strong> Taňa Milatová
            </div>
            ${inv.notes ? `<div style="margin-top: 10px; padding: 8px; border-left: 4px solid #2563eb; background: #f1f5f9; font-size: 9px;"><strong>Notes:</strong><br>${inv.notes}</div>` : ''}
        </div>
    `;
}

// REPAIR QUOTE PREVIEW (BEFORE SAVE)
function previewRepairQuoteBeforeSave() {
    const serviceRates = getServiceRates();

    // Collect repair quote data from form
    const quoteData = {
        quoteNumber: document.getElementById('repairQuoteNumber')?.value || 'PREVIEW',
        ticketNumber: document.getElementById('repairQuoteTicketNum')?.value || '',
        clientOrderNumber: document.getElementById('repairQuoteClientOrderNum')?.value || '',
        date: document.getElementById('repairQuoteDate')?.value || new Date().toISOString().split('T')[0],
        client: document.getElementById('repairQuoteClient')?.selectedOptions[0]?.text || '',
        address: document.getElementById('repairQuoteAddress')?.value || '',
        pacs: []
    };

    // Get all PAC containers
    const pacContainers = document.querySelectorAll('.pac-card');

    pacContainers.forEach((container, index) => {
        const pac = {
            model: container.querySelector('.pac-model')?.value || '',
            serial: container.querySelector('.pac-serial')?.value || '',
            serialAlliance: container.querySelector('.pac-serial-alliance')?.value || '',
            notes: container.querySelector('.pac-notes')?.value || '',
            underWarranty: container.querySelector('.pac-under-warranty')?.checked || false,
            components: [],
            services: {
                labor: 0,
                refrigerant: 0,
                disposal: 0
            },
            subtotal: 0
        };

        // Get components for this PAC
        const compRows = container.querySelectorAll('.component-row');
        compRows.forEach(row => {
            const select = row.querySelector('.component-select');
            const qtyInput = row.querySelector('.component-qty');

            if (select && select.value) {
                const ref = select.value;
                const qty = parseFloat(qtyInput?.value) || 0;

                if (qty > 0) {
                    // Get component from repair price list
                    const repairComponent = getRepairComponent(ref, pac.model);
                    if (repairComponent) {
                        const priceUnit = repairComponent.price || 0;
                        pac.components.push({
                            ref,
                            name: repairComponent.name || ref,
                            qty,
                            priceUnit,
                            total: qty * priceUnit
                        });
                    }
                }
            }
        });

        // Get services for this PAC
        const laborInput = container.querySelector('.service-labor');
        const refrigerantInput = container.querySelector('.service-refrigerant');
        const disposalInput = container.querySelector('.service-disposal');

        pac.services.labor = parseFloat(laborInput?.value) || 0;
        pac.services.refrigerant = parseFloat(refrigerantInput?.value) || 0;
        pac.services.disposal = parseFloat(disposalInput?.value) || 0;

        // Calculate PAC subtotal (0 if under warranty)
        if (!pac.underWarranty) {
            pac.subtotal = pac.components.reduce((sum, comp) => sum + comp.total, 0);
            pac.subtotal += pac.services.labor * (serviceRates.labor?.price || 0);
            pac.subtotal += pac.services.refrigerant * (serviceRates.refrigerantR134a?.price || 0);
            pac.subtotal += pac.services.disposal * (serviceRates.disposal?.price || 0);
        } else {
            pac.subtotal = 0;
        }

        if (pac.model || pac.serial || pac.components.length > 0) {
            quoteData.pacs.push(pac);
        }
    });

    // Calculate totals
    quoteData.subtotal = quoteData.pacs.reduce((sum, pac) => sum + pac.subtotal, 0);
    quoteData.vat = quoteData.subtotal * 0.21;
    quoteData.total = quoteData.subtotal + quoteData.vat;

    // Use existing showRepairQuotePreview function
    currentRepairQuotePreview = quoteData;
    showRepairQuotePreview(quoteData);
}

// Export functions to window
window.showReceivedOrderPreview = showReceivedOrderPreview;
window.closeReceivedOrderPreviewModal = closeReceivedOrderPreviewModal;
window.printReceivedOrder = printReceivedOrder;
window.showReceivedInvoicePreview = showReceivedInvoicePreview;
window.closeReceivedInvoicePreviewModal = closeReceivedInvoicePreviewModal;
window.printReceivedInvoice = printReceivedInvoice;
window.showReceiptPreview = showReceiptPreview;
window.closeReceiptPreviewModal = closeReceiptPreviewModal;
window.printReceipt = printReceipt;
window.previewDeliveryBeforeSave = previewDeliveryBeforeSave;
window.previewPOBeforeSave = previewPOBeforeSave;
window.previewInvoiceBeforeSave = previewInvoiceBeforeSave;
window.previewRepairQuoteBeforeSave = previewRepairQuoteBeforeSave;
window.sendInvoiceByEmail = sendInvoiceByEmail;
window.sendPurchaseOrderByEmail = sendPurchaseOrderByEmail;

// ============================================================
// SUBCONTRACTING ORDERS (Sous-Traitance)
// ============================================================

/**
 * Get next document number (helper for BL, REC, etc.)
 */
function getNextDocumentNumber(type) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();

    if (config.year !== year) {
        config.year = year;
        config.next_bl = 1;
        config.next_rec = 1;
    }

    let key, prefix;
    switch(type) {
        case 'BL':
            key = 'next_bl';
            prefix = 'BL';
            break;
        case 'REC':
            key = 'next_rec';
            prefix = 'REC';
            break;
        default:
            console.error('Invalid document type:', type);
            return null;
    }

    const num = config[key] || 1;
    const docNumber = `${prefix}${year}${String(num).padStart(3, '0')}`; // Format: BL2026013

    config[key] = num + 1;
    localStorage.setItem('navalo_config', JSON.stringify(config));

    return docNumber;
}

/**
 * Get next subcontracting order number
 */
async function getNextSubcontractingOrderNumber() {
    const orders = await storage.getSubcontractingOrders() || [];
    const year = new Date().getFullYear();
    const yearOrders = orders.filter(o => o.number && String(o.number).includes(`ST-${year}`));

    if (yearOrders.length === 0) {
        return `ST-${year}-001`;
    }

    const lastNum = Math.max(...yearOrders.map(o => {
        const match = String(o.number).match(/ST-\d{4}-(\d{3})/);
        return match ? parseInt(match[1]) : 0;
    }));

    return `ST-${year}-${String(lastNum + 1).padStart(3, '0')}`;
}

/**
 * Open subcontracting order modal (new or edit)
 */
async function openSubcontractingOrderModal(orderId = null) {
    editingSubcontractingOrderId = orderId;

    // Populate subcontractor dropdown from contacts (read directly from localStorage)
    const contacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
    const subcontractorSelect = document.getElementById('scSubcontractor');
    subcontractorSelect.innerHTML = '<option value="">Sélectionner...</option>';

    contacts.forEach(contact => {
        const option = document.createElement('option');
        option.value = contact.name;
        option.textContent = contact.name;
        subcontractorSelect.appendChild(option);
    });

    // Reset form
    document.getElementById('scOrderForm').reset();

    if (orderId) {
        // Edit mode
        const orders = await storage.getSubcontractingOrders() || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
            return;
        }

        document.getElementById('scOrderNumber').value = order.number;
        document.getElementById('scSubcontractor').value = order.subcontractor;
        document.getElementById('scKitType').value = order.kitType;
        document.getElementById('scQuantity').value = order.quantity;
        document.getElementById('scDeliveryDate').value = order.deliveryDate;
        document.getElementById('scNotes').value = order.notes || '';

        // Update kit info display
        updateScKitInfo();
    } else {
        // New order mode
        document.getElementById('scOrderNumber').value = await getNextSubcontractingOrderNumber();
        document.getElementById('scDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('scQuantity').value = '1';

        // Select first kit by default
        const kitSelect = document.getElementById('scKitType');
        if (kitSelect.options.length > 0) {
            kitSelect.selectedIndex = 0;
            updateScKitInfo();
        }
    }

    // Show modal
    const modal = document.getElementById('subcontractingOrderModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
}

/**
 * Close subcontracting order modal
 */
async function closeSubcontractingOrderModal() {
    const modal = document.getElementById('subcontractingOrderModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    editingSubcontractingOrderId = null;
}

/**
 * Update kit information display based on selected kit type
 */
function updateScKitInfo() {
    const kitType = document.getElementById('scKitType').value;
    const quantity = parseInt(document.getElementById('scQuantity').value) || 0;
    const infoDiv = document.getElementById('scKitInfo');

    if (!kitType || !ASSEMBLY_BOM[kitType]) {
        infoDiv.innerHTML = '<p class="text-secondary">Sélectionnez un kit</p>';
        return;
    }

    const bom = ASSEMBLY_BOM[kitType];
    const stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');

    let html = `<h4>${bom.name}</h4>`;
    html += '<table class="sc-components-table">';
    html += '<thead><tr><th>Réf</th><th>Nom</th><th>Qté/kit</th><th>Total nécessaire</th><th>Stock disponible</th><th>Status</th></tr></thead>';
    html += '<tbody>';

    bom.components.forEach(comp => {
        const totalNeeded = comp.qty * quantity;
        const stockItem = stock[comp.ref];
        const available = stockItem ? (stockItem.qty || stockItem.quantity || 0) : 0;
        const status = available >= totalNeeded ? '✅' : '⚠️';
        const statusClass = available >= totalNeeded ? 'text-success' : 'text-warning';

        html += `<tr>
            <td>${comp.ref}</td>
            <td>${stockItem ? stockItem.name : comp.ref}</td>
            <td class="text-right">${comp.qty}</td>
            <td class="text-right"><strong>${totalNeeded}</strong></td>
            <td class="text-right">${available}</td>
            <td class="${statusClass}">${status}</td>
        </tr>`;
    });

    html += '</tbody></table>';

    if (bom.assemblyCost) {
        html += `<p class="text-secondary"><strong>${t('assemblyCost') || 'Coût assemblage'}:</strong> ${bom.assemblyCost} CZK/kit</p>`;
        html += `<p class="text-secondary"><strong>${t('totalCost') || 'Coût total'}:</strong> ${bom.assemblyCost * quantity} CZK</p>`;
    }

    infoDiv.innerHTML = html;
}

/**
 * Save subcontracting order
 */
async function saveSubcontractingOrder(event) {
    event.preventDefault();

    const orderData = {
        number: document.getElementById('scOrderNumber').value,
        date: document.getElementById('scDate').value,
        subcontractor: document.getElementById('scSubcontractor').value,
        kitType: document.getElementById('scKitType').value,
        quantity: parseInt(document.getElementById('scQuantity').value),
        deliveryDate: document.getElementById('scDeliveryDate').value,
        notes: document.getElementById('scNotes').value,
        status: 'pending',
        transferred: {},
        received: 0,
        createdAt: new Date().toISOString()
    };

    // Validate
    if (!orderData.subcontractor || !orderData.kitType || !orderData.quantity) {
        showToast(t('fillAllFields') || 'Veuillez remplir tous les champs', 'error');
        return;
    }

    // Get BOM
    const bom = ASSEMBLY_BOM[orderData.kitType];
    if (!bom) {
        showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
        return;
    }

    // Save order
    let orders = await storage.getSubcontractingOrders() || [];

    if (editingSubcontractingOrderId) {
        // Edit existing
        const index = orders.findIndex(o => o.id === editingSubcontractingOrderId);
        if (index !== -1) {
            orderData.id = editingSubcontractingOrderId;
            orderData.transferred = orders[index].transferred;
            orderData.received = orders[index].received;
            orderData.status = orders[index].status;
            orders[index] = orderData;
        }
    } else {
        // Create new
        orderData.id = Date.now().toString();
        orders.push(orderData);
    }

    await storage.saveSubcontractingOrders(orders);

    showToast(
        editingSubcontractingOrderId
            ? (t('orderUpdated') || 'Commande mise à jour')
            : (t('orderCreated') || 'Commande créée'),
        'success'
    );

    closeSubcontractingOrderModal();
    await updateSubcontractingOrdersDisplay();
}

/**
 * Update subcontracting orders display
 */
async function updateSubcontractingOrdersDisplay() {
    const orders = await storage.getSubcontractingOrders() || [];
    const tbody = document.getElementById('subcontractingOrdersBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">Aucune commande de sous-traitance</td></tr>';
        updateSubcontractingSummary(orders);
        return;
    }

    // Sort by date (most recent first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = orders.map(order => {
        const bom = ASSEMBLY_BOM[order.kitType];
        const statusIcon = order.status === 'completed' ? '🟢' : (order.status === 'in_progress' ? '🔵' : '🟡');
        const statusText = order.status === 'completed' ? 'Terminé' : (order.status === 'in_progress' ? 'En cours' : 'En attente');
        const progress = order.quantity > 0 ? Math.round((order.received / order.quantity) * 100) : 0;

        return `
            <tr>
                <td><strong>${order.number}</strong></td>
                <td>${formatDate(order.date)}</td>
                <td>${order.subcontractor}</td>
                <td>${bom ? bom.name : order.kitType}</td>
                <td class="text-right">${order.quantity}</td>
                <td class="text-right">${order.received}/${order.quantity} (${progress}%)</td>
                <td><span class="badge">${statusIcon} ${statusText}</span></td>
                <td>
                    <button class="btn btn-icon" onclick="viewSubcontractingOrder('${order.id}')" title="Voir">👁️</button>
                    <button class="btn btn-icon" onclick="generateSubcontractingPO('${order.id}')" title="Générer bon de commande">📄</button>
                    <button class="btn btn-icon" onclick="generateSubcontractingBL('${order.id}')" title="Générer bon de livraison">📋</button>
                    <button class="btn btn-icon" onclick="transferComponentsForOrder('${order.id}')" title="Transférer composants">📦</button>
                    <button class="btn btn-icon" onclick="receiveKitsForOrder('${order.id}')" title="Recevoir kits">📥</button>
                    <button class="btn btn-icon btn-danger" onclick="deleteSubcontractingOrder('${order.id}')" title="Supprimer">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    updateSubcontractingSummary(orders);
}

/**
 * Update subcontracting summary cards
 */
function updateSubcontractingSummary(orders) {
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const completed = orders.filter(o => o.status === 'completed').length;

    document.getElementById('scPendingCount').textContent = pending;
    document.getElementById('scInProgressCount').textContent = inProgress;
    document.getElementById('scCompletedCount').textContent = completed;
}

/**
 * Transfer components for a subcontracting order
 */
async function transferComponentsForOrder(orderId) {
    const orders = await storage.getSubcontractingOrders() || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
        return;
    }

    const bom = ASSEMBLY_BOM[order.kitType];
    if (!bom) {
        showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
        return;
    }

    // Ask for quantity to transfer
    const remaining = order.quantity - order.received;
    const qtyToTransfer = prompt(`Quantité de kits à transférer (max: ${remaining}):`, remaining);

    if (!qtyToTransfer || isNaN(qtyToTransfer) || qtyToTransfer <= 0) {
        return;
    }

    const qty = parseInt(qtyToTransfer);
    if (qty > remaining) {
        showToast(t('quantityTooHigh') || 'Quantité trop élevée', 'error');
        return;
    }

    // Check stock availability - use currentStock if available, otherwise localStorage
    let stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');

    // If still empty, try to load from storage
    if (Object.keys(stock).length === 0) {
        console.warn('Stock vide, chargement depuis Google Sheets...');
        alert('Le stock n\'est pas encore chargé. Allez d\'abord dans l\'onglet "Stock" puis revenez ici.');
        return;
    }

    // Debug: show all stock references
    console.log('=== DEBUG STOCK REFERENCES ===');
    console.log('All stock references:', Object.keys(stock));
    console.log('Looking for:', bom.components.map(c => c.ref));

    const missingComponents = [];

    bom.components.forEach(comp => {
        const needed = comp.qty * qty;
        const stockItem = stock[comp.ref];
        const available = stockItem ? (stockItem.qty || stockItem.quantity || 0) : 0;

        if (available < needed) {
            missingComponents.push(`${comp.ref}: besoin ${needed}, disponible ${available}`);
        }
    });

    if (missingComponents.length > 0) {
        // Show detailed error in console
        console.error('Missing components:', missingComponents);
        console.error('Stock data:', stock);
        console.error('BOM components:', bom.components);

        alert(`Stock insuffisant:\n\n${missingComponents.join('\n')}\n\nVoir la console (F12) pour plus de détails.`);
        return;
    }

    // Create delivery note (BL) - Auto-generate BL
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();
    if (config.year !== year) {
        config.year = year;
        config.next_bl = 1;
    }
    const blNum = config.next_bl || 1;
    const blNumber = `BL${year}${String(blNum).padStart(3, '0')}`;
    config.next_bl = blNum + 1;
    localStorage.setItem('navalo_config', JSON.stringify(config));

    const blDate = new Date().toISOString().split('T')[0];

    console.log('=== BL CREATION ===');
    console.log('Generated BL number:', blNumber);

    const blItems = bom.components.map(comp => {
        const stockItem = stock[comp.ref];
        return {
            ref: comp.ref,
            name: stockItem ? stockItem.name : comp.ref,
            qty: comp.qty * qty,  // Use 'qty' for preview compatibility
            price: stockItem ? (stockItem.lastPrice || stockItem.price || 0) : 0
        };
    });

    const blData = {
        id: Date.now().toString(),
        blNumber: blNumber,
        date: blDate,
        client: order.subcontractor,
        clientAddress: '',
        items: {
            pac: {},  // No PAC, only components
            components: blItems,  // Components array
            custom: []
        },
        notes: `Transfert sous-traitance - Ordre ${order.number} - Composants pour ${qty} kits`,
        isSubcontractorTransfer: true,
        linkedSubcontractingOrder: order.id,
        createdAt: new Date().toISOString()
    };

    // Use storage.processDelivery to handle stock update with Google Sheets sync
    const deliveryData = {
        client: order.subcontractor,
        clientAddress: '',
        notes: `Transfert sous-traitance - Ordre ${order.number} - Composants pour ${qty} kits`,
        date: blDate,
        items: {
            pac: {},  // No PAC
            components: blItems,  // Components to transfer
            custom: []
        }
    };

    try {
        const result = await storage.processDelivery(deliveryData);
        console.log('✓ Delivery processed:', result);

        // Track transfer in order
        bom.components.forEach(comp => {
            const needed = comp.qty * qty;
            if (!order.transferred[comp.ref]) {
                order.transferred[comp.ref] = 0;
            }
            order.transferred[comp.ref] += needed;
        });

        // Reload stock after delivery to get updated values
        const stockData = await storage.getStockWithValue();
        currentStock = stockData.components;

    } catch (error) {
        console.error('❌ Erreur lors du transfert:', error);
        showToast('Erreur lors du transfert: ' + error.message, 'error');
        return;
    }

    // Update order status
    if (order.status === 'pending') {
        order.status = 'in_progress';
    }

    await storage.saveSubcontractingOrders(orders);

    showToast(
        `BL ${blNumber} créé - ${qty} kits transférés`,
        'success'
    );

    await updateSubcontractingOrdersDisplay();
    updateStockDisplay();

    console.log('✓ Stock mis à jour:', stock);
}

/**
 * Receive assembled kits for a subcontracting order
 */
async function receiveKitsForOrder(orderId) {
    const orders = await storage.getSubcontractingOrders() || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
        return;
    }

    const bom = ASSEMBLY_BOM[order.kitType];
    if (!bom) {
        showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
        return;
    }

    // Ask for quantity to receive
    const remaining = order.quantity - order.received;
    const qtyToReceive = prompt(`Quantité de kits assemblés reçus (max: ${remaining}):`, remaining);

    if (!qtyToReceive || isNaN(qtyToReceive) || qtyToReceive <= 0) {
        return;
    }

    const qty = parseInt(qtyToReceive);
    if (qty > remaining) {
        showToast(t('quantityTooHigh') || 'Quantité trop élevée', 'error');
        return;
    }

    // Use storage.processReceipt to handle stock update with Google Sheets sync
    const receiptDate = new Date().toISOString().split('T')[0];
    const bonNum = `Retour-${order.number}`;

    // First ensure the kit exists in stock as a component
    let stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');
    if (!stock[order.kitType]) {
        // Add kit to stock if it doesn't exist
        stock[order.kitType] = {
            name: bom.name,
            qty: 0,
            unit: 'pcs',
            min: 0,
            location: 'A1',
            supplier: order.subcontractor,
            lastPrice: bom.assemblyCost || 0,
            currency: 'CZK',
            category: 'kit'
        };
        localStorage.setItem('navalo_stock', JSON.stringify(stock));
    }

    const receiptData = {
        items: [{
            ref: order.kitType,
            qty: qty,
            price: bom.assemblyCost || 0
        }],
        supplier: order.subcontractor,
        bonNum: bonNum,
        date: receiptDate,
        currency: 'CZK',
        linkedPO: null
    };

    try {
        const result = await storage.processReceipt(receiptData);
        console.log('✓ Receipt processed:', result);

        // Reload stock after receipt to get updated values
        const stockData = await storage.getStockWithValue();
        currentStock = stockData.components;

    } catch (error) {
        console.error('❌ Erreur lors de la réception:', error);
        showToast('Erreur lors de la réception: ' + error.message, 'error');
        return;
    }

    // Update order
    order.received += qty;

    if (order.received >= order.quantity) {
        order.status = 'completed';
    } else {
        order.status = 'in_progress';
    }

    await storage.saveSubcontractingOrders(orders);

    showToast(
        `Réception ${receiptNumber} créée - ${qty} kits reçus`,
        'success'
    );

    await updateSubcontractingOrdersDisplay();
    updateStockDisplay();

    console.log('✓ Stock kit mis à jour:', stock[order.kitType]);
}

/**
 * View subcontracting order details
 */
async function viewSubcontractingOrder(orderId) {
    const orders = await storage.getSubcontractingOrders() || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
        return;
    }

    const bom = ASSEMBLY_BOM[order.kitType];
    const progress = order.quantity > 0 ? Math.round((order.received / order.quantity) * 100) : 0;

    let html = `
        <div class="sc-view">
            <h3>Ordre: ${order.number}</h3>
            <p><strong>Date:</strong> ${formatDate(order.date)}</p>
            <p><strong>Sous-traitant:</strong> ${order.subcontractor}</p>
            <p><strong>Kit:</strong> ${bom ? bom.name : order.kitType}</p>
            <p><strong>Quantité commandée:</strong> ${order.quantity}</p>
            <p><strong>Kits reçus:</strong> ${order.received}/${order.quantity} (${progress}%)</p>
            ${order.deliveryDate ? `<p><strong>Date de livraison:</strong> ${formatDate(order.deliveryDate)}</p>` : ''}
            ${order.notes ? `<p><strong>Notes:</strong><br>${order.notes}</p>` : ''}

            <h4>Composants nécessaires (total):</h4>
            <table class="sc-components-table">
                <thead><tr><th>Réf</th><th>Nom</th><th>Qté/kit</th><th>Total</th><th>Transféré</th></tr></thead>
                <tbody>
    `;

    if (bom) {
        const stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        bom.components.forEach(comp => {
            const totalNeeded = comp.qty * order.quantity;
            const transferred = order.transferred[comp.ref] || 0;
            const stockItem = stock[comp.ref];

            html += `<tr>
                <td>${comp.ref}</td>
                <td>${stockItem ? stockItem.name : comp.ref}</td>
                <td class="text-right">${comp.qty}</td>
                <td class="text-right">${totalNeeded}</td>
                <td class="text-right"><strong>${transferred}</strong></td>
            </tr>`;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    // Show in a simple alert for now (can be enhanced with a modal later)
    const viewDiv = document.createElement('div');
    viewDiv.innerHTML = html;
    viewDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;max-width:600px;max-height:80vh;overflow-y:auto;';

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'margin-top:20px;display:flex;gap:10px;justify-content:flex-end;';

    const sendEmailBtn = document.createElement('button');
    sendEmailBtn.textContent = '📧 ' + t('sendEmail');
    sendEmailBtn.className = 'btn btn-secondary';
    sendEmailBtn.onclick = () => sendSubcontractingOrderByEmail(orderId);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ ' + t('close');
    closeBtn.className = 'btn btn-outline';
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(viewDiv);
    };

    btnContainer.appendChild(sendEmailBtn);
    btnContainer.appendChild(closeBtn);
    viewDiv.appendChild(btnContainer);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;';
    overlay.onclick = closeBtn.onclick;

    document.body.appendChild(overlay);
    document.body.appendChild(viewDiv);
}

/**
 * Delete subcontracting order
 */
async function deleteSubcontractingOrder(orderId) {
    if (!confirm(t('confirmDelete') || 'Confirmer la suppression ?')) {
        return;
    }

    let orders = await storage.getSubcontractingOrders() || [];
    orders = orders.filter(o => o.id !== orderId);
    await storage.saveSubcontractingOrders(orders);

    showToast(t('orderDeleted') || 'Commande supprimée', 'success');
    await updateSubcontractingOrdersDisplay();
}

/**
 * Send subcontracting order by email
 */
async function sendSubcontractingOrderByEmail(orderId) {
    try {
        const orders = await storage.getSubcontractingOrders() || [];
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
            return;
        }

        const bom = ASSEMBLY_BOM[order.kitType];
        if (!bom) {
            showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
            return;
        }

        // Default email for subcontractor
        const subcontractorEmail = 'tomas.karas@hotjet.cz';

        // Confirm send
        if (!confirm(`Envoyer la commande de sous-traitance ${order.number} à ${subcontractorEmail}?`)) {
            return;
        }

        // Ask for CC addresses
        const ccAddresses = prompt(
            `Ajouter des adresses en copie (CC)?\n\nSéparez les adresses par des virgules ou points-virgules.\nExemple: email1@domain.com, email2@domain.com\n\nLaissez vide si pas de copie.`,
            ''
        );

        // Generate the PO HTML
        const totalCostCZK = bom.assemblyCost * order.quantity;
        const exchangeRate = storage.getExchangeRate('EUR');
        const totalCostEUR = (totalCostCZK / exchangeRate).toFixed(2);

        const lang = currentLang || 'cz';
        const labels = {
            title: lang === 'cz' ? 'OBJEDNÁVKA SUBDODÁVKY' : 'COMMANDE SOUS-TRAITANCE',
            orderNumber: lang === 'cz' ? 'Číslo objednávky' : 'N° Commande',
            date: lang === 'cz' ? 'Datum' : 'Date',
            subcontractor: lang === 'cz' ? 'Subdodavatel' : 'Sous-traitant',
            kitType: lang === 'cz' ? 'Typ sady' : 'Type de kit',
            quantity: lang === 'cz' ? 'Množství' : 'Quantité',
            assemblyPrice: lang === 'cz' ? 'Cena montáže/ks' : 'Prix assemblage/pcs',
            totalCost: lang === 'cz' ? 'Celková cena' : 'Coût total',
            deliveryDate: lang === 'cz' ? 'Datum dodání' : 'Date livraison',
            notes: lang === 'cz' ? 'Poznámky' : 'Notes',
            components: lang === 'cz' ? 'Komponenty k montáži' : 'Composants à assembler'
        };

        let componentsHtml = '<h3>' + labels.components + ':</h3><table style="width:100%;border-collapse:collapse;margin-top:10px;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ddd;padding:8px;text-align:left;">Réf</th><th style="border:1px solid #ddd;padding:8px;text-align:left;">Nom</th><th style="border:1px solid #ddd;padding:8px;text-align:center;">Qté/kit</th><th style="border:1px solid #ddd;padding:8px;text-align:center;">Total</th></tr></thead><tbody>';

        bom.components.forEach(comp => {
            const stock = currentStock || JSON.parse(localStorage.getItem('navalo_stock') || '{}');
            const stockItem = stock[comp.ref];
            const totalNeeded = comp.qty * order.quantity;

            componentsHtml += `<tr>
                <td style="border:1px solid #ddd;padding:8px;">${comp.ref}</td>
                <td style="border:1px solid #ddd;padding:8px;">${stockItem ? stockItem.name : comp.ref}</td>
                <td style="border:1px solid #ddd;padding:8px;text-align:center;">${comp.qty}</td>
                <td style="border:1px solid #ddd;padding:8px;text-align:center;"><strong>${totalNeeded}</strong></td>
            </tr>`;
        });

        componentsHtml += '</tbody></table>';

        const htmlContent = `
            <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
                <h1 style="text-align:center;color:#333;">${labels.title}</h1>
                <div style="margin:20px 0;">
                    <p><strong>${labels.orderNumber}:</strong> ${order.number}</p>
                    <p><strong>${labels.date}:</strong> ${formatDate(order.date)}</p>
                    <p><strong>${labels.subcontractor}:</strong> ${order.subcontractor}</p>
                    <p><strong>${labels.kitType}:</strong> ${bom.name}</p>
                    <p><strong>${labels.quantity}:</strong> ${order.quantity} kits</p>
                    <p><strong>${labels.assemblyPrice}:</strong> ${bom.assemblyCost} CZK / ${(bom.assemblyCost / exchangeRate).toFixed(2)} EUR</p>
                    <p><strong>${labels.totalCost}:</strong> ${totalCostCZK} CZK / ${totalCostEUR} EUR</p>
                    ${order.deliveryDate ? `<p><strong>${labels.deliveryDate}:</strong> ${formatDate(order.deliveryDate)}</p>` : ''}
                    ${order.notes ? `<p><strong>${labels.notes}:</strong><br>${order.notes}</p>` : ''}
                </div>
                ${componentsHtml}
                <div style="margin-top:40px;padding-top:20px;border-top:2px solid #333;">
                    <p>${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}</p>
                    <p>${CONFIG?.COMPANY?.address || ''}</p>
                    <p>${CONFIG?.COMPANY?.phone || ''}</p>
                </div>
            </div>
        `;

        // Prepare email data
        const emailData = {
            to: subcontractorEmail,
            replyTo: 'tomas.karas@hotjet.cz',
            subject: `${labels.title} ${order.number} - ${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            body: lang === 'cz' ?
                `Dobrý den,\n\nV příloze naleznete objednávku subdodávky ${order.number}.\n\nS pozdravem,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}` :
                `Bonjour,\n\nVous trouverez en pièce jointe la commande de sous-traitance ${order.number}.\n\nCordialement,\n${CONFIG?.COMPANY?.name || 'NAVALO s.r.o.'}`,
            htmlContent: htmlContent,
            documentNumber: order.number,
            documentType: labels.title
        };

        // Add CC if provided
        if (ccAddresses && ccAddresses.trim()) {
            emailData.cc = ccAddresses.trim();
        }

        // Send via Google Apps Script
        const result = await storage.apiPost('sendEmail', emailData);

        if (result && result.success) {
            showToast(`${t('emailSent')} - ${subcontractorEmail}`, 'success');
        } else {
            throw new Error(result?.error || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Error sending subcontracting order:', error);
        showToast(t('emailError') + ': ' + error.message, 'error');
    }
}

/**
 * Generate Purchase Order (PO) for subcontractor
 */
async function generateSubcontractingPO(orderId) {
    const orders = await storage.getSubcontractingOrders() || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
        return;
    }

    const bom = ASSEMBLY_BOM[order.kitType];
    if (!bom) {
        showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
        return;
    }

    // Calculate total cost
    const totalCostCZK = bom.assemblyCost * order.quantity;
    const exchangeRate = storage.getExchangeRate('EUR');
    const totalCostEUR = (totalCostCZK / exchangeRate).toFixed(2);

    // Bilingual labels
    const lang = currentLang || 'cz';
    const labels = {
        title: lang === 'cz' ? 'OBJEDNÁVKA' : 'BON DE COMMANDE',
        supplier: lang === 'cz' ? 'Dodavatel' : 'Fournisseur',
        orderDate: lang === 'cz' ? 'Datum objednávky' : 'Date de commande',
        deliveryDate: lang === 'cz' ? 'Požadované datum dodání' : 'Date de livraison souhaitée',
        orderNum: lang === 'cz' ? 'Č. objednávky' : 'N° Commande',
        description: lang === 'cz' ? 'Popis' : 'Description',
        quantity: lang === 'cz' ? 'Množství' : 'Quantité',
        unitPrice: lang === 'cz' ? 'Jednotková cena' : 'Prix unitaire',
        total: lang === 'cz' ? 'Celkem' : 'Total',
        assembly: lang === 'cz' ? 'Montáž' : 'Assemblage',
        totalExclVAT: lang === 'cz' ? 'Celkem bez DPH' : 'Total HT',
        notes: lang === 'cz' ? 'Poznámky' : 'Notes',
        paymentTerms: lang === 'cz' ? 'Platební podmínky' : 'Conditions de paiement',
        paymentTermsText: lang === 'cz' ? 'Sjednat s dodavatelem' : 'À définir avec le fournisseur',
        bankDetails: lang === 'cz' ? 'Bankovní spojení' : 'Coordonnées bancaires'
    };

    // Generate PO document
    const poHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bon de Commande ${order.number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .order-info { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .total { font-weight: bold; background: #f9f9f9; }
        .footer { margin-top: 40px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${labels.title}</h1>
        <h2>${order.number}</h2>
    </div>

    <div class="company-info">
        <strong>${CONFIG.COMPANY.name}</strong><br>
        ${CONFIG.COMPANY.address}<br>
        IČO: ${CONFIG.COMPANY.ico} | DIČ: ${CONFIG.COMPANY.dic}<br>
        Tel: ${CONFIG.COMPANY.phone} | Email: ${CONFIG.COMPANY.email}
    </div>

    <div class="order-info">
        <strong>${labels.supplier}:</strong> ${order.subcontractor}<br>
        <strong>${labels.orderDate}:</strong> ${formatDate(order.date)}<br>
        <strong>${labels.deliveryDate}:</strong> ${formatDate(order.deliveryDate)}<br>
        <strong>${labels.orderNum}:</strong> ${order.number}
    </div>

    <table>
        <thead>
            <tr>
                <th>${labels.description}</th>
                <th>${labels.quantity}</th>
                <th>${labels.unitPrice}</th>
                <th>${labels.total}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>${labels.assembly} ${bom.name}</strong><br>
                    <small>${order.quantity} kits</small>
                </td>
                <td style="text-align: center;">${order.quantity} ks</td>
                <td style="text-align: right;">${bom.assemblyCost.toFixed(2)} CZK</td>
                <td style="text-align: right;">${totalCostCZK.toFixed(2)} CZK</td>
            </tr>
            <tr class="total">
                <td colspan="3" style="text-align: right;"><strong>${labels.totalExclVAT}:</strong></td>
                <td style="text-align: right;"><strong>${totalCostCZK.toFixed(2)} CZK</strong><br><small>(~${totalCostEUR} EUR)</small></td>
            </tr>
        </tbody>
    </table>

    ${order.notes ? `<div><strong>${labels.notes}:</strong><br>${order.notes}</div>` : ''}

    <div class="footer">
        <p><strong>${labels.paymentTerms}:</strong> ${labels.paymentTermsText}</p>
        <p><strong>${labels.bankDetails}:</strong><br>
        CZK: ${CONFIG.COMPANY.bank.CZK.account} (${CONFIG.COMPANY.bank.CZK.name})<br>
        IBAN: ${CONFIG.COMPANY.bank.CZK.iban} | BIC: ${CONFIG.COMPANY.bank.CZK.bic}</p>
    </div>

    <script>
        window.print();
    </script>
</body>
</html>`;

    // Open in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(poHtml);
    printWindow.document.close();
}

/**
 * Generate Delivery Note (BL) for components to subcontractor
 */
async function generateSubcontractingBL(orderId) {
    const orders = await storage.getSubcontractingOrders() || [];
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        showToast(t('orderNotFound') || 'Commande non trouvée', 'error');
        return;
    }

    const bom = ASSEMBLY_BOM[order.kitType];
    if (!bom) {
        showToast(t('invalidKitType') || 'Type de kit invalide', 'error');
        return;
    }

    // Ask for quantity to deliver
    const qtyToDeliver = prompt(`Quantité de kits à livrer (composants):`, order.quantity);
    if (!qtyToDeliver || isNaN(qtyToDeliver) || qtyToDeliver <= 0) {
        return;
    }

    const qty = parseInt(qtyToDeliver);

    // Calculate component quantities
    const components = bom.components.map(comp => {
        const stock = currentStock[comp.ref] || {};
        return {
            ref: comp.ref,
            name: stock.name || comp.ref,
            qtyPerKit: comp.qty,
            totalQty: comp.qty * qty,
            available: stock.qty || 0
        };
    });

    // Calculate total value
    const exchangeRate = storage.getExchangeRate('EUR');
    let totalValueCZK = 0;
    components.forEach(comp => {
        const price = getComponentPrice(comp.ref, 'EUR');
        if (price) {
            totalValueCZK += (price * exchangeRate) * comp.totalQty;
        }
    });

    // Generate BL number (BL-ST-2026XXX format)
    const year = new Date().getFullYear();
    const deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
    const stDeliveries = deliveries.filter(d => d.blNumber && d.blNumber.includes(`BL-ST-${year}`));

    let nextNum = 1;
    if (stDeliveries.length > 0) {
        const maxNum = Math.max(...stDeliveries.map(d => {
            const match = String(d.blNumber).match(/BL-ST-\d{4}-(\d{3})/);
            return match ? parseInt(match[1]) : 0;
        }));
        nextNum = maxNum + 1;
    }

    const blNumber = `BL-ST-${year}-${String(nextNum).padStart(3, '0')}`;
    const currentDate = new Date().toISOString().split('T')[0];

    // Bilingual labels
    const lang = currentLang || 'cz';
    const labels = {
        title: lang === 'cz' ? 'DODACÍ LIST' : 'BON DE LIVRAISON',
        recipient: lang === 'cz' ? 'Příjemce' : 'Destinataire',
        deliveryDate: lang === 'cz' ? 'Datum dodání' : 'Date de livraison',
        blNum: lang === 'cz' ? 'Č. DL' : 'N° BL',
        orderNum: lang === 'cz' ? 'Č. objednávky ST' : 'N° Commande ST',
        kitType: lang === 'cz' ? 'Typ kitu' : 'Type de kit',
        kitQuantity: lang === 'cz' ? 'Množství kitů' : 'Quantité de kits',
        reference: lang === 'cz' ? 'Reference' : 'Référence',
        designation: lang === 'cz' ? 'Označení' : 'Désignation',
        qtyPerKit: lang === 'cz' ? 'Mn./kit' : 'Qté/kit',
        kits: lang === 'cz' ? 'Kity' : 'Kits',
        totalQty: lang === 'cz' ? 'Celk. mn.' : 'Qté totale',
        stockAvail: lang === 'cz' ? 'Sklad disp.' : 'Stock dispo',
        estimatedValue: lang === 'cz' ? 'Odhadovaná hodnota' : 'Valeur estimée',
        notes: lang === 'cz' ? 'Poznámky' : 'Notes',
        notesText: lang === 'cz'
            ? `Tato dodávka odpovídá komponentům potřebným pro montáž ${qty} kit(ů) ${bom.name}.`
            : `Cette livraison correspond aux composants nécessaires pour l'assemblage de ${qty} kit(s) ${bom.name}.`,
        insufficientStock: lang === 'cz' ? 'Komponenty označené ⚠️ mají nedostatečný sklad.' : 'Les composants marqués ⚠️ ont un stock insuffisant.',
        orderNotes: lang === 'cz' ? 'Poznámky k objednávce' : 'Notes commande',
        signature: lang === 'cz' ? 'Podpis' : 'Signature'
    };

    // Generate BL document
    const blHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bon de Livraison ${blNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .delivery-info { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #2196F3; color: white; }
        .total { font-weight: bold; background: #f9f9f9; }
        .warning { color: #ff9800; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${labels.title}</h1>
        <h2>${blNumber}</h2>
    </div>

    <div class="company-info">
        <strong>${CONFIG.COMPANY.name}</strong><br>
        ${CONFIG.COMPANY.address}<br>
        IČO: ${CONFIG.COMPANY.ico} | DIČ: ${CONFIG.COMPANY.dic}<br>
        Tel: ${CONFIG.COMPANY.phone} | Email: ${CONFIG.COMPANY.email}
    </div>

    <div class="delivery-info">
        <strong>${labels.recipient}:</strong> ${order.subcontractor}<br>
        <strong>${labels.deliveryDate}:</strong> ${formatDate(currentDate)}<br>
        <strong>${labels.blNum}:</strong> ${blNumber}<br>
        <strong>${labels.orderNum}:</strong> ${order.number}<br>
        <strong>${labels.kitType}:</strong> ${bom.name}<br>
        <strong>${labels.kitQuantity}:</strong> ${qty}
    </div>

    <table>
        <thead>
            <tr>
                <th>${labels.reference}</th>
                <th>${labels.designation}</th>
                <th>${labels.qtyPerKit}</th>
                <th>${labels.kits}</th>
                <th>${labels.totalQty}</th>
                <th>${labels.stockAvail}</th>
            </tr>
        </thead>
        <tbody>
            ${components.map(comp => `
                <tr>
                    <td><code>${comp.ref}</code></td>
                    <td>${comp.name}</td>
                    <td style="text-align: center;">${comp.qtyPerKit}</td>
                    <td style="text-align: center;">${qty}</td>
                    <td style="text-align: center;"><strong>${comp.totalQty}</strong></td>
                    <td style="text-align: center;" class="${comp.available < comp.totalQty ? 'warning' : ''}">
                        ${comp.available}${comp.available < comp.totalQty ? ' ⚠️' : ' ✓'}
                    </td>
                </tr>
            `).join('')}
            <tr class="total">
                <td colspan="5" style="text-align: right;"><strong>${labels.estimatedValue}:</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(totalValueCZK)} CZK</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p><strong>${labels.notes}:</strong></p>
        <p>${labels.notesText}</p>
        <p>${labels.insufficientStock}</p>
        ${order.notes ? `<p><strong>${labels.orderNotes}:</strong> ${order.notes}</p>` : ''}
        <br><br>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div>
                <p>${labels.signature} ${CONFIG.COMPANY.name}:</p>
                <p style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></p>
            </div>
            <div>
                <p>${labels.signature} ${order.subcontractor}:</p>
                <p style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></p>
            </div>
        </div>
    </div>

    <script>
        window.print();
    </script>
</body>
</html>`;

    // Open in new window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(blHtml);
    printWindow.document.close();
}

// Event listener for subcontracting tab
document.addEventListener('DOMContentLoaded', function() {
    const scTab = document.querySelector('[data-tab="subcontracting"]');
    if (scTab) {
        scTab.addEventListener('click', async function() {
            await updateSubcontractingOrdersDisplay();
        });
    }
});

// Export functions to window
window.openSubcontractingOrderModal = openSubcontractingOrderModal;
window.closeSubcontractingOrderModal = closeSubcontractingOrderModal;
window.updateScKitInfo = updateScKitInfo;
window.saveSubcontractingOrder = saveSubcontractingOrder;
window.transferComponentsForOrder = transferComponentsForOrder;
window.receiveKitsForOrder = receiveKitsForOrder;
window.viewSubcontractingOrder = viewSubcontractingOrder;
window.deleteSubcontractingOrder = deleteSubcontractingOrder;
window.generateSubcontractingPO = generateSubcontractingPO;
window.generateSubcontractingBL = generateSubcontractingBL;
window.sendSubcontractingOrderByEmail = sendSubcontractingOrderByEmail;
