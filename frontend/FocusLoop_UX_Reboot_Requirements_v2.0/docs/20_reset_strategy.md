# 20. Existing Project Reset Strategy

## 1. 권장 판단

UI·Scene·상태 흐름은 새로 시작한다. Timer·Storage·API Adapter는 테스트 기반으로 선택 재사용한다.

## 2. 재사용 후보

- Timer Clock
- Reducer의 시간 계산
- Background 보정
- API Client
- Local Storage
- 일부 Task Type

## 3. 폐기 또는 Legacy

- 기존 3인칭 Ocean Scene
- 현재 Home Layout
- 현재 Focus Screen State Flow
- 기존 Skin 없는 Palette 구조
- 현재 단일 완료 Record UI
- Three.js 실험

## 4. 새 Branch

```text
ux-reboot-v2
```

## 5. Migration 기준

기존 기능을 억지로 유지하기보다 새 State Machine과 Data Model에 맞지 않으면 Adapter를 작성한다.

## 6. 단계적 전환

1. 새 App Shell
2. 새 Home
3. 새 Session State
4. 새 Scene
5. 새 Pause
6. 새 Logbook
7. 데이터 Migration
8. Legacy 제거

## 7. 롤백

기존 v1은 별도 Tag로 보존한다.
