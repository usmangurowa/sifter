# Plan 002: Fail Closed On Production Auth Secrets

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- apps/web/src/auth/server.ts apps/server/src/auth.ts packages/auth/env.ts packages/auth/src`
> If any in-scope file changed since this plan was written, compare excerpts against live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The MVP intentionally made auth env optional for local non-auth development. That local convenience must not become production behavior. A production deployment with fallback auth secrets can create predictable signing material and cross-environment session risk.

## Current State

Relevant files:

- `packages/auth/env.ts` makes `AUTH_SECRET` and `SUPABASE_JWT_SECRET` optional.
- `apps/web/src/auth/server.ts` and `apps/server/src/auth.ts` pass fallback strings into `initAuth`.

Current excerpts:

```ts
// packages/auth/env.ts:20
AUTH_SECRET: optionalString,
SUPABASE_JWT_SECRET: optionalString,
```

```ts
// apps/web/src/auth/server.ts:21
secret: env.AUTH_SECRET ?? "sifter-local-development-secret",
supabaseJwtSecret:
  env.SUPABASE_JWT_SECRET ?? "sifter-local-development-secret",
```

```ts
// apps/server/src/auth.ts:9
secret: env.AUTH_SECRET ?? "sifter-local-development-secret",
supabaseJwtSecret:
  env.SUPABASE_JWT_SECRET ?? "sifter-local-development-secret",
```

Repo convention:

- Env optionality belongs in env modules, but runtime constructors should make production requirements explicit.
- Do not make dormant auth block local Sifter web startup.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Auth typecheck | `pnpm -F @turbo/auth typecheck` | exit 0 |
| Web typecheck | `pnpm -F @turbo/web typecheck` | exit 0 |
| Server typecheck | `pnpm -F @turbo/server typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0 |

## Scope

**In scope**:

- `packages/auth/env.ts`
- New helper under `packages/auth/src/` if useful, such as `runtime-secrets.ts`
- `apps/web/src/auth/server.ts`
- `apps/server/src/auth.ts`
- Focused Vitest tests if package test setup supports them

**Out of scope**:

- Requiring auth secrets for local public Sifter UI.
- Changing Better Auth schemas or database tables.
- Printing or committing secret values.

## Git Workflow

- Branch: `advisor/002-fail-closed-production-auth-secrets`
- Commit message: `fix(auth): fail closed on production secrets`.

## Steps

### Step 1: Add a production-aware secret resolver

Create a small shared helper in `packages/auth/src/` that returns the provided env secret in all cases, returns a local fallback only when `NODE_ENV !== "production"` and no production deployment marker is present, and throws a clear configuration error in production when the secret is missing.

Include both `AUTH_SECRET` and `SUPABASE_JWT_SECRET`, but keep the error messages value-free.

**Verify**: `pnpm -F @turbo/auth typecheck` -> exit 0.

### Step 2: Use the resolver in web and server auth constructors

Replace direct `?? "sifter-local-development-secret"` fallback logic in `apps/web/src/auth/server.ts` and `apps/server/src/auth.ts` with the shared resolver. Preserve current local behavior for non-auth Sifter development.

**Verify**: `pnpm -F @turbo/web typecheck && pnpm -F @turbo/server typecheck` -> exit 0.

### Step 3: Add focused tests

Add tests for the helper:

- Development with missing secrets returns a local fallback.
- Production with missing `AUTH_SECRET` throws.
- Production with missing `SUPABASE_JWT_SECRET` throws.
- Production with provided secrets returns the provided values.

**Verify**: `pnpm -F @turbo/auth test` -> all tests pass. If `@turbo/auth` has no test script, add one consistent with other packages.

## Test Plan

- Unit tests for the resolver.
- Typecheck auth, web, and server.
- Run `pnpm test` if package graph changes are involved.

## Done Criteria

- [ ] No production auth constructor can silently use the local fallback secret.
- [ ] Local non-auth Sifter development remains possible without auth secrets.
- [ ] Tests cover production missing-secret failure.
- [ ] Typecheck commands exit 0.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Better Auth itself requires a different secret contract than `string | undefined`.
- The only way to preserve local Sifter startup is to weaken production behavior.
- Any test or error output would expose secret values.

## Maintenance Notes

If auth becomes active product scope again, update `.env.example`, `.ai/contracts/env.generated.md`, and deploy docs to explain that auth secrets are optional for local public Sifter only, not production auth.

