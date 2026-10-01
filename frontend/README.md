# FocusLoop Web

`FocusLoop_UX_Reboot_Requirements_v2.0`를 기준으로 만든 React + TypeScript Web 구현입니다.

## 실행

```bash
npm install
npm run dev
```

검증:

```bash
npm test
npm run build
```

세부 상태 전이, 저장 시점, 화면 계약, self-check 기준은 [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)에 기록했습니다. 원 설계 문서는 [`FocusLoop_UX_Reboot_Requirements_v2.0`](./FocusLoop_UX_Reboot_Requirements_v2.0/)에서 확인합니다.

구현된 핵심 흐름은 Quick/Daily/Journey 시작, Scene 기반 Departure·Focus·Pause·Harbor Search·Rest·Resume·Arrival, Completion Choice와 Scene Snapshot Logbook입니다. Journey Detail, Session Recovery, 스킨 Preview/Sound Preview, JSON·CSV·이미지 Export·삭제도 포함합니다.

local-first Sync Queue(멱등 event·backoff·Tombstone), 작업명 비식별 analytics, Offline Entitlement Cache와 결제 Adapter, PWA manifest/service worker, 장면 FPS 표시를 포함합니다. `VITE_FOCUSLOOP_SYNC_URL`과 `VITE_FOCUSLOOP_PURCHASE_URL`이 없으면 세션·기록은 로컬에 남고, 실제 서버/결제 호출은 하지 않습니다.

현재 검증 명령은 `npm test`(34개)와 `npm run build`입니다. 기존 Phase 1 움직임 증적은 [`evidence/phase-1/`](./evidence/phase-1/)에 보관합니다. 현재 DAWN 장면은 정적 keyframe 승인 단계로 전환했으며, 5개 상태의 Desktop/Mobile 캡처와 flicker audit은 [`evidence/scene-rebuild/`](./evidence/scene-rebuild/)에 있습니다. Chrome에서는 320×568 Home과 Focus·Pause·Rest DOM 흐름을 확인했습니다.

실제 Cloud Sync endpoint·인증, 결제 SDK/영수증 검증, iOS/Android 실기기, 25분 사용성·발열 테스트는 별도 외부 검증 범위입니다. 세부 self-check는 [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)에 기록했습니다.

## 선택 연동 환경 변수

- `VITE_FOCUSLOOP_SYNC_URL`: `${URL}/events`로 Sync Queue item을 POST합니다. `idempotency-key`는 event ID입니다.
- `VITE_FOCUSLOOP_PURCHASE_URL`: `/purchases/skin` 구매 요청과 `/entitlements` 복원 요청을 사용합니다. 서버는 영수증 검증 후 `EntitlementCache` 형태를 반환해야 합니다.
