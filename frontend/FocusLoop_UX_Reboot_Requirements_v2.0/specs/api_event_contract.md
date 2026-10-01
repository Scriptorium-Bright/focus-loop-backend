# API & Event Contract Requirements

## 1. 원칙

UI는 서버 응답을 기다리느라 출항을 막지 않는다. 서버 기록은 시작·상태 변경·종료 이벤트를 비동기적으로 동기화할 수 있다.

## 2. Session Start

```json
{
  "clientSessionId": "uuid",
  "taskId": "optional",
  "taskTitle": "encrypted-or-private",
  "mode": "QUICK",
  "timerMode": "COUNTDOWN",
  "plannedSeconds": 1500,
  "skinId": "DAWN",
  "startedAt": "ISO-8601"
}
```

## 3. State Event

```json
{
  "eventId": "uuid",
  "sessionId": "uuid",
  "type": "PAUSED|REST_STARTED|RESUMED|ARRIVING",
  "clientAt": "ISO-8601",
  "focusedSeconds": 600,
  "restSeconds": 0,
  "metadata": {}
}
```

## 4. Completion

```json
{
  "sessionId": "uuid",
  "focusedSeconds": 1480,
  "restSeconds": 300,
  "pauseCount": 1,
  "taskCompleted": true,
  "visitedHarborIds": ["dawn-lighthouse"],
  "completedAt": "ISO-8601"
}
```

## 5. 멱등성

- clientSessionId
- eventId
- logbookEntryId

## 6. Retry

Exponential Backoff, Offline Queue, 사용자 집중 방해 금지.
