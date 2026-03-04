# Research: 상세설명 마크다운 렌더링 커스텀

**Feature Branch**: `017-markdown-render-custom`
**Date**: 2026-03-04

## R-001: 노션 스타일 마크다운 렌더링 접근법

### Decision
기존 admin `MarkdownPreview` 컴포넌트를 유지하고, 스킬 상세 팝업 전용 `NotionStyleMarkdown` 컴포넌트를 별도 생성한다. 동일한 `react-markdown` + `remark-gfm` + `rehype-sanitize` + `rehype-highlight` 스택을 사용하되, 커스텀 컴포넌트와 CSS를 노션 스타일에 맞게 재정의한다.

### Rationale
- FR-012에서 기존 admin 마크다운 미리보기에 영향을 주지 않을 것을 요구
- 동일한 라이브러리 스택을 재사용하므로 번들 크기 증가 없음
- 컴포넌트 분리로 admin과 사용자 뷰의 스타일을 독립적으로 관리 가능

### Alternatives Considered
1. **기존 MarkdownPreview에 props로 테마 전환**: 단일 컴포넌트로 관리 가능하나, 조건부 스타일링이 복잡해지고 기존 admin 렌더링에 영향을 줄 위험
2. **CSS Module/Tailwind 클래스 오버라이드만으로 처리**: 부모 래퍼 클래스를 통해 스타일만 변경하는 방법. 코드블록 언어 헤더 바 등 DOM 구조 변경이 필요한 경우 대응 불가

---

## R-002: 코드블록 다크 테마 선택

### Decision
`highlight.js/styles/github-dark.css`를 스킬 상세 팝업 전용 코드블록에 사용한다.

### Rationale
- 프로젝트에 이미 highlight.js v11.11.0이 설치되어 있으며, `github-dark.css` 테마가 포함됨
- GitHub Dark 테마는 개발자에게 익숙한 배색이며, 노션의 코드블록 다크 테마와도 유사
- admin의 기존 `github.css`(light) 테마와 CSS 충돌 방지를 위해 스코핑 필요

### Alternatives Considered
1. **atom-one-dark.css**: 인기 있는 다크 테마이나 노션 스타일과는 다소 거리가 있음
2. **vs2015.css**: VS Code 스타일이나 배경이 너무 어두움
3. **커스텀 CSS**: 완전한 제어 가능하나 유지보수 비용이 높음

### CSS 스코핑 전략
`github-dark.css`를 직접 import하면 admin MarkdownPreview의 `github.css`와 충돌한다. 해결 방법:
- 스킬 상세 마크다운 래퍼에 `.notion-markdown` 클래스를 부여
- `github-dark.css`의 스타일을 `.notion-markdown` 스코프 안에서만 적용되도록 CSS를 커스터마이징하거나, `<pre>` 태그에 직접 다크 배경 + 색상을 인라인/클래스로 적용

---

## R-003: YAML 프론트매터 파싱 방법

### Decision
`gray-matter` 라이브러리를 사용하여 YAML 프론트매터를 파싱한다.

### Rationale
- gray-matter는 Node.js/브라우저 환경 모두 지원하는 가장 널리 사용되는 프론트매터 파서
- 주간 다운로드 500만+ 로 안정성 검증됨
- `---` 구분자 감지, YAML 파싱, 본문 분리를 한 번에 처리
- 타입 정의(@types/gray-matter 아님, gray-matter 자체에 TS 타입 포함 아님 → 별도 타입 래퍼 필요)

### Alternatives Considered
1. **정규식 수동 파싱**: 의존성 없이 처리 가능하나 YAML 파싱 에지케이스(다중 줄 값, 특수문자) 처리 어려움
2. **remark-frontmatter + remark-mdx-frontmatter**: remark 플러그인 체인에서 처리. react-markdown의 rehype-sanitize와 충돌 가능성 있고 설정이 복잡
3. **js-yaml 직접 사용**: 정규식으로 `---` 블록만 분리 후 js-yaml로 파싱. gray-matter가 이 과정을 단일 API로 제공하므로 불필요한 수동 작업

---

## R-004: 노션 스타일 표(Table) 디자인 패턴

### Decision
CSS `border-collapse: separate` + `border-spacing: 0` + `overflow: hidden` + `border-radius` 패턴을 사용한다.

### Rationale
- `border-collapse: collapse`에서는 `border-radius`가 적용되지 않으므로 `separate` 모드 필요
- `border-spacing: 0`으로 셀 간격을 없애 `collapse`와 동일한 시각적 효과
- 래퍼 div에 `overflow: hidden` + `border-radius`를 적용하여 표 모서리를 둥글게 처리
- 노션 표 스타일 참고: 헤더 행 배경색 `#F7F6F3`(노션 기본), 셀 보더 `#E9E8E5`

### 구현 세부사항
- 래퍼: `overflow-hidden rounded-xl border border-slate-200`
- thead th: `bg-slate-100 text-left font-semibold text-sm border-b border-slate-200`
- td: `border-b border-r border-slate-200 last:border-r-0`
- 모든 셀: `px-4 py-3`

---

## R-005: 코드블록 언어 헤더 바 구현

### Decision
react-markdown의 커스텀 `pre` + `code` 컴포넌트에서 `className`으로부터 언어명을 추출하여 헤더 바를 동적으로 렌더링한다.

### Rationale
- `rehype-highlight`는 코드블록의 `<code>` 태그에 `language-xxx` 클래스를 추가
- 커스텀 `pre` 컴포넌트에서 children의 `className`을 파싱하여 언어명 추출 가능
- 별도 remark/rehype 플러그인 불필요

### 구현 패턴
```text
<div className="code-block-wrapper rounded-xl overflow-hidden">
  <div className="code-header bg-[#2d2d2d] px-4 py-2 text-xs text-gray-400 font-mono">
    {languageName}
  </div>
  <pre className="bg-[#1e1e1e] p-4 overflow-x-auto">
    <code className="language-xxx">...</code>
  </pre>
</div>
```

---

## R-006: CSS 스코핑과 Tailwind Typography 플러그인 활용

### Decision
Tailwind `@tailwindcss/typography` 플러그인의 `prose` 클래스를 기반으로 하되, `.notion-markdown` 스코프 내에서 CSS 커스텀 프로퍼티와 Tailwind 유틸리티 클래스를 오버라이드한다.

### Rationale
- 프로젝트에 이미 `@tailwindcss/typography`가 설치 및 활성화되어 있음
- `prose` 클래스는 기본 타이포그래피(제목, 목록, 인용문 등)의 베이스라인 제공
- `.notion-markdown .prose` 스코프로 스킬 상세 전용 오버라이드 적용
- admin의 `MarkdownPreview`는 별도 컴포넌트이므로 영향 없음

### 노션 스타일 타이포그래피 참고값
- h1: `text-3xl font-bold mt-8 mb-4`
- h2: `text-2xl font-bold mt-6 mb-3`
- h3: `text-xl font-semibold mt-5 mb-2`
- blockquote: 좌측 3px 세로 바 (border-l-3) + 연한 배경 (bg-slate-50) + 이탤릭 해제
- ul/ol: 좌측 패딩 + 명확한 마커 스타일
- hr: 연한 경계선 (border-slate-200)
