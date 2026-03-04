# Research: 어드민 페이지 최적화

**Input**: Technical Context unknowns from plan.md
**Date**: 2026-03-04

## R1: 파일 처리 병렬화 전략 (Promise.all)

**Decision**: `supabase-admin-repository.ts`의 `createSkill()`, `updateSkill()`, `deleteSkill()` 내 순차적 파일 처리를 `Promise.all`로 병렬화

**Rationale**:
- Supabase Storage API는 동시 업로드/삭제 요청을 지원
- 각 파일 작업은 독립적이므로 순서 의존성 없음
- `Promise.all` 사용 시 가장 오래 걸리는 단일 작업 시간으로 수렴 (O(max) vs O(sum))
- 템플릿 파일 3개 기준 이론적 3배 속도 개선 (실제 30%+ 목표)

**Alternatives considered**:
- `Promise.allSettled`: 개별 실패 허용이 필요한 경우 적합하나, 현재 코드는 실패 시 전체 에러를 반환하는 패턴이므로 `Promise.all` 유지
- Sequential with early-exit: 현재 구현. 불필요한 대기 시간 발생

**Implementation details**:
- `createSkill()`: 마크다운 업로드 + 템플릿 파일들 업로드를 `Promise.all`로 묶음
- `updateSkill()`: 기존 파일 삭제들을 `Promise.all` → 새 파일 업로드들을 `Promise.all` (삭제 후 업로드 순서는 유지)
- `deleteSkill()`: 피드백 삭제 + 템플릿 파일 삭제 + 마크다운 파일 삭제를 `Promise.all`로 묶은 뒤 → DB 레코드 삭제 (데이터 무결성: 파일 정리 후 레코드 삭제)

---

## R2: revalidatePath 누락 수정 범위

**Decision**: `createSkill`, `updateSkill` 서버 액션에 `revalidatePath('/admin/skills')` + `revalidatePath('/admin')` 추가, `updateMemberRole`에 `revalidatePath('/admin/members')` + `revalidatePath('/admin')` 추가

**Rationale**:
- `deleteSkill`은 이미 `revalidatePath('/admin/skills')` 호출 중 — 패턴 통일
- `/admin` 경로도 무효화하여 어드민 대시보드 통계 반영
- Next.js App Router에서 `revalidatePath`는 해당 경로의 서버 컴포넌트 캐시를 무효화

**Alternatives considered**:
- `revalidateTag` 사용: 태그 기반 무효화는 세밀한 제어 가능하나, 현재 프로젝트에서 태그 시스템을 사용하지 않으므로 기존 `revalidatePath` 패턴과 일관성 유지
- 클라이언트 사이드 `router.refresh()`: 서버 액션에서 이미 `revalidatePath`로 처리하는 것이 서버 사이드에서 더 효율적

---

## R3: NotionStyleMarkdown 공유 컴포넌트 이동

**Decision**: `src/features/skill-detail/NotionStyleMarkdown.tsx` + `notion-markdown.css`를 `src/shared/components/`로 이동

**Rationale**:
- 헌법 원칙 IV (Feature Module Isolation): `src/features/admin/`에서 `src/features/skill-detail/`을 직접 import하면 크로스 모듈 의존 발생
- `src/shared/`는 모든 feature 모듈에서 공유 가능한 공간
- 이동 후 `src/features/skill-detail/SkillDetailGuide.tsx`와 `src/features/admin/MarkdownPreview.tsx` 모두 `src/shared/components/NotionStyleMarkdown`에서 import

**Alternatives considered**:
- admin에서 skill-detail 직접 import: 헌법 위반 (크로스 모듈 import)
- NotionStyleMarkdown 복사: 코드 중복 발생, 유지보수 부담

---

## R4: verifyAdmin() 최적화 범위

**Decision**: 수정 팝업 페이지(`@modal/(.)edit/[id]/page.tsx`) 서버 컴포넌트에서 `verifyAdmin()` 1회 호출로 통합. 클라이언트에서 호출 가능한 서버 액션(`createSkill`, `updateSkill`, `deleteSkill`)은 독립 인증 유지.

**Rationale**:
- 수정 팝업 페이지는 서버 컴포넌트이므로, 한 번 인증하면 같은 렌더 사이클 내에서 안전
- 현재 `getSkillById`와 `getCategories`를 각각 호출하면서 각각 `verifyAdmin()` 실행 → 중복
- 서버 액션은 클라이언트에서 직접 호출 가능하므로, 각 액션마다 독립 인증은 보안상 필수 (헌법 원칙 V)

**Alternatives considered**:
- 모든 서버 액션의 verifyAdmin 제거하고 미들웨어로 통합: Next.js App Router에서 서버 액션은 미들웨어를 거치지만, 서버 액션 내부 인증이 더 안전
- verifyAdmin 결과 캐싱: 렌더 사이클 내 Supabase 클라이언트는 동일 인스턴스를 재사용하므로 이미 일부 캐싱 효과 있으나, 명시적 호출 횟수 자체를 줄이는 것이 더 명확

---

## R5: 어드민 MarkdownPreview 교체 전략

**Decision**: `src/features/admin/MarkdownPreview.tsx`의 내부 구현을 `NotionStyleMarkdown` 컴포넌트로 교체

**Rationale**:
- 현재 MarkdownPreview는 `react-markdown` + GitHub light 테마의 간단한 래퍼
- NotionStyleMarkdown은 frontmatter 카드, 다크 코드 블록, 노션 색상 팔레트 등 풍부한 스타일 제공
- MarkdownPreview의 외부 인터페이스(props)는 유지하고 내부만 교체하면 호출 측 변경 최소화

**Alternatives considered**:
- MarkdownPreview를 삭제하고 직접 NotionStyleMarkdown 사용: 가능하나, admin 모듈 내에서 MarkdownPreview라는 이름으로 사용하는 호출 측이 여러 곳일 수 있으므로 래퍼 유지가 안전
- 스타일만 CSS override: 구조적 차이(frontmatter 처리 등)가 있으므로 CSS만으로는 해결 불가
