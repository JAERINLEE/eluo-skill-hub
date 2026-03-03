<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification from template)
Added sections:
  - Core Principles (I–V)
  - Tech Stack Constraints
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check gates verified (no structural change needed)
  - .specify/templates/spec-template.md ✅ Requirements structure aligned (no structural change needed)
  - .specify/templates/tasks-template.md ✅ Phase organization reflects principle-driven task types
  - .specify/templates/agent-file-template.md ✅ References verified (no outdated names found)
  - .specify/templates/checklist-template.md ✅ References verified (no outdated names found)
Follow-up TODOs:
  - None. All placeholders resolved.
-->

# Eluo Skill Hub Constitution

## Core Principles

### I. Type Safety (NON-NEGOTIABLE)

TypeScript `any` type is PROHIBITED throughout the entire codebase without exception.
All values, props, function parameters, and return types MUST be explicitly typed or
correctly inferred by TypeScript. Use `unknown` with narrowing guards when the type is
genuinely unknown at compile time.

**Rationale**: Eluo Skill Hub is a multi-role platform (admin/user). Implicit `any`
types hide contract violations between domain layers and create silent runtime failures
that are extremely hard to diagnose in production. Type safety is the first line of
defense for correctness in a clean-architecture codebase.

### II. Clean Architecture

The codebase MUST follow a strict three-layer separation per bounded context:

- **domain/** — Pure business entities, value objects, and repository interfaces.
  No framework or infrastructure imports allowed. No side effects.
- **application/** — Use cases that orchestrate domain objects via port interfaces.
  No direct DB/HTTP calls. Depends only on domain.
- **infrastructure/** — Concrete implementations (Supabase repositories, HTTP clients).
  Depends on application ports; never imported by domain or application.

Cross-domain imports (e.g., `auth` importing directly from `skill-marketplace`) are
PROHIBITED. Shared types belong in `src/shared/`.

**Rationale**: Layer isolation ensures that business logic can be unit-tested without
database or framework dependencies, and that infrastructure can be swapped without
touching domain rules.

### III. Test Coverage by Layer

Every bounded context MUST maintain the following test coverage:

- **Unit tests** (React Testing Library / Jest): All domain entities, value objects,
  use cases, and UI components that contain logic.
- **E2E tests** (Playwright): All user-facing flows listed in the feature spec (login,
  signup, skill discovery, admin management).
- Tests MUST be written before or alongside implementation — never deferred to a later PR.
- A PR that introduces a new use case or domain rule without a corresponding test MUST NOT
  be merged.

**Rationale**: This project's reliability depends on untested domain invariants not
leaking to production. The layered architecture makes testing each concern in isolation
cheap — there is no excuse to skip it.

### IV. Feature Module Isolation

Each functional domain (auth, skill-marketplace, bookmark, admin, skill-feedback, etc.)
MUST be a self-contained module under `src/<domain>/`. A module encapsulates its own
domain, application, and infrastructure layers. UI components specific to a domain live
in `src/features/<domain>/`.

- A module MUST NOT import the infrastructure of another module.
- Shared abstractions (Supabase client, base types, shared UI) MUST live in `src/shared/`.
- New bounded contexts require explicit team approval before creation.

**Rationale**: Module boundaries prevent coupling drift. When a feature is bounded, it
can be replaced, removed, or scaled independently.

### V. Security-First

All data access and rendering decisions that depend on user identity or role MUST be
enforced server-side.

- Supabase Row Level Security (RLS) MUST be enabled and configured for every table
  that stores user-sensitive data.
- Server Actions and Route Handlers MUST re-validate the authenticated session from
  the Supabase server client — never trust client-supplied identity claims.
- No secrets, service-role keys, or private tokens MUST appear in client-side bundles.
- Admin-gated pages and API routes MUST check the `admin` role server-side before
  returning any response.

**Rationale**: The platform distinguishes admin and regular user access. Any gap in
server-side enforcement creates a privilege escalation vector.

## Tech Stack Constraints

The following technology choices are FIXED for this project. Deviations MUST be
documented in the relevant feature plan's Complexity Tracking table and require
team approval.

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | Next.js (App Router) | Server and Client Components |
| Language | TypeScript (strict) | `any` PROHIBITED (see Principle I) |
| Database | Supabase (via MCP) | RLS required on all user tables |
| Unit/component tests | Jest + React Testing Library | Co-located `__tests__/` directories |
| E2E tests | Playwright | `src/__tests__/e2e/` |
| Deployment | Vercel | Environment variables via Vercel dashboard |
| Styling | Tailwind CSS + shadcn/ui components | No inline style props for layout |

**New dependencies** MUST be justified in the PR description. Avoid duplicating
capabilities already provided by the stack above.

## Development Workflow

### Commit Conventions

All commits MUST follow the prefix convention below. Prefix in English; description
in Korean.

| Prefix | When to use |
|--------|------------|
| `feat:` | 새로운 기능 추가 |
| `fix:` | 버그 수정 |
| `docs:` | 문서 수정 |
| `style:` | 코드 스타일 수정 |
| `refactor:` | 코드 리팩토링 |
| `test:` | 테스트 코드 추가/수정 |
| `chore:` | 빌드 프로세스나 툴의 변경 |
| `ci:` | CI/CD 관련 변경 |

### Code Review Gates

A pull request MUST satisfy all of the following before merge:

1. **Type check passes** — `tsc --noEmit` exits with zero errors.
2. **Unit tests pass** — All Jest tests green; no `.skip` or `.only` left in test files.
3. **E2E tests pass** — Playwright suite covers the feature's primary user journeys.
4. **No `any` escapes** — ESLint `@typescript-eslint/no-explicit-any` rule MUST report
   zero violations.
5. **RLS verified** — Any new Supabase table has RLS policies confirmed in the PR.
6. **Layer boundaries respected** — Infrastructure MUST NOT be imported from domain
   or application layers.

### Speckit Workflow

Feature development follows the speckit lifecycle:

1. `/speckit.specify` → spec.md
2. `/speckit.clarify` → resolve ambiguities
3. `/speckit.plan` → plan.md + research + data-model + contracts
4. `/speckit.tasks` → tasks.md
5. `/speckit.analyze` → cross-artifact consistency check
6. `/speckit.implement` → execute tasks

## Governance

This constitution supersedes all other practices, style guides, or verbal agreements.
Compliance is mandatory for every PR merged into `main`.

### Amendment Procedure

1. Author drafts the proposed amendment with rationale.
2. Amendment is reviewed by at least one other team member.
3. `/speckit.constitution` is run to update the file and propagate changes.
4. The updated constitution is committed on `main` with message:
   `docs: amend constitution to vX.Y.Z (<summary>)`
5. `LAST_AMENDED_DATE` MUST be updated to the amendment date.

### Versioning Policy

- **MAJOR**: Removal or fundamental redefinition of an existing principle (e.g., removing
  the Type Safety principle or switching architecture paradigm).
- **MINOR**: New principle added, new mandatory section introduced, or materially expanded
  guidance that changes behaviour expectations.
- **PATCH**: Wording clarifications, typo fixes, formatting, or non-semantic refinements.

### Compliance Review

- Every PR review MUST include a Constitution Check confirming no principle is violated.
- The Complexity Tracking table in `plan.md` MUST document any justified deviation.
- Violations discovered post-merge MUST be tracked as `fix:` or `refactor:` tasks and
  resolved before the next feature is started.

**Version**: 1.0.0 | **Ratified**: 2026-03-03 | **Last Amended**: 2026-03-03
