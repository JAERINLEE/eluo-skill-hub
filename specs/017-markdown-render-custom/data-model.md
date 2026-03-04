# Data Model: 상세설명 마크다운 렌더링 커스텀

**Feature Branch**: `017-markdown-render-custom`
**Date**: 2026-03-04

## Overview

이 기능은 순수 프론트엔드 렌더링 변경이므로 데이터베이스 스키마 변경은 없다. 기존 `skills.markdown_content` 필드의 텍스트를 클라이언트에서 파싱하고 스타일링하는 것이 핵심이다.

## Existing Entities (변경 없음)

### Skills
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| markdown_content | text (nullable) | 마크다운 원본 텍스트. 선택적으로 YAML 프론트매터 포함 가능 |

## Client-Side Data Structures (신규)

### ParsedMarkdown
마크다운 콘텐츠를 프론트매터와 본문으로 분리한 클라이언트 전용 구조체.

| Field | Type | Description |
|-------|------|-------------|
| metadata | Record<string, string> 또는 null | YAML 프론트매터에서 파싱된 key-value 쌍. 프론트매터 없으면 null |
| content | string | 프론트매터를 제거한 순수 마크다운 본문 |

### Frontmatter Format 예시
```yaml
---
version: "1.2.0"
compatibility: "Claude Code 2.x+"
tags: ["automation", "design"]
author: "Team Eluo"
---

# 스킬 사용 가이드
본문 내용...
```

## Database Changes

없음. 이 기능은 순수 프론트엔드 렌더링 개선이다.
