# Plan 009: Consolidate Mobile Auth Clients

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- apps/mobile/src/auth apps/mobile/src/utils apps/mobile/app.config.ts apps/mobile/package.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/002-fail-closed-production-auth-secrets.md, plans/003-secure-standalone-auth-routes.md
- **Category**: tech-debt
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

Mobile is not the MVP launch path, but its auth utilities are currently split. Screens and API calls can read/write cookies through different clients, different plugin sets, and different base URL/scheme logic. Consolidating this before mobile auth is used avoids hard-to-debug session drift.

## Current State

Relevant excerpts:

```ts
// apps/mobile/src/auth/client.ts:17
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "turbo",
      storagePrefix: "turbo",
      storage: SecureStore,
    }),
  ],
});
```

```ts
// apps/mobile/src/utils/auth.ts:10
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme,
      storagePrefix: scheme,
      storage: SecureStore,
    }),
  ],
});
```

```ts
// apps/mobile/src/utils/api.tsx:21
const client = hc<AppType>(getBaseUrl() + "/api", {
  headers: (): Record<string, string> => {
    const cookies = authClient.getCookie();
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Mobile typecheck | `pnpm -F @turbo/mobile typecheck` | exit 0 |
| Mobile lint | `pnpm -F @turbo/mobile lint` | exit 0 |
| Workspace lint | `pnpm lint:ws` | exit 0 |

## Scope

**In scope**:

- `apps/mobile/src/auth/client.ts`
- `apps/mobile/src/auth/provider.tsx`
- `apps/mobile/src/utils/auth.ts`
- `apps/mobile/src/utils/api.tsx`
- `apps/mobile/src/utils/base-url.ts` only if needed for one source of truth
- `apps/mobile/app.config.ts` only for scheme consistency

**Out of scope**:

- New mobile product screens.
- Changing web auth.
- Adding production mobile release config.

## Git Workflow

- Branch: `advisor/009-consolidate-mobile-auth-clients`
- Commit message: `refactor(mobile): consolidate auth client`.

## Steps

### Step 1: Pick the canonical mobile auth module

Use one module as the only `authClient` source. Prefer `apps/mobile/src/auth/client.ts` if screens already import hooks from it, but update it to use the same `getBaseUrl()` and Expo scheme logic as API utilities.

**Verify**: `rg -n "createAuthClient|authClient" apps/mobile/src` -> there is only one `createAuthClient` call.

### Step 2: Point API cookies at the canonical client

Update `apps/mobile/src/utils/api.tsx` to import `authClient` from the canonical module. Remove the duplicate utility auth module or turn it into a re-export if needed for compatibility.

**Verify**: `pnpm -F @turbo/mobile typecheck` -> exit 0.

### Step 3: Normalize scheme and storage prefix

Use `Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_SCHEME ?? "turbo"` consistently for both `scheme` and `storagePrefix`. Do not hardcode `"turbo"` in one client while reading config in another.

**Verify**: `rg -n "scheme: \"turbo\"|storagePrefix: \"turbo\"" apps/mobile/src` -> no hardcoded auth client values remain unless explicitly intended.

### Step 4: Add a lightweight smoke test if mobile test infra exists

If mobile Vitest/Jest infrastructure exists, add a test that imports the API client and canonical auth client without creating duplicate clients. If no mobile test infra exists, document this as a follow-up in the PR and rely on typecheck/lint.

**Verify**: `pnpm -F @turbo/mobile lint && pnpm -F @turbo/mobile typecheck` -> exit 0.

## Test Plan

- Typecheck and lint mobile.
- Optional import-level smoke test if test infra already exists.

## Done Criteria

- [ ] Only one mobile `createAuthClient` call remains.
- [ ] API cookie headers use the same auth client as screens/session provider.
- [ ] Scheme/base URL logic is consistent.
- [ ] Mobile typecheck and lint pass.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Removing the duplicate auth module breaks a route group that cannot be tested locally.
- The app has two intentional auth contexts with different storage requirements.
- Expo config values are missing in a way that requires production decisions.

## Maintenance Notes

When mobile auth is reopened, add real login/logout/session persistence smoke tests before shipping authenticated mobile flows.

