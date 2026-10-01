import { describe, expect, it, vi } from 'vitest';
import { enqueueSyncEvent, markSyncEventFailed, nextRetryAt } from './syncQueue';
import { flushSyncQueue } from './syncTransport';

describe('sync queue', () => {
  it('deduplicates events by the idempotency key and backs off failures', () => {
    const now = 1_000;
    const event = { eventId: 'event-1', type: 'SESSION_STATE' as const, aggregateId: 'session-1', payload: { status: 'ACTIVE' } };
    const queue = enqueueSyncEvent(enqueueSyncEvent([], event, now), event, now);
    const failed = markSyncEventFailed(queue, queue[0].id, new Error('offline'), now);

    expect(queue).toHaveLength(1);
    expect(failed[0].attempts).toBe(1);
    expect(failed[0].nextAttemptAt).toBe(nextRetryAt(1, now));
    expect(failed[0].lastError).toBe('offline');
  });

  it('removes sent events and preserves failed events', async () => {
    const queue = enqueueSyncEvent([], { eventId: 'event-1', type: 'LOGBOOK_UPSERT', aggregateId: 'log-1', payload: {} }, 0);
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await flushSyncQueue(queue, { send }, 0);

    expect(send).toHaveBeenCalledOnce();
    expect(result.sent).toBe(1);
    expect(result.queue).toEqual([]);
  });
});
