# Sifter Web

`apps/web` is the Next.js 16 App Router runtime for the public Sifter MVP. The
home page mounts the Sifter shopping assistant and calls the public Hono API
through the web app's `/api` route.

## Getting Started

From the repository root:

```bash
pnpm dev
```

This delegates to `pnpm dev:web` and starts only `@turbo/web`, so
[http://localhost:3000](http://localhost:3000) is visible without starting the
mobile app or standalone server. The public Sifter surface does not require auth,
Supabase, or Postgres environment values for startup. Set `GROQ_API_KEY` when
you need live AI responses from `POST /api/sifter/chat`.

## Build

```bash
pnpm -F @turbo/web build
```

The app package build script runs `next build` with `SKIP_ENV_VALIDATION=1` for
CI-friendly builds.

## API Mount

`apps/web/src/app/api/[[...route]]/route.ts` mounts
`createPublicApp()` from `@turbo/api/public` under `/api`. The public Sifter chat
endpoint is `POST /api/sifter/chat`.

Keep API business logic in `packages/api/src/router/`; web app route handlers
should only mount or adapt shared API apps.

## Sifter Components

Sifter UI components live in `apps/web/src/components/sifter/`:

- `sifter-app.tsx` owns the prompt and result flow.
- `chat-input.tsx`, `loading-state.tsx`, and `result-card.tsx` own assistant UI
  states.
- Shared Sifter constants and URL helpers live in `@turbo/shared/sifter`.
