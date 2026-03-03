# Eluo Skill Hub

- 웹 에이전시의 기획-디자인-퍼블리싱-개발-QA 워크플로우를 자동화 스킬을 모아놓은 대시보드입니다. 
- Claude Code 플러그인(Skill) 시스템 기반으로 관리자는 스킬을 등록할 수 있고, 각 사용자는 직군별 반복 업무를 자동화하는 스킬을 검색·설치·실행할 수 있습니다.

# Project Constitution

## Tech Stack
- Frontend Framework: NextJS
- Language: TypeScript
- Styling: Tailwind CSS
- Shadcn UI
- Database:  Supabase MCP
- Test: Playwright + React Testing Library
- Deploy: Vercel

## Forbidden
- any 타입 사용 금지

## Commit Conventions
- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 스타일 수정
- refactor: 코드 리팩토링
- test: 테스트 코드 추가/수정
- chore: 빌드 프로세스나 툴의 변경
- ci: CI/CD 관련 변경
- prefix는 영어로 작성, 설명은 한글로 작성

## Strategy
- Vercel CLI를 사용하여 배포합니다.
- Caching 전략을 잘 세워서 배포 속도를 빠르게 합니다.
- Supabase MCP를 사용하여 데이터베이스를 관리합니다. 
- 전략을 잘 세워서 데이터 비동기 통신 속도를 빠르게 합니다.

## Active Technologies
- TypeScript (strict) — `any` 금지 (헌법 원칙 I) + Next.js (App Router), Tailwind CSS v4, Shadcn UI, `next/font/local` (003-landing-page-redesign)
- N/A (순수 UI 변경) (003-landing-page-redesign)
- TypeScript 5 (strict mode, `any` 금지) + Next.js 16.1.6 (App Router), @supabase/ssr 0.8.0, @supabase/supabase-js 2.98.0, Shadcn UI, Radix UI (004-signin-page)
- Supabase (PostgreSQL) — `profiles` 테이블 (auth.users FK), `roles` 테이블, RLS 활성 (004-signin-page)
- TypeScript (strict mode) — `any` 금지 + Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, Shadcn UI, Tailwind CSS v4 (005-signup-page)
- Supabase (PostgreSQL) — auth.users(Supabase Auth 관리), public.profiles, public.roles (005-signup-page)

## Recent Changes
- 003-landing-page-redesign: Added TypeScript (strict) — `any` 금지 (헌법 원칙 I) + Next.js (App Router), Tailwind CSS v4, Shadcn UI, `next/font/local`
