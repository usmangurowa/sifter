import { Hono } from "hono";

import type { Auth } from "@turbo/auth";
import type { AppContext } from "@turbo/api";
import {
  corsMiddleware,
  createApp,
  rateLimitMiddleware,
  secureHeadersMiddleware,
  timingMiddleware,
} from "@turbo/api";

type ServerAuth = Parameters<typeof createApp>[0] & Pick<Auth, "handler">;

interface CreateServerAppOptions {
  allowedOrigins: string[];
  rateLimit?: number;
  rateLimitWindow?: number;
}

export const createServerApp = (
  auth: ServerAuth,
  {
    allowedOrigins,
    rateLimit = 100,
    rateLimitWindow = 60 * 1000,
  }: CreateServerAppOptions,
) => {
  const security = {
    allowedOrigins,
    rateLimit,
    rateLimitWindow,
  };
  const apiApp = createApp(auth, {
    security,
  });

  const authApp = new Hono<AppContext>()
    .use("*", secureHeadersMiddleware())
    .use("*", corsMiddleware(security))
    .use("*", rateLimitMiddleware(security))
    .use("*", timingMiddleware)
    .on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));

  const app = new Hono<AppContext>()
    .get("/health", (c) => c.text("OK"))
    .route("/api/auth", authApp)
    .route("/api", apiApp);

  return app;
};
