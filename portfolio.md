<!-- PAGE 1 / 11 -->

# FocusLoop Backend Engineering Portfolio

> 기능을 많이 만든 이야기보다, 데이터가 깨지는 순간과 자원 비용이 이동하는 경로를 끝까지 추적했습니다.

FocusLoop는 실행 전 후보, 계획, 실제 실행 이력을 서로 다른 생명주기로 관리하는 백엔드 프로젝트입니다.

```text
InboxItem → Big3Item → ExecutionUnit → Timebox → RecoverySession
```

이 프로젝트에서 깊게 다룬 문제는 두 가지입니다.

1. 대량 상태 전이에서 대상 수와 JVM 메모리 사용량의 관계를 어떻게 끊을 것인가?
2. 두 transaction이 모두 정상적인 조회 결과를 읽더라도 최종 데이터의 불변식을 어떻게 지킬 것인가?

### 기술 환경

- Java, Spring Boot, Spring Batch, Spring Data JPA
- PostgreSQL, CTE, partial unique index, GiST exclusion constraint
- Micrometer, Gradle integration test, PostgreSQL 동시성 재현 테스트

문서는 `문제 → 의문 → 분석 → 의사결정 → 결과 → 다음 문제` 순서로 구성했습니다. 실측한 결과와 아직 측정하지 않은 계획도 구분했습니다.

---

<!-- PAGE 2 / 11 -->

# Case 1 — 대량 상태 전이와 Spring Batch

## Goal — 대상이 늘어나도 자원 비용의 상한을 유지한다

초기 만료 작업은 과거 `OPEN` 데이터를 JPA entity로 모두 조회한 뒤 상태를 변경했습니다.

```java
List<Big3Item> items = repository.findAllByStatusAndWeekStartBefore(
        OPEN,
        currentWeekStart
);

for (Big3Item item : items) {
    item.expire(now);
}
```

대상이 늘면 persistence context와 dirty checking snapshot도 함께 증가합니다. 한 번 실패하면 다음 실행 대상이 누적되고, 작업이 무거워질수록 다시 실패하기 쉬운 구조였습니다.

제가 세운 목표는 다음과 같습니다.

1. 대상 row 수와 JVM 객체 수의 비례 관계를 끊는다.
2. 한 transaction이 처리하는 변경량에 상한을 둔다.
3. 반복 작업을 실행 상태가 남는 Spring Batch Job으로 만든다.
4. 부분 commit과 재실행의 의미를 명확히 한다.

```text
Scheduler → Job → Step → Tasklet
          → TransactionTemplate
          → PostgreSQL bounded set-based UPDATE
```

---

<!-- PAGE 3 / 11 -->

## 문제 1 — 왜 동일한 상태 변경이 JVM 메모리 문제가 되었을까?

### 분석

문제는 memory leak이 아니라 한 실행에서 동시에 유지하는 객체 수였습니다.

```text
대상 row 증가
  → entity와 dirty checking snapshot 증가
  → persistence context의 peak heap 증가
  → flush 대상과 allocation pressure 증가
  → GC 또는 OOM 가능성 증가
```

모든 대상은 동일하게 `OPEN → EXPIRED`로 전이됩니다. DB가 집합 연산으로 끝낼 수 있는 일을 Java 객체 순회로 바꾸고 있었습니다. 따라서 GC 옵션보다 먼저 entity materialization 자체를 제거했습니다.

### 의사결정

```sql
WITH targets AS (
    SELECT id
    FROM big3_items
    WHERE status = :openStatus
      AND week_start < :currentWeekStart
    ORDER BY week_start, id
    LIMIT :batchSize
    FOR UPDATE SKIP LOCKED
)
UPDATE big3_items item
SET status = :expiredStatus,
    expired_at = :now,
    updated_at = :now,
    version = version + 1
FROM targets
WHERE item.id = targets.id
  AND item.status = :openStatus;
```

JPA를 우회해도 상태 전이 규칙이 유지되도록 timestamp와 version 증가, UPDATE 시점의 `OPEN` 조건을 SQL에 명시했습니다.

### 결과와 다음 질문

변경 전 JPA 방식과 첫 set-based update를 같은 512 MiB heap 제한에서 측정한 기록이 있습니다.

| 경로 | 대상 | 처리 시간 | peak heap | GC |
| --- | ---: | ---: | ---: | ---: |
| JPA entity + dirty checking | 100,000건 | 9,647 ms | 386.84 MiB·증가 331.22 MiB | 32회·223 ms |
| 단일 set-based update | 10,000,000건 | 193,223 ms | 약 82.27 MiB·증가 약 6 MiB | 0회 |

처리 대상이 달라 시간 개선율은 계산하지 않았습니다. 대신 **대상이 100배로 늘었는데도 peak heap이 낮아지고 추가 GC가 사라졌다는 점**을 JVM 메모리 병목 제거의 근거로 삼았습니다. 이후 단일 대량 transaction의 부담을 줄이기 위해 현재 bounded 방식으로 발전시켰습니다.

> JVM 객체를 제거한 뒤 전체 대상을 한 transaction에서 변경해도 안전할까?

---

<!-- PAGE 4 / 11 -->

## 문제 2 — 메모리 문제를 DB transaction 문제로 옮기고 끝난 것은 아닐까?

전체 대상을 한 SQL과 transaction에서 변경하면 비용이 DB에 집중됩니다.

| 큰 transaction의 위험 | 원인 |
| --- | --- |
| row lock 유지 | 전체 변경이 끝날 때까지 lock을 보유한다. |
| WAL burst | 변경 기록이 짧은 구간에 집중된다. |
| rollback 비용 | 마지막 실패가 전체 rollback으로 이어진다. |
| foreground 영향 | 같은 table을 쓰는 API와 lock·I/O가 경합한다. |

반대로 window가 너무 작으면 commit과 WAL sync 횟수가 늘어납니다. 가장 큰 transaction이 아니라 실패와 자원 비용을 예측할 수 있는 범위가 필요했습니다.

### 의사결정

```text
최대 100,000건 선택
  → SKIP LOCKED
  → set-based UPDATE
  → COMMIT
  → 다음 window 반복
```

집합 연산은 유지하면서 `TransactionTemplate`로 window마다 독립 commit했습니다.

### 결과와 판단 경계

- PostgreSQL 14.21, JVM max heap 512 MiB
- 300,000건 / 4,417 ms / 67,919 rows/s
- `EXPIRED` 300,000건 / 남은 과거 `OPEN` 0건
- peak heap +3.00 MiB / GC 0회·0 ms

이는 10ms 간격 heap sampling을 사용한 단일 로컬 실행이며 `Big3Service → native SQL` 하네스 결과입니다. 100,000건도 최적값이 아니라 현재 실험 설정입니다.

> SQL과 transaction 경계는 만들었다. 이제 실행의 성공·실패와 처리량을 어디에 남길 것인가?

---

<!-- PAGE 5 / 11 -->

## 문제 3 — SQL 집합 연산인데 왜 Spring Batch가 필요했을까?

Spring Batch가 처리 성능을 높인 것은 아닙니다. SQL과 transaction 경계가 메모리·처리 특성을 바꿨고, Batch는 작업을 식별하고 실패를 드러내는 실행 틀을 제공했습니다.

| 계층 | 책임 |
| --- | --- |
| Job·Step | 실행 identity와 상태 |
| Tasklet | DB 집합 연산 호출 |
| TransactionTemplate | DB transaction window 상한 |
| PostgreSQL | 대상 선택과 상태 전이 |
| Micrometer | 성공·실패·시간·처리 건수 관측 |

row별 변환이 없어 Reader·Processor·Writer 대신 Tasklet을 선택했습니다. Step transaction 전체에 모든 변경이 묶이지 않도록 service transaction을 suspend하고 window별 transaction을 열었습니다.

```text
window 1 COMMIT
window 2 COMMIT
window 3 ROLLBACK
Step FAILED
```

다음 실행은 Batch checkpoint에서 세 번째 window부터 이어가지 않습니다. 새로운 JobInstance가 SQL의 `status = OPEN` 조건으로 남은 row를 다시 처리하므로 현재 방식은 **checkpoint restart가 아니라 멱등 재실행**입니다.

### 증명한 것과 남은 측정

- 검증: Job·Step·Tasklet wiring, ExecutionContext, 실패 전파, metric, 동일 JVM 중복 실행 skip
- 미증명: Batch 전체 경로의 67,919 rows/s, 다중 인스턴스 단일 실행, 100,000건 window의 최적성
- 후속 OS 실험: JPA/bulk와 1k·10k·50k·100k·전체 window의 RSS·PSS, page fault, context switch, cgroup PSI, WAL·fsync, block I/O 비교

---

<!-- PAGE 6 / 11 -->

# Case 2 — 잠글 행이 없는 최초 동시 INSERT

## Goal — 조회 결과가 아니라 최종 데이터의 불변식을 지킨다

Planning 데이터에는 모양이 다른 규칙이 존재합니다.

| 규칙 | 데이터 관계 |
| --- | --- |
| 활성 slot/item은 하나여야 한다. | current-state equality |
| 같은 사용자의 계획 시간은 겹치면 안 된다. | range overlap |
| 한 작업의 ExecutionUnit은 최대 5개다. | aggregate count |

초기 구현은 저장 전에 데이터를 조회하고 애플리케이션에서 검증했습니다. 단일 요청에서는 올바르게 동작하지만 두 transaction이 동시에 `없음`을 읽으면 모두 INSERT를 진행할 수 있습니다.

제가 세운 기준은 다음과 같습니다.

```text
현재 상태 equality   → partial unique index
시간 범위 overlap    → GiST exclusion constraint
aggregate 최대 개수  → parent row lock protocol
```

모든 문제에 같은 lock을 추가하지 않고, 보호하려는 데이터 관계와 항상 존재하는 직렬화 지점이 무엇인지부터 확인했습니다.

---

<!-- PAGE 7 / 11 -->

## 문제 1 — `SELECT FOR UPDATE`를 썼는데 왜 최초 INSERT는 막지 못했을까?

기존 겹침 row에는 `PESSIMISTIC_WRITE`를 적용했습니다. row가 있으면 두 번째 transaction은 기다렸지만, 첫 일정 두 개가 동시에 들어오면 잠글 tuple이 없습니다.

```text
초기 상태: PLANNED Timebox 0건

Transaction A                       Transaction B
-------------                       -------------
10:00~11:00 요청                    10:30~11:30 요청
overlap 조회 → 0건                  overlap 조회 → 0건
잠근 tuple 없음                     잠근 tuple 없음
검증 통과                           검증 통과
INSERT                              INSERT
```

PostgreSQL `READ COMMITTED`에서는 상대 transaction의 미커밋 INSERT를 일반 조회로 볼 수 없습니다. 이는 같은 row를 덮어쓰는 lost update가 아니라, 두 predicate 검증이 동시에 참이 되는 check-then-act 경쟁입니다.

### 결정적 재현

```text
Transaction A: existing=[]·validator 통과 ┐
                                           ├─ barrier
Transaction B: existing=[]·validator 통과 ┘

두 요청을 INSERT로 동시에 진행
```

| 조건 | 성공 | 실패 | 최종 겹치는 row |
| --- | ---: | ---: | ---: |
| exclusion constraint 없음 | 2 | 0 | 2 |
| exclusion constraint 있음 | 1 | 1 | 1 |

> 잠글 row가 없다면 시간 범위의 충돌 자체를 DB가 판정하도록 만들 수 있을까?

---

<!-- PAGE 8 / 11 -->

## 문제 2 — 시간 관계를 schema 불변식으로 선언한다

### 대안 비교

| 대안 | 판단 |
| --- | --- |
| 애플리케이션 overlap 검사 | 빠른 오류에는 필요하지만 미커밋 INSERT를 보지 못한다. |
| 사용자 guard row lock | 최초 INSERT를 막지만 비충돌 일정까지 직렬화한다. |
| `SERIALIZABLE` + retry | transaction 전체의 retry·backoff 정책이 필요하다. |
| GiST exclusion constraint | 실제 시간 범위 관계를 모든 write path에 적용한다. |

### 의사결정

```sql
ALTER TABLE recovery_timeboxes
ADD CONSTRAINT ex_recovery_timeboxes_user_planned_period
EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (timebox_status = 'PLANNED');
```

- 같은 사용자끼리 비교한다.
- `[start, end)`로 종료와 다음 시작이 맞닿은 구간을 허용하도록 설계한다.
- `PLANNED` 상태만 겹침 금지 범위에 포함해 취소 이력을 보존한다.

### 결과와 한계

constraint 적용 환경에서 두 요청이 모두 선행 검증을 통과한 뒤에도 성공 1건, `DataIntegrityViolationException` 1건, 최종 row 1건으로 수렴했습니다.

다만 현재 테스트는 constraint가 없을 때도 취약점 재현 분기로 통과하므로 제약 존재를 강제하는 회귀 테스트는 아닙니다. 또한 exclusion constraint가 전역 예외 처리의 known 목록에 없어 동시 충돌이 HTTP 409가 아닌 500으로 노출될 수 있습니다.

---

<!-- PAGE 9 / 11 -->

## 문제 3 — 불변식의 모양에 따라 직렬화 지점을 바꾼다

### 현재 상태 유일성

일반 unique는 제거된 과거 row까지 제한하고 hard delete는 이력을 없앱니다. 현재 row만 predicate에 포함하는 partial unique index를 적용했습니다.

```sql
CREATE UNIQUE INDEX uq_daily_big3_entry_order
ON daily_big3_entries (daily_big3_board_id, slot_order)
WHERE removed_at IS NULL;
```

동시 활성 slot 생성은 성공 1건, 충돌 1건, 최종 활성 row 1건으로 수렴했습니다.

### Aggregate 최대 개수

ExecutionUnit이 4개인 parent에 두 요청이 동시에 추가되면 둘 다 count 4를 읽을 수 있습니다. 항상 존재하는 parent를 먼저 잠근 뒤 count와 INSERT를 처리했습니다.

```text
parent PESSIMISTIC_WRITE → child count → 최대 5개 검증 → INSERT
```

동시 생성 결과는 성공 1건, 충돌 1건, 최종 5개였습니다. 이 보장은 schema가 아니라 모든 생성 경로가 따라야 하는 lock protocol입니다.

### 아직 남은 Critical

서로 다른 마지막 sibling을 동시에 완료하면 두 transaction 모두 상대의 미커밋 완료를 보지 못해 parent를 변경하지 않을 수 있습니다.

```text
child A/B = COMPLETED
parent    = OPEN
```

parent가 dirty하지 않아 `@Version` UPDATE도 발생하지 않습니다. 같은 parent 아래의 child 완료와 roll-up을 하나의 직렬화 구간으로 묶는 작업이 다음 우선순위입니다.

---

<!-- PAGE 10 / 11 -->

# 두 사례를 통해 증명하려는 것

## 1. 자원 비용은 제거되는 것이 아니라 위치가 바뀐다

entity materialization을 제거해 JVM heap 증가를 제한했습니다. 동시에 비용이 DB transaction, WAL과 OS I/O로 이동할 수 있음을 인정하고 후속 측정 계층을 설계했습니다.

## 2. 동시성 제어는 lock 사용 여부보다 직렬화 지점이 중요하다

빈 조회 결과에는 잠글 tuple이 없습니다. Equality, range, aggregate처럼 데이터 관계가 다르면 최종 방어선도 달라져야 합니다.

## 3. 성공한 수치보다 주장 가능한 범위를 먼저 고정한다

- 서비스/SQL 하네스 결과를 Spring Batch 전체 성능으로 확대하지 않습니다.
- heap 결과를 RSS·WAL·I/O 개선으로 확대하지 않습니다.
- DB constraint 성공을 HTTP 계약과 migration 완료로 확대하지 않습니다.
- 해결되지 않은 sibling write skew를 완료된 성과처럼 숨기지 않습니다.

### 핵심 결과

| 사례 | 검증 결과 |
| --- | --- |
| 대량 상태 전이 | JPA 100,000건 peak heap +331.22 MiB·GC 32회 → bulk 10,000,000건 +6 MiB·GC 0회, 현재 bounded 300,000건 4,417 ms |
| 최초 겹침 INSERT | constraint 적용 시 성공 1건, 충돌 1건, 최종 row 1건 |
| 최대 ExecutionUnit | 4개 상태의 동시 생성에서 성공 1건, 충돌 1건, 최종 5개 |

> 저는 프레임워크 기능을 적용하는 데서 멈추지 않고, 그 기능이 실제로 보호하는 자원과 데이터 범위를 확인합니다. 문제를 재현하고 대안을 비교한 뒤, 측정값이 말할 수 있는 범위와 다음 실패 조건까지 함께 기록합니다.

### 근거

- [Case 1 상세 문서](docs/case-studies/01_BULK_STATE_TRANSITION.md)
- [Case 2 상세 문서](docs/case-studies/02_PLANNING_CONCURRENCY_INVARIANTS.md)
- [현재 미해결 Critical 감사](docs/study/USER_ACTION_SCENARIOS_AND_UNRESOLVED_RISKS.md)
- [대량 처리 실측 결과](perf/results/core-throughput/README.md)

---

<!-- PAGE 11 / 11 -->

# 부록 — REST write flow의 처리량과 포화 구간

두 핵심 사례가 데이터 정합성과 대량 처리 자원 경계를 다룬다면, 이 부록은 실제 업무 flow가 부하를 받을 때 어디서 포화되는지 확인한 보조 증거입니다. 별도의 기능 사례를 추가하기보다, 앞선 설계가 연결된 command flow에서도 데이터 비율과 처리량을 어떻게 유지하는지 검증했습니다.

## 측정 대상

한 flow는 다음 5개의 REST write 요청과 13개의 도메인 row 생성을 포함합니다.

```text
InboxItem 3건 저장
  → DailyBig3Board 1건 + Big3Item 3건 + DailyBig3Entry 3건 선택
  → ExecutionUnit 6건 생성
```

단일 endpoint의 평균 응답 시간만 측정하지 않고, `constant-arrival-rate`로 flow 유입량을 고정했습니다. 완료 처리량, dropped iteration, flow p95·p99를 함께 보고 테스트 종료 후 DB row 비율도 확인했습니다.

## 결과

| 유입 부하 | 완료 flow | 완료 처리량 | dropped | flow p95 | flow p99 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 40 flow/s | 1,201 | 40.01/s | 0 | 68 ms | 375 ms |
| 100 flow/s | 3,001 | 99.89/s | 0 | 535 ms | 765 ms |
| 150 flow/s | 4,118 | 130.37/s | 384 | 2.73 s | 3.23 s |

100 flow/s까지는 30초 동안 유입된 flow를 모두 완료했고, p95는 535ms였습니다. 150 flow/s에서는 HTTP 오류보다 먼저 VU 상한과 queueing이 나타나 완료 처리량이 약 130 flow/s에서 멈추고 384 iteration이 drop됐습니다. 따라서 성공 응답률만으로 처리 용량을 판단하지 않고, 유입량과 실제 완료량의 차이 및 tail latency를 함께 봐야 한다는 결론을 얻었습니다.

완료된 flow의 최종 데이터는 다음 비율을 유지했습니다.

```text
1 board : 3 inbox : 3 Big3Item : 6 ExecutionUnit
```

이는 부하가 증가해도 한 업무 flow 내부의 부분 생성이나 row 누락이 관찰되지 않았다는 의미입니다. 다만 dropped iteration은 애초에 완료되지 않은 작업이므로, 이를 성공 처리된 flow의 정합성 증거와 혼동하지 않았습니다.

## 판단 범위와 다음 측정

- 100 flow/s는 운영 SLA가 아니라 로컬 단일 인스턴스에서 재현된 안정 구간입니다.
- 부하 발생기와 API·DB가 같은 머신에 있어 실제 네트워크 지연과 multi-instance 경합은 포함하지 않습니다.
- 30초 측정이므로 장기 GC, vacuum, connection churn은 증명하지 않습니다.
- 다음에는 100 flow/s 장기 soak test, 120~140 flow/s 포화 곡선, connection acquisition p95, DB CPU·I/O, admission control과 request timeout 정책을 확인해야 합니다.

### 근거

- [처리량 실험 상세 결과](perf/results/core-throughput/README.md)
- [부하 측정 설계와 해석](job-fit.md#3-rest-쓰기-흐름의-안정-처리량과-포화-지점-측정)
