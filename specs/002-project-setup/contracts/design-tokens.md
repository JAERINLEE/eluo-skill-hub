# Contract: Design Token API

**Type**: CSS Custom Property + Tailwind Utility Class Contract
**Owner**: `src/app/globals.css` (정의) / `src/app/layout.tsx` (폰트 등록)
**Consumers**: 모든 컴포넌트 (`src/features/`, `src/shared/ui/`)

---

## 브랜드 컬러 토큰 계약

아래 토큰들은 `globals.css` `@theme inline` 블록에서 정의된다.
컴포넌트는 반드시 Tailwind 유틸리티 클래스 또는 CSS `var()` 방식으로만 사용해야 한다.
헥스 코드 직접 사용은 컨스티튜션 위반이다.

### 정의 (globals.css)

```css
@theme inline {
  --color-brand-yellow: #FEFE01;
  --color-brand-navy:   #00007F;
  --color-brand-light:  #F0F0F0;
}
```

### 사용 계약 (Tailwind Utility Classes)

| 용도 | 클래스 패턴 | 예시 |
|-----|-----------|-----|
| 배경색 | `bg-brand-{token}` | `bg-[#FEFE01]`, `bg-[#00007F]`, `bg-brand-light` |
| 텍스트색 | `text-brand-{token}` | `text-[#FEFE01]`, `text-[#00007F]`, `text-brand-light` |
| 테두리색 | `border-brand-{token}` | `border-brand-yellow`, `border-brand-navy` |
| 링 색상 | `ring-brand-{token}` | `ring-brand-navy` |
| 투명도 조합 | `bg-brand-{token}/{opacity}` | `bg-[#FEFE01]/20`, `bg-[#00007F]/10` |

### CSS Variable 직접 참조 (컴포넌트에서 제한적 허용)

```css
/* 허용: inline style에서 var() 사용 */
style={{ color: 'var(--color-brand-navy)' }}

/* 금지: 헥스 하드코딩 */
style={{ color: '#00007F' }}
```

---

## 폰트 토큰 계약

### 정의 (layout.tsx → globals.css)

```ts
// src/app/layout.tsx
const pretendard = localFont({
  src: './font/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '100 900',
})
```

```css
/* src/app/globals.css */
@theme inline {
  --font-sans:    var(--font-pretendard), sans-serif;
  --font-display: var(--font-pretendard), sans-serif;
}
```

### 사용 계약 (Tailwind Utility Classes)

| 용도 | 클래스 | 동작 |
|-----|-------|-----|
| 기본 텍스트 | `font-sans` | Pretendard Variable (100–900) |
| 헤딩/강조 | `font-display` | Pretendard Variable |
| 폰트 굵기 | `font-{100~900}` | Variable font 지원 |

**전역 기본**: `body`에 `font-sans` 적용 → 모든 컴포넌트 자동 상속.

---

## ESLint Rule 계약

| Rule | Level | 위반 시 |
|------|-------|--------|
| `@typescript-eslint/no-explicit-any` | `error` | 빌드/린트 실패 |
| TypeScript `strict: true` | compiler error | `tsc --noEmit` 실패 |

### 준수 예시

```ts
// ✅ 올바른 사용
function processSkill(skill: Skill): string { ... }

// ❌ 컨스티튜션 위반 (ESLint error)
function processSkill(skill: any): string { ... }

// ✅ 타입 불명확 시 올바른 대안
function parseResponse(data: unknown): Skill {
  if (!isSkill(data)) throw new Error('Invalid skill')
  return data
}
```
