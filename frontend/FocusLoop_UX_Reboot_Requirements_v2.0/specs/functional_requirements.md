# Functional Requirements

## HOME

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| HOME-001 | 홈은 1인칭 정박 장면을 기본으로 표시한다. | Must |
| HOME-002 | 하단 선수와 부두 또는 밧줄 중 하나가 보여 정박 상태를 이해할 수 있어야 한다. | Must |
| HOME-003 | 빠른 집중, 오늘의 계획, 긴 여정 모드를 전환할 수 있다. | Must |
| HOME-004 | 작업 입력, 시간 선택, 스킨 선택, 집중 시작 CTA가 320×568에서 모두 보여야 한다. | Must |
| HOME-005 | 키보드가 열려도 집중 시작 CTA가 접근 가능해야 한다. | Must |
| HOME-006 | 긴 목록만 별도 Scroll 영역을 사용한다. | Must |
| HOME-007 | 최근 작업 이어가기를 제공할 수 있다. | Should |
| HOME-008 | 선택한 스킨의 정박 항구와 사운드를 Preview한다. | Should |
| HOME-009 | 설정 오류나 API 실패가 집중 시작을 막지 않도록 Local Mode를 제공한다. | Must |
| HOME-010 | 집중 시작 중복 탭을 방지한다. | Must |

## DEPARTURE

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| DEP-001 | 집중 시작 입력 즉시 Focus Timer를 시작한다. | Must |
| DEP-002 | 출항 연출은 기본 2~4초다. | Must |
| DEP-003 | 출항 연출을 Skip할 수 있다. | Must |
| DEP-004 | 밧줄 해제, 부두 Parallax, Sound Fade In을 포함한다. | Should |
| DEP-005 | Reduce Motion에서는 Fade 중심 0.5~1.5초로 축소한다. | Must |
| DEP-006 | 출항 중 앱이 Background로 가면 상태와 Timer를 복구한다. | Must |
| DEP-007 | 출항 중 Pause 입력을 허용하거나 명확히 비활성화한다. | Should |
| DEP-008 | 출항 애니메이션 실패 시 ACTIVE로 안전 전환한다. | Must |

## FOCUS

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| FOCUS-001 | 집중 화면은 1인칭 선수와 열린 수평선을 표시한다. | Must |
| FOCUS-002 | 작업명, Timer, Pause만 기본 표시한다. | Must |
| FOCUS-003 | 4~6초 후 UI를 자동 숨긴다. | Must |
| FOCUS-004 | 화면 탭으로 UI를 재노출한다. | Must |
| FOCUS-005 | UI는 3~5초 후 다시 숨는다. | Should |
| FOCUS-006 | Countdown과 Stopwatch를 지원한다. | Must |
| FOCUS-007 | Timer 종료와 작업 완료를 분리한다. | Must |
| FOCUS-008 | Sound On/Off를 제공한다. | Must |
| FOCUS-009 | 세션 종료는 확인을 거친다. | Must |
| FOCUS-010 | Scene 렌더링 실패가 Timer를 중단시키지 않는다. | Must |
| FOCUS-011 | Progress에 따라 환경이 연속 변화한다. | Should |
| FOCUS-012 | 집중 중 스킨 즉시 변경은 기본 제공하지 않는다. | Should |

## PAUSE

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| PAUSE-001 | Pause Tap 즉시 Focus Timer를 정지한다. | Must |
| PAUSE-002 | 15초 항구 탐색은 Timer 정지를 지연시키지 않는다. | Must |
| PAUSE-003 | 항구 탐색을 Skip할 수 있다. | Must |
| PAUSE-004 | 탐색을 취소하고 집중으로 돌아갈 수 있다. | Must |
| PAUSE-005 | 탐색 중 Compass Arc와 먼 불빛 후보를 표시한다. | Should |
| PAUSE-006 | 360도 Camera 회전을 사용하지 않는다. | Must |
| PAUSE-007 | 같은 세션의 반복 Pause 정책을 설정할 수 있다. | Could |
| PAUSE-008 | Reduce Motion에서는 즉시 또는 3초 이내 항구 전환한다. | Must |
| PAUSE-009 | 탐색 실패 개념과 실패 확률을 두지 않는다. | Must |
| PAUSE-010 | 항구 탐색 중 세션 종료가 가능하다. | Must |

## REST

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| REST-001 | 5분, 10분, 자유 휴식을 제공한다. | Must |
| REST-002 | Focus Timer와 Rest Timer를 분리한다. | Must |
| REST-003 | Rest 종료 후 자동 재출항하지 않는다. | Must |
| REST-004 | 사용자가 Resume를 선택해야 한다. | Must |
| REST-005 | 휴식 중 Sound를 조절할 수 있다. | Should |
| REST-006 | 휴식 중 세션을 종료할 수 있다. | Must |
| REST-007 | 휴식 메모를 선택적으로 입력할 수 있다. | Could |
| REST-008 | 휴식 항구는 선택 스킨과 일치한다. | Must |
| REST-009 | Rest 상태에서 배와 파도의 움직임을 낮춘다. | Must |

## RESUME

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| RES-001 | 재출항은 1.5~3초다. | Should |
| RES-002 | Focus Timer는 재출항 입력 시점 또는 연출 종료 시점 정책을 일관되게 적용한다. | Must |
| RES-003 | 권장 정책은 재출항 입력 즉시 Timer 재개다. | Should |
| RES-004 | 재출항 연출을 Skip할 수 있다. | Must |
| RES-005 | 항구 장면에서 열린 바다 장면으로 자연스럽게 전환한다. | Should |

## ARRIVAL

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| ARR-001 | Countdown 종료, Stopwatch 종료, 조기 완료 시 ARRIVING 상태로 진입한다. | Must |
| ARR-002 | 도착 연출은 2~4초다. | Should |
| ARR-003 | 도착 연출 Skip을 제공한다. | Must |
| ARR-004 | 목적지 불빛과 수면 안정화를 표현한다. | Should |
| ARR-005 | 작업 완료 여부를 사용자에게 묻는다. | Must |
| ARR-006 | 완료하지 못해도 집중 기록을 저장한다. | Must |
| ARR-007 | 도착 연출 실패 시 Logbook 생성으로 안전 전환한다. | Must |

## LOGBOOK

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| LOG-001 | 세션 종료 시 Logbook Entry를 자동 생성한다. | Must |
| LOG-002 | 집중시간, 휴식시간, Pause 횟수, 스킨, 항구를 저장한다. | Must |
| LOG-003 | 작업 완료 여부를 저장한다. | Must |
| LOG-004 | 메모는 선택 사항이다. | Must |
| LOG-005 | 일간, 주간, 긴 여정별 View를 제공한다. | Should |
| LOG-006 | 생산성 점수와 등급을 기본 제공하지 않는다. | Must |
| LOG-007 | 같은 작업 이어가기를 제공한다. | Must |
| LOG-008 | 기록 삭제와 Export를 지원한다. | Should |
| LOG-009 | 작업명 숨김 공유 이미지를 제공할 수 있다. | Could |
| LOG-010 | Local-first 저장을 사용한다. | Must |

## SKIN

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| SKIN-001 | 최소 2개 무료 스킨을 제공한다. | Must |
| SKIN-002 | 출시 목표는 4개 이상이다. | Should |
| SKIN-003 | 스킨은 팔레트, 선수, 물, 사운드, 출발, 휴식 항구, 도착을 포함한다. | Must |
| SKIN-004 | 8~12초 Preview를 제공한다. | Should |
| SKIN-005 | 스킨 선택은 세션 시작 전에 적용한다. | Must |
| SKIN-006 | 색상만 변경한 스킨을 완성 스킨으로 인정하지 않는다. | Must |
| SKIN-007 | 각 스킨은 Reduce Motion Profile을 가진다. | Must |
| SKIN-008 | 구매한 스킨은 Offline에서도 사용할 수 있다. | Should |

## PLANNING

| ID | 요구사항 | 우선순위 |
| --- | --- | --- |
| PLAN-001 | 빠른 집중은 작업명과 시간만으로 시작할 수 있다. | Must |
| PLAN-002 | 오늘의 계획은 최대 3개의 주요 작업을 기본으로 한다. | Should |
| PLAN-003 | 긴 여정은 Stage와 Task를 가진다. | Must |
| PLAN-004 | 모든 모드는 같은 Focus Scene을 공유한다. | Must |
| PLAN-005 | 빠른 작업을 오늘의 계획 또는 긴 여정으로 승격할 수 있다. | Should |
| PLAN-006 | 집중 중 전체 계획을 노출하지 않는다. | Must |
