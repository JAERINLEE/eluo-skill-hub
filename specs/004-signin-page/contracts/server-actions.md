# Interface Contract: Server Actions

**Feature Branch**: `004-signin-page`
**Date**: 2026-03-03

## signin (Server Action)

로그인 폼에서 호출되는 서버 액션. 이메일/패스워드 인증을 처리하고 결과를 반환한다.

### Input

`useActionState`와 함께 사용되므로 두 개의 파라미터를 받는다:

| Parameter | Type | Description |
|-----------|------|-------------|
| prevState | SigninActionState | 이전 액션 상태 (useActionState에서 자동 전달) |
| formData | FormData | 폼 데이터 (email, password 필드 포함) |

**FormData Fields**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | YES | 이메일 형식 (클라이언트 측 검증) |
| password | string | YES | 비어있지 않을 것 (클라이언트 측 검증) |

### Output

**성공 시**: `/dashboard`로 리다이렉트 (함수가 반환하지 않고 redirect 호출)

**실패 시**: `SigninActionState` 객체 반환

```typescript
interface SigninActionState {
  error: string;  // 빈 문자열이면 에러 없음
}
```

### Error Responses

| Scenario | error 값 |
|----------|---------|
| 에러 없음 (초기 상태) | `""` |
| 잘못된 이메일 또는 패스워드 | `"이메일 또는 비밀번호가 올바르지 않습니다"` |

**보안 참고**: 이메일 존재 여부와 관계없이 동일한 오류 메시지를 사용하여 사용자 열거 공격을 방지한다.

---

## Domain Types

### SigninCredentials (Value Object)

```typescript
interface SigninCredentials {
  readonly email: string;
  readonly password: string;
}
```

### SigninResult (Result Type)

```typescript
type SigninResult =
  | { success: true }
  | { success: false; error: string };
```

### AuthRepository (Port Interface)

```typescript
interface AuthRepository {
  signIn(credentials: SigninCredentials): Promise<SigninResult>;
}
```

---

## Component Props Contract

### SigninForm (Client Component)

프로퍼티 없음 — 자체적으로 `useActionState`를 통해 Server Action을 호출하고 상태를 관리한다.

**내부 상태**:

| State | Type | Description |
|-------|------|-------------|
| state | SigninActionState | Server Action 반환값 (에러 메시지) |
| isPending | boolean | 폼 제출 진행 중 여부 (로딩 상태) |

**렌더링 요소**:

| Element | Component | Description |
|---------|-----------|-------------|
| 이메일 필드 | Input (Shadcn) | type="email", required, name="email" |
| 패스워드 필드 | Input (Shadcn) | type="password", required, name="password" |
| 로그인 버튼 | Button (Shadcn) | type="submit", disabled={isPending} |
| 에러 메시지 | 텍스트 | state.error가 비어있지 않을 때 표시 |
