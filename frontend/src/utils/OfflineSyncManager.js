import { openDB } from 'idb';

const DB_NAME = 'GovAssistOfflineDB';
const STORE_NAME = 'syncQueue';

export class OfflineSyncManager {
  static async initDB() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }

  static async enqueueMessage(agentId, text, language) {
    const db = await this.initDB();
    const item = {
      type: 'message',
      agentId,
      text,
      language,
      timestamp: Date.now()
    };
    await db.add(STORE_NAME, item);
    console.log('[OfflineSyncManager] Queued message offline:', text);
  }

  static async enqueueForm(agentId, formData) {
    const db = await this.initDB();
    const item = {
      type: 'form',
      agentId,
      formData,
      timestamp: Date.now()
    };
    await db.add(STORE_NAME, item);
    console.log('[OfflineSyncManager] Queued form offline:', formData);
  }

  static async getQueue() {
    const db = await this.initDB();
    return db.getAll(STORE_NAME);
  }

  static async clearQueue() {
    const db = await this.initDB();
    return db.clear(STORE_NAME);
  }

  static async syncWithServer(syncEndpointUrl = '/api/sync') {
    if (!navigator.onLine) return false;
    
    const db = await this.initDB();
    const items = await db.getAll(STORE_NAME);
    
    if (items.length === 0) return true; // Nothing to sync

    try {
      console.log(`[OfflineSyncManager] Attempting to sync ${items.length} items...`);
      const response = await fetch(syncEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (response.ok) {
        await db.clear(STORE_NAME);
        console.log('[OfflineSyncManager] Sync successful and queue cleared.');
        return true;
      } else {
        console.error('[OfflineSyncManager] Sync failed with status:', response.status);
        return false;
      }
    } catch (err) {
      console.error('[OfflineSyncManager] Sync error:', err);
      return false;
    }
  }
}
