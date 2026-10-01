# Data Model Specification

## Session

```ts
type FocusSession = {
  id: string;
  taskId?: string;
  taskTitle: string;
  mode: 'QUICK' | 'DAILY' | 'JOURNEY';
  timerMode: 'COUNTDOWN' | 'STOPWATCH';
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
};
```

## Skin

```ts
type FocusSkin = {
  id: string;
  name: string;
  access: 'FREE' | 'PREMIUM' | 'UNLOCK';
  paletteId: string;
  boatViewId: string;
  soundProfileId: string;
  departureId: string;
  harborIds: string[];
  arrivalId: string;
};
```

## Journey

```ts
type Journey = {
  id: string;
  title: string;
  stages: JourneyStage[];
  activeTaskId?: string;
  accumulatedSeconds: number;
  completedAt?: string;
};
```

## LogbookEntry

```ts
type LogbookEntry = {
  id: string;
  sessionId: string;
  visualSnapshot: SceneSnapshot;
  title: string;
  focusedSeconds: number;
  restSeconds: number;
  taskCompleted: boolean;
  note?: string;
  createdAt: string;
};
```
