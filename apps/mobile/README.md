# Sifter Mobile

`apps/mobile` is the Expo Router mobile app in this monorepo. The current Sifter
MVP is web-first, so the mobile app remains available for auth and shared-client
work but is not started by the root `pnpm dev` command.

## Development

From the repository root:

```bash
pnpm dev:mobile
```

From `apps/mobile`:

```bash
pnpm dev
pnpm dev:ios
pnpm dev:android
```

All mobile scripts load the repository root `.env` through `dotenv-cli`.

## Environment

Useful mobile environment knobs:

- `EXPO_PUBLIC_API_URL` points mobile API and auth clients at the web or server
  runtime. When unset, the app derives a local `http://<host>:3000` URL from Expo
  dev-server metadata.
- `EXPO_PUBLIC_APP_NAME`, `EXPO_PUBLIC_APP_SLUG`,
  `EXPO_PUBLIC_APP_SCHEME`, and `EXPO_PUBLIC_PACKAGE_NAME` configure app
  identity in `app.config.ts`.
- `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`, and
  `EXPO_PUBLIC_POSTHOG_HOST` enable optional telemetry.

## Auth And API Ownership

The Better Auth Expo client is owned by `apps/mobile/src/auth/client.ts`.
`apps/mobile/src/utils/auth.ts` only re-exports that client and typed helpers for
legacy imports. The typed Hono RPC client lives in `apps/mobile/src/utils/api.tsx`
and attaches Better Auth cookies from the shared mobile auth client.

## Builds

EAS profiles live in `apps/mobile/eas.json`. Package scripts provide local
development and preview builds, including `pnpm build:ios:dev`,
`pnpm build:ios:prev`, `pnpm build:android:dev`, and
`pnpm build:android:prev`.
