# Component API Contracts: 마크다운 렌더링 커스텀

**Feature Branch**: `017-markdown-render-custom`
**Date**: 2026-03-04

## NotionStyleMarkdown Component

스킬 상세 팝업 전용 노션 스타일 마크다운 렌더러.

### Props Interface

```typescript
interface NotionStyleMarkdownProps {
  content: string;
}
```

### Behavior Contract

| Input | Output |
|-------|--------|
| YAML 프론트매터 + 본문이 포함된 마크다운 | 상단에 메타데이터 카드 표시 + 본문 노션 스타일 렌더링 |
| 프론트매터 없는 순수 마크다운 | 메타데이터 카드 미표시 + 본문 노션 스타일 렌더링 |
| 빈 문자열 | 빈 출력 (아무것도 렌더링하지 않음) |

### Rendering Rules

1. **프론트매터 감지**: `---`로 시작하고 두 번째 `---`로 닫히는 최상단 블록
2. **코드블록**: 어두운 배경, 언어 지정 시 헤더 바 표시, 구문 하이라이팅
3. **표**: border-radius, 헤더 배경색, 모든 셀 경계선
4. **인라인 코드**: 밝은 배경 + 컬러 텍스트, 블록 코드와 구분
5. **타이포그래피**: 노션 스타일 제목, 목록, 인용문, 링크

---

## FrontmatterCard Component

프론트매터 메타데이터를 정보 카드로 표시하는 컴포넌트.

### Props Interface

```typescript
interface FrontmatterCardProps {
  metadata: Record<string, unknown>;
}
```

### Behavior Contract

| Input | Output |
|-------|--------|
| `{ version: "1.0", tags: ["a", "b"] }` | key-value 쌍을 그리드/리스트로 표시 |
| `{}` (빈 객체) | 컴포넌트를 렌더링하지 않음 |

### Visual Rules

- 배경: 연한 회색/베이지 (노션 정보 블록 스타일)
- 테두리: 얇은 border + border-radius
- 각 key는 레이블, value는 값으로 표시
- 배열 값은 태그/뱃지 형태로 표시

---

## parseFrontmatter Utility

마크다운 텍스트에서 YAML 프론트매터를 분리하는 유틸리티 함수.

### Function Signature

```typescript
function parseFrontmatter(rawContent: string): {
  metadata: Record<string, unknown> | null;
  content: string;
};
```

### Behavior Contract

| Input | Output |
|-------|--------|
| `"---\nversion: 1.0\n---\n# Hello"` | `{ metadata: { version: "1.0" }, content: "# Hello" }` |
| `"# No frontmatter"` | `{ metadata: null, content: "# No frontmatter" }` |
| `"---\ninvalid yaml: [\n---\n# Body"` | `{ metadata: null, content: "---\ninvalid yaml: [\n---\n# Body" }` (파싱 실패 시 원본 유지) |

---

## SkillDetailGuide 변경

### 변경 전
```typescript
<MarkdownPreview content={markdownContent} />
```

### 변경 후
```typescript
<NotionStyleMarkdown content={markdownContent} />
```

기존 `MarkdownPreview` import를 `NotionStyleMarkdown`으로 교체. admin 영역의 `MarkdownPreview`는 영향 없음.
