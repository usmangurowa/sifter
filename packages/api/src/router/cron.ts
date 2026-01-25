import type { Context } from "hono";
import { Hono } from "hono";

import { completeStaleSessions } from "@turbo/jobs/domain/session-completion";

import type { AppContext } from "../context";

/**
 * Cron router - handles scheduled tasks that can be called by external cron services.
 */
const app = new Hono<AppContext>()
  /**
   * POST /cron/complete-sessions - Complete stale coding sessions with AI summaries.
   *
   * Optimized for Vercel Edge Function limits:
   * - Batch size: 10 sessions per invocation
   * - AI concurrency: 5 parallel requests
   * - Timeout: Early exit before 5-minute limit (starts check after 4 mins)
   *
   * Called every 15-20 minutes by an external cron service.
   */
  .post("/complete-sessions", handleCompleteSessions)
  .get("/complete-sessions", handleCompleteSessions);

async function handleCompleteSessions(c: Context) {
  // TODO: Add x-cron-secret header validation for production security
  // const cronSecret = c.req.header("x-cron-secret");
  // const expectedSecret = process.env.CRON_SECRET;
  // if (!expectedSecret || cronSecret !== expectedSecret) {
  //   return c.json({ error: "Unauthorized" }, 401);
  // }

  // Use shared service with optimizations for Edge
  const result = await completeStaleSessions({
    batchSize: 20,
    concurrency: 3,
    // 4 minutes (240s) safety buffer before Vercel 5m (300s) timeout
    timeLimitMs: 4 * 60 * 1000,
  });

  return c.json(result);
}

export default app;
