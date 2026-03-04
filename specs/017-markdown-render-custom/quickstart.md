# Quickstart: 상세설명 마크다운 렌더링 커스텀

**Feature Branch**: `017-markdown-render-custom`
**Date**: 2026-03-04

## 빠른 시작 가이드

### 1. 의존성 설치

```bash
npm install gray-matter
```

### 2. 주요 파일 위치

```text
src/features/skill-detail/
├── NotionStyleMarkdown.tsx    # 노션 스타일 마크다운 렌더러 (신규)
├── FrontmatterCard.tsx        # 프론트매터 정보 카드 (신규)
├── notion-markdown.css        # 노션 스타일 CSS (신규)
├── SkillDetailGuide.tsx       # 기존 파일 수정 (import 변경)
└── ...

src/shared/utils/
├── parse-frontmatter.ts       # 프론트매터 파싱 유틸리티 (신규)
```

### 3. 테스트 시나리오

스킬 상세 팝업에서 확인할 마크다운 샘플:

```markdown
---
version: "2.0.0"
compatibility: "Claude Code 2.x+"
tags: ["automation", "publishing"]
---

# 스킬 사용 가이드

## 기본 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `input` | string | 입력 텍스트 |
| `format` | "html" \| "pdf" | 출력 형식 |
| `verbose` | boolean | 상세 로그 출력 |

## 실행 예시

\```typescript
import { runSkill } from '@eluo/skill-runner';

const result = await runSkill({
  input: "Hello World",
  format: "html",
  verbose: true,
});
\```

> **참고**: 실행 전 환경 변수 설정이 필요합니다.

### 체크리스트
- 의존성 설치 완료
- 환경 변수 설정
- 입력 파일 준비
```

### 4. 기존 admin 영역 영향 없음 확인

`src/features/admin/MarkdownPreview.tsx`는 변경하지 않으며, 스킬 등록/수정 폼의 마크다운 미리보기 스타일이 변하지 않아야 한다.
