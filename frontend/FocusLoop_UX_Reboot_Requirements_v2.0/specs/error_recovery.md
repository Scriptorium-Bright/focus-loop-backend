# Error & Recovery Requirements

| 오류 | 복구 | 보장 |
| --- | --- | --- |
| Scene Renderer Failure | Static Skin Poster를 코드로 렌더 | Timer 계속 |
| Audio Failure | 무음 상태 알림 | Timer 계속 |
| Network Failure | Local Mode | 나중에 Sync |
| Start API Failure | Local Session 시작 | Notice |
| Finish API Failure | Local Logbook 저장 | Retry Queue |
| App Crash | Snapshot 복구 | Recovery Screen |
| Harbor Search Animation Failure | 즉시 Rest Harbor | Timer 정지 유지 |
| Arrival Animation Failure | 즉시 Completion Choice | Logbook 생성 |
| Skin Missing | 기본 Dawn | 세션 계속 |
| Purchase Failure | 기존 스킨 유지 | 재시도 |
