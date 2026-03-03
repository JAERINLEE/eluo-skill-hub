# Quickstart: 007-signup-page

**Date**: 2026-03-04

## 변경 파일 요약

### 이전 이터레이션 (완료)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/auth/domain/types.ts` | 수정 | `SignupCredentials`에 `name` 필드 추가 |
| `src/auth/application/signup-use-case.ts` | 수정 | `name`을 repository로 전달 |
| `src/auth/infrastructure/supabase-auth-repository.ts` | 수정 | `signUp()` 호출 시 `options.data.display_name` 전달, 중복 이메일 감지 로직 |
| `src/app/signup/actions.ts` | 수정 | `formData`에서 `name` 추출·검증 후 use case에 전달 |
| `src/app/signup/page.tsx` | 리뉴얼 | 헤더 + BackgroundBeamsWithCollision + SignupForm 조합 |
| `src/app/signin/page.tsx` | 수정 | 헤더 로고+타이틀을 `<Link href="/">`로 감싸기 |
| `src/features/auth/SignupForm.tsx` | 리뉴얼 | 글래스카드 UI, 이름·비밀번호 확인 필드 추가, 반응형 2열 레이아웃 |
| `src/features/auth/__tests__/SignupForm.test.tsx` | 수정 | 새 필드·UI에 맞게 테스트 업데이트 |

### 이번 이터레이션 (중복 이메일 분기 처리)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `src/auth/domain/types.ts` | 수정 | `SignupActionState.step`에 `"duplicate"` 추가 |
| `src/app/signup/actions.ts` | 수정 | 중복 이메일 에러 시 `step: "duplicate"` 반환 |
| `src/features/auth/SignupForm.tsx` | 수정 | 중복 이메일 별도 카드 뷰 추가, 인라인 에러 제거 |
| `src/features/auth/__tests__/SignupForm.test.tsx` | 수정 | 중복 이메일 카드 뷰 테스트 추가 |
| `src/proxy.ts` | 이동 | 프로젝트 루트 → `src/` 이동 (Next.js 16.x 컨벤션) |
| `src/app/dashboard/page.tsx` | 신규 | 리다이렉트 대상 플레이스홀더 |

## 구현 순서

1. **도메인 타입 확장**: `SignupActionState.step`에 `"duplicate"` 추가
2. **서버 액션 분기**: `actions.ts`에서 중복 이메일 에러 감지 → `step: "duplicate"` 반환
3. **UI 카드 뷰**: `SignupForm.tsx`에 중복 이메일 카드 뷰 추가 + 인라인 에러 제거
4. **테스트 업데이트**: 중복 이메일 카드 뷰 렌더링 및 네비게이션 테스트

## 핵심 참조

- **디자인 레퍼런스**: `./signup.html` (루트)
- **헤더·배경 참조**: `src/app/signin/page.tsx`
- **글래스카드 스타일**: `src/app/globals.css` → `.glass-card` 클래스
- **인증 타입**: `src/auth/domain/types.ts`
- **OTP 카드 패턴**: `src/features/auth/SignupForm.tsx` (line 140-221)

## 개발 환경 설정

```bash
git checkout 007-signup-page
npm install
npm run dev
```

**필수 환경변수** (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## 테스트 실행

```bash
# 단위/컴포넌트 테스트
npx jest --testPathPattern="auth"

# 타입 체크
npx tsc --noEmit

# E2E 테스트
npx playwright test src/__tests__/e2e/signup.spec.ts
```

## 수동 테스트 시나리오

1. **신규 이메일 가입**: 폼 제출 → OTP 인증 카드 → 인증 완료 → `/dashboard`
2. **인증 완료 중복 이메일**: 폼 제출 → "이미 가입된 이메일" 카드 → "로그인으로 이동" 클릭 → `/signin`
3. **중복 이메일 카드에서 복귀**: "다른 이메일로 가입하기" 클릭 → 빈 폼으로 초기화
4. **미인증 중복 이메일**: 폼 제출 → OTP 인증 카드 (기존 동작 유지)
5. **인증 리다이렉트**: 로그인 후 `/signup` 접근 → `/dashboard` 리다이렉트
6. **인증 리다이렉트**: 로그인 후 `/signin` 접근 → `/dashboard` 리다이렉트
