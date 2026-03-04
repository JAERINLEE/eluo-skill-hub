# Server Actions Contract: 016-skill-detail-popup

**File**: `src/app/(portal)/dashboard/actions.ts` (기존 파일에 추가)
**Auth**: 모든 액션은 Supabase server client로 세션 검증 필수

---

## 1. `getSkillDetailAction`

**목적**: 모달 오픈 시 스킬 전체 상세 정보 조회

```typescript
async function getSkillDetailAction(
  skillId: string
): Promise<GetSkillDetailResult>
```

**입력 유효성**:
- `skillId`: 비어있지 않은 string (uuid)

**처리 흐름**:
1. Supabase server client로 세션 확인
2. `GetSkillDetailUseCase.execute(skillId)` 호출
3. `skills` 조회 + `profiles`(author) join + `skill_templates` join + AVG(rating) 집계

**성공 응답**: `{ success: true, skill: SkillDetailPopup }`
**실패 응답**: `{ success: false, error: string }`

---

## 2. `getSkillFeedbacksAction`

**목적**: 스킬의 피드백 목록(+ 각 피드백의 댓글) 조회

```typescript
async function getSkillFeedbacksAction(
  skillId: string
): Promise<GetFeedbacksResult>
```

**처리 흐름**:
1. 세션 확인
2. `GetFeedbacksUseCase.execute(skillId)` 호출
3. `skill_feedback_logs` + `profiles`(user) join + `feedback_replies` + `profiles`(reply user) join
4. 최신순 정렬

**성공 응답**: `{ success: true, feedbacks: FeedbackWithReplies[] }`

---

## 3. `submitFeedbackAction`

**목적**: 별점 + 텍스트 피드백 제출

```typescript
async function submitFeedbackAction(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResult>
```

**입력 유효성**:
- `skillId`: 비어있지 않은 string
- `rating`: 정수 1-5 (필수)
- `comment`: string | undefined (선택)

**처리 흐름**:
1. 세션 확인 → userId 추출
2. `SubmitFeedbackUseCase.execute(userId, input)` 호출
3. `skill_feedback_logs`에 INSERT
4. 삽입된 피드백 + replies(초기 빈 배열) 반환

**성공 응답**: `{ success: true, feedback: FeedbackWithReplies }`
**실패**: 평점 범위 오류 시 `{ success: false, error: '평점은 1-5 사이여야 합니다.' }`

---

## 4. `submitFeedbackReplyAction`

**목적**: 피드백에 댓글 등록

```typescript
async function submitFeedbackReplyAction(
  input: SubmitReplyInput
): Promise<SubmitReplyResult>
```

**입력 유효성**:
- `feedbackId`: 비어있지 않은 string
- `content`: 비어있지 않은 string

**처리 흐름**:
1. 세션 확인 → userId 추출
2. `SubmitReplyUseCase.execute(userId, input)` 호출
3. `feedback_replies`에 INSERT
4. 삽입된 댓글 + userName 반환

**성공 응답**: `{ success: true, reply: FeedbackReply }`
**실패**: 빈 내용 시 `{ success: false, error: '댓글 내용을 입력해주세요.' }`

---

## 5. `getTemplateDownloadUrlAction`

**목적**: 역할 검증 후 템플릿 파일 signed URL 반환

```typescript
async function getTemplateDownloadUrlAction(
  templateId: string
): Promise<GetTemplateDownloadResult>
```

**처리 흐름**:
1. 세션 확인 → userId 추출
2. `profiles` + `roles` 조인으로 현재 사용자 역할 조회
3. `roles.name === 'viewer'` → `{ success: false, error: '...', isViewerBlocked: true }` 반환
4. `skill_templates`에서 `file_path` 조회
5. Supabase Storage signed URL 생성 (유효시간 60초)
6. URL + fileName 반환

**성공 응답**: `{ success: true, signedUrl: string, fileName: string }`
**뷰어 차단**: `{ success: false, error: '템플릿 다운로드는 뷰어 역할에서 사용할 수 없습니다.', isViewerBlocked: true }`
