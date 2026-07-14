# Plan 008: Add Deployable Build And Sifter Integration Coverage To CI

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- .github/workflows/ci.yml tooling/github/setup/action.yml package.json apps/web/package.json apps/web/src packages/ai/src packages/api/src`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-harden-sifter-rate-limit-identity.md, plans/004-public-sifter-standalone-route.md, plans/007-codify-groq-provider-boundaries.md
- **Category**: tests
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

Current tests cover the Sifter API route directly, but CI does not verify the deployable Next build, the Next `/api/sifter/chat` mount, or the real Groq helper module. This leaves build-only and route-composition regressions invisible until deployment or manual testing.

## Current State

Relevant excerpts:

```yaml
# .github/workflows/ci.yml:73
test:
  runs-on: ubuntu-latest
  ...
  - name: Test
    run: pnpm test
```

There is no build job in the CI workflow.

```json
// apps/web/package.json:6
"scripts": {
  "build": "SKIP_ENV_VALIDATION=1 pnpm with-env next build",
  "dev": "pnpm with-env next dev",
  "lint": "eslint",
  "typecheck": "tsc --noEmit"
}
```

There is no web `test` script.

```ts
// packages/api/src/__tests__/sifter.test.ts:9
vi.mock("@turbo/ai/client", () => ({
  createGroqModel: vi.fn(() => "groq-model"),
}));
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Web build | `pnpm -F @turbo/web build` | exit 0 |
| Web tests | `pnpm -F @turbo/web test` | exit 0 |
| AI tests | `pnpm -F @turbo/ai test` | exit 0 |
| Full tests | `pnpm test` | exit 0 |
| CI lint | `pnpm lint:ws` | exit 0 |

## Scope

**In scope**:

- `.github/workflows/ci.yml`
- `tooling/github/setup/action.yml`
- `apps/web/package.json`
- web test config/files if needed
- `packages/ai/src/__tests__/client.test.ts`
- route-handler or component tests for Sifter public flow

**Out of scope**:

- E2E browser automation unless unit/integration route tests cannot cover the mount.
- Live Groq calls.
- Broad visual redesign.

## Git Workflow

- Branch: `advisor/008-add-build-and-integration-ci`
- Commit message: `test(sifter): add build and integration ci coverage`.

## Steps

### Step 1: Add web test infrastructure

Add a web `test` script using the repo's Vitest pattern. If React Testing Library is already present, use it; otherwise start with a route-handler integration test that exercises the Next Hono mount without adding heavy dependencies.

Cover:

- Empty submit/client validation where applicable.
- `/api/sifter/chat` route mount returning validation error for invalid body.
- Error-state rendering when API returns a configuration error.

**Verify**: `pnpm -F @turbo/web test` -> exit 0.

### Step 2: Add `@turbo/ai` provider helper tests

Add mocked tests for the Groq provider helper so CI catches default model/env wiring issues.

**Verify**: `pnpm -F @turbo/ai test` -> exit 0.

### Step 3: Add CI build job

Update `.github/workflows/ci.yml` with a build job that runs at least `pnpm -F @turbo/web build`; use `.env.example` copy as other jobs do if needed. Keep it separate from tests for clear failure attribution.

**Verify locally**: `pnpm -F @turbo/web build` -> exit 0.

### Step 4: Improve CI setup caching

Update `tooling/github/setup/action.yml` to use pnpm dependency caching through `actions/setup-node` or a pnpm store cache. Remove `pnpm add -g turbo` if all CI commands run through workspace scripts and the root `turbo` devDependency.

**Verify**: `pnpm lint:ws` -> exit 0 and CI workflow still uses `pnpm` scripts.

## Test Plan

- Web integration tests for public Sifter route/client states.
- AI provider helper tests with module mocks.
- CI build job for deployable web app.

## Done Criteria

- [ ] `@turbo/web` has a test script and focused Sifter tests.
- [ ] `@turbo/ai` tests real helper wiring with mocked provider package.
- [ ] CI runs a web build job.
- [ ] CI setup no longer installs an unpinned global Turbo unless justified in comments.
- [ ] `pnpm -F @turbo/web build`, `pnpm test`, and `pnpm lint:ws` pass.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- `next build` requires unavailable production-only services despite `SKIP_ENV_VALIDATION=1`.
- Adding web tests requires large dependency changes not already accepted by the repo.
- CI caching changes make local scripts ambiguous or require GitHub-only debugging.

## Maintenance Notes

Keep build and test jobs separate. Build failures and unit/integration failures usually need different owners and should not be hidden under one job.

