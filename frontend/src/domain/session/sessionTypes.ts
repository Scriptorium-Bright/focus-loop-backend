export type SessionStatus =
  | 'READY'
  | 'DEPARTING'
  | 'ACTIVE'
  | 'HARBOR_SEARCH'
  | 'RESTING'
  | 'RESUMING'
  | 'ARRIVING'
  | 'COMPLETED'
  | 'ABORTED';

export type SceneState =
  | 'DOCKED_VIEW'
  | 'CAST_OFF'
  | 'OPEN_WATER'
  | 'SEARCHING_HARBOR'
  | 'HARBOR_REST'
  | 'LEAVING_HARBOR'
  | 'APPROACHING_DESTINATION'
  | 'ARRIVED';

export type FocusMode = 'QUICK' | 'DAILY' | 'JOURNEY';
export type TimerMode = 'COUNTDOWN' | 'STOPWATCH';
export type RestMode = 'FIVE' | 'TEN' | 'FREE';

export interface FocusSession {
  id: string;
  taskId?: string;
  journeyId?: string;
  taskTitle: string;
  mode: FocusMode;
  timerMode: TimerMode;
  plannedSeconds: number;
  focusedSeconds: number;
  restSeconds: number;
  pauseCount: number;
  status: SessionStatus;
  skinId: string;
  departureHarborId: string;
  visitedHarborIds: string[];
  arrivalId?: string;
  seed: number;
  startedAt: string;
  completedAt?: string;
  taskCompleted?: boolean;
  note?: string;
  activeFocusStartedAt?: string;
  restStartedAt?: string;
  restMode?: RestMode;
  harborSearchStartedAt?: string;
  departureStartedAt?: string;
  resumingStartedAt?: string;
  arrivalStartedAt?: string;
}

export interface SessionMachine {
  session: FocusSession | null;
  status: SessionStatus;
  sceneState: SceneState;
  now: number;
  error?: string;
}

export type SessionAction =
  | {
      type: 'START';
      now: number;
      taskTitle: string;
      taskId?: string;
      journeyId?: string;
      mode: FocusMode;
      timerMode: TimerMode;
      plannedSeconds: number;
      skinId: string;
      seed: number;
    }
  | { type: 'TICK'; now: number }
  | { type: 'DEPARTURE_END'; now: number }
  | { type: 'SKIP_DEPARTURE'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'HARBOR_SEARCH_SKIP'; now: number; harborId: string }
  | { type: 'HARBOR_SEARCH_FOUND'; now: number; harborId: string }
  | { type: 'HARBOR_SEARCH_CANCEL'; now: number }
  | { type: 'REST_START'; now: number; mode: RestMode }
  | { type: 'RESUME'; now: number }
  | { type: 'RESUMING_END'; now: number }
  | { type: 'TIMER_END'; now: number }
  | { type: 'COMPLETE_EARLY'; now: number }
  | { type: 'END_SESSION'; now: number }
  | { type: 'ARRIVAL_END'; now: number }
  | { type: 'SAVE'; now: number; taskCompleted: boolean; note?: string }
  | { type: 'ABORT'; now: number }
  | { type: 'RESTORE'; machine: SessionMachine };

export const sceneForStatus = (status: SessionStatus): SceneState => {
  switch (status) {
    case 'DEPARTING':
      return 'CAST_OFF';
    case 'ACTIVE':
      return 'OPEN_WATER';
    case 'HARBOR_SEARCH':
      return 'SEARCHING_HARBOR';
    case 'RESTING':
      return 'HARBOR_REST';
    case 'RESUMING':
      return 'LEAVING_HARBOR';
    case 'ARRIVING':
      return 'APPROACHING_DESTINATION';
    case 'COMPLETED':
      return 'ARRIVED';
    default:
      return 'DOCKED_VIEW';
  }
};
