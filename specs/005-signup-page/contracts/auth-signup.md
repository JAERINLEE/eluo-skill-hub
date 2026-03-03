# Contract: Auth Signup

**Created**: 2026-03-03

## Domain Types (src/auth/domain/types.ts 확장)

```typescript
// 회원가입 자격 증명
interface SignupCredentials {
  readonly email: string;
  readonly password: string;
}

// 회원가입 결과
type SignupResult =
  | { success: true }
  | { success: false; error: string };

// OTP 인증 자격 증명
interface VerifyOtpCredentials {
  readonly email: string;
  readonly token: string;
}

// OTP 인증 결과
type VerifyOtpResult =
  | { success: true }
  | { success: false; error: string };

// OTP 재발송 결과
type ResendOtpResult =
  | { success: true }
  | { success: false; error: string };

// AuthRepository 인터페이스 확장
interface AuthRepository {
  signIn(credentials: SigninCredentials): Promise<SigninResult>;
  signUp(credentials: SignupCredentials): Promise<SignupResult>;
  verifyOtp(credentials: VerifyOtpCredentials): Promise<VerifyOtpResult>;
  resendOtp(email: string): Promise<ResendOtpResult>;
}
```

## Server Actions (src/app/signup/actions.ts)

### signup action

```typescript
// Input: FormData { email: string, password: string }
// Output: SignupActionState
interface SignupActionState {
  error: string;
  step: "form" | "verify";
  email: string;
}
```

**Validation (서버 사이드)**:
1. email: 문자열 타입 확인, 비어있지 않은지 확인
2. email: `@eluocnc.com` 도메인 확인 (대소문자 무시)
3. password: 문자열 타입 확인, 8자 이상

**Success flow**: Supabase `signUp()` 호출 → `step: "verify"`, `email` 반환
**Error flow**: 유효성 검증 실패 또는 Supabase 오류 → `error` 메시지 반환

### verifyOtp action

```typescript
// Input: FormData { email: string, token: string }
// Output: VerifyOtpActionState
interface VerifyOtpActionState {
  error: string;
}
```

**Success flow**: Supabase `verifyOtp()` 호출 → `/signin`으로 redirect
**Error flow**: 잘못된 코드 또는 만료 → `error` 메시지 반환

### resendOtp action

```typescript
// Input: FormData { email: string }
// Output: ResendOtpActionState
interface ResendOtpActionState {
  error: string;
  success: boolean;
}
```

**Success flow**: Supabase `resend()` 호출 → `success: true`
**Error flow**: rate limit 또는 Supabase 오류 → `error` 메시지 반환

## UI Components (src/features/auth/)

### SignupForm

- **Props**: 없음
- **State**: `step` ("form" | "verify"), `email` (string)
- **Step "form"**: 이메일 입력, 비밀번호 입력, 회원가입 버튼, 로그인 링크
- **Step "verify"**: OTP 입력 (8자리), 확인 버튼, 재발송 버튼 (60초 쿨다운)

## Validation Rules

| Field | Rule | Client Error Message | Server Error Message |
|-------|------|---------------------|---------------------|
| email | required | "이메일을 입력해 주세요" | "이메일을 입력해 주세요" |
| email | @eluocnc.com 도메인 | "eluocnc.com 이메일만 사용할 수 있습니다" | "eluocnc.com 이메일만 사용할 수 있습니다" |
| email | 이미 가입됨 | - | "이미 가입된 이메일입니다" |
| password | required | "비밀번호를 입력해 주세요" | "비밀번호를 입력해 주세요" |
| password | min 8 chars | "비밀번호는 최소 8자 이상이어야 합니다" | "비밀번호는 최소 8자 이상이어야 합니다" |
| token | 8자리 숫자 | "인증코드 8자리를 입력해 주세요" | "인증코드가 올바르지 않습니다" |
| token | 만료 | - | "인증코드가 만료되었습니다. 다시 시도해주세요" |
