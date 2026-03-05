# UI Component Contracts: 랜딩페이지 디자인 수정

**Branch**: `003-landing-page-redesign` | **Date**: 2026-03-03

---

## InteractiveGlobe 컴포넌트 계약

**파일**: `src/shared/ui/interactive-globe.tsx`
**임포트**: `import { InteractiveGlobe } from "@/shared/ui/interactive-globe"`
**유형**: Client Component (`"use client"`)

### Props 계약

```typescript
export interface GlobeConnection {
  from: [number, number]; // [위도(-90~90), 경도(-180~180)]
  to: [number, number];   // [위도(-90~90), 경도(-180~180)]
}

export interface GlobeMarker {
  lat: number;    // 위도 (-90 ~ 90)
  lng: number;    // 경도 (-180 ~ 180)
  label?: string; // 표시 레이블 (생략 시 표시 없음)
}

export interface GlobeProps {
  className?: string;
  size?: number;                  // default: 600
  dotColor?: string;              // default: "rgba(100, 180, 255, ALPHA)"
  arcColor?: string;              // default: "rgba(100, 180, 255, 0.5)"
  markerColor?: string;           // default: "rgba(100, 220, 255, 1)"
  autoRotateSpeed?: number;       // default: 0.002 (라디안/프레임)
  connections?: GlobeConnection[];
  markers?: GlobeMarker[];
}
```

### 렌더링 계약

- 컴포넌트는 단일 `<canvas>` 엘리먼트를 반환한다.
- `size` prop이 canvas의 `style.width`와 `style.height`에 적용된다.
- `className`은 canvas 엘리먼트의 기본 클래스(`w-full h-full cursor-grab active:cursor-grabbing`)에 추가 적용된다.
- `dotColor` 문자열은 `"ALPHA"` 플레이스홀더를 포함해야 하며, 렌더링 시 실제 투명도 값으로 교체된다.

### 이벤트 계약

| 이벤트 | 설명 |
|--------|------|
| `onPointerDown` | 드래그 시작, pointer capture 설정 |
| `onPointerMove` | Y축/X축 회전 업데이트 |
| `onPointerUp` | 드래그 종료 |

### 기본값 내보내기

```typescript
// 재사용 가능한 기본 데이터 내보내기
export const DEFAULT_GLOBE_MARKERS: GlobeMarker[]
export const DEFAULT_GLOBE_CONNECTIONS: GlobeConnection[]
```

---

## LandingPage 컴포넌트 계약

**파일**: `src/features/root-page/LandingPage.tsx`
**임포트**: `import { LandingPage } from "@/features/root-page/LandingPage"`
**유형**: Server Component (기본값 유지)

### Props 계약

```typescript
// Props 없음 — 정적 마케팅 페이지
export function LandingPage(): JSX.Element
```

### 렌더링 구조 계약

```
<main>
  <section.hero>       // bg-[#00007F], text-white, 2단 레이아웃
    <div.left>         // 텍스트 콘텐츠
      <h1.font-eluo>   // "ELUO AI SKILL HUB" — eluofacevf 폰트
      <p>              // 서비스 소개
      <a href="/login"> // 시작하기 CTA
    </div>
    <div.right>        // 글로브 영역
      <InteractiveGlobe size={460} />  // dynamic import, SSR false
    </div>
  </section>
  <section.features>   // bg-brand-light, 기능 카드 3열 그리드
  <footer>             // bg-[#00007F]
</main>
```

### 레이아웃 반응형 계약

| 뷰포트 | 히어로 레이아웃 |
|--------|----------------|
| `md` 이상 (≥768px) | 좌우 2단 flex row |
| `md` 미만 (<768px) | 상하 flex column |

---

## 폰트 토큰 계약

**파일 쌍**: `src/app/layout.tsx` + `src/app/globals.css`

```typescript
// layout.tsx — localFont 설정
const eluo = localFont({
  src: "./font/ELUOFACEVF.ttf",
  variable: "--font-eluo-face",
  display: "swap",
})
// <html className={`${pretendard.variable} ${eluo.variable}`}>
```

```css
/* globals.css @theme inline 추가 토큰 */
--font-eluo: var(--font-eluo-face), sans-serif;
```

**사용 방법**: `<h1 className="font-eluo">` (Tailwind `font-eluo` 유틸리티)
