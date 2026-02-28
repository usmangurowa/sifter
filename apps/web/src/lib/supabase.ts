import "server-only";

import { getSession } from "@/auth/server";
import { env } from "@/env";

import {
  createAuthenticatedSupabaseClient,
  createSupabaseClient,
} from "@turbo/supabase";

/**
 * Creates a Supabase client for anonymous access on the server.
 *
 * @returns A Supabase client instance
 */
export function getSupabaseClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Creates an authenticated Supabase client for server-side usage.
 * Uses the current BetterAuth session to authenticate with Supabase.
 *
 * @returns An authenticated Supabase client or null if no session exists
 *
 * @example
 * ```ts
 * // In a server component or API route
 * const supabase = await getAuthenticatedSupabase();
 * if (supabase) {
 *   const { data } = await supabase.from('posts').select('*');
 * }
 * ```
 */
export async function getAuthenticatedSupabase() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const session = await getSession();

  if (!session?.session.token) {
    return null;
  }

  return createAuthenticatedSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    session.session.token,
  );
}
