import { Hono } from "hono";

import type { AppContext } from "./context";
import type { CreateAppOptions } from "./index";
import {
  corsMiddleware,
  rateLimitMiddleware,
  secureHeadersMiddleware,
} from "./middleware/security";
import { timingMiddleware } from "./middleware/timing";
import sifterRouter from "./router/sifter";

/**
 * Create a public API app for routes that do not need auth or database context.
 */
export const createPublicApp = (options: CreateAppOptions = {}) => {
  const { security = {} } = options;

  const app = new Hono<AppContext>()
    .use("*", secureHeadersMiddleware())
    .use("*", corsMiddleware(security))
    .use("*", rateLimitMiddleware(security))
    .use("*", timingMiddleware)
    .route("/sifter", sifterRouter)
    .get("/health", (c) => c.text("OK"));

  return app;
};
