# Research: 로그인 페이지 디자인 리뉴얼

**Branch**: `006-signin-page-design` | **Date**: 2026-03-03

## R-001: framer-motion 통합 전략

**Decision**: framer-motion을 프로젝트 의존성에 추가하되, BackgroundBeamsWithCollision 컴포넌트에서만 사용한다.

**Rationale**:
- BackgroundBeamsWithCollision 컴포넌트는 `motion.div`, `AnimatePresence`, `motion.span`을 사용하며 framer-motion에 직접 의존한다.
- 컴포넌트가 `"use client"` 지시어를 사용하므로 클라이언트 번들에 포함된다.
- Next.js의 dynamic import와 `ssr: false` 옵션으로 서버 사이드 번들에서 제외 가능하다.

**Alternatives considered**:
- CSS 전용 애니메이션: 충돌 감지 및 파티클 폭발 효과의 동적 제어 불가 → 기각
- react-spring: framer-motion과 유사한 번들 크기이며 AnimatePresence 패턴이 없음 → 기각
- Web Animations API 직접 사용: 선언적 패턴 없이 명령형 코드 증가 → 기각

## R-002: 글래스모피즘 구현 방식

**Decision**: Tailwind CSS 유틸리티 클래스와 인라인 스타일을 조합하여 글래스모피즘을 구현한다.

**Rationale**:
- signin.html 레퍼런스의 `.glass-card` 스타일: `background: rgba(255,255,255,0.7)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.3)`
- Tailwind CSS v4에서 `bg-white/70`, `backdrop-blur-[12px]`, `border-white/30` 등으로 직접 표현 가능하다.
- globals.css에 `glass-card` 유틸리티 클래스로 추가하여 재사용성을 높인다.

**Alternatives considered**:
- shadcn Card 컴포넌트 variant 추가: Card 구조에 의존하게 되어 유연성 감소 → 기각
- 별도 CSS 모듈: Tailwind v4 프로젝트에서 CSS 모듈 혼용은 일관성 저하 → 기각

## R-003: 비밀번호 표시/숨기기 토글 구현

**Decision**: 기존 Input 컴포넌트를 래핑하는 방식으로 SigninForm 내부에 토글 로직을 구현한다. lucide-react의 `Eye`/`EyeOff` 아이콘을 사용한다.

**Rationale**:
- 프로젝트에 lucide-react 0.576.0이 이미 설치되어 있다.
- signin.html 레퍼런스에서 Material Symbols의 `visibility` 아이콘을 사용하지만, 프로젝트 일관성을 위해 lucide-react를 사용한다.
- Input 컴포넌트 자체를 수정하지 않고, SigninForm에서 `useState`로 `type="password"` ↔ `type="text"` 토글을 관리한다.

**Alternatives considered**:
- 별도 PasswordInput 컴포넌트 생성: 현재 1곳에서만 사용하므로 과도한 추상화 → 기각
- shadcn Input에 토글 variant 추가: 기존 Input 컴포넌트의 범용성 저하 → 기각

## R-004: 헤더 컴포넌트 배치 전략

**Decision**: 로그인 페이지(`src/app/signin/page.tsx`) 내부에 인라인 헤더를 구현한다.

**Rationale**:
- 현재 프로젝트에 공용 헤더 컴포넌트가 없다.
- 헤더 디자인은 로그인 페이지 전용(우측에 "로그인" 버튼)이므로 범용화하기 어렵다.
- 향후 다른 페이지에서도 유사한 헤더가 필요해지면 그때 `src/shared/ui/`로 분리한다.
- 로고 이미지는 `/public/eluo-logo.svg`를 참조하며, 사용자가 수동으로 배치할 예정이다.

**Alternatives considered**:
- `src/shared/ui/header.tsx`로 공용 컴포넌트 생성: 현재 1곳에서만 사용, YAGNI 원칙 위반 → 기각
- Next.js layout에 헤더 추가: signin/signup 전용 디자인이므로 layout에 넣으면 다른 페이지에 영향 → 기각

## R-005: BackgroundBeamsWithCollision 컴포넌트 타입 안전성

**Decision**: 제공된 컴포넌트 코드를 프로젝트의 TypeScript strict 모드에 맞게 조정한다.

**Rationale**:
- `React.RefObject<HTMLDivElement>` 타입이 React 19에서 `React.RefObject<HTMLDivElement | null>`로 변경되었을 수 있으므로 확인 필요.
- `forwardRef`의 `ref` 파라미터가 사용되지 않지만 타입에 포함되어 있으므로 제거하거나 `_ref`로 명명한다.
- `useEffect` 의존성 배열에 `parentRef`가 빠져 있으므로 추가한다.
- `Math.random()`을 transition duration에 사용하는 부분은 hydration mismatch를 일으킬 수 있으므로 고정값 배열로 대체하거나 클라이언트 전용으로 확인한다.

**Alternatives considered**:
- 컴포넌트를 그대로 복사: strict 모드에서 타입 에러 발생 가능 → 기각
- 컴포넌트를 완전히 재작성: 불필요한 작업, 기존 코드 기반 조정으로 충분 → 기각

## R-006: 배경 그라디언트 + BackgroundBeamsWithCollision 조합

**Decision**: BackgroundBeamsWithCollision의 기본 배경 그라디언트를 브랜드 컬러 그라디언트로 교체한다.

**Rationale**:
- signin.html 레퍼런스의 배경: `radial-gradient(at 0% 0%, rgba(254,254,1,0.15))`, `radial-gradient(at 100% 100%, rgba(0,0,127,0.1))` + 기본 회색(#F0F0F0)
- BackgroundBeamsWithCollision의 기본 배경: `from-white to-neutral-100`
- className prop을 통해 기본 배경을 오버라이드하고, 브랜드 그라디언트를 적용한다.
- 빛줄기 색상(indigo/purple)은 브랜드 navy(#00007F)와 조화를 이루므로 유지한다.

**Alternatives considered**:
- BackgroundBeamsWithCollision 내부 수정: 범용 컴포넌트의 재사용성 저하 → 기각
- 별도 배경 래퍼 추가: 불필요한 DOM 중첩 → 기각
