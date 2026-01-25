import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod/v4";

import { ANALYTICS_EVENTS } from "@turbo/analytics/events";
import {
  apikey,
  heartbeat,
  SyncHeartbeatsSchema,
  userSettings,
} from "@turbo/db/schema";

import type { AppContext } from "../context";
import { trackApiEvent } from "../middleware/analytics";
import { apiKeyMiddleware } from "../middleware/api-key";
import { fetchTodayMetrics } from "../utils/metrics";
import { assignSessionsToHeartbeats } from "../utils/session";

/**
 * Heartbeats router - handles syncing coding activity from the VS Code extension.
 * All routes require API key authentication.
 */
const app = new Hono<AppContext>()
  /**
   * POST /heartbeats - Batch sync heartbeats from the extension
   * Requires API key authentication (x-api-key or Authorization: Bearer)
   * Returns updated today's metrics after sync for efficiency (1 request instead of 2)
   */
  .post(
    "/",
    apiKeyMiddleware,
    zValidator("json", SyncHeartbeatsSchema),
    zValidator("query", z.object({ timezone: z.string().optional() })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("apiKeyUserId");
      const { heartbeats } = c.req.valid("json");
      const { timezone } = c.req.valid("query");

      // Fetch user settings for custom timeout logic
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
        columns: { sessionTimeoutMinutes: true },
      });

      if (heartbeats.length === 0) {
        // Still return metrics even if no heartbeats to sync
        const metrics = await fetchTodayMetrics(
          db,
          userId,
          timezone,
          settings?.sessionTimeoutMinutes,
        );
        return c.json({
          synced: 0,
          userId,
          metrics: {
            codingTimeSeconds: metrics.codingTimeSeconds,
            heartbeatCount: metrics.heartbeats,
            sessions: metrics.sessions,
            flows: metrics.flows,
          },
        });
      }

      // Sort heartbeats by timestamp to process in order
      const sortedHeartbeats = [...heartbeats]
        .map((h) => ({ ...h, timestamp: new Date(h.timestamp) }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Get the API key ID for tracking
      const apiKeyId = c.get("apiKeyId");

      // Batch-assign sessions (optimized: O(k) queries where k = session boundaries)
      // Returns session IDs in the SAME ORDER as input heartbeats (1:1 index correspondence)
      const sessionIds = await assignSessionsToHeartbeats(
        db,
        userId,
        sortedHeartbeats,
        settings?.sessionTimeoutMinutes,
      );

      // Combine heartbeats with their session IDs
      // Safe to use index mapping because assignSessionsToHeartbeats guarantees:
      // sessionIds[i] is the session ID for sortedHeartbeats[i]
      const heartbeatsWithSessions = sortedHeartbeats.map((h, i) => ({
        ...h,
        userId,
        apiKeyId,
        sessionId: sessionIds[i],
      }));

      // Insert all heartbeats with session IDs
      await db.insert(heartbeat).values(heartbeatsWithSessions);

      // Update API key lastRequest timestamp
      await db
        .update(apikey)
        .set({ lastRequest: new Date() })
        .where(eq(apikey.id, apiKeyId));

      // Track sync event
      trackApiEvent(userId, ANALYTICS_EVENTS.SYNC_COMPLETED, {
        count: heartbeats.length,
      });

      // Fetch updated metrics after insertion
      const metrics = await fetchTodayMetrics(
        db,
        userId,
        timezone,
        settings?.sessionTimeoutMinutes,
      );

      return c.json(
        {
          synced: heartbeats.length,
          userId,
          metrics: {
            codingTimeSeconds: metrics.codingTimeSeconds,
            heartbeatCount: metrics.heartbeats,
            sessions: metrics.sessions,
            flows: metrics.flows,
          },
        },
        201,
      );
    },
  );

export default app;
