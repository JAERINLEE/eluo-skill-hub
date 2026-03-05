---

description: "Task list template for feature implementation"
---

# Tasks: 프로젝트 환경 세팅

**Input**: Design documents from `/specs/002-project-setup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: User Story 순서로 구성. US1(브랜드 컬러) → US2(로컬 폰트) → US3(코드 품질 게이트).
US2는 US1이 생성한 파일을 수정하므로 순차 실행. US3은 독립 실행 가능.

---

## Phase 1: Setup (프로젝트 초기화)

**Purpose**: Next.js 16 TypeScript 프로젝트 초기화 및 전체 기술 스택 의존성 설치

- [x] T001 Next.js 16 TypeScript 프로젝트를 레포지토리 루트에 초기화한다 — `npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --import-alias "@/*"` 실행, 생성된 `package.json` 확인
- [x] T002 [P] Tailwind CSS v4 관련 패키지를 설치한다 — `npm install tailwindcss@^4 @tailwindcss/postcss@^4 tw-animate-css` 실행, `package.json` devDependencies에 반영 확인
- [x] T003 [P] Shadcn UI 패키지를 설치한다 — `npm install shadcn@latest` 실행 후 `npx shadcn@latest init` 실행, `components.json` 생성 확인
- [x] T004 [P] 단위 테스트 도구를 설치한다 — `npm install -D jest@^30 jest-environment-jsdom ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest` 실행
- [x] T005 [P] Playwright E2E 테스트 도구를 설치한다 — `npm install -D @playwright/test` 실행 후 `npx playwright install` 실행
- [x] T006 [P] Supabase 클라이언트 패키지를 설치한다 — `npm install @supabase/supabase-js @supabase/ssr` 실행
- [x] T007 [P] 기타 UI 유틸리티 패키지를 설치한다 — `npm install clsx tailwind-merge class-variance-authority lucide-react sonner` 실행

---

## Phase 2: Foundational (공통 설정 파일 구성)

**Purpose**: 모든 User Story 구현 전에 완료되어야 하는 프로젝트 기반 설정

⚠️ **CRITICAL**: 이 Phase 완료 전까지 User Story 작업을 시작하지 않는다.

- [x] T008 `postcss.config.mjs`를 생성한다 — `{ plugins: { "@tailwindcss/postcss": {} } }` 내용으로 `postcss.config.mjs` 파일 작성
- [x] T009 [P] `tsconfig.json`을 구성한다 — `strict: true`, `noEmit: true`, `paths: { "@/*": ["./src/*"] }` 설정, `target: "ES2017"` 설정 확인
- [x] T010 [P] `package.json` 스크립트를 구성한다 — `"dev": "next dev"`, `"build": "next build"`, `"lint": "eslint"`, `"test": "jest"`, `"test:watch": "jest --watch"`, `"test:coverage": "jest --coverage"`, `"test:e2e": "playwright test"` 스크립트 추가
- [x] T011 [P] `jest.config.ts`를 생성한다 — `ts-jest`와 `jest-environment-jsdom` 설정, `moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }` 경로 alias 포함
- [x] T012 [P] `jest.setup.ts`를 생성한다 — `import "@testing-library/jest-dom"` 한 줄 작성, `jest.config.ts`의 `setupFilesAfterEnv`에 등록
- [x] T013 [P] `playwright.config.ts`를 생성한다 — `baseURL: "http://localhost:3000"`, `testDir: "src/__tests__/e2e"`, `webServer` 설정 포함
- [x] T014 [P] 소스 디렉토리 구조를 생성한다 — `src/app/`, `src/features/`, `src/shared/`, `src/__tests__/e2e/` 디렉토리 생성
- [x] T015 [P] `src/shared/infrastructure/supabase/client.ts`와 `server.ts`를 생성한다 — `@supabase/ssr`의 `createBrowserClient`, `createServerClient` 각각 래핑하는 팩토리 함수 작성

**Checkpoint**: Phase 2 완료 후 `npx tsc --noEmit` 통과 확인 — User Story 작업 시작 가능

---

## Phase 3: User Story 1 - 브랜드 컬러 시스템 (Priority: P1) 🎯 MVP

**Goal**: Eluo 브랜드 컬러 3종이 Tailwind 토큰으로 등록되어 개발자가 클래스명만으로 사용 가능하고, 루트 페이지에서 세 색상 모두 표시된다.

**Independent Test**: `http://localhost:3000` 방문 (비로그인) → #FEFE01 노랑, #00007F 네이비, #F0F0F0 라이트 그레이 세 색상 영역이 화면에 모두 표시된다.

### Implementation for User Story 1

- [x] T016 [US1] `src/app/globals.css`를 생성한다 — 다음 내용으로 작성:
  ```
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css";

  @custom-variant dark (&:is(.dark *));

  @theme inline {
    --color-brand-yellow: #FEFE01;
    --color-brand-navy:   #00007F;
    --color-brand-light:  #F0F0F0;
    /* shadcn/ui 변수 포함 (npx shadcn init 생성값 유지) */
  }
  ```
  shadcn init이 생성한 `:root` / `.dark` CSS 변수 블록을 파일 하단에 유지한다.

- [x] T017 [US1] `src/app/layout.tsx`를 생성한다 — `import "./globals.css"` 포함, `metadata: { title: "AI 스킬 허브", description: "..." }` 설정, `<html lang="ko"><body className="antialiased">{children}</body></html>` 구조 작성. 폰트는 US2에서 추가하므로 이 단계에서는 포함하지 않는다.

- [x] T018 [US1] `src/features/root-page/` 디렉토리를 생성하고 `LandingPage.tsx`를 작성한다 — 아래 3개 브랜드 컬러를 모두 사용하는 레이아웃:
  - `bg-[#00007F]` 히어로 섹션 (상단 헤더, 전체 너비)
  - `bg-[#FEFE01]` 강조 버튼 또는 배지
  - `bg-brand-light` 콘텐츠 배경 섹션
  `'use client'` 지시어 없이 Server Component로 작성한다.

- [x] T019 [US1] `src/app/page.tsx`를 생성한다 — `import { LandingPage } from "@/features/root-page/LandingPage"` 후 `export default function Home() { return <LandingPage /> }` 작성

**Checkpoint**: `npm run dev` 실행 → localhost:3000에서 세 가지 브랜드 컬러 모두 화면에 표시 확인 — US1 독립 검증 완료

---

## Phase 4: User Story 2 - 로컬 폰트 설정 (Priority: P2)

**Goal**: 외부 CDN 의존 없이 로컬 서빙되는 Pretendard Variable 폰트가 앱 전체에 적용된다.

**Independent Test**: DevTools Network 탭 → Font 필터 → `PretendardVariable.woff2`가 로컬(localhost 또는 /_next/static/)에서 로드되고, `cdn.jsdelivr.net` 요청이 없다.

### Implementation for User Story 2

- [x] T020 [US2] `src/app/font/` 디렉토리를 생성하고 `PretendardVariable.woff2`를 배치한다 — 기존 `src/app/fonts/PretendardVariable.woff2` 파일을 `src/app/font/PretendardVariable.woff2`로 복사(또는 이동). 파일이 없을 경우 공식 GitHub `orioncactus/pretendard` 릴리즈에서 다운로드한다.

- [x] T021 [US2] `src/app/layout.tsx`에 localFont를 등록한다 — 다음 내용을 추가:
  ```ts
  import localFont from 'next/font/local'

  const pretendard = localFont({
    src: './font/PretendardVariable.woff2',
    variable: '--font-pretendard',
    display: 'swap',
    weight: '100 900',
  })
  ```
  `<html>` 태그에 `className={pretendard.variable}` 추가한다.

- [x] T022 [US2] `src/app/globals.css`의 `@theme inline` 블록에 폰트 토큰을 추가한다 — 기존 폰트 관련 CSS custom property를 아래와 같이 교체:
  ```css
  --font-sans:    var(--font-pretendard), sans-serif;
  --font-display: var(--font-pretendard), sans-serif;
  ```
  정적 폰트 이름 하드코딩(`Pretendard, sans-serif`) 및 외부 CDN `@import url(...)` 구문이 없음을 확인한다.

**Checkpoint**: `npm run dev` → DevTools Network → Font 탭에서 외부 CDN 요청 없음 확인 — US2 독립 검증 완료

---

## Phase 5: User Story 3 - 컨스티튜션 코드 품질 게이트 (Priority: P3)

**Goal**: `any` 타입 사용 시 린트/빌드가 자동으로 차단된다.

**Independent Test**: `echo "const x: any = 1" > /tmp/test-any.ts` → `npm run lint /tmp/test-any.ts` 실행 → `@typescript-eslint/no-explicit-any` 오류 발생 확인.

### Implementation for User Story 3

- [x] T023 [US3] `eslint.config.mjs`를 생성한다 — 다음 구조로 작성:
  ```js
  import { defineConfig, globalIgnores } from "eslint/config";
  import nextVitals from "eslint-config-next/core-web-vitals";
  import nextTs from "eslint-config-next/typescript";

  const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
    {
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ]);

  export default eslintConfig;
  ```

- [x] T024 [US3] `tsconfig.json`의 `strict: true` 설정을 확인하고 누락 시 추가한다 — `compilerOptions.strict: true` 유무 확인. 없으면 추가, 있으면 그대로 유지. `noEmit: true` 도 함께 확인한다.

**Checkpoint**: `npm run lint` 오류 0개 확인 → `any` 임시 코드 작성 후 오류 발생 확인 — US3 독립 검증 완료

---

## Phase 6: Polish & 최종 검증

**Purpose**: 전체 통합 검증 및 quickstart.md 체크리스트 실행

- [x] T025 [P] `npm run build`를 실행하여 TypeScript 컴파일 오류와 ESLint 오류가 0개임을 확인한다. 오류 발생 시 해당 파일을 수정하고 재실행한다.
- [x] T026 [P] `npm run test`를 실행하여 기존 단위 테스트 회귀 없음을 확인한다.
- [x] T027 quickstart.md 검증 가이드를 실행한다 — Step 1(폰트 파일 확인), Step 2(tsc), Step 3(ESLint), Step 4(시각 검증), Step 5(빌드) 순서로 수행한다.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능. T002–T007은 [P] 병렬 실행 가능.
- **Foundational (Phase 2)**: Phase 1 완료 후 시작. T009–T015는 [P] 병렬 실행 가능.
- **US1 (Phase 3)**: Phase 2 완료 후 시작. T016–T019는 순차 실행 (파일 의존성).
- **US2 (Phase 4)**: Phase 3 완료 후 시작 (layout.tsx, globals.css 수정 대상이 US1에서 생성됨).
- **US3 (Phase 5)**: Phase 2 완료 후 즉시 시작 가능 (US1, US2와 독립적). T023–T024는 [P] 가능.
- **Polish (Phase 6)**: US1, US2, US3 모두 완료 후 실행.

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 바로 시작 — 독립적
- **US2 (P2)**: US1 완료 후 시작 — layout.tsx, globals.css를 US1이 생성하므로 순차 필요
- **US3 (P3)**: Phase 2 완료 후 바로 시작 — US1/US2와 독립적, 병렬 진행 가능

### Parallel Opportunities

```bash
# Phase 1: T002~T007 동시 실행
Task: "Install Tailwind v4 dependencies (T002)"
Task: "Install Shadcn UI (T003)"
Task: "Install test tooling (T004)"
Task: "Install Playwright (T005)"
Task: "Install Supabase (T006)"
Task: "Install UI utilities (T007)"

# Phase 2: T009~T015 동시 실행
Task: "Configure tsconfig.json (T009)"
Task: "Configure package.json scripts (T010)"
Task: "Create jest.config.ts (T011)"
Task: "Create jest.setup.ts (T012)"
Task: "Create playwright.config.ts (T013)"
Task: "Create directory structure (T014)"
Task: "Create Supabase client files (T015)"

# US3 (Phase 5): Phase 2 완료 직후 US1/US2와 병렬 진행 가능
Task: "Create eslint.config.mjs (T023)"
Task: "Verify tsconfig strict (T024)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (`npx tsc --noEmit` 통과)
3. Phase 3: US1 구현 → `localhost:3000`에서 브랜드 컬러 3종 표시 확인
4. **STOP and VALIDATE**: 브라우저에서 브랜드 컬러 확인 → MVP 달성

### Incremental Delivery

1. Phase 1 + 2 → 프로젝트 기반 준비
2. US1 완료 → 브랜드 컬러 시스템 사용 가능 (MVP)
3. US2 완료 → 로컬 폰트 적용 (폰트 깜빡임 제거)
4. US3 완료 → `any` 타입 자동 차단 (코드 품질 강화)
5. Polish → 빌드/테스트 최종 검증

### Parallel Team Strategy (2인 기준)

- **개발자 A**: Phase 1 → Phase 2 → US1 → US2 (순서 중요)
- **개발자 B**: Phase 1 설치 완료 후 → US3 (eslint.config.mjs, tsconfig.json 독립 작업)

---

## Notes

- [P] 표시 태스크 = 다른 파일을 수정하거나 의존성 없어 병렬 실행 가능
- [US1/2/3] 라벨 = 해당 태스크가 속한 User Story
- `src/app/layout.tsx`는 US1(생성) → US2(수정) 순서로 작업한다
- `src/app/globals.css`는 US1(생성) → US2(수정) 순서로 작업한다
- 폰트 파일이 이미 `src/app/fonts/`에 있다면 T020에서 경로만 변경한다
- shadcn init 실행 시 자동 생성되는 CSS 변수 블록은 유지한다
- Pretendard woff2 파일 없을 경우: `orioncactus/pretendard` GitHub Releases에서 `PretendardVariable.woff2` 다운로드
