# Implementation Plan: 랜딩페이지 디자인 수정 (커스텀 폰트 + 인터랙티브 글로브)

**Branch**: `003-landing-page-redesign` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-landing-page-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

랜딩 페이지의 두 가지 디자인 개선을 구현한다:
1. **커스텀 폰트**: 기존 Pretendard 설정 패턴을 재사용해 `ELUOFACEVF.ttf`를 `next/font/local`로 등록하고, Tailwind v4 `@theme inline`에 `--font-eluo` 토큰을 선언하여 h1 타이틀에 브랜드 폰트 적용.
2. **인터랙티브 글로브**: Canvas API 기반 3D 지구본 컴포넌트를 `src/shared/ui/`에 생성하고, 히어로 섹션을 좌(텍스트/CTA) + 우(글로브) 2단 레이아웃으로 전환. `next/dynamic`으로 SSR 비활성화.

## Technical Context

**Language/Version**: TypeScript (strict) — `any` 금지 (헌법 원칙 I)
**Primary Dependencies**: Next.js (App Router), Tailwind CSS v4, Shadcn UI, `next/font/local`
**Storage**: N/A (순수 UI 변경)
**Testing**: Jest + React Testing Library (단위), Playwright (E2E)
**Target Platform**: 웹 브라우저 (데스크탑 + 모바일)
**Project Type**: Next.js 웹 앱 (App Router)
**Performance Goals**: 글로브 애니메이션 30fps 이상; 폰트 로드 1초 이내; LCP 영향 최소화
**Constraints**: Canvas API → SSR 불가 → `next/dynamic` + `ssr: false` 필수; `any` 타입 금지
**Scale/Scope**: 단일 페이지 UI 변경 + 공유 컴포넌트 1개 신규 생성

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| I. Type Safety (any 금지) | ✅ PASS | Globe 컴포넌트 전체 명시적 타입 적용. `GlobeProps`, `GlobeConnection`, `GlobeMarker` 인터페이스 export. Canvas 컨텍스트는 `CanvasRenderingContext2D \| null` 타입. |
| II. Clean Architecture | ✅ PASS | 순수 UI 레이어 변경. 도메인/애플리케이션/인프라 레이어 무관. 글로브 컴포넌트 → `src/shared/ui/`(공유 UI), LandingPage → `src/features/root-page/`(feature UI). |
| III. Test Coverage | ✅ PASS (필수) | 단위 테스트: `src/shared/ui/__tests__/interactive-globe.test.tsx`. E2E: `src/__tests__/e2e/landing-page.spec.ts`. 구현과 동시 작성 필수. |
| IV. Feature Module Isolation | ✅ PASS | Globe는 `src/shared/ui/`(재사용 UI)에 배치. LandingPage는 `src/features/root-page/` 유지. cross-domain import 없음. |
| V. Security-First | ✅ N/A | 공개 마케팅 페이지. 사용자 데이터/인증/RLS 변경 없음. |

**Post-Design Re-check**: 모든 gates PASS — 진행 승인.

## Project Structure

### Documentation (this feature)

```text
specs/003-landing-page-redesign/
├── spec.md              # Feature spec
├── plan.md              # This file
├── research.md          # Phase 0: 6개 기술 결정 사항
├── data-model.md        # Phase 1: Props 타입, 상태 모델
├── quickstart.md        # Phase 1: 개발 시작 가이드
├── contracts/
│   └── ui-components.md # Phase 1: 컴포넌트 계약
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── font/
│   │   ├── ELUOFACEVF.ttf          # [기존] eluo 브랜드 폰트
│   │   └── PretendardVariable.woff2 # [기존] 기본 폰트
│   ├── globals.css                  # [수정] --font-eluo 토큰 추가
│   ├── layout.tsx                   # [수정] eluo localFont 추가
│   └── page.tsx                     # [변경 없음]
├── features/
│   └── root-page/
│       └── LandingPage.tsx          # [수정] 2단 레이아웃 + 글로브 + eluo 폰트
└── shared/
    └── ui/
        ├── interactive-globe.tsx    # [신규] Canvas 글로브 컴포넌트
        └── __tests__/
            └── interactive-globe.test.tsx  # [신규] 단위 테스트

src/__tests__/
└── e2e/
    └── landing-page.spec.ts        # [신규] E2E 테스트
```

**Structure Decision**: Single Next.js app 구조. 글로브는 `src/shared/ui/`에 배치하여 헌법 IV(Feature Module Isolation) 준수. LandingPage는 기존 `src/features/root-page/` 모듈 내 유지.

## Implementation Guide

### Step 1: 폰트 등록 (`layout.tsx` + `globals.css`)

```typescript
// src/app/layout.tsx
const eluo = localFont({
  src: "./font/ELUOFACEVF.ttf",
  variable: "--font-eluo-face",
  display: "swap",
})

// html 태그 className에 추가
<html lang="ko" className={`${pretendard.variable} ${eluo.variable}`}>
```

```css
/* src/app/globals.css — @theme inline 블록 내 추가 */
--font-eluo: var(--font-eluo-face), sans-serif;
```

### Step 2: InteractiveGlobe 컴포넌트 (`src/shared/ui/interactive-globe.tsx`)

핵심 구현 사항:
- `"use client"` 디렉티브 최상단 선언
- `GlobeProps`, `GlobeConnection`, `GlobeMarker` 인터페이스 export
- Canvas 렌더링 루프: `requestAnimationFrame` 기반
- 피보나치 구(Fibonacci sphere) 1200개 점 생성 (`useEffect`에서 1회)
- Y축/X축 회전, 3D 투영(perspective projection)
- 도시 마커 펄스 애니메이션, 아크 이동 점 애니메이션
- pointer 이벤트 기반 드래그 (setPointerCapture 사용)
- `dotColor`의 `"ALPHA"` 플레이스홀더 동적 교체
- `DEFAULT_GLOBE_MARKERS`, `DEFAULT_GLOBE_CONNECTIONS` export

### Step 3: LandingPage 리디자인 (`src/features/root-page/LandingPage.tsx`)

```tsx
// dynamic import (SSR 비활성화)
const InteractiveGlobe = dynamic(
  () => import("@/shared/ui/interactive-globe").then(m => m.InteractiveGlobe),
  { ssr: false }
)

// 히어로 섹션 2단 레이아웃
<section className="bg-[#00007F] text-white py-12 px-6">
  <div className="max-w-5xl mx-auto flex flex-col md:flex-row min-h-[500px]">
    {/* 좌측: 텍스트 + CTA */}
    <div className="flex-1 flex flex-col justify-center gap-6 md:pr-8">
      <h1 className="text-4xl font-bold tracking-tight font-eluo">
        <span className="text-[#FEFE01]">ELUO</span> AI SKILL HUB
      </h1>
      ...
    </div>
    {/* 우측: 글로브 */}
    <div className="flex-1 flex items-center justify-center min-h-[360px]">
      <InteractiveGlobe size={460} />
    </div>
  </div>
</section>
```

### Step 4: 단위 테스트

```tsx
// src/shared/ui/__tests__/interactive-globe.test.tsx
// - canvas getContext mock
// - 컴포넌트 마운트 후 <canvas> 엘리먼트 존재 확인
// - size prop → canvas style width/height 적용 확인
// - className prop → canvas 클래스 포함 확인
// - pointer 이벤트 핸들러 등록 확인
```

### Step 5: E2E 테스트

```typescript
// src/__tests__/e2e/landing-page.spec.ts
// - 랜딩 페이지 로드 확인 (http://localhost:3000)
// - h1 텍스트 "ELUO AI SKILL HUB" 존재 확인
// - canvas 엘리먼트 표시 확인 (globIsVisible)
// - "시작하기" 버튼 표시 및 클릭 가능 확인
// - 모바일 viewport에서 레이아웃 수직 배치 확인
```

## Complexity Tracking

> 이 기능은 모든 Constitution Check gates를 PASS. 정당화가 필요한 위반 사항 없음.
