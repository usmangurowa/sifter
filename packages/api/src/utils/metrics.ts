import { TZDate } from "@date-fns/tz";
import { endOfDay, startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

import type { db as DB } from "@turbo/db/client";
import { heartbeat } from "@turbo/db/schema";
import { calculateAllMetrics } from "@turbo/shared";

/**
 * Get start and end of "today" in the user's local timezone
 * @param timezone - IANA timezone name (e.g., "Africa/Lagos", "America/New_York")
 *                   Falls back to "UTC" if not provided
 */
export const getLocalDateBounds = (timezone = "UTC") => {
  // Create a TZDate in the user's timezone
  // TZDate handles all timezone conversions correctly
  const now = new TZDate(new Date(), timezone);

  // Get start and end of day in the user's timezone
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Convert to UTC Date objects for database queries
  return {
    todayStart: new Date(todayStart.getTime()),
    todayEnd: new Date(todayEnd.getTime()),
  };
};

interface HeartbeatData {
  timestamp: Date;
  isWrite: boolean;
}

interface CalculateMetricsOptions {
  /** User's configured keystroke timeout in seconds (optional) */
  keystrokeTimeoutSeconds?: number;
}

/**
 * Calculate metrics from heartbeats
 * @param heartbeats - Array of heartbeats
 * @param options - Optional config (e.g., user's custom keystroke timeout)
 */
export const calculateMetrics = (
  heartbeats: HeartbeatData[],
  options?: CalculateMetricsOptions,
) => {
  // Use shared calculation functions (wakatime-compatible algorithm)
  // Calculate all metrics in a single pass (O(N))
  const { sessions, flows, codingTimeSeconds, flowTimeSeconds } =
    calculateAllMetrics(
      heartbeats,
      options?.keystrokeTimeoutSeconds
        ? { keystrokeTimeoutSeconds: options.keystrokeTimeoutSeconds }
        : undefined,
    );

  // Calculate flow efficiency: percentage of time spent in flow states
  // 0 if no coding time to avoid division by zero
  const flowEfficiency =
    codingTimeSeconds > 0
      ? Math.round((flowTimeSeconds / codingTimeSeconds) * 100)
      : 0;

  return {
    heartbeats: heartbeats.length,
    sessions,
    flows,
    codingTimeMinutes: Math.round(codingTimeSeconds / 60),
    codingTimeSeconds,
    flowTimeSeconds,
    flowEfficiency,
  };
};

/**
 * Fetch today's metrics for a user
 * @param db - Database client
 * @param userId - User ID
 * @param timezone - IANA timezone name (e.g., "Africa/Lagos")
 * @param sessionTimeoutMinutes - User's configured session timeout in minutes (optional)
 */
export const fetchTodayMetrics = async (
  db: typeof DB,
  userId: string,
  timezone = "UTC",
  sessionTimeoutMinutes?: number,
) => {
  const { todayStart, todayEnd } = getLocalDateBounds(timezone);

  const heartbeats = await db
    .select({
      timestamp: heartbeat.timestamp,
      isWrite: heartbeat.isWrite,
    })
    .from(heartbeat)
    .where(
      and(
        eq(heartbeat.userId, userId),
        gte(heartbeat.timestamp, todayStart),
        lte(heartbeat.timestamp, todayEnd),
      ),
    )
    .orderBy(heartbeat.timestamp);

  // Convert user's minutes to seconds for the calculation
  const options = sessionTimeoutMinutes
    ? { keystrokeTimeoutSeconds: sessionTimeoutMinutes * 60 }
    : undefined;

  return calculateMetrics(heartbeats, options);
};
