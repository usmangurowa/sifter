import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Get the API URL from Expo constants or fallback to local development
const getBaseURL = (): string => {
  // In development, use the local machine's IP
  // In production, use the production URL
  const devURL = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const prodURL = process.env.EXPO_PUBLIC_API_URL;

  return prodURL ?? devURL ?? "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "turbo",
      storagePrefix: "turbo",
      storage: SecureStore,
    }),
  ],
});

// Export typed hooks
export const { useSession, signIn, signUp, signOut } = authClient;
