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



# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Korean. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
