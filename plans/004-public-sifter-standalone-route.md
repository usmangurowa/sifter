# Plan 004: Mount Standalone Sifter Through The Public API Path

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- apps/server/src/app.ts packages/api/src/index.ts packages/api/src/public.ts packages/api/src/router/sifter.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-harden-sifter-rate-limit-identity.md, plans/003-secure-standalone-auth-routes.md
- **Category**: bug
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The Sifter MVP must run without auth, Supabase, or database requirements. The Next.js web route uses `createPublicApp`, but the standalone server currently mounts the full authenticated API graph at `/api`, and full API routing still includes `/sifter`. That means standalone `/api/sifter/chat` goes through `contextMiddleware(auth)` and inherits auth/db setup.

## Current State

Relevant excerpts:

```ts
// apps/server/src/app.ts:22
const apiApp = createApp(auth, { security: { allowedOrigins, rateLimit, rateLimitWindow } });
```

```ts
// apps/server/src/app.ts:33
.route("/api", apiApp);
```

```ts
// packages/api/src/index.ts:45
.use("*", contextMiddleware(auth))
...
.route("/sifter", sifterRouter)
```

```ts
// packages/api/src/public.ts:19
const app = new Hono<AppContext>()
  .use("*", secureHeadersMiddleware())
  .use("*", corsMiddleware(security))
  .use("*", rateLimitMiddleware(security))
  .use("*", timingMiddleware)
  .route("/sifter", sifterRouter)
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| API tests | `pnpm -F @turbo/api test` | exit 0 |
| Server tests | `pnpm -F @turbo/server test` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |

## Scope

**In scope**:

- `apps/server/src/app.ts`
- `packages/api/src/index.ts`
- `packages/api/src/public.ts`
- Tests under `apps/server/src/__tests__/` and `packages/api/src/__tests__/`

**Out of scope**:

- Adding auth-gated Sifter saved searches.
- Removing auth/db packages from the repo.
- Changing `/api/sifter/chat` request or response schema.

## Git Workflow

- Branch: `advisor/004-public-sifter-standalone-route`
- Commit message: `fix(server): serve sifter through public api app`.

## Steps

### Step 1: Decide one owner for `/sifter`

Make `/sifter` a public-route concern. Prefer removing `.route("/sifter", sifterRouter)` from `createApp` and keeping it only in `createPublicApp`, unless typed clients require a transitional export. If a transitional path is required, document it and add a TODO with an owner.

**Verify**: `rg -n "route\\(\"/sifter\"" packages/api/src` -> only the intended public owner remains, or a documented transitional owner remains.

### Step 2: Mount public API routes in standalone server

Update `apps/server/src/app.ts` so `/api/sifter/chat` is served by `createPublicApp` with the same allowed origins and rate-limit settings. Ensure it does not call `contextMiddleware(auth)` for the Sifter path.

**Verify**: `pnpm -F @turbo/server typecheck` -> exit 0.

### Step 3: Add regression tests

Add a standalone server test that requests `/api/sifter/chat` with invalid input and receives the public validation error without requiring a real auth/db context. Use invalid input so the test does not need a live Groq key.

**Verify**: `pnpm -F @turbo/server test` -> all server tests pass.

### Step 4: Keep full API tests green

Update any typed client or generated contract assumptions affected by moving `/sifter` out of `createApp`.

**Verify**: `pnpm -F @turbo/api test && pnpm typecheck` -> exit 0.

## Test Plan

- Server integration test for `/api/sifter/chat` invalid input through `createServerApp`.
- Existing `packages/api/src/__tests__/sifter.test.ts` remains green.
- Typecheck all packages because API exports may affect clients.

## Done Criteria

- [ ] Standalone `/api/sifter/chat` is served through the public API factory.
- [ ] Sifter route does not require auth/db context in standalone server.
- [ ] Regression tests cover the standalone public path.
- [ ] `pnpm typecheck` exits 0.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Moving `/sifter` out of `createApp` breaks a generated client contract that active mobile/web code depends on.
- Hono route order makes it impossible to mount public and authenticated `/api` apps without path conflicts.
- The fix requires reintroducing auth/database requirements to public Sifter.

## Maintenance Notes

If future saved searches require auth, add a separate authenticated route such as `/sifter/saved-searches`; do not make `/sifter/chat` depend on auth.

