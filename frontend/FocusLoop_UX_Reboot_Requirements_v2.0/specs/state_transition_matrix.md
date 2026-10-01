# State Transition Matrix

| 현재 | 이벤트 | 다음 | 시간 동작 |
| --- | --- | --- | --- |
| READY | START | DEPARTING | Focus Timer 시작 |
| DEPARTING | SKIP/END | ACTIVE | 계속 |
| ACTIVE | PAUSE | HARBOR_SEARCH | 즉시 정지 |
| HARBOR_SEARCH | FOUND/SKIP | RESTING | 정지 |
| HARBOR_SEARCH | CANCEL | ACTIVE | 재개 |
| RESTING | RESUME | RESUMING | Rest 종료 |
| RESUMING | END | ACTIVE | Focus 재개 |
| ACTIVE | TIMER_END | ARRIVING | Focus 종료 |
| ACTIVE | END_EARLY | ARRIVING | Focus 종료 |
| ARRIVING | END | COMPLETED | 기록 준비 |
| COMPLETED | SAVE | READY | Logbook 저장 |
