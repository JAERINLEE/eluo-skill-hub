# Research & Design Decisions

---
**Purpose**: 루트 페이지 인증 미들웨어 기능의 디스커버리 결과와 설계 결정 근거를 기록한다.

**Usage**:
- 디스커버리 단계에서 조사한 내용과 결과를 기록한다.
- `design.md`에 담기에 지나치게 상세한 설계 결정 트레이드오프를 문서화한다.
- 향후 감사 또는 재사용을 위한 참조 자료와 근거를 제공한다.
---

## Summary
- **Feature**: `root-page-auth-middleware`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 기존 `middleware.ts`가 이미 `@supabase/ssr`의 `createServerClient` + `getUser()`를 사용하지만, 비인증 사용자의 보호 경로 접근 차단 로직이 부재하다.
  - 기존 `AppHeader` 컴포넌트의 사용자 프로필 아이콘이 비대화형 `<div>` 요소로 구현되어 있어 클릭 불가 상태이다.
  - `logoutAction` Server Action이 `src/app/actions/auth.ts`에 이미 구현되어 있어 재사용 가능하다.
  - Radix UI 기반 `Popover` 컴포넌트가 `src/shared/ui/components/popover.tsx`에 이미 존재한다.

## Research Log

### Next.js 미들웨어에서 Supabase Auth 세션 검증 방식
- **Context**: 기존 미들웨어에 비인증 사용자 차단 로직을 추가해야 하므로, 공식 권장 패턴을 확인한다.
- **Sources Consulted**:
  - [Supabase 공식 문서 - Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
  - [Supabase 공식 문서 - Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
  - [supabase/ssr GitHub Discussion #21468](https://github.com/orgs/supabase/discussions/21468)
- **Findings**:
  - `supabase.auth.getUser()`는 매 호출 시 Supabase Auth 서버에 요청하여 토큰을 재검증하므로, 서버 코드(미들웨어 포함)에서 안전하게 사용할 수 있다.
  - `supabase.auth.getSession()`은 서버 코드에서 사용하면 안 된다. 토큰 재검증이 보장되지 않기 때문이다.
  - 미들웨어에서 쿠키를 갱신하는 기존 패턴(request.cookies.set + response.cookies.set)은 현재 코드베이스에 이미 올바르게 구현되어 있다.
- **Implications**: 기존 `middleware.ts`의 `getUser()` 호출 결과를 활용하여 `!user && !isAuthPage` 조건으로 `/login` 리다이렉트 로직만 추가하면 된다. 기존 코드 구조를 최소한으로 변경하여 확장한다.

### 서버-클라이언트 간 인증 정보 전달 패턴
- **Context**: 서버 컴포넌트에서 확인한 인증 정보를 클라이언트 컴포넌트(`DashboardShell`, `AppHeader`)에 안전하게 전달하는 패턴을 결정해야 한다.
- **Sources Consulted**:
  - Next.js 16 App Router 서버 컴포넌트 -> 클라이언트 컴포넌트 props 전달 패턴
  - 기존 코드베이스의 `page.tsx` -> `DashboardShell` 구조
- **Findings**:
  - `src/app/page.tsx`는 서버 컴포넌트이며, `DashboardShell`은 `"use client"` 지시문이 있는 클라이언트 컴포넌트이다.
  - 서버 컴포넌트에서 `createSupabaseServerClient().auth.getUser()`로 사용자 정보를 조회한 뒤, 필요한 최소 정보(이메일)만 props로 전달하는 것이 가장 간결하고 안전한 패턴이다.
  - Context Provider를 사용하는 방법도 있으나, 현재 인증 정보를 다수의 하위 컴포넌트에서 소비할 필요가 없으므로 props drilling이 적절하다.
- **Implications**: `page.tsx`를 `async` 서버 컴포넌트로 변환하여 `getUser()`를 호출하고, `userEmail` props를 `DashboardShell` -> `AppHeader`로 전달한다. 민감 정보(토큰, 비밀번호)는 클라이언트에 노출하지 않는다.

### 기존 logoutAction 재사용 가능성
- **Context**: 로그아웃 기능이 이미 구현되어 있는지, 재사용 가능한지 확인한다.
- **Sources Consulted**: `src/app/actions/auth.ts` 코드 분석
- **Findings**:
  - `logoutAction`이 Server Action으로 이미 구현되어 있다.
  - `SupabaseAuthRepository.signOut()` 호출 후 `/login`으로 리다이렉트한다.
  - 현재 에러 처리가 없으므로, 로그아웃 실패 시 사용자에게 피드백을 제공하기 위해 반환 타입을 확장해야 한다.
- **Implications**: 기존 `logoutAction`을 확장하여 에러 처리를 추가한다. `redirect()`가 내부적으로 예외를 던지므로 try-catch와 결합 시 주의가 필요하다.

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Props Drilling | 서버 컴포넌트에서 userEmail을 props로 전달 | 단순하고 명시적, 추가 의존성 없음 | 깊은 컴포넌트 트리에서 번거로움 | 현재 depth가 page -> DashboardShell -> AppHeader로 2단계이므로 적절 |
| Context Provider | AuthContext로 인증 상태를 전역 관리 | 어디서든 접근 가능, 확장성 좋음 | 오버엔지니어링, 추가 복잡성 | 현재 소비자가 AppHeader 하나뿐이므로 불필요 |
| Zustand / 상태 관리 라이브러리 | 외부 상태 관리 도구 사용 | 전역 상태 관리 편의성 | 새 의존성 추가, 서버-클라이언트 동기화 복잡 | 현 단계에서는 과도함 |

## Design Decisions

### Decision: Props Drilling을 통한 인증 정보 전달
- **Context**: 서버에서 확인한 사용자 이메일을 클라이언트 UI에 표시해야 한다.
- **Alternatives Considered**:
  1. Props Drilling (page -> DashboardShell -> AppHeader)
  2. Context Provider (AuthContext)
  3. 클라이언트 측 getUser() 재호출
- **Selected Approach**: Props Drilling. 서버 컴포넌트 page.tsx에서 userEmail을 조회하여 DashboardShell, AppHeader에 순차 전달한다.
- **Rationale**: 컴포넌트 트리 깊이가 2단계로 얕고, 인증 정보 소비자가 AppHeader 하나뿐이다. Context Provider는 오버엔지니어링이며, 클라이언트 재호출은 불필요한 네트워크 요청을 유발한다.
- **Trade-offs**: 향후 인증 정보 소비자가 증가하면 Context Provider로 전환이 필요할 수 있다.
- **Follow-up**: 인증 정보 소비 컴포넌트가 3개 이상으로 증가하면 Context Provider 도입을 검토한다.

### Decision: 미들웨어에서 보호 경로 가드 추가
- **Context**: 비인증 사용자가 루트 페이지에 접근하는 것을 차단해야 한다.
- **Alternatives Considered**:
  1. 미들웨어에서 리다이렉트
  2. 서버 컴포넌트(page.tsx)에서 리다이렉트
- **Selected Approach**: 미들웨어에서 리다이렉트. 기존 미들웨어에 `!user && !isAuthPage` 조건 추가.
- **Rationale**: 미들웨어는 페이지 렌더링 이전에 실행되므로 불필요한 서버 컴포넌트 실행을 방지한다. 기존 미들웨어가 이미 `getUser()`를 호출하고 있으므로 추가 비용이 없다.
- **Trade-offs**: 미들웨어의 matcher 패턴에 따라 정적 자산 요청에도 실행될 수 있으나, 기존 matcher가 이미 정적 자산을 제외하고 있다.
- **Follow-up**: 보호 경로가 늘어나면 경로 목록을 별도 설정으로 분리하는 것을 검토한다.

### Decision: 기존 logoutAction 확장 (에러 처리 추가)
- **Context**: 요구사항 4.4에서 로그아웃 실패 시 사용자에게 오류 메시지 표시를 요구한다.
- **Alternatives Considered**:
  1. 기존 logoutAction을 수정하여 에러 처리 추가
  2. 새로운 logoutWithErrorHandlingAction 생성
- **Selected Approach**: 기존 logoutAction을 수정. 반환 타입을 `LogoutResult` 판별 합집합으로 변경하고, 성공 시 리다이렉트, 실패 시 에러 객체를 반환한다.
- **Rationale**: 기존 함수를 확장하는 것이 코드 중복을 방지하고 단일 진실 원천을 유지한다.
- **Trade-offs**: 기존 logoutAction 호출부가 있다면 반환 타입 변경에 의한 영향이 있을 수 있으나, 현재 호출부가 없으므로 안전하다.
- **Follow-up**: `redirect()`와 try-catch 결합 시 Next.js의 NEXT_REDIRECT 에러를 재throw해야 하므로 구현 시 주의한다.

## Risks & Mitigations
- **미들웨어 getUser() 호출 지연** -- Supabase Auth 서버 호출이 매 요청마다 발생하므로 네트워크 지연이 있을 수 있다. 다만 이미 기존 미들웨어에서 호출 중이므로 추가 비용은 없다.
- **Popover 외부 클릭 감지** -- Radix UI Popover는 외부 클릭 시 자동 닫힘을 기본 지원하므로 별도 구현이 불필요하다. 단, Portal로 렌더링되므로 z-index 충돌에 주의한다.
- **로그아웃 Server Action 에러 처리** -- Next.js의 `redirect()`는 내부적으로 에러를 throw하므로, try-catch 블록에서 `redirect()`를 호출하면 catch 블록에서 잡힐 수 있다. `redirect()`를 try-catch 외부에서 호출하도록 설계한다.

## References
- [Supabase 공식 - Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- 미들웨어 패턴, getUser() 사용 권장
- [Supabase 공식 - Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) -- 보호 경로 가드 패턴
- [supabase/ssr Discussion #21468](https://github.com/orgs/supabase/discussions/21468) -- @supabase/ssr를 사용한 경로 보호 방법
- [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover) -- 외부 클릭 닫힘 기본 동작
