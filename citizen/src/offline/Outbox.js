import { getDB } from './db';

const SYNC_ENDPOINT = '/api/sync';
const MAX_RETRIES = 10;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

export const OutboxStatus = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
};

function generateClientItemId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateBackoff(attempt) {
  const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  const jitter = Math.random() * 0.3 * backoff;
  return Math.floor(backoff + jitter);
}

export class Outbox {
  static async enqueue(item) {
    const db = await getDB();
    const clientItemId = item.clientItemId || generateClientItemId();
    const record = {
      clientItemId,
      type: item.type,
      conversationId: item.conversationId || null,
      text: item.text || null,
      language: item.language || 'en-IN',
      role: item.role || 'user',
      toolCalls: item.toolCalls || null,
      status: OutboxStatus.PENDING,
      attempts: 0,
      lastError: null,
      createdAt: item.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await db.put('outbox', record);
    return clientItemId;
  }

  static async enqueueMessage({ conversationId, text, language, role = 'user', toolCalls, clientItemId }) {
    return this.enqueue({ type: 'message', conversationId, text, language, role, toolCalls, clientItemId });
  }

  static async getAll() {
    const db = await getDB();
    return db.getAllFromIndex('outbox', 'createdAt');
  }

  static async getPending() {
    const all = await this.getAll();
    return all.filter(item => item.status === OutboxStatus.PENDING || item.status === OutboxStatus.FAILED);
  }

  static async getUnsynced() {
    const all = await this.getAll();
    return all.filter(item => item.status !== OutboxStatus.SYNCED);
  }

  static async updateStatus(clientItemId, status, error = null) {
    const db = await getDB();
    const item = await db.get('outbox', clientItemId);
    if (!item) return;
    item.status = status;
    item.updatedAt = Date.now();
    if (error) {
      item.lastError = error;
      item.attempts = (item.attempts || 0) + 1;
    }
    await db.put('outbox', item);
  }

  static async markSynced(clientItemId) {
    await this.updateStatus(clientItemId, OutboxStatus.SYNCED);
  }

  static async markFailed(clientItemId, error) {
    await this.updateStatus(clientItemId, OutboxStatus.FAILED, error);
  }

  static async markSyncing(clientItemId) {
    await this.updateStatus(clientItemId, OutboxStatus.SYNCING);
  }

  static async flush(deviceId, deviceSecret) {
    const db = await getDB();
    const items = await this.getPending();
    
    if (items.length === 0) {
      return { acked: [], rejected: [], serverTime: new Date().toISOString() };
    }

    const payload = {
      deviceId,
      deviceSecret,
      items: items.map(item => ({
        clientItemId: item.clientItemId,
        type: item.type,
        conversationId: item.conversationId,
        text: item.text,
        language: item.language,
        role: item.role,
        toolCalls: item.toolCalls,
        createdAt: new Date(item.createdAt).toISOString(),
      })),
    };

    for (const item of items) {
      await this.markSyncing(item.clientItemId);
    }

    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const error = result.error || `HTTP ${response.status}`;
        for (const item of items) {
          await this.markFailed(item.clientItemId, error);
        }
        return { acked: [], rejected: items.map(i => ({ clientItemId: i.clientItemId, reason: error })), serverTime: new Date().toISOString() };
      }

      const acked = result.acked || [];
      const rejected = result.rejected || [];

      for (const clientItemId of acked) {
        await db.delete('outbox', clientItemId);
      }

      for (const { clientItemId, reason } of rejected) {
        await this.markFailed(clientItemId, reason);
      }

      return { acked, rejected, serverTime: result.serverTime };
    } catch (err) {
      const error = err.message || 'Network error';
      for (const item of items) {
        await this.markFailed(item.clientItemId, error);
      }
      return { acked: [], rejected: items.map(i => ({ clientItemId: i.clientItemId, reason: error })), serverTime: new Date().toISOString() };
    }
  }

  static async clearSynced() {
    const db = await getDB();
    const all = await db.getAll('outbox');
    for (const item of all) {
      if (item.status === OutboxStatus.SYNCED) {
        await db.delete('outbox', item.clientItemId);
      }
    }
  }

  static async clearAll() {
    const db = await getDB();
    await db.clear('outbox');
  }

  static async retry(clientItemId) {
    const db = await getDB();
    const item = await db.get('outbox', clientItemId);
    if (!item) return;
    item.status = OutboxStatus.PENDING;
    item.lastError = null;
    item.updatedAt = Date.now();
    await db.put('outbox', item);
  }
}