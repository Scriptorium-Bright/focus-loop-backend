import { dueSyncEvents, markSyncEventFailed, markSyncEventSent, type SyncQueueItem } from './syncQueue';

export interface SyncTransport {
  send: (item: SyncQueueItem) => Promise<void>;
}

export interface FlushResult {
  queue: SyncQueueItem[];
  sent: number;
  failed: number;
}

export const createFetchSyncTransport = (endpoint: string, fetcher: typeof fetch = fetch): SyncTransport => ({
  async send(item) {
    const response = await fetcher(`${endpoint.replace(/\/$/, '')}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': item.eventId },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`sync request failed: ${response.status}`);
  },
});

export const flushSyncQueue = async (queue: SyncQueueItem[], transport: SyncTransport, now = Date.now(), limit = 20): Promise<FlushResult> => {
  let nextQueue = queue;
  let sent = 0;
  let failed = 0;
  for (const item of dueSyncEvents(queue, now).slice(0, limit)) {
    try {
      await transport.send(item);
      nextQueue = markSyncEventSent(nextQueue, item.id);
      sent += 1;
    } catch (error) {
      nextQueue = markSyncEventFailed(nextQueue, item.id, error, now);
      failed += 1;
    }
  }
  return { queue: nextQueue, sent, failed };
};
