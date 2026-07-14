# Plan 005: Decouple The Public API Context From Auth And DB

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- packages/api/src/public.ts packages/api/src/index.ts packages/api/src/context.ts packages/api/src/middleware packages/api/package.json .ai/contracts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/004-public-sifter-standalone-route.md
- **Category**: tech-debt
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The runtime public app avoids auth middleware, but its TypeScript boundary still imports the full authenticated app context/options. That makes public Sifter work sensitive to auth/db type churn and keeps dependency graph noise around a surface that should be small and public.

## Current State

Relevant excerpts:

```ts
// packages/api/src/public.ts:3
import type { AppContext } from "./context";
import type { CreateAppOptions } from "./index";
```

```ts
// packages/api/src/public.ts:19
const app = new Hono<AppContext>()
```

```ts
// packages/api/src/context.ts:1
import type { Auth, Session } from "@turbo/auth";
import type { db } from "@turbo/db/client";
```

The generated dependency graph records `@turbo/api` as depending on auth/db/jobs/mail, which is still true for the full API package.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| API typecheck | `pnpm -F @turbo/api typecheck` | exit 0 |
| API tests | `pnpm -F @turbo/api test` | exit 0 |
| Contracts | `pnpm ai:contracts` | generated files updated |
| Contract check | `pnpm ai:contracts:check` | exit 0, no contract drift |

## Scope

**In scope**:

- `packages/api/src/public.ts`
- `packages/api/src/index.ts`
- `packages/api/src/context.ts` only for type extraction if needed
- `packages/api/src/middleware/*` if middleware types need generics
- `packages/api/package.json` exports
- `.ai/contracts/*` generated outputs after package export/graph changes

**Out of scope**:

- Splitting `@turbo/api` into a new package unless a small type split is impossible.
- Removing auth/db from the full API app.
- Changing runtime Sifter behavior already fixed by Plan 004.

## Git Workflow

- Branch: `advisor/005-decouple-public-api-context`
- Commit message: `refactor(api): decouple public api context`.

## Steps

### Step 1: Introduce public API types

Define a small `PublicAppContext` and `PublicCreateAppOptions` that do not import `@turbo/auth`, `@turbo/db`, or `./index`. Use those in `createPublicApp`.

**Verify**: `pnpm -F @turbo/api typecheck` -> exit 0.

### Step 2: Make shared middleware context-agnostic

If `secureHeadersMiddleware`, `corsMiddleware`, `rateLimitMiddleware`, or `timingMiddleware` are typed only as `MiddlewareHandler<AppContext>`, generalize them to work with any Hono environment that does not require auth/db variables.

**Verify**: `pnpm -F @turbo/api typecheck` -> exit 0.

### Step 3: Keep exports explicit

Ensure `@turbo/api/public` can be imported without importing `./index` types. If `package.json` exports need a public-specific type path, update them.

**Verify**: `pnpm -F @turbo/api test` -> all API tests pass.

### Step 4: Refresh generated contracts

Run AI contract generation because package exports and dependency graph may change.

**Verify**: `pnpm ai:contracts && pnpm ai:contracts:check` -> generated outputs are current and check exits 0.

## Test Plan

- Existing Sifter API tests remain green.
- Add a compile-time test only if needed to prove `@turbo/api/public` imports without full context imports.
- Regenerate AI contracts.

## Done Criteria

- [ ] `createPublicApp` no longer imports `AppContext` or `CreateAppOptions` from the full API index.
- [ ] Public middleware types do not force auth/db context.
- [ ] API tests and typecheck pass.
- [ ] AI contracts are regenerated and clean.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- The package export system cannot express a public entry without a package split.
- Removing full context types breaks Hono route inference in a way that requires broad router rewrites.
- Contract generation reveals unrelated drift outside API package exports/dependency graph.

## Maintenance Notes

Keep future public routes under the public API context by default. Authenticated variants should use clearly separate route names and the full app context.

