# Quickstart: 005-signup-page

**Created**: 2026-03-03

## Prerequisites

- Node.js, npm 설치
- Supabase 프로젝트 설정 완료 (MCP 연결)
- `.env.local`에 Supabase URL 및 publishable key 설정
- Supabase Auth에서 이메일 확인(OTP) 활성화 및 8자리 코드 설정 완료

## 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000/signup 에서 회원가입 페이지 확인

## 테스트 실행

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 타입 체크
npx tsc --noEmit
```

## 구현 범위

### 새로 생성하는 파일

```
src/app/signup/
├── page.tsx              # 회원가입 페이지 (Server Component)
└── actions.ts            # Server Actions (signup, verifyOtp, resendOtp)

src/auth/application/
└── signup-use-case.ts    # 회원가입 유스케이스
└── verify-otp-use-case.ts # OTP 인증 유스케이스
└── resend-otp-use-case.ts # OTP 재발송 유스케이스

src/features/auth/
└── SignupForm.tsx         # 회원가입 폼 컴포넌트 (Client Component)

src/auth/domain/
└── (types.ts 확장)        # SignupCredentials, VerifyOtpCredentials 등 추가

src/auth/infrastructure/
└── (supabase-auth-repository.ts 확장)  # signUp, verifyOtp, resendOtp 메서드 추가

src/__tests__/e2e/
└── signup.spec.ts         # E2E 테스트

src/auth/application/__tests__/
└── signup-use-case.test.ts
└── verify-otp-use-case.test.ts

src/features/auth/__tests__/
└── SignupForm.test.tsx
```

### 수정하는 파일

```
src/auth/domain/types.ts                    # 타입 확장
src/auth/infrastructure/supabase-auth-repository.ts  # 메서드 추가
middleware.ts                                # /signup 경로 처리 추가
```

### DB 변경

없음 — 기존 스키마와 트리거로 충분

## 주요 흐름

1. `/signup` 접속 → SignupForm 렌더링 (step: "form")
2. 이메일/비밀번호 입력 → 클라이언트 검증 → Server Action `signup()` 호출
3. 서버 검증 → `signUp()` → OTP 발송 → step: "verify"로 전환
4. OTP 입력 → Server Action `verifyOtp()` 호출
5. 인증 성공 → `/signin`으로 redirect
