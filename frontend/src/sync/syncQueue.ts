export type SyncEventType = 'SESSION_STATE' | 'LOGBOOK_UPSERT' | 'LOGBOOK_TOMBSTONE';

export type SyncPayloadValue = string | number | boolean | null | string[];

export interface SyncQueueItem {
  id: string;
  eventId: string;
  type: SyncEventType;
  aggregateId: string;
  payload: Record<string, SyncPayloadValue>;
  createdAt: string;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string;
}

export interface SyncQueueInput {
  eventId: string;
  type: SyncEventType;
  aggregateId: string;
  payload: Record<string, SyncPayloadValue>;
  createdAt?: string;
}

const retryDelays = [1_000, 5_000, 30_000, 5 * 60_000, 60 * 60_000];

const createId = () => globalThis.crypto?.randomUUID?.() ?? `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const nextRetryAt = (attempts: number, now: number) => new Date(now + retryDelays[Math.min(Math.max(attempts, 0), retryDelays.length - 1)]).toISOString();

export const enqueueSyncEvent = (queue: SyncQueueItem[], input: SyncQueueInput, now = Date.now()): SyncQueueItem[] => {
  if (queue.some((item) => item.eventId === input.eventId)) return queue;
  const createdAt = input.createdAt ?? new Date(now).toISOString();
  return [...queue, {
    id: createId(),
    eventId: input.eventId,
    type: input.type,
    aggregateId: input.aggregateId,
    payload: input.payload,
    createdAt,
    attempts: 0,
    nextAttemptAt: createdAt,
  }];
};

export const enqueueSyncEvents = (queue: SyncQueueItem[], inputs: SyncQueueInput[], now = Date.now()) => inputs.reduce((current, input) => enqueueSyncEvent(current, input, now), queue);

export const dueSyncEvents = (queue: SyncQueueItem[], now = Date.now()) => queue.filter((item) => new Date(item.nextAttemptAt).getTime() <= now);

export const markSyncEventSent = (queue: SyncQueueItem[], id: string) => queue.filter((item) => item.id !== id);

export const markSyncEventFailed = (queue: SyncQueueItem[], id: string, error: unknown, now = Date.now()) => queue.map((item) => {
  if (item.id !== id) return item;
  const attempts = item.attempts + 1;
  return {
    ...item,
    attempts,
    nextAttemptAt: nextRetryAt(attempts, now),
    lastError: error instanceof Error ? error.message : String(error),
  };
});

export const serializeSyncQueue = (queue: SyncQueueItem[]) => JSON.stringify(queue);
