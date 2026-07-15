# Feature Spec: Sifter Fashion Kit grounding

## Problem

Sifter already separates marketplace search terms from verification checks, but
the result cards do not explain why each search term is useful. Fashion Kit
shows that users learn faster when each candidate query includes a short
material/construction reason and when quality units are available as a compact
decoder.

## Acceptance Criteria

- [x] Sifter API categories return search terms as `{ term, why }` objects.
- [x] Each search term includes a concise, product-specific reason.
- [x] Result cards still copy/search with the raw term string.
- [x] Result cards render the reason without adding heavy card chrome.
- [x] Sifter prompt teaches “search terms find candidates; labels/reviews
      verify.”
- [x] A compact material decoder appears in chat results.
- [x] Existing SHEIN/Temu search links continue using encoded term strings.

## Expected Files

| File                                             | Purpose                                  |
| ------------------------------------------------ | ---------------------------------------- |
| `packages/validators/src/index.ts`               | Update Sifter response contract          |
| `packages/shared/src/sifter.ts`                  | Add search-term reasons and decoder data |
| `packages/api/src/router/sifter.ts`              | Update prompt contract/rules             |
| `apps/web/src/components/sifter/result-card.tsx` | Render search reasons                    |
| `apps/web/src/components/sifter/sifter-app.tsx`  | Render material decoder                  |

## Contract Changes

| Surface                | Change                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| API response           | `categories[].searchTerms` changes from `string[]` to `{ term: string; why: string }[]` |
| DB/env/package exports | No change                                                                               |

## Validation Plan

- `pnpm -F @turbo/validators test`
- `pnpm -F @turbo/shared test`
- `pnpm -F @turbo/api test`
- `pnpm -F @turbo/web typecheck`
- `pnpm -F @turbo/web lint`
- `pnpm -F @turbo/web build`
- `pnpm ai:contracts`
- `pnpm ai:context`
- `pnpm ai:contracts:check`
