import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import type { AppContext } from "../context";
import { rateLimitMiddleware } from "../middleware/security";

const createRateLimitedSifterApp = () =>
  new Hono<AppContext>()
    .use(
      "*",
      rateLimitMiddleware({
        rateLimit: 1,
        rateLimitWindow: 60 * 1000,
      }),
    )
    .post("/sifter/chat", (c) => c.json({ success: true }));

const requestSifter = (
  app: ReturnType<typeof createRateLimitedSifterApp>,
  headers: Record<string, string>,
) =>
  app.request("/sifter/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ message: "Find a heavyweight hoodie" }),
  });

describe("rateLimitMiddleware", () => {
  it("uses the same public IP bucket when authorization changes", async () => {
    const app = createRateLimitedSifterApp();

    const firstResponse = await requestSifter(app, {
      authorization: "Bearer unverified-one",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    });
    const secondResponse = await requestSifter(app, {
      authorization: "Bearer unverified-two",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
  });

  it("uses the same public IP bucket when x-api-key changes", async () => {
    const app = createRateLimitedSifterApp();

    const firstResponse = await requestSifter(app, {
      "content-type": "application/json",
      "x-api-key": "unverified-one",
      "x-forwarded-for": "203.0.113.20",
    });
    const secondResponse = await requestSifter(app, {
      "content-type": "application/json",
      "x-api-key": "unverified-two",
      "x-forwarded-for": "203.0.113.20",
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
  });

  it("keeps distinct trusted IP values in separate public rate-limit buckets", async () => {
    const app = createRateLimitedSifterApp();

    const firstResponse = await requestSifter(app, {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.30",
    });
    const secondResponse = await requestSifter(app, {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.31",
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
  });
});
