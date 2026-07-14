# Plan 007: Codify Groq-Only MVP Provider Boundaries

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- packages/ai packages/api/src/router/sifter.ts .env.example turbo.json .ai/context .ai/contracts`

## Status

- **Priority**: P2
- **Effort**: S/M
- **Risk**: LOW/MED
- **Depends on**: plans/006-trim-sifter-prompts.md
- **Category**: migration
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

Sifter now uses Groq for latency, but the AI package still eagerly imports Google and OpenRouter providers and exports fallback model constants. That ambiguity makes future agents unsure whether multi-provider fallback is product behavior or migration residue. The MVP should either be clearly Groq-only or explicitly tested as multi-provider.

## Current State

Relevant excerpts:

```ts
// packages/api/src/router/sifter.ts:5
import { createGroqModel } from "@turbo/ai/client";
```

```ts
// packages/ai/src/client.ts:2
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
```

```ts
// packages/ai/src/client.ts:87
export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});
```

```json
// packages/ai/package.json:27
"@ai-sdk/google": "^3.0.80",
"@ai-sdk/groq": "3.0.39",
"@openrouter/ai-sdk-provider": "^2.9.0"
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Search callers | `rg -n "googleAI|openRouter|gemini|createGemini|openRouter" --glob '!pnpm-lock.yaml'` | only intentional docs/tests remain |
| AI tests | `pnpm -F @turbo/ai test` | exit 0 |
| API tests | `pnpm -F @turbo/api test` | exit 0 |
| Contracts | `pnpm ai:contracts && pnpm ai:contracts:check` | exit 0 |

## Scope

**In scope**:

- `packages/ai/src/client.ts`
- `packages/ai/src/types.ts`
- `packages/ai/src/index.ts`
- `packages/ai/package.json`
- `packages/api/src/router/sifter.ts`
- `.env.example`
- `turbo.json`
- `.ai/context/tech-stack.md`
- generated `.ai/contracts/*`

**Out of scope**:

- Live provider calls.
- Reintroducing NVIDIA.
- Building a provider fallback system unless the repo owner explicitly chooses that over Groq-only MVP.

## Git Workflow

- Branch: `advisor/007-codify-groq-provider-boundaries`
- Commit message: `refactor(ai): codify groq provider boundary`.

## Steps

### Step 1: Choose the MVP provider policy

Default to Groq-only for the MVP because the current Sifter route gates on `GROQ_API_KEY`. Confirm no active code imports Google/OpenRouter helpers.

**Verify**: `rg -n "googleAI|openRouter|gemini|createGemini|openRouter" --glob '!pnpm-lock.yaml'` -> only stale provider code/docs or no matches.

### Step 2: Split or prune provider helpers

Either:

- remove Google/OpenRouter exports and dependencies if no active callers exist, or
- move Groq helpers into a Groq-specific export such as `@turbo/ai/groq` and make other providers lazy/clearly dormant.

For the MVP, prefer the smallest Groq-only runtime import path for `packages/api/src/router/sifter.ts`.

**Verify**: `pnpm -F @turbo/ai typecheck && pnpm -F @turbo/api typecheck` -> exit 0.

### Step 3: Add provider helper tests

Add tests that mock `@ai-sdk/groq` and assert `GROQ_API_KEY` and default model ID are wired as expected. Do not use live network or real keys.

**Verify**: `pnpm -F @turbo/ai test` -> all tests pass.

### Step 4: Refresh env and AI docs/contracts

Remove or mark non-Groq provider env vars as dormant according to the chosen policy. Update `.env.example`, `turbo.json`, `.ai/context/tech-stack.md`, and generated contracts.

**Verify**: `pnpm ai:contracts && pnpm ai:contracts:check` -> exit 0.

## Test Plan

- Unit tests for Groq provider helper construction.
- API Sifter tests remain mocked and green.
- Workspace search confirms removed providers are not active imports.

## Done Criteria

- [ ] Sifter imports a Groq-specific helper or a clearly Groq-only client path.
- [ ] Provider env contract matches the MVP policy.
- [ ] `@turbo/ai` has tests for the Groq helper.
- [ ] AI contracts are regenerated and clean.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Active non-Sifter code imports Google/OpenRouter helpers.
- Removing provider dependencies breaks package consumers that are still in scope.
- The owner chooses multi-provider fallback; this plan should be rewritten as a fallback-policy plan with tests.

## Maintenance Notes

If fallback providers are added later, document the exact order, failure behavior, env requirements, and tests. Do not leave unused provider imports in the hot Sifter path.

