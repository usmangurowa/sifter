import { Hono } from "hono";

import type { SecurityConfig } from "./middleware/security";
import {
  corsMiddleware,
  rateLimitMiddleware,
  secureHeadersMiddleware,
} from "./middleware/security";
import { timingMiddleware } from "./middleware/timing";
import sifterRouter from "./router/sifter";

/**
 * Context for public API routes that do not need auth or database variables.
 */
export interface PublicAppContext {
  Variables: {
    /** Optional verified key bucket when a public route is wrapped by that middleware. */
    apiKeyId?: string;
  };
}

/**
 * Options for creating the public API app.
 */
export interface PublicCreateAppOptions {
  /** Security configuration options */
  security?: SecurityConfig;
}

/**
 * Create a public API app for routes that do not need auth or database context.
 */
export const createPublicApp = (options: PublicCreateAppOptions = {}) => {
  const { security = {} } = options;

  const app = new Hono<PublicAppContext>()
    .use("*", secureHeadersMiddleware())
    .use("*", corsMiddleware(security))
    .use("*", rateLimitMiddleware(security))
    .use("*", timingMiddleware)
    .route("/sifter", sifterRouter)
    .get("/health", (c) => c.text("OK"));

  return app;
};
