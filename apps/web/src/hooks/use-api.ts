import { useMemo } from "react";
import { env } from "@/env";
import { hc } from "hono/client";

import type { AppType } from "@turbo/api";

import { useSession } from "./use-session";

export const useApi = () => {
  const { data: session } = useSession();

  const client = useMemo(() => {
    return hc<AppType>(env.NEXT_PUBLIC_APP_URL + "/api", {
      headers: {
        Authorization: session?.user ? `Bearer ${session.user.id}` : "",
      },
    });
  }, [session?.user]);

  return client;
};
