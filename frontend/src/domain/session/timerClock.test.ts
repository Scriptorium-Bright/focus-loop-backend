import { describe, expect, it } from 'vitest';
import { formatClock, getRemainingSeconds, hasCountdownEnded, secondsSince } from './timerClock';
import type { FocusSession } from './sessionTypes';

const session: FocusSession = {
  id: 'session-test',
  taskTitle: '테스트',
  mode: 'QUICK',
  timerMode: 'COUNTDOWN',
  plannedSeconds: 1_500,
  focusedSeconds: 120,
  restSeconds: 30,
  pauseCount: 0,
  status: 'ACTIVE',
  skinId: 'DAWN',
  departureHarborId: 'dawn-departure',
  visitedHarborIds: [],
  seed: 1,
  startedAt: new Date(0).toISOString(),
  activeFocusStartedAt: new Date(10_000).toISOString(),
};

describe('timerClock', () => {
  it('uses elapsed wall-clock time and never returns negative values', () => {
    expect(secondsSince(session.activeFocusStartedAt, 10_999)).toBe(0);
    expect(secondsSince(session.activeFocusStartedAt, 11_999)).toBe(1);
    expect(secondsSince(undefined, 20_000)).toBe(0);
    expect(getRemainingSeconds(session, 1_390_000)).toBe(0);
    expect(hasCountdownEnded(session, 1_390_000)).toBe(true);
  });

  it('formats focus clocks for compact and hour layouts', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3_661)).toBe('01:01:01');
    expect(formatClock(65, true)).toBe('00:01:05');
  });
});
