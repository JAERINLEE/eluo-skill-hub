# Quickstart: 로그인 페이지 디자인 리뉴얼

**Branch**: `006-signin-page-design` | **Date**: 2026-03-03

## Prerequisites

- Node.js 18+ 설치
- 프로젝트 의존성 설치 완료 (`npm install`)
- `/public/eluo-logo.svg` 파일 배치 완료 (수동)

## Setup

### 1. 브랜치 체크아웃

```bash
git checkout 006-signin-page-design
```

### 2. 신규 의존성 설치

```bash
npm install framer-motion
```

### 3. 로고 파일 배치

`/public/eluo-logo.svg` 파일을 수동으로 배치한다. (사용자 제공)

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 확인

- http://localhost:3000/signin 접속하여 디자인 확인

## Key Files

| 파일 | 역할 |
|------|------|
| `src/app/signin/page.tsx` | 로그인 페이지 레이아웃 (헤더 + 배경 + 폼) |
| `src/features/auth/SigninForm.tsx` | 로그인 폼 컴포넌트 (글래스모피즘 카드) |
| `src/shared/ui/background-beams-with-collision.tsx` | 배경 빛줄기 애니메이션 |
| `src/app/globals.css` | glass-card 유틸리티 클래스 |
| `signin.html` | 디자인 레퍼런스 (구현 참조용) |

## Design Reference

signin.html의 주요 디자인 토큰:

| Token | Value | Usage |
|-------|-------|-------|
| brand-yellow | #FEFE01 | 브랜드 아이콘 배경 |
| brand-navy | #00007F | 헤더 로고, 타이틀, 버튼, 입력 필드 포커스 |
| brand-light | #F0F0F0 | 페이지 배경 기본 색상 |
| glass-card bg | rgba(255,255,255,0.7) | 카드 반투명 배경 |
| glass-card blur | 12px | 카드 블러 효과 |
| card max-width | 440px | 카드 최대 너비 |
| card border-radius | 16px (2xl) | 카드 모서리 둥글기 |
| font-eluo | ELUOFACEVF | 헤더 타이틀 폰트 |
| font-pretendard | PretendardVariable | 본문 폰트 |

## Testing

```bash
# 단위 테스트
npm test -- --testPathPattern=SigninForm

# E2E 테스트
npx playwright test --grep signin
```
