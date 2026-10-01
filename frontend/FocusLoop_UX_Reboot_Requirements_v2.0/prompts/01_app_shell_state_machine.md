# Prompt 01 — New App Shell & State Machine

새 SessionStatus와 Screen 구조를 구현하라.

READY, DEPARTING, ACTIVE, HARBOR_SEARCH, RESTING, RESUMING, ARRIVING, COMPLETED, ABORTED.

Timer:
- Start 즉시
- Pause 즉시
- Rest 별도
- Background 보정

Scene은 Placeholder Component로 연결하되 상태 전이는 완성하라.
