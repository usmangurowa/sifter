# Feature Spec: Sifter UI polish

## Status

- State: accepted
- Owner: AI agent
- Created: 2026-07-14
- Updated: 2026-07-14

## Problem

The Sifter MVP has useful content and interactions, but the visual treatment
still feels too plain. The landing page should keep its simple direct message
while adding a more refined AI-assistant atmosphere, and the response view
should present the same result data in a more polished, predictable chat-style
layout.

## Acceptance Criteria

- [ ] Landing page keeps the existing headline, description, primary input, and
      suggestion chips, but adds a restrained landing-only gradient background
      and more refined input/chip styling.
- [ ] Result cards keep the same category fields, search terms, Temu/SHEIN
      links, pro tip, avoid text, shopping tips, and discount-code behavior.
- [ ] Conversation view uses clearer AI-style message framing inspired by AI
      Elements Conversation/Message/PromptInput patterns without adding a new
      dependency for this visual pass.
- [ ] CTA buttons use restrained gradients and hover states.
- [ ] Mobile and desktop layouts avoid text overlap, layout shift, and overly
      wide line lengths.

## Expected Files

| File                                                | Expected change                                     |
| --------------------------------------------------- | --------------------------------------------------- |
| `apps/web/src/components/sifter/sifter-app.tsx`     | Refine page layout, background, and conversation UI |
| `apps/web/src/components/sifter/chat-input.tsx`     | Refine prompt input styling and submit button       |
| `apps/web/src/components/sifter/result-card.tsx`    | Refine result card/chips/buttons/callout styling    |
| `apps/web/src/components/sifter/loading-state.tsx`  | Match loading state to polished card structure      |
| `apps/web/src/components/sifter/discount-vault.tsx` | Light polish for header action and sheet card rows  |
| `apps/web/src/app/styles.css`                       | Add app-local decorative utilities and color tuning |
| `ROADMAP_AI.md`                                     | Record the Sifter visual polish slice               |

## Contracts

| Contract        | Change? | Notes                                      |
| --------------- | ------- | ------------------------------------------ |
| API routes      | no      | No request/response changes.               |
| DB schema       | no      | No database changes.                       |
| Env vars        | no      | No environment changes.                    |
| Package exports | no      | No package export changes.                 |
| UI tokens       | no      | App-local CSS utilities only.              |
| Agent memory    | yes     | Roadmap ledger records the UI polish work. |

## Pseudocode

```text
1. Keep Sifter state and submit behavior unchanged.
2. Add a landing-only ambient page shell with a subtle top/bottom gradient.
3. Style the landing input/chips as the primary first-viewport experience.
4. Present submitted query and assistant result as message blocks.
5. Convert each category into an individual polished result card.
6. Run focused web validation and visual smoke checks.
```

## Validation Plan

- [ ] `pnpm -F @turbo/web typecheck`
- [ ] `pnpm -F @turbo/web lint`
- [ ] `pnpm -F @turbo/web build`
- [ ] Browser smoke check desktop and mobile widths

## Rollback Plan

Revert the Sifter UI component/style changes. Because this slice does not touch
API contracts, env, database, or package exports, rollback is limited to the web
presentation files and roadmap entry.

## Notes

AI Elements was reviewed for component structure. This slice adapts its
Conversation/Message/PromptInput ideas locally instead of adding the registry
package, because Sifter only needs a narrow visual pass right now. Uiland's
utilities gallery and the Base44 reference informed the softer gradient and
cleaner conversation surface.
