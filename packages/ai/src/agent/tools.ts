/**
 * AI Coach Agent Tools
 *
 * Tools that the AI coach can call to fetch user data on-demand.
 * Returns compact markdown to minimize token usage.
 */
import { tool } from "ai";
import { z } from "zod";

/**
 * Data provider interface that the API will implement.
 * This allows the tools to be defined separately from the data fetching logic.
 */
export interface CoachDataProvider {
  getHeartbeats: (
    startDate: Date,
    endDate: Date,
  ) => Promise<{
    totalMinutes: number;
    sessionCount: number;
    topProject: string | null;
  }>;
  getSessions: (
    startDate: Date,
    endDate: Date,
  ) => Promise<{
    sessions: {
      title: string | null;
      actionTag: string | null;
      project: string | null;
    }[];
  }>;
}

/**
 * Create tools for the coach agent.
 * The data provider is injected so the API can pass its own DB access.
 */
export const createCoachTools = (provider: CoachDataProvider) => {
  return {
    getHeartbeats: tool({
      description:
        "Get aggregate heartbeat stats for a date range. Returns coding time, session count, and top project. Use this to compare time across periods.",
      inputSchema: z.object({
        startDate: z.string().describe("ISO date string for range start"),
        endDate: z.string().describe("ISO date string for range end"),
      }),
      execute: async ({ startDate, endDate }) => {
        const data = await provider.getHeartbeats(
          new Date(startDate),
          new Date(endDate),
        );

        // Round to 1 decimal place: multiply first, round, then divide
        const hours = Math.round((data.totalMinutes / 60) * 10) / 10;
        return `Coding: ${hours}h | Sessions: ${data.sessionCount} | Top Project: ${data.topProject ?? "None"}`;
      },
    }),

    getSessions: tool({
      description:
        "Get completed session summaries for a date range. Returns session titles and activity types (building, debugging, etc).",
      inputSchema: z.object({
        startDate: z.string().describe("ISO date string for range start"),
        endDate: z.string().describe("ISO date string for range end"),
      }),
      execute: async ({ startDate, endDate }) => {
        const data = await provider.getSessions(
          new Date(startDate),
          new Date(endDate),
        );

        if (data.sessions.length === 0) {
          return "No sessions in this period.";
        }

        // Return compact markdown list (abstracts filenames to feature names)
        const lines = data.sessions.slice(0, 5).map((s) => {
          const title = s.title ?? "Untitled";
          const tag = s.actionTag ?? "coding";
          return `- ${title} (${tag})`;
        });

        if (data.sessions.length > 5) {
          lines.push(`- ...and ${data.sessions.length - 5} more`);
        }

        return lines.join("\n");
      },
    }),
  };
};

export type CoachTools = ReturnType<typeof createCoachTools>;
