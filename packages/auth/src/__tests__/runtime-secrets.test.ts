import { describe, expect, it } from "vitest";

import { resolveAuthRuntimeSecrets } from "../runtime-secrets";

describe("resolveAuthRuntimeSecrets", () => {
  it("should return a local fallback in development when secrets are missing", () => {
    expect(
      resolveAuthRuntimeSecrets({
        authSecret: undefined,
        supabaseJwtSecret: undefined,
        nodeEnv: "development",
      }),
    ).toEqual({
      secret: "sifter-local-development-secret",
      supabaseJwtSecret: "sifter-local-development-secret",
    });
  });

  it("should throw in production when AUTH_SECRET is missing", () => {
    expect(() =>
      resolveAuthRuntimeSecrets({
        authSecret: undefined,
        supabaseJwtSecret: "provided-supabase-secret",
        nodeEnv: "production",
      }),
    ).toThrow("AUTH_SECRET is required for production auth configuration.");
  });

  it("should throw in production when SUPABASE_JWT_SECRET is missing", () => {
    expect(() =>
      resolveAuthRuntimeSecrets({
        authSecret: "provided-auth-secret",
        supabaseJwtSecret: undefined,
        nodeEnv: "production",
      }),
    ).toThrow(
      "SUPABASE_JWT_SECRET is required for production auth configuration.",
    );
  });

  it("should throw when a production deployment marker is present", () => {
    expect(() =>
      resolveAuthRuntimeSecrets({
        authSecret: undefined,
        supabaseJwtSecret: "provided-supabase-secret",
        nodeEnv: "development",
        vercelEnv: "production",
      }),
    ).toThrow("AUTH_SECRET is required for production auth configuration.");
  });

  it("should return provided secrets in production", () => {
    expect(
      resolveAuthRuntimeSecrets({
        authSecret: "provided-auth-secret",
        supabaseJwtSecret: "provided-supabase-secret",
        nodeEnv: "production",
      }),
    ).toEqual({
      secret: "provided-auth-secret",
      supabaseJwtSecret: "provided-supabase-secret",
    });
  });
});
