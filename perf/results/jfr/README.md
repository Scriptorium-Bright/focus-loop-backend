# JVM JFR 측정 계획

> 상태: 계획 문서
> 
> 목적: 기존 처리량·대량 만료 실험에 JVM 내부 관측을 붙여 CPU, allocation/GC, lock, I/O 중 어디가 병목인지 분리한다.

## 측정 질문

평균 응답 시간이 느리다는 결론만 내리지 않고 다음 질문에 답한다.

1. CPU 시간이 애플리케이션 코드, Spring/JPA 변환, 직렬화, JDBC 대기 중 어디에 쓰이는가?
2. heap 증가와 GC pause가 처리량 포화 또는 tail latency 상승과 함께 나타나는가?
3. `synchronized`/monitor, `LockSupport`, DB connection 대기 중 어떤 대기가 실제로 발생하는가?
4. 대량 만료에서 allocation이 대상 row 수에 비례하는가, bounded bulk 경로에서 상한을 보이는가?
5. JVM 관측 결과가 k6, Micrometer, PostgreSQL 관측값과 같은 현상을 가리키는가?

JFR 단독으로 SQL 원인이나 DB 병목을 확정하지 않는다. JFR은 JVM 내부 증거로 사용하고, 요청 지연·connection pool·DB 실행계획과 교차 검증한다.

## 대상 시나리오

첫 번째 측정은 현재 저장소에 이미 있는 두 경로로 한정한다.

| 시나리오 | workload | 목적 |
|---|---|---|
| core 안정 구간 | `FLOW_RATE=100`, `DURATION=30s` | 기존 기준선에서 정상 처리 시 JVM 비용 확인 |
| core 포화 구간 | `FLOW_RATE=150`, `DURATION=30s` | p95/p99 상승과 dropped work가 JVM 병목과 함께 움직이는지 확인 |
| expiration | `PERF_EXPIRATION_ROWS=300000`, `PERF_EXPIRATION_MAX_HEAP=512m` | 대량 상태 전이의 allocation, GC, safepoint, CPU 사용 확인 |

기존 120~140 flow/s 포화 곡선이 필요할 때만 중간 구간을 추가한다. 첫 측정부터 workload를 넓히지 않아 기존 결과와의 비교 가능성을 유지한다.

## 실행 전 조건

- Java 21 계열과 실제 실행 JVM을 고정한다. 현재 확인된 로컬 JDK는 Temurin 21.0.6이다.
- core 측정은 기존 throughput 결과와 같은 PostgreSQL 계열·Hikari 설정을 사용한다. PostgreSQL 14.21 결과와 다른 DB 버전 결과를 한 표에 섞지 않는다.
- expiration은 전용 DB에서만 실행하고 `PERF_EXPIRATION_CONFIRM_DEDICATED_DB=true`를 요구한다.
- baseline과 JFR 측정은 같은 코드, heap, DB, seed, k6 옵션으로 짝을 만든다.
- JFR 파일을 저장할 디스크 여유 공간과 대상 JVM의 PID를 먼저 확인한다.
- backend 소스는 수정하지 않는다. JFR은 실행 중인 JVM에 attach하는 관측 단계다.

## 실행 순서

### 1. baseline

먼저 JFR 없이 기존 측정을 실행하고 다음을 보존한다.

- k6 summary: completed, success, dropped, p95, p99, HTTP error rate
- expiration 출력: elapsed, rows/s, heap before/peak/after, GC count/time, final state
- 애플리케이션 JVM 옵션, PostgreSQL 버전, Hikari pool 설정

기존 참고 결과는 [core-throughput](../core-throughput/README.md)에 있다. 과거 측정값을 새 JFR 결과의 baseline으로 바로 사용하지 않고, 환경이 같은지 확인한 뒤 비교한다.

### 2. 대상 JVM에 recording 시작

애플리케이션을 실행한 뒤 실제 Spring Boot JVM을 확인한다. Gradle daemon이나 Gradle test worker를 잘못 잡지 않도록 PID의 command line을 확인한다.

```bash
jps -lv
jcmd <PID> VM.command_line
```

core workload 예시:

```bash
JFR_FILE="perf/results/jfr/2026-07-21-core-100.jfr"

jcmd <APP_PID> JFR.start \
  name=focusloop-core-100 \
  settings=profile \
  duration=60s \
  filename="$JFR_FILE"

FLOW_RATE=100 DURATION=30s RUN_ID=jfr-core-100 \
  k6 run perf/k6/load-test.js
```

`duration=60s`는 30초 workload 앞뒤의 warm-up/cool-down을 포함하기 위한 첫 설정이다. 실제 분석에서는 workload가 실행된 시간 구간을 별도로 표시한다.

expiration 하네스는 test worker PID를 대상으로 한다.

```bash
PERF_EXPIRATION_ROWS=300000 \
PERF_EXPIRATION_MAX_HEAP=512m \
PERF_EXPIRATION_CONFIRM_DEDICATED_DB=true \
PERF_EXPIRATION_MEMORY_ENABLED=true \
  ./gradlew expirationMemoryHarness --no-daemon --rerun-tasks
```

하네스가 Spring context를 올린 뒤 `jps -lv`로 test worker를 확인하고 같은 `JFR.start`를 attach한다. Gradle launcher에 `JAVA_TOOL_OPTIONS`를 전역으로 주입하는 방식은 Gradle JVM과 test worker가 섞이거나 같은 파일을 덮어쓸 수 있어 기본 실행법으로 사용하지 않는다.

필요하면 recording을 조기에 닫는다.

```bash
jcmd <PID> JFR.stop name=focusloop-core-100 filename="$JFR_FILE"
```

### 3. JFR 요약 추출

```bash
jfr summary "$JFR_FILE"
jfr view --width 160 hot-methods "$JFR_FILE"
jfr view --width 160 thread-cpu-load "$JFR_FILE"
jfr view --width 160 gc-pauses "$JFR_FILE"
jfr view --width 160 allocation-by-class "$JFR_FILE"
jfr view --width 160 contention-by-class "$JFR_FILE"
jfr view --width 160 socket-reads-by-host "$JFR_FILE"
jfr view --width 160 socket-writes-by-host "$JFR_FILE"
```

필요한 경우 `jfr view <event> <file>` 또는 `jfr print`로 상위 결과의 stack trace와 thread를 확인한다. 결과 해석은 다음 축으로 분리한다.

| 축 | 우선 확인할 JFR 관측 | 함께 비교할 외부 관측 |
|---|---|---|
| CPU | `hot-methods`, `thread-cpu-load`, `ExecutionSample` stack | k6 p95/p99, completed throughput |
| allocation/GC | `allocation-by-class/site`, `gc-pauses`, heap configuration | harness heap/GC 출력, process RSS, DB workload |
| lock/wait | `contention-by-class/site`, `ThreadPark`, monitor events | 동시성 테스트 결과, connection acquisition 대기 |
| I/O | socket read/write host, file I/O | PostgreSQL CPU/I/O, SQL latency, Hikari metrics |
| JVM 상태 | safepoint, deoptimization, compiler, thread count | error log, request latency 변화 |

## 판정 기준

JFR 결과만 보고 “JVM이 원인”이라고 쓰지 않는다. 다음 조건을 모두 만족할 때만 병목 가설을 채택한다.

1. baseline과 JFR run에서 workload와 실행 환경이 동일하다.
2. 해당 현상이 JFR stack/event에 반복적으로 나타난다.
3. 같은 시간대의 k6·Micrometer·DB 관측이 같은 방향의 변화를 보인다.
4. 코드 변경 또는 설정 변경 후 같은 관측값이 개선되거나, 반대 workload에서 재현되지 않는다.

예시 해석:

- `ExecutionSample`의 상위 stack이 애플리케이션/ORM에 집중되고 GC pause가 작으면 CPU 또는 객체 생성 경로를 우선 조사한다.
- allocation rate와 GC pause가 포화 구간에서 함께 증가하면 heap·allocation·GC 가설을 세우되, heap sampler와 GC 로그로 재확인한다.
- `contention`/`ThreadPark` 시간이 증가하지만 CPU sample이 낮으면 lock 또는 connection 대기 가능성을 별도로 확인한다.
- socket read가 길어도 이것만으로 SQL이 느리다고 결론내리지 않고 PostgreSQL slow query/실행계획과 맞춘다.

## 결과 기록 형식

각 실험은 JFR binary와 분석 메모리를 분리한다. 저장소에는 용량이 큰 `.jfr`를 무조건 커밋하지 않고, 재현 조건과 요약 수치를 남긴다.

```text
실험명:
실행일:
commit:
JDK / JVM flags:
DB version / Hikari 설정:
workload:
JFR settings / recording window:

baseline:
- completed / dropped:
- p95 / p99:
- expiration elapsed / rows/s:
- heap / GC:

JFR 요약:
- CPU top:
- allocation top:
- GC pause/count:
- lock/wait:
- socket/file I/O:

판정:
- 확인된 사실:
- 채택한 병목 가설:
- 아직 확인하지 못한 것:
- 다음 실험:
```

## 현재 preflight 상태

2026-07-21 기준으로 JDK 21.0.6의 `jfr`, `jcmd` 실행 파일은 확인했다. 그러나 backend는 실행 중이 아니며, 현재 Docker PostgreSQL 기동은 data volume의 `No space left on device`로 실패했고 `bootRun`은 PostgreSQL connection refused로 종료됐다.

따라서 이 문서 작성 시점에는 대표 workload를 담은 JFR 결과를 만들지 않았다. DB 실행 환경을 복구한 뒤 baseline → JFR recording → 요약 추출 순서로 진행한다. DB가 없는 상태에서 짧은 unit test나 startup 실패를 측정해 backend 성능 결과로 포장하지 않는다.

