# Eluo Skill Hub

웹 에이전시의 기획-디자인-퍼블리싱-개발-QA 워크플로우를 자동화하는 플러그인 마켓플레이스.
Claude Code 플러그인(Skill) 시스템 기반으로, 각 직군별 반복 업무를 자동화하는 스킬을 등록·검색·설치·실행할 수 있다.

# Project Constitution

## Tech Stack
- Frontend Framework: NextJS
- Language: TypeScript
- Database:  Supabase MCP
- Test: Jest + React Testing Library + Playwright

## Architecture Priciples (Domain-Driven Development)
- 바운디드 컨텍스트별 모듈 분리
- 3계층: domain -> application -> infrastructure
- domain 계층은 외부 의존성 금지 (순수 비즈니스 로직만)
- aggregate root를 통해서만 데이터를 변경한다. 
- 컨텍스트 간 통신은 도메인 이벤트로 

## Naming Conventions
- 엔티티: PascalCase (Order, OrderItem)
- 값 객체: PascalCase (Money, ShippingAddress)
- 유스케이스: PascalCase + UseCase 접미사 (CreateOrderUseCase)
- 리포지토리: PascalCase + Repository 접미사

## Forbidden
- 애그리게이트 루트를 거치지 않는 직접 데이터 변경 금지
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

