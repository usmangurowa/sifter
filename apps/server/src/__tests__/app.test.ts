import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { createServerApp } from "../app";

describe("createServerApp", () => {
  const originalSkipEnvValidation = process.env.SKIP_ENV_VALIDATION;
  const authResponseBody = "auth handler";
  const auth = {
    api: {
      getSession: () => Promise.resolve(null),
    },
    handler: () => Promise.resolve(new Response(authResponseBody)),
  } as unknown as Parameters<typeof createServerApp>[0];

  beforeEach(() => {
    process.env.SKIP_ENV_VALIDATION = "1";
  });

  afterEach(() => {
    if (originalSkipEnvValidation === undefined) {
      delete process.env.SKIP_ENV_VALIDATION;
      return;
    }

    process.env.SKIP_ENV_VALIDATION = originalSkipEnvValidation;
  });

  it("serves the shared API health route", async () => {
    const { createServerApp } = await import("../app");
    const app = createServerApp(auth, {
      allowedOrigins: ["http://localhost:3001", "expo://"],
    });

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe("OK");
  });

  it("serves the shared API under the /api base path", async () => {
    const { createServerApp } = await import("../app");
    const app = createServerApp(auth, {
      allowedOrigins: ["http://localhost:3001", "expo://"],
    });

    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe("OK");
  });

  it("mounts Better Auth handlers under the /api/auth base path", async () => {
    const { createServerApp } = await import("../app");
    const app = createServerApp(auth, {
      allowedOrigins: ["http://localhost:3001", "expo://"],
    });

    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe(authResponseBody);
  });

  it("serves Sifter through the public API path without auth context", async () => {
    const { createServerApp } = await import("../app");
    const getSession = vi.fn(async () => {
      throw new Error("Sifter should not require auth context");
    });
    const app = createServerApp(
      {
        api: {
          getSession,
        },
        handler: () => Promise.resolve(new Response(authResponseBody)),
      } as unknown as Parameters<typeof createServerApp>[0],
      {
        allowedOrigins: ["http://localhost:3001", "expo://"],
      },
    );

    const response = await app.request("/api/sifter/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Enter a request under 500 characters.",
    });
    expect(getSession).not.toHaveBeenCalled();
  });

  it("applies security middleware to Better Auth handlers", async () => {
    const { createServerApp } = await import("../app");
    const app = createServerApp(auth, {
      allowedOrigins: ["http://localhost:3001", "expo://"],
    });

    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: "http://localhost:3001",
        "x-forwarded-for": "203.0.113.42",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3001",
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });
});
