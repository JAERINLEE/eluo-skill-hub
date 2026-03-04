# Quickstart: 스킬 추가 팝업 디자인 리뉴얼

**Feature Branch**: `012-skill-add-popup-design`
**Date**: 2026-03-04

## 사전 요구사항

- Node.js 18+
- 기존 프로젝트 의존성 설치 완료 (`npm install`)
- Supabase 로컬/원격 연결 설정 완료

## 1. 신규 의존성 설치

```bash
npm install react-markdown@10.1.0 remark-gfm@4.0.1 rehype-sanitize@6.0.0 rehype-highlight@7.0.2
npm install -D @tailwindcss/typography
```

## 2. Tailwind Typography 플러그인 활성화

`src/app/globals.css`에 추가:

```css
@plugin "@tailwindcss/typography";
```

## 3. highlight.js 테마 CSS 임포트

마크다운 미리보기 컴포넌트 또는 레이아웃에서:

```typescript
import 'highlight.js/styles/github.css';
```

## 4. 개발 서버 실행

```bash
npm run dev
```

## 5. 기능 확인

1. `http://localhost:3000/admin/skills` 접속 (관리자 계정 필요)
2. "새 스킬 추가하기" 카드 클릭
3. 모달이 2패널 레이아웃으로 열리는지 확인
4. 좌측 상세 설명 영역에서 .md 파일 업로드
5. 마크다운 미리보기가 서식 적용되어 표시되는지 확인
6. 기존 기능(아이콘, 제목, 카테고리, 템플릿, 저장, 임시저장, 닫기 확인) 정상 동작 확인

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/features/admin/SkillAddForm.tsx` | 폼 컴포넌트 (2패널 레이아웃으로 리팩토링) |
| `src/features/admin/SkillAddModal.tsx` | 모달 래퍼 (스타일 리뉴얼) |
| `src/features/admin/MarkdownPreview.tsx` | 신규 — 마크다운 미리보기 컴포넌트 |
| `src/features/admin/MarkdownFileUpload.tsx` | 신규 — 마크다운 파일 업로드 + 미리보기 통합 |
