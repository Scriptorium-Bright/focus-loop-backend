import { describe, expect, it } from 'vitest';
import { logbookFromSession } from './logbook';
import { initialSessionMachine, sessionReducer } from './session/sessionReducer';

describe('logbookFromSession', () => {
  it('keeps the session fields needed to rebuild a voyage entry', () => {
    const started = sessionReducer(initialSessionMachine, {
      type: 'START',
      now: 1_000,
      taskTitle: '복구 가능한 기록',
      taskId: 'task-1',
      journeyId: 'journey-1',
      mode: 'JOURNEY',
      timerMode: 'COUNTDOWN',
      plannedSeconds: 1_500,
      skinId: 'COAST',
      seed: 42,
    });
    const session = { ...started.session!, status: 'ABORTED' as const, focusedSeconds: 37, restSeconds: 12, pauseCount: 2, visitedHarborIds: ['coast-harbor-1'] };

    const entry = logbookFromSession(session, 10_000);

    expect(entry).toMatchObject({
      sessionId: session.id,
      taskId: 'task-1',
      journeyId: 'journey-1',
      plannedSeconds: 1_500,
      focusedSeconds: 37,
      restSeconds: 12,
      pauseCount: 2,
      departureHarborId: 'coast-departure',
      arrivalId: undefined,
      seed: 42,
      endedStatus: 'ABORTED',
    });
  });
});
