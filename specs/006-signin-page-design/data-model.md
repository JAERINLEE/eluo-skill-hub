# Data Model: 로그인 페이지 디자인 리뉴얼

**Branch**: `006-signin-page-design` | **Date**: 2026-03-03

## Overview

이 피처는 순수 UI/UX 변경으로, 데이터 모델에 변경이 없다. 기존 인증 엔티티를 참조용으로 문서화한다.

## Existing Entities (참조용, 변경 없음)

### SigninActionState

기존 서버 액션 상태 타입. 변경 없음.

- **error**: 에러 메시지 문자열 (빈 문자열이면 에러 없음)
- **사용처**: `src/app/signin/actions.ts`, `src/features/auth/SigninForm.tsx`

### SigninForm 클라이언트 상태

| 상태 | 타입 | 용도 |
|------|------|------|
| state (from useActionState) | SigninActionState | 서버 액션 응답 상태 |
| serverErrorVisible | boolean | 서버 에러 메시지 표시 여부 |
| validationErrors | ValidationErrors | 클라이언트 검증 에러 |

### 신규 클라이언트 상태 (추가 예정)

| 상태 | 타입 | 용도 |
|------|------|------|
| showPassword | boolean | 비밀번호 표시/숨기기 토글 |

## UI Component Props (신규)

### BackgroundBeamsWithCollision

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | React.ReactNode | Yes | 배경 위에 렌더링할 콘텐츠 |
| className | string | No | 추가 CSS 클래스 (배경 색상 오버라이드 등) |

### BeamOptions (내부 타입)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| initialX | number | 0 | 빛줄기 시작 X 좌표 |
| translateX | number | 0 | 빛줄기 이동 X 좌표 |
| initialY | number | -200 | 빛줄기 시작 Y 좌표 (px) |
| translateY | number | 1800 | 빛줄기 이동 Y 좌표 (px) |
| rotate | number | 0 | 회전 각도 |
| className | string | - | 빛줄기 크기 클래스 |
| duration | number | 8 | 애니메이션 지속 시간 (초) |
| delay | number | 0 | 애니메이션 지연 시간 (초) |
| repeatDelay | number | 0 | 반복 지연 시간 (초) |

## State Transitions

없음. 이 피처는 인증 상태 머신을 변경하지 않는다.
