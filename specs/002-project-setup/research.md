# Research: 프로젝트 환경 세팅

**Phase 0 Output** | Branch: `002-project-setup` | Date: 2026-03-03

## 1. Tailwind CSS v4 브랜드 컬러 토큰

**Decision**: `globals.css`의 `@theme inline { }` 블록에 CSS custom property로 정의

**Rationale**:
Tailwind CSS v4는 `tailwind.config.js` 없이 CSS 파일 내 `@theme` 디렉티브로
모든 디자인 토큰을 관리한다. `--color-brand-*` 네이밍 컨벤션으로 정의하면
Tailwind가 자동으로 `bg-[#FEFE01]`, `text-[#00007F]`, `border-brand-light`
등의 유틸리티 클래스를 생성한다.

**Token Naming**:

| 토큰 이름 | CSS Custom Property | 헥스 값 | 생성되는 Tailwind 클래스 예시 |
|---------|-------------------|--------|--------------------------|
| brand-yellow | `--color-brand-yellow` | `#FEFE01` | `bg-[#FEFE01]`, `text-[#FEFE01]` |
| brand-navy | `--color-brand-navy` | `#00007F` | `bg-[#00007F]`, `text-[#00007F]` |
| brand-light | `--color-brand-light` | `#F0F0F0` | `bg-brand-light`, `text-brand-light` |

**Alternatives Considered**:
- `tailwind.config.js` 사용: Tailwind v4에서 deprecated, CSS-first 방식 권장
- 인라인 스타일 (`style={{ color: '#FEFE01' }}`): 토큰화 불가, 하드코딩 문제 지속
- CSS variables만 사용 (Tailwind 없이): Tailwind 유틸리티 클래스와의 통합 불가

---

## 2. Next.js localFont API (App Router)

**Decision**: `next/font/local` → `src/app/layout.tsx`에서 초기화, CSS variable로 노출

**Rationale**:
Next.js `next/font/local`은 빌드 타임에 폰트를 최적화하고 preload hint를 자동
삽입한다. CSS variable 방식으로 등록하면 Tailwind v4 `@theme`에서 `var()`로 참조
가능하며, FOUT(Flash of Unstyled Text) 없이 폰트가 적용된다. 외부 CDN 의존 제거로
개인정보 규정(GDPR) 리스크도 감소한다.

**Implementation Pattern**:

```ts
// src/app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: './font/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '100 900',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**globals.css 연동**:
```css
@theme inline {
  --font-sans: var(--font-pretendard), sans-serif;
  --font-display: var(--font-pretendard), sans-serif;
}
```

**Font File Path**: `src/app/font/PretendardVariable.woff2`
(기존 `src/app/fonts/` → `src/app/font/`으로 단수화, 스펙 요구사항 준수)

**Alternatives Considered**:
- Google Fonts / CDN: 외부 네트워크 의존, FR-003 위반
- CSS `@font-face`: Next.js 최적화(preload, font subsetting) 미적용
- `next/font/google` Pretendard 패키지: Pretendard는 Google Fonts에 없음

---

## 3. ESLint v9 Flat Config + `no-explicit-any`

**Decision**: `eslint.config.mjs`에 명시적 rule override 추가

**Rationale**:
현재 `eslint-config-next/typescript`는 `@typescript-eslint` 규칙을 포함하지만
`no-explicit-any`를 error 수준으로 강제하지 않을 수 있다. 컨스티튜션 원칙 I
(타입 안전성)을 자동 강제하려면 이 규칙을 명시적으로 `'error'`로 설정해야 한다.
ESLint v9 flat config에서는 `rules` 객체에 직접 추가한다.

**Config Change**:
```js
// eslint.config.mjs
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([...]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
])
```

**Alternatives Considered**:
- `@typescript-eslint/ban-types` (deprecated): `no-explicit-any`가 더 명확
- `noImplicitAny` (tsconfig only): 빌드 시 체크되지만 IDE 실시간 피드백 없음
- 두 가지 모두 적용: 중복이지만 방어 심도 증가 → 채택 (tsconfig strict + ESLint error)

---

## 4. TypeScript strict 모드

**Decision**: 현재 `tsconfig.json`에 `"strict": true` 이미 적용됨 → 변경 불필요

**Rationale**:
기존 main 브랜치 `tsconfig.json`에 `"strict": true`가 이미 설정되어 있다.
이 설정은 `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` 등을
모두 활성화한다. 추가 설정 불필요.

---

## 5. 현재 코드베이스 마이그레이션 영향

**CDN 폰트 제거**:
- `globals.css` 첫 줄의 `@import url("https://cdn.jsdelivr.net/...")` 제거
- `src/app/layout.tsx`에 localFont import 추가
- 기존 `--font-sans: Pretendard, sans-serif` → `--font-sans: var(--font-pretendard), sans-serif`
- `src/app/font/` 디렉토리 생성 후 woff2 파일 배치

**브랜드 컬러 추가**:
- `globals.css` `@theme inline` 블록에 3개 토큰 추가
- 기존 `--color-primary: #196ee6`는 shadcn/ui 컴포넌트용이므로 유지

**루트 페이지 업데이트**:
- `src/app/page.tsx`는 인증 여부에 따라 LandingPage 또는 DashboardPage를 렌더링
- 브랜드 컬러는 LandingPage 컴포넌트에 반영 (비로그인 사용자가 보는 첫 화면)
- 브랜드 컬러 showcase는 LandingPage를 업데이트하는 방식으로 적용

---

## 결론 (모든 NEEDS CLARIFICATION 해소)

| 항목 | 결정 사항 |
|-----|---------|
| Tailwind 컬러 토큰 방식 | CSS `@theme` + `--color-brand-*` 네이밍 |
| 폰트 경로 | `src/app/font/PretendardVariable.woff2` |
| 폰트 등록 방식 | `next/font/local` + CSS variable `--font-pretendard` |
| ESLint 강제 방식 | `rules` 블록에 `no-explicit-any: error` 추가 |
| TypeScript strict | 이미 적용됨, 변경 없음 |
| LandingPage 브랜드 컬러 | `bg-[#FEFE01]/navy/light` 클래스 사용 |
