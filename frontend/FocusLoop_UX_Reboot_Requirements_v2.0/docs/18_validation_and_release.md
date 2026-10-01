# 18. Validation & Release Gates

## Gate 0. Concept

- 1인칭 화면 Mock
- 정박·출항·항해·항구·도착 5개 Frame
- 사용자 5명 이해

## Gate 1. Static Scene

- 기본 스킨 정적 화면
- Mobile/Desktop
- 선수와 수평선
- UI 없음

## Gate 2. Motion

- 30fps
- 30초
- 멀미 없음
- 3초 Motion 인지

## Gate 3. Core Loop

- READY→DEPARTING→ACTIVE→ARRIVING→LOGBOOK
- Timer 정확성

## Gate 4. Pause

- Pause 즉시
- 15초 항구 탐색
- Skip
- Rest
- Resume

## Gate 5. Skin

- 3개 이상
- 색만 다른 것이 아님
- Sound와 항구 차이

## Gate 6. Logbook

- 자동 기록
- Daily/Weekly/Journey
- 이어가기

## Gate 7. Native

- iOS/Android
- FPS
- Battery
- Audio
- Background

## Gate 8. 25분 사용

- 편안함
- 집중 방해
- 재사용 의향

## 출시 Blocker

- Home CTA 잘림
- Pause 지연
- 멀미
- Timer 오차
- 빈 Scene
- Skin 차이 없음
- Logbook 유실
- Native 미검증

## 2026-08-10 Web 검증 기록

- Gate 3~6의 Web 핵심 흐름을 Chrome에서 확인했다: Home → Focus → Pause → Harbor Search → Rest → Resume → Arrival → Logbook, Planning, Skin.
- 320×568 Home과 desktop Home, Settings sync row, Skin purchase/restore boundary를 확인했다.
- Vitest 25개와 production build를 통과했고, `manifest.webmanifest`와 `sw.js`가 build 산출물에 포함됐다.
- Gate 7 Native, Gate 8 25분 사용성·멀미·발열은 실기기와 사용자 검증이 필요한 항목으로 남긴다.
