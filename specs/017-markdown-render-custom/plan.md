# Implementation Plan: 상세설명 마크다운 렌더링 커스텀

**Branch**: `017-markdown-render-custom` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-markdown-render-custom/spec.md`

## Summary

스킬 상세 팝업의 마크다운 콘텐츠를 노션 스타일로 커스텀 렌더링한다. 핵심 변경:
1. 표(Table)에 border-radius, 헤더 배경색, 셀 경계선 적용
2. 코드블록을 터미널 CLI 스타일(다크 배경 + 언어 헤더 바)로 렌더링
3. YAML 프론트매터 감지 시 정보 카드로 표시
4. 기본 타이포그래피를 노션 스타일로 개선

기존 admin MarkdownPreview는 변경하지 않으며, 스킬 상세 팝업 전용 `NotionStyleMarkdown` 컴포넌트를 새로 생성한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-highlight ^7.0.2, rehype-sanitize ^6.0.0, gray-matter (신규 추가)
**Storage**: N/A (순수 프론트엔드 변경, DB 스키마 변경 없음)
**Testing**: Jest + React Testing Library (유틸리티 함수 단위 테스트)
**Target Platform**: Web (Next.js App Router, 라이트 모드)
**Project Type**: Web application (Next.js)
**Performance Goals**: 마크다운 렌더링 시 시각적 지연 없음
**Constraints**: 기존 admin MarkdownPreview에 영향 없어야 함. highlight.js CSS 충돌 방지.
**Scale/Scope**: 단일 컴포넌트 + CSS + 유틸리티. 5~7개 파일 변경/생성.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | ✅ PASS | 모든 props, 유틸리티 반환값 명시적 타입 정의. `any` 사용 없음 |
| II. Clean Architecture | ✅ PASS | 순수 UI 컴포넌트 + 유틸리티 함수. 도메인/인프라 계층 변경 없음. `src/features/skill-detail/`에 배치 |
| III. Test Coverage | ✅ PASS | `parseFrontmatter` 유틸리티 단위 테스트 작성. 컴포넌트는 시각적 렌더링 테스트 |
| IV. Feature Module Isolation | ✅ PASS | `skill-detail` 모듈 내에서 자체 완결. admin MarkdownPreview와 독립 |
| V. Security-First | ✅ PASS | rehype-sanitize 유지로 XSS 방지. 서버 사이드 변경 없음 |

**Tech Stack Constraints**:
- gray-matter 신규 의존성 추가 필요 → 프론트매터 파싱 용도, 기존 스택에 없는 기능

## Project Structure

### Documentation (this feature)

```text
specs/017-markdown-render-custom/
├── spec.md
├── plan.md              # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── component-api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/features/skill-detail/
├── NotionStyleMarkdown.tsx        # 노션 스타일 마크다운 렌더러 (신규)
├── FrontmatterCard.tsx            # 프론트매터 정보 카드 (신규)
├── notion-markdown.css            # 노션 스타일 커스텀 CSS (신규)
├── SkillDetailGuide.tsx           # import 변경 (기존 수정)
└── ...

src/shared/utils/
└── parse-frontmatter.ts           # 프론트매터 파싱 유틸리티 (신규)

src/shared/utils/__tests__/
└── parse-frontmatter.test.ts      # 유틸리티 단위 테스트 (신규)
```

**Structure Decision**: 기존 `src/features/skill-detail/` 모듈 내에 노션 스타일 마크다운 관련 파일을 배치한다. 프론트매터 파싱 유틸리티는 다른 기능에서도 재사용 가능하므로 `src/shared/utils/`에 위치한다.

## Complexity Tracking

> 신규 의존성 추가 사항

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| gray-matter 패키지 | YAML 프론트매터 파싱 | 정규식 수동 파싱은 YAML 에지케이스(다중 줄 값, 특수문자) 처리 불가 |
