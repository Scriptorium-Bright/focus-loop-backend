# 17. Technical Architecture Requirements

## 1. Reboot 원칙

새 상태 모델과 화면 구조를 먼저 구현한 뒤 기존 코드를 선별 재사용한다.

## 2. 모듈

```text
app/
domain/
  session/
  tasks/
  journeys/
  logbook/
  skins/
scene/
  renderer/
  firstPersonBoat/
  water/
  harbor/
  transitions/
audio/
ui/
storage/
analytics/
```

## 3. Session State Machine

Reducer 또는 명시적 State Machine.

```ts
type SessionStatus =
  | 'READY'
  | 'DEPARTING'
  | 'ACTIVE'
  | 'HARBOR_SEARCH'
  | 'RESTING'
  | 'RESUMING'
  | 'ARRIVING'
  | 'COMPLETED'
  | 'ABORTED';
```

## 4. Timer

- Focus Timer
- Rest Timer
- Wall Clock 보정
- Pause 즉시
- Background 복귀
- Countdown / Stopwatch

## 5. Scene Contract

```ts
type SceneProps = {
  sceneState: SceneState;
  progress: number;
  skin: FocusSkin;
  reduceMotion: boolean;
  seed: number;
  harborSearchProgress?: number;
};
```

## 6. Skin Registry

Config + Renderer Component.

## 7. Logbook Repository

Local-first, Sync Adapter.

## 8. Migration

기존 Timer·Storage·API Adapter는 테스트 후 재사용 가능. 기존 Scene과 Screen은 Legacy로 이동한다.

## 9. Legacy

```text
legacy/v1-ocean/
```

새 코드가 Legacy Scene을 Import하지 않도록 한다.
