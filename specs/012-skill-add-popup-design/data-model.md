# Data Model: 스킬 추가 팝업 디자인 리뉴얼

**Feature Branch**: `012-skill-add-popup-design`
**Date**: 2026-03-04

## 변경 사항

이 기능은 **데이터 모델 변경 없음**. 기존 엔티티와 인터페이스를 그대로 사용한다.

## 기존 엔티티 (변경 없음)

### Skill

| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| title | string | 스킬 명칭 (max 100자) |
| description | string &#124; null | 간략 설명 (max 500자) |
| icon | string | 이모지 아이콘 |
| category_id | string | FK → categories |
| status | 'published' &#124; 'drafted' | 공개 상태 |
| author_id | string | FK → auth.users |
| markdown_file_path | string | Supabase Storage 경로 |
| markdown_content | string | 디코딩된 마크다운 텍스트 |
| created_at | timestamp | 생성 시각 |

### Skill Template

| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| skill_id | string | FK → skills |
| file_name | string | 원본 파일명 |
| file_path | string | Storage 경로 |
| file_size | number | 파일 크기 (bytes) |
| file_type | string | '.zip' &#124; '.md' |
| created_at | timestamp | 생성 시각 |

## 기존 인터페이스 (변경 없음)

### CreateSkillInput

```typescript
interface CreateSkillInput {
  readonly icon: string;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly isPublished: boolean;
  readonly markdownFile?: File;        // ← 이미 존재하는 필드, 미리보기에 활용
  readonly templateFiles?: File[];
}
```

### CreateSkillResult

```typescript
type CreateSkillResult =
  | { success: true; skillId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };
```

## 신규 UI 상태 (컴포넌트 레벨)

미리보기 기능을 위해 컴포넌트 내부에서 관리되는 추가 상태:

| State | Type | Description |
|-------|------|-------------|
| markdownContent | string | FileReader로 읽은 마크다운 텍스트 (미리보기용) |
| isPreviewLoading | boolean | 파일 읽기 중 로딩 상태 |
| previewError | string &#124; null | 파일 읽기 오류 메시지 |

이 상태들은 React 컴포넌트의 로컬 상태로만 존재하며, 도메인 모델이나 서버 액션에는 전달되지 않는다.
