# Backend Engineer | FocusLoop

> 데이터가 깨지는 경쟁 조건과 처리량이 무너지는 자원 경계를 재현하고, 측정 가능한 구조로 바꾸는 백엔드 엔지니어입니다.

## 프로젝트 소개

FocusLoop는 작업 후보 수집부터 계획, 실행, 실패와 재시작 이력까지 서로 다른 생명주기로 관리하는 백엔드 프로젝트입니다. 기능 구현에 그치지 않고 대량 상태 전이의 JVM 메모리 비용, PostgreSQL transaction 범위, 동시 INSERT의 정합성, REST 쓰기 흐름의 포화 지점을 구현과 테스트로 검증했습니다.

- 기술: Java 21, Spring Boot 3.3.8, Spring Batch, Spring Data JPA, PostgreSQL, Micrometer, k6
- 상세 포트폴리오: [portfolio.md](portfolio.md)
- 재현 방법과 전체 구조: [README.md](README.md)

## 핵심 성과

- 512 MiB heap에서 JPA entity 순회 방식은 100,000건 처리 시 peak heap이 331.22 MiB 증가하고 GC가 32회 발생했습니다. set-based update 전환 후 10,000,000건을 OOM 없이 peak heap 증가 약 6 MiB·GC 0회로 처리했고, 현재 bounded 경로에서는 300,000건을 4,417ms에 처리했습니다.
- 미커밋 INSERT를 볼 수 없고 잠글 기존 row도 없는 최초 생성 경쟁을 재현했습니다. 불변식의 형태에 따라 partial unique index, GiST exclusion constraint, parent row lock을 적용해 동시 요청 결과를 성공 1건·충돌 1건으로 수렴시켰습니다.
- 5개의 REST write와 13개 row 생성을 하나의 업무 flow로 묶어 측정했습니다. 100 flow/s에서는 3,001 flow를 유실 없이 완료했고, 150 flow/s에서는 완료량이 130.37 flow/s에 머물며 384 iteration이 drop되는 포화 구간을 확인했습니다.

## 주요 문제 해결

### 1. 대량 상태 전이의 자원 비용에 상한을 만들었습니다

기존 작업은 모든 만료 대상을 JPA entity로 읽어 영속성 컨텍스트에 유지했기 때문에, 처리량이 늘수록 heap과 dirty checking 대상도 함께 증가했습니다. 모든 row가 동일한 `OPEN → EXPIRED` 전이를 수행한다는 점에 주목해 PostgreSQL CTE와 `FOR UPDATE SKIP LOCKED` 기반 집합 연산으로 변경했습니다.

변경 전 통제 하네스에서는 100,000건 처리에 9,647ms가 걸렸고 peak heap은 386.84 MiB, 실행 전 대비 증가는 331.22 MiB, GC는 32회·223ms였습니다. 첫 bulk update는 같은 512 MiB 제한에서 대상이 100배인 10,000,000건을 OOM 없이 처리했으며 peak heap 증가는 약 6 MiB, 추가 GC는 0회였습니다. 두 실험의 row 수가 달라 처리 시간 개선율은 계산하지 않았지만, 대상 수에 비례하던 JVM 객체·GC 비용을 제거했다는 근거로 사용했습니다.

전체 변경을 한 transaction에 집중시키면 row lock, WAL, rollback 비용이 커지므로 최대 100,000건의 window마다 독립적으로 commit하도록 범위를 제한했습니다. Spring Batch는 성능 최적화 수단이 아니라 Job·Step의 실행 상태, 실패 전파, 처리 건수와 Micrometer 지표를 남기는 실행 틀로 사용했습니다. row별 변환이 없었기 때문에 Reader·Processor·Writer 대신 DB 집합 연산을 호출하는 Tasklet을 선택했습니다.

### 2. 조회가 아니라 최종 커밋 상태를 기준으로 불변식을 설계했습니다

애플리케이션의 `exists → insert` 검증은 두 transaction이 동시에 `없음`을 읽는 경쟁을 막지 못했습니다. 특히 최초 시간 구간 INSERT는 `SELECT FOR UPDATE`를 사용해도 잠글 tuple이 없었습니다. 두 요청이 모두 검증을 통과한 시점에 barrier를 두어 이 경쟁을 결정적으로 재현했습니다.

현재 상태의 equality에는 과거 이력을 보존하는 partial unique index를, 시간 범위 교차에는 `tstzrange` 기반 GiST exclusion constraint를 적용했습니다. 부모별 child 최대 개수처럼 단일 DB 제약으로 표현하기 어려운 규칙은 항상 존재하는 parent row를 잠근 뒤 count와 INSERT를 직렬화했습니다. 하나의 lock을 반복 적용하지 않고, 불변식의 모양과 최소 직렬화 지점을 기준으로 방어 계층을 선택했습니다.

## 측정과 판단 기준

- 평균 응답 시간이나 HTTP 성공률만으로 용량을 판단하지 않고, offered load와 completed throughput, p95·p99, dropped work를 함께 봤습니다.
- 변경 전 100,000건과 첫 bulk 10,000,000건은 대상 수가 달라 처리 시간 개선율을 계산하지 않았습니다. 대신 같은 heap 제한에서 100배 규모를 더 낮은 peak heap과 GC 0회로 처리한 메모리·확장성 개선을 명시했습니다.
- 100,000건 transaction window는 현재 설정이며 최적값으로 주장하지 않습니다.
- 300,000건 수치는 Spring Batch 전체 경로가 아닌 `service → native SQL` 하네스의 단일 로컬 실행 결과입니다. Batch lifecycle과 실패 전파는 별도의 통합 테스트로 검증했습니다.
- 로컬 30초 부하 결과를 운영 SLA로 일반화하지 않고, 안정 구간과 포화가 시작되는 조건을 구분하는 근거로 사용했습니다.

## 제가 보여드릴 수 있는 역량

- JVM 객체 생명주기와 ORM 영속성 컨텍스트를 고려한 대량 처리 설계
- PostgreSQL MVCC, row lock, unique·range constraint를 활용한 동시성 제어
- transaction 범위, 재실행 의미, 정합성 규칙을 함께 고려하는 실패 설계
- 가설을 경쟁 테스트와 부하 테스트로 재현하고, 수치가 말할 수 있는 범위를 제한하는 검증 방식

## 상세 자료

- [11페이지 기술 포트폴리오](portfolio.md)
- [대량 상태 전이 상세 문서](docs/case-studies/01_BULK_STATE_TRANSITION.md)
- [동시성 불변식 상세 문서](docs/case-studies/02_PLANNING_CONCURRENCY_INVARIANTS.md)
- [처리량 실험 결과](perf/results/core-throughput/README.md)

## 프론트엔드 이력서 후보

문제: 장시간 켜두는 집중 장면에서 연속 파도선 반복, 상시 노출 UI, 짧은 오디오 루프가 시각·청각 피로를 만들 수 있었습니다.

해결: Web Canvas와 Native SVG에 결정론적 dash/gap 패턴을 공유하고, Focus UI를 4.8초 후 자동 숨김·탭 재노출 구조로 바꾸었으며, Web Audio brown-noise 버퍼를 16초와 양끝 완화 방식으로 확장했습니다.

결과: 단위 테스트 19건 통과, Web build/typecheck 통과, Chrome에서 Home/Focus·30초 영상·progress 0/0.5/1·Pause·Reduce Motion·mobile A/B evidence를 확보했습니다. Native 실기기 frame time·배터리·발열은 측정 필요.

## FocusLoop Web 구현 기록

문제:
UX 설계 문서의 세션 상태, 15초 항구 탐색, 휴식·복귀, Logbook, 스킨 접근 조건을 브라우저에서 같은 흐름으로 동작시켜야 했습니다.

해결:
React + TypeScript + Vite로 화면을 구성하고, 세션 전이를 reducer로 분리했습니다. Focus·Rest 시간은 `Date.now()`와 timestamp로 계산하고, Canvas Scene은 상태·스킨·Reduce Motion을 입력으로 받도록 분리했습니다. localStorage에 세션·작업·여정·Logbook을 저장하고, 상태 전이 즉시 저장과 15초 snapshot을 적용했습니다.
Logbook 삭제·JSON/CSV/이미지 Export·일간/주간/긴 여정 View, Journey Detail·Session Recovery, Quick 작업 승격 제안과 스킨별 Sound Preview를 local-first 경계 안에 추가했습니다.
MVP 이후에는 Session/Logbook 이벤트를 멱등 Sync Queue에 저장하고 실패 시 backoff를 적용했습니다. 작업명 원문을 analytics와 sync payload에서 제외하고, Premium 권한은 만료 시각이 있는 Entitlement Cache로만 적용하도록 했습니다. PWA shell, 결제/복원 Adapter, 장면 FPS 진단도 같은 경계에 연결했습니다.

의사결정:
애니메이션 tick을 시간 기준으로 사용하지 않았습니다. Pause·Resume·Arrival을 명시적 전이로 두고, 중복 START는 reducer에서 차단했습니다. Premium/Unlock 스킨은 미리보기와 적용 조건을 분리했습니다. 외부 서버·결제 SDK가 없는 환경에서 성공을 가장하지 않고, Adapter와 로컬 캐시만 동작하도록 했습니다.

결과:
Home → Focus → Pause → Harbor Search → Rest → Resume → Arrival → Logbook 흐름과 Journey/Skin 화면을 브라우저에서 확인했습니다. `frontend` 테스트 25개와 `npm run build`를 통과했고, 320×568·desktop Home 및 PWA asset 생성을 확인했습니다. 실제 Cloud Sync endpoint·인증, 결제 SDK/영수증 검증, iOS/Android 실기기와 25분 사용자 테스트는 별도 검증 항목입니다.
