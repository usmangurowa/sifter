/**
 * KV Cache utilities for Postgres-based caching with TTL support.
 */
import { eq, lt } from "drizzle-orm";

import type { db as Database } from "./client";
import { cache } from "./schema";

type DbClient = typeof Database;

/**
 * Get a cached value by key.
 * Returns null if key doesn't exist or has expired.
 */
export const cacheGet = async <T>(
  db: DbClient,
  key: string,
): Promise<T | null> => {
  const result = await db
    .select({ value: cache.value, expiresAt: cache.expiresAt })
    .from(cache)
    .where(eq(cache.key, key))
    .limit(1);

  if (!result[0]) return null;

  // Check if expired
  if (new Date() > result[0].expiresAt) {
    // Delete expired entry
    await db.delete(cache).where(eq(cache.key, key));
    return null;
  }

  try {
    return JSON.parse(result[0].value) as T;
  } catch {
    return null;
  }
};

/**
 * Set a cached value with TTL in milliseconds.
 * Upserts if key already exists.
 */
export const cacheSet = async <T>(
  db: DbClient,
  key: string,
  value: T,
  ttlMs: number,
): Promise<void> => {
  const expiresAt = new Date(Date.now() + ttlMs);
  const jsonValue = JSON.stringify(value);

  await db
    .insert(cache)
    .values({ key, value: jsonValue, expiresAt })
    .onConflictDoUpdate({
      target: cache.key,
      set: { value: jsonValue, expiresAt },
    });
};

/**
 * Delete a cached value by key.
 */
export const cacheDelete = async (db: DbClient, key: string): Promise<void> => {
  await db.delete(cache).where(eq(cache.key, key));
};

/**
 * Clean up all expired cache entries.
 * Run this periodically via cron job.
 */
export const cacheCleanup = async (db: DbClient): Promise<number> => {
  const result = await db
    .delete(cache)
    .where(lt(cache.expiresAt, new Date()))
    .returning({ id: cache.id });

  return result.length;
};

// Cache key helpers
export const CACHE_KEYS = {
  pulse: (userId: string) => `pulse:${userId}`,
  vibeHistory: (userId: string) => `vibe-history:${userId}`,
  standup: (userId: string, dateRangeLabel: string, dateHash: string) =>
    `standup:${userId}:${dateRangeLabel}:${dateHash}`,
  standupUsage: (userId: string, date: string) =>
    `usage:standup:${userId}:${date}`,
} as const;

// Default TTLs
export const CACHE_TTL = {
  PULSE: 15 * 60 * 1000, // 15 minutes
} as const;
