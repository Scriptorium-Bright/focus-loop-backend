# Persistence, Offline & Sync Requirements

## 1. Local-first

세션 시작, Pause, Rest, Resume, 종료는 네트워크 없이 동작해야 한다.

## 2. 저장 시점

- 작업 입력 변경: Debounce
- Session Start
- 상태 전이
- 매 15~30초 Snapshot
- Background
- Pause
- Resume
- Completion
- Logbook Save

## 3. 진행 중 Session 복구

앱 재실행 시:

- 마지막 상태
- Focus 경과시간
- Rest 경과시간
- Skin
- 작업
- 방문 항구
- Pause 횟수

## 4. Sync 충돌

### 권장

- Session은 Immutable Event + 최종 Summary
- Logbook Entry ID 멱등
- 최신 수정시간 기반 Note 병합
- 삭제 Tombstone

## 5. Offline Purchase

최근 검증된 Entitlement Cache를 사용하고 만료 정책을 명확히 한다.

## 6. Export

- JSON
- CSV 선택
- Logbook 이미지
- 삭제 가능

## 7. Privacy

작업명은 사용자의 사적 데이터다. Analytics에 원문을 보내지 않는다.
