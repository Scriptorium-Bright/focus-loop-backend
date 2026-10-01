# 02. Experience Architecture

## 1. 전체 구조

```text
Onboarding
→ Home / Docked
→ Task & Duration
→ Departure
→ Focus Sailing
→ Pause Requested
→ Harbor Search 15s
→ Rest Harbor
→ Resume Departure
→ Focus Sailing
→ Arrival
→ Logbook Entry
→ Home / Next Journey
```

## 2. 화면과 상태 분리

화면 전환과 세션 상태를 같은 값으로 처리하지 않는다.

### Session State

- READY
- DEPARTING
- ACTIVE
- HARBOR_SEARCH
- RESTING
- RESUMING
- ARRIVING
- COMPLETED
- ABORTED

### Screen

- ONBOARDING
- HOME
- FOCUS
- REST
- LOGBOOK
- JOURNEYS
- SKINS
- SETTINGS

## 3. 1인칭 Scene 상태

- DOCKED_VIEW
- CAST_OFF
- OPEN_WATER
- SEARCHING_HARBOR
- APPROACHING_HARBOR
- HARBOR_REST
- LEAVING_HARBOR
- APPROACHING_DESTINATION
- ARRIVED

## 4. 핵심 상태 전이

| 현재 | 이벤트 | 다음 | 타이머 |
|---|---|---|---|
| READY | START | DEPARTING | 즉시 시작 |
| DEPARTING | ANIMATION_END | ACTIVE | 계속 |
| ACTIVE | PAUSE | HARBOR_SEARCH | 즉시 정지 |
| HARBOR_SEARCH | FOUND | RESTING | 정지 |
| HARBOR_SEARCH | SKIP | RESTING | 정지 |
| RESTING | RESUME | RESUMING | 재개 준비 |
| RESUMING | ANIMATION_END | ACTIVE | 재개 |
| ACTIVE | TIMER_END | ARRIVING | 종료 |
| ACTIVE | COMPLETE_EARLY | ARRIVING | 종료 |
| ARRIVING | ANIMATION_END | COMPLETED | 종료 |
| COMPLETED | SAVE | LOGBOOK | 종료 |

## 5. 화면 철학

홈은 ‘정박 중’이다. 집중은 ‘항해 중’이다. 휴식은 ‘쉼터 항구’다. 종료는 ‘목적지 도착’이다. 항해일지는 결과 화면이 아니라 다음 여정으로 연결되는 기록 공간이다.
