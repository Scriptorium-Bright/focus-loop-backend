# FocusLoop UX Reboot 구현 계획

이 문서는 `FocusLoop_UX_Reboot_Requirements_v2.0`를 현재 저장소에서 실행 가능한 Web 구현으로 옮기기 위한 기준이다. 구현 중에는 이 문서의 상태와 self-check를 갱신한다.

## 1. 구현 범위

### 1차 실행 범위

- React + TypeScript + Vite Web 앱
- 1인칭 정박 홈과 집중 Scene
- Quick / Daily / Journey 입력 모드
- Daily 작업 추가와 Quick 작업의 Daily/Journey 승격 제안
- Countdown / Stopwatch
- `READY → DEPARTING → ACTIVE → HARBOR_SEARCH → RESTING → RESUMING → ARRIVING → COMPLETED`
- Pause 즉시 Focus Timer 정지
- 15초 항구 탐색, Skip, 집중 복귀
- 5분·10분·자유 휴식, 수동 Resume
- Arrival 및 Completion Choice
- Local-first 세션·Logbook·Task·Journey 저장
- Dawn / Coast / Rain / Moon / Fog 스킨 Registry
- Focus UI 자동 숨김, Reduce Motion, Sound Off
- Home / Focus / Rest / Logbook / Journeys / Skins / Settings 화면
- Journey Detail / Session Recovery 화면
- Canvas 기반 2.5D Scene과 정적 Fallback
- 스킨별 Sound Preview와 Audio 실패 무음 안내
- Logbook 일간·주간·긴 여정 View, 삭제, JSON·CSV·이미지 Export
- local-first Sync Queue, 멱등 이벤트, Exponential Backoff, privacy-safe payload
- PWA manifest·service worker·오프라인 상태 안내
- 로컬 analytics event catalog와 작업명 비식별화
- Offline Entitlement Cache와 결제/복원 API Adapter 경계
- 장면 FPS 측정값의 설정 화면 표시

### 아직 외부 연동이 필요한 것

- 서버 인증과 실제 Cloud Sync endpoint
- 실제 결제 SDK·영수증 검증
- iOS/Android 실기기 검증
- 25분 장시간 사용성·멀미·발열 사용자 검증
- 외부 이미지·외부 음원·3D 모델

외부 연동 항목은 Domain/API Adapter 경계를 유지하고, 서버가 없을 때도 local-first 흐름이 중단되지 않도록 처리한다.

## 2. 구조

```text
frontend/
  index.html
  package.json
  src/
    app/
      App.tsx
    domain/
      session/
        sessionTypes.ts
        sessionReducer.ts
        timerClock.ts
      tasks.ts
      journeys.ts
      logbook.ts
      skins.ts
      entitlements.ts
    scene/
      SceneCanvas.tsx
      sceneRenderer.ts
    audio/
      ambientAudio.ts
    analytics/
      analytics.ts
    sync/
      syncQueue.ts
      syncEvents.ts
      syncTransport.ts
    purchase/
      purchaseGateway.ts
    storage/
      localRepository.ts
      exportFormats.ts
    ui/
      AppShell.tsx
      HomeScreen.tsx
      FocusScreen.tsx
      RestScreen.tsx
      LogbookScreen.tsx
      JourneysScreen.tsx
      SkinsScreen.tsx
      SettingsScreen.tsx
      Onboarding.tsx
      primitives.tsx
    styles/
      tokens.css
      app.css
    **/*.test.ts
```

Domain은 React와 분리한다. Scene은 `sceneState`, `progress`, `skin`, `reduceMotion`, `seed`, `harborSearchProgress`만 받아 세션 로직을 소유하지 않는다.

## 3. 상태 모델

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

### 전이 계약

| 현재 | 이벤트 | 다음 | 시간 처리 |
| --- | --- | --- | --- |
| READY | START | DEPARTING | Focus 시작 시각 기록 |
| DEPARTING | SKIP / DEPARTURE_END | ACTIVE | Focus 시간 계속 |
| ACTIVE | PAUSE | HARBOR_SEARCH | Focus 즉시 정지 |
| HARBOR_SEARCH | FOUND / SKIP | RESTING | Focus 정지 |
| HARBOR_SEARCH | CANCEL | ACTIVE | Focus 재개 |
| RESTING | RESUME | RESUMING | Rest 종료, Focus 재개 |
| RESTING | END | ARRIVING | Focus 종료 |
| RESUMING | END / SKIP | ACTIVE | Focus 계속 |
| ACTIVE | TIMER_END / COMPLETE_EARLY | ARRIVING | Focus 종료 |
| ARRIVING | ARRIVAL_END / SKIP | COMPLETED | 기록 준비 |
| COMPLETED | SAVE | READY | Logbook 저장 |
| 모든 진행 상태 | ABORT | ABORTED | 현재 시간 보존 |

### Timer 규칙

- `Date.now()`와 저장된 timestamp로 경과 시간을 계산한다.
- 렌더링용 `setInterval`은 표시 갱신만 담당하고 시간의 기준이 아니다.
- Countdown은 `plannedSeconds - focusedSeconds`를 표시하고 0에서 `TIMER_END`를 한 번만 발행한다.
- Stopwatch는 `focusedSeconds`를 표시하고 자동 종료하지 않는다.
- Pause 시 `focusedSeconds`를 누적하고 `focusResumedAt`을 비운다.
- Rest는 `restStartedAt`과 `restMode`를 별도 관리한다.
- `visibilitychange`와 재실행 시 같은 계산을 사용한다.

## 4. Local-first 데이터

저장 키는 버전을 포함한다.

```text
focusloop:v2:settings
focusloop:v2:tasks
focusloop:v2:journeys
focusloop:v2:session
focusloop:v2:logbook
focusloop:v2:syncQueue
focusloop:v2:entitlements
```

저장 시점:

- 입력 변경: debounce
- 세션 시작·상태 전이
- 15~30초 snapshot
- visibility hidden
- Pause / Resume / Completion
- Logbook 저장

세션과 Logbook은 client ID를 사용해 중복 저장을 방지한다. 상태·Logbook·삭제 Tombstone은 local Sync Queue에 멱등 event로 쌓이고, 서버 endpoint가 설정된 경우에만 Exponential Backoff로 비동기 전송한다. 작업명과 메모 원문은 analytics·sync payload에 넣지 않는다. Entitlement는 검증 만료시각이 있는 캐시로 저장한다.

## 5. Scene 구현 계약

Canvas 2D로 다음 레이어를 그린다.

```text
Sky Gradient
Far Clouds / Haze
Far Landmark
Water Fields
Boat Bow / Gunwale
Rope / Dock / Harbor Light
Contact Foam
```

상태별 표현:

- `DOCKED_VIEW`: 부두·밧줄·약한 물결·선수
- `CAST_OFF`: 밧줄 해제·부두 Parallax·2~4초
- `OPEN_WATER`: 열린 수평선·선수·스킨 랜드마크
- `SEARCHING_HARBOR`: Compass Arc·불빛 후보·15초 진행
- `HARBOR_REST`: 부표·방파제·낮은 수면 속도
- `LEAVING_HARBOR`: 항구 이탈·1.5~3초
- `APPROACHING_DESTINATION`: 불빛 확대·움직임 감쇠·2~4초
- `ARRIVED`: 안정된 수면·도착 불빛

일반 Motion 범위는 Bob 1.5~3.5px, Roll ±0.35° 이하, Zoom 없음으로 고정한다. Reduce Motion에서는 Roll 0, Bob 0~0.8px, 탐색 3초 Fade로 축소한다.

### Phase 1 검증 상태

- `DOCKED_VIEW`: 수평선·수면 필드·좌측 부두·밧줄·하단 1인칭 선수/건월을 확인했다.
- `OPEN_WATER`: 수평선·광원 경로·수면 레이어·선수/건월·배 안쪽 짧은 밧줄을 확인했다. 수면은 면과 그라디언트를 주 레이어로 사용하고 선은 보조 요소로 제한했다.
- 데스크톱·모바일 정적 캡처와 30fps·30초 영상은 [`evidence/phase-1/`](./evidence/phase-1/)에 남겼다.
- 사용자 요청으로 별도 승인 대기 없이 Phase 2 이후 구현을 진행했다. Phase 1 캡처·영상은 [`evidence/phase-1/`](./evidence/phase-1/)에 보관한다.

## 6. 화면별 구현 계약

### UX v2 구현 상태

- [x] Phase 2: Scene 기반 출항·쉼터 탐색·휴식·재출항·도착 전환과 상태별 오디오 믹스
- [x] Phase 3: Docked Home과 320×568 Composer 배치
- [x] Phase 4: 상태 Card 제거, Timer 크기 조정, Focus UI 자동 숨김
- [x] Phase 5: HARBOR_REST 중심 Rest 화면
- [x] Phase 6: 하늘·수면·선체·부두·쉼터·도착 표식을 포함한 FocusSkin 확장
- [x] Phase 7: 11초 Dock → Departure → Open Water → Harbor → Arrival Preview
- [x] Phase 8: Scene Snapshot 기반 Logbook 카드

### Home

- 정박 Scene을 전체 배경으로 둔다.
- Quick은 작업명·시간·스킨·시작을 한 화면에 둔다.
- Daily는 최대 3개 Task 중 현재 Task를 선택한다.
- Journey는 Project·Stage·다음 Task를 선택한다.
- 320×568에서 Start CTA가 항상 보인다.
- 긴 목록만 내부 Scroll을 사용한다.

### Focus

- 기본 노출은 작업명·Timer·Pause·Sound·Exit다.
- 4~6초 후 controls를 숨기고 탭으로 다시 보인다.
- 장면 오류와 관계없이 Timer와 상태는 계속 동작한다.

### Harbor Search / Rest

- Pause handler의 첫 동작은 `PAUSE` dispatch다.
- Search UI에 15초 Countdown, Skip, Cancel을 둔다.
- Rest는 5분·10분·자유를 선택하고 자동 Resume하지 않는다.

### Arrival / Logbook

- Timer 종료와 조기 완료는 Arrival을 거친다.
- 완료 여부를 선택하고, 집중시간·휴식시간·Pause 횟수·스킨·항구·메모를 기록한다.
- Logbook에서 같은 작업 이어가기 CTA를 제공한다.

## 7. 스킨 Registry

스킨은 팔레트만 바꾸지 않고 다음 데이터를 가진다.

```ts
type FocusSkin = {
  id: string;
  name: string;
  access: 'FREE' | 'PREMIUM' | 'UNLOCK';
  palette: Palette;
  sky: SkyProfile;
  ocean: OceanProfile;
  vessel: VesselProfile;
  departureDock: HarborVariant;
  pauseHarbors: HarborVariant[];
  arrivalLandmark: ArrivalLandmark;
  audio: AudioProfile;
  motion: MotionProfile;
};
```

초기 Registry:

- `DAWN`: 무료, 등대 부두, 새벽 해안
- `COAST`: 무료, 작은 만, 해안 마을
- `RAIN`: Premium 표기, 방파제, 따뜻한 창
- `MOON`: Premium 표기, 등대 아래, 항구 불빛
- `FOG`: 여정 완료 후 해금, 부표 쉼터, 안개 부표

집중 중 스킨 변경은 하지 않고 다음 세션에서 적용한다. Preview는 정박·출항·항해·항구를 한 화면에서 보여준다.
Premium/Unlock 스킨은 브라우저에서 미리볼 수 있지만 접근 조건을 충족하기 전에는 적용할 수 없다.

## 8. 접근성·오류 복구

- 모든 핵심 조작의 touch target은 44px 이상이다.
- `aria-label`, visible focus, keyboard activation을 제공한다.
- 색상만으로 상태를 전달하지 않는다.
- Sound Off에서도 상태 문구와 Timer로 흐름을 이해할 수 있다.
- Scene 오류는 정적 skin poster로 fallback한다.
- Audio 오류는 무음 상태로 유지하고 Timer를 계속한다.
- API 오류는 local session을 시작하고 이후 동기화 대상으로 남긴다.
- 앱 복귀는 저장된 session timestamp로 Focus/Rest 경과시간을 보정한다.
- Scene/Audio 오류는 Timer를 중단하지 않고 Fallback 또는 무음 안내로 전환한다.
- 구매 서버가 없으면 Premium preview와 구매 경계만 제공하고, 성공하지 않은 권한을 로컬에 추가하지 않는다.
- Canvas 장면은 DPR을 2로 제한하고 visibility hidden에서 animation을 중단한다.

## 9. 구현 순서

1. Vite shell, tokens, App state와 local repository
2. Session reducer와 wall-clock timer
3. Canvas Scene과 Docked Home
4. Departure·Focus·UI auto-hide
5. Pause·Harbor Search·Rest·Resume
6. Arrival·Completion Choice·Logbook
7. Skin Registry·Preview·Settings
8. Daily·Journey·Logbook tabs
9. Audio toggle·preview·fallback·accessibility
10. Daily/Journey 승격·Journey Detail·Session Recovery·Logbook 관리
11. unit test·production build·320×568/desktop render check
12. Sync Queue·Export·Analytics·Entitlement·Purchase Adapter와 PWA shell
13. Web QA 재확인 및 외부 검증 항목 분리

## 10. Self-check 기준

### 기능

- [x] START 직후 Focus elapsed가 증가한다.
- [x] Pause 클릭과 같은 reducer tick에서 Focus elapsed 증가가 멈춘다.
- [x] Search는 15초이고 Skip/Cancel이 동작한다.
- [x] Rest Timer와 Focus Timer가 분리된다.
- [x] Resume 후 같은 session ID가 유지된다.
- [x] Arrival에서 Completion Choice 후 Logbook이 한 번 생성된다.
- [x] 새로고침 후 진행 중 session이 복구된다.

### 화면

- [x] 320×568 Home에서 작업 입력·시간·스킨·Start CTA가 한 화면에 보인다. (Chrome 320×568 DOM/화면 확인)
- [x] Home은 선수·부두·밧줄이 있는 정박 장면이다.
- [x] Focus controls가 자동 숨김·탭 재노출된다.
- [x] Reduce Motion에서 Roll/큰 Parallax가 없다.
- [x] 5개 스킨이 하늘·수면·선체·항구·도착 표식·사운드에서 구분되고 Premium/Unlock 적용 조건이 표시된다.

### 품질

- [x] Scene Canvas 실패 시 정적 Fallback이 보인다.
- [x] Sound Off에서도 상태 문구가 보인다.
- [x] localStorage 저장·복구가 동작한다.
- [x] keyboard와 screen reader label을 코드·DOM으로 확인한다.
- [x] Sync Queue가 멱등성·재시도 backoff·Tombstone을 보존한다.
- [x] JSON·CSV·Logbook 이미지 Export 경계를 구현한다.
- [x] 작업명 원문을 analytics·sync payload에 넣지 않는다.
- [x] Premium 권한은 검증된 Entitlement Cache가 신선할 때만 적용한다.
- [x] PWA manifest·service worker가 production build에 포함된다.
- [x] 장면 FPS 측정값을 설정 화면에 표시할 수 있다.
- [x] `npm run test` 통과 (28개)
- [x] `npm run build` 통과
- [x] 320×568 Home과 desktop Home 화면 확인
- [x] Chrome에서 Home→Focus→Pause→Harbor Search→Rest→Resume→Arrival→Logbook 확인
- [x] Chrome에서 Settings sync row와 Skin purchase/restore boundary 확인

### 현재 범위 밖인 검증

- iOS/Android 실기기 FPS·배터리·Background·Audio Interrupt 검증
- 실제 Cloud Sync endpoint·인증·서버 충돌 병합 검증
- 실제 결제 SDK·영수증 검증 및 구매 성공 상태
- 25분 장시간 사용성·멀미·발열 사용자 테스트
- 연결된 서버를 사용한 API 실패·409·재시도 시나리오

## 구현 로그

| 날짜 | 단계 | 변경 | self-check |
| --- | --- | --- | --- |
| 2026-08-10 | 계획 | 설계 문서 분석 및 Web MVP 구현 계약 작성 | 완료 |
| 2026-08-10 | Domain | wall-clock 세션 reducer, 중복 START 방어, 휴식·항구·도착 전이, Journey 진행 상태 구현 | reducer/timer/Journey 테스트 통과 |
| 2026-08-10 | UI | Docked Home, Focus auto-hide, Harbor Search, Rest, Arrival/Logbook, Planning, Journey Detail/Recovery, Skin Preview/사운드 Preview, Settings 구현 | Chrome 320×568·desktop 흐름 확인 |
| 2026-08-10 | 운영성 | local-first 저장, 상태 전이 즉시 저장, 15초 snapshot/visibility 저장, Logbook migration/export/delete, Canvas fallback, Audio 무음 fallback, scene failure 전환, sound/reduce-motion 경계 구현 | production build 통과 |
| 2026-08-10 | 후속 구현 | Sync Queue·멱등 event·backoff·Tombstone, CSV/이미지 Export, privacy-safe analytics, PWA shell, Entitlement Cache·Purchase Adapter, FPS 진단 표시 구현 | 관련 unit test 통과 |
| 2026-08-10 | UX v2 | Scene 기반 CAST_OFF·SEARCHING_HARBOR·HARBOR_REST·LEAVING_HARBOR·APPROACHING_DESTINATION, 상태 카드 제거, Home/Rest/Skins/Logbook Scene 재구성, 스킨 환경 데이터 확장 구현 | 28개 테스트·production build 통과 |
| 2026-08-10 | 검증 | Phase 1 Desktop/Mobile 캡처와 OPEN_WATER 30fps·30초 영상 확인, 320×568 Home 및 핵심 Focus/Pause/Rest DOM 확인 | 실기기·25분 장시간 멀미·발열은 외부 검증 |
