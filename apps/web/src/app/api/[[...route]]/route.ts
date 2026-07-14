import { env } from "@/env";
import { Hono } from "hono";
import { handle } from "hono/vercel";

import { createPublicApp } from "@turbo/api/public";
import { resolveTrustedOrigins } from "@turbo/auth/trusted-origins";

// Create a parent app with basePath /api
const app = new Hono().basePath("/api");

const apiApp = createPublicApp({
  security: {
    // Allow requests from the web app and mobile app (expo)
    allowedOrigins: resolveTrustedOrigins(env.NEXT_PUBLIC_APP_URL, "expo://"),
    // Sifter MVP free usage guardrail: roughly 10 requests per hour per IP.
    rateLimit: 10,
    rateLimitWindow: 60 * 60 * 1000,
  },
});
app.route("/", apiApp);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
