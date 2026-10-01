# Detailed Screen Requirements

## 01 Onboarding Welcome

### 목적

제품의 정체성과 1인칭 항해 은유를 5초 안에 전달한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- FocusLoop 로고
- 1인칭 선수
- 넓은 수평선
- 시작 CTA

### 주요 행동

- 다음
- 건너뛰기

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 긴 기능 목록
- 강제 계정 생성

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 02 Onboarding Pause

### 목적

Pause가 실패가 아니라 쉼터 항구 탐색임을 설명한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- Pause 예시
- 15초 항구 탐색
- 바로 쉬기

### 주요 행동

- 다음

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 복잡한 튜토리얼

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 03 Home Docked Quick

### 목적

작업 하나를 가장 빨리 시작한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 정박 Scene
- 작업 입력
- 시간
- 스킨
- 집중 시작

### 주요 행동

- 입력
- 시간 선택
- 시작

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- CTA 잘림
- 과도한 카드

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 04 Home Daily

### 목적

오늘 작업 중 하나를 선택한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 최대 3개 작업
- 시간
- 스킨
- 시작

### 주요 행동

- 작업 선택
- 추가

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 스크롤 과다

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 05 Home Journey

### 목적

긴 여정의 다음 작업을 시작한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 프로젝트
- 현재 단계
- 다음 작업
- 시간

### 주요 행동

- 프로젝트 선택
- 시작

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 간트차트

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 06 Skin Browser

### 목적

환경을 탐색한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 현재 스킨
- 무료
- Premium
- 해금

### 주요 행동

- Preview
- 적용
- 구매

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 색상칩만 나열

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 07 Skin Preview

### 목적

스킨의 전체 감각을 확인한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 정박
- 출항
- 항해
- 항구
- Sound

### 주요 행동

- 적용
- 구매
- 닫기

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 30초 이상 강제

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 08 Departure

### 목적

집중 시작의 감정 전환.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 밧줄
- 부두
- 선수
- 작업명

### 주요 행동

- Skip

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 긴 컷신

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 09 Focus Visible

### 목적

필요한 제어를 제공한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 작업명
- Timer
- Pause
- Exit

### 주요 행동

- Pause
- 탭
- 완료

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- HUD

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 10 Focus Hidden

### 목적

장면만 남겨 Ambient 사용을 지원한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 1인칭 Scene

### 주요 행동

- 탭

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 보이지 않는 Exit

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 11 Harbor Search

### 목적

Pause 이후 쉴 곳을 찾는다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 15초
- Compass
- 불빛
- 바로 쉬기
- 돌아가기

### 주요 행동

- Skip
- Cancel

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 360도 회전

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 12 Rest Harbor

### 목적

안전하게 휴식한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- Rest Timer
- Resume
- End
- Sound

### 주요 행동

- 5분
- 10분
- 자유
- 재출항

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 자동 재출항

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 13 Resuming

### 목적

같은 여정으로 돌아간다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 항구 이탈
- 선수
- 작업명

### 주요 행동

- Skip

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 새 세션 생성

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 14 Arrival

### 목적

세션 종료를 도착으로 표현한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 목적지
- 배 안정
- 결과

### 주요 행동

- Skip

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 폭죽

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 15 Completion Choice

### 목적

시간 종료와 작업 완료를 구분한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 완료
- 이어가기
- 기록 종료

### 주요 행동

- 선택

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 자동 완료

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 16 Logbook Entry

### 목적

한 세션을 기록한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 작업
- 시간
- 휴식
- 스킨
- 항구
- 메모

### 주요 행동

- 저장
- 이어가기

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 점수

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 17 Daily Log

### 목적

오늘의 기록을 본다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 세션 목록
- 총시간
- 작업

### 주요 행동

- 열기
- 이어가기

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 생산성 등급

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 18 Weekly Log

### 목적

주간 흐름을 본다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 날짜
- 집중시간
- 복귀율
- 스킨

### 주요 행동

- 필터

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 경쟁

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 19 Journey List

### 목적

장기 목표를 관리한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 진행 중
- 완료
- 추가

### 주요 행동

- 열기
- 생성

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 게임 지도

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 20 Journey Detail

### 목적

현재 단계와 다음 작업을 본다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- Stage
- Task
- 누적시간
- 일지

### 주요 행동

- 집중 시작
- 완료

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 복잡한 PM 기능

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 21 Session Recovery

### 목적

중단된 세션을 복구한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- 이어가기
- 정박 종료
- 기록

### 주요 행동

- 선택

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 데이터 유실

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.

## 22 Settings

### 목적

환경과 접근성을 설정한다.

### 진입 조건

- 이전 상태와 사용자의 명시적 행동으로 진입한다.
- Deep Link 또는 앱 복구로 진입할 때 필요한 데이터가 없으면 안전한 상위 화면으로 이동한다.

### 핵심 요소

- Sound
- Motion
- Brightness
- Sync

### 주요 행동

- Toggle

### 상태

- Default
- Loading
- Empty
- Error
- Offline
- Small Screen
- Large Text
- Reduce Motion
- Sound Off

### 반응형

- 320×568에서 핵심 CTA가 보인다.
- 390×844에서 장면과 UI가 겹치지 않는다.
- 태블릿에서 과도하게 빈 UI가 되지 않는다.
- 데스크톱에서 모바일 패널을 단순 축소하지 않는다.
- Landscape에서 선수와 수평선을 유지한다.

### 접근성

- Touch Target 44px 이상
- Screen Reader Label
- Focus Order 명확
- Dynamic Type
- 색상 외 상태 표현
- Motion을 줄여도 기능 손실 없음

### 오류 복구

- Scene 실패 시 Static Fallback
- Network 실패 시 Local
- 중복 입력 방지
- 재시도 또는 이전 화면

### 금지

- 개발자 옵션

### 완료 기준

1. 사용자가 설명 없이 다음 행동을 찾는다.
2. 핵심 정보와 장면이 충돌하지 않는다.
3. 상태 전이가 Timer와 일치한다.
4. 오류가 집중 기록을 유실시키지 않는다.
5. 실제 캡처와 동영상으로 검증한다.
