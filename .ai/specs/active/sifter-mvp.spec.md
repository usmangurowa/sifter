# Feature Spec: Sifter MVP

## Status

- State: draft
- Owner: AI agent
- Created: 2026-07-14
- Updated: 2026-07-14

## Problem

The current web app still presents the template auth-first experience. Sifter
needs a public, mobile-first AI shopping assistant that helps users generate
quality-focused Temu and SHEIN search terms without requiring auth, Supabase, or
database configuration.

## Acceptance Criteria

- [ ] `/` renders the Sifter assistant instead of redirecting to `/login`.
- [ ] Users can submit a 1-500 character shopping request and receive
      structured result cards with search terms, Temu/SHEIN links, quality tips,
      avoid warnings, and shopping tips.
- [ ] AI shopping advice uses an expanded material-quality taxonomy covering
      clothing, jewelry, shoes, watches, bags, perfumes, workwear, and staple
      wardrobe categories.
- [ ] After a prompt is submitted, the landing hero transitions into a
      chat-style surface with the user's prompt as a message and Sifter's output
      inside one bounded assistant response panel.
- [ ] SHEIN discount codes are available from a header sheet and can be copied.
- [ ] The web app builds without Supabase env vars, `POSTGRES_URL`, or
      `AUTH_SECRET`.
- [ ] `packages/supabase` and all `@turbo/supabase` workspace dependencies are
      removed.
- [ ] AI/provider configuration fails gracefully when `GROQ_API_KEY` is
      missing.

## Expected Files

| File                                | Expected change                         |
| ----------------------------------- | --------------------------------------- |
| `apps/web/src/app/page.tsx`         | Public Sifter assistant entrypoint      |
| `apps/web/src/components/sifter/*`  | App-specific Sifter UI components       |
| `packages/api/src/router/sifter.ts` | Public Sifter chat endpoint             |
| `packages/validators/src/index.ts`  | Sifter request/response schemas         |
| `packages/shared/src/sifter.ts`     | Sifter constants and search URL helpers |
| `packages/ai/src/client.ts`         | Groq provider helper for Sifter         |
| `packages/supabase/*`               | Removed                                 |

## Contracts

| Contract        | Change? | Notes                                                                                           |
| --------------- | ------- | ----------------------------------------------------------------------------------------------- |
| API routes      | yes     | Add `POST /api/sifter/chat`                                                                     |
| DB schema       | no      | Sifter MVP stores no data                                                                       |
| Env vars        | yes     | Add optional `GROQ_API_KEY`; remove Supabase public envs; make dormant web DB/auth env optional |
| Package exports | yes     | Remove `@turbo/supabase`; add Sifter helper export from `@turbo/shared`                         |
| UI tokens       | no      | Uses existing theme tokens with page-local composition                                          |
| Agent memory    | yes     | Update tech stack, roadmap, generated contracts/context                                         |

## Pseudocode

```text
1. Validate chat request with sifterChatRequestSchema.
2. If GROQ_API_KEY is missing, return a typed configuration error.
3. Generate a structured Sifter response using the embedded prompt, expanded
   quality taxonomy, and schema.
4. Validate/normalize result shape and return success JSON.
5. Render the response inside a chat-style assistant panel with copy and
   platform-link actions.
```

## Validation Plan

- [ ] `pnpm install`
- [ ] `pnpm -F @turbo/api test`
- [ ] `pnpm -F @turbo/api typecheck`
- [ ] `pnpm -F @turbo/web typecheck`
- [ ] `pnpm -F @turbo/web lint`
- [ ] `pnpm -F @turbo/web build`
- [ ] `pnpm lint:ws`
- [ ] `pnpm ai:contracts`
- [ ] `pnpm ai:context`
- [ ] `pnpm ai:contracts:check`

## Rollback Plan

Revert the Sifter route/components, restore the previous `apps/web` redirect and
Supabase package/dependencies, then rerun `pnpm install` and AI contract
generation.

## Notes

- Sifter replaces `apps/web`; no new app is created.
- Auth, DB, billing, image upload, affiliate tagging, and saved searches remain
  post-MVP.
