# Implementation Plan: 스킬 추가 팝업 디자인 리뉴얼

**Branch**: `012-skill-add-popup-design` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-skill-add-popup-design/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

기존 스킬 추가 모달을 stitch-html/admin-add-skill.html 기반의 2패널 레이아웃으로 리뉴얼하고, 상세 설명 영역에 마크다운 파일 업로드 시 react-markdown 기반 실시간 미리보기 기능을 추가한다. 데이터 모델 변경 없이 UI 계층에서만 처리하며, rehype-sanitize로 XSS를 방지한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, react-markdown@10.1.0, remark-gfm@4.0.1, rehype-sanitize@6.0.0, rehype-highlight@7.0.2, @tailwindcss/typography, Shadcn UI, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — 기존 skills, skill_templates 테이블 변경 없음
**Testing**: Playwright (E2E) + React Testing Library (단위)
**Target Platform**: Web (데스크톱 1024px+ / 모바일 768px-)
**Project Type**: Web Application (Next.js App Router)
**Performance Goals**: 마크다운 파일 업로드 후 3초 이내 미리보기 렌더링
**Constraints**: .md 파일 1MB 이하, 클라이언트 사이드 파일 읽기
**Scale/Scope**: 관리자 전용 기능, 단일 모달 UI 리뉴얼

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 신규 의존성 모두 TypeScript 타입 내장, `any` 미사용. react-markdown `Components` 타입 활용 |
| II. Clean Architecture | PASS | 도메인/애플리케이션 계층 변경 없음. 신규 코드는 모두 UI 계층(`src/features/admin/`) |
| III. Test Coverage | PASS | E2E 테스트(마크다운 업로드/미리보기), 단위 테스트(MarkdownPreview 컴포넌트) 포함 예정 |
| IV. Feature Module Isolation | PASS | admin 모듈 내부에서만 변경. 공유 컴포넌트 없음 |
| V. Security-First | PASS | rehype-sanitize로 마크다운 내 XSS 방지, 기존 서버사이드 권한 검증 유지 |
| Tech Stack | PASS | react-markdown + remark/rehype는 사용자 지정 요구사항. @tailwindcss/typography는 Tailwind 생태계 내 공식 플러그인 |

**Post-Phase 1 Re-check**: 모든 원칙 통과. 데이터 모델 변경 없으므로 RLS 영향 없음.

## Project Structure

### Documentation (this feature)

```text
specs/012-skill-add-popup-design/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── features/admin/
│   ├── SkillAddModal.tsx              # 수정: 모달 스타일 리뉴얼 (glass-overlay, modal-gradient)
│   ├── SkillAddForm.tsx               # 수정: 2패널 레이아웃 리팩토링
│   ├── MarkdownPreview.tsx            # 신규: react-markdown 기반 마크다운 렌더링 컴포넌트
│   ├── MarkdownFileUpload.tsx         # 신규: 마크다운 파일 업로드 + 미리보기 통합 컴포넌트
│   ├── TemplateFileUpload.tsx         # 기존 유지
│   ├── DraftSaveDialog.tsx            # 기존 유지
│   ├── CloseConfirmDialog.tsx         # 기존 유지
│   └── ...
├── app/
│   └── globals.css                    # 수정: @plugin "@tailwindcss/typography" 추가
└── admin/domain/types.ts              # 변경 없음
```

**Structure Decision**: 기존 admin 모듈 내 UI 컴포넌트만 수정/추가. 도메인·애플리케이션·인프라 계층 변경 없음. 신규 컴포넌트(MarkdownPreview, MarkdownFileUpload)는 features/admin/ 디렉토리에 배치하여 모듈 격리 원칙 준수.

## Complexity Tracking

> Constitution Check 위반 없음 — 이 섹션은 해당 없음.
