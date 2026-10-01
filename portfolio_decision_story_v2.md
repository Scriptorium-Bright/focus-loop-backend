# FocusLoop Backend Engineering Portfolio — Decision Story v2

> 초안: 기존 `portfolio.md`를 수정하지 않고, 문제 해결 결과보다 의사결정의 흐름을 앞에 둔 별도 버전입니다.

FocusLoop는 작업 후보를 수집하고, 실행 계획을 만들고, 실제 실행과 실패·재시작 이력을 보존하는 백엔드 프로젝트입니다.

이 문서에서 설명할 사례는 두 가지입니다.

1. 대상 row가 늘어날 때 JVM 메모리와 DB transaction 비용이 함께 커지는 대량 상태 전이
2. 두 transaction이 모두 “없음”을 읽어도 최종 데이터의 불변식을 지켜야 하는 동시 INSERT

두 사례 모두 최종 기술 이름보다 다음 과정을 보여주는 데 초점을 둡니다.

```text
초기 구현
→ 초기 선택이 단일 요청에서는 왜 합리적이었는가
→ 어떤 실험이나 경쟁 조건에서 한계가 드러났는가
→ 어떤 대안을 비교했는가
→ 무엇을 선택했고 무엇을 포기했는가
→ 결과와 남은 위험은 무엇인가
```

측정한 결과와 아직 계획 단계인 내용은 구분합니다. 로컬 실험 결과를 운영 SLA로 확대하지 않습니다.

---

# Case 1 — JVM 메모리 병목을 DB 집합 연산으로 옮긴 뒤, transaction 경계를 다시 설계한 과정

## 1. 출발점: 도메인 메서드로 상태를 바꾸는 것은 자연스러웠다

초기 만료 작업은 과거 주차의 `OPEN` 작업을 JPA entity로 조회한 뒤 도메인 메서드를 호출했습니다.

```java
List<Big3Item> items = repository.findAllByStatusAndWeekStartBefore(
        OPEN,
        currentWeekStart
);

for (Big3Item item : items) {
    item.expire(now);
}
```

이 방식은 개별 entity의 상태 규칙을 코드로 표현하기 쉽고, 작은 데이터에서는 구현 비용도 낮습니다. 문제는 전역 sweep에서 모든 대상 entity를 한 번에 JVM으로 가져온다는 점이었습니다.

```text
대상 row 증가
→ entity 생성
→ persistence context와 dirty-checking snapshot 증가
→ peak heap과 allocation pressure 증가
→ GC 또는 OOM 가능성 증가
→ 실패하면 다음 실행 대상까지 누적
```

따라서 처음부터 “쿼리를 빠르게 만들자”가 아니라 다음 목표를 세웠습니다.

- 대상 row 수와 JVM 객체 수의 비례 관계를 끊는다.
- 한 transaction이 처리할 변경량에 상한을 둔다.
- 실패한 실행을 관찰하고 재실행할 수 있게 한다.
- entity를 우회하더라도 기존 상태 전이 의미를 잃지 않는다.

## 2. 첫 번째 시행착오: 기존 OOM 테스트도 신뢰할 수 없었다

초기 OOM 테스트는 메모리 문제를 검증하는 방식 자체가 불안정했습니다.

- OOM이 발생하면 다시 예외를 던져 실패했다.
- OOM이 발생하지 않아도 `fail()`로 실패했다.
- fixture를 Java `ArrayList`와 UUID 객체로 만들며 측정 전에 heap을 사용했다.
- 전체 repository를 `deleteAll()`해 테스트 소유 범위를 넘어설 수 있었다.
- 처리 시간, peak heap, GC, 최종 row 상태를 기록하지 않았다.
- OOM 이후 같은 test worker를 계속 사용하면 후속 테스트도 신뢰하기 어렵다.

이 상태에서는 “OOM을 재현했다”는 말도, “OOM이 사라졌다”는 말도 방어하기 어려웠습니다. 그래서 별도 JVM·전용 DB·대량 SQL fixture를 사용하는 opt-in memory pressure harness로 교체했습니다.

## 3. 기준선: 문제를 숫자로 고정했다

통제 하네스에서 JPA entity loading과 dirty checking 경로를 측정했습니다.

| 항목 | 기준선 |
| --- | ---: |
| 대상 | 과거 `OPEN` 100,000건 |
| JVM 최대 heap | 512 MiB |
| 처리 시간 | 9,647 ms |
| peak heap | 386.84 MiB |
| 실행 전 대비 peak 증가 | 331.22 MiB |
| GC | 32회 / 223 ms |
| 최종 상태 | `EXPIRED` 100,000건 / 과거 `OPEN` 0건 |

이 측정으로 문제를 memory leak이 아니라 “한 실행에서 동시에 유지하는 entity 수”의 문제로 정의했습니다.

## 4. 첫 번째 결정: 동일 상태 전이는 entity가 아니라 DB 집합 연산으로 처리한다

모든 대상 row가 같은 `OPEN → EXPIRED` 전이를 수행하고, row마다 외부 I/O나 서로 다른 계산이 필요하지 않았습니다. 따라서 Java가 row를 순회하는 대신 PostgreSQL이 대상 선택과 상태 전이를 한 번에 수행하도록 내렸습니다.

비교한 방향은 다음과 같습니다.

| 대안 | 판단 |
| --- | --- |
| JPA 전체 조회 | 기존 상태 규칙은 유지하지만 entity와 dirty checking 비용이 대상 수에 비례한다. |
| JPA paging/chunk | 전체 적재는 피하지만 Java row 순회와 entity materialization을 유지한다. |
| JDBC cursor + writer | row별 변환이 필요할 때 유효하지만 현재 작업에는 불필요하다. |
| 단일 set-based update | 동일 상태 전이에 가장 직접적이지만 transaction 폭이 무제한이다. |

선택한 SQL은 다음과 같습니다.

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

JPA를 우회하면서 잃을 수 있는 계약을 SQL에 명시적으로 다시 넣었습니다.

- `OPEN`인 row만 전이한다.
- 현재 주차보다 이전인 row만 선택한다.
- `expired_at`, `updated_at`을 기록한다.
- `@Version`과 일관되도록 version을 증가시킨다.
- UPDATE 시점에도 `OPEN` 조건을 확인해 이미 전이된 row를 다시 바꾸지 않는다.

## 5. 첫 번째 결과가 다시 문제를 만들었다

첫 bulk update는 같은 512 MiB heap 제한에서 과거 `OPEN` 10,000,000건을 OOM 없이 처리했습니다.

| 항목 | 첫 bulk update |
| --- | ---: |
| 대상 | 10,000,000건 |
| 처리 시간 | 193,223 ms |
| peak heap | 약 82.27 MiB |
| 실행 전 대비 peak 증가 | 약 6 MiB |
| 추가 GC | 0회 |
| 최종 상태 | `EXPIRED` 10,000,000건 / 과거 `OPEN` 0건 |

이 결과로 JVM entity·dirty-checking 메모리 비용은 제거했다고 판단했습니다. 다만 기준선은 100,000건, bulk는 10,000,000건이므로 처리 시간 개선율은 계산하지 않았습니다.

그리고 새로운 문제가 드러났습니다.

```text
JVM heap 문제 감소
→ 1,000만 건 단일 transaction
→ 긴 row lock 유지
→ WAL burst
→ 실패 시 전체 rollback
→ dead tuple·VACUUM·foreground API 경합 가능성
```

즉, 문제를 해결한 것이 아니라 비용의 위치를 JVM에서 DB transaction으로 옮긴 상태였습니다.

## 6. 두 번째 결정: 가장 빠른 단일 transaction이 아니라 bounded transaction을 선택한다

전체 대상을 한 transaction에서 바꾸는 방식과 너무 작은 window를 모두 경계했습니다.

| 방향 | 새로 생기는 비용 |
| --- | --- |
| 전체 단일 transaction | lock 유지 시간, WAL burst, rollback 범위, connection 점유가 커진다. |
| 지나치게 작은 window | commit·WAL sync 횟수와 transaction 관리 비용이 늘어난다. |

그래서 set-based update는 유지하되, transaction이 처리할 row 수를 제한했습니다.

```text
최대 100,000건 선택
→ SKIP LOCKED
→ set-based UPDATE
→ COMMIT
→ 다음 window 반복
```

100,000건은 최적값으로 증명된 숫자가 아닙니다. 현재 실험 설정입니다. 운영값으로 확정하려면 1k·10k·50k·100k·전체 window를 비교하고, rows/s 하나가 아니라 다음 항목을 함께 봐야 합니다.

- WAL bytes와 sync 시간
- row lock 유지 시간
- foreground API p95/p99
- rollback 범위
- process RSS와 cgroup memory pressure
- block I/O와 replication 영향

현재 bounded service/SQL 경로의 측정 결과는 300,000건, 4,417ms, 67,919 rows/s, peak heap 증가 3.00 MiB, GC 0회입니다. 이 결과는 Spring Batch 전체 benchmark가 아니라 `Big3Service → native SQL` 하네스 결과입니다.

## 7. 세 번째 결정: Spring Batch는 성능 엔진이 아니라 실행 lifecycle로 사용한다

SQL과 transaction 경계를 정한 뒤에도 실행에 관한 질문이 남았습니다.

- 어떤 실행이 언제 시작됐는가?
- 성공했는가, 실패했는가?
- 몇 건을 처리했는가?
- 중복 실행은 어떻게 관찰하는가?
- 부분 commit 후 다음 실행은 무엇을 의미하는가?

단순히 `@Scheduled`가 service를 직접 호출하면 이 정보가 scheduler와 로그에 흩어집니다. 그래서 다음 역할을 분리했습니다.

| 계층 | 책임 |
| --- | --- |
| Spring Batch Job/Step | 실행 identity와 상태 |
| Tasklet | DB 집합 연산 호출 |
| TransactionTemplate | DB transaction window 상한 |
| PostgreSQL | 대상 선택과 상태 전이 |
| Micrometer | 성공·실패·시간·처리 건수 관측 |

row별 변환이 없으므로 `ItemReader → ItemProcessor → ItemWriter` 대신 Tasklet을 선택했습니다. 여기서 100,000건 단위는 Spring Batch chunk interval이 아니라 Tasklet 내부에서 여는 DB transaction window입니다.

또한 Step transaction과 DB window transaction을 분리했습니다.

```text
Step transaction
  ↓ suspend
window 1 COMMIT
window 2 COMMIT
window 3 ROLLBACK
  ↓ resume
Step FAILED
```

세 번째 window에서 실패해도 앞선 두 window의 commit은 되돌아가지 않습니다. 다음 실행은 Batch checkpoint에서 세 번째 window를 재개하는 것이 아니라, `status = OPEN`인 row만 다시 선택하는 멱등 재실행입니다.

이 구분을 숨기지 않은 이유는 “Spring Batch가 실패 지점부터 재시작한다”라고 말하면 현재 구현과 다른 주장이 되기 때문입니다.

## 8. 물리 최적화도 먼저 실험하고 적용 여부를 결정했다

`fillfactor=80`으로 HOT update를 유도할 수 있는지 별도 200,000건 실험을 수행했습니다.

| 조건 | HOT update | HOT ratio |
| --- | ---: | ---: |
| `fillfactor=100`, PK만 | 0 | 0.00% |
| `fillfactor=80`, PK만 | 51,855 | 25.93% |
| `fillfactor=80`, 상태 컬럼 포함 index 가정 | 0 | 0.00% |

상태 컬럼이 index에 포함되면 `status` 변경 때문에 index entry도 바뀌어 HOT 조건을 만족하지 못합니다. 또한 이 실험의 상태 컬럼 index 조건은 2026-07-17 현재 source-defined schema와 동일하지 않습니다.

따라서 `fillfactor=80`을 적용하지 않았습니다. 성능 최적화라는 이름만 보고 설정을 추가하지 않고, 실제 schema 조건과 WAL·공간 비용을 다시 확인해야 한다는 결론을 남겼습니다.

## 9. Case 1의 최종 판단

```text
JPA 전체 entity 조회
→ heap·GC 병목을 통제 하네스로 재현
→ set-based update로 JVM 객체 비용 제거
→ 단일 bulk transaction의 DB 비용 발견
→ bounded window로 lock·rollback 범위 제한
→ Batch를 lifecycle·실패 관측 계층으로 분리
→ HOT/fillfactor 실험 후 효과가 불확실한 설정은 미채택
```

현재 주장할 수 있는 범위:

- JPA entity 순회에서 대상 수에 따라 heap과 GC가 커지는 현상을 측정했다.
- 첫 bulk update에서 대상 규모가 100배가 되어도 peak heap 증가 약 6 MiB, GC 0회를 관찰했다.
- bounded service/SQL 경로에서 300,000건을 최종 상태까지 전이했다.
- Batch wiring, 실패 전파, metric, 동일 JVM 중복 실행 skip을 별도로 검증했다.

아직 주장하지 않는 범위:

- 100,000건이 운영 최적 window라는 결론
- Spring Batch 전체 경로의 67,919 rows/s
- process RSS·PSS, WAL·fsync, block I/O까지 개선됐다는 결론
- 다중 인스턴스에서 Job 하나만 실행된다는 보장
- 실패한 동일 JobInstance의 checkpoint restart

상세 근거: [Case 1 상세 문서](docs/case-studies/01_BULK_STATE_TRANSITION.md), [OOM 테스트 기록](docs/archive/legacy/_merged_2026-06-22/study/BIG3_EXPIRATION_OOM_TEST_GUIDE.md), [HOT 실험](perf/results/big3-hot-update/README.md)

---

# Case 2 — “잠글 row가 없다”는 실패에서 출발해 불변식의 모양별 방어선을 선택한 과정

## 1. 먼저 보호할 불변식의 모양을 분리했다

Planning에는 같은 종류가 아닌 세 가지 규칙이 있었습니다.

| 규칙 | 관계의 모양 | 선택 후보 |
| --- | --- | --- |
| 활성 slot/item은 하나 | current-state equality | partial unique index |
| 같은 사용자의 계획 시간은 겹치지 않음 | range overlap | GiST exclusion constraint |
| 하나의 parent 아래 child는 최대 5개 | aggregate count | parent row lock protocol |

처음부터 모든 문제에 같은 lock을 추가하지 않았습니다. 먼저 “무엇을 동일하다고 볼 것인가”, “무엇을 겹침으로 볼 것인가”, “항상 존재하는 직렬화 지점이 있는가”를 구분했습니다.

## 2. 최초 구현: 애플리케이션 overlap 검증은 단일 요청에서는 동작했다

Timebox 생성은 다음 흐름이었습니다.

```text
요청 검증
→ 소유권 확인
→ 기존 겹침 Timebox 조회
→ 애플리케이션 overlap 검증
→ saveAll
```

기존 겹침 row에는 `PESSIMISTIC_WRITE`를 적용했습니다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
List<Timebox> findOverlappingForUpdate(...);
```

기존 row가 있으면 이 방식은 유효합니다. 먼저 조회한 transaction이 tuple lock을 얻고, 다음 transaction은 기다립니다.

## 3. 실패 지점: 최초 INSERT에는 잠글 tuple이 없었다

사용자에게 `PLANNED` Timebox가 하나도 없는 상태에서 두 요청이 동시에 들어오면 상황이 달라집니다.

```text
Transaction A                       Transaction B
-------------                       -------------
overlap 조회 → 0건                  overlap 조회 → 0건
잠글 tuple 없음                     잠글 tuple 없음
검증 통과                           검증 통과
INSERT                              INSERT
COMMIT                              COMMIT
```

PostgreSQL `READ COMMITTED`에서는 상대 transaction의 미커밋 INSERT를 일반 조회로 볼 수 없습니다. 따라서 빈 조회 결과는 미래의 INSERT를 막는 lock이 아닙니다.

이 문제는 기존 row를 덮어쓰는 lost update가 아니라, 두 predicate 검증이 동시에 참이 되는 check-then-act 경쟁입니다.

## 4. 우연한 race를 결정적인 재현으로 바꿨다

단순히 두 thread를 동시에 시작하는 테스트는 실행 순서에 따라 race가 사라질 수 있습니다. 그래서 validator가 두 요청 모두 빈 결과를 본 직후 멈추도록 barrier를 넣었습니다.

```text
Transaction A: existing=[] · validator 통과 ┐
                                             ├─ barrier
Transaction B: existing=[] · validator 통과 ┘

두 요청을 동시에 INSERT
```

결과는 다음과 같습니다.

| 조건 | 성공 | 실패 | 최종 row |
| --- | ---: | ---: | ---: |
| exclusion constraint 없음 | 2 | 0 | 겹치는 row 2건 |
| exclusion constraint 있음 | 1 | 1 | row 1건 |

이 결과로 “애플리케이션 검증이 부족하다”가 아니라 “최종 불변식을 DB가 판정해야 한다”고 문제를 다시 정의했습니다.

단, 현재 테스트는 constraint가 없는 재현 분기도 통과 조건으로 인정합니다. 따라서 exclusion constraint 존재 자체를 강제하는 회귀 테스트는 별도로 보강해야 합니다.

## 5. 대안을 비교하고 GiST를 선택했다

| 대안 | 장점 | 이 문제에서의 한계 |
| --- | --- | --- |
| 애플리케이션 overlap 검사 | 빠른 실패와 친절한 오류 | 미커밋 INSERT를 볼 수 없어 최종 보장이 아니다. |
| 기존 row `SELECT FOR UPDATE` | 충돌 row가 있으면 정확히 대기 | 최초 INSERT에는 잠글 tuple이 없다. |
| 사용자 guard row lock | 항상 존재하는 사용자 row를 잠글 수 있다. | 비충돌 일정까지 사용자 단위로 직렬화한다. |
| `SERIALIZABLE + retry` | predicate 경쟁을 transaction abort로 감지 | 전체 transaction의 retry·backoff 정책이 필요하다. |
| GiST exclusion constraint | 시간 범위 관계를 schema에 직접 선언하고 모든 DB write path를 보호 | PostgreSQL/GiST 의존성과 index write 비용, 충돌 예외 변환이 필요하다. |

사용자 guard row는 확실한 직렬화 지점이지만 같은 사용자의 비충돌 일정까지 기다리게 합니다. 현재 불변식은 “사용자당 하나”가 아니라 “겹치는 시간 범위 금지”이므로, 실제 관계를 schema에 표현하는 exclusion constraint를 선택했습니다.

## 6. 선택한 schema는 시간 관계를 직접 표현한다

먼저 유효한 시간 범위를 고정했습니다.

```sql
ALTER TABLE recovery_timeboxes
ADD CONSTRAINT chk_recovery_timeboxes_valid_period
CHECK (start_at < end_at);
```

종료 시각과 다음 구간 시작 시각이 맞닿는 것은 허용하기 위해 `[start, end)`를 사용했습니다.

```text
[09:00, 09:30)
              [09:30, 10:00)
```

사용자 equality와 시간 range overlap을 하나의 constraint에서 표현하려면 `btree_gist`가 필요합니다.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE recovery_timeboxes
ADD CONSTRAINT ex_recovery_timeboxes_user_planned_period
EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (timebox_status = 'PLANNED');
```

이 선택은 성능 최적화보다 정합성 선택입니다.

- `user_id WITH =`: 같은 사용자끼리만 비교한다.
- `tstzrange(..., '[)')`: 시간 범위를 명시한다.
- `WITH &&`: 범위가 겹치면 충돌시킨다.
- `PLANNED` predicate: 취소·종료된 이력은 보존하되 현재 계획만 제한한다.

## 7. 같은 판단 기준을 다른 불변식에도 적용했다

### 7.1 현재 상태의 equality에는 partial unique index

일반 unique constraint는 제거된 과거 row까지 제한합니다. hard delete는 이력을 없앱니다. 따라서 활성 row만 unique 범위에 포함했습니다.

```sql
CREATE UNIQUE INDEX uq_daily_big3_entry_order
ON daily_big3_entries (daily_big3_board_id, slot_order)
WHERE removed_at IS NULL;
```

이력 보존과 현재 상태 유일성을 분리한 것입니다.

### 7.2 aggregate 최대 개수에는 parent row lock

ExecutionUnit이 4개인 parent에 두 요청이 동시에 추가되면 둘 다 count 4를 읽고 최종 6개가 될 수 있습니다.

```text
parent PESSIMISTIC_WRITE
→ child count
→ 최대 5개 검증
→ INSERT
```

aggregate count는 단순 unique constraint로 표현하기 어렵기 때문에 항상 존재하는 parent row를 최소 직렬화 지점으로 사용했습니다.

이 방식은 schema가 자동으로 보장하는 불변식이 아닙니다. 모든 생성 경로가 같은 lock protocol을 지켜야 하며, parent hot-key lock wait는 아직 측정하지 않았습니다.

## 8. DB 정합성과 API 계약은 별개의 문제였다

DB가 겹치는 INSERT를 거절해도 API가 일반 500을 반환하면 클라이언트는 데이터 충돌인지 서버 장애인지 구분할 수 없습니다.

현재 일부 unique constraint는 known map을 통해 HTTP 409로 변환됩니다. 그러나 `ex_recovery_timeboxes_user_planned_period`는 아직 known constraint map에 없어, 애플리케이션 검증을 모두 통과한 동시 요청이 exclusion constraint에서 충돌하면 500으로 노출될 수 있습니다.

따라서 현재 결론은 다음과 같습니다.

```text
DB 최종 불변식 방어: 검증됨
Timebox exclusion 충돌의 HTTP 409 계약: 미완성
Runtime DDL을 versioned migration으로 관리: 미완성
```

이 구분을 남겨야 “GiST를 적용했으니 기능이 완성됐다”고 과장하지 않게 됩니다.

## 9. Case 2의 최종 판단

```text
애플리케이션 overlap 검증
→ 기존 row에 PESSIMISTIC_WRITE 적용
→ 최초 INSERT에는 잠글 row가 없다는 한계 발견
→ 두 transaction이 동시에 빈 결과를 읽도록 재현
→ guard row·SERIALIZABLE·range constraint 비교
→ range 관계를 GiST exclusion constraint로 schema에 선언
→ equality와 aggregate 규칙은 각각 partial unique·parent lock으로 분리
→ API 409·migration·운영성 측정은 남은 문제로 분리
```

현재 주장할 수 있는 범위:

- 기존 row가 있을 때 `SELECT FOR UPDATE`가 두 transaction을 대기시키는 것을 확인했다.
- 최초 동시 INSERT에서 두 요청이 모두 사전 검증을 통과할 수 있음을 재현했다.
- exclusion constraint가 있는 실험 분기에서 겹치는 INSERT가 성공 1건·충돌 1건으로 수렴했다.
- 불변식의 모양에 따라 partial unique, GiST exclusion, parent lock을 구분했다.
- 활성 slot과 carryover lineage의 중복 생성 방어 결과를 검증했다.

아직 주장하지 않는 범위:

- GiST가 항상 더 빠르다는 결론
- GiST index size·write amplification·vacuum 비용 측정
- exclusion 충돌이 현재 HTTP 409로 완성됐다는 주장
- runtime initializer가 운영 migration을 대체한다는 주장
- parent lock의 hot-key 처리량과 lock wait가 검증됐다는 주장
- Planning의 모든 동시성 문제가 해결됐다는 주장

상세 근거: [Case 2 상세 문서](docs/case-studies/02_PLANNING_CONCURRENCY_INVARIANTS.md), [Partial Unique Index 서사](docs/archive/legacy/_merged_2026-06-22/study/PARTIAL_UNIQUE_INDEX_END_TO_END_STORY.md), [동시성 테스트 교정 계획](docs/archive/legacy/_merged_2026-06-22/study/CONCURRENCY_TEST_REMEDIATION_PLAN.md)

---

# 두 사례에서 반복되는 의사결정 기준

## 1. 기술보다 먼저 불변식과 비용의 형태를 정의한다

- equality 유일성인가?
- 시간 범위 교차인가?
- aggregate count인가?
- JVM 객체 비용인가?
- DB transaction·WAL·lock 비용인가?

문제의 모양이 달라지면 최종 방어선도 달라져야 합니다.

## 2. 첫 번째 해결이 만든 새로운 문제를 다음 의사결정의 입력으로 삼는다

bulk update는 JVM heap 문제를 줄였지만 DB transaction 문제를 드러냈습니다. 따라서 첫 해결을 최종 성공으로 포장하지 않고 bounded window로 다시 설계했습니다.

애플리케이션 lock은 기존 row가 있을 때 동작했지만 최초 INSERT에는 실패했습니다. 따라서 lock을 무조건 강화하지 않고, 범위 관계를 schema constraint로 옮겼습니다.

## 3. 선택한 기술과 선택하지 않은 대안을 함께 기록한다

포트폴리오에서 중요한 문장은 “GiST를 사용했다”가 아니라 다음입니다.

> 사용자 전체를 직렬화하는 guard row와 transaction 전체 retry를 비교한 뒤, 실제 시간 범위 관계를 모든 write path에서 보호하면서 비충돌 구간의 병렬성을 유지하는 exclusion constraint를 선택했다.

또한 “bulk update로 빨라졌다”가 아니라 다음으로 설명합니다.

> entity materialization을 제거해 JVM heap 비용을 줄였지만, 비용이 DB transaction과 WAL로 이동할 수 있음을 확인했다. 그래서 처리량 최대값이 아니라 lock·rollback·foreground 영향까지 제한하는 bounded window를 선택했다.

## 4. 결과와 주장 범위를 분리한다

측정 결과는 반드시 다음과 함께 제시합니다.

- 실행 환경
- workload와 대상 row 수
- 테스트가 실제로 호출한 계층
- 증명한 것
- 아직 증명하지 않은 것
- 다음 측정 계획

이 문서의 목적은 기술 이름을 나열하는 것이 아니라, 왜 그 선택을 했고 어떤 비용을 감수했으며 어디까지 책임질 수 있는지를 설명하는 것입니다.

## 관련 문서

- [기존 포트폴리오](portfolio.md)
- [대량 상태 전이 상세 사례](docs/case-studies/01_BULK_STATE_TRANSITION.md)
- [Planning 동시성 상세 사례](docs/case-studies/02_PLANNING_CONCURRENCY_INVARIANTS.md)
- [대량 처리 실측 결과](perf/results/core-throughput/README.md)
- [개선 backlog](improvement.md)
