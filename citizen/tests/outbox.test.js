/**
 * Vitest suite for the offline outbox.
 *
 * The behaviour that matters most: a partial sync response must delete only the
 * items the server acknowledged. The previous implementation wiped the whole
 * queue on any 2xx, which silently destroyed a single rejected message.
 *
 * IndexedDB is faked with fake-indexeddb so these run in node without a browser.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Fresh database per test so state never leaks between them.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  // db.js memoises nothing, but the module-level connection is recreated per
  // call, so resetting the factory is enough.
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadOutbox() {
  // Imported after the factory swap so openDB() sees the new instance.
  const { Outbox, OutboxStatus } = await import('../src/offline/Outbox');
  return { Outbox, OutboxStatus };
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe('enqueue', () => {
  test('stores a pending item with a generated clientItemId', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();

    const clientItemId = await Outbox.enqueueMessage({
      conversationId: 'conv-1',
      text: 'मुझे पीएम-किसान के बारे में बताइए',
      language: 'hi-IN',
    });

    expect(clientItemId).toBeTruthy();
    const all = await Outbox.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      clientItemId,
      type: 'message',
      conversationId: 'conv-1',
      text: 'मुझे पीएम-किसान के बारे में बताइए',
      language: 'hi-IN',
      role: 'user',
      status: OutboxStatus.PENDING,
      attempts: 0,
    });
  });

  test('preserves an explicit clientItemId for idempotency', async () => {
    const { Outbox } = await loadOutbox();
    const id = await Outbox.enqueueMessage({
      conversationId: 'c',
      text: 'x',
      language: 'en-IN',
      clientItemId: 'stable-id',
    });
    expect(id).toBe('stable-id');
  });

  test('generates a distinct id per message', async () => {
    const { Outbox } = await loadOutbox();
    const a = await Outbox.enqueueMessage({ conversationId: 'c', text: 'a', language: 'en-IN' });
    const b = await Outbox.enqueueMessage({ conversationId: 'c', text: 'b', language: 'en-IN' });
    expect(a).not.toBe(b);
  });
});

describe('flush', () => {
  test('removes only acknowledged items and keeps rejected ones', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();

    const okId = await Outbox.enqueueMessage({ conversationId: 'c', text: 'ok', language: 'en-IN' });
    const badId = await Outbox.enqueueMessage({ conversationId: 'c', text: 'bad', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () =>
      jsonResponse({
        acked: [okId],
        rejected: [{ clientItemId: badId, reason: 'createdAt out of range' }],
        serverTime: new Date().toISOString(),
      }),
    );

    const result = await Outbox.flush('device-1', 'secret');

    expect(result.acked).toEqual([okId]);
    expect(result.rejected).toHaveLength(1);

    const remaining = await Outbox.getAll();
    // This is the regression the suite exists for: the rejected item survives.
    expect(remaining).toHaveLength(1);
    expect(remaining[0].clientItemId).toBe(badId);
    expect(remaining[0].status).toBe(OutboxStatus.FAILED);
    expect(remaining[0].lastError).toBe('createdAt out of range');
  });

  test('sends device credentials and the item payload', async () => {
    const { Outbox } = await loadOutbox();
    const id = await Outbox.enqueueMessage({ conversationId: 'conv-9', text: 'hi', language: 'ta-IN' });

    globalThis.fetch = vi.fn(async () => jsonResponse({ acked: [id], rejected: [] }));

    await Outbox.flush('device-abc', 'secret-xyz');

    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/sync');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(body.deviceId).toBe('device-abc');
    expect(body.deviceSecret).toBe('secret-xyz');
    expect(body.items[0]).toMatchObject({
      clientItemId: id,
      type: 'message',
      conversationId: 'conv-9',
      text: 'hi',
      language: 'ta-IN',
    });
    // createdAt must be an ISO string on the wire.
    expect(typeof body.items[0].createdAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.items[0].createdAt))).toBe(false);
  });

  test('marks items failed and keeps them when the request 401s', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();
    const id = await Outbox.enqueueMessage({ conversationId: 'c', text: 'x', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ error: 'Invalid deviceSecret' }, { ok: false, status: 401 }),
    );

    const result = await Outbox.flush('device-1', 'wrong');

    expect(result.acked).toEqual([]);
    const remaining = await Outbox.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe(OutboxStatus.FAILED);
    expect(remaining[0].attempts).toBeGreaterThan(0);
  });

  test('keeps items queued when the network throws', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();
    await Outbox.enqueueMessage({ conversationId: 'c', text: 'x', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await Outbox.flush('device-1', 'secret');

    expect(result.acked).toEqual([]);
    const remaining = await Outbox.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe(OutboxStatus.FAILED);
    expect(remaining[0].lastError).toBeTruthy();
  });

  test('is a no-op when the queue is empty and does not call fetch', async () => {
    const { Outbox } = await loadOutbox();
    globalThis.fetch = vi.fn();

    const result = await Outbox.flush('device-1', 'secret');

    expect(result.acked).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('does not resend items the server already acknowledged', async () => {
    const { Outbox } = await loadOutbox();
    const a = await Outbox.enqueueMessage({ conversationId: 'c', text: 'a', language: 'en-IN' });
    const b = await Outbox.enqueueMessage({ conversationId: 'c', text: 'b', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () => jsonResponse({ acked: [a, b], rejected: [] }));
    await Outbox.flush('device-1', 'secret');

    globalThis.fetch = vi.fn(async () => jsonResponse({ acked: [], rejected: [] }));
    await Outbox.flush('device-1', 'secret');

    expect(await Outbox.getAll()).toHaveLength(0);
  });

  test('tolerates a response with no rejected array', async () => {
    const { Outbox } = await loadOutbox();
    const a = await Outbox.enqueueMessage({ conversationId: 'c', text: 'a', language: 'en-IN' });
    const b = await Outbox.enqueueMessage({ conversationId: 'c', text: 'b', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () => jsonResponse({ acked: [a] }));

    const result = await Outbox.flush('device-1', 'secret');

    expect(result.acked).toEqual([a]);
    expect(result.rejected).toEqual([]);
    expect(await Outbox.getAll()).toHaveLength(1);
  });
});

describe('retry and clear', () => {
  test('retry returns a failed item to pending', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();
    const id = await Outbox.enqueueMessage({ conversationId: 'c', text: 'x', language: 'en-IN' });

    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await Outbox.flush('device-1', 'secret');
    expect((await Outbox.getAll())[0].status).toBe(OutboxStatus.FAILED);

    await Outbox.retry(id);

    const item = (await Outbox.getAll())[0];
    expect(item.status).toBe(OutboxStatus.PENDING);
    expect(item.lastError).toBeNull();
  });

  test('clearSynced removes only synced items', async () => {
    const { Outbox, OutboxStatus } = await loadOutbox();
    const kept = await Outbox.enqueueMessage({ conversationId: 'c', text: 'keep', language: 'en-IN' });
    const dropped = await Outbox.enqueueMessage({ conversationId: 'c', text: 'drop', language: 'en-IN' });

    await Outbox.markSynced(dropped);
    await Outbox.clearSynced();

    const remaining = await Outbox.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].clientItemId).toBe(kept);
  });

  test('getPending excludes synced items', async () => {
    const { Outbox } = await loadOutbox();
    const synced = await Outbox.enqueueMessage({ conversationId: 'c', text: 'a', language: 'en-IN' });
    await Outbox.enqueueMessage({ conversationId: 'c', text: 'b', language: 'en-IN' });
    await Outbox.markSynced(synced);

    const pending = await Outbox.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].text).toBe('b');
  });
});
