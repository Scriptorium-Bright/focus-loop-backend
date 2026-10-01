import { getFocusSeconds, getRestSeconds } from '../domain/session/timerClock';
import type { LogbookEntry } from '../domain/logbook';
import type { SessionMachine } from '../domain/session/sessionTypes';
import type { SyncQueueInput } from './syncQueue';

export const sessionSyncEvent = (machine: SessionMachine): SyncQueueInput | undefined => {
  const session = machine.session;
  if (!session || machine.status === 'READY') return undefined;
  const eventId = [session.id, machine.status, session.pauseCount, session.restMode ?? '', session.restStartedAt ?? '', session.activeFocusStartedAt ?? '', session.harborSearchStartedAt ?? '', session.arrivalStartedAt ?? ''].join(':');
  return {
    eventId: `session-state:${eventId}`,
    type: 'SESSION_STATE',
    aggregateId: session.id,
    payload: {
      status: machine.status,
      focusedSeconds: getFocusSeconds(session, machine.now),
      restSeconds: getRestSeconds(session, machine.now),
      pauseCount: session.pauseCount,
      mode: session.mode,
      timerMode: session.timerMode,
      plannedSeconds: session.plannedSeconds,
      taskId: session.taskId ?? null,
      journeyId: session.journeyId ?? null,
      skinId: session.skinId,
      startedAt: session.startedAt,
      visitedHarborIds: session.visitedHarborIds,
      taskTitleLength: session.taskTitle.length,
    },
  };
};

export const logbookSyncEvent = (entry: LogbookEntry): SyncQueueInput => ({
  eventId: `logbook-upsert:${entry.id}`,
  type: 'LOGBOOK_UPSERT',
  aggregateId: entry.id,
  payload: {
    sessionId: entry.sessionId,
    taskId: entry.taskId ?? null,
    journeyId: entry.journeyId ?? null,
    titleLength: entry.title.length,
    createdAt: entry.createdAt,
    mode: entry.mode,
    plannedSeconds: entry.plannedSeconds,
    focusedSeconds: entry.focusedSeconds,
    restSeconds: entry.restSeconds,
    pauseCount: entry.pauseCount,
    taskCompleted: entry.taskCompleted,
    skinId: entry.skinId,
    departureHarborId: entry.departureHarborId,
    visitedHarborIds: entry.visitedHarborIds,
    arrivalId: entry.arrivalId ?? null,
    endedStatus: entry.endedStatus,
    noteLength: entry.note?.length ?? 0,
  },
});

export const logbookTombstoneEvent = (entryId: string, now = Date.now()): SyncQueueInput => ({
  eventId: `logbook-delete:${entryId}`,
  type: 'LOGBOOK_TOMBSTONE',
  aggregateId: entryId,
  payload: { deletedAt: new Date(now).toISOString() },
});
