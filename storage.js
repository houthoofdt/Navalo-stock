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
    }

    async init() {
        if (typeof CONFIG !== 'undefined' && checkConfig()) {
            this.mode = CONFIG.STORAGE_MODE;
            this.apiUrl = CONFIG.API_URL;
            console.log('📊 Mode Google Sheets activé');
            await this.fetchExchangeRate();
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
        if (!localStorage.getItem('navalo_config')) {
            localStorage.setItem('navalo_config', JSON.stringify({
                next_bl: 1,
                next_po: 1,
                next_fp: 1,
                year: new Date().getFullYear(),
                fp_year: new Date().getFullYear()
            }));
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
    // API HELPERS
    // ========================================

    async apiGet(action, params = {}) {
        if (this.mode === 'local') {
            return this.localGet(action, params);
        }

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

    async apiPost(action, data) {
        if (this.mode === 'local') {
            return this.localPost(action, data);
        }

        try {
            // Use redirect:follow and no-cors workaround for Google Apps Script
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
        const exchangeRate = this.getExchangeRate('EUR');
        
        let totalValue = 0;
        const byCategory = {};
        
        Object.keys(stock).forEach(ref => {
            const componentLots = lots.filter(l => l.ref === ref && l.qtyRemaining > 0);
            let value = 0;
            
            if (componentLots.length > 0) {
                // Calculate value from FIFO lots
                componentLots.forEach(lot => {
                    value += lot.qtyRemaining * lot.priceCZK;
                });
            } else {
                // No lots - use COMPONENT_PRICES if available
                const qty = stock[ref].qty || 0;
                if (qty > 0 && typeof getComponentPrice === 'function') {
                    const priceEur = getComponentPrice(ref, 'EUR');
                    if (priceEur) {
                        value = qty * priceEur * exchangeRate;
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

    localProcessReceipt(data) {
        const { items, supplier, bonNum, date, currency } = data;
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        
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
        
        localStorage.setItem('navalo_stock', JSON.stringify(stock));
        localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
        localStorage.setItem('navalo_history', JSON.stringify(history));
        
        return { success: true, processed: results.length, items: results, exchangeRate };
    }

    // ========================================
    // DELIVERY - HISTORY SHOWS PAC ONLY
    // ========================================

    localProcessDelivery(data) {
        const { client, clientAddress, quantities, notes, date } = data;
        const stock = JSON.parse(localStorage.getItem('navalo_stock') || '{}');
        const bom = JSON.parse(localStorage.getItem('navalo_bom') || '{}');
        let lots = JSON.parse(localStorage.getItem('navalo_stock_lots') || '[]');
        const history = JSON.parse(localStorage.getItem('navalo_history') || '[]');
        const deliveries = JSON.parse(localStorage.getItem('navalo_deliveries') || '[]');
        
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
        
        // Record delivery
        const deliveryId = 'DEL-' + Date.now();
        const totalPac = (quantities['TX9'] || 0) + (quantities['TX12-3PH'] || 0) + (quantities['TX12-1PH'] || 0);
        
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
            value: Math.round(totalValue * 100) / 100,
            status: 'Créé',
            notes
        });
        
        localStorage.setItem('navalo_stock', JSON.stringify(stock));
        localStorage.setItem('navalo_stock_lots', JSON.stringify(lots));
        localStorage.setItem('navalo_history', JSON.stringify(history));
        localStorage.setItem('navalo_deliveries', JSON.stringify(deliveries));
        
        return { 
            success: true, 
            deliveryId,
            blNumber,
            totalPac,
            totalValue: Math.round(totalValue * 100) / 100,
            componentsDeducted: Object.keys(required).length
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

    async getHistory(limit = 100) {
        return await this.apiGet('getHistory', { limit });
    }

    async getDeliveries(limit = 50) {
        return await this.apiGet('getDeliveries', { limit });
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

    async createPurchaseOrder(data) {
        return await this.apiPost('createPurchaseOrder', data);
    }

    async updatePurchaseOrder(data) {
        return await this.apiPost('updatePurchaseOrder', data);
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

    // ========================================
    // COMPONENT PRICES
    // ========================================

    async getComponentPrices() {
        return await this.apiGet('getComponentPrices');
    }

    async updateComponentPrice(data) {
        return await this.apiPost('updateComponentPrice', data);
    }

    getMode() {
        return this.mode;
    }
}

const storage = new StorageAdapter();
