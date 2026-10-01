# 03. First-Person Scene Specification

## 1. 시점 정의

사용자는 작은 보트의 좌석에 앉아 정면 수평선을 바라본다. 캐릭터의 손이나 몸은 기본 표시하지 않는다.

### 화면 구성

- 상단 32~38%: 하늘
- 중단: 수평선과 먼 환경
- 하단 12~20%: 보트의 선수, 좌우 난간, 밧줄 일부
- 중앙: 수면과 빛의 경로
- UI: 수평선과 선수의 핵심 형태를 가리지 않음

## 2. 왜 선수 일부를 보여주는가

선수나 난간이 전혀 없으면 단순 바다 배경처럼 보인다. 하단에 보트 일부가 있으면 사용자는 자신이 배 위에 있다는 공간감을 즉시 이해한다.

## 3. 카메라 안정성

### 일반 모드

- Vertical Bob: 1.5~3.5px
- Roll: ±0.15~0.35도
- Horizontal Drift: 0~1.5px
- 주기: 8~18초
- 카메라 Zoom 없음
- 자유 시점 없음

### Reduce Motion

- Bob: 0~0.8px
- Roll: 0
- 수면 명암 변화만 유지
- 항구 탐색 시 카메라 이동 대신 빛·레이더 UI 사용

## 4. 2.5D 레이어

```text
Sky Gradient
Far Clouds
Horizon Haze
Far Landmarks
Far Water
Mid Water Fields
Near Water
Boat Bow / Gunwale
Rope / Anchor Detail
Contact Foam
UI
Tone Overlay
```

## 5. 구현 방식

권장:

- Web: Canvas 2D
- Native: Skia 우선, 미지원 시 SVG + Reanimated
- Original SVG/Path로 선수·난간 제작
- Procedural Water Field
- 스킨별 원본 Vector Component 사용 가능
- Stock Image, 무단 에셋, 3D 모델 의존 금지

## 6. 홈의 1인칭 정박 시점

홈에서도 사용자는 이미 배에 앉아 있다.

- 좌측 또는 우측에 짧은 부두 가장자리
- 하단 선수
- 밧줄이 부두 고리에 연결
- 물결은 매우 약함
- 멀리 개방된 바다
- Composer는 선수와 밧줄을 가리지 않음

## 7. 출항 시점

- 밧줄이 느슨해지고 시야 밖으로 사라짐
- 부두가 아주 천천히 옆으로 밀림
- 수면 흐름이 조금 증가
- 큰 카메라 이동 없음
- 2~4초

## 8. 집중 시점

- 부두 없음
- 열린 수평선
- 스킨별 먼 랜드마크
- 선수는 화면 하단에 안정적으로 존재
- UI 자동 숨김

## 9. 항구 탐색 시점

카메라가 실제로 360도 회전하지 않는다.

대신:

- 주변 밝기 약간 감소
- 얇은 Compass Arc
- 좌우 5~8% 범위의 느린 시야 이동 또는 Parallax
- 먼 불빛 후보 2~3개
- 15초 진행
- 최종 한 불빛이 선택되어 접근

## 10. 항구 휴식 시점

- 가까운 방파제 또는 부표
- 물결이 더 잔잔함
- 멀리 작은 항구 불빛
- 선수는 같은 위치
- 휴식 UI가 낮은 대비로 표시

## 11. 도착 시점

- 목적지 랜드마크가 수평선에서 조금 커짐
- 빛의 경로가 선수를 향함
- 배 움직임 감소
- 짧은 정박 소리
- 항해일지 Sheet 등장
