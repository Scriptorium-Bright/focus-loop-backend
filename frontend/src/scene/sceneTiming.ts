import { getFocusSeconds, getSearchSeconds } from '../domain/session/timerClock';
import type { SessionMachine } from '../domain/session/sessionTypes';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const elapsedProgress = (startedAt: string | undefined, now: number, durationMs: number) => {
  if (!startedAt) return 0;
  const started = Date.parse(startedAt);
  if (!Number.isFinite(started)) return 0;
  return clamp((now - started) / durationMs);
};

/** Progress for the current visual transition, independent of the focus timer. */
export const getSceneProgress = (machine: SessionMachine, reduceMotion = false) => {
  const session = machine.session;
  if (!session) return 0;
  switch (machine.sceneState) {
    case 'CAST_OFF':
      return elapsedProgress(session.departureStartedAt, machine.now, reduceMotion ? 800 : 2400);
    case 'SEARCHING_HARBOR':
      return clamp(getSearchSeconds(session, machine.now) / 15);
    case 'LEAVING_HARBOR':
      return elapsedProgress(session.resumingStartedAt, machine.now, reduceMotion ? 650 : 1800);
    case 'APPROACHING_DESTINATION':
      return elapsedProgress(session.arrivalStartedAt, machine.now, reduceMotion ? 800 : 2400);
    case 'OPEN_WATER':
      return session.timerMode === 'COUNTDOWN'
        ? clamp(getFocusSeconds(session, machine.now) / Math.max(1, session.plannedSeconds))
        : clamp(getFocusSeconds(session, machine.now) / 3600);
    case 'ARRIVED':
      return 1;
    default:
      return 0;
  }
};

export const getHarborSearchProgress = (machine: SessionMachine) => {
  if (!machine.session || machine.sceneState !== 'SEARCHING_HARBOR') return 0;
  return clamp(getSearchSeconds(machine.session, machine.now) / 15);
};

