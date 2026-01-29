import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { env } from "@/env";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@turbo/auth";
import { sendOTPEmail } from "@turbo/mail/client";

const baseUrl =
  env.VERCEL_ENV === "production"
    ? env.NEXT_PUBLIC_APP_URL
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = initAuth({
  baseUrl,
  productionUrl: env.NEXT_PUBLIC_APP_URL,
  secret: env.AUTH_SECRET ?? "development-secret-change-in-production",
  supabaseJwtSecret:
    env.SUPABASE_JWT_SECRET ?? "development-secret-change-in-production",
  socialProviders: {
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
  },
  extraPlugins: [nextCookies()],
  sendOTPEmail: async ({ email, otp, type }) => {
    await sendOTPEmail({ to: email, otp, type });
  },
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
