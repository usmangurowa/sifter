# Plan 003: Put Standalone Auth Routes Behind The Security Envelope

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- apps/server/src/app.ts packages/api/src/middleware/security.ts apps/server/src`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/001-harden-sifter-rate-limit-identity.md, plans/002-fail-closed-production-auth-secrets.md
- **Category**: security
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The standalone Hono server exposes Better Auth directly at `/api/auth/*`. That direct mount bypasses the shared security middleware used by the rest of the API. Auth routes should receive the same CORS, secure headers, timing, and rate-limit envelope as other externally reachable API routes.

## Current State

Relevant file:

- `apps/server/src/app.ts` composes standalone server routes.

Current excerpt:

```ts
// apps/server/src/app.ts:30
const app = new Hono()
  .get("/health", (c) => c.text("OK"))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api", apiApp);
```

The shared API app applies security before context:

```ts
// packages/api/src/index.ts:39
const app = new Hono<AppContext>()
  .use("*", secureHeadersMiddleware())
  .use("*", corsMiddleware(security))
  .use("*", rateLimitMiddleware(security))
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Server typecheck | `pnpm -F @turbo/server typecheck` | exit 0 |
| API typecheck | `pnpm -F @turbo/api typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0 |

## Scope

**In scope**:

- `apps/server/src/app.ts`
- `apps/server/src/__tests__/app.test.ts` if adding tests
- `packages/api/src/middleware/security.ts` only if middleware typing must become generic

**Out of scope**:

- Rewriting Better Auth.
- Changing auth endpoint paths.
- Adding account-gated Sifter flows.

## Git Workflow

- Branch: `advisor/003-secure-standalone-auth-routes`
- Commit message: `fix(server): apply security middleware to auth routes`.

## Steps

### Step 1: Apply shared middleware before standalone auth handling

Refactor `createServerApp` so `/api/auth/*` responses pass through secure headers, CORS, rate limiting, and timing. Avoid double-applying middleware to `apiApp` if it already includes its own security layer; a small parent Hono app with shared middleware around direct auth and then routing to API is acceptable only if headers/rate limits behave consistently.

**Verify**: `pnpm -F @turbo/server typecheck` -> exit 0.

### Step 2: Add a route-composition regression test

Add a lightweight Hono request test for `createServerApp` using a fake auth handler. Assert an `/api/auth/*` response includes at least one secure header and the expected CORS behavior for an allowed origin. Keep the fake handler local to the test; do not hit a real database or auth provider.

**Verify**: `pnpm -F @turbo/server test` -> all server tests pass. If no server test script exists, add it consistently with package Vitest patterns and run it.

### Step 3: Confirm route behavior is unchanged

Verify `/health`, `/api/auth/*`, and non-auth `/api/*` paths still route. Do this with tests or a small non-network Hono `app.request()` test.

**Verify**: `pnpm test` -> exit 0.

## Test Plan

- New route-composition test for `/api/auth/*` middleware headers.
- Existing API tests should still pass.

## Done Criteria

- [ ] `/api/auth/*` in `apps/server` no longer bypasses shared security middleware.
- [ ] Tests prove auth routes receive security headers/CORS.
- [ ] `pnpm -F @turbo/server typecheck` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Better Auth requires raw request handling before any Hono middleware.
- Applying middleware breaks cookies or CORS in a way tests cannot resolve locally.
- The fix would require changing production domains or environment values.

## Maintenance Notes

When new standalone routes are added, they should be mounted through the same parent security envelope unless explicitly documented as internal-only.

