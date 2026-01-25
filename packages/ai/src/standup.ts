import { generateObject } from "ai";
import { z } from "zod";

import { ANALYTICS_EVENTS } from "@turbo/analytics";
import { trackServerEvent } from "@turbo/analytics/server";
import { sanitizeForPrompt } from "@turbo/shared";

import { modelConfig } from "./client";

/**
 * Input for generating a standup.
 */
export interface StandupInput {
  userName: string;
  dateRange: string; // "Yesterday", "Today", "This Week"
  sessions: {
    title: string;
    summary: string;
    actionTag: string;
    project: string;
    linesAdded?: number;
    linesDeleted?: number;
    mainLanguage?: string | null;
  }[];
}

/**
 * Output from the standup generation.
 */
export interface StandupOutput {
  standup: string;
}

/**
 * Schema for the AI-generated standup.
 */
const standupSchema = z.object({
  standup: z.string().describe("A narrative standup report (bullet points)"),
});

/**
 * Generate a narrative standup report from a list of sessions.
 */
export const generateStandup = async (
  input: StandupInput,
): Promise<StandupOutput> => {
  const { userName, dateRange, sessions } = input;

  // Sanitize inputs
  const safeUserName = sanitizeForPrompt(userName, 50);
  const safeSessions = sessions.map((s) => ({
    title: sanitizeForPrompt(s.title, 100),
    summary: sanitizeForPrompt(s.summary, 300),
    actionTag: sanitizeForPrompt(s.actionTag, 20),
    project: sanitizeForPrompt(s.project, 50),
    stats:
      s.linesAdded && s.linesDeleted
        ? `(+${s.linesAdded}/-${s.linesDeleted})`
        : "",
    language: s.mainLanguage ? sanitizeForPrompt(s.mainLanguage, 20) : "",
  }));

  const sessionLines = safeSessions
    .map(
      (s) =>
        `- [${s.actionTag.toUpperCase()}] ${s.project}: ${s.title}. ${s.summary} ${s.stats}`,
    )
    .join("\n");

  const prompt = `You are ${safeUserName}, writing a daily standup report for "${dateRange}".

Based on the completed sessions below, generate a polished, narrative-first standup report.

**Sessions:**
${sessionLines}

**Rules:**
1. Start with "${dateRange} I:" (e.g., "Yesterday I:", "This Week I:")
2. Use bullet points for distinct activities.
3. Combine related sessions into single narrative points where it makes sense.
4. Keep it professional but concise.
5. Focus on WHAT was achieved, not just the mechanics.
6. Do NOT mention "sessions", "lines added", or internal metrics unless relevant to the scale of work.
7. If no sessions are provided, say "${dateRange} I didn't record any coding sessions."

**Example Logic:**
- Bad: "I had 3 coding sessions about TypeScript."
- Good: "Refactored the settings sync module for better reliability and fixed commit listener issues."
`;

  let lastError: unknown;

  // Cycle through available models
  for (const model of modelConfig.models) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelName = (model as any).modelId ?? "unknown";

    try {
      const { object } = await generateObject({
        model,
        schema: standupSchema,
        prompt,
        maxRetries: 0,
      });

      trackServerEvent({
        distinctId: "system",
        event: ANALYTICS_EVENTS.AI_MODEL_SUCCESS,
        properties: {
          model: modelName,
          feature: "standup",
        },
      });

      return {
        standup: object.standup,
      };
    } catch (error) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      trackServerEvent({
        distinctId: "system",
        event: ANALYTICS_EVENTS.AI_MODEL_FAILED,
        properties: {
          model: modelName,
          error: errorMessage.slice(0, 500),
          feature: "standup",
        },
      });

      console.warn(
        `[AI] Standup generation failed: ${modelName}. Error: ${errorMessage}`,
      );
      continue;
    }
  }

  throw lastError;
};
