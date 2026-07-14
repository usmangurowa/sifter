import { initAuth, resolveAuthRuntimeSecrets } from "@turbo/auth";
import { sendOTPEmail } from "@turbo/mail/client";

import { env } from "./env.js";

const authSecrets = resolveAuthRuntimeSecrets({
  authSecret: env.AUTH_SECRET,
  supabaseJwtSecret: env.SUPABASE_JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
});

export const auth = initAuth({
  baseUrl: env.SERVER_URL,
  productionUrl: env.SERVER_URL,
  secret: authSecrets.secret,
  supabaseJwtSecret: authSecrets.supabaseJwtSecret,
  socialProviders: {
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
  },
  sendOTPEmail: async ({ email, otp, type }) => {
    await sendOTPEmail({ to: email, otp, type });
  },
});
