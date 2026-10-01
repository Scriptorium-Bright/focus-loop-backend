# 19. Reboot Roadmap

## Phase 0 — 폐기·재사용 판단

- 기존 코드 Audit
- Timer 재사용
- Storage 재사용
- Scene Legacy 이동
- UX State Machine 생성

## Phase 1 — 1인칭 정박 홈

- 선수
- 부두
- 밧줄
- Composer
- 기본 스킨

## Phase 2 — 출항과 항해

- Departure
- Active Scene
- UI Hide
- Sound

## Phase 3 — Pause와 항구

- Pause 즉시
- 15초 Search
- Rest
- Resume

## Phase 4 — 도착과 항해일지

- Arrival
- Record
- Logbook

## Phase 5 — 스킨

- Dawn
- Coast
- Rain
- Moonlight

## Phase 6 — Planning

- Quick
- Daily
- Journey

## Phase 7 — QA

- Web
- Native
- Accessibility
- 25분 사용자 테스트

## Phase 8 — Monetization

핵심 리텐션 검증 후.

## 현재 구현 기록

- Phase 0~6 Web 구현: 상태 모델, Local-first 저장, Canvas Scene, Pause/Rest/Resume, Logbook, Skin, Quick/Daily/Journey 완료.
- Phase 7 Web 일부: 320×568·desktop·접근성 DOM·오류 fallback·Sync Queue·Export·PWA·FPS 진단 확인.
- Phase 7 Native와 25분 사용자 검증, Phase 8 실제 결제·영수증 검증은 외부 환경에서 진행한다.
