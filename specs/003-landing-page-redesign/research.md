# Research: 랜딩페이지 디자인 수정 (커스텀 폰트 + 인터랙티브 글로브)

**Branch**: `003-landing-page-redesign` | **Date**: 2026-03-03

---

## Decision 1: Next.js App Router에서 커스텀 폰트 로드 전략

**Decision**: `next/font/local`을 사용하여 `ELUOFACEVF.ttf`를 `variable: "--font-eluo-face"`로 등록하고, Tailwind v4 `@theme inline`에서 `--font-eluo: var(--font-eluo-face), sans-serif` 토큰을 선언한다.

**Rationale**:
- 프로젝트에 이미 `next/font/local` 패턴이 Pretendard에 적용되어 있다 (`layout.tsx:5-10`). 동일 패턴 사용으로 일관성 유지.
- `next/font/local`은 폰트를 정적 최적화하여 FOUT(Flash of Unstyled Text)를 방지하고, preload 힌트를 자동 삽입한다.
- `variable` 옵션 이름을 `--font-eluo-face`로 설정하면 Tailwind 테마 토큰 이름(`--font-eluo`)과 충돌을 피할 수 있다.
- `display: "swap"` 설정으로 로드 실패 시 fallback 폰트로 자연스럽게 전환된다.

**Alternatives considered**:
- CSS `@font-face` 직접 선언: next/font의 자동 최적화(preload, size-adjust)를 포기해야 하므로 기각.
- Google Fonts: 프로젝트 전용 폰트(ELUOFACEVF.ttf)이므로 해당 없음.

**Implementation notes**:
```
layout.tsx:
  const eluo = localFont({
    src: "./font/ELUOFACEVF.ttf",
    variable: "--font-eluo-face",
    display: "swap",
  })
  // <html className={`${pretendard.variable} ${eluo.variable}`}>

globals.css (@theme inline):
  --font-eluo: var(--font-eluo-face), sans-serif;

LandingPage.tsx (h1):
  className="... font-eluo"
```

---

## Decision 2: InteractiveGlobe 컴포넌트 위치

**Decision**: `src/shared/ui/interactive-globe.tsx`에 배치한다.

**Rationale**:
- 헌법(Constitution IV) — "공유 UI는 `src/shared/`에 위치해야 한다"
- 프로젝트의 path alias `@/*` → `./src/*`이므로 `@/shared/ui/interactive-globe`로 임포트 가능.
- Canvas 기반 컴포넌트는 도메인 로직이 없는 순수 UI이므로 shared UI로 분류 적합.
- 향후 다른 페이지(어드민 대시보드 등)에서도 재사용 가능성 있음.

**Note**: 사용자는 `/components/ui/` 경로를 제안했으나, 이 프로젝트에는 `src/components/` 경로가 없다. 헌법의 구조 규칙에 따라 `src/shared/ui/`가 올바른 위치이다.

**Alternatives considered**:
- `src/features/root-page/components/InteractiveGlobe.tsx`: feature-specific 위치이나, 재사용성이 떨어지고 shared UI 원칙에 어긋남.
- `src/components/ui/interactive-globe.tsx`: 디렉토리가 존재하지 않으며 프로젝트 구조와 불일치.

---

## Decision 3: 히어로 섹션 레이아웃 전략

**Decision**: 기존 단일 컬럼 히어로를 좌(텍스트/CTA) + 우(글로브) 2단 레이아웃으로 전환하되, `bg-[#00007F]` 배경을 유지한다. 모바일(768px 미만)에서는 텍스트 상단 + 글로브 하단 수직 배치.

**Rationale**:
- 기존 브랜드 색상(`bg-[#00007F]`, `text-[#FEFE01]`) 유지로 전체 디자인 일관성 보존.
- 글로브는 우측에 배치하여 텍스트 가독성을 방해하지 않음.
- 참고 데모(`demo.tsx`)의 flex-col md:flex-row 패턴을 Tailwind v4 클래스로 구현.
- 글로브 크기: 데스크탑 460px, 모바일에서는 `w-full` + 고정 height로 반응형 처리.

**Alternatives considered**:
- 글로브를 배경 오버레이로 배치: 텍스트 가독성 저하 위험으로 기각.
- 데모의 `bg-card` 배경 사용: 브랜드 아이덴티티 약화로 기각. `bg-[#00007F]` 유지.

---

## Decision 4: Canvas 컴포넌트 Next.js SSR 처리

**Decision**: `"use client"` 디렉티브를 컴포넌트 최상단에 선언하고, Next.js Dynamic Import(`next/dynamic`)로 SSR을 비활성화한다.

**Rationale**:
- Canvas API, `requestAnimationFrame`, `window.devicePixelRatio`는 브라우저 전용 API이므로 서버사이드 렌더링 불가.
- `next/dynamic`에서 `{ ssr: false }` 옵션으로 클라이언트에서만 로드 → 서버 사이드 에러 방지.
- LandingPage에서 dynamic import 사용: `const InteractiveGlobe = dynamic(() => import("@/shared/ui/interactive-globe").then(m => m.InteractiveGlobe), { ssr: false })`.
- `"use client"` 디렉티브도 컴포넌트 자체에 선언하여 Client Component 경계 명시.

**Alternatives considered**:
- 조건부 `typeof window !== "undefined"` 체크: hydration mismatch 위험 있어 기각.
- 글로브 컴포넌트를 LandingPage가 이미 `"use client"`이므로 그냥 임포트: LandingPage가 현재 Server Component이므로 dynamic import가 안전함.

---

## Decision 5: 테스트 전략

**Decision**:
- **Unit 테스트** (`src/shared/ui/__tests__/interactive-globe.test.tsx`): `HTMLCanvasElement.prototype.getContext`를 Jest로 mock하여 컴포넌트가 canvas를 렌더링하는지, props가 올바르게 적용되는지 검증.
- **E2E 테스트** (`src/__tests__/e2e/landing-page.spec.ts`): Playwright로 h1 폰트 렌더링 확인 및 canvas 요소 존재 + 크기 검증.

**Rationale**:
- Canvas는 픽셀 단위 렌더링 테스트가 어려우므로 단위 테스트는 DOM 구조(canvas 요소 존재, 이벤트 핸들러 등록)에 집중.
- E2E는 실제 브라우저에서 canvas 렌더링 및 font-family 적용을 검증.
- Jest의 `jsdom`은 Canvas API를 완전 지원하지 않으므로 `jest-canvas-mock` 또는 getContext mock 사용.

**Alternatives considered**:
- Visual regression test (Playwright screenshot): CI 환경 차이로 불안정할 수 있어 Primary 대신 Secondary로.

---

## Decision 6: LandingPage `"use client"` 여부

**Decision**: `LandingPage.tsx`에는 `"use client"` 디렉티브를 **추가하지 않는다**. 글로브 컴포넌트만 dynamic import로 클라이언트에서 로드한다.

**Rationale**:
- Server Component로 유지하면 텍스트 콘텐츠는 서버에서 렌더링되어 SEO에 유리.
- `next/dynamic`으로 globe만 클라이언트에서 로드하면 번들 크기를 줄이고 초기 렌더링 성능을 높임.
- 헌법의 Clean Architecture 원칙: 불필요한 클라이언트 번들 확장을 피함.
