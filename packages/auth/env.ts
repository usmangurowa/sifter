import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

/** Accepts a non-empty string OR an empty string (treated as unset) */
const optionalString = z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .optional();

export function authEnv() {
  // Skip strict validation during build - runtime validation will catch missing vars
  const skipStrict =
    !!process.env.CI ||
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint" ||
    process.env.npm_lifecycle_event === "build";

  return createEnv({
    server: {
      AUTH_SECRET: skipStrict ? optionalString : z.string().min(1),
      SUPABASE_JWT_SECRET: optionalString,
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),
      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    runtimeEnv: process.env,
    skipValidation: skipStrict,
  });
}
