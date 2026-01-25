// Session summary AI
export {
  generateSessionSummary,
  type SessionSummaryInput,
  type SessionSummaryOutput,
} from "./session";

export {
  generateStandup,
  type StandupInput,
  type StandupOutput,
} from "./standup";

// Session Insights AI
export {
  generateSessionInsights,
  type SessionInsightsInput,
  type SessionInsightsOutput,
} from "./session-insights";

// Daily Insights AI
export {
  generateDailyInsights,
  type DailyInsightsInput,
  type DailyInsightsOutput,
} from "./daily-insights";

// Coach Agent
export {
  generateCoachMessage,
  createCoachTools,
  type CoachContext,
  type CoachMessage,
  type CoachDataProvider,
  type CoachTools,
  type SessionContext,
} from "./agent";

// Type exports (only our custom types, not re-exports from 'ai')
export type {
  AIMessage,
  ChatOptions,
  GeminiModelId,
  GenerateTextOptions,
  GoogleAIOptions,
} from "./types";
