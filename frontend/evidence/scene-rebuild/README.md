# DAWN Static Scene Review

이번 증적은 장면 품질 재설계의 STEP 0~2 범위만 다룬다. Timer, Session state machine, Logbook, Journey, Entitlement, Purchase, Sync, Planning mode는 수정하지 않았다.

## Flicker audit

`SceneCanvas`의 깜빡임 원인은 실제 구현에서 확인했다.

- App의 `TICK`이 250ms마다 `progress`를 바꾸고 있었다.
- `SceneCanvas` effect가 `progress`를 dependency로 가져 매 tick마다 animation loop와 `ResizeObserver`를 다시 만들었다.
- effect 재생성마다 `resize()`가 `canvas.width`/`canvas.height`를 무조건 다시 써 drawing buffer를 비웠다.
- React StrictMode의 초기 effect 재실행도 첫 렌더의 buffer reset 가능성을 키웠다.

수정 후 non-DAWN Canvas는 props를 ref로 읽는 하나의 lifecycle만 유지하며, 실제 pixel size가 달라질 때에만 buffer를 재설정한다. DAWN review scene은 `img` 기반 정적 keyframe이므로 Canvas, `requestAnimationFrame`, wave/camera/foam animation을 사용하지 않는다.

## Captures

| Scene | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| DOCKED | `docked-desktop.png` | `docked-mobile.png` |
| DEPARTING reference | `departing-desktop.png` | `departing-mobile.png` |
| OPEN_WATER | `open-water-desktop.png` | `open-water-mobile.png` |
| HARBOR_REST | `harbor-rest-desktop.png` | `harbor-rest-mobile.png` |
| ARRIVAL | `arrival-desktop.png` | `arrival-mobile.png` |

브라우저에서 각 화면의 `<img>`가 로드 완료된 상태와 5개 keyframe path를 확인한 후 캡처했다. OPEN_WATER는 `IMG`, natural size `1672×941`, `/scenes/dawn/open-water.png`로 확인됐다.

## Review entry points

```text
?phase1Scene=docked
?phase1Scene=departing
?phase1Scene=open
?phase1Scene=rest
?phase1Scene=arrival
```

## Deliberately deferred

- 30fps real-time motion video 및 optical flow
- rope/dock temporal transition
- Harbor Search lights convergence
- arrival timing, audio fade, completion UI ordering
- other skin art direction

위 항목은 이 다섯 정지 keyframe의 승인 후 STEP 4~6에서만 재개한다. 이 단계의 이미지가 승인되지 않으면 motion 작업을 시작하지 않는다.
