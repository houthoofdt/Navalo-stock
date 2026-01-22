/* ========================================
   NAVALO Stock PAC - Application v4
   Complete with i18n, Contacts, History PAC only
   ======================================== */

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
let loadedComponentPrices = {}; // Prices loaded from Google Sheets

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
        qtyPlaceholder: 'Qté', pricePlaceholder: 'Prix unit.', addLine: '+ Ajouter',
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
        vatAmount: 'Montant TVA', linkPO: 'Lier à commande', linkReceipt: 'Lier à příjemka', attachFile: 'Joindre fichier',
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
        dataRefreshed: 'Données actualisées'
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
        qtyPlaceholder: 'Množství', pricePlaceholder: 'Jedn. cena', addLine: '+ Přidat',
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
        vatAmount: 'DPH', linkPO: 'Navázat na obj.', linkReceipt: 'Navázat na příjemku', attachFile: 'Připojit soubor',
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
        dataRefreshed: 'Data aktualizována'
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
    if (document.getElementById('entryBonNum')) document.getElementById('entryBonNum').value = getNextReceiptNumber();
    
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
            if (storage.getMode() === 'googlesheets') {
                const prices = await storage.getComponentPrices();
                if (prices && typeof prices === 'object') {
                    loadedComponentPrices = prices;
                    console.log('📦 Loaded', Object.keys(loadedComponentPrices).length, 'component prices from Google Sheets');
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

function getContacts() { return JSON.parse(localStorage.getItem('navalo_contacts') || '[]'); }
function saveContacts(contacts) { localStorage.setItem('navalo_contacts', JSON.stringify(contacts)); }

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

function saveContact() {
    const contact = {
        id: editingContactId || 'CONTACT-' + Date.now(),
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
    
    let contacts = getContacts();
    if (editingContactId) {
        const index = contacts.findIndex(c => c.id === editingContactId);
        if (index >= 0) { contact.createdAt = contacts[index].createdAt; contacts[index] = contact; }
    } else {
        contact.createdAt = new Date().toISOString();
        contacts.unshift(contact);
    }
    
    saveContacts(contacts);
    closeContactModal();
    updateContactsDisplay();
    populateSupplierSelects();
    populateClientSelects();
    showToast(t('saved'), 'success');
}

function deleteContact(id) {
    if (!confirm(t('confirmDelete'))) return;
    let contacts = getContacts().filter(c => c.id !== id);
    saveContacts(contacts);
    updateContactsDisplay();
    populateSupplierSelects();
    populateClientSelects();
    showToast(t('deleted'), 'success');
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
    
    // Delete from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            await storage.deleteDelivery(id);
        } catch (e) {
            console.warn('Failed to delete delivery from Google Sheets:', e);
        }
    }
    
    // Delete from localStorage
    let deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]').filter(d => d.id !== id);
    localStorage.setItem('navalo_deliveries', JSON.stringify(deliveries));
    await updateDeliveriesDisplay();
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
function printDelivery() { window.print(); }

// ========================================
// RECEIVED INVOICES - FP2026XXX
// ========================================

function getNextReceivedInvoiceNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();
    
    // Get existing invoices to find the highest number
    const existingInvoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    let maxNum = 0;
    
    existingInvoices.forEach(inv => {
        if (inv.internalNumber) {
            const match = inv.internalNumber.match(/FP(\d{4})(\d{3})/);
            if (match && parseInt(match[1]) === year) {
                const num = parseInt(match[2]);
                if (num > maxNum) maxNum = num;
            }
        }
    });
    
    if (config.fp_year !== year) { config.fp_year = year; config.next_fp = 1; }
    const configNum = config.next_fp || 1;
    const nextNum = Math.max(configNum, maxNum + 1);
    
    const fpNumber = `FP${year}${String(nextNum).padStart(3, '0')}`;
    if (consume) {
        config.next_fp = nextNum + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
    }
    return fpNumber;
}

function getNextReceiptNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();
    if (config.pr_year !== year) { config.pr_year = year; config.next_pr = 1; }
    const num = config.next_pr || 1;
    const prNumber = `PŘ${year}${String(num).padStart(3, '0')}`;
    if (consume) {
        config.next_pr = num + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
    }
    return prNumber;
}

function openReceivedInvoiceModal() {
    editingRecInvId = null;
    document.getElementById('recInvModalTitle').textContent = t('newReceivedInv');
    document.getElementById('receivedInvoiceForm').reset();
    document.getElementById('recInvFileName').textContent = '';
    currentReceivedInvoiceFile = null;
    document.getElementById('recInvInternalNum').value = getNextReceivedInvoiceNumber();
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
    document.getElementById('recInvDate').value = inv.date || '';
    document.getElementById('recInvDueDate').value = inv.dueDate || '';
    document.getElementById('recInvTaxDate').value = inv.taxDate || '';
    document.getElementById('recInvSubtotal').value = inv.subtotal || '';
    document.getElementById('recInvVatRate').value = inv.vatRate || 21;
    document.getElementById('recInvVat').value = inv.vat || '';
    document.getElementById('recInvTotal').value = inv.total || '';
    document.getElementById('recInvCurrency').value = inv.currency || 'CZK';
    document.getElementById('recInvNotes').value = inv.notes || '';
    if (inv.fileName) document.getElementById('recInvFileName').textContent = inv.fileName;
    
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
    const vat = Math.round(subtotal * vatRate) / 100;
    document.getElementById('recInvVat').value = vat.toFixed(2);
    document.getElementById('recInvTotal').value = (subtotal + vat).toFixed(2);
}

async function saveReceivedInvoice() {
    let fileData = null;
    if (currentReceivedInvoiceFile) {
        try { fileData = await fileToBase64(currentReceivedInvoiceFile); } catch (e) { console.error(e); }
    }
    
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    let existingFileData = null, existingFileName = null, existingFileType = null;
    if (editingRecInvId) {
        const existingInv = invoices.find(i => i.id === editingRecInvId);
        if (existingInv && !fileData) {
            existingFileData = existingInv.fileData;
            existingFileName = existingInv.fileName;
            existingFileType = existingInv.fileType;
        }
    }
    
    // Get internal number - consume only if new invoice
    let internalNumber = document.getElementById('recInvInternalNum').value;
    if (!editingRecInvId) {
        internalNumber = getNextReceivedInvoiceNumber(true);
    }
    
    const invoice = {
        id: editingRecInvId || 'RINV-' + Date.now(),
        internalNumber: internalNumber,
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
        createdAt: new Date().toISOString()
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
            console.log('Google Sheets sync result:', result);
        }
    } catch (e) {
        console.error('Sync to Google Sheets failed:', e);
    }
    
    editingRecInvId = null;
    closeReceivedInvoiceModal();
    updateReceivedInvoicesDisplay();
    showToast(`${invoice.internalNumber} ${t('saved')}`, 'success');
}

async function updateReceivedInvoicesDisplay() {
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    
    // Load from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteInvoices = await storage.getReceivedInvoices(100);
            if (Array.isArray(remoteInvoices) && remoteInvoices.length > 0) {
                // Merge: prefer remote data, add local-only items
                const remoteIds = new Set(remoteInvoices.map(i => i.id || i.internalNumber));
                const localOnly = invoices.filter(i => !remoteIds.has(i.id) && !remoteIds.has(i.internalNumber));
                invoices = [...remoteInvoices, ...localOnly];
                localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
            }
        } catch (e) {
            console.warn('Failed to load received invoices from Google Sheets:', e);
        }
    }
    
    const statusFilter = document.getElementById('recInvStatusFilter')?.value || '';
    const monthFilter = document.getElementById('recInvMonthFilter')?.value || '';
    
    let filtered = invoices;
    if (statusFilter === 'paid') filtered = filtered.filter(inv => inv.paid);
    else if (statusFilter === 'unpaid') filtered = filtered.filter(inv => !inv.paid);
    if (monthFilter) filtered = filtered.filter(inv => inv.date?.startsWith(monthFilter));
    
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
        tbody.innerHTML = `<tr><td colspan="11" class="text-muted text-center">${t('noData')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(inv => {
        const isOverdue = !inv.paid && inv.dueDate && new Date(inv.dueDate) < new Date();
        const statusLabel = inv.paid ? t('paid') : (isOverdue ? t('overdue') : t('unpaid'));
        const statusClass = inv.paid ? 'badge-success' : (isOverdue ? 'badge-danger' : 'badge-warning');
        return `<tr class="${isOverdue ? 'row-warning' : ''}">
            <td><strong>${inv.internalNumber || '-'}</strong></td>
            <td>${inv.number}${inv.fileData ? ' 📎' : ''}</td>
            <td>${inv.supplier}</td>
            <td>${formatDate(inv.date)}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td>${inv.linkedReceipt || '-'}</td>
            <td class="text-right">${formatCurrency(inv.subtotal)}</td>
            <td class="text-right">${formatCurrency(inv.vat)}</td>
            <td class="text-right"><strong>${formatCurrency(inv.total)} ${inv.currency}</strong></td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>
                ${inv.fileData ? `<button class="btn-icon" onclick="viewReceivedInvoicePDF('${inv.id}')" title="${t('viewPDF')}">👁️</button>` : ''}
                <button class="btn-icon" onclick="editReceivedInvoice('${inv.id}')" title="${t('edit')}">✏️</button>
                ${!inv.paid ? `<button class="btn-icon" onclick="markRecInvPaid('${inv.id}')" title="${t('markPaid')}">💰</button>` : ''}
                <button class="btn-icon" onclick="deleteRecInv('${inv.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function viewReceivedInvoicePDF(id) {
    const invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const inv = invoices.find(i => i.id === id);
    if (!inv?.fileData) { showToast(t('noData'), 'warning'); return; }
    const win = window.open();
    if (win) {
        win.document.write(`<html><head><title>${inv.internalNumber}</title></head><body style="margin:0"><embed src="${inv.fileData}" type="${inv.fileType || 'application/pdf'}" width="100%" height="100%"></body></html>`);
    } else {
        const link = document.createElement('a');
        link.href = inv.fileData;
        link.download = inv.fileName || `faktura_${inv.internalNumber}.pdf`;
        link.click();
    }
}

function markRecInvPaid(id) {
    if (!confirm(t('confirmMarkPaid'))) return;
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]');
    const index = invoices.findIndex(inv => inv.id === id);
    if (index >= 0) {
        invoices[index].paid = true;
        invoices[index].paidDate = new Date().toISOString();
        localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
        updateReceivedInvoicesDisplay();
        showToast(t('saved'), 'success');
    }
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
    let invoices = JSON.parse(localStorage.getItem('navalo_received_invoices') || '[]').filter(inv => inv.id !== id);
    localStorage.setItem('navalo_received_invoices', JSON.stringify(invoices));
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
                getNextReceiptNumber(true); // Increment the counter
            }
            if (linkedPO) await storage.updatePurchaseOrder({ poId: linkedPO, status: 'Reçu' });
            showToast(`${bonNum} ${t('saved')}`, 'success');
            clearEntryForm();
            await refreshAllData();
        } else { showToast(result.error || t('error'), 'error'); }
    } catch (e) { showToast(t('error'), 'error'); }
}

function clearEntryForm() {
    document.getElementById('entryForm')?.reset();
    document.getElementById('entryBonNum').value = getNextReceiptNumber();
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
        document.getElementById('entryBonNum').value = po.poNumber;
        
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
    
    // Load from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteReceipts = await storage.getReceipts(200);
            if (Array.isArray(remoteReceipts) && remoteReceipts.length > 0) {
                receipts = remoteReceipts;
                localStorage.setItem('navalo_receipts', JSON.stringify(receipts));
                console.log('📦 Loaded', receipts.length, 'receipts from Google Sheets');
            }
        } catch (e) {
            console.warn('Failed to load receipts from Google Sheets:', e);
        }
    }
    
    // Fallback to local history if no receipts from Google Sheets
    if (receipts.length === 0) {
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        // Filter only entries (ENTRÉE/PŘÍJEM)
        const entries = history.filter(h => h.type === 'ENTRÉE' || h.type === 'PŘÍJEM');
        
        // Group entries by docNum (receipt number) - handle undefined properly
        const receiptGroups = {};
        entries.forEach((entry, idx) => {
            // Create a unique key - check for undefined/null/empty
            let key = entry.docNum || entry.bonNum;
            if (!key || key === 'undefined' || key === 'null') {
                key = `IMPORT-${(entry.date || '').split('T')[0]}-${idx}`;
            }
            
            if (!receiptGroups[key]) {
                receiptGroups[key] = {
                    id: key,
                    receiptNumber: (!entry.docNum || entry.docNum === 'undefined') ? `#${Object.keys(receiptGroups).length + 1}` : entry.docNum,
                    date: entry.date,
                    supplier: entry.partner || entry.supplier || '-',
                    linkedPO: entry.linkedPO || '',
                    currency: entry.currency || 'CZK',
                    items: [],
                    _key: key
                };
            }
            receiptGroups[key].items.push({
                ref: entry.ref,
                name: entry.name,
                qty: entry.qty,
                price: entry.priceUnit || 0
            });
        });
        
        receipts = Object.values(receiptGroups);
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
    addPOItemRow();
    updatePOTotal();
}

function closePOModal() { document.getElementById('poModal').classList.remove('active'); editingPOId = null; }

function addPOItemRow(ref = '', qty = '') {
    const container = document.getElementById('poItems');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <select class="item-ref" required onchange="updatePOTotal(); autoFillPrice(this)"><option value="">${t('refPlaceholder')}</option></select>
        <input type="number" class="item-qty" placeholder="${t('qtyPlaceholder')}" min="1" value="${qty}" required onchange="updatePOTotal()">
        <input type="number" class="item-price" placeholder="${t('pricePlaceholder')}" min="0" step="0.01" onchange="updatePOTotal()">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.item-row').remove(); updatePOTotal()">✕</button>`;
    container.appendChild(row);
    
    // Filter by selected supplier
    const supplierName = document.getElementById('poSupplier').value;
    populateComponentSelectsBySupplier('poItems', supplierName);
    
    if (ref) setTimeout(() => { row.querySelector('.item-ref').value = ref; autoFillPrice(row.querySelector('.item-ref')); updatePOTotal(); }, 50);
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
    
    document.getElementById('poPreview').innerHTML = `
        <div class="delivery-note po-note">
            <div class="dn-header">
                <div class="dn-company"><h2>${config.COMPANY.name}</h2><p>${config.COMPANY.address}</p></div>
                <div class="dn-info"><h1>${t('purchaseOrder')}</h1><h2>${po.poNumber}</h2><p>${t('date')}: ${formatDate(po.date)}</p></div>
            </div>
            <div class="dn-addresses">
                <div class="dn-address"><h4>${t('from')}</h4><div class="dn-address-box"><strong>${config.COMPANY.name}</strong><br>${config.COMPANY.address}</div></div>
                <div class="dn-address"><h4>${t('to')}</h4><div class="dn-address-box"><strong>${po.supplier}</strong></div></div>
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
function printPO() { window.print(); }

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
    
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    
    if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center">${t('noData')}</td></tr>`;
        updateInvoiceStats([]);
        return;
    }
    
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'all';
    const monthFilter = document.getElementById('invoiceMonthFilter')?.value || '';
    
    let filtered = invoices;
    if (statusFilter === 'paid') filtered = filtered.filter(inv => inv.paid);
    else if (statusFilter === 'unpaid') filtered = filtered.filter(inv => !inv.paid);
    if (monthFilter) filtered = filtered.filter(inv => inv.date?.substring(0, 7) === monthFilter);
    
    updateInvoiceStats(invoices);
    
    tbody.innerHTML = filtered.map(inv => {
        const isOverdue = !inv.paid && new Date(inv.dueDate) < new Date();
        const statusClass = inv.paid ? 'status-ok' : (isOverdue ? 'status-critical' : 'status-low');
        const statusText = inv.paid ? t('paid') : (isOverdue ? t('overdue') : t('unpaid'));
        return `<tr class="${isOverdue && !inv.paid ? 'row-warning' : ''}">
            <td><strong>${inv.number}</strong></td>
            <td>${formatDate(inv.date)}</td>
            <td>${inv.client}</td>
            <td>${formatDate(inv.dueDate)}</td>
            <td class="text-right">${formatCurrency(inv.subtotal || 0)}</td>
            <td class="text-right">${formatCurrency(inv.vat || 0)}</td>
            <td class="text-right font-bold">${formatCurrency(inv.total)} ${inv.currency}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-outline btn-small" onclick="viewInvoice('${inv.number}')" title="${t('view')}">👁️</button>
                ${!inv.paid ? `<button class="btn btn-primary btn-small" onclick="markInvoicePaid('${inv.number}')" title="${t('markPaid')}">💰</button>` : ''}
                <button class="btn btn-outline btn-small" onclick="deleteInvoice('${inv.number}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function updateInvoiceStats(invoices) {
    const unpaid = invoices.filter(inv => !inv.paid);
    const overdue = unpaid.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date());
    const unpaidTotal = unpaid.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    document.getElementById('invoiceTotalCount').textContent = invoices.length;
    document.getElementById('invoiceUnpaidCount').textContent = unpaid.length;
    document.getElementById('invoiceUnpaidValue').textContent = formatCurrency(unpaidTotal);
    const overdueEl = document.getElementById('invoiceOverdueCount');
    if (overdueEl) overdueEl.textContent = overdue.length;
}

function viewInvoice(invNumber) {
    const invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const inv = invoices.find(i => i.number === invNumber);
    if (!inv) return;
    
    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const pcs = t('pieces');
    
    let itemsHtml = (inv.items || []).map(item => `
        <tr>
            <td>${item.name}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">${formatCurrency(item.price)} ${inv.currency}</td>
            <td class="text-right">${formatCurrency(item.total)} ${inv.currency}</td>
        </tr>
    `).join('');
    
    const bankInfo = inv.currency === 'EUR' ? company.bank?.EUR : company.bank?.CZK;
    
    // CZK conversion section for EUR invoices
    let czkConversionHtml = '';
    if (inv.currency === 'EUR' && inv.exchangeRate) {
        const rate = inv.exchangeRate;
        const subtotalCZK = inv.subtotal * rate;
        const vatCZK = inv.vat * rate;
        const totalCZK = inv.total * rate;
        
        czkConversionHtml = `
            <div class="inv-czk-conversion">
                <h4>💱 ${t('czkEquivalent')} ČNB ${rate.toFixed(3)} CZK/EUR (k DUZP ${formatDate(inv.taxDate || inv.date)})</h4>
                <table class="czk-table">
                    <tr>
                        <td>${t('subtotalCZK')}:</td>
                        <td class="text-right"><strong>${formatCurrency(subtotalCZK)} CZK</strong></td>
                    </tr>
                    <tr>
                        <td>${t('vatCZK')} (${inv.vatRate || 21}%):</td>
                        <td class="text-right"><strong>${formatCurrency(vatCZK)} CZK</strong></td>
                    </tr>
                    <tr class="czk-total">
                        <td>${t('totalCZK')}:</td>
                        <td class="text-right"><strong>${formatCurrency(totalCZK)} CZK</strong></td>
                    </tr>
                </table>
            </div>
        `;
    }
    
    document.getElementById('invoicePreview').innerHTML = `
        <div class="invoice-doc">
            <div class="inv-header">
                <div class="inv-company">
                    <h2>${company.name || 'NAVALO s.r.o.'}</h2>
                    <p>${company.address || ''}</p>
                    <p>IČO: ${company.ico || ''} | DIČ: ${company.dic || ''}</p>
                </div>
                <div class="inv-info">
                    <h1>${t('invoice')} ${inv.number}</h1>
                    <p>${t('issueDate')}: ${formatDate(inv.date)}</p>
                    <p>${t('taxDate')}: ${formatDate(inv.taxDate || inv.date)}</p>
                    <p>${t('dueDate')}: ${formatDate(inv.dueDate)}</p>
                    <p>VS: ${inv.varSymbol || inv.number}</p>
                    ${inv.linkedOrderNumber ? `<p><strong>${t('orderNum') || 'Objednávka'}:</strong> ${inv.linkedOrderNumber}</p>` : ''}
                    ${inv.clientOrderNumber ? `<p><strong>${t('clientOrderNum')}:</strong> ${inv.clientOrderNumber}</p>` : ''}
                </div>
            </div>
            <div class="inv-parties">
                <div class="inv-party">
                    <h4>${t('supplier')}</h4>
                    <div class="inv-party-box">
                        <strong>${company.name || 'NAVALO s.r.o.'}</strong><br>
                        ${company.address || ''}<br>
                        IČO: ${company.ico || ''}<br>
                        DIČ: ${company.dic || ''}
                    </div>
                </div>
                <div class="inv-party">
                    <h4>${t('customer')}</h4>
                    <div class="inv-party-box">
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
                    <tr><td colspan="3" class="text-right">${t('subtotal')}:</td><td class="text-right">${formatCurrency(inv.subtotal)} ${inv.currency}</td></tr>
                    <tr><td colspan="3" class="text-right">${t('vat')} (${inv.vatRate || 21}%):</td><td class="text-right">${formatCurrency(inv.vat)} ${inv.currency}</td></tr>
                    <tr class="inv-total"><td colspan="3" class="text-right"><strong>${t('totalTTC')}:</strong></td><td class="text-right"><strong>${formatCurrency(inv.total)} ${inv.currency}</strong></td></tr>
                </tfoot>
            </table>
            ${czkConversionHtml}
            <div class="inv-payment">
                <h4>${t('bankDetails')}</h4>
                <p><strong>${bankInfo?.name || ''}</strong></p>
                <p>Účet: ${bankInfo?.account || ''}</p>
                <p>IBAN: ${bankInfo?.iban || ''}</p>
                <p>BIC: ${bankInfo?.bic || ''}</p>
            </div>
        </div>
    `;
    document.getElementById('invoicePreviewModal').classList.add('active');
}

function openFreeInvoiceModal() {
    editingInvoiceNumber = null;
    document.getElementById('invoiceModalTitle').textContent = t('newInvoice');
    document.getElementById('invoiceForm').reset();
    document.getElementById('invNumber').value = getNextInvoiceNumber();
    
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
    document.getElementById('invItems').innerHTML = '';
    addInvoiceItemRow();
    
    document.getElementById('invoiceModal').classList.add('active');
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

function createInvoiceFromBL(blId) {
    const deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
    const delivery = deliveries.find(d => d.id === blId);
    if (!delivery) return;
    
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
    const qty = delivery.quantities || {};
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
function markInvoicePaid(invNumber) {
    if (!confirm(t('confirmMarkPaid'))) return;
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
    const index = invoices.findIndex(inv => inv.number === invNumber);
    if (index >= 0) {
        invoices[index].paid = true;
        invoices[index].paidDate = new Date().toISOString();
        localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
        updateInvoicesDisplay();
        showToast(t('saved'), 'success');
    }
}
function deleteInvoice(invNumber) {
    if (!confirm(t('confirmDelete'))) return;
    let invoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]').filter(inv => inv.number !== invNumber);
    localStorage.setItem('navalo_invoices', JSON.stringify(invoices));
    updateInvoicesDisplay();
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
    
    tbody.innerHTML = bomItems.map(item => {
        const stock = currentStock[item.ref]?.qty || 0;
        const ok = stock >= item.qty;
        const unitPrice = getComponentPrice(item.ref, 'EUR') || 0;
        const lineTotal = unitPrice * item.qty;
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

function getNextInvoiceNumber(consume = false) {
    const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
    const year = new Date().getFullYear();
    
    // Get existing invoices to find the highest number
    const existingInvoices = JSON.parse(localStorage.getItem('navalo_invoices') || '[]');
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
    }
    return fvNumber;
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('active');
    editingInvoiceNumber = null;
}

function closeInvoicePreviewModal() {
    document.getElementById('invoicePreviewModal').classList.remove('active');
}

function printInvoice() { window.print(); }

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
    
    const vatRate = parseFloat(document.getElementById('invVatRate').value) || 21;
    const vat = Math.round(subtotal * vatRate) / 100;
    const total = subtotal + vat;
    
    document.getElementById('invSubtotal').value = subtotal.toFixed(2);
    document.getElementById('invVat').value = vat.toFixed(2);
    document.getElementById('invTotal').value = total.toFixed(2);
}

function saveIssuedInvoice() {
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
    
    // Get invoice number - consume only if new invoice
    let invNumber = document.getElementById('invNumber').value;
    if (!editingInvoiceNumber) {
        invNumber = getNextInvoiceNumber(true);
    }
    
    const currency = document.getElementById('invCurrency').value;
    const invoice = {
        number: invNumber,
        varSymbol: document.getElementById('invVarSymbol').value || invNumber,
        client: document.getElementById('invClient').options[document.getElementById('invClient').selectedIndex]?.text || '',
        clientIco: document.getElementById('invClientIco').value,
        clientDic: document.getElementById('invClientDic').value,
        clientAddress: document.getElementById('invClientAddress').value,
        date: document.getElementById('invDate').value,
        dueDate: document.getElementById('invDueDate').value,
        taxDate: document.getElementById('invTaxDate').value,
        items: items,
        subtotal: parseFloat(document.getElementById('invSubtotal').value) || 0,
        vatRate: parseFloat(document.getElementById('invVatRate').value) || 21,
        vat: parseFloat(document.getElementById('invVat').value) || 0,
        total: parseFloat(document.getElementById('invTotal').value) || 0,
        currency: currency,
        exchangeRate: currency === 'EUR' ? parseFloat(document.getElementById('invExchangeRate').value) || exchangeRate : null,
        paymentMethod: document.getElementById('invPaymentMethod').value,
        notes: document.getElementById('invNotes').value,
        linkedOrder: document.getElementById('invLinkedOrder').value,
        linkedOrderNumber: '', // Will be filled from linked order
        clientOrderNumber: '', // Will be filled from linked order
        paid: false,
        paidDate: null,
        createdAt: new Date().toISOString()
    };
    
    // Get order details if linked
    if (invoice.linkedOrder) {
        const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const linkedOrderData = orders.find(o => o.id === invoice.linkedOrder);
        if (linkedOrderData) {
            invoice.linkedOrderNumber = linkedOrderData.orderNumber || '';
            invoice.clientOrderNumber = linkedOrderData.clientOrderNumber || '';
        }
    }
    
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
    
    // Update linked order status
    if (invoice.linkedOrder) {
        let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === invoice.linkedOrder);
        if (orderIndex >= 0) {
            orders[orderIndex].status = 'invoiced';
            orders[orderIndex].invoiceNumber = invoice.number;
            localStorage.setItem('navalo_received_orders', JSON.stringify(orders));
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
    updateInvoicesDisplay();
    updateDeliveriesDisplay();
    updateReceivedOrdersDisplay();
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
    document.getElementById('invDate').value = inv.date;
    document.getElementById('invDueDate').value = inv.dueDate;
    document.getElementById('invTaxDate').value = inv.taxDate || '';
    document.getElementById('invVatRate').value = inv.vatRate || 21;
    document.getElementById('invCurrency').value = inv.currency || 'CZK';
    document.getElementById('invPaymentMethod').value = inv.paymentMethod || 'bank';
    document.getElementById('invNotes').value = inv.notes || '';
    document.getElementById('invClientAddress').value = inv.clientAddress || '';
    document.getElementById('invClientIco').value = inv.clientIco || '';
    document.getElementById('invClientDic').value = inv.clientDic || '';
    
    // Exchange rate for EUR invoices
    if (inv.currency === 'EUR') {
        document.getElementById('invExchangeRateGroup').style.display = 'block';
        document.getElementById('invExchangeRate').value = inv.exchangeRate || exchangeRate;
    } else {
        document.getElementById('invExchangeRateGroup').style.display = 'none';
    }
    
    populateClientSelect('invClient');
    populateRecOrderSelect();
    
    // Load items
    document.getElementById('invItems').innerHTML = '';
    (inv.items || []).forEach(item => {
        addInvoiceItemRow(item.name, item.qty, item.price);
    });
    
    calculateInvoiceTotal();
    document.getElementById('invoiceModal').classList.add('active');
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

function calculateRecOrdTotal() {
    const models = getPacModels();
    let subtotal = 0;
    
    models.forEach(model => {
        const qty = parseInt(document.getElementById(`recOrdQty-${model.id}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`recOrdPrice-${model.id}`)?.value) || 0;
        subtotal += qty * price;
    });
    
    const total = subtotal * 1.21;
    
    document.getElementById('recOrdSubtotal').value = subtotal.toFixed(2);
    document.getElementById('recOrdTotal').value = total.toFixed(2);
}

async function saveReceivedOrder() {
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
    
    if (!hasQty) {
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
        subtotal: parseFloat(document.getElementById('recOrdSubtotal').value) || 0,
        total: parseFloat(document.getElementById('recOrdTotal').value) || 0,
        notes: document.getElementById('recOrdNotes').value,
        status: 'new',
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    
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
    document.getElementById('recOrdDate').value = order.date;
    document.getElementById('recOrdDeliveryDate').value = order.deliveryDate;
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
    
    populateClientSelect('recOrdClient');
    calculateRecOrdTotal();
    document.getElementById('receivedOrderModal').classList.add('active');
}

async function updateReceivedOrdersDisplay() {
    let orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
    
    // Load from Google Sheets if connected
    if (storage.getMode() === 'googlesheets') {
        try {
            const remoteOrders = await storage.getReceivedOrders(100);
            if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
                orders = remoteOrders;
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
        
        return `
        <tr>
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.clientOrderNumber || '-'}</td>
            <td>${formatDate(order.date)}</td>
            <td>${order.client}</td>
            <td>${formatDate(order.deliveryDate)}</td>
            ${modelCells}
            <td class="text-right">${formatCurrency(order.total)} ${order.currency}</td>
            <td><span class="badge ${statusClasses[orderStatus] || 'badge-warning'}">${statusLabels[orderStatus] || t('recOrdNew')}</span></td>
            <td>
                <button class="btn-icon" onclick="viewOrderConfirmation('${order.id}')" title="${t('view')}">👁️</button>
                ${canConfirm ? `<button class="btn-icon" onclick="confirmReceivedOrder('${order.id}')" title="${t('confirmOrderStatus')}">✓</button>` : ''}
                ${canDeliver ? `<button class="btn-icon" onclick="markOrderDelivered('${order.id}')" title="${t('markDelivered')}">📦</button>` : ''}
                ${canInvoice ? `<button class="btn-icon" onclick="createInvoiceFromOrder('${order.id}')" title="${t('createInvoice')}">🧾</button>` : ''}
                <button class="btn-icon" onclick="editReceivedOrder('${order.id}')" title="${t('edit')}">✏️</button>
                <button class="btn-icon" onclick="deleteReceivedOrder('${order.id}')" title="${t('delete')}">🗑️</button>
            </td>
        </tr>
    `}).join('');
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
        
        return `
        <tr>
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.clientOrderNumber || '-'}</td>
            <td>${formatDate(order.date)}</td>
            <td>${order.client}</td>
            <td>${formatDate(order.deliveryDate)}</td>
            ${modelCells}
            <td class="text-right">${formatCurrency(order.total)} ${order.currency}</td>
            <td><span class="badge ${statusClasses[orderStatus] || 'badge-warning'}">${statusLabels[orderStatus] || t('recOrdNew')}</span></td>
            <td>
                <button class="btn-icon" onclick="viewOrderConfirmation('${order.id}')" title="${t('view')}">👁️</button>
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
    
    const config = CONFIG || {};
    const company = config.COMPANY || {};
    const pcs = t('pieces');
    const models = getPacModels();
    
    // Generate items rows dynamically
    let itemsHtml = models.map(model => {
        const qty = order.quantities?.[model.id] || 0;
        const price = order.prices?.[model.id] || 0;
        if (qty > 0) {
            return `<tr><td>${model.fullName}</td><td class="text-right">${qty}</td><td class="text-right">${formatCurrency(price)} ${order.currency}</td><td class="text-right">${formatCurrency(qty * price)} ${order.currency}</td></tr>`;
        }
        return '';
    }).join('');
    
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
                    <tr><td colspan="3" class="text-right">${t('subtotal')}:</td><td class="text-right">${formatCurrency(order.subtotal)} ${order.currency}</td></tr>
                    <tr><td colspan="3" class="text-right">${t('vat')} (21%):</td><td class="text-right">${formatCurrency(order.total - order.subtotal)} ${order.currency}</td></tr>
                    <tr class="oc-total"><td colspan="3" class="text-right"><strong>${t('totalTTC')}:</strong></td><td class="text-right"><strong>${formatCurrency(order.total)} ${order.currency}</strong></td></tr>
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

function printOrderConfirm() { window.print(); }

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
const AUTO_REFRESH_DELAY = 30000; // 30 seconds

function startAutoRefresh() {
    if (autoRefreshInterval) return; // Already running
    
    autoRefreshInterval = setInterval(async () => {
        if (autoRefreshPaused) return;
        if (document.hidden) return; // Don't refresh if tab is not visible
        
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
        if (!document.hidden && storage.getMode() === 'googlesheets') {
            await refreshFromGoogleSheets();
        }
    });
    
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
window.deleteReceivedOrder = deleteReceivedOrder;
window.editReceivedOrder = editReceivedOrder;
