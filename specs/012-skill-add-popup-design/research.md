# Research: 스킬 추가 팝업 디자인 리뉴얼

**Feature Branch**: `012-skill-add-popup-design`
**Date**: 2026-03-04

## R-001: 마크다운 렌더링 라이브러리 선택

**Decision**: react-markdown@10.1.0 + remark-gfm@4.0.1 + rehype-sanitize@6.0.0 + rehype-highlight@7.0.2

**Rationale**:
- 사용자 지정 요구사항(React Markdown + remark/rehype 플러그인)에 부합
- react-markdown 10.x는 React 19 및 Next.js 16.x App Router와 완전 호환 (ESM-only)
- remark-gfm: GFM 지원 (테이블, 취소선, 체크박스, 각주)
- rehype-sanitize: XSS 방지를 위한 화이트리스트 기반 HTML sanitize (FR-004 충족)
- rehype-highlight: lowlight 기반 코드 구문 강조 (37개 언어 기본 번들)
- 모든 플러그인이 동기 방식 → `'use client'` 컴포넌트에서 기본 `Markdown` 컴포넌트 사용 가능

**Alternatives considered**:
- MDX: 오버스펙 — 읽기 전용 미리보기에는 불필요한 JSX 컴파일 단계
- marked + DOMPurify: React 통합이 약하고 dangerouslySetInnerHTML 필요
- markdown-it: 플러그인 생태계가 unified 대비 작고 TypeScript 타입 지원 미흡

## R-002: 마크다운 스타일링 전략

**Decision**: @tailwindcss/typography 플러그인 사용 (`prose` 클래스)

**Rationale**:
- Tailwind CSS v4에서 `@plugin "@tailwindcss/typography"` 로 활성화
- `prose` 클래스로 마크다운 렌더 결과물에 일관된 타이포그래피 스타일 제공
- 프로젝트의 Tailwind 기반 스타일링 패턴과 일관성 유지
- 커스텀 CSS 작성량 최소화

**Alternatives considered**:
- 순수 커스텀 CSS: 유지보수 부담 증가, 마크다운 요소별 스타일 누락 위험
- react-markdown components prop만 사용: 모든 요소에 className 수동 지정 필요 → 코드 비대화

## R-003: 클라이언트 사이드 파일 읽기 방식

**Decision**: FileReader API + `readAsText(file, 'utf-8')`

**Rationale**:
- 기존 SkillAddForm.tsx가 File 객체를 상태로 관리하는 패턴과 일관성 유지
- 서버 왕복 없이 즉시 미리보기 제공 (SC-001: 3초 이내 목표 충족)
- 1MB 이하 파일 한정이므로 클라이언트 메모리 부담 없음
- File 객체는 기존대로 FormData 변환 시 서버에 전송

**Alternatives considered**:
- 서버 사이드 렌더링: 불필요한 네트워크 요청, 미리보기 즉시성 저하
- URL.createObjectURL: 텍스트 내용 접근 불가 (바이너리 URL만 생성)

## R-004: 2패널 레이아웃 구현 전략

**Decision**: 기존 SkillAddForm.tsx를 리팩토링하여 좌우 패널 분리, HTML 참조 디자인 적용

**Rationale**:
- stitch-html/admin-add-skill.html 참조: `flex flex-col md:flex-row` 기반 반응형 2패널
- 좌측(flex-1): 아이콘 선택 + 제목 입력 + 상세 설명(마크다운 업로드/미리보기)
- 우측(w-96 고정): 카테고리 + 템플릿 파일 업로드 + 저장/취소 버튼 + 보안 가이드
- 모바일: `md:flex-row` → 기본 `flex-col`로 자동 단일 컬럼 전환
- 기존 폼 상태 관리, dirty 추적, 다이얼로그 흐름은 그대로 유지

**Alternatives considered**:
- 완전 새 컴포넌트 작성: 기존 로직(검증, dirty 추적, 저장) 중복 위험
- CSS Grid: flex 기반보다 복잡하고 HTML 참조와 불일치

## R-005: rehype-sanitize + rehype-highlight 플러그인 순서

**Decision**: `[rehypeSanitize, rehypeHighlight]` 순서, sanitize 스키마에 hljs-* 클래스 허용

**Rationale**:
- rehype-sanitize가 먼저 실행되어 위험 태그 제거
- rehype-highlight가 이후 실행하여 코드 블록에 구문 강조 클래스 추가
- sanitize 스키마에 `className: /^hljs-/` 패턴을 `span`에 허용해야 highlight 클래스가 보존됨
- `code` 요소에도 `className: /^language-./` 허용하여 언어 감지 클래스 보존

**Alternatives considered**:
- highlight 먼저 → sanitize: highlight가 생성한 클래스가 sanitize에 의해 제거될 수 있음
- sanitize 없이 사용: XSS 취약점 노출 (FR-004 위반)

## R-006: 기존 기능과의 통합 포인트

**Decision**: CreateSkillInput 인터페이스 변경 없음, 마크다운 미리보기는 UI 계층에서만 처리

**Rationale**:
- 기존 `CreateSkillInput.markdownFile?: File` 필드가 이미 존재
- 미리보기는 파일 업로드 시 FileReader로 읽은 텍스트를 렌더링하는 순수 UI 기능
- 서버 액션, 유즈케이스, 리포지토리 계층에는 변경 없음
- dirty 상태 추적에 기존 `markdownFile !== undefined` 로직 그대로 사용 가능

**Alternatives considered**:
- 마크다운 내용을 별도 필드로 전달: 불필요한 인터페이스 확장, 서버에서 이미 File에서 텍스트 추출 중
