import { schedules } from "@trigger.dev/sdk/v3";

import { completeStaleSessions } from "../domain/session-completion";

/**
 * Scheduled task that runs every 15 minutes to find and complete stale sessions.
 *
 * Uses the shared `completeStaleSessions` domain logic.
 */
export const completeStaleSessionsTask = schedules.task({
  id: "complete-stale-sessions",
  cron: "*/15 * * * *", // Every 15 minutes
  run: async () => {
    // Keep batch size small to stay within 5 minute timeout
    // With 5 concurrent AI calls and ~5-10s per call, 20 sessions ≈ 20-40s
    return await completeStaleSessions({
      batchSize: 20,
      concurrency: 3,
    });
  },
});
