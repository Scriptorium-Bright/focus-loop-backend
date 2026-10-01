import { describe, expect, it } from 'vitest';
import { getFocusSeconds, getRestSeconds, getSearchSeconds } from './timerClock';
import { initialSessionMachine, sessionReducer } from './sessionReducer';

const start = (now = 0, plannedSeconds = 1_500) => sessionReducer(initialSessionMachine, {
  type: 'START',
  now,
  taskTitle: '설계 문서 정리',
  taskId: 'task-copy',
  mode: 'QUICK',
  timerMode: 'COUNTDOWN',
  plannedSeconds,
  skinId: 'DAWN',
  seed: 7,
});

describe('sessionReducer', () => {
  it('starts the focus clock with the session and keeps the scene transition explicit', () => {
    const state = start(1_000);

    expect(state.status).toBe('DEPARTING');
    expect(state.sceneState).toBe('CAST_OFF');
    expect(state.session?.taskTitle).toBe('설계 문서 정리');
    expect(getFocusSeconds(state.session!, 4_000)).toBe(3);
  });

  it('ignores a duplicate START while an earlier session is still in progress', () => {
    const first = start(1_000);
    const second = sessionReducer(first, {
      type: 'START',
      now: 2_000,
      taskTitle: '두 번째 항해',
      mode: 'QUICK',
      timerMode: 'STOPWATCH',
      plannedSeconds: 900,
      skinId: 'COAST',
      seed: 9,
    });

    expect(second).toBe(first);
    expect(second.session?.taskTitle).toBe('설계 문서 정리');
  });

  it('pauses immediately, searches for a harbor, and enters rest without creating a session', () => {
    const departing = start(0);
    const active = sessionReducer(departing, { type: 'SKIP_DEPARTURE', now: 2_000 });
    const searching = sessionReducer(active, { type: 'PAUSE', now: 12_000 });
    const resting = sessionReducer(searching, {
      type: 'HARBOR_SEARCH_SKIP',
      now: 13_000,
      harborId: 'dawn-harbor-1',
    });

    expect(searching.status).toBe('HARBOR_SEARCH');
    expect(searching.sceneState).toBe('SEARCHING_HARBOR');
    expect(getFocusSeconds(searching.session!, 12_000)).toBe(12);
    expect(getSearchSeconds(searching.session!, 13_000)).toBe(1);
    expect(resting.status).toBe('RESTING');
    expect(resting.session?.id).toBe(departing.session?.id);
    expect(resting.session?.visitedHarborIds).toContain('dawn-harbor-1');
  });

  it('preserves elapsed rest time when the user changes the rest preset', () => {
    const active = sessionReducer(start(0), { type: 'SKIP_DEPARTURE', now: 0 });
    const resting = sessionReducer(sessionReducer(active, { type: 'PAUSE', now: 1_000 }), {
      type: 'HARBOR_SEARCH_SKIP',
      now: 2_000,
      harborId: 'dawn-harbor-1',
    });
    const changed = sessionReducer(resting, { type: 'REST_START', now: 7_000, mode: 'TEN' });

    expect(changed.session?.restMode).toBe('TEN');
    expect(getRestSeconds(changed.session!, 7_000)).toBe(5);
  });

  it('resumes the same session and commits it once on arrival', () => {
    const active = sessionReducer(start(0), { type: 'SKIP_DEPARTURE', now: 0 });
    const resting = sessionReducer(sessionReducer(active, { type: 'PAUSE', now: 10_000 }), {
      type: 'HARBOR_SEARCH_SKIP',
      now: 11_000,
      harborId: 'dawn-harbor-1',
    });
    const resuming = sessionReducer(resting, { type: 'RESUME', now: 20_000 });
    const resumed = sessionReducer(resuming, { type: 'RESUMING_END', now: 22_000 });
    const arriving = sessionReducer(resumed, { type: 'COMPLETE_EARLY', now: 25_000 });
    const completed = sessionReducer(arriving, { type: 'ARRIVAL_END', now: 27_000 });
    const saved = sessionReducer(completed, { type: 'SAVE', now: 28_000, taskCompleted: true, note: '완료' });

    expect(resuming.status).toBe('RESUMING');
    expect(resuming.session?.id).toBe(resting.session?.id);
    expect(resuming.session?.restStartedAt).toBeUndefined();
    expect(resumed.status).toBe('ACTIVE');
    expect(arriving.status).toBe('ARRIVING');
    expect(completed.status).toBe('COMPLETED');
    expect(saved.status).toBe('READY');
    expect(saved.session?.taskCompleted).toBe(true);
    expect(saved.session?.note).toBe('완료');
  });

  it('moves a countdown to arrival from wall-clock time even without animation ticks', () => {
    const active = sessionReducer(start(10_000, 15), { type: 'SKIP_DEPARTURE', now: 10_000 });
    const arrived = sessionReducer(active, { type: 'TICK', now: 25_000 });

    expect(arrived.status).toBe('ARRIVING');
    expect(arrived.sceneState).toBe('APPROACHING_DESTINATION');
    expect(arrived.session?.focusedSeconds).toBe(15);
  });

  it('can record an unfinished session as aborted without losing measured time', () => {
    const active = sessionReducer(start(0), { type: 'SKIP_DEPARTURE', now: 0 });
    const aborted = sessionReducer(active, { type: 'ABORT', now: 9_000 });

    expect(aborted.status).toBe('ABORTED');
    expect(aborted.session?.focusedSeconds).toBe(9);
    expect(aborted.session?.activeFocusStartedAt).toBeUndefined();
  });
});
