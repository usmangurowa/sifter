/**
 * Centralized analytics event definitions for type-safety across platforms.
 * Use [object] [verb] naming convention as recommended by PostHog.
 */

export const ANALYTICS_EVENTS = {
  // Authentication events
  USER_SIGNED_UP: "user signed up",
  USER_SIGNED_IN: "user signed in",
  USER_SIGNED_OUT: "user signed out",
  USER_ONBOARDING_COMPLETED: "user onboarding completed",

  // API Key events
  API_KEY_CREATED: "api key created",
  API_KEY_REVOKED: "api key revoked",

  // Extension events
  EXTENSION_ACTIVATED: "extension activated",
  EXTENSION_DEACTIVATED: "extension deactivated",
  EXTENSION_API_KEY_SET: "extension api key set",

  // Sync events
  SYNC_STARTED: "sync started",
  SYNC_COMPLETED: "sync completed",
  SYNC_FAILED: "sync failed",

  // Session events
  SESSION_STARTED: "session started",
  SESSION_ENDED: "session ended",
  SESSION_CLOSED: "session closed",

  // Background task events
  AI_SUMMARY_FAILED: "ai summary failed",
  AI_MODEL_SUCCESS: "ai model success",
  AI_MODEL_FAILED: "ai model failed",
  AI_DAILY_INSIGHTS_GENERATED: "ai daily insights generated",
  TRIGGER_TASK_FAILED: "trigger task failed",
  STALE_SESSIONS_COMPLETED: "stale sessions completed",

  // Feature usage
  FEATURE_USED: "feature used",

  // Errors
  ERROR_OCCURRED: "error occurred",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
