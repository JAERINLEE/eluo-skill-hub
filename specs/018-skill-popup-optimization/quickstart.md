# Quickstart: 스킬 팝업 렌더링 최적화

**Branch**: `018-skill-popup-optimization` | **Date**: 2026-03-04

## Overview

스킬 상세 팝업의 로딩 속도를 최적화합니다. 데이터베이스 쿼리 병렬화, 피드백 페이지네이션, 마크다운 렌더링 효율화를 통해 체감 속도를 40% 이상 개선합니다.

## Affected Files

### Infrastructure Layer
- `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts` — 쿼리 병렬화, 피드백 limit 추가

### Application Layer
- `src/skill-detail/application/get-feedbacks-use-case.ts` — 페이지네이션 파라미터 지원
- `src/skill-detail/application/ports.ts` — 인터페이스에 페이지네이션 시그니처 추가

### Domain Layer
- `src/skill-detail/domain/types.ts` — `PaginatedFeedbacks` 타입 추가

### Feature Components
- `src/features/skill-detail/NotionStyleMarkdown.tsx` — rehype-highlight 조건부 적용
- `src/features/skill-detail/SkillDetailModal.tsx` — 요청 취소 로직, 피드백 "더 보기" 지원

### Server Actions
- `src/app/(portal)/dashboard/actions.ts` — 페이지네이션 파라미터 전달

## Key Changes

1. **쿼리 병렬화**: `getSkillDetailPopup` 내 author/templates/stats 쿼리를 `Promise.all`로 병렬 실행
2. **피드백 페이지네이션**: `.limit(20)` 적용 + `PaginatedFeedbacks` 반환 타입
3. **마크다운 최적화**: `rehypeHighlight` 조건부 적용 (코드 블록 존재 시에만)
4. **요청 취소**: `AbortController` 기반 cleanup으로 race condition 방지

## Prerequisites

- 기존 스킬 팝업이 정상 동작하는 상태
- DB 스키마 변경 없음
- 새로운 의존성 추가 없음
