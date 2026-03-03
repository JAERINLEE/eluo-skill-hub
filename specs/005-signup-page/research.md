# Research: 005-signup-page

**Created**: 2026-03-03
**Status**: Complete

## R-001: Supabase 회원가입 + 이메일 OTP 인증 흐름

**Decision**: Supabase Auth의 `signUp()` + `verifyOtp({ type: 'signup' })` 조합을 사용한다.

**Rationale**:
- Supabase Auth는 이메일/비밀번호 회원가입 시 OTP 코드 발송을 기본 지원한다
- `signUp({ email, password })` 호출 시 사용자가 `auth.users`에 생성되고, 이메일 확인이 활성화된 경우 OTP 코드가 이메일로 발송된다
- `verifyOtp({ email, token, type: 'signup' })` 호출 시 이메일 인증이 완료되고 `email_confirmed_at`이 설정된다
- 이메일 미인증 사용자는 `signInWithPassword()`로 로그인할 수 없으므로 실질적으로 인증 완료 전까지 서비스 이용이 불가하다
- 프로젝트에서 이미 8자리 OTP 코드를 사용하도록 Supabase 대시보드에서 설정 완료 (커밋 d693ad5)

**Alternatives considered**:
- 커스텀 OTP 생성 + 별도 테이블 관리: Supabase Auth 내장 기능과 중복되며, 보안 관리 부담 증가
- Magic Link 방식: 스펙에서 8자리 인증코드 입력을 명시적으로 요구하므로 부적합
- 이메일 확인 없는 즉시 가입: 스펙 요구사항(FR-005, FR-007)에 위배

## R-002: profiles 테이블 생성 시점

**Decision**: 기존 `handle_new_user` 트리거를 유지한다. `signUp()` 호출 시 `auth.users` INSERT → 트리거로 `profiles` 자동 생성.

**Rationale**:
- `handle_new_user` 트리거가 이미 존재하며, `auth.users` INSERT 시 `profiles`에 id, email, role_id(user), created_at을 삽입한다
- 이메일 미인증 사용자는 로그인할 수 없으므로, profile이 존재하더라도 서비스 접근이 차단된다
- 스펙의 "인증코드를 입력해야 profiles에 회원정보가 추가된다"는 의도는 "인증 완료 전까지 서비스 이용 불가"로 충족된다
- 트리거를 `UPDATE`로 변경하면 기존 signin 기능과의 호환성 문제가 발생할 수 있다

**Alternatives considered**:
- 트리거를 email_confirmed_at UPDATE 시점으로 변경: 기존 사용자 3명의 데이터 마이그레이션 필요, 복잡도 증가
- 트리거 제거 후 verifyOtp 성공 시 수동 INSERT: 인프라 레이어에서 직접 INSERT 필요, 트랜잭션 관리 복잡

## R-003: 이메일 도메인 검증 전략

**Decision**: 클라이언트 사이드(폼 검증) + 서버 사이드(Server Action) 이중 검증을 적용한다.

**Rationale**:
- 클라이언트 검증: 즉각적인 사용자 피드백 제공 (UX)
- 서버 검증: 클라이언트 우회 방지 (보안, Constitution V 준수)
- 이메일에서 `@` 뒤의 도메인이 `eluocnc.com`인지 대소문자 무시 비교
- Supabase Auth 자체에는 도메인 제한 기능이 없으므로, signUp 호출 전에 서버에서 반드시 검증

**Alternatives considered**:
- 클라이언트 검증만: Security-First 원칙(Constitution V)에 위배
- Supabase Edge Function으로 검증: 추가 인프라 구성 필요, Server Action으로 충분

## R-004: 인증코드 재발송 메커니즘

**Decision**: `supabase.auth.resend({ type: 'signup', email })` 메서드를 사용한다.

**Rationale**:
- Supabase Auth는 OTP 재발송을 위한 `resend` 메서드를 기본 제공한다
- 60초 간격 제한은 클라이언트 사이드에서 타이머로 제어하고, Supabase의 자체 rate limit도 적용된다
- 재발송 시 이전 OTP는 자동으로 무효화된다

**Alternatives considered**:
- 새로운 signUp 호출로 재발송: 이미 가입된 사용자에게 오류가 발생할 수 있음
- 커스텀 이메일 발송: Supabase Auth 내장 기능으로 충분

## R-005: 기존 auth 도메인과의 통합

**Decision**: 기존 `src/auth/` 도메인 모듈에 signup 관련 타입, 유스케이스, 인프라를 추가한다.

**Rationale**:
- Constitution IV(Feature Module Isolation)에 따라 auth 도메인은 이미 `src/auth/`에 존재
- 회원가입은 인증(auth) 도메인의 일부이므로 동일 모듈에 추가하는 것이 적절
- 기존 패턴(domain/types → application/use-case → infrastructure/repository)을 동일하게 따름

**Alternatives considered**:
- 별도 `src/signup/` 도메인 생성: auth와 강하게 결합된 기능이므로 분리 불필요, 과도한 모듈화

## R-006: 중복 가입 처리

**Decision**: Supabase Auth의 `signUp()` 응답에서 중복 이메일을 감지하고 사용자에게 안내한다.

**Rationale**:
- Supabase Auth에서 이미 가입된 이메일로 signUp 시, 설정에 따라 오류를 반환하거나 빈 user 객체를 반환한다
- 보안상 "이메일이 이미 존재합니다"를 명시적으로 노출하면 이메일 열거 공격 취약점이 될 수 있지만, 이 프로젝트는 사내 서비스(eluocnc.com 도메인 한정)이므로 명시적 안내가 사용자 경험에 유리
- 안내 메시지에 로그인 페이지 링크를 포함

**Alternatives considered**:
- 일반적인 오류 메시지만 표시: 사용자 혼란 유발, 사내 서비스에서는 보안 리스크가 낮음
