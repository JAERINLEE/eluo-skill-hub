# Implementation Plan: 스킬 버전 관리 및 태그 기능

**Branch**: `025-skill-version-tags` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-skill-version-tags/spec.md`

## Summary

관리자가 스킬 추가/수정 시 버전 번호와 태그를 입력할 수 있도록 기능을 확장한다. DB에 version 컬럼, 버전 이력 테이블, 태그 테이블, 스킬-태그 조인 테이블을 추가하고, 프론트엔드의 추가/수정 폼, 대시보드 카드, 상세 팝업에 버전 및 태그 표시를 구현한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, Shadcn UI, Tailwind CSS v4, lucide-react
**Storage**: Supabase (PostgreSQL) — skills, tags, skill_tags, skill_version_history 테이블
**Testing**: Playwright (E2E) + React Testing Library (unit)
**Target Platform**: Web (Vercel 배포)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 태그/버전 포함 스킬 로드 1초 이내
**Constraints**: 기존 skills 데이터 마이그레이션 필요, RLS 정책 적용 필수
**Scale/Scope**: 12개 기존 스킬, 태그 전역 풀 관리

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 새 타입 명시적 정의, `any` 사용 없음 |
| II. Clean Architecture | PASS | admin 도메인 내 domain/application/infrastructure 계층 준수 |
| III. Test Coverage | PASS | 새 도메인 로직 및 E2E 플로우 테스트 포함 계획 |
| IV. Feature Module Isolation | PASS | admin 모듈 내부 확장, 공유 타입은 shared/에 배치 |
| V. Security-First | PASS | 새 테이블 RLS 정책 적용, 관리자 권한 서버사이드 검증 |

## Project Structure

### Documentation (this feature)

```text
specs/025-skill-version-tags/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── admin/
│   ├── domain/types.ts              # CreateSkillInput, UpdateSkillInput, SkillDetail에 version, tags 추가
│   ├── application/
│   │   ├── create-skill-use-case.ts # 태그/버전 처리 추가
│   │   └── update-skill-use-case.ts # 태그/버전/이력 처리 추가
│   └── infrastructure/
│       └── supabase-admin-repository.ts  # 태그/버전 CRUD 쿼리 추가
├── dashboard/
│   ├── domain/types.ts              # DashboardSkillCard에 tags, version 추가
│   └── infrastructure/
│       └── supabase-dashboard-repository.ts  # 태그 조인 쿼리 추가
├── skill-detail/
│   ├── domain/types.ts              # SkillDetailPopup에 version, tags 추가
│   └── infrastructure/
│       └── supabase-skill-detail-repository.ts  # 태그/버전 조인 쿼리 추가
├── bookmark/
│   └── infrastructure/
│       └── supabase-bookmark-repository.ts  # 태그 조인 쿼리 추가
├── features/
│   ├── admin/
│   │   ├── SkillAddForm.tsx         # 버전 입력 필드, 태그 입력 UI 추가
│   │   ├── SkillCard.tsx            # 태그 표시 추가
│   │   ├── TagInput.tsx             # 새 컴포넌트: 태그 칩 입력 UI
│   │   ├── VersionHistoryList.tsx   # 새 컴포넌트: 버전 이력 목록
│   │   └── DraftSaveDialog.tsx      # version, tags FormData 추가
│   ├── dashboard/
│   │   └── DashboardSkillCard.tsx   # 태그 표시 추가
│   └── skill-detail/
│       ├── SkillDetailHeader.tsx    # 버전 표시 추가
│       └── SkillDetailTags.tsx      # 새 컴포넌트: 태그 목록 표시
├── app/
│   └── admin/skills/
│       └── actions.ts              # version, tags FormData 파싱 추가
└── shared/
    └── ui/
        └── tag-chip.tsx            # 새 컴포넌트: 재사용 태그 칩 UI
```

**Structure Decision**: 기존 admin 모듈 구조를 확장. 태그 칩 UI는 대시보드/상세 등 여러 곳에서 사용하므로 `shared/ui/`에 배치. 태그 입력 로직은 admin 전용이므로 `features/admin/`에 배치.

## Complexity Tracking

> 위반 사항 없음. 기존 아키텍처 패턴을 그대로 따른다.
