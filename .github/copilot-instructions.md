# GitHub Copilot Instructions

> Short task-trigger map. Full procedures live in `.ai/skills/`.

## Before any task
Read `AGENTS.md`, `.ai/context/tech-stack.md`, and `.ai/context/conventions.md`.

## Task → Skill mapping

| When the user says... | Read this skill |
|----------------------|----------------|
| "create a component" | `.ai/skills/create-component.md` |
| "create a package" | `.ai/skills/create-package.md` |
| "add an endpoint" | `.ai/skills/create-api-endpoint.md` |
| "create a page" | `.ai/skills/create-page.md` |
| "write tests" | `.ai/skills/write-tests.md` |
| "review this" | `.ai/skills/code-review.md` |
| "fix this error" | `.ai/skills/debug-failure.md` |
| "refactor" | `.ai/skills/refactor.md` |

## Self-Updating Rule

If your task introduces a new pattern, convention, or dependency, update the relevant `.ai/` files in the same PR. See `.ai/skills/update-ai-memory.md`.

## Key patterns
- Components: CVA + cn() + data-slot (see `packages/ui/src/components/button.tsx`)
- API: Hono routers in `packages/api/src/router/`
- DB: Drizzle schemas in `packages/db/src/`
- Tests: Vitest in `__tests__/*.test.ts`
