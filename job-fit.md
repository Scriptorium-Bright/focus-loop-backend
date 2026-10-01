# FocusLoop | Planning Backend 핵심 기술 사례

## 프로젝트 개요

**프로젝트명:** FocusLoop

**프로젝트 설명:** 실행할 작업 후보를 수집하고, 우선순위와 시간 계획을 구성한 뒤, 실제 실행, 실패, 재시작 이력을 관리하는 Planning 중심 백엔드 프로젝트입니다. 상태 전이 과정의 데이터 정합성, 대량 처리의 메모리 안정성, REST API의 처리 용량을 구현과 재현 테스트로 검증했습니다.

**Skills:** Java 21, Spring Boot 3.3.8, Spring Batch, Spring Data JPA, Hibernate, PostgreSQL, Gradle, Micrometer, Prometheus, k6, JUnit 5

## 1. 대량 상태 전이의 메모리와 트랜잭션 비용 최적화

### 문제

기존 만료 작업은 과거 `OPEN` 데이터를 JPA entity로 모두 조회한 뒤 상태를 변경했습니다. 처리 건수에 비례해 영속성 컨텍스트와 dirty checking 대상이 증가하면서 JVM heap과 GC 비용이 커졌고, 대량 데이터를 안정적으로 처리하기 어려웠습니다.

### 해결

대량 만료 작업을 Spring Batch의 Job, Step, Tasklet으로 구성해 스케줄 실행과 수동 실행이 동일한 경로를 사용하도록 했습니다. Tasklet 내부에서는 PostgreSQL CTE로 한 번에 최대 10만 건을 선택하고, `FOR UPDATE SKIP LOCKED`와 set-based bulk update로 상태를 변경했습니다. 각 chunk를 독립 트랜잭션으로 처리했으며, 처리 건수는 Job ExecutionContext에 저장하고 실행 시간과 성공 여부는 Micrometer 지표로 기록했습니다. `expired_at`, `updated_at`, `version` 증가 조건도 SQL에 명시해 JPA entity를 우회해도 기존 상태 전이 규칙이 유지되도록 했습니다.

### 의사결정

동일한 상태 전이에는 entity별 callback이 필요하지 않아 ItemReader, ItemProcessor, ItemWriter로 row를 순회하는 방식보다 DB 집합 연산을 실행하는 Tasklet이 적합하다고 판단했습니다. 전체 데이터를 한 번에 변경하는 방식은 lock 유지 시간과 WAL 증가가 한 트랜잭션에 집중되므로 bounded chunk로 처리 범위를 제한했습니다. 또한 실제 인덱스 조건을 재현한 20만 건 실험에서 상태 컬럼 변경 시 HOT update가 발생하지 않는 것을 확인해, 효과가 검증되지 않은 `fillfactor=80` 설정은 적용하지 않았습니다.

### 결과

PostgreSQL 14.21, JVM 최대 heap 512 MiB 환경에서 300,000건을 4,417ms에 처리했습니다. 처리량은 67,919 rows/s였으며 peak heap 증가는 3.00 MiB, GC는 0회였습니다. 처리 후 300,000건이 모두 `EXPIRED`로 전이되고 과거 `OPEN` 데이터가 남지 않은 것도 함께 검증했습니다.

## 2. Planning 데이터의 동시성 불변식 보장

### 문제

Planning 흐름에는 활성 항목 중복 금지, 동일 작업의 중복 이관 금지, 계획 시간 중복 금지와 같은 불변식이 존재합니다. 애플리케이션의 선행 조회만으로는 두 트랜잭션이 동시에 `존재하지 않음`을 읽고 INSERT하는 경쟁을 막을 수 없었고, 최초 시간 구간 INSERT는 잠글 기존 row도 없었습니다.

### 해결

활성 데이터의 유일성에는 PostgreSQL partial unique index를 적용하고, 시간 구간 겹침에는 `tstzrange` 기반 GiST exclusion constraint를 적용했습니다. 부모별 하위 항목 최대 개수처럼 단일 제약으로 표현하기 어려운 규칙은 parent row의 `PESSIMISTIC_WRITE` lock 안에서 count와 INSERT를 직렬화했습니다. 알려진 DB 제약 충돌은 Spring MVC 전역 예외 처리에서 reason code를 포함한 HTTP 409로 변환했습니다.

### 의사결정

일반 unique constraint는 종료되거나 삭제된 과거 데이터까지 제한하고, hard delete는 변경 이력을 제거합니다. 따라서 partial unique index로 현재 상태의 유일성과 과거 이력 보존을 분리했습니다. 시간 범위는 사용자별 전체 요청을 직렬화하는 방식보다 DB range constraint가 모든 쓰기 경로를 보호하면서 사용자 간 병렬성을 유지한다고 판단했습니다. 최대 N개 규칙은 임계 구역이 짧고 생성 빈도가 낮아 별도 counter보다 parent lock을 선택했습니다.

### 결과

동시 요청 테스트에서 활성 상태와 작업 이관은 각각 성공 1건, 충돌 1건, 최종 활성 row 1건으로 수렴했습니다. 겹치는 시간 구간의 최초 동시 INSERT도 한 건만 커밋됐으며, `[09:00, 09:30)`, `[09:30, 10:00)`처럼 경계가 맞닿은 구간은 정상적으로 허용했습니다. 하위 항목이 4개인 부모에 대한 동시 생성은 성공 1건, 충돌 1건, 최종 5개로 제한됐습니다.

## 3. REST 쓰기 흐름의 안정 처리량과 포화 지점 측정

### 문제

개별 API의 응답 시간만으로는 후보 저장, Planning 구성, 하위 실행 단위 생성으로 이어지는 전체 업무 흐름의 처리 용량을 판단하기 어려웠습니다. HTTP 성공률만 확인하면 서버가 수용하지 못한 요청과 queueing으로 증가한 tail latency를 놓칠 수 있었습니다.

### 해결

k6 `constant-arrival-rate` 시나리오로 5개의 REST write 요청과 13개 row 생성을 하나의 업무 flow로 구성했습니다. 40, 100, 150 flow/s 부하에서 요청 유입량, 완료 처리량, dropped iteration, flow p95와 p99를 측정하고, 테스트 종료 후 DB row 비율을 확인해 부분 성공과 데이터 누락 여부도 검증했습니다.

### 의사결정

단일 endpoint benchmark보다 여러 트랜잭션과 parent-child 생성이 연결된 실제 command flow를 측정 대상으로 선택했습니다. HTTP 200 비율을 처리 용량으로 오해하지 않도록 요청 유입량과 실제 완료량을 분리하고, 평균 응답 시간 대신 p95와 p99, dropped work를 포화 판단 기준에 포함했습니다.

### 결과

로컬 단일 인스턴스에서 100 flow/s 부하는 3,001 flow를 유실 없이 처리했습니다. 완료 처리량은 99.89 flow/s, 성공률은 100%, p95는 535ms, p99는 765ms였습니다. 150 flow/s에서는 완료 처리량이 130.37 flow/s에 머물고 384 iteration이 drop됐으며 p95가 2.73초로 증가해 시스템의 포화 구간을 확인했습니다. 모든 완료 flow는 `board 1 : inbox 3 : Big3Item 3 : ExecutionUnit 6`의 최종 데이터 비율을 유지했습니다.
