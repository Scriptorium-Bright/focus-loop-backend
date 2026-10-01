import { getFocusSeconds, getRemainingSeconds, getRestSeconds, getSearchSeconds } from './timerClock';
import type { FocusSession, SceneState, SessionAction, SessionMachine, SessionStatus } from './sessionTypes';
import { sceneForStatus } from './sessionTypes';

const iso = (now: number) => new Date(now).toISOString();
const createId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const commitFocus = (session: FocusSession, now: number): FocusSession => ({
  ...session,
  focusedSeconds: getFocusSeconds(session, now),
  activeFocusStartedAt: undefined,
});

const commitRest = (session: FocusSession, now: number): FocusSession => ({
  ...session,
  restSeconds: getRestSeconds(session, now),
  restStartedAt: undefined,
});

const withStatus = (
  state: SessionMachine,
  status: SessionStatus,
  session: FocusSession,
  now: number,
  sceneState: SceneState = sceneForStatus(status),
): SessionMachine => ({ ...state, status, sceneState, session: { ...session, status }, now, error: undefined });

export const initialSessionMachine: SessionMachine = {
  session: null,
  status: 'READY',
  sceneState: 'DOCKED_VIEW',
  now: Date.now(),
};

export function sessionReducer(state: SessionMachine, action: SessionAction): SessionMachine {
  if (action.type === 'RESTORE') return { ...action.machine, now: Date.now() };
  if (action.type === 'START') {
    if (state.session && state.status !== 'READY') return state;
    const session: FocusSession = {
      id: createId(),
      taskId: action.taskId,
      journeyId: action.journeyId,
      taskTitle: action.taskTitle.trim() || '이름 없는 항해',
      mode: action.mode,
      timerMode: action.timerMode,
      plannedSeconds: action.plannedSeconds,
      focusedSeconds: 0,
      restSeconds: 0,
      pauseCount: 0,
      status: 'DEPARTING',
      skinId: action.skinId,
      departureHarborId: `${action.skinId.toLowerCase()}-departure`,
      visitedHarborIds: [],
      seed: action.seed,
      startedAt: iso(action.now),
      activeFocusStartedAt: iso(action.now),
      departureStartedAt: iso(action.now),
    };
    return withStatus(state, 'DEPARTING', session, action.now, 'CAST_OFF');
  }
  if (!state.session) return state;
  const session = state.session;

  switch (action.type) {
    case 'TICK': {
      const next = { ...state, now: action.now };
      if (state.status === 'ACTIVE' && session.timerMode === 'COUNTDOWN' && getRemainingSeconds(session, action.now) <= 0) {
        const committed = commitFocus(session, action.now);
        return withStatus(next, 'ARRIVING', { ...committed, arrivalStartedAt: iso(action.now) }, action.now);
      }
      if (state.status === 'HARBOR_SEARCH' && getSearchSeconds(session, action.now) >= 15) {
        const harborId = `${session.skinId.toLowerCase()}-harbor-1`;
        return withStatus(
          next,
          'RESTING',
          {
            ...session,
            harborSearchStartedAt: undefined,
            restStartedAt: iso(action.now),
            restMode: 'FIVE',
            visitedHarborIds: session.visitedHarborIds.includes(harborId)
              ? session.visitedHarborIds
              : [...session.visitedHarborIds, harborId],
          },
          action.now,
        );
      }
      return next;
    }
    case 'DEPARTURE_END':
    case 'SKIP_DEPARTURE':
      return withStatus({ ...state, now: action.now }, 'ACTIVE', { ...session, departureStartedAt: undefined }, action.now);
    case 'PAUSE':
      if (state.status !== 'ACTIVE' && state.status !== 'DEPARTING') return state;
      return withStatus(
        { ...state, now: action.now },
        'HARBOR_SEARCH',
        {
          ...commitFocus(session, action.now),
          pauseCount: session.pauseCount + 1,
          harborSearchStartedAt: iso(action.now),
        },
        action.now,
      );
    case 'HARBOR_SEARCH_SKIP':
    case 'HARBOR_SEARCH_FOUND': {
      if (state.status !== 'HARBOR_SEARCH') return state;
      const visited = session.visitedHarborIds.includes(action.harborId)
        ? session.visitedHarborIds
        : [...session.visitedHarborIds, action.harborId];
      return withStatus(
        { ...state, now: action.now },
        'RESTING',
        { ...session, harborSearchStartedAt: undefined, restStartedAt: iso(action.now), restMode: 'FIVE', visitedHarborIds: visited },
        action.now,
      );
    }
    case 'HARBOR_SEARCH_CANCEL':
      if (state.status !== 'HARBOR_SEARCH') return state;
      return withStatus(
        { ...state, now: action.now },
        'ACTIVE',
        { ...session, harborSearchStartedAt: undefined, activeFocusStartedAt: iso(action.now) },
        action.now,
      );
    case 'REST_START':
      if (state.status !== 'RESTING') return state;
      return withStatus(
        { ...state, now: action.now },
        'RESTING',
        { ...session, restStartedAt: session.restStartedAt ?? iso(action.now), restMode: action.mode },
        action.now,
      );
    case 'RESUME':
      if (state.status !== 'RESTING') return state;
      return withStatus(
        { ...state, now: action.now },
        'RESUMING',
        { ...commitRest(session, action.now), resumingStartedAt: iso(action.now), activeFocusStartedAt: iso(action.now) },
        action.now,
      );
    case 'RESUMING_END':
      return withStatus({ ...state, now: action.now }, 'ACTIVE', { ...session, resumingStartedAt: undefined }, action.now);
    case 'TIMER_END':
    case 'COMPLETE_EARLY':
      if (state.status !== 'ACTIVE') return state;
      return withStatus(
        { ...state, now: action.now },
        'ARRIVING',
        { ...commitFocus(session, action.now), arrivalStartedAt: iso(action.now) },
        action.now,
      );
    case 'END_SESSION':
      if (!['HARBOR_SEARCH', 'RESTING', 'RESUMING'].includes(state.status)) return state;
      return withStatus(
        { ...state, now: action.now },
        'ARRIVING',
        { ...commitRest(commitFocus(session, action.now), action.now), arrivalStartedAt: iso(action.now) },
        action.now,
      );
    case 'ARRIVAL_END':
      if (state.status !== 'ARRIVING') return state;
      return withStatus({ ...state, now: action.now }, 'COMPLETED', { ...session, arrivalStartedAt: undefined }, action.now, 'ARRIVED');
    case 'SAVE':
      if (state.status !== 'COMPLETED' && state.status !== 'ABORTED') return state;
      return withStatus(
        { ...state, now: action.now },
        'READY',
        {
          ...session,
          status: 'READY',
          completedAt: iso(action.now),
          taskCompleted: action.taskCompleted,
          note: action.note,
        },
        action.now,
        'DOCKED_VIEW',
      );
    case 'ABORT':
      return withStatus({ ...state, now: action.now }, 'ABORTED', commitRest(commitFocus(session, action.now), action.now), action.now);
    default:
      return state;
  }
}
