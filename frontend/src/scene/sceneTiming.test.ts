import { describe, expect, it } from 'vitest';
import { initialSessionMachine, sessionReducer } from '../domain/session/sessionReducer';
import { getHarborSearchProgress, getSceneProgress } from './sceneTiming';

const started = sessionReducer(initialSessionMachine, {
  type: 'START',
  now: 1_000,
  taskTitle: '장면 전환',
  mode: 'QUICK',
  timerMode: 'COUNTDOWN',
  plannedSeconds: 1_500,
  skinId: 'DAWN',
  seed: 7,
});

describe('sceneTiming', () => {
  it('uses the departure transition clock instead of the focus clock', () => {
    expect(started.sceneState).toBe('CAST_OFF');
    expect(getSceneProgress({ ...started, now: 2_200 })).toBeCloseTo(0.5, 2);
  });

  it('maps the fifteen-second harbor search to a bounded scene progress', () => {
    const searching = sessionReducer({ ...started, now: 3_500 }, { type: 'DEPARTURE_END', now: 3_500 });
    const paused = sessionReducer(searching, { type: 'PAUSE', now: 10_000 });
    expect(paused.sceneState).toBe('SEARCHING_HARBOR');
    expect(getHarborSearchProgress({ ...paused, now: 18_000 })).toBeCloseTo(8 / 15, 2);
    expect(getHarborSearchProgress({ ...paused, now: 30_000 })).toBe(1);
  });

  it('reduces transition duration when reduce motion is enabled', () => {
    expect(getSceneProgress({ ...started, now: 1_800 }, true)).toBe(1);
  });
});
