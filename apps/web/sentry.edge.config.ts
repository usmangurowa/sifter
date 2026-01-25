import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Enable structured logging API
  enableLogs: true,

  tracesSampleRate: 0.1,
});
