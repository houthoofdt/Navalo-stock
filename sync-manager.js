/**
 * NAVALO Sync Manager
 * Local-first synchronization with Google Sheets
 *
 * Strategy:
 * - All operations happen locally (instant UI)
 * - Changes are queued for background sync
 * - Sync happens in background without blocking UI
 * - Local changes always take precedence
 */

class SyncManager {
    constructor() {
        this.syncQueue = [];
        this.syncing = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.listeners = [];

        // Load queue from localStorage
        this.loadQueue();

        // Start background sync (every 30 seconds)
        this.startBackgroundSync(30000);
    }

    /**
     * Add operation to sync queue
     */
    queueSync(operation) {
        const queueItem = {
            id: 'SYNC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            operation: operation.type,  // 'create', 'update', 'delete'
            entity: operation.entity,   // 'receivedOrder', 'delivery', 'adjustment', etc.
            data: operation.data,
            timestamp: new Date().toISOString(),
            retries: 0,
            status: 'pending'
        };

        this.syncQueue.push(queueItem);
        this.saveQueue();
        this.notifyListeners({ type: 'queued', item: queueItem });

        console.log('📤 Queued for sync:', operation.type, operation.entity);

        // Try to sync immediately if not already syncing
        if (!this.syncing) {
            this.processSyncQueue();
        }

        return queueItem.id;
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.syncing || this.syncQueue.length === 0) return;

        this.syncing = true;
        this.notifyListeners({ type: 'syncStart', queueLength: this.syncQueue.length });

        console.log('🔄 Processing sync queue:', this.syncQueue.length, 'items');

        const itemsToSync = this.syncQueue.filter(item => item.status === 'pending');

        for (const item of itemsToSync) {
            try {
                await this.syncItem(item);
                item.status = 'completed';
                item.completedAt = new Date().toISOString();
            } catch (error) {
                console.error('Sync failed for item:', item, error);
                item.retries++;
                item.lastError = error.toString();

                // Remove from queue after 3 failed attempts
                if (item.retries >= 3) {
                    item.status = 'failed';
                    console.error('❌ Sync failed permanently after 3 retries:', item);
                }
            }
        }

        // Remove completed items (keep failed for manual retry)
        this.syncQueue = this.syncQueue.filter(item => item.status !== 'completed');
        this.saveQueue();

        this.lastSync = new Date().toISOString();
        this.syncing = false;

        this.notifyListeners({
            type: 'syncComplete',
            remaining: this.syncQueue.length,
            lastSync: this.lastSync
        });

        console.log('✅ Sync complete. Remaining in queue:', this.syncQueue.length);
    }

    /**
     * Sync individual item to Google Sheets
     */
    async syncItem(item) {
        console.log('🔄 Syncing:', item.operation, item.entity, item.id);

        if (!storage || storage.getMode() !== 'googlesheets') {
            console.log('⚠️ Skipping sync - not in Google Sheets mode');
            return;
        }

        const { operation, entity, data } = item;

        switch (entity) {
            case 'receivedOrder':
                if (operation === 'create') {
                    await storage.apiPost('createReceivedOrder', data);
                } else if (operation === 'update') {
                    await storage.apiPost('updateReceivedOrder', data);
                } else if (operation === 'delete') {
                    await storage.apiPost('deleteReceivedOrder', { id: data.id });
                }
                break;

            case 'delivery':
                if (operation === 'create') {
                    await storage.apiPost('processDelivery', data);
                } else if (operation === 'delete') {
                    await storage.apiPost('deleteDelivery', { id: data.id });
                }
                break;

            case 'adjustment':
                if (operation === 'create') {
                    await storage.apiPost('processAdjustment', data);
                }
                break;

            case 'receipt':
                if (operation === 'create') {
                    await storage.apiPost('processReceipt', data);
                }
                break;

            default:
                console.warn('Unknown entity type for sync:', entity);
        }
    }

    /**
     * Start background sync timer
     */
    startBackgroundSync(intervalMs) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.syncQueue.length > 0) {
                console.log('⏰ Background sync triggered');
                this.processSyncQueue();
            }
        }, intervalMs);

        console.log('🔄 Background sync started (every', intervalMs / 1000, 'seconds)');
    }

    /**
     * Stop background sync
     */
    stopBackgroundSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Background sync stopped');
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            queueLength: this.syncQueue.length,
            syncing: this.syncing,
            lastSync: this.lastSync,
            pendingItems: this.syncQueue.filter(i => i.status === 'pending').length,
            failedItems: this.syncQueue.filter(i => i.status === 'failed').length
        };
    }

    /**
     * Manual sync trigger
     */
    async syncNow() {
        console.log('🔄 Manual sync triggered');
        await this.processSyncQueue();
    }

    /**
     * Retry failed items
     */
    retryFailed() {
        const failed = this.syncQueue.filter(i => i.status === 'failed');
        failed.forEach(item => {
            item.status = 'pending';
            item.retries = 0;
        });
        this.saveQueue();
        console.log('🔄 Retrying', failed.length, 'failed items');
        this.processSyncQueue();
    }

    /**
     * Save queue to localStorage
     */
    saveQueue() {
        try {
            localStorage.setItem('navalo_sync_queue', JSON.stringify(this.syncQueue));
        } catch (e) {
            console.error('Failed to save sync queue:', e);
        }
    }

    /**
     * Load queue from localStorage
     */
    loadQueue() {
        try {
            const saved = localStorage.getItem('navalo_sync_queue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
                console.log('📥 Loaded sync queue:', this.syncQueue.length, 'items');
            }
        } catch (e) {
            console.error('Failed to load sync queue:', e);
            this.syncQueue = [];
        }
    }

    /**
     * Add listener for sync events
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event) {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }

    /**
     * Clear completed items from queue
     */
    clearCompleted() {
        this.syncQueue = this.syncQueue.filter(i => i.status !== 'completed');
        this.saveQueue();
    }
}

// Global instance
let syncManager = null;

function initSyncManager() {
    if (!syncManager) {
        syncManager = new SyncManager();
        console.log('✅ Sync Manager initialized');
    }
    return syncManager;
}

function getSyncManager() {
    return syncManager || initSyncManager();
}
