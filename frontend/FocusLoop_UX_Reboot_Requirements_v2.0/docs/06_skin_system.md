# 06. Skin System Requirements

## 1. 정의

스킨은 배경색 변경이 아니다.

```text
Skin
=
시각 팔레트
+ 하늘
+ 수면 움직임
+ 선수·보트 내부
+ 출발 항구
+ 휴식 항구
+ 목적지
+ 사운드
+ 출항 연출
+ 도착 연출
```

## 2. 스킨 구조

```ts
type FocusSkin = {
  id: string;
  name: string;
  access: 'FREE' | 'PREMIUM' | 'UNLOCK';
  palette: SkinPalette;
  boatView: BoatViewSpec;
  water: WaterMotionSpec;
  sky: SkySpec;
  sound: SoundProfile;
  departure: DepartureSpec;
  pauseHarbors: HarborSpec[];
  arrival: ArrivalSpec;
  reduceMotion: ReduceMotionSpec;
};
```

## 3. 출시 스킨 제안

### A. 고요한 새벽 — 무료 기본

- 회청색
- 잔잔한 파도
- 작은 목재 선수
- 먼 등대
- 기본 Water Bed
- 출발: 조용한 부두
- 휴식: 작은 등대 부두
- 도착: 해가 조금 오른 해안

### B. 맑은 연안 — 무료

- 밝은 청록·회백색
- 조금 더 선명한 수면
- 갈매기 0~1회
- 출발: 햇빛 있는 선착장
- 휴식: 부표가 있는 작은 만
- 도착: 따뜻한 해안 마을 불빛

### C. 비 오는 방파제 — Premium

- 흐린 청회색
- 빗방울 파문
- 낮은 천둥 없음
- 출발: 젖은 부두
- 휴식: 방파제 안쪽
- 도착: 비 속의 따뜻한 창

### D. 달빛 항해 — Premium

- 남청색
- 달빛 반사
- 별 1~5개
- 느린 파도
- 출발: 야간 부두
- 휴식: 등대 아래
- 도착: 항구 불빛

### E. 안개 해역 — Unlock

- 낮은 대비
- 안개
- 부표 안내음
- 랜드마크가 천천히 드러남
- 긴 여정 완료로 해금

## 4. 스킨 Preview

- 8~12초
- 정박 상태
- 출항 2초
- 집중 장면 5초
- 항구 2초
- Sound Preview
- 집중 시작 없이도 Preview 가능

## 5. 스킨 선택 시점

- Home
- Settings
- Session 시작 전

집중 중 즉시 스킨 변경은 기본 금지. 변경은 다음 출항부터 적용한다.

## 6. 스킨 개인화

초기에는 다음만 허용한다.

- 전체 Sound Volume
- Motion 감소
- 선수 밝기
- UI 밝기

복잡한 색상 Editor는 제외한다.

## 7. 해금

- 기본 2개 무료
- Premium 2개
- 장기 여정 완료 해금 1개
- 이벤트 한정은 추후 검토

## 8. 품질 기준

- 색만 다르게 보이면 실패
- 선수·항구·사운드 차이를 인지해야 함
- 각 스킨도 25분 동안 편안해야 함
- Premium이 무료보다 화려한 것이 아니라 다른 분위기여야 함
