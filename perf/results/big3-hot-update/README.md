# Big3 HOT Update Result

- 측정일: 2026-06-14
- PostgreSQL: 16.11, aarch64
- fixture: 테이블당 200,000 rows
- 변경 컬럼: `status`, `expired_at`, `updated_at`, `version`
- 비교 조건:
  - A: `fillfactor=100`, PK만 존재
  - B: `fillfactor=80`, PK만 존재
  - C: `fillfactor=80`, 실험에서 가정한 `(status, week_start, id)` 인덱스 존재

실행 명령:

```bash
BIG3_HOT_UPDATE_TEST_ENABLED=true ./gradlew test --no-daemon --rerun-tasks --info \
  --tests com.focuskeeper.reboot.common.persistence.Big3HotUpdateEfficiencyTest
```

측정 결과:

| 항목 | A: ff100, PK | B: ff80, PK | C: ff80, 가정한 인덱스 |
|---|---:|---:|---:|
| updated rows | 200,000 | 200,000 | 200,000 |
| HOT updated rows | 0 | 51,855 | 0 |
| HOT ratio | 0.00% | 25.93% | 0.00% |
| WAL records | 602,732 | 498,476 | 752,662 |
| WAL bytes | 134,729,955 | 120,009,464 | 146,533,417 |
| execution time | 3,264.855 ms | 2,464.448 ms | 9,870.031 ms |

판정:

- PK만 있는 통제군에서는 `fillfactor=80`이 HOT update를 발생시켰다.
- C처럼 `status`를 포함한 인덱스가 있으면 만료 UPDATE가 해당 index entry도 변경해 HOT 조건을 만족하지 못한다.
- C 조건에서는 HOT update가 0건이었다.
- 2026-07-17 현재 source-defined schema에는 `(status, week_start, id)` index 정의가 없다. 따라서 이 결과를 현재 운영 schema와 동일한 조건으로 간주하지 않는다.
- live schema와 selector index 채택 여부, WAL·공간 비용을 함께 재검증하기 전에는 `fillfactor=80`을 채택하지 않는다.
- 실행 시간과 WAL 수치는 단일 로컬 실행값이므로 방향성 참고값이며, 핵심 판정값은 HOT 0건이다.

운영 테이블의 누적값 확인은
`perf/sql/big3_hot_update_observation.sql`을 사용한다.
