# Plan 006: Trim Sifter Prompts To Relevant Quality Knowledge

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c3befd6..HEAD -- packages/shared/src/sifter.ts packages/shared/src/__tests__/sifter.test.ts packages/api/src/router/sifter.ts packages/api/src/__tests__/sifter.test.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-harden-sifter-rate-limit-identity.md
- **Category**: perf
- **Planned at**: commit `c3befd6`, 2026-07-14

## Why This Matters

Sifter sends every quality category and every reality check on every chat request. That is simple, but it pays avoidable token cost and latency for unrelated categories. A deterministic selector can keep the best parts of the Temu/SHEIN knowledge base while keeping prompts smaller and more predictable.

## Current State

Relevant excerpts:

```ts
// packages/api/src/router/sifter.ts:60
${buildSifterQualityKnowledgePrompt()}`;
```

```ts
// packages/api/src/router/sifter.ts:90
system: SIFTER_SYSTEM_PROMPT,
prompt: message,
```

```ts
// packages/shared/src/sifter.ts:303
export const buildSifterQualityKnowledgePrompt = () =>
  [
    "Expanded quality knowledge:",
    ...SIFTER_QUALITY_CATEGORIES.map(...)
```

The current API test asserts unrelated dress knowledge appears even for a hoodie prompt:

```ts
// packages/api/src/__tests__/sifter.test.ts:135
expect(generateObject).toHaveBeenCalledWith(
  expect.objectContaining({
    system: expect.stringContaining("acetate satin midi dress"),
  }),
);
```

## Commands You Will Need

| Purpose | Command | Expected on success |
|---|---|---|
| Shared tests | `pnpm -F @turbo/shared test` | exit 0 |
| API tests | `pnpm -F @turbo/api test` | exit 0 |
| Typecheck | `pnpm -F @turbo/api typecheck && pnpm -F @turbo/shared typecheck` | exit 0 |

## Scope

**In scope**:

- `packages/shared/src/sifter.ts`
- `packages/shared/src/__tests__/sifter.test.ts`
- `packages/api/src/router/sifter.ts`
- `packages/api/src/__tests__/sifter.test.ts`

**Out of scope**:

- Adding vector search, database retrieval, or external scraping.
- Changing the public response schema.
- Removing the reality checks entirely.

## Git Workflow

- Branch: `advisor/006-trim-sifter-prompts`
- Commit message: `perf(sifter): trim prompt knowledge by query`.

## Steps

### Step 1: Add a deterministic category selector

In `packages/shared/src/sifter.ts`, add a helper that accepts a user message and returns the top matching `SIFTER_QUALITY_CATEGORIES`. Use simple normalized keyword matching against category names, guidance, and search terms. Include a fallback set for unknown queries, plus all `SIFTER_REALITY_CHECKS`.

Keep it deterministic and dependency-free.

**Verify**: `pnpm -F @turbo/shared typecheck` -> exit 0.

### Step 2: Build a per-message prompt

Change the API router so the system prompt is built per request from the selected categories. Keep base instructions static, but append only relevant quality entries plus general reality checks.

**Verify**: `pnpm -F @turbo/api typecheck` -> exit 0.

### Step 3: Update tests

Replace the current assertion that a hoodie prompt contains `acetate satin midi dress`. New tests should prove:

- Hoodie query includes hoodie/sweat knowledge.
- Hoodie query excludes satin dress knowledge.
- Outfit or broad query includes multiple relevant categories.
- Unknown query includes fallback/general quality knowledge and reality checks.

**Verify**: `pnpm -F @turbo/shared test && pnpm -F @turbo/api test` -> all tests pass.

## Test Plan

- Unit tests for selector ranking/fallback.
- API test for generated `system` prompt content.
- Existing URL builder and schema tests remain green.

## Done Criteria

- [ ] Sifter prompt generation is per-message and category-filtered.
- [ ] Tests prove relevant inclusion and unrelated exclusion.
- [ ] API and shared tests pass.
- [ ] Typechecks pass.
- [ ] `plans/README.md` status row updated.

## STOP Conditions

Stop and report if:

- Matching quality is too weak without broad prompt inclusion and cannot be improved with simple deterministic matching.
- The AI SDK call requires a static module-level system prompt.
- The change causes schema or response-shape churn.

## Maintenance Notes

When new quality categories are added, include synonyms or search terms that help the selector match natural user phrases.

