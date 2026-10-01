import type { FocusSession, TimerMode } from './sessionTypes';

const toMs = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

export const secondsSince = (iso: string | undefined, now: number): number => {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - toMs(iso)) / 1000));
};

export const getFocusSeconds = (session: FocusSession, now: number): number =>
  session.focusedSeconds + secondsSince(session.activeFocusStartedAt, now);

export const getRestSeconds = (session: FocusSession, now: number): number =>
  session.restSeconds + secondsSince(session.restStartedAt, now);

export const getSearchSeconds = (session: FocusSession, now: number): number =>
  secondsSince(session.harborSearchStartedAt, now);

export const getRemainingSeconds = (session: FocusSession, now: number): number =>
  Math.max(0, session.plannedSeconds - getFocusSeconds(session, now));

export const hasCountdownEnded = (
  session: FocusSession,
  now: number,
  mode: TimerMode = session.timerMode,
): boolean => mode === 'COUNTDOWN' && getRemainingSeconds(session, now) <= 0;

export const formatClock = (totalSeconds: number, showHours = false): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (showHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
};
