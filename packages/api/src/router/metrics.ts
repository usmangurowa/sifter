import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod/v4";

import { codingSession, heartbeat, userSettings } from "@turbo/db/schema";

import type { AppContext } from "../context";
import { apiKeyMiddleware } from "../middleware/api-key";
import { authMiddleware } from "../middleware/auth";
import {
  calculateMetrics,
  fetchTodayMetrics,
  getLocalDateBounds,
} from "../utils/metrics";

/**
 * Query params schema for metrics endpoint
 * Accepts ISO 8601 date strings with timezone offset (e.g., 2025-12-24T00:00:00+01:00)
 * z.coerce.date() correctly parses these to UTC Date objects
 */
const MetricsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Metrics router - provides aggregated coding metrics for the dashboard.
 * All routes require session authentication.
 */
const app = new Hono<AppContext>()
  /**
   * GET /metrics - Get aggregated metrics for a date range
   * Requires session authentication (for web dashboard)
   * Accepts ISO 8601 dates with timezone (e.g., 2025-12-24T00:00:00+01:00)
   */
  .get(
    "/",
    authMiddleware,
    zValidator("query", MetricsQuerySchema),
    async (c) => {
      const db = c.get("db");
      const session = c.get("session");

      // authMiddleware guarantees session.user exists, but handle edge case
      if (!session?.user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userId = session.user.id;
      const { startDate, endDate } = c.req.valid("query");

      // Default to today in UTC if no dates provided
      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

      const start = startDate ?? todayStart;
      const end = endDate ?? todayEnd;

      // Fetch heartbeats and completed sessions in parallel
      const [heartbeats, settings, completedSessions] = await Promise.all([
        db
          .select({
            timestamp: heartbeat.timestamp,
            isWrite: heartbeat.isWrite,
          })
          .from(heartbeat)
          .where(
            and(
              eq(heartbeat.userId, userId),
              gte(heartbeat.timestamp, start),
              lte(heartbeat.timestamp, end),
            ),
          )
          .orderBy(heartbeat.timestamp),

        db.query.userSettings.findFirst({
          where: eq(userSettings.userId, userId),
          columns: { sessionTimeoutMinutes: true },
        }),

        // Count completed sessions from database (consistent with Session Feed)
        db
          .select({ id: codingSession.id })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lte(codingSession.startedAt, end),
            ),
          ),
      ]);

      const metrics = calculateMetrics(
        heartbeats,
        settings?.sessionTimeoutMinutes
          ? { keystrokeTimeoutSeconds: settings.sessionTimeoutMinutes * 60 }
          : undefined,
      );

      return c.json({
        ...metrics,
        // Override derived sessions with actual DB count for consistency
        sessions: completedSessions.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
    },
  )
  /**
   * GET /metrics/today - Get today's metrics for the extension
   * Requires API key authentication (for VS Code extension)
   */
  .get(
    "/today",
    apiKeyMiddleware,
    zValidator("query", z.object({ timezone: z.string().optional() })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("apiKeyUserId");
      const { timezone } = c.req.valid("query");

      // Fetch user settings for custom timeout
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
        columns: { sessionTimeoutMinutes: true },
      });

      const metrics = await fetchTodayMetrics(
        db,
        userId,
        timezone,
        settings?.sessionTimeoutMinutes,
      );
      const { todayStart } = getLocalDateBounds(timezone);

      return c.json({
        ...metrics,
        date: todayStart.toISOString().split("T")[0],
      });
    },
  )
  /**
   * GET /metrics/insights - Get AI-generated daily insights
   * Requires session authentication (for web dashboard)
   * Returns cached insights if available (5-hour TTL), otherwise generates new ones
   */
  .get(
    "/insights",
    authMiddleware,
    zValidator("query", MetricsQuerySchema),
    async (c) => {
      const db = c.get("db");
      const session = c.get("session");

      if (!session?.user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userId = session.user.id;
      const { startDate, endDate } = c.req.valid("query");

      // Default to today in UTC if no dates provided
      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

      const start = startDate ?? todayStart;
      const end = endDate ?? todayEnd;

      // Create cache key based on user and date
      const dateKey = start.toISOString().split("T")[0];
      const cacheKey = `daily-insights:${userId}:${dateKey}`;

      // Check cache first
      const { cacheGet, cacheSet } = await import("@turbo/db");
      const cached = await cacheGet<{
        insights: {
          headline: string;
          summary: string;
          highlights: string[];
          recommendation?: string;
        };
        metrics: {
          heartbeats: number;
          codingTimeSeconds: number;
          sessions: number;
          flows: number;
          flowEfficiency: number;
        };
        generatedAt: string;
      }>(db, cacheKey);

      if (cached) {
        return c.json({
          ...cached,
          cached: true,
        });
      }

      // Fetch metrics
      const [heartbeats, settings, completedSessions] = await Promise.all([
        db
          .select({
            timestamp: heartbeat.timestamp,
            isWrite: heartbeat.isWrite,
          })
          .from(heartbeat)
          .where(
            and(
              eq(heartbeat.userId, userId),
              gte(heartbeat.timestamp, start),
              lte(heartbeat.timestamp, end),
            ),
          )
          .orderBy(heartbeat.timestamp),

        db.query.userSettings.findFirst({
          where: eq(userSettings.userId, userId),
          columns: { sessionTimeoutMinutes: true },
        }),

        db
          .select({ id: codingSession.id })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lte(codingSession.startedAt, end),
            ),
          ),
      ]);

      const metrics = calculateMetrics(
        heartbeats,
        settings?.sessionTimeoutMinutes
          ? { keystrokeTimeoutSeconds: settings.sessionTimeoutMinutes * 60 }
          : undefined,
      );

      // Generate AI insights
      const { generateDailyInsights } = await import("@turbo/ai");
      const { trackApiEvent } = await import("../middleware/analytics");
      const { ANALYTICS_EVENTS } = await import("@turbo/analytics");

      const insights = await generateDailyInsights({
        heartbeats: heartbeats.length,
        codingTimeSeconds: metrics.codingTimeSeconds,
        sessions: completedSessions.length,
        flows: metrics.flows,
        flowEfficiency: metrics.flowEfficiency,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });

      const response = {
        insights,
        metrics: {
          heartbeats: heartbeats.length,
          codingTimeSeconds: metrics.codingTimeSeconds,
          sessions: completedSessions.length,
          flows: metrics.flows,
          flowEfficiency: metrics.flowEfficiency,
        },
        generatedAt: new Date().toISOString(),
      };

      // Cache for 5 hours (5 * 60 * 60 * 1000 ms)
      await cacheSet(db, cacheKey, response, 5 * 60 * 60 * 1000);

      // Track analytics
      trackApiEvent(userId, ANALYTICS_EVENTS.AI_DAILY_INSIGHTS_GENERATED, {
        cached: false,
        dateKey,
      });

      return c.json({
        ...response,
        cached: false,
      });
    },
  );

export default app;
