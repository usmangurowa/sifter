# Feature Spec: Sifter Local Prompt History

## Status

- State: draft
- Owner: AI agent
- Created: 2026-07-14
- Updated: 2026-07-14

## Problem

Sifter currently shows only static suggested prompts and one suggestion includes
a price claim. The product should remember recent prompts locally so the landing
page feels more personal without adding accounts, database state, or another AI
call.

## Acceptance Criteria

- [ ] Sifter stores recent submitted prompts in browser `localStorage`.
- [ ] The landing suggestion chips prioritize recent prompts when available.
- [ ] Static launch suggestions do not include price-floor wording such as
      "under $10".
- [ ] No saved prompt data is sent to a provider for suggestion generation in
      this slice.
- [ ] Chat remains a single-search assistant flow; follow-up submissions start a
      fresh sift instead of relying on hidden conversation memory.

## Expected Files

| File                                            | Expected change                               |
| ----------------------------------------------- | --------------------------------------------- |
| `apps/web/src/components/sifter/sifter-app.tsx` | Save/load recent prompts and render chips     |
| `packages/shared/src/sifter.ts`                 | Remove price-based static suggestion wording  |
| `packages/shared/src/__tests__/sifter.test.ts`  | Guard static suggestions against price claims |
| `ROADMAP_AI.md`                                 | Record local prompt history behavior          |

## Contracts

| Contract        | Change? | Notes                                       |
| --------------- | ------- | ------------------------------------------- |
| API routes      | no      | No request/response changes                 |
| DB schema       | no      | Browser-only storage                        |
| Env vars        | no      | No new provider/env requirement             |
| Package exports | no      | Existing shared constants only              |
| UI tokens       | no      | No shared design-token change               |
| Agent memory    | yes     | Roadmap ledger updated for product behavior |

## Pseudocode

```text
1. Replace price-based static suggestion with neutral quality wording.
2. On client mount, read recent prompt strings from localStorage.
3. On every submitted prompt, normalize and persist it at the front of history.
4. Render recent prompts first, then fill with static suggestions.
5. Keep chat submissions stateless from the API perspective.
```

## Validation Plan

- [ ] `pnpm -F @turbo/shared test`
- [ ] `pnpm -F @turbo/web typecheck`
- [ ] `pnpm -F @turbo/web lint`
- [ ] `pnpm -F @turbo/web build`
- [ ] `git diff --check`

## Rollback Plan

Remove the `localStorage` read/write helpers and return landing chips to
`SIFTER_SUGGESTIONS` only.

## Notes

Provider-generated suggestions can be revisited later behind an explicit
personalization setting. It should not be added silently because previous
prompts can reveal shopping intent and preferences.
