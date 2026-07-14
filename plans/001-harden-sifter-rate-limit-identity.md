# Plan 001: Harden Sifter Rate-Limit Identity

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- packages/api/src/middleware/security.ts packages/api/src/public.ts packages/api/src/__tests__`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against live code before proceeding; on mismatch, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The public Sifter endpoint is an AI cost surface. Its MVP guardrail is roughly 10 requests per hour per IP, but the current key generator lets callers influence the bucket with request headers before any API key is verified. That weakens both abuse protection and cost predictability.

## Current State

- `packages/api/src/middleware/security.ts` owns shared CORS, secure headers, CSRF, and rate limiting.
- `packages/api/src/public.ts` applies `rateLimitMiddleware` to public `/sifter`.

Current excerpt:

```ts
// packages/api/src/middleware/security.ts:89
keyGenerator: (c) => {
  const apiKey =
    c.req.header("x-api-key") ??
    c.req.header("authorization")?.replace("Bearer ", "");
  if (apiKey) {
    return `apikey:${apiKey}`;
  }

  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;
  }
  return `ip:${c.req.header("x-real-ip") ?? "unknown"}`;
},
```

Repo conventions:

- API routes use Hono routers in `packages/api/src/router/`.
- API behavior tests use Vitest under `packages/api/src/__tests__/`.
- Sifter public tests already exist in `packages/api/src/__tests__/sifter.test.ts`.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm -F @turbo/api test` | exit 0, all API tests pass |
| Typecheck | `pnpm -F @turbo/api typecheck` | exit 0, no TypeScript errors |
| Workspace lint | `pnpm lint:ws` | exit 0 |

## Scope

**In scope**:

- `packages/api/src/middleware/security.ts`
- `packages/api/src/public.ts` only if a public-route-specific option is needed
- `packages/api/src/__tests__/security.test.ts` or `packages/api/src/__tests__/sifter.test.ts`

**Out of scope**:

- Adding paid authentication, accounts, or API key issuance.
- Changing Sifter response shape.
- Changing production infrastructure proxy configuration.

## Git Workflow

- Branch: `advisor/001-harden-sifter-rate-limit-identity`
- Commit message style: conventional commit, for example `fix(api): harden public rate-limit identity`.
- Do not push or open a PR unless the operator asks.

## Steps

### Step 1: Separate trusted and untrusted rate-limit keys

Update `rateLimitMiddleware` so public unauthenticated rate limiting does not use raw `authorization` or `x-api-key` headers as bucket keys. Prefer an explicit option, for example `rateLimitKeyMode: "ip" | "verified-api-key-or-ip"`, defaulting conservatively for public routes.

The `/sifter` public path should use IP-derived identity only unless a verified API-key context exists. If trusted proxy IP extraction cannot be determined from code, keep the current forwarded-header behavior behind a clearly named helper and document that it assumes deployment proxy sanitization.

**Verify**: `pnpm -F @turbo/api typecheck` -> exit 0.

### Step 2: Add regression tests

Add tests proving that two requests with the same client IP but different unverified `authorization` or `x-api-key` headers hit the same public Sifter rate-limit bucket. Also test the normal IP fallback behavior still allows distinct trusted IP values to segment buckets.

Use the existing Sifter test pattern with `createPublicApp` and mocked AI provider where possible.

**Verify**: `pnpm -F @turbo/api test` -> all tests pass, including the new rate-limit cases.

### Step 3: Keep full API behavior explicit

If the authenticated API still needs verified API-key-based buckets later, leave a named option or TODO that requires verified identity from context, not raw headers. Do not silently preserve the old raw-header behavior.

**Verify**: `rg -n "apikey:\\$\\{|authorization.*rate|x-api-key.*rate" packages/api/src` -> no remaining raw-header rate-limit keying except in tests that assert it is not used.

## Test Plan

- New Vitest coverage for public Sifter rate limiting with varied `authorization` and `x-api-key` headers.
- New or updated tests for IP fallback behavior.
- Run `pnpm -F @turbo/api test` and `pnpm -F @turbo/api typecheck`.

## Done Criteria

- [ ] Public Sifter rate limiting no longer uses caller-controlled auth headers as bucket keys.
- [ ] New regression tests prove header variation does not bypass public Sifter limits.
- [ ] `pnpm -F @turbo/api test` exits 0.
- [ ] `pnpm -F @turbo/api typecheck` exits 0.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- The live code no longer contains `rateLimitMiddleware` in `packages/api/src/middleware/security.ts`.
- The fix requires changing platform proxy behavior outside the repository.
- Tests cannot reliably exercise the rate limiter without introducing sleeps or real network calls.

## Maintenance Notes

If paid accounts or API keys return later, rate limits should key by verified session/user/API-key context after authentication middleware, not by raw request headers.

