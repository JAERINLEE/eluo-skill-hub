# Research: 007-signup-page

**Date**: 2026-03-04

## R-001: 이름(display_name) 필드 Supabase 전달 방식

**Decision**: Supabase `auth.signUp()`의 `options.data` 파라미터에 `display_name`을 user_metadata로 전달한다.

**Rationale**: Supabase Auth는 `signUp()` 호출 시 `options.data` 객체를 통해 사용자 메타데이터를 `auth.users.raw_user_meta_data`에 저장할 수 있다. 별도 profiles 테이블 INSERT 없이 인증 시점에 이름을 바로 저장할 수 있어 트랜잭션 관리가 단순하다. 기존 profiles 테이블 트리거가 있다면 `raw_user_meta_data.display_name`을 profiles.name으로 동기화할 수 있다.

**Alternatives considered**:
- profiles 테이블에 별도 INSERT → 인증 완료 전에 INSERT 시 orphan 레코드 발생 가능. 복잡도 증가.
- 회원가입 후 별도 프로필 설정 단계 → 사용자 경험 저하. signup.html 디자인에 이름 필드가 이미 포함되어 있으므로 한 번에 수집하는 것이 자연스럽다.

## R-002: 비밀번호 확인 필드 처리 위치

**Decision**: 비밀번호 확인 검증은 클라이언트(SignupForm 컴포넌트) 전용으로 처리한다. 서버 액션에는 `password` 하나만 전송한다.

**Rationale**: 비밀번호 확인은 사용자 입력 실수 방지 목적이며, 서버에 중복 전송할 필요가 없다. 클라이언트에서 `password !== confirmPassword`이면 폼 제출 자체를 차단한다.

**Alternatives considered**:
- 서버에서도 두 필드를 비교 검증 → 불필요한 네트워크 데이터 증가. 보안적 이점 없음.

## R-003: 헤더 재사용 전략

**Decision**: signin/page.tsx의 헤더 JSX를 signup/page.tsx에 복제 적용한다. 헤더의 로고+타이틀을 `<Link href="/">`로 감싸 홈 이동 기능을 추가한다.

**Rationale**: 현재 헤더를 사용하는 페이지가 signin과 signup 두 곳뿐이므로, 별도 공유 컴포넌트 추출은 시기상조다. 추후 3곳 이상에서 사용 시 리팩토링한다. signin 페이지의 헤더에도 동일하게 Link 처리를 적용하여 일관성을 유지한다.

**Alternatives considered**:
- 공유 `AuthHeader` 컴포넌트 추출 → 2곳에서만 사용하므로 과도한 추상화. YAGNI 원칙 위반.
- layout.tsx에 헤더 배치 → auth 페이지 전용 layout이 없고, 다른 페이지와 헤더 스타일이 다를 수 있으므로 부적합.

## R-004: 글래스카드 스타일 적용 방식

**Decision**: 기존 `glass-card` CSS 클래스(`globals.css`에 정의됨)를 재사용하고, signup.html의 추가 스타일(max-w-[480px], rounded-3xl, shadow-2xl, p-8 md:p-10)을 Tailwind 유틸리티 클래스로 적용한다.

**Rationale**: SigninForm에서도 `glass-card` 클래스를 이미 사용 중이므로 동일한 패턴을 따른다. signup.html의 카드 크기(480px)가 signin(440px)보다 약간 크지만, 레퍼런스 디자인을 존중하여 480px을 적용한다.

**Alternatives considered**:
- 새 CSS 클래스 생성 → 기존 `glass-card`와 중복. Tailwind 유틸리티로 차이점만 오버라이드하는 것이 효율적.

## R-005: signup.html의 헤더 버튼 동작

**Decision**: 회원가입 페이지의 헤더 버튼 텍스트를 "로그인"으로 설정하고 `/signin`으로 이동하도록 구현한다. (signin 페이지의 헤더 버튼은 "로그인"이지만 회원가입 페이지에서는 컨텍스트에 맞게 로그인 페이지로의 이동 역할을 한다.)

**Rationale**: signup.html에는 헤더가 명시되어 있지 않고 "Header 컴포넌트는 로그인페이지의 header 와 동일하게 구현"이라는 주석만 있다. 사용자가 회원가입 페이지에 있을 때 헤더 버튼은 "로그인"이 자연스럽다.

**Alternatives considered**:
- 버튼 제거 → 페이지 간 네비게이션 편의성 저하.
- "회원가입" 텍스트 유지 → 이미 회원가입 페이지에 있으므로 의미 없음.

## R-006: Supabase signUp 중복 이메일 응답 패턴

**Decision**: 기존 `supabase-auth-repository.ts`의 `identities` 배열 기반 중복 감지 로직을 유지한다.

**Rationale**: Supabase Auth의 `signUp()`은 이미 존재하는 이메일에 대해 보안상 에러를 직접 반환하지 않고, `data.user.identities`가 빈 배열인 응답을 반환한다. 현재 코드(line 44-52)는 이 패턴을 정확히 구현하고 있다:
- `identities.length === 0` + `email_confirmed_at` 없음 → 미인증 계정 (OTP 재발송, `success: "pending"`)
- `identities.length === 0` + `email_confirmed_at` 있음 → 인증 완료 계정 (`success: false, error: "이미 가입된 이메일입니다"`)

**Alternatives considered**:
- Supabase Auth API 에러 코드 기반 감지: Supabase가 의도적으로 에러를 숨기므로 불가
- 별도 이메일 조회 API 호출: 불필요한 네트워크 요청 + 이메일 열거 공격 취약점

## R-007: SignupActionState step 확장 전략

**Decision**: `SignupActionState.step`에 `"duplicate"` 리터럴을 추가하여 3-state 분기로 처리한다.

**Rationale**: 기존 `step: "form" | "verify"` 패턴은 discriminated union으로 컴포넌트 분기에 사용 중이다. 동일 패턴을 확장하면:
- 타입 안전성 유지 (exhaustive check 가능)
- 컴포넌트 로직 일관성 유지 (if/switch 분기)
- 서버 액션에서 상태 전환이 명시적

**Alternatives considered**:
- `error` 문자열 비교로 분기: 타입 안전하지 않고, 에러 메시지 변경 시 깨짐
- 별도 `isDuplicate: boolean` 필드 추가: 불필요한 상태 조합 증가

## R-008: 중복 이메일 카드 뷰 UI 패턴

**Decision**: OTP 카드와 동일한 글래스카드 패턴으로 별도 카드 뷰를 구현한다.

**Rationale**: 사용자 요구사항에 부합하며, OTP 카드(SignupForm line 140-221)와 동일한 구조를 재사용하면:
- 시각적 일관성 유지 (글래스카드, max-width 480px, 라운드 코너)
- 코드 패턴 일관성 (if 분기 → early return)
- 사용자 경험 일관성 (폼 → 결과 카드 전환)

카드 구성:
- 아이콘: 👤 (사용자 존재를 나타내는 시각적 신호)
- 제목: "이미 가입된 이메일입니다"
- 안내 메시지: "입력하신 이메일은 이미 가입된 계정입니다. 로그인 페이지에서 로그인해 주세요."
- CTA 버튼: "로그인으로 이동" → `/signin` (brand-navy 스타일)
- 보조 링크: "다른 이메일로 가입하기" → 폼 초기화

**Alternatives considered**:
- 폼 내 인라인 오류 + 버튼: 현재 구현과 유사하나 사용자가 별도 뷰를 요구
- 모달/다이얼로그: 불필요한 레이어 추가, 기존 패턴과 불일치

## R-009: "다른 이메일로 가입하기" 폼 초기화 전략

**Decision**: `SignupForm` 내부에서 `key` prop 기반 리마운트로 폼을 초기화한다.

**Rationale**: `useActionState`의 서버 액션 상태를 외부에서 직접 리셋할 수 없다. React의 `key` prop을 변경하면 컴포넌트가 리마운트되어 모든 내부 상태(`useActionState`, `useState`)가 초기값으로 복원된다. 구현 방법: 부모 또는 래퍼에서 `resetKey` 카운터를 관리하고, "다른 이메일로 가입하기" 클릭 시 카운터를 증가시킨다.

**Alternatives considered**:
- `window.location.href = '/signup'`: 풀 페이지 리로드, UX 저하
- 개별 state 수동 리셋: `useActionState` 내부 상태를 외부에서 리셋 불가

## R-010: proxy.ts 위치 및 Next.js 16.x 미들웨어 컨벤션

**Decision**: `proxy.ts`를 `src/proxy.ts`에 배치한다 (프로젝트 루트가 아닌 `src/` 내부).

**Rationale**: Next.js 16.x 공식 문서에 따르면 `proxy.ts`는 `pages` 또는 `app` 디렉토리와 **동일 레벨**에 위치해야 한다. 이 프로젝트는 `src/app/` 구조를 사용하므로 `src/proxy.ts`가 올바른 위치이다. 프로젝트 루트에 배치하면 Next.js가 파일을 인식하지 못한다.

**Alternatives considered**:
- 프로젝트 루트 `proxy.ts`: `src/` 구조에서 동작하지 않음 (실제 테스트 확인)
- `middleware.ts` 사용: Next.js 16에서 deprecated, Edge 런타임만 지원
