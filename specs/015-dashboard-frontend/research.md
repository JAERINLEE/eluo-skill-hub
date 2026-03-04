# Research: 대시보드 프론트엔드 구현

**Feature**: 015-dashboard-frontend
**Date**: 2026-03-04

## R1: URL 기반 상태 관리 (Load More 누적 유지)

**Decision**: Next.js App Router의 `searchParams`를 사용하여 `limit` 값을 URL에 저장한다.

**Rationale**:
- 새로고침 시 상태가 자동 유지된다 (브라우저 URL 유지).
- Server Component에서 `searchParams`를 직접 읽어 서버 사이드 데이터 페칭에 활용 가능하다.
- 별도의 세션 스토리지나 쿠키 관리가 불필요하다.
- URL을 공유하면 동일한 뷰를 재현할 수 있다.

**Alternatives considered**:
- `sessionStorage`: 탭 간 공유 불가, 서버 컴포넌트에서 접근 불가.
- Cookie 기반: 불필요한 복잡성, 모든 요청에 쿠키 전송 오버헤드.
- `useState` (클라이언트): 새로고침 시 상태 손실, 요구사항 불충족.

## R2: 검색 구현 방식

**Decision**: 서버 사이드 검색 — Supabase `ilike` 쿼리로 `title`과 `description` 필드를 대소문자 무시 부분 매칭한다. 검색은 "검색하기" 버튼 클릭 또는 Enter 키 입력 시에만 실행한다 (실시간 검색 아님).

**Rationale**:
- 기존 `admin/infrastructure/supabase-admin-repository.ts`의 `getSkills()` 메서드가 동일한 패턴(`or(title.ilike.%search%,description.ilike.%search%)`)을 이미 사용한다.
- 검증된 패턴 재사용으로 안정성 확보.
- 서버 사이드 검색으로 클라이언트 데이터 노출 최소화.

**Alternatives considered**:
- 클라이언트 사이드 필터링: 전체 데이터 로드 필요, 대량 데이터 비효율.
- Supabase Full-Text Search (`textSearch`): 현재 규모에서 과도한 설정, ilike로 충분.
- 실시간 검색 (debounce): 요구사항이 명시적으로 "버튼/Enter" 기반이므로 불필요.

## R3: Dashboard 바운디드 컨텍스트 분리

**Decision**: `src/dashboard/` 독립 모듈로 생성한다. `admin/` 모듈의 코드를 직접 import하지 않는다.

**Rationale**:
- Constitution Principle IV (Feature Module Isolation): 모듈 간 infrastructure import 금지.
- Dashboard(사용자 뷰)와 Admin(관리자 뷰)은 다른 관심사를 가진다:
  - Dashboard: published 스킬만, 읽기 전용, 일반 사용자 인증
  - Admin: 모든 상태 스킬, CRUD, admin 역할 필요
- 쿼리 패턴은 유사하지만 도메인 타입과 비즈니스 규칙이 다르다.

**Alternatives considered**:
- `admin/` 모듈 직접 재사용: Constitution 위반, 관심사 결합.
- `shared/` 에 공통 repository 추출: 현재 규모에서 과도한 추상화, 각 도메인의 요구사항 변화 시 공유 코드가 병목.

## R4: 프로필 드롭다운 구현

**Decision**: Radix UI의 `DropdownMenu` 컴포넌트(Shadcn UI 래핑)를 사용한다. 프로필 이미지는 고정 DiceBear URL을 사용한다.

**Rationale**:
- 프로젝트에 이미 Shadcn UI / Radix UI가 설치되어 있다.
- `DropdownMenu`는 접근성(키보드 네비게이션, ARIA)을 기본 지원한다.
- 외부 클릭 시 자동 닫힘이 내장되어 있다.

**Alternatives considered**:
- 커스텀 드롭다운: 접근성/외부클릭 직접 구현 필요, 불필요한 작업.
- Popover: 드롭다운 메뉴 시맨틱에 DropdownMenu가 더 적합.

## R5: 인증 가드 패턴

**Decision**: `src/app/dashboard/layout.tsx`에서 서버 사이드 인증 검증을 수행한다. `supabase.auth.getUser()`로 사용자 확인 후 미인증 시 `/signin` 리다이렉트.

**Rationale**:
- 기존 `admin/layout.tsx` 패턴을 그대로 따른다 (admin 역할 검증만 제외).
- Server Component에서 인증 검증하므로 클라이언트 번들에 인증 로직 미포함.
- Constitution Principle V (Security-First) 준수.

**Alternatives considered**:
- Middleware 기반 인증: 현재 프로젝트에 middleware.ts 미존재, 기존 패턴과 일관성 유지.
- 클라이언트 사이드 가드: Security-First 위반.

## R6: 사이드바 카테고리 아이콘 렌더링

**Decision**: 기존 `admin/` 스킬 관리에서 사용하는 카테고리 아이콘 렌더링 패턴을 확인하여 동일하게 적용한다. `categories` 테이블의 `icon` 필드에 lucide-react 아이콘 이름이 저장되어 있으며, 동적 렌더링한다.

**Rationale**:
- 기존 커밋 `b5da88e`에서 "카테고리 아이콘을 텍스트 대신 lucide-react 아이콘으로 렌더링" 작업이 완료되었다.
- 동일 DB 데이터를 사용하므로 일관된 렌더링 방식 필요.

**Alternatives considered**:
- Material Symbols (stitch-html 사용): 프로젝트 표준이 lucide-react이므로 일관성 위해 lucide-react 사용.

## R7: 북마크 토글 구현 패턴

**Decision**: Next.js Server Action + `useOptimistic` 조합으로 구현한다. `toggleBookmark` Server Action이 bookmarks 존재 여부를 확인하여 INSERT/DELETE를 수행하고, `revalidatePath`로 서버 캐시를 갱신한다.

**Rationale**:
- Server Action은 서버에서 인증을 검증하므로 Security-First 원칙 준수.
- `useOptimistic`으로 사용자에게 즉각적인 피드백 제공 (네트워크 대기 없이 UI 반영).
- `revalidatePath`로 대시보드와 myagent 페이지의 서버 캐시를 동시에 갱신.
- 에러 시 optimistic state가 자동 롤백된다.

**Alternatives considered**:
- API Route Handler (POST /api/bookmarks): 불필요한 엔드포인트 추가, Server Action이 더 간결.
- Client-side fetch + SWR: 서버 상태와의 동기화 복잡, Server Action이 Next.js 권장 패턴.
- Zustand 등 클라이언트 상태 관리: 서버 사이드 렌더링과의 불일치 발생 가능.

## R8: `/dashboard`와 `/myagent` 레이아웃 공유 방식

**Decision**: Next.js Route Group `(portal)`을 사용하여 공유 레이아웃을 구현한다.

**Rationale**:
- Route Group은 URL에 영향을 주지 않으므로 `/dashboard`, `/myagent` 경로가 그대로 유지된다.
- 단일 `layout.tsx`에서 auth guard, 사용자 프로필, 카테고리 fetch를 한 번만 수행한다.
- 레이아웃 코드 중복을 제거한다.

**Alternatives considered**:
- 별도 `layout.tsx` 복제: 코드 중복, 변경 시 두 곳 수정 필요.
- `/dashboard/myagent` 서브라우트: 사용자가 `/myagent`를 명시적으로 요청.
- 공유 함수 추출: 레이아웃 자체는 공유 불가, Route Group이 Next.js 표준 해법.

## R9: `bookmark` 바운디드 컨텍스트 분리

**Decision**: `src/bookmark/`을 독립 모듈로 생성한다.

**Rationale**:
- Constitution Principle IV에 `bookmark`이 명시적으로 독립 도메인으로 언급됨.
- Dashboard(읽기 전용 스킬 조회)와 Bookmark(사용자별 스킬 관계 관리)는 다른 관심사.
- 북마크 로직은 향후 다른 페이지(스킬 상세 등)에서도 재사용 가능.

**Alternatives considered**:
- Dashboard 모듈 확장: Constitution 위반, 관심사 혼합.
- Shared 모듈 배치: 북마크는 특정 도메인 로직이므로 shared에 부적절.

## R10: bookmarks 테이블 RLS 정책

**Decision**: 사용자별 CRUD 정책 3개를 설정한다 (SELECT, INSERT, DELETE).

**Rationale**:
- Constitution Principle V (Security-First): RLS 필수.
- 사용자는 자신의 북마크만 조회/생성/삭제 가능.
- UPDATE 정책 불필요 (북마크는 토글 — INSERT 또는 DELETE만 사용).
- UNIQUE(user_id, skill_id) 제약으로 중복 북마크 방지.

**Alternatives considered**:
- 서비스 레벨에서만 검증: 클라이언트가 직접 Supabase에 접근할 경우 우회 가능, RLS가 안전.
