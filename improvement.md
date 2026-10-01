# Backend Improvement Backlog

## Critical

- authentication/authorization: Spring Security와 인증 principal이 없고 모든 API가 body/query의 `userId`를 신뢰한다. 외부 배포 전 사용자 식별자를 서버가 결정하고 Actuator 접근 경계를 분리해야 한다.
- 주간 Big3 identity: `(user_id, week_start, origin_inbox_item_id)` unique와 known constraint 409가 없어 동일 source가 같은 주에 여러 item으로 생성될 수 있다.
- sibling roll-up write skew: 서로 다른 마지막 ExecutionUnit을 동시에 완료하면 각 transaction이 상대의 미커밋 상태를 보지 못해 child는 모두 COMPLETED인데 parent Big3Item은 OPEN으로 남을 수 있다. 부모가 dirty하지 않아 `@Version` 충돌도 발생하지 않는다.
- terminal-state escape: COMPLETED unit이나 ABANDONED/EXPIRED parent 아래에 새 PLANNED timebox를 만들 수 있고, 취소된 WORK timebox로 STARTED session을 만들 수 있다. 상태 확인과 동시 claim을 한 경계에서 보장해야 한다.
- business timezone: scheduler는 `Asia/Seoul`인데 선택일·주차·만료 cutoff는 JVM 기본 timezone의 `now()`를 사용한다. UTC 배포 시 KST 월요일 경계가 이전 날짜·주차로 저장될 수 있으므로 business `Clock/ZoneId`를 고정해야 한다.
- schema lifecycle: `DatabaseIndexInitializer`와 `ddl-auto`에 의존한다. Flyway/Liquibase migration, preflight, cleanup, rollback/roll-forward, verification 단계가 필요하다.

## High

- command idempotency: Inbox 저장, Big3 선택, failure check-in 등에 idempotency key가 없어 timeout 재시도와 새 명령을 구분하지 못한다.
- first recovery block: 요청 payload 내부에서만 하나인지 검사한다. 사용자·계획일 전체에 대한 DB 불변식이 필요하다.
- session terminal 경쟁: optimistic lock 예외가 generic 500으로 노출될 수 있다. 멱등 성공/409/retryable 정책을 정해야 한다.
- timebox exclusion conflict: `ex_recovery_timeboxes_user_planned_period`은 DB에서 최초 동시 INSERT를 막지만 `GlobalExceptionHandler`의 known constraint map에는 없다. PostgreSQL exclusion violation을 reason code가 포함된 HTTP 409로 변환하고 controller 계약 테스트를 추가해야 한다.
- expiration restart semantics: 매 실행이 새 `runId`를 사용하는 별도 JobInstance이고, 총 처리 건수는 Tasklet 정상 종료 후에만 Job ExecutionContext에 기록된다. 중간 transaction commit 후 실패한 경우의 진행량 기록, 고정 business cutoff, 동일 JobInstance restart 정책이 필요하다.
- expiration execution ownership: `AtomicBoolean`은 단일 JVM 중복 실행만 막는다. 다중 인스턴스에서는 `SKIP LOCKED`가 row 중복 처리는 줄여도 Job 실행 소유권을 보장하지 않으므로 분산 실행 정책과 미처리 row 감시가 필요하다.
- expiration completeness: `SKIP LOCKED`로 잠긴 eligible row를 건너뛴 결과가 batch size보다 작으면 loop가 종료되어 이번 실행에 과거 OPEN이 남을 수 있다. 잔여 확인과 retry/backoff가 필요하다.
- expiration selector index: 현재 source-defined schema에는 `status/week_start/order by week_start,id`를 지원하는 index가 없다. live schema와 실행계획을 확인하고 partial selector index를 비교해야 한다.
- completeUnit N+1: 누적 timebox 전체를 읽은 뒤 timebox마다 active session을 조회하고 entity별 취소를 수행한다. FK index와 bulk 조회·갱신을 검토한다.
- timebox overlap lock range: pending 구간을 min~max envelope로 합쳐 관련 없는 gap row까지 `FOR UPDATE`한다. 실제 interval별 range query와 실행계획을 비교해야 한다.
- bulk input bounds: `/continue`, `/cancelled`는 `@Valid`와 collection max가 없어 큰 IN 조회·N+1·dirty checking을 한 transaction에 만들 수 있다.
- timebox cancellation race: Timebox에 `@Version`이 없어 사용자 취소와 시스템 취소가 경쟁하면 reason/timestamp가 last-write-wins로 덮일 수 있다.
- abandon aggregate policy: Big3Item만 ABANDONED로 바뀌고 active board entry, future timebox, active session은 남는다. 포기 명령의 원자적 경계를 정해야 한다.
- test isolation: integration test가 같은 PostgreSQL 데이터를 공유한다. class별 cleanup 또는 격리 schema가 필요하다.
- overload protection: 150 flow/s에서 완료 처리량이 130.37 flow/s에 포화되고 p95가 2.73초로 증가했다. admission control, request timeout, connection pool wait 관측이 필요하다.

## Medium

- ExecutionUnit parent lock: 동일 parent hot-key의 lock wait p95/p99와 timeout taxonomy를 측정해야 한다.
- 시간 의존성: entity의 timestamp 생성도 `Clock` 정책에 맞춰 날짜·주차 경계와 재현 가능한 테스트를 유지해야 한다.
- Big3Service 책임: 선택, carryover, 만료 batch가 한 service에 모여 있다. command 단위 transaction service 분리를 검토한다.
- batch chunk: 300,000건에서 67,919 rows/s와 heap +3 MiB를 확인했지만 chunk 100,000의 WAL, I/O, lock 유지 시간은 측정하지 않았다.
- batch OS resource accounting: 현재 대량 하네스는 JVM heap·GC만 측정한다. Linux cgroup v2 환경에서 JPA 기준선과 1k/10k/50k/100k/전체 window를 비교하고, process RSS·PSS, page fault, context switch, `memory.current/stat/events`, `cpu.stat`, `io.stat`, PSI total delta, PostgreSQL 14 WAL·checkpoint delta를 함께 수집해야 한다. PostgreSQL process RSS 단순 합산, Gradle daemon PID, macOS Docker Desktop 수치는 최종 OS 근거로 사용하지 않는다. 현재 Compose의 PostgreSQL 16과 기존 실측 14.21도 같은 실험군으로 섞지 않는다.
- batch end-to-end evidence: 대량 하네스는 service/SQL을 직접 호출하고 Batch 통합 테스트는 service를 mock 처리한다. JobLauncher부터 실제 SQL과 metric까지 통과하는 장애 주입·대량 실행 증거가 필요하다.
- GiST 운영성: exclusion index의 크기, insert amplification, vacuum 영향을 측정해야 한다.
- frontend evidence: Web 핵심 flow와 Home desktop/320×568 Composer, Pause, Reduce Motion, Logbook, Settings sync row, Skin purchase boundary를 Chrome에서 확인했다. DAWN은 5개 정적 keyframe과 Desktop/Mobile 브라우저 캡처로 art-direction 승인 단계에 있으며, flicker 원인이었던 Canvas buffer reset lifecycle은 분리했다. 그러나 30fps 실제 브라우저 녹화, STEP 4 optical flow, Native 실기기 frame time·배터리·발열과 REST loading/error/409 conflict 상태는 아직 같은 수준의 evidence가 필요하다.
- Kubernetes evidence: Dockerfile과 CI/CD artifact는 있지만 Kubernetes manifest와 로컬 클러스터 smoke test가 없다. Deployment/Service/probe/config 주입과 `/actuator/health` 검증 로그가 필요하다.

## 다음 측정

- JVM 내부 병목을 확인하기 위해 core throughput과 expiration 하네스에 JFR을 attach하는 계획을 `perf/results/jfr/README.md`에 정리했다. DB 실행 환경을 복구한 뒤 baseline과 JFR run을 같은 조건으로 비교하고, CPU·allocation/GC·lock·I/O를 k6·Micrometer·PostgreSQL 관측과 교차 검증해야 한다.
- 100 flow/s 30분 soak test의 GC, heap, connection acquisition p95, DB CPU/I/O
- 120~140 flow/s 구간의 saturation curve
- ExecutionUnit 동일 parent/서로 다른 parent 경합 처리량 비교
- Timebox GiST exclusion 적용 전후 insert latency와 index size
- expiration JPA/bulk 및 chunk 1k/10k/50k/100k/전체의 throughput, RSS·PSS, page fault, system CPU, context switch, cgroup PSI, WAL bytes·sync, block I/O, lock duration 비교
- Native FocusScene의 iOS/Android frame time, 배터리·발열, Web Audio fallback과의 사용자 경험 차이 측정

## 완료한 정리

- analytics, friction, retrospective, ops API, frontend, Airflow 제거
- common을 response/error/trace/config/metrics 기술 계층으로 축소
- planning→execution repository 직접 의존을 port로 제거
- core write flow와 대량 상태 전이 실측 완료
