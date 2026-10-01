# 12. Sound System Requirements

## 1. 공통 레이어

- Deep Swell
- Water Bed
- Foam
- Wind
- Wood Creak
- Harbor Ambience
- Rain / Night Skin Layer

## 2. 상태별 믹스

| 상태 | Sound |
|---|---|
| Docked | 낮은 Water Bed, 부두 소리 |
| Departing | Fade In, 밧줄·물 접촉 |
| Active | Skin Mix |
| Harbor Search | High Filter 감소, Compass Tone 선택 |
| Rest | Harbor Ambience, 낮은 파도 |
| Resuming | Active Mix 복귀 |
| Arriving | Fade Down, 정박 소리 |
| Logbook | 거의 무음 |

## 3. 반복 방지

- 단일 짧은 Loop 금지
- 서로 다른 Layer 주기
- Seeded Event
- 10분 반복 검사

## 4. 사용자 제어

- 전체 On/Off
- Volume
- 물/비/바람 고급 Mixer는 Premium 후보
- System Audio Interrupt 대응

## 5. 접근성

- Sound 없이 상태 이해
- 갑작스러운 큰 소리 없음
- 종료 진동 선택
