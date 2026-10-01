import type { FocusSession } from './session/sessionTypes';

export interface LogbookEntry {
  id: string;
  sessionId: string;
  title: string;
  taskId?: string;
  journeyId?: string;
  plannedSeconds: number;
  focusedSeconds: number;
  restSeconds: number;
  pauseCount: number;
  taskCompleted: boolean;
  note?: string;
  skinId: string;
  departureHarborId: string;
  visitedHarborIds: string[];
  arrivalId?: string;
  seed: number;
  mode: FocusSession['mode'];
  endedStatus: 'COMPLETED' | 'ABORTED';
  createdAt: string;
}

export const logbookFromSession = (session: FocusSession, now: number): LogbookEntry => ({
  id: `log-${session.id}`,
  sessionId: session.id,
  title: session.taskTitle,
  taskId: session.taskId,
  journeyId: session.journeyId,
  plannedSeconds: session.plannedSeconds,
  focusedSeconds: session.focusedSeconds,
  restSeconds: session.restSeconds,
  pauseCount: session.pauseCount,
  taskCompleted: Boolean(session.taskCompleted),
  note: session.note,
  skinId: session.skinId,
  departureHarborId: session.departureHarborId,
  visitedHarborIds: session.visitedHarborIds,
  arrivalId: session.arrivalId,
  seed: session.seed,
  mode: session.mode,
  endedStatus: session.status === 'ABORTED' ? 'ABORTED' : 'COMPLETED',
  createdAt: new Date(now).toISOString(),
});
