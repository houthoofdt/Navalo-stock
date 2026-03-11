/* ========================================
   NAVALO Stock PAC - Storage Module v4
   With FIFO, CNB Rates, Stock Valuation
   HISTORY: PAC products only (not components)
   ======================================== */

class StorageAdapter {
    constructor() {
        this.mode = 'local';
        this.apiUrl = '';
        this.exchangeRates = { EUR: 25.0 };
        this.hybridMode = false;
        this.syncInterval = 300000; // 5 minutes par défaut
        this.syncTimer = null;
    }

    async init() {
        if (typeof CONFIG !== 'undefined' && checkConfig()) {
            this.mode = CONFIG.STORAGE_MODE;
            this.apiUrl = CONFIG.API_URL;
            this.hybridMode = CONFIG.HYBRID_MODE || false;
            this.syncInterval = CONFIG.SYNC_INTERVAL || 300000;

            if (this.hybridMode) {
                console.log('⚡ Mode Hybride activé (local + sync Google Sheets)');
                await this.initLocalStorage();
                await this.initSyncSystem();
                await this.fetchExchangeRate();
            } else {
                console.log('📊 Mode Google Sheets activé');
                await this.fetchExchangeRate();
            }
        } else {
            this.mode = 'local';
            console.log('💾 Mode local activé');
            await this.initLocalStorage();
        }
        return true;
    }

    async initLocalStorage() {
        if (!localStorage.getItem('navalo_purchase_orders')) {
            localStorage.setItem('navalo_purchase_orders', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_stock_lots')) {
            localStorage.setItem('navalo_stock_lots', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_deliveries')) {
            localStorage.setItem('navalo_deliveries', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_history')) {
            localStorage.setItem('navalo_history', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_contacts')) {
            localStorage.setItem('navalo_contacts', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_adjustments')) {
            localStorage.setItem('navalo_adjustments', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_config')) {
            localStorage.setItem('navalo_config', JSON.stringify({
                next_bl: 1,
                next_po: 1,
                next_fp: 1,
                next_adj: 1,
                year: new Date().getFullYear(),
                fp_year: new Date().getFullYear()
            }));
        }

        // Initialize sync system for hybrid mode
        if (!localStorage.getItem('navalo_sync_queue')) {
            localStorage.setItem('navalo_sync_queue', JSON.stringify([]));
        }
        if (!localStorage.getItem('navalo_sync_status')) {
            localStorage.setItem('navalo_sync_status', JSON.stringify({
                lastSync: null,
                nextSync: null,
                pendingItems: 0,
                syncInterval: this.syncInterval,
                enabled: true,
                errors: []
            }));
        }
        
        // Subcontracting orders
        if (!localStorage.getItem('navalo_subcontracting_orders')) {
            localStorage.setItem('navalo_subcontracting_orders', JSON.stringify([]));
        }

        // Always update BOM from code (config data, not user data)
        if (typeof SAMPLE_BOM !== 'undefined') {
            localStorage.setItem('navalo_bom', JSON.stringify(SAMPLE_BOM));
        }
        
        if (!localStorage.getItem('navalo_stock') && typeof generateInitialStock === 'function') {
            const initialData = generateInitialStock();
            localStorage.setItem('navalo_stock', JSON.stringify(initialData.components));
            localStorage.setItem('navalo_pac_stock', JSON.stringify(initialData.pac));
        }
    }

    // ========================================
    // HYBRID MODE - SYNC SYSTEM
    // ========================================

    async initSyncSystem() {
        // Start periodic sync
        this.startPeriodicSync();

        // Sync any pending items from previous session
        const queue = this.getSyncQueue();
        if (queue.length > 0) {
            console.log(`🔄 ${queue.length} opérations en attente de synchronisation`);
            // Don't block init, sync in background
            setTimeout(() => this.processSyncQueue(), 5000);
        }
    }

    startPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(async () => {
            await this.processSyncQueue();
        }, this.syncInterval);

        console.log(`⏰ Synchronisation automatique toutes les ${this.syncInterval / 1000}s`);
    }

    stopPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    getSyncQueue() {
        return JSON.parse(localStorage.getItem('navalo_sync_queue') || '[]');
    }

    getSyncStatus() {
        return JSON.parse(localStorage.getItem('navalo_sync_status') || '{}');
    }

    updateSyncStatus(updates) {
        const status = this.getSyncStatus();
        Object.assign(status, updates);
        localStorage.setItem('navalo_sync_status', JSON.stringify(status));

        // Dispatch event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: status }));
        }
    }

    addToSyncQueue(action, data) {
        const queue = this.getSyncQueue();
        const item = {
            id: 'SYNC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            action,
            data,
            status: 'pending',
            retries: 0,
            error: null
        };

        queue.push(item);
        localStorage.setItem('navalo_sync_queue', JSON.stringify(queue));

        this.updateSyncStatus({
            pendingItems: queue.filter(i => i.status === 'pending').length
        });

        console.log(`📝 Ajouté à la queue: ${action}`);
    }

    async processSyncQueue() {
        if (!this.hybridMode || !this.apiUrl) return;

        const queue = this.getSyncQueue();
        const pending = queue.filter(item => item.status === 'pending' || item.status === 'error');

        if (pending.length === 0) {
            this.updateSyncStatus({
                lastSync: new Date().toISOString(),
                nextSync: new Date(Date.now() + this.syncInterval).toISOString(),
                pendingItems: 0
            });
            return;
        }

        console.log(`🔄 Synchronisation de ${pending.length} opérations...`);
        let synced = 0;
        let errors = 0;

        for (const item of pending) {
            try {
                item.status = 'syncing';
                localStorage.setItem('navalo_sync_queue', JSON.stringify(queue));

                // Call Google Sheets API
                await this.apiPostDirect(item.action, item.data);

                item.status = 'synced';
                item.syncedAt = new Date().toISOString();
                synced++;

            } catch (error) {
                console.error(`❌ Erreur sync ${item.action}:`, error);
                item.status = 'error';
                item.retries++;
                item.error = error.message;
                errors++;

                // Remove from queue after 5 failed attempts
                if (item.retries >= 5) {
                    console.warn(`⚠️ Opération abandonnée après 5 tentatives: ${item.action}`);
                    item.status = 'failed';
                }
            }
        }

        // Remove synced items older than 24h
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const cleanedQueue = queue.filter(item => {
            if (item.status === 'synced') {
                const syncTime = new Date(item.syncedAt || item.timestamp).getTime();
                return syncTime > oneDayAgo;
            }
            return item.status !== 'failed';
        });

        localStorage.setItem('navalo_sync_queue', JSON.stringify(cleanedQueue));

        this.updateSyncStatus({
            lastSync: new Date().toISOString(),
            nextSync: new Date(Date.now() + this.syncInterval).toISOString(),
            pendingItems: cleanedQueue.filter(i => i.status === 'pending').length,
            errors: cleanedQueue.filter(i => i.status === 'error').map(i => ({
                action: i.action,
                error: i.error,
                retries: i.retries
            }))
        });

        console.log(`✅ Synchronisation terminée: ${synced} réussies, ${errors} erreurs`);
    }

    async apiPostDirect(action, data) {
        // Direct API call to Google Sheets (used by sync queue)
        const formData = new FormData();
        formData.append('payload', JSON.stringify({ action, ...data }));

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            return { success: true, raw: text };
        }
    }

    // ========================================
    // API HELPERS
    // ========================================

    async apiGet(action, params = {}) {
        // Mode local : lire localement uniquement
        if (this.mode === 'local') {
            return this.localGet(action, params);
        }

        // Mode hybride : lire localement (rapide) + fetch Google Sheets si vide
        if (this.hybridMode) {
            const localData = this.localGet(action, params);

            // Si localStorage est vide (après reset), charger depuis Google Sheets
            let isEmpty = false;

            if (localData === null || localData === undefined) {
                isEmpty = true;
            } else if (Array.isArray(localData)) {
                isEmpty = localData.length === 0;
            } else if (typeof localData === 'object') {
                isEmpty = Object.keys(localData).length === 0;
            } else {
                isEmpty = !localData;
            }

            if (isEmpty) {
                console.log('📥 localStorage vide, chargement depuis Google Sheets:', action);
                // Fetch from Google Sheets and cache locally
                try {
                    const remoteData = await this.fetchFromGoogleSheets(action, params);
                    // Cache it locally for next time
                    this.cacheDataLocally(action, remoteData);
                    return remoteData;
                } catch (error) {
                    console.error('Failed to fetch from Google Sheets:', error);
                    return localData; // Return empty local data as fallback
                }
            }

            return localData;
        }

        // Mode Google Sheets pur : appel API direct (lent)
        return await this.fetchFromGoogleSheets(action, params);
    }

    async fetchFromGoogleSheets(action, params = {}) {
        const url = new URL(this.apiUrl);
        url.searchParams.append('action', action);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        try {
            const response = await fetch(url.toString());
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    cacheDataLocally(action, data) {
        // Cache fetched data to localStorage based on action type
        switch(action) {
            case 'getReceivedOrders':
                localStorage.setItem('navalo_received_orders', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'received orders to localStorage');
                // Rebuild order number counter
                this.rebuildConfigCounters('ro', data);
                break;
            case 'getDeliveries':
                localStorage.setItem('navalo_deliveries', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'deliveries to localStorage');
                // Rebuild BL number counter
                this.rebuildConfigCounters('bl', data);
                break;
            case 'getPurchaseOrders':
                localStorage.setItem('navalo_purchase_orders', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'purchase orders to localStorage');
                // Rebuild PO number counter
                this.rebuildConfigCounters('po', data);
                break;
            case 'getStock':
                if (data?.components) {
                    localStorage.setItem('navalo_stock', JSON.stringify(data.components));
                    console.log('💾 Cached stock to localStorage');
                }
                break;
            case 'getHistory':
                localStorage.setItem('navalo_history', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'history entries to localStorage');
                break;
            case 'getAdjustments':
                localStorage.setItem('navalo_adjustments', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'adjustments to localStorage');
                // Rebuild adjustment number counter
                this.rebuildConfigCounters('adj', data);
                break;
            case 'getContacts':
                localStorage.setItem('navalo_contacts', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'contacts to localStorage');
                break;
            case 'getRepairQuotes':
                localStorage.setItem('navalo_repair_quotes', JSON.stringify(data || []));
                console.log('💾 Cached', data?.length || 0, 'repair quotes to localStorage');
                // Rebuild repair quote number counter
                this.rebuildConfigCounters('rq', data);
                break;
            // Add more cases as needed
        }
    }

    rebuildConfigCounters(type, documents) {
        if (!Array.isArray(documents) || documents.length === 0) return;

        const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
        const year = new Date().getFullYear();

        // Map type to document number field and config key
        const mapping = {
            'bl': { field: 'blNumber', key: 'next_bl' },
            'po': { field: 'poNumber', key: 'next_po' },
            'ro': { field: 'orderNumber', key: 'next_ro' },
            'adj': { field: 'docNum', key: 'next_adj' },
            'rq': { field: 'quoteNumber', key: 'next_repair_quote' }
        };

        const { field, key } = mapping[type] || {};
        if (!field || !key) return;

        // Find highest number for current year
        let maxNum = 0;
        const pattern = new RegExp(`^(?:BL|OP|OBJ|ADJ|DV)?${year}(\\d+)$`);

        documents.forEach(doc => {
            const docNum = doc[field];
            if (docNum) {
                const match = String(docNum).match(pattern);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });

        // Set next number to max + 1
        if (maxNum > 0) {
            config[key] = maxNum + 1;
            config.year = year;
            localStorage.setItem('navalo_config', JSON.stringify(config));
            console.log(`🔢 Rebuilt ${key}: next number will be ${config[key]} (found max: ${maxNum})`);
        }
    }

    async apiPost(action, data) {
        // Mode local : traiter localement uniquement
        if (this.mode === 'local') {
            return this.localPost(action, data);
        }

        // Mode hybride : traiter localement + ajouter à la queue de sync
        if (this.hybridMode) {
            const result = this.localPost(action, data);
            this.addToSyncQueue(action, data);
            return result;
        }

        // Mode Google Sheets pur : appel API direct (lent)
        try {
            const formData = new FormData();
            formData.append('payload', JSON.stringify({ action, ...data }));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData,
                redirect: 'follow'
            });

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                console.log('Response:', text);
                return { success: true, raw: text };
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ========================================
    // EXCHANGE RATES
    // ========================================

    async fetchExchangeRate() {
        try {
            if (this.mode === 'googlesheets') {
                const result = await this.apiGet('getExchangeRate', { currency: 'EUR' });
                if (result.rate) {
                    this.exchangeRates.EUR = result.rate;
                }
            }
        } catch (error) {
            console.log('Using default exchange rate');
        }
        return this.exchangeRates;
    }

    getExchangeRate(currency) {
        if (currency === 'CZK') return 1;
        return this.exchangeRates[currency] || 25.0;
    }

    convertToCZK(amount, currency) {
        return amount * this.getExchangeRate(currency);
    }

    // ========================================
    // DOCUMENT NUMBERING (2026XXX)
    // ========================================

    getNextDocNumber(type) {
        const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
        const year = new Date().getFullYear();
        
        if (config.year !== year) {
            config.year = year;
            config.next_bl = 1;
            config.next_po = 1;
        }
        
        const key = type === 'bl' ? 'next_bl' : 'next_po';
        const num = config[key] || 1;
        const docNumber = `${year}${String(num).padStart(3, '0')}`;
        
        config[key] = num + 1;
        localStorage.setItem('navalo_config', JSON.stringify(config));
        
        return docNumber;
    }

    // ========================================
    // LOCAL STORAGE OPERATIONS
    // ========================================

    localGet(action, params) {
        switch(action) {
            case 'getStock':
            case 'getStockWithValue':
                return this.localGetStockWithValue();
            case 'getBom':
                return JSON.parse(localStorage.getItem('navalo_bom') || '{}');
            case 'getPacStock':
                return JSON.parse(localStorage.getItem('navalo_pac_stock') || '{}');
            case 'getHistory':
                const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
                return history.slice(0, params.limit || 100);
            case 'getDeliveries':
                const deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
                return deliveries.slice(0, params.limit || 50);
            case 'getPurchaseOrders':
                const pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
                return pos.slice(0, params.limit || 50);
            case 'getStockValuation':
                return this.localGetStockValuation();
            case 'getSuggestedOrders':
                return this.localGetSuggestedOrders();
            case 'getExchangeRate':
                return { currency: params.currency, rate: this.getExchangeRate(params.currency) };
            case 'getContacts':
                return JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
            case 'getReceivedOrders':
                const orders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
                // Ensure retrocompatibility: initialize new fields if missing
                orders.forEach(order => {
                    if (!order.deliveredQuantities) {
                        order.deliveredQuantities = {};
                    }
                    if (!order.remainingQuantities) {
                        order.remainingQuantities = { ...order.quantities };
                    }
                    if (!order.deliveries) {
                        order.deliveries = [];
                    }
                });
                return orders.slice(0, params.limit || 50);
            case 'getSubcontractingOrders':
                const scOrders = JSON.parse(localStorage.getItem('navalo_subcontracting_orders') || '[]');
                return scOrders.slice(0, params.limit || 100);
            default:
                return null;
        }
    }

    localPost(action, data) {
        switch(action) {
            case 'processReceipt':
                return this.localProcessReceipt(data);
            case 'processDelivery':
                return this.localProcessDelivery(data);
            case 'processAdjustment':
                return this.localProcessAdjustment(data);
            case 'createPurchaseOrder':
                return this.localCreatePurchaseOrder(data);
            case 'updatePurchaseOrder':
                return this.localUpdatePurchaseOrder(data);
            case 'createReceivedOrder':
                return { success: true, message: 'Saved locally' };
            case 'updateReceivedOrder':
                return { success: true, message: 'Updated locally' };
            case 'createReceivedInvoice':
                return { success: true, message: 'Saved locally' };
            case 'updateReceivedInvoice':
                return { success: true, message: 'Updated locally' };
            case 'createInvoice':
                return { success: true, message: 'Saved locally' };
            case 'saveContact':
                return this.localSaveContact(data);
            case 'updateComponentPrice':
                return { success: true, message: 'Saved locally' };
            default:
                return { error: 'Action non supportée' };
        }
    }

    localSaveContact(data) {
        let contacts = JSON.parse(localStorage.getItem('navalo_contacts') || '[]');
        if (data.id) {
            const index = contacts.findIndex(c => c.id === data.id);
            if (index >= 0) {
                contacts[index] = data;
            } else {
                contacts.push(data);
            }
        } else {
            data.id = 'CONTACT-' + Date.now();
            contacts.push(data);
        }
        localStorage.setItem('navalo_contacts', JSON.stringify(contacts));
        return { success: true, id: data.id };
    }

    localGetStockWithValue() {
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        const lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        // For initial stock (without lots), use fixed rate from 01.01.2026
        // This rate should be approximately 25.2 CZK/EUR based on CNB
        const initialExchangeRate = 25.2; // Rate from 01.01.2026

        let totalValue = 0;
        const byCategory = {};

        Object.keys(stock).forEach(ref => {
            const componentLots = lots.filter(l => l.ref === ref && l.qtyRemaining > 0);
            let value = 0;

            if (componentLots.length > 0) {
                // Calculate value from FIFO lots (uses rate from receipt date)
                componentLots.forEach(lot => {
                    value += lot.qtyRemaining * lot.priceCZK;
                });
            } else {
                // No lots - use COMPONENT_PRICES with initial rate (01.01.2026)
                const qty = stock[ref].qty || 0;
                if (qty > 0 && typeof getComponentPrice === 'function') {
                    const priceEur = getComponentPrice(ref, 'EUR');
                    if (priceEur) {
                        value = qty * priceEur * initialExchangeRate;
                    }
                }
            }

            stock[ref].value = Math.round(value * 100) / 100;
            totalValue += value;

            const cat = stock[ref].category || 'autre';
            byCategory[cat] = (byCategory[cat] || 0) + value;
        });

        return {
            components: stock,
            totalValue: Math.round(totalValue * 100) / 100,
            byCategory
        };
    }

    localGetStockValuation() {
        const result = this.localGetStockWithValue();
        return {
            totalValue: result.totalValue,
            byCategory: result.byCategory
        };
    }

    localGetSuggestedOrders() {
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        const suggested = [];
        
        Object.entries(stock).forEach(([ref, data]) => {
            const qty = data.qty || 0;
            const min = data.min || 0;
            if (qty < min) {
                suggested.push({
                    ref,
                    name: data.name,
                    current: qty,
                    min,
                    toOrder: min - qty + Math.ceil(min * 0.5)
                });
            }
        });
        
        return suggested.sort((a, b) => (a.current / a.min) - (b.current / b.min));
    }

    validatePartialReceipt(poId, items) {
        const purchaseOrders = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        const po = purchaseOrders.find(p => p.id === poId);

        if (!po) {
            return { valid: false, errors: ['Commande fournisseur non trouvée'] };
        }

        const errors = [];

        // Initialize remainingQuantities if not present
        if (!po.remainingQuantities) {
            po.remainingQuantities = {};
            (po.items || []).forEach(item => {
                po.remainingQuantities[item.ref] = item.qty;
            });
        }

        // Validate each item quantity
        items.forEach(item => {
            const { ref, qty } = item;
            if (qty > 0) {
                const remainingQty = po.remainingQuantities[ref] || 0;
                if (qty > remainingQty) {
                    const orderedItem = (po.items || []).find(i => i.ref === ref);
                    const name = orderedItem?.name || ref;
                    errors.push(`${name}: impossible de recevoir ${qty} (restant: ${remainingQty})`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    localProcessReceipt(data) {
        const { items, supplier, bonNum, date, currency, linkedPO } = data;
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        let purchaseOrders = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        
        const exchangeRate = this.getExchangeRate(currency);
        const results = [];
        
        items.forEach(item => {
            const { ref, qty, price } = item;
            if (!ref || qty <= 0) return;
            
            const priceCZK = currency === 'CZK' ? price : price * exchangeRate;
            
            // Add lot (FIFO)
            lots.push({
                id: 'LOT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                ref,
                date: date || new Date().toISOString(),
                qty,
                qtyRemaining: qty,
                priceOriginal: price,
                currency,
                priceCZK,
                supplier,
                bonNum
            });
            
            // Update stock quantity
            if (!stock[ref]) {
                stock[ref] = { name: ref, qty: 0, min: 0 };
            }
            stock[ref].qty = (stock[ref].qty || 0) + qty;
            
            // Add to history (component entry)
            history.unshift({
                date: date || new Date().toISOString(),
                type: 'ENTRÉE',
                docNum: bonNum,
                ref,
                name: stock[ref].name || ref,
                qty,
                priceUnit: priceCZK,
                value: qty * priceCZK,
                partner: supplier
            });
            
            results.push({ ref, qty, priceCZK });
        });

        // Update linked Purchase Order if specified
        if (linkedPO) {
            const poIndex = purchaseOrders.findIndex(po => po.id === linkedPO);
            if (poIndex >= 0) {
                const po = purchaseOrders[poIndex];

                // Initialize partial receipt fields if not present
                if (!po.deliveredQuantities) {
                    po.deliveredQuantities = {};
                }
                if (!po.remainingQuantities) {
                    // Build remainingQuantities from items
                    po.remainingQuantities = {};
                    (po.items || []).forEach(item => {
                        po.remainingQuantities[item.ref] = item.qty;
                    });
                }
                if (!po.receipts) {
                    po.receipts = [];
                }

                // Update delivered and remaining quantities
                items.forEach(item => {
                    const { ref, qty } = item;
                    po.deliveredQuantities[ref] = (po.deliveredQuantities[ref] || 0) + qty;

                    // Calculate remaining based on ordered quantity
                    const orderedQty = (po.items || []).find(i => i.ref === ref)?.qty || 0;
                    po.remainingQuantities[ref] = orderedQty - po.deliveredQuantities[ref];
                });

                // Add to receipts history
                po.receipts.push({
                    bonNum,
                    date: date || new Date().toISOString(),
                    items: items.map(i => ({ ref: i.ref, qty: i.qty, price: i.price }))
                });

                // Update PO status based on remaining quantities
                const hasRemaining = Object.values(po.remainingQuantities).some(q => q > 0);
                if (!hasRemaining) {
                    po.status = 'Reçu';
                } else if (po.receipts.length > 0) {
                    po.status = 'Partiel';
                }

                purchaseOrders[poIndex] = po;
            }
        }

        // Save receipt to receipts history
        let receipts = JSON.parse(localStorage.getItem('navalo_receipts') || '[]');
        const receiptId = 'REC-' + Date.now();
        receipts.unshift({
            id: receiptId,
            receiptNumber: bonNum,
            date: date || new Date().toISOString(),
            supplier,
            currency,
            linkedPO: linkedPO || '',
            items: results.map(r => ({ ref: r.ref, qty: r.qty, price: r.priceCZK })),
            itemCount: results.length,
            totalValue: results.reduce((sum, r) => sum + (r.qty * r.priceCZK), 0),
            exchangeRate
        });

        localStorage.setItem('navalo_stock', JSON.stringify(stock));
        localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
        localStorage.setItem('navalo_history', JSON.stringify(history));
        localStorage.setItem('navalo_receipts', JSON.stringify(receipts));
        if (linkedPO) {
            localStorage.setItem('navalo_purchase_orders', JSON.stringify(purchaseOrders));
        }

        return { success: true, processed: results.length, items: results, exchangeRate };
    }

    // ========================================
    // DELIVERY - HISTORY SHOWS PAC ONLY
    // ========================================

    validatePartialDelivery(orderId, quantities) {
        const receivedOrders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');
        const order = receivedOrders.find(o => o.id === orderId);

        if (!order) {
            return { valid: false, errors: ['Commande non trouvée'] };
        }

        const errors = [];

        // Initialize remainingQuantities if not present
        const remaining = order.remainingQuantities || { ...order.quantities };

        // Validate each model quantity
        Object.entries(quantities).forEach(([model, qty]) => {
            if (qty > 0) {
                const remainingQty = remaining[model] || 0;
                if (qty > remainingQty) {
                    errors.push(`${model}: impossible de livrer ${qty} (restant: ${remainingQty})`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    localProcessDelivery(data) {
        const { client, clientAddress, notes, date, linkedOrderId } = data;
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        const bom = JSON.parse(localStorage.getItem('navalo_bom') || '{}');
        let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        const deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
        let receivedOrders = JSON.parse(localStorage.getItem('navalo_received_orders') || '[]');

        // Handle both old format (quantities) and new format (items)
        let items;
        if (data.items) {
            items = data.items;
        } else if (data.quantities) {
            // Convert old format to new format for retrocompatibility
            items = { pac: data.quantities, components: [], custom: [] };
        } else {
            return { success: false, error: 'No items specified' };
        }

        const quantities = items.pac || {};
        
        // Calculate required components
        const required = {};
        const errors = [];
        
        Object.entries(quantities).forEach(([model, qty]) => {
            if (qty <= 0) return;
            const bomItems = bom[model] || [];
            bomItems.forEach(item => {
                if (!required[item.ref]) {
                    required[item.ref] = { name: item.name, qty: 0, available: stock[item.ref]?.qty || 0 };
                }
                required[item.ref].qty += item.qty * qty;
            });
        });
        
        // Check availability
        Object.entries(required).forEach(([ref, data]) => {
            if (data.available < data.qty) {
                errors.push({ ref, name: data.name, required: data.qty, available: data.available });
            }
        });
        
        if (errors.length > 0) {
            return { success: false, errors };
        }
        
        // Generate BL number
        const blNumber = this.getNextDocNumber('bl');
        
        // FIFO deduction for components (internal - NOT in history)
        let totalValue = 0;
        
        Object.entries(required).forEach(([ref, data]) => {
            let qtyToDeduct = data.qty;
            
            const refLots = lots
                .filter(l => l.ref === ref && l.qtyRemaining > 0)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let deductedValue = 0;
            
            for (const lot of refLots) {
                if (qtyToDeduct <= 0) break;
                
                const deductFromLot = Math.min(qtyToDeduct, lot.qtyRemaining);
                lot.qtyRemaining -= deductFromLot;
                deductedValue += deductFromLot * lot.priceCZK;
                qtyToDeduct -= deductFromLot;
            }
            
            totalValue += deductedValue;
            
            // Update stock
            stock[ref].qty -= data.qty;
            
            // NO component-level history entries - only PAC level
        });
        
        // ========================================
        // HISTORY: ADD PAC PRODUCTS ONLY
        // ========================================
        
        Object.entries(quantities).forEach(([model, qty]) => {
            if (qty <= 0) return;
            
            // Calculate average value per PAC for this model
            const bomItems = bom[model] || [];
            let modelValue = 0;
            bomItems.forEach(item => {
                const refLots = lots
                    .filter(l => l.ref === item.ref)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Get average price from lots
                let avgPrice = 0;
                let totalQty = 0;
                refLots.forEach(lot => {
                    if (lot.qtyRemaining > 0 || lot.qty > 0) {
                        avgPrice += lot.priceCZK * lot.qty;
                        totalQty += lot.qty;
                    }
                });
                if (totalQty > 0) avgPrice = avgPrice / totalQty;
                
                modelValue += item.qty * avgPrice;
            });
            
            // Add PAC to history (not components)
            history.unshift({
                date: date || new Date().toISOString(),
                type: 'SORTIE',
                docNum: blNumber,
                ref: model,
                name: `Heat Pump Module ${model}`,
                qty: -qty,
                priceUnit: modelValue,
                value: -(qty * modelValue),
                partner: client
            });
        });

        // ========================================
        // PROCESS DIRECT COMPONENTS (items.components)
        // ========================================

        const componentItems = items.components || [];
        componentItems.forEach(item => {
            const { ref, name, qty } = item;
            if (!ref || qty <= 0) return;

            // Deduct from stock
            if (stock[ref]) {
                stock[ref].qty -= qty;
            }

            // Deduct from lots (FIFO)
            let qtyToDeduct = qty;
            const refLots = lots
                .filter(l => l.ref === ref && l.qtyRemaining > 0)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            let deductedValue = 0;
            for (const lot of refLots) {
                if (qtyToDeduct <= 0) break;
                const deductFromLot = Math.min(qtyToDeduct, lot.qtyRemaining);
                lot.qtyRemaining -= deductFromLot;
                deductedValue += deductFromLot * lot.priceCZK;
                qtyToDeduct -= deductFromLot;
            }

            totalValue += deductedValue;

            // Add to history
            history.unshift({
                date: date || new Date().toISOString(),
                type: 'SORTIE',
                docNum: blNumber,
                ref,
                name: name || ref,
                qty: -qty,
                priceUnit: deductedValue / qty,
                value: -deductedValue,
                partner: client
            });
        });

        // ========================================
        // CUSTOM ITEMS (no stock deduction)
        // ========================================

        const customItems = items.custom || [];

        // Record delivery
        const deliveryId = 'DEL-' + Date.now();
        const totalPac = (quantities['TX9'] || 0) + (quantities['TX12-3PH'] || 0) + (quantities['TX12-1PH'] || 0);
        const totalComponents = componentItems.reduce((sum, item) => sum + item.qty, 0);
        const totalCustom = customItems.reduce((sum, item) => sum + item.qty, 0);

        // Find linked order for partial delivery tracking
        let linkedOrder = null;
        let linkedOrderNumber = '';
        let isPartial = false;
        let remainingOnOrder = {};

        if (linkedOrderId) {
            const orderIndex = receivedOrders.findIndex(o => o.id === linkedOrderId);
            if (orderIndex >= 0) {
                linkedOrder = receivedOrders[orderIndex];
                linkedOrderNumber = linkedOrder.orderNumber || '';

                // Initialize partial delivery fields if not present
                if (!linkedOrder.deliveredQuantities) {
                    linkedOrder.deliveredQuantities = {};
                }
                if (!linkedOrder.remainingQuantities) {
                    linkedOrder.remainingQuantities = { ...linkedOrder.quantities };
                }
                if (!linkedOrder.deliveries) {
                    linkedOrder.deliveries = [];
                }

                // Update delivered and remaining quantities
                Object.entries(quantities).forEach(([model, qty]) => {
                    if (qty > 0) {
                        linkedOrder.deliveredQuantities[model] = (linkedOrder.deliveredQuantities[model] || 0) + qty;
                        linkedOrder.remainingQuantities[model] = (linkedOrder.quantities[model] || 0) - linkedOrder.deliveredQuantities[model];
                    }
                });

                // Add to deliveries history
                linkedOrder.deliveries.push({
                    deliveryId,
                    blNumber,
                    date: date || new Date().toISOString(),
                    quantities: { ...quantities }
                });

                // Update order status based on remaining quantities
                const hasRemaining = Object.values(linkedOrder.remainingQuantities).some(q => q > 0);
                if (!hasRemaining) {
                    linkedOrder.status = 'delivered';
                    linkedOrder.delivered = true;
                } else {
                    linkedOrder.status = 'partial';
                    isPartial = true;
                }

                // Save snapshot of remaining quantities for delivery record
                remainingOnOrder = { ...linkedOrder.remainingQuantities };

                // Update the order in the array
                receivedOrders[orderIndex] = linkedOrder;
            }
        }

        deliveries.unshift({
            id: deliveryId,
            date: date || new Date().toISOString(),
            blNumber,
            client,
            clientAddress,
            tx9: quantities['TX9'] || 0,
            tx12_3ph: quantities['TX12-3PH'] || 0,
            tx12_1ph: quantities['TX12-1PH'] || 0,
            total: totalPac,
            componentItems: componentItems.length > 0 ? componentItems : undefined,
            customItems: customItems.length > 0 ? customItems : undefined,
            totalComponents,
            totalCustom,
            value: Math.round(totalValue * 100) / 100,
            status: 'Créé',
            notes,
            linkedOrderId: linkedOrderId || '',
            linkedOrderNumber,
            isPartial,
            remainingOnOrder
        });

        localStorage.setItem('navalo_stock', JSON.stringify(stock));
        localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
        localStorage.setItem('navalo_history', JSON.stringify(history));
        localStorage.setItem('navalo_deliveries', JSON.stringify(deliveries));
        if (linkedOrderId) {
            localStorage.setItem('navalo_received_orders', JSON.stringify(receivedOrders));
        }

        return {
            success: true,
            deliveryId,
            blNumber,
            totalPac,
            totalComponents,
            totalCustom,
            totalValue: Math.round(totalValue * 100) / 100,
            componentsDeducted: Object.keys(required).length
        };
    }

    // ========================================
    // STOCK ADJUSTMENTS
    // ========================================

    localProcessAdjustment(data) {
        const { ref, newQty, reason, reasonText, date, userName } = data;

        // Validation
        if (!ref || typeof newQty !== 'number' || newQty < 0) {
            return { success: false, error: 'Données invalides' };
        }

        if (!reason || !reasonText) {
            return { success: false, error: 'Raison obligatoire' };
        }

        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        let adjustments = JSON.parse(localStorage.getItem('navalo_adjustments') || '[]');
        const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');

        // Check if ref exists
        if (!stock[ref]) {
            return { success: false, error: 'Référence non trouvée' };
        }

        const currentQty = stock[ref].qty || 0;
        const qtyChange = newQty - currentQty;

        // No change
        if (qtyChange === 0) {
            return { success: false, error: 'Aucun changement de quantité' };
        }

        // Generate document number
        const year = new Date(date || new Date()).getFullYear();
        if (config.year !== year) {
            config.year = year;
            config.next_adj = 1;
        }
        const adjNum = config.next_adj || 1;
        const docNum = `ADJ-${year}${String(adjNum).padStart(3, '0')}`;
        config.next_adj = adjNum + 1;

        let valueImpact = 0;
        const lotsAffected = [];

        if (qtyChange > 0) {
            // INCREASE: Create new FIFO lot with average price
            // First try lots with remaining quantity
            const existingLotsWithQty = lots.filter(l => l.ref === ref && l.qtyRemaining > 0);
            let avgPrice = 0;

            if (existingLotsWithQty.length > 0) {
                const totalValue = existingLotsWithQty.reduce((sum, l) => sum + (l.qtyRemaining * l.priceCZK), 0);
                const totalQty = existingLotsWithQty.reduce((sum, l) => sum + l.qtyRemaining, 0);
                avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
            }

            // If no price found, try all lots (including exhausted ones) for historical average
            if (avgPrice === 0) {
                const allRefLots = lots.filter(l => l.ref === ref);
                if (allRefLots.length > 0) {
                    const totalValue = allRefLots.reduce((sum, l) => sum + (l.qty * l.priceCZK), 0);
                    const totalQty = allRefLots.reduce((sum, l) => sum + l.qty, 0);
                    avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
                }
            }

            // If still no price, try COMPONENT_PRICES
            if (avgPrice === 0 && typeof getComponentPrice === 'function') {
                const priceEur = getComponentPrice(ref, 'EUR');
                if (priceEur) {
                    avgPrice = priceEur * 25.2; // Use initial rate
                }
            }

            const newLot = {
                id: 'LOT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                ref,
                date: date || new Date().toISOString(),
                qty: qtyChange,
                qtyRemaining: qtyChange,
                priceOriginal: avgPrice,
                currency: 'CZK',
                priceCZK: avgPrice,
                supplier: 'ADJUSTMENT',
                bonNum: docNum
            };

            lots.push(newLot);
            lotsAffected.push(newLot.id);
            valueImpact = qtyChange * avgPrice;

        } else {
            // DECREASE: Deduct using FIFO
            // For adjustments, we allow deduction even if lots don't match perfectly
            // (to handle inventory corrections and data inconsistencies)
            let qtyToDeduct = Math.abs(qtyChange);
            const refLots = lots
                .filter(l => l.ref === ref && l.qtyRemaining > 0)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            for (const lot of refLots) {
                if (qtyToDeduct <= 0) break;

                const deductFromLot = Math.min(qtyToDeduct, lot.qtyRemaining);
                lot.qtyRemaining -= deductFromLot;
                valueImpact -= deductFromLot * lot.priceCZK;
                qtyToDeduct -= deductFromLot;
                lotsAffected.push(lot.id);
            }

            // For adjustments, we don't block if lots are insufficient
            // The stock quantity will be updated anyway (inventory correction)
            // The remaining quantity just won't have a FIFO lot associated
            if (qtyToDeduct > 0) {
                console.warn(`Adjustment: Insufficient FIFO lots for ${ref}, remaining ${qtyToDeduct} units not deducted from lots`);
            }
        }

        // Update stock quantity
        stock[ref].qty = newQty;

        // Create adjustment record
        const adjustmentId = 'ADJ-' + Date.now();
        const adjustment = {
            id: adjustmentId,
            docNum,
            date: date || new Date().toISOString(),
            ref,
            name: stock[ref].name || ref,
            qtyBefore: currentQty,
            qtyAfter: newQty,
            qtyChange,
            reason,
            reasonText: reasonText.substring(0, 500),
            userName: userName || 'Unknown',
            lotsAffected,
            valueImpact: Math.round(valueImpact * 100) / 100,
            createdAt: new Date().toISOString()
        };

        adjustments.unshift(adjustment);

        // Add to history
        history.unshift({
            date: date || new Date().toISOString(),
            type: 'AJUSTEMENT',
            docNum,
            ref,
            name: stock[ref].name || ref,
            qty: qtyChange,
            priceUnit: qtyChange !== 0 ? Math.abs(valueImpact / qtyChange) : 0,
            value: valueImpact,
            partner: 'Ajustement de stock',
            reason: reasonText
        });

        // Save all
        localStorage.setItem('navalo_stock', JSON.stringify(stock));
        localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
        localStorage.setItem('navalo_history', JSON.stringify(history));
        localStorage.setItem('navalo_adjustments', JSON.stringify(adjustments));
        localStorage.setItem('navalo_config', JSON.stringify(config));

        return {
            success: true,
            docNum,
            adjustmentId,
            qtyChange,
            valueImpact: Math.round(valueImpact * 100) / 100
        };
    }

    localCreatePurchaseOrder(data) {
        try {
            const { supplier, items, notes, expectedDate, currency } = data;
            let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
            
            const poNumber = this.getNextDocNumber('po');
            const poId = 'PO-' + Date.now();
            
            let totalValue = 0;
            items.forEach(item => {
                totalValue += (item.price || 0) * (item.qty || 0);
            });
            
            const newPO = {
                id: poId,
                date: new Date().toISOString(),
                poNumber,
                supplier,
                status: 'Brouillon',
                itemCount: items.length,
                totalValue,
                currency: currency || 'CZK',
                notes: notes || '',
                expectedDate: expectedDate || '',
                items
            };
            
            pos.unshift(newPO);
            localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
            
            return { success: true, poId, poNumber, totalValue, itemCount: items.length };
        } catch (e) {
            console.error('localCreatePurchaseOrder error:', e);
            return { success: false, error: e.message };
        }
    }

    localUpdatePurchaseOrder(data) {
        const { poId, status } = data;
        let pos = JSON.parse(localStorage.getItem('navalo_purchase_orders') || '[]');
        
        const poIndex = pos.findIndex(p => p.id === poId);
        if (poIndex === -1) {
            return { success: false, error: 'Commande non trouvée' };
        }
        
        if (status) {
            pos[poIndex].status = status;
            pos[poIndex].updatedAt = new Date().toISOString();
        }
        
        localStorage.setItem('navalo_purchase_orders', JSON.stringify(pos));
        
        return { success: true };
    }

    // ========================================
    // PUBLIC API
    // ========================================

    async getStock() {
        return await this.apiGet('getStock');
    }

    async getStockWithValue() {
        return await this.apiGet('getStockWithValue');
    }

    async getBom() {
        return await this.apiGet('getBom');
    }

    async saveBom(bomData) {
        return await this.apiPost('saveBom', bomData);
    }

    async getHistory(limit = 100) {
        return await this.apiGet('getHistory', { limit });
    }

    async getDeliveries(limit = 50) {
        return await this.apiGet('getDeliveries', { limit });
    }

    async getReceipts(limit = 50) {
        return await this.apiGet('getReceipts', { limit });
    }

    async deleteDelivery(data) {
        // data can be { id } or { id, quantities, blNumber } for stock restoration
        if (typeof data === 'string') data = { id: data };
        return await this.apiPost('deleteDelivery', data);
    }

    async getPurchaseOrders(limit = 50) {
        return await this.apiGet('getPurchaseOrders', { limit });
    }

    async getStockValuation() {
        return await this.apiGet('getStockValuation');
    }

    async getSuggestedOrders() {
        return await this.apiGet('getSuggestedOrders');
    }

    async processReceipt(data) {
        return await this.apiPost('processReceipt', data);
    }

    async processDelivery(data) {
        return await this.apiPost('processDelivery', data);
    }

    async deductStockForComponents(components, docNumber, client, date) {
        return await this.apiPost('deductStockForComponents', {
            components,
            docNumber,
            client,
            date: date || new Date().toISOString()
        });
    }

    async createPurchaseOrder(data) {
        return await this.apiPost('createPurchaseOrder', data);
    }

    async updatePurchaseOrder(data) {
        return await this.apiPost('updatePurchaseOrder', data);
    }

    async deletePurchaseOrder(id) {
        return await this.apiPost('deletePurchaseOrder', { id });
    }

    // ========================================
    // RECEIVED ORDERS (from clients)
    // ========================================

    async createReceivedOrder(data) {
        return await this.apiPost('createReceivedOrder', data);
    }

    async getReceivedOrders(limit = 50) {
        return await this.apiGet('getReceivedOrders', { limit });
    }

    async updateReceivedOrder(data) {
        return await this.apiPost('updateReceivedOrder', data);
    }

    async deleteReceivedOrder(id) {
        return await this.apiPost('deleteReceivedOrder', { id });
    }

    // ========================================
    // RECEIVED INVOICES (from suppliers)
    // ========================================

    async createReceivedInvoice(data) {
        return await this.apiPost('createReceivedInvoice', data);
    }

    async getReceivedInvoices(limit = 50) {
        return await this.apiGet('getReceivedInvoices', { limit });
    }

    async updateReceivedInvoice(data) {
        return await this.apiPost('updateReceivedInvoice', data);
    }

    async deleteReceivedInvoice(id) {
        return await this.apiPost('deleteReceivedInvoice', { id });
    }

    // ========================================
    // INVOICES (to clients)
    // ========================================

    async createInvoice(data) {
        return await this.apiPost('createInvoice', data);
    }

    async getInvoices(limit = 50) {
        return await this.apiGet('getInvoices', { limit });
    }

    // ========================================
    // CONTACTS
    // ========================================

    async getContacts(type = null) {
        return await this.apiGet('getContacts', type ? { type } : {});
    }

    async saveContact(data) {
        return await this.apiPost('saveContact', data);
    }

    async deleteContact(id) {
        return await this.apiPost('deleteContact', { id });
    }

    // ========================================
    // COMPONENT PRICES
    // ========================================

    async getComponentPrices() {
        return await this.apiGet('getComponentPrices');
    }

    async updateComponentPrice(data) {
        return await this.apiPost('updateComponentPrice', data);
    }

    // ========================================
    // STOCK ADJUSTMENTS
    // ========================================

    async processAdjustment(data) {
        return await this.apiPost('processAdjustment', data);
    }

    async getAdjustments(limit = 100) {
        if (this.mode === 'local') {
            const adjustments = JSON.parse(localStorage.getItem('navalo_adjustments') || '[]');
            return adjustments.slice(0, limit);
        }
        try {
            const result = await this.apiGet('getAdjustments', { limit });
            return Array.isArray(result) ? result : [];
        } catch (e) {
            console.warn('Failed to get adjustments from API, returning empty array:', e);
            return [];
        }
    }

    // ========================================
    // REPAIR QUOTES
    // ========================================

    async createRepairQuote(data) {
        // Always update counter locally (for next number generation)
        const config = JSON.parse(localStorage.getItem('navalo_config') || '{}');
        const year = new Date().getFullYear();
        config.next_repair_quote = (config.next_repair_quote || 1) + 1;
        config.year = year;
        localStorage.setItem('navalo_config', JSON.stringify(config));

        if (this.mode === 'local') {
            // Local mode: save to localStorage
            const quotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
            const quoteData = {
                ...data,
                id: data.id || 'RQ-' + Date.now(),
                createdAt: data.createdAt || new Date().toISOString()
            };
            quotes.push(quoteData);
            localStorage.setItem('navalo_repair_quotes', JSON.stringify(quotes));

            return { success: true, rqId: quoteData.id, rqNumber: quoteData.quoteNumber };
        }

        // Google Sheets mode
        return await this.apiPost('createRepairQuote', data);
    }

    async getRepairQuotes(limit = 100) {
        if (this.mode === 'local') {
            const quotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
            return quotes.slice(-limit).reverse();
        }
        try {
            const result = await this.apiGet('getRepairQuotes', { limit });
            return Array.isArray(result) ? result : [];
        } catch (e) {
            console.warn('Failed to get repair quotes from API, returning empty array:', e);
            return [];
        }
    }

    async updateRepairQuoteStatus(quoteId, status) {
        if (this.mode === 'local') {
            const quotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
            const quote = quotes.find(q => q.id === quoteId);
            if (quote) {
                quote.status = status;
                quote.updatedAt = new Date().toISOString();
                localStorage.setItem('navalo_repair_quotes', JSON.stringify(quotes));
                return { success: true };
            }
            return { success: false, error: 'Quote not found' };
        }

        return await this.apiPost('updateRepairQuoteStatus', { quoteId, status });
    }

    async updateRepairQuote(quoteData) {
        if (this.mode === 'local') {
            const quotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
            const index = quotes.findIndex(q => q.id === quoteData.id);
            if (index !== -1) {
                quoteData.updatedAt = new Date().toISOString();
                quotes[index] = { ...quotes[index], ...quoteData };
                localStorage.setItem('navalo_repair_quotes', JSON.stringify(quotes));
                return { success: true };
            }
            return { success: false, error: 'Quote not found' };
        }

        return await this.apiPost('updateRepairQuote', quoteData);
    }

    async saveRepairQuotes(quotes) {
        if (this.mode === 'local') {
            localStorage.setItem('navalo_repair_quotes', JSON.stringify(quotes));
            return { success: true };
        }

        return await this.apiPost('saveRepairQuotes', { quotes });
    }

    async deleteRepairQuote(quoteId) {
        if (this.mode === 'local') {
            const quotes = JSON.parse(localStorage.getItem('navalo_repair_quotes') || '[]');
            const filteredQuotes = quotes.filter(q => q.id !== quoteId);
            localStorage.setItem('navalo_repair_quotes', JSON.stringify(filteredQuotes));
            return { success: true };
        }

        return await this.apiPost('deleteRepairQuote', { quoteId });
    }

    // Google Drive methods
    async uploadToDrive(data) {
        return await this.apiPost('uploadToDrive', data);
    }

    async getDriveFile(fileId) {
        return await this.apiPost('getDriveFile', { fileId });
    }

    async listDriveInvoices() {
        return await this.apiPost('listDriveInvoices', {});
    }

    // ========================================
    // CONFIG (Google Sheets)
    // ========================================

    async getConfig() {
        return await this.apiGet('getConfig');
    }

    async updateConfig(data) {
        return await this.apiPost('updateConfig', data);
    }

    // ========================================
    // EXCHANGE RATES
    // ========================================

    async getExchangeRateForDate(currency, date) {
        return await this.apiGet('getExchangeRateForDate', { currency, date });
    }

    // ========================================
    // SYNC SYSTEM (Hybrid Mode)
    // ========================================

    async syncNow() {
        if (!this.hybridMode) {
            console.warn('Sync non disponible en mode non-hybride');
            return { success: false, error: 'Mode hybride non activé' };
        }
        console.log('🔄 Synchronisation manuelle déclenchée...');
        await this.processSyncQueue();
        return { success: true };
    }

    getSyncInfo() {
        if (!this.hybridMode) {
            return null;
        }
        return {
            status: this.getSyncStatus(),
            queue: this.getSyncQueue(),
            isHybrid: this.hybridMode,
            syncInterval: this.syncInterval
        };
    }

    getMode() {
        return this.mode;
    }

    isHybridMode() {
        return this.hybridMode;
    }

    // ========================================
    // SUBCONTRACTING ORDERS
    // ========================================

    async getSubcontractingOrders(limit = 100) {
        if (this.storageMode === 'googlesheets') {
            return await this.apiGet('getSubcontractingOrders', { limit });
        } else {
            return JSON.parse(localStorage.getItem('navalo_subcontracting_orders') || '[]');
        }
    }

    async saveSubcontractingOrders(orders) {
        localStorage.setItem('navalo_subcontracting_orders', JSON.stringify(orders));

        if (this.storageMode === 'googlesheets') {
            return await this.apiPost('saveSubcontractingOrders', { orders });
        }

        return { success: true };
    }

    async deleteSubcontractingOrder(id) {
        if (this.storageMode === 'googlesheets') {
            await this.apiPost('deleteSubcontractingOrder', { id });
        }

        let orders = JSON.parse(localStorage.getItem('navalo_subcontracting_orders') || '[]');
        orders = orders.filter(o => o.id !== id);
        localStorage.setItem('navalo_subcontracting_orders', JSON.stringify(orders));

        return { success: true };
    }
}

const storage = new StorageAdapter();
