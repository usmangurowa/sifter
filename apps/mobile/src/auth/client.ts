import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "@/utils/base-url";

const scheme = Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_SCHEME ?? "turbo";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme,
      storagePrefix: scheme,
      storage: SecureStore,
    }),
  ],
});

// Export typed hooks
export const { useSession, signIn, signUp, signOut } = authClient;
