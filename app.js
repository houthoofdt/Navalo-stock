/* ========================================
   NAVALO Stock PAC - Application v4.2
   Complete with i18n, Contacts, History PAC only
   ======================================== */
console.log('=== APP.JS VERSION 4.2 LOADED ===');

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
        onOrder: 'En Cmd', totalAvailable: 'Dispo Total', min: 'Min',
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
        historyTitle: 'Historique des mouvements', historyType: 'Type',
        historyAll: 'Tous', historyIn: 'Entrées', historyOut: 'Sorties',
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
        newReceivedOrder: 'Nouvelle commande', clientOrderNum: 'N° cmd client', linkedOrder: 'Commande liée', none: 'Aucune', orderNum: 'N° Commande',
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
        remainingCZK: 'Reste en CZK'
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
        inStock: 'Na skladě', onOrder: 'Objednáno', totalAvailable: 'Celkem k disp.',
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
        historyTitle: 'Historie pohybů', historyType: 'Typ',
        historyAll: 'Vše', historyIn: 'Příjmy', historyOut: 'Výdeje',
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
        newReceivedOrder: 'Nová objednávka', clientOrderNum: 'Číslo obj. zákazníka', linkedOrder: 'Propojená objednávka', none: 'Žádná', orderNum: 'Číslo objednávky',
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
        remainingCZK: 'Zbývá v CZK'
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

document.addEventListener('DOMContentLoaded', async () => {
    currentLang = localStorage.getItem('navalo_lang') || 'fr';
    document.getElementById('languageSelect').value = currentLang;
    
    // Initialize dynamic PAC model UI elements
    initializePacModelUI();
    
    await storage.init();
    
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
        updateDeliveriesDisplay();
        await updatePurchaseOrdersDisplay();
        await updateInvoicesDisplay();
        await updateReceivedInvoicesDisplay();
        await updateReceivedOrdersDisplay();
        await loadContactsFromStorage();
        updateContactsDisplay();
        updateBomDisplay();
        calculateCapacity();
        updateAlerts();
        updateSuggestedOrders();
        populateLinkedPOSelect();
        populateComponentSelects();
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
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    const pendingQty = {};
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    pos.filter(p => p.status === 'Envoyé' || p.status === 'Brouillon').forEach(po => {
        (po.items || []).forEach(item => {
            pendingQty[item.ref] = (pendingQty[item.ref] || 0) + item.qty;
        });
    });
    
    const categories = currentLang === 'cz' ? (CONFIG?.CATEGORIES_CZ || {}) : (CONFIG?.CATEGORIES || {});
    
    let filtered = Object.entries(currentStock).filter(([ref, data]) => {
        const matchSearch = !search || ref.toLowerCase().includes(search) || 
            (data.name && data.name.toLowerCase().includes(search));
        const totalAvail = (data.qty || 0) + (pendingQty[ref] || 0);
        const minQty = data.min || 0;
        
        if (filter === 'low') return matchSearch && totalAvail > 0 && totalAvail <= minQty;
        if (filter === 'critical') return matchSearch && (data.qty || 0) <= 0;
        return matchSearch;
    });
    
    tbody.innerHTML = filtered.map(([ref, data]) => {
        const qty = data.qty || 0;
        const onOrder = pendingQty[ref] || 0;
        const totalAvail = qty + onOrder;
        const minQty = data.min || 0;
        const value = data.value || 0;
        const cat = categories[data.category] || data.category || '-';
        
        let statusClass = 'status-ok', statusText = t('statusOk');
        if (qty <= 0) { statusClass = 'status-critical'; statusText = t('statusCritical'); }
        else if (totalAvail <= minQty) { statusClass = 'status-low'; statusText = t('statusLow'); }
        
        return `<tr class="${qty <= 0 ? 'row-error' : totalAvail <= minQty ? 'row-warning' : ''}">
            <td><code>${ref}</code></td>
            <td>${data.name || ref}</td>
            <td>${cat}</td>
            <td class="text-right font-bold">${qty}</td>
            <td class="text-right ${onOrder > 0 ? 'text-info' : ''}">${onOrder > 0 ? '+' + onOrder : '-'}</td>
            <td class="text-right">${totalAvail}</td>
            <td class="text-right text-muted">${minQty}</td>
            <td class="text-right">${formatCurrency(value)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    }).join('');
}

// ========================================
// HISTORY DISPLAY
// ========================================

async function updateHistoryDisplay() {
    try {
        const history = await storage.getHistory(100);
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;
        
        const typeFilter = document.getElementById('historyType')?.value || 'all';
        let filtered = Array.isArray(history) ? history : [];
        if (typeFilter !== 'all') filtered = filtered.filter(h => h.type === typeFilter);
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }
        
        tbody.innerHTML = filtered.slice(0, 50).map(h => {
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
    } catch (e) { console.error('History error:', e); }
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
    document.getElementById('contactModal').classList.add('active');
}

async function saveContact() {
    const contact = {
        id: editingContactId || null,
        type: document.getElementById('contactType').value,
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
    
    container.querySelectorAll('.item-ref').forEach(select => {
        const current = select.value;
        select.innerHTML = `<option value="">${t('refPlaceholder')}</option>`;
        
        // Filter components by manufacturer if supplier is selected
        let components = Object.entries(currentStock).sort((a, b) => a[0].localeCompare(b[0]));
        
        if (supplierName) {
            // Get components that match the supplier/manufacturer
            const supplierLower = supplierName.toLowerCase();
            components = components.filter(([ref, data]) => {
                const manufacturer = (data.manufacturer || '').toLowerCase();
                const name = (data.name || '').toLowerCase();
                // Match if manufacturer contains supplier name or vice versa
                return manufacturer.includes(supplierLower) || 
                       supplierLower.includes(manufacturer) ||
                       name.includes(supplierLower);
            });
        }
        
        components.forEach(([ref, data]) => {
            const opt = document.createElement('option');
            opt.value = ref;
            const price = getComponentPrice(ref, 'EUR');
            const priceStr = price ? ` (${formatCurrency(price)} €)` : '';
            opt.textContent = `${ref} - ${data.name || ref}${priceStr}`;
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
    const quantities = getDeliveryQuantities();
    
    if (!Object.values(quantities).some(q => q > 0)) {
        showToast(t('selectAtLeastOne'), 'error');
        return;
    }
    
    const data = {
        client: document.getElementById('deliveryClient').value,
        clientAddress: document.getElementById('deliveryClientAddress').value,
        date: document.getElementById('deliveryDate').value,
        linkedOrderId: document.getElementById('deliveryLinkedOrder')?.value || '',
        clientOrderNumber: document.getElementById('deliveryClientOrderNum')?.value || '',
        quantities
    };
    
    try {
        const result = await storage.processDelivery(data);
        if (result.success) {
            showToast(`BL ${result.blNumber} - ${result.totalPac} PAC`, 'success');
            currentDelivery = { ...data, blNumber: result.blNumber, total: result.totalPac, value: result.totalValue };
            showDeliveryNote(currentDelivery);
            clearDeliveryForm();
            await refreshAllData();
        } else {
            showToast(t('insufficientStock'), 'error');
        }
    } catch (e) { showToast(t('error'), 'error'); }
}

function clearDeliveryForm() {
    getPacModels().forEach(m => {
        const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
        if (input) input.value = 0;
    });
    document.getElementById('bomPreviewSection').style.display = 'none';
    document.getElementById('deliveryLinkedOrder').value = '';
    document.getElementById('deliveryClientOrderNum').value = '';
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
    if (!select) return;
    
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    select.innerHTML = `<option value="">${t('none')}</option>`;
    
    // Show only non-delivered orders
    orders.filter(o => !o.delivered && o.status !== 'Livré').forEach(order => {
        const opt = document.createElement('option');
        opt.value = order.id;
        opt.dataset.client = order.client;
        opt.dataset.address = order.address;
        opt.dataset.clientOrderNumber = order.clientOrderNumber || '';
        opt.dataset.quantities = JSON.stringify(order.quantities || {});
        opt.textContent = `${order.orderNumber} - ${order.client} (${order.clientOrderNumber || 'N/A'})`;
        select.appendChild(opt);
    });
}

function onDeliveryOrderChange() {
    const select = document.getElementById('deliveryLinkedOrder');
    const opt = select.options[select.selectedIndex];
    
    if (opt && opt.value) {
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
        
        // Pre-fill quantities
        try {
            const quantities = JSON.parse(opt.dataset.quantities || '{}');
            getPacModels().forEach(m => {
                const input = document.getElementById(`del-qty-${modelIdToKey(m.id)}`);
                if (input && quantities[m.id]) {
                    input.value = quantities[m.id];
                }
            });
            updateBomPreview();
        } catch(e) {}
    }
}

async function viewDelivery(id) {
    const deliveries = await storage.getDeliveries(100);
    const d = deliveries.find(x => x.id === id);
    if (d) {
        // Build quantities from stored data
        const quantities = d.quantities || {};
        // Backwards compatibility: also check old field names
        if (d.tx9 !== undefined) quantities['TX9'] = d.tx9;
        if (d.tx12_3ph !== undefined) quantities['TX12-3PH'] = d.tx12_3ph;
        if (d.tx12_1ph !== undefined) quantities['TX12-1PH'] = d.tx12_1ph;
        currentDelivery = { ...d, quantities };
        showDeliveryNote(currentDelivery);
    }
}

function showDeliveryNote(d) {
    const config = CONFIG || { COMPANY: { name: 'NAVALO s.r.o.', address: '' } };
    const q = d.quantities || {};
    const models = getPacModels();
    const total = models.reduce((sum, m) => sum + (q[m.id] || 0), 0);
    const pcs = t('pieces');
    
    // Get linked order info if available
    let orderInfo = '';
    if (d.linkedOrderNumber || d.clientOrderNumber) {
        orderInfo = `<p><strong>${t('clientOrderNum')}:</strong> ${d.clientOrderNumber || d.linkedOrderNumber}</p>`;
    }
    
    // Generate items rows dynamically
    const itemsHtml = models.map(m => {
        const qty = q[m.id] || 0;
        return qty > 0 ? `<tr><td>${m.fullName}</td><td>${qty}</td><td>${pcs}</td></tr>` : '';
    }).join('');
    
    // NO FIFO VALUE on BL
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
            const match = r.receiptNumber.match(/PŘ(\d{4})(\d{3})/);
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
        const roundTo = parseInt(rounding);
        total = Math.round(total / roundTo) * roundTo;
        // Recalculate VAT to match rounded total
        vat = total - subtotal;
    }

    document.getElementById('recInvVat').value = vat.toFixed(2);
    document.getElementById('recInvTotal').value = total.toFixed(2);
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

    const invoice = {
        id: editingRecInvId || 'RINV-' + Date.now(),
        internalNumber: internalNumber,
        isProforma: isProforma,
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
        paid: false, paidDate: null,
        fileName: fileData ? document.getElementById('recInvFileName').textContent : existingFileName,
        fileData: fileData || existingFileData,
        fileType: fileData ? currentReceivedInvoiceFile?.type : existingFileType,
        createdAt: new Date().toISOString(),
        ...existingDriveInfo
    };
    
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
                notes: invoice.notes
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

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !inv.isProforma);
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => inv.isProforma);
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
                ${!inv.paid && !inv.isProforma ? `<button class="btn-icon" onclick="markRecInvPaid('${inv.id}')" title="${t('markPaid')}">💰</button>` : ''}
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

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !inv.isProforma);
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => inv.isProforma);
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

function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('cs-CZ'); }
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Try to parse and convert to YYYY-MM-DD
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
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
    
    try {
        const result = await storage.processReceipt({ bonNum, items, supplier, date, currency, linkedPO });
        if (result.success) {
            // Consume the receipt number if it matches expected pattern
            if (bonNum.startsWith('PŘ')) {
                await getNextReceiptNumber(true); // Increment the counter
            }
            if (linkedPO) await storage.updatePurchaseOrder({ poId: linkedPO, status: 'Reçu' });
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

function populateLinkedPOSelect(supplierFilter = null) {
    const select = document.getElementById('entryLinkedPO');
    if (!select) return;
    
    // If no supplier filter, show placeholder only
    if (!supplierFilter) {
        select.innerHTML = `<option value="">${t('selectSupplierFirst') || 'Vyberte dodavatele'}</option>`;
        return;
    }
    
    const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
    select.innerHTML = `<option value="">${t('none')}</option>`;
    
    // Filter by status "Envoyé" and by supplier
    let filtered = pos.filter(p => p.status === 'Envoyé' && p.supplier === supplierFilter);
    
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
            opt.textContent = `${po.poNumber} (${formatDate(po.date)})`;
            opt.dataset.supplier = po.supplier;
            opt.dataset.currency = po.currency;
            select.appendChild(opt);
        });
    }
}

// Called when supplier changes in entry form
function onEntrySupplierChange() {
    const supplierSelect = document.getElementById('entrySupplier');
    const supplierText = supplierSelect.options[supplierSelect.selectedIndex]?.text || '';
    
    // Update currency based on supplier
    onSupplierChange('entrySupplier');
    
    // Filter linked PO list by selected supplier
    if (supplierText && supplierText !== t('selectContact')) {
        populateLinkedPOSelect(supplierText);
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
        
        const container = document.getElementById('entryItems');
        container.innerHTML = '';
        (po.items || []).forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <select class="item-ref" required><option value="">${t('refPlaceholder')}</option></select>
                <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="0.01" step="0.01" required value="${item.qty}">
                <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" value="${item.price || ''}">
                <button type="button" class="btn-icon btn-remove" onclick="removeItemRow(this)">✕</button>`;
            container.appendChild(row);
        });
        populateComponentSelects();
        const rows = container.querySelectorAll('.item-row');
        (po.items || []).forEach((item, i) => { if (rows[i]) rows[i].querySelector('.item-ref').value = item.ref; });
        showToast(`${po.poNumber}`, 'info');
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
    
    tbody.innerHTML = receipts.map(r => {
        const itemCount = r.itemCount || r.items?.length || 0;
        const totalValue = r.totalValue || (r.items || []).reduce((sum, item) => sum + (item.qty * (item.price || 0)), 0);
        const itemsPreview = (r.items || []).slice(0, 2).map(i => `${i.ref}: ${i.qty}`).join(', ');
        const moreItems = itemCount > 2 ? ` +${itemCount - 2}` : '';
        const safeKey = (r.id || r._key || r.receiptNumber).replace(/'/g, "\\'");
        
        return `<tr>
            <td><strong>${r.receiptNumber}</strong></td>
            <td>${formatDate(r.date)}</td>
            <td>${r.supplier}</td>
            <td>${r.linkedPO || '-'}</td>
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
    const content = `
        <div class="receipt-details">
            <div class="receipt-header">
                <h2>${docNum}</h2>
                <p><strong>${t('date')}:</strong> ${formatDate(date)}</p>
                <p><strong>${t('supplier')}:</strong> ${supplier}</p>
                ${linkedPO ? `<p><strong>${t('linkPO')}:</strong> ${linkedPO}</p>` : ''}
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
        const deliveries = await storage.getDeliveries(20);
        const tbody = document.getElementById('blTableBody');
        if (!tbody) return;
        
        if (!Array.isArray(deliveries) || deliveries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center">${t('noData')}</td></tr>`;
            return;
        }
        
        tbody.innerHTML = deliveries.map(d => {
            const invoiced = d.invoiceNumber ? true : false;
            const clientOrderNum = d.clientOrderNumber || d.linkedOrderNumber || '';
            return `<tr>
                <td><strong>${d.blNumber}</strong></td>
                <td>${formatDate(d.date)}</td>
                <td>${d.client}</td>
                <td>${clientOrderNum ? `<small>${clientOrderNum}</small>` : '-'}</td>
                <td>${d.total} PAC</td>
                <td>${formatCurrency(d.value || 0)} CZK</td>
                <td>${invoiced ? `<span class="status-badge status-ok">${d.invoiceNumber}</span>` : `<span class="status-badge">${t('no')}</span>`}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="viewDelivery('${d.id}')" title="${t('view')}">👁️</button>
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
    if (!po) return;
    
    if (confirm(`${po.poNumber} - ${t('markReceived')}?`)) {
        try {
            const result = await storage.processReceipt({
                bonNum: po.poNumber, items: po.items, supplier: po.supplier,
                date: new Date().toISOString(), currency: po.currency, linkedPO: poId
            });
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
                showToast(`${po.poNumber} ${t('saved')}`, 'success');
                await refreshAllData();
            }
        } catch (e) { showToast(t('error'), 'error'); }
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
            }
        } catch (e) {
            console.warn('Failed to load invoices from Google Sheets:', e);
        }
    }

    // Normalize isProforma field for all invoices
    invoices = invoices.map(inv => ({
        ...inv,
        isProforma: inv.isProforma || inv.type === 'proforma' || (inv.number && inv.number.startsWith('PF'))
    }));

    // Update localStorage with normalized data
    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));

    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    
    if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center">${t('noData')}</td></tr>`;
        updateInvoiceStats([]);
        return;
    }
    
    const typeFilter = document.getElementById('invoiceTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all';
    const monthFilter = document.getElementById('invoiceMonthFilter')?.value || '';

    let filtered = invoices;
    if (typeFilter === 'invoice') filtered = filtered.filter(inv => !inv.isProforma);
    else if (typeFilter === 'proforma') filtered = filtered.filter(inv => inv.isProforma);
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
    if (!inv.isProforma && inv.type !== 'proforma' && !(inv.number && inv.number.startsWith('PF'))) {
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
    let itemsHtml = (inv.items || []).map(item => {
        const itemSubtotal = item.qty * item.price;
        const itemVat = itemSubtotal * vatRate / 100;
        const itemTotal = itemSubtotal + itemVat;
        return `
        <tr>
            <td>${item.name}</td>
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
        const rate = inv.exchangeRate;
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
                    ${inv.clientOrderNumber ? `<p style="margin: 2px 0;"><strong>Číslo obj. zákazníka:</strong> ${inv.clientOrderNumber}</p>` : ''}
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
        </div>
    `;
    document.getElementById('invoicePreviewModal').classList.add('active');
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
        const isProformaDoc = inv.isProforma || inv.type === 'proforma' || (inv.number && inv.number.startsWith('PF'));
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

function onInvCurrencyChange() {
    const currency = document.getElementById('invCurrency').value;
    const rateGroup = document.getElementById('invExchangeRateGroup');
    if (currency === 'EUR') {
        rateGroup.style.display = 'block';
        document.getElementById('invExchangeRate').value = exchangeRate.toFixed(3);
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
            const match = inv.number.match(/FV(\d{4})(\d{3})/);
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
            const match = inv.number.match(/PF(\d{4})(\d{3})/);
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
    document.getElementById('invoicePreviewModal').classList.remove('active');
}

function printInvoice() {
    const originalTitle = document.title;
    document.title = currentInvoice?.number || 'Facture';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
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
                    <strong>TELEFON:</strong> ${company.phone || ''}<br>
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
                        <tr><td>Číslo objednávky:</td><td>${inv.linkedOrderNumber || inv.clientOrderNumber || ''}</td></tr>
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
                    <small>Vyhotovil: ${company.name || ''}</small>
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

    document.getElementById('invoicePreview').innerHTML = docHtml;
    document.getElementById('invoicePreviewModal').classList.add('active');
}

async function markProformaPaidAndGenerateTaxDoc(invNumber) {
    // Ask for payment date first
    const paymentDate = prompt('Datum přijetí platby (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!paymentDate) return;

    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const idx = invoices.findIndex(i => i.number === invNumber);
    if (idx < 0) return;

    const inv = invoices[idx];

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
                    <strong>TELEFON:</strong> ${company.phone || ''}<br>
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
                        <tr><td>Číslo objednávky:</td><td>${inv.linkedOrderNumber || inv.clientOrderNumber || ''}</td></tr>
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
                    <small>Vyhotovil: ${company.name || ''}</small>
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

    document.getElementById('invoicePreview').innerHTML = docHtml;
    document.getElementById('invoicePreviewModal').classList.add('active');
}

// Export for global access
window.generateTaxDocument = generateTaxDocument;
window.markProformaPaidAndGenerateTaxDoc = markProformaPaidAndGenerateTaxDoc;
window.generateTaxDocumentWithDate = generateTaxDocumentWithDate;
window.populatePaidProformaSelect = populatePaidProformaSelect;
window.onLinkedProformaChange = onLinkedProformaChange;
window.generateProformaDeductionHtml = generateProformaDeductionHtml;
window.generateProformaDeductionItemHtml = generateProformaDeductionItemHtml;

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
    
    document.getElementById('invNotes').value = `Obj.: ${order.orderNumber}`;
    calculateInvoiceTotal();
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
        if (name && qty > 0) {
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
        exchangeRate: currency === 'EUR' ? parseFloat(document.getElementById('invExchangeRate').value) || exchangeRate : null,
        paymentMethod: document.getElementById('invPaymentMethod').value,
        notes: document.getElementById('invNotes').value,
        linkedOrder: document.getElementById('invLinkedOrder').value,
        linkedOrderNumber: '', // Will be filled from linked order
        clientOrderNumber: '', // Will be filled from linked order
        linkedProforma: null, // Proforma deduction info
        // Deposit/acompte info for proformas
        depositPercent: isProforma ? depositPercent : null,
        depositAmount: isProforma ? depositAmount : null,
        paid: false,
        paidDate: null,
        createdAt: new Date().toISOString()
    };

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
            invoice.clientOrderNumber = linkedOrderData.clientOrderNumber || '';
        }
    }

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
    // Check if this is a proforma using all indicators
    const isProformaDoc = inv.isProforma || inv.type === 'proforma' || (inv.number && inv.number.startsWith('PF'));
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
            const match = q.number.match(/DEV(\d{4})(\d{3})/);
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

    populateClientSelect('quoteClient');
    populateQuoteItemSelect();

    document.getElementById('quoteItems').innerHTML = '';
    addQuoteItemRow();

    document.getElementById('quoteModal').classList.add('active');
}

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('active');
    editingQuoteId = null;
}

function closeQuotePreviewModal() {
    document.getElementById('quotePreviewModal').classList.remove('active');
}

function populateQuoteItemSelect() {
    const select = document.getElementById('quoteItemSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Sélectionner un article --</option>';

    if (typeof REPAIR_PRICE_LIST !== 'undefined') {
        REPAIR_PRICE_LIST.categories.forEach(cat => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat;
            const items = REPAIR_PRICE_LIST.items.filter(i => i.category === cat);
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = `${item.name} - ${formatCurrency(item.price)} CZK/${item.unit}`;
                opt.dataset.price = item.price;
                opt.dataset.name = item.name;
                opt.dataset.unit = item.unit;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        });
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

function onQuoteClientChange() {
    const select = document.getElementById('quoteClient');
    const clientId = select.value;
    if (!clientId) return;

    const contacts = getContacts();
    const client = contacts.find(c => c.id === clientId);

    if (client) {
        document.getElementById('quoteClientAddress').value = client.address || '';
        document.getElementById('quoteClientIco').value = client.ico || '';
        document.getElementById('quoteClientDic').value = client.dic || '';
    }
}

function saveQuote() {
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
        showToast(t('selectAtLeastOne') || 'Ajoutez au moins une ligne', 'error');
        return;
    }

    let quoteNumber = document.getElementById('quoteNumber').value;
    if (!editingQuoteId) {
        quoteNumber = getNextQuoteNumber(true);
    }

    const quote = {
        id: editingQuoteId || 'DEV-' + Date.now(),
        number: quoteNumber,
        client: document.getElementById('quoteClient').options[document.getElementById('quoteClient').selectedIndex]?.text || '',
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
        status: 'draft', // draft, sent, accepted, rejected
        createdAt: new Date().toISOString()
    };

    let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');

    if (editingQuoteId) {
        const index = quotes.findIndex(q => q.id === editingQuoteId);
        if (index >= 0) {
            quote.createdAt = quotes[index].createdAt;
            quote.status = quotes[index].status;
            quotes[index] = quote;
        }
    } else {
        quotes.unshift(quote);
    }

    localStorage.setItem('navalo_quotes', JSON.stringify(quotes));

    closeQuoteModal();
    updateQuotesDisplay();
    showToast(`${quote.number} ${t('saved')}`, 'success');
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
    document.getElementById('quoteClientAddress').value = quote.clientAddress || '';
    document.getElementById('quoteClientIco').value = quote.clientIco || '';
    document.getElementById('quoteClientDic').value = quote.clientDic || '';
    document.getElementById('quoteVatRate').value = quote.vatRate || 21;
    document.getElementById('quoteCurrency').value = quote.currency || 'CZK';
    document.getElementById('quoteNotes').value = quote.notes || '';

    populateClientSelect('quoteClient');
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

function deleteQuote(id) {
    if (!confirm(t('confirmDelete') || 'Supprimer ce devis ?')) return;

    let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    quotes = quotes.filter(q => q.id !== id);
    localStorage.setItem('navalo_quotes', JSON.stringify(quotes));

    updateQuotesDisplay();
    showToast(t('deleted') || 'Supprimé', 'success');
}

function updateQuoteStatus(id, status) {
    let quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');
    const index = quotes.findIndex(q => q.id === id);
    if (index >= 0) {
        quotes[index].status = status;
        localStorage.setItem('navalo_quotes', JSON.stringify(quotes));
        updateQuotesDisplay();
        showToast(t('saved'), 'success');
    }
}

function updateQuotesDisplay() {
    const quotes = JSON.parse(localStorage.getItem('navalo_quotes') || '[]');

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
        'draft': { label: 'Brouillon', class: 'badge-secondary' },
        'sent': { label: 'Envoyé', class: 'badge-info' },
        'accepted': { label: 'Accepté', class: 'badge-success' },
        'rejected': { label: 'Refusé', class: 'badge-danger' }
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
    const itemsHtml = quote.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">${formatCurrency(item.price)} ${quote.currency}</td>
            <td class="text-right">${formatCurrency(item.total)} ${quote.currency}</td>
        </tr>
    `).join('');

    return `
    <div class="quote-doc">
        <div class="inv-header">
            <div class="inv-company">
                <h2>NAVALO s.r.o.</h2>
                <p>Pod Rapidem 361, 251 63 Strančice</p>
                <p>IČO: 06301185 | DIČ: CZ06301185</p>
            </div>
            <div class="inv-info">
                <h1>DEVIS N° ${quote.number}</h1>
                <p><strong>Date:</strong> ${formatDate(quote.date)}</p>
                <p><strong>Valide jusqu'au:</strong> ${formatDate(quote.validUntil)}</p>
            </div>
        </div>

        <div class="inv-parties">
            <div class="inv-party">
                <h4>Client</h4>
                <div class="inv-party-box">
                    <strong>${quote.client}</strong><br>
                    ${quote.clientAddress || ''}<br>
                    ${quote.clientIco ? `IČO: ${quote.clientIco}` : ''}
                    ${quote.clientDic ? ` | DIČ: ${quote.clientDic}` : ''}
                </div>
            </div>
        </div>

        <table class="inv-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-center">Qté</th>
                    <th class="text-right">Prix unit.</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="text-right">Total HT:</td>
                    <td class="text-right">${formatCurrency(quote.subtotal)} ${quote.currency}</td>
                </tr>
                <tr>
                    <td colspan="3" class="text-right">TVA (${quote.vatRate}%):</td>
                    <td class="text-right">${formatCurrency(quote.vat)} ${quote.currency}</td>
                </tr>
                <tr class="inv-total">
                    <td colspan="3" class="text-right"><strong>Total TTC:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(quote.total)} ${quote.currency}</strong></td>
                </tr>
            </tfoot>
        </table>

        ${quote.notes ? `<div class="oc-notes"><h4>Notes / Conditions</h4><p>${quote.notes}</p></div>` : ''}

        <div class="oc-footer">
            <p>Ce devis est valable jusqu'au ${formatDate(quote.validUntil)}.</p>
            <p>Pour toute question, contactez-nous à navalo@navalo.cz</p>
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

    // Clear custom items
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

function calculateRecOrdTotal() {
    const models = getPacModels();
    let subtotal = 0;

    // PAC models
    models.forEach(model => {
        const qty = parseInt(document.getElementById(`recOrdQty-${model.id}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`recOrdPrice-${model.id}`)?.value) || 0;
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

    // Check if there are custom items
    const customItems = getRecOrdCustomItems();
    const hasCustomItems = customItems.length > 0;

    if (!hasQty && !hasCustomItems) {
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

    // Display existing file if any
    currentReceivedOrderFile = null;
    document.getElementById('recOrdFileName').textContent = order.fileName || '';

    populateClientSelect('recOrdClient');
    calculateRecOrdTotal();
    document.getElementById('receivedOrderModal').classList.add('active');
}

let _updatingReceivedOrders = false;

async function updateReceivedOrdersDisplay() {
    // Prevent concurrent updates that cause UI flickering
    if (_updatingReceivedOrders) return;
    _updatingReceivedOrders = true;

    try {
        let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');

        // Load from Google Sheets if connected
        if (storage.getMode() === 'googlesheets') {
            try {
                const remoteOrders = await storage.getReceivedOrders(100);
                if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
                    // Preserve local file data (not stored in Google Sheets)
                    const localOrders = orders;
                    orders = remoteOrders.map(remote => {
                        const local = localOrders.find(l => l.id === remote.id || l.orderNumber === remote.orderNumber);
                        if (local && local.fileData && !remote.fileData) {
                            return { ...remote, fileData: local.fileData, fileName: local.fileName, fileType: local.fileType };
                        }
                        return remote;
                    });
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
        console.log('📝 Current status:', orders[index].status);
        orders[index].status = 'delivered';
        orders[index].delivered = true;
        orders[index].deliveredDate = new Date().toISOString();
        localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
        console.log('✅ localStorage updated to delivered');
        
        // Sync to Google Sheets FIRST
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
    
    const numCols = 6 + models.length + 3;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${numCols}" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    const statusLabels = { new: t('recOrdNew'), confirmed: t('recOrdConfirmed'), delivered: t('recOrdDelivered'), invoiced: t('recOrdInvoiced') };
    const statusClasses = { new: 'badge-warning', confirmed: 'badge-info', delivered: 'badge-success', invoiced: 'badge-success' };
    
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

function viewOrderConfirmation(id) {
    const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    const order = orders.find(o => o.id === id);
    if (!order) return;
    window.currentReceivedOrder = order;

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

let autoRefreshInterval = null;
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

// Function to clear all local cache and reload from Google Sheets
async function clearLocalCache() {
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
        'navalo_quotes'
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
