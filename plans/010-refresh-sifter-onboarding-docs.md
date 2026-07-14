# Plan 010: Refresh Sifter MVP Onboarding Docs

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- README.md apps/web/README.md apps/mobile/README.md package.json .ai/context .ai/contracts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: implementation plans 001-009 as relevant
- **Category**: docs
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

The root and app READMEs still describe template or pre-MVP behavior. Wrong setup docs waste contributor time and can make correct scripts look broken. The docs should match the Sifter web-first MVP and the current command contract.

## Current State

Relevant excerpts:

```md
<!-- README.md:133 -->
# Start all apps
pnpm dev
```

```md
<!-- README.md:238 -->
| `pnpm db:push` | Push Drizzle schema to database |
```

```md
<!-- apps/web/README.md:1 -->
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`]
```

```md
<!-- apps/mobile/README.md:11 -->
npx create-expo-app -e with-router-uniwind
```

Current root scripts:

```json
// package.json:19
"dev": "pnpm dev:web",
"dev:web": "turbo run dev --filter=@turbo/web --ui=stream",
"dev:mobile": "turbo run dev --filter=@turbo/mobile --ui=tui",
"dev:server": "turbo run dev --filter=@turbo/server --ui=stream"
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Docs format | `pnpm format` | exit 0 |
| Workspace lint | `pnpm lint:ws` | exit 0 |
| AI context | `pnpm ai:context` | generated context updated if `.ai/context` changed |
| Contract check | `pnpm ai:contracts:check` | exit 0 |

## Scope

**In scope**:

- `README.md`
- `apps/web/README.md`
- `apps/mobile/README.md`
- `.ai/context/tech-stack.md` or `.ai/context/conventions.md` only if docs reveal a convention mismatch
- generated `.ai/contracts/context-pack.generated.md` if context changes

**Out of scope**:

- Product code changes.
- Rewriting the PRD.
- Publishing docs externally.

## Git Workflow

- Branch: `advisor/010-refresh-sifter-onboarding-docs`
- Commit message: `docs: refresh sifter onboarding commands`.

## Steps

### Step 1: Update root README command contract

Change root docs so:

- `pnpm dev` is described as starting the Sifter web app only.
- `pnpm dev:web`, `pnpm dev:mobile`, and `pnpm dev:server` are described accurately.
- `pnpm db:push` is documented as intentionally blocked.
- `pnpm db:push:local` is documented only for disposable local databases.
- Sifter's public MVP does not require auth, Supabase, or Postgres env for web startup.

**Verify**: `rg -n "Start all apps|Push Drizzle schema|create-next-app|create-expo-app" README.md apps/web/README.md apps/mobile/README.md` -> no stale statements remain.

### Step 2: Replace app template READMEs

Replace `apps/web/README.md` with Sifter-specific Next.js notes: dev command, build command, public API mount, and where Sifter components live.

Replace `apps/mobile/README.md` with repo-specific Expo notes: current mobile status, dev command, env knobs, and auth-client ownership after Plan 009 if executed.

**Verify**: `pnpm format` -> exit 0.

### Step 3: Update AI context only if conventions changed

If the docs update changes a convention, update `.ai/context/conventions.md` or `.ai/context/tech-stack.md` and regenerate context.

**Verify**: `pnpm ai:context && pnpm ai:contracts:check` -> exit 0 if `.ai/context` changed. If no `.ai/context` file changed, note that this step was not needed.

## Test Plan

- Markdown formatting via `pnpm format`.
- Search for stale template statements.
- AI context regeneration only if `.ai/context` changes.

## Done Criteria

- [ ] Root README accurately describes Sifter web-first dev scripts.
- [ ] App READMEs no longer contain create-next-app/create-expo-app boilerplate.
- [ ] DB command docs match root scripts.
- [ ] Format and workspace lint pass.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Script behavior changed since this plan was written.
- Product scope changed from web-first Sifter MVP to all-apps startup.
- Docs need secret values or environment-specific deployment details not available in the repo.

## Maintenance Notes

Run this plan after implementation plans that affect commands, env, or package boundaries so the docs do not immediately drift again.

