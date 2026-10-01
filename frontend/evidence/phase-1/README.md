# Phase 1 장면 증적

Phase 1 장면 렌더러 결과다. `?phase1Scene=docked|open` 캡처 전용 진입점은 일반 Home/Focus/Rest 조합을 변경하지 않는다.

## 캡처

| 파일 | 뷰포트 | 상태 |
| --- | ---: | --- |
| `docked-desktop.jpg` | 1440×900 | `DOCKED_VIEW` |
| `docked-mobile.jpg` | 390×844 | `DOCKED_VIEW` |
| `open-water-desktop.jpg` | 1440×900 | `OPEN_WATER` |
| `open-water-mobile.jpg` | 390×844 | `OPEN_WATER` |
| `open-water-30fps-30s.webm` | 640×360 | `OPEN_WATER` |

## 영상 확인

```text
container: WebM
video: VP9, 640×360
r_frame_rate: 30/1
avg_frame_rate: 30/1
duration: 30.000000
frames: 900
```

브라우저 캡처 루프는 900개 프레임을 약 30초 동안 수집했고, 동일 프레임을 30fps·30초 WebM으로 인코딩한 뒤 `ffprobe`로 프레임 레이트와 길이를 확인했다. 두 시점의 프레임 해시가 달라 보우 밥·수면 움직임이 영상에 포함되어 있다.

## 범위

- Phase 1 증적은 `DOCKED_VIEW`와 `OPEN_WATER`의 장면 레이어에 한정한다.
- 이후 상태 연출은 제품 흐름에 통합했고, 별도 승인 대기 없이 진행했다.
