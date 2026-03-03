# Tasks: 회원가입 페이지

**Input**: Design documents from `/specs/005-signup-page/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/auth-signup.md

**Tests**: Constitution III(Test Coverage) 준수를 위해 단위 테스트 및 E2E 테스트를 포함한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Domain + Infrastructure 확장)

**Purpose**: 모든 user story가 의존하는 auth 도메인 타입과 인프라 레이어를 확장한다

- [x] T001 auth 도메인 타입 확장 — SignupCredentials, SignupResult, VerifyOtpCredentials, VerifyOtpResult, ResendOtpResult, SignupActionState, VerifyOtpActionState, ResendOtpActionState 타입과 AuthRepository 인터페이스에 signUp/verifyOtp/resendOtp 메서드를 추가한다 `src/auth/domain/types.ts`
- [x] T002 SupabaseAuthRepository에 signUp, verifyOtp, resendOtp 메서드를 구현한다 — signUp은 supabase.auth.signUp() 호출, verifyOtp는 supabase.auth.verifyOtp({ email, token, type: 'signup' }) 호출, resendOtp는 supabase.auth.resend({ type: 'signup', email }) 호출 `src/auth/infrastructure/supabase-auth-repository.ts`

**Checkpoint**: Domain 타입과 Infrastructure 레이어 준비 완료 — user story 구현 시작 가능

---

## Phase 2: User Story 1 - 이메일/비밀번호로 회원가입 (Priority: P1) 🎯 MVP

**Goal**: eluocnc.com 이메일과 8자 이상 비밀번호로 회원가입을 요청하면 OTP 인증코드가 이메일로 발송된다

**Independent Test**: `/signup` 페이지에서 유효한 이메일과 비밀번호를 입력하고 회원가입 버튼을 누르면 인증코드 입력 화면으로 전환되는지 확인

### Implementation for User Story 1

- [x] T003 [P] [US1] SignupUseCase를 생성한다 — AuthRepository.signUp()을 호출하고 결과를 반환하는 유스케이스 `src/auth/application/signup-use-case.ts`
- [x] T004 [P] [US1] SignupUseCase 단위 테스트를 작성한다 — mock AuthRepository로 성공/실패 케이스 검증 `src/auth/application/__tests__/signup-use-case.test.ts`
- [x] T005 [US1] signup Server Action을 생성한다 — FormData에서 email/password 추출, 서버 사이드 검증(이메일 도메인 eluocnc.com 확인, 비밀번호 8자 이상), SignupUseCase 호출, 성공 시 step: "verify"와 email 반환, 실패 시 error 반환 `src/app/signup/actions.ts`
- [x] T006 [US1] SignupForm 컴포넌트를 생성한다 — step="form" 상태에서 이메일 입력(placeholder: "name@eluocnc.com"), 비밀번호 입력, 회원가입 버튼, 클라이언트 사이드 검증(이메일 도메인, 비밀번호 길이, 필수 입력), 로그인 페이지 링크(/signin)를 포함한다. useActionState로 signup action 연결. 기존 SigninForm 패턴을 참고한다 `src/features/auth/SignupForm.tsx`
- [x] T007 [US1] 회원가입 페이지를 생성한다 — Server Component로 SignupForm을 렌더링. 기존 signin/page.tsx 레이아웃 패턴을 동일하게 사용 `src/app/signup/page.tsx`
- [x] T008 [US1] middleware에서 인증된 사용자가 /signup 접속 시 /dashboard로 리다이렉트하도록 추가한다 — 기존 /signin 리다이렉트 로직과 동일 패턴 `middleware.ts`

**Checkpoint**: 회원가입 폼 입력 → 서버 검증 → OTP 발송 → 인증코드 입력 화면 전환까지 동작 확인

---

## Phase 3: User Story 2 - 인증코드 확인으로 회원가입 완료 (Priority: P1)

**Goal**: 이메일로 받은 8자리 인증코드를 입력하면 회원가입이 완료되고 로그인 페이지로 이동한다

**Independent Test**: 올바른 OTP 코드를 입력하면 회원가입이 완료되고 /signin으로 리다이렉트되는지 확인. 잘못된 코드 입력 시 오류 메시지 표시 확인

### Implementation for User Story 2

- [x] T009 [P] [US2] VerifyOtpUseCase를 생성한다 — AuthRepository.verifyOtp()을 호출하고 결과를 반환하는 유스케이스 `src/auth/application/verify-otp-use-case.ts`
- [x] T010 [P] [US2] VerifyOtpUseCase 단위 테스트를 작성한다 — mock AuthRepository로 성공/실패/만료 케이스 검증 `src/auth/application/__tests__/verify-otp-use-case.test.ts`
- [x] T011 [US2] verifyOtp Server Action을 추가한다 — FormData에서 email/token 추출, VerifyOtpUseCase 호출, 성공 시 /signin으로 redirect, 실패 시 error 반환(잘못된 코드: "인증코드가 올바르지 않습니다", 만료: "인증코드가 만료되었습니다. 다시 시도해주세요") `src/app/signup/actions.ts`
- [x] T012 [US2] SignupForm에 step="verify" UI를 추가한다 — 8자리 OTP 입력 필드, 확인 버튼, email을 hidden field 또는 state로 유지, useActionState로 verifyOtp action 연결, 오류 메시지 표시 `src/features/auth/SignupForm.tsx`

**Checkpoint**: 전체 회원가입 플로우(폼 입력 → OTP 발송 → OTP 확인 → /signin 이동) 동작 확인

---

## Phase 4: User Story 3 - 인증코드 재발송 (Priority: P2)

**Goal**: 인증코드를 받지 못하거나 만료된 경우 재발송을 요청할 수 있으며, 60초 간격 제한이 적용된다

**Independent Test**: 인증코드 입력 화면에서 재발송 버튼 클릭 시 새 OTP 발송 확인. 60초 내 재클릭 시 버튼 비활성화 및 남은 시간 표시 확인

### Implementation for User Story 3

- [x] T013 [P] [US3] ResendOtpUseCase를 생성한다 — AuthRepository.resendOtp()을 호출하고 결과를 반환하는 유스케이스 `src/auth/application/resend-otp-use-case.ts`
- [x] T014 [US3] resendOtp Server Action을 추가한다 — FormData에서 email 추출, ResendOtpUseCase 호출, 성공 시 success: true, 실패 시 error 반환 `src/app/signup/actions.ts`
- [x] T015 [US3] SignupForm의 verify step에 재발송 버튼과 60초 쿨다운 타이머를 추가한다 — "인증코드 재발송" 버튼, 클릭 시 resendOtp action 호출, 성공 시 "인증코드가 재발송되었습니다" 메시지 표시, 60초 카운트다운 동안 버튼 비활성화 및 남은 시간 표시 `src/features/auth/SignupForm.tsx`

**Checkpoint**: OTP 재발송 기능 동작 확인, 60초 쿨다운 타이머 동작 확인

---

## Phase 5: User Story 4 - 기존 회원 안내 (Priority: P3)

**Goal**: 이미 가입된 이메일로 회원가입 시도 시 "이미 가입된 이메일입니다" 안내와 로그인 링크를 제공한다

**Independent Test**: 이미 가입된 이메일로 회원가입 시도 시 중복 안내 메시지와 로그인 페이지 링크 표시 확인

### Implementation for User Story 4

- [x] T016 [US4] signup Server Action에 중복 이메일 감지 로직을 추가한다 — Supabase signUp 응답에서 이미 가입된 이메일인지 확인(identities 빈 배열 또는 에러 응답), 해당 시 "이미 가입된 이메일입니다" error 반환 `src/app/signup/actions.ts`
- [x] T017 [US4] SignupForm의 error 메시지 영역에 로그인 페이지 링크를 조건부 표시한다 — 중복 이메일 에러 시 "이미 가입된 이메일입니다" 메시지 아래에 "로그인 페이지로 이동" 링크(/signin) 추가 `src/features/auth/SignupForm.tsx`

**Checkpoint**: 중복 이메일 안내 및 로그인 링크 동작 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 테스트 보강, 타입 체크, 전체 플로우 검증

- [x] T018 [P] SignupForm 컴포넌트 테스트를 작성한다 — form step 렌더링, 클라이언트 검증(도메인/비밀번호 길이/필수 입력), verify step 렌더링, 재발송 버튼 쿨다운 UI, 로그인 링크 존재 확인 `src/features/auth/__tests__/SignupForm.test.tsx`
- [x] T019 [P] E2E 테스트를 작성한다 — 회원가입 페이지 접근, 유효성 검증 오류 표시, eluocnc.com 외 도메인 차단, 정상 회원가입 플로우(가능한 범위), 로그인 링크 네비게이션 `src/__tests__/e2e/signup.spec.ts`
- [x] T020 타입 체크 및 최종 검증 — `npx tsc --noEmit` 통과 확인, `any` 타입 사용 여부 확인, 전체 회원가입 플로우 수동 검증

**Checkpoint**: 모든 테스트 통과, 타입 체크 통과, 전체 플로우 동작 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — 즉시 시작 가능
- **Phase 2 (US1)**: Phase 1 완료 후 시작
- **Phase 3 (US2)**: Phase 2 완료 후 시작 (SignupForm의 step 전환에 의존)
- **Phase 4 (US3)**: Phase 3 완료 후 시작 (verify step UI에 의존)
- **Phase 5 (US4)**: Phase 2 완료 후 시작 가능 (signup action에만 의존)
- **Phase 6 (Polish)**: Phase 5 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: Phase 1 완료 후 시작 — 독립적
- **US2 (P1)**: US1 완료 후 시작 — SignupForm의 step 전환 메커니즘에 의존
- **US3 (P2)**: US2 완료 후 시작 — verify step UI에 재발송 버튼 추가
- **US4 (P3)**: US1 완료 후 시작 가능 — signup action의 에러 처리 확장

### Within Each User Story

- UseCase → Server Action → UI Component 순서로 구현
- 테스트는 UseCase와 병렬 작성 가능 ([P] 마커)

### Parallel Opportunities

```
Phase 1:
  T001 ──→ T002 (순차: 타입 정의 후 인프라 구현)

Phase 2 (US1):
  T003 ─┬─ T004 (병렬: UseCase + 테스트)
        └→ T005 → T006 → T007 (순차)
                         T008 (T007과 병렬 가능)

Phase 3 (US2):
  T009 ─┬─ T010 (병렬: UseCase + 테스트)
        └→ T011 → T012 (순차)

Phase 4 (US3):
  T013 → T014 → T015 (순차)

Phase 5 (US4):
  T016 → T017 (순차)

Phase 6:
  T018 ─┬─ T019 (병렬)
        └→ T020 (T018, T019 완료 후)
```

---

## Parallel Example: User Story 1

```bash
# UseCase와 테스트를 병렬로 작성:
Task: "T003 SignupUseCase 생성 — src/auth/application/signup-use-case.ts"
Task: "T004 SignupUseCase 단위 테스트 — src/auth/application/__tests__/signup-use-case.test.ts"

# 완료 후 순차 진행:
Task: "T005 signup Server Action — src/app/signup/actions.ts"
Task: "T006 SignupForm 컴포넌트 — src/features/auth/SignupForm.tsx"
Task: "T007 회원가입 페이지 — src/app/signup/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Phase 1 완료: Domain 타입 + Infrastructure 확장
2. Phase 2 완료: 회원가입 폼 + OTP 발송 (US1)
3. Phase 3 완료: OTP 인증 + 회원가입 완료 (US2)
4. **STOP and VALIDATE**: 전체 회원가입 플로우 테스트
5. 배포 가능 상태

### Incremental Delivery

1. Phase 1 + Phase 2 → 회원가입 폼 + OTP 발송 동작 확인
2. Phase 3 추가 → 전체 회원가입 플로우 완성 (MVP!)
3. Phase 4 추가 → OTP 재발송 기능 추가
4. Phase 5 추가 → 중복 이메일 안내 추가
5. Phase 6 → 테스트 보강 + 최종 검증

---

## Notes

- 기존 SigninForm 패턴(useActionState, 클라이언트 검증, Shadcn UI)을 그대로 따른다
- DB 스키마 변경 없음 — 기존 handle_new_user 트리거가 profiles 자동 생성
- Supabase Auth의 이메일 확인(OTP) 설정은 이미 8자리로 구성 완료 (커밋 d693ad5)
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
