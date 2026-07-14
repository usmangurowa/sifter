# Feature Spec: Sifter search grounding

## Status

- State: active
- Owner: AI agent
- Created: 2026-07-14
- Updated: 2026-07-14

## Problem

Sifter currently returns only search terms plus high-level pro/avoid guidance.
Some exact quality signals, such as denim fiber percentages, are useful
verification criteria but unreliable as Temu/SHEIN search-box phrases. Sifter
needs to distinguish candidate-finding searches from listing details users must
verify before buying.

## Acceptance Criteria

- [ ] Sifter category responses include `verificationChecks` with 3-6 concrete
      listing checks.
- [ ] Search terms remain clickable/copyable and continue to drive Temu/SHEIN
      links.
- [ ] GSM-heavy categories keep GSM in search terms where useful.
- [ ] Jeans and similar exact-composition categories use broader platform-native
      search terms and move exact fiber ratios into verification checks.
- [ ] Result cards show a visible "Verify before buying" checklist.
- [ ] API prompt clearly instructs the model that search terms find candidates
      and verification checks validate listings.

## Expected Files

| File                                             | Expected change                                  |
| ------------------------------------------------ | ------------------------------------------------ |
| `packages/validators/src/index.ts`               | Add `verificationChecks` to Sifter category data |
| `packages/shared/src/sifter.ts`                  | Add verification data and grounded prompt text   |
| `packages/api/src/router/sifter.ts`              | Update prompt rules and schema key instructions  |
| `apps/web/src/components/sifter/result-card.tsx` | Render verification checklist                    |
| `ROADMAP_AI.md`                                  | Record search grounding slice                    |

## Contracts

| Contract        | Change? | Notes                                                                           |
| --------------- | ------- | ------------------------------------------------------------------------------- |
| API routes      | yes     | Existing `POST /sifter/chat` response category shape adds `verificationChecks`. |
| DB schema       | no      | No database changes.                                                            |
| Env vars        | no      | No environment changes.                                                         |
| Package exports | no      | Existing package entry points remain unchanged.                                 |
| UI tokens       | no      | App-local component styling only.                                               |
| Agent memory    | yes     | Roadmap and generated AI contracts/context are refreshed.                       |

## Validation Plan

- [ ] `pnpm -F @turbo/validators test`
- [ ] `pnpm -F @turbo/shared test`
- [ ] `pnpm -F @turbo/api test`
- [ ] `pnpm -F @turbo/web typecheck`
- [ ] `pnpm -F @turbo/web lint`
- [ ] `pnpm -F @turbo/web build`
- [ ] `pnpm ai:contracts`
- [ ] `pnpm ai:context`
- [ ] `pnpm ai:contracts:check`

## Rollback Plan

Revert the Sifter validator, prompt, shared taxonomy, API tests, and result-card
changes together. Because the response contract changes, rollback must keep API
and web expectations in sync.
