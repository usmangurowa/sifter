/**
 * AI Coach Agent - Orchestrator
 *
 * Routes to specialized personality agents based on the determined vibe.
 * Each personality agent has focused constraints to prevent vibe bleeding.
 */
import type { AnalystMode, Vibe } from "@turbo/shared";
import { ANALYTICS_EVENTS } from "@turbo/analytics";
import { trackServerEvent } from "@turbo/analytics/server";
import { formatCodingTimeMinutes } from "@turbo/shared";

import type { PersonalityContext, SessionContext } from "./personalities";
import type { CoachDataProvider } from "./tools";
import {
  generateAnalystMessage,
  generateHypeMessage,
  generatePMMessage,
  generateStrategistMessage,
  generateWellnessMessage,
} from "./personalities";

// Re-export for convenience
export type { CoachDataProvider } from "./tools";
export type { SessionContext } from "./personalities";

// =============================================================================
// Types
// =============================================================================

export interface CoachContext {
  userName?: string;
  todayMinutes: number;
  yesterdayMinutes: number;
  sessions: SessionContext[]; // Real session data
  isCurrentlyActive: boolean;
}

export interface CoachMessage {
  headline: string;
  subtext: string;
  vibe: Vibe;
}

// =============================================================================
// Coach Orchestrator
// =============================================================================

/**
 * Generate a coach message by routing to the appropriate personality agent.
 */
export const generateCoachMessage = async (
  context: CoachContext,
  vibe: Vibe,
  analystMode?: AnalystMode,
  dataProvider?: CoachDataProvider,
): Promise<CoachMessage> => {
  const personalityContext: PersonalityContext = {
    userName: context.userName,
    todayMinutes: context.todayMinutes,
    yesterdayMinutes: context.yesterdayMinutes,
    sessions: context.sessions,
    isCurrentlyActive: context.isCurrentlyActive,
  };

  try {
    let result: { headline: string; subtext: string };

    // Route to the appropriate personality agent
    switch (vibe) {
      case "analyst":
        result = await generateAnalystMessage(
          personalityContext,
          analystMode ?? "daily",
          dataProvider,
        );
        break;

      case "hype_man":
        result = await generateHypeMessage(personalityContext);
        break;

      case "wellness_guard":
        result = await generateWellnessMessage(personalityContext);
        break;

      case "project_manager":
        result = await generatePMMessage(personalityContext, dataProvider);
        break;

      case "strategist":
        result = await generateStrategistMessage(personalityContext);
        break;

      default:
        // Fallback to hype man
        result = await generateHypeMessage(personalityContext);
    }

    trackServerEvent({
      distinctId: "system",
      event: ANALYTICS_EVENTS.AI_MODEL_SUCCESS,
      properties: { type: "coach_message", vibe },
    });

    return {
      headline: result.headline,
      subtext: result.subtext,
      vibe,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    trackServerEvent({
      distinctId: "system",
      event: ANALYTICS_EVENTS.AI_MODEL_FAILED,
      properties: {
        error: errorMessage.slice(0, 500),
        type: "coach_message",
        vibe,
      },
    });

    console.error(`[Coach] Failed for vibe ${vibe}:`, errorMessage);

    // Final fallback
    return {
      headline: formatCodingTimeMinutes(context.todayMinutes),
      subtext: "Solid work.",
      vibe,
    };
  }
};
