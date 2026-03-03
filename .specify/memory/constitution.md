<!--
  Sync Impact Report
  ==================
  Version change: (unversioned template) → 1.0.0
  Modified principles: N/A — initial creation from template
  Added sections:
    - Core Principles (I. Domain-Driven Architecture, II. Aggregate Root Integrity,
      III. Type Safety, IV. Test Discipline, V. Commit Convention Compliance)
    - Tech Stack
    - Naming Conventions
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md  ✅ Constitution Check section is compatible
    - .specify/templates/spec-template.md  ✅ No constitution-specific changes required
    - .specify/templates/tasks-template.md ✅ Task categories align with DDD principles
  Follow-up TODOs: None — all fields resolved from CLAUDE.md and git history
-->

# Eluo Skill Hub Constitution

## Core Principles

### I. Domain-Driven Architecture

The project MUST follow a strict 3-layer architecture: `domain` → `application` → `infrastructure`.
The `domain` layer MUST contain only pure business logic with zero external dependencies
(no framework imports, no database clients, no HTTP clients).
Features MUST be separated by Bounded Context; each context owns its own models,
services, and repository interfaces.
Cross-context communication MUST occur only via domain events — direct
cross-context object references are forbidden.

**Rationale**: Keeps business logic portable, independently testable, and insulated
from infrastructure churn. Enforced layer separation prevents the accidental coupling
that makes large codebases unmanageable over time.

### II. Aggregate Root Integrity (NON-NEGOTIABLE)

All state-mutating operations on a domain entity MUST go through the Aggregate Root
of that entity's aggregate. Direct modification of child entities or value objects
from outside the aggregate boundary is forbidden.
Repository interfaces MUST expose the aggregate root, never individual sub-entities.

**Rationale**: The aggregate root is the single enforcement point for domain invariants
across a cluster of related objects. Bypassing it silently breaks business rules.

### III. Type Safety (NON-NEGOTIABLE)

TypeScript `any` type is absolutely forbidden throughout the codebase.
All function signatures, component props, repository return types, and API boundaries
MUST carry explicit, accurate TypeScript types.
Use `unknown` with type guards where the type is genuinely dynamic at runtime.
Generic types are preferred over type assertions (`as`).

**Rationale**: `any` defeats TypeScript's primary value and allows silent runtime errors
that manifest far from their source. Full typing enables safe refactoring and acts as
living, compiler-checked documentation.

### IV. Test Discipline

Automated tests MUST cover three layers:
- **Unit**: Jest for domain logic and application-layer use cases (no I/O allowed).
- **Component**: React Testing Library for UI component behavior and accessibility.
- **E2E**: Playwright for critical user journeys end-to-end.

New features MUST include tests before a PR is merged.
Tests MUST be co-located with the code they cover or in a parallel `__tests__` /
`tests/` directory at the same scope level.

**Rationale**: The web-agency workflows this product automates are regression-sensitive.
Automated tests are the primary safety net for incremental delivery and refactoring.

### V. Commit Convention Compliance

Every commit MUST follow the Conventional Commits format: English prefix followed
by a Korean description.

Allowed prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

Example: `feat: 스킬 마켓플레이스 페이지 구현`

Commits that do not conform MUST be flagged and corrected in code review before merge.

**Rationale**: Consistent commit history enables automated release notes, reliable
bisect debugging, and communicates change intent across a mixed-language team.

## Tech Stack

The following technology choices are ratified and MUST NOT be replaced without a
formal constitution amendment:

| Concern | Technology |
|---------|-----------|
| Frontend Framework | Next.js (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (accessed via MCP) |
| Unit / Component Testing | Jest + React Testing Library |
| E2E Testing | Playwright |

Deviations (e.g., adding an ORM, switching test runners) MUST be proposed as a
constitution amendment with documented rationale before adoption.

## Naming Conventions

Consistent naming is mandatory across all layers. Violations MUST be flagged in
code review and corrected before merge.

| Artifact | Convention | Example |
|----------|-----------|---------|
| Entity | PascalCase | `Skill`, `SkillCategory` |
| Value Object | PascalCase | `Money`, `SkillSlug` |
| Use Case | PascalCase + `UseCase` suffix | `InstallSkillUseCase` |
| Repository | PascalCase + `Repository` suffix | `SkillRepository` |
| Domain Event | PascalCase + `Event` suffix | `SkillInstalledEvent` |
| Next.js Page | kebab-case directory + `page.tsx` | `skill-detail/page.tsx` |
| Component file | PascalCase | `SkillCard.tsx` |

## Governance

This constitution is the highest-authority document for Eluo Skill Hub.
When the constitution conflicts with any other guidance or convention, the constitution
takes precedence.

**Amendment Procedure**:
1. Propose the change in a pull request that updates this file.
2. Increment the version according to semantic versioning:
   - MAJOR: principle removal or backward-incompatible redefinition.
   - MINOR: new principle, new section, or materially expanded guidance.
   - PATCH: clarification, wording fix, or typo correction.
3. Update `Last Amended` to the amendment date (ISO YYYY-MM-DD).
4. Propagate necessary changes to `.specify/templates/` files and record results
   in a new Sync Impact Report comment at the top of this file.
5. Obtain team consensus before merging.

**Compliance Review**: All PRs MUST be reviewed for constitution compliance.
Complexity deviations from principles MUST be justified in the PR description
using the Complexity Tracking table (see plan-template.md).

**Runtime Guidance**: For day-to-day development guidance, see `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-02-27 | **Last Amended**: 2026-03-03
