/**
 * Personality types shared across all agents
 */

/**
 * Session context passed to AI for narrative generation.
 * Contains real data about what the user worked on.
 */
export interface SessionContext {
  title: string | null; // AI-generated title (null for ongoing)
  summary: string | null; // AI-generated summary (null for ongoing)
  actionTag: string | null; // "debugging", "building", etc.
  project: string | null; // Main project name
  language: string | null; // Main language
  durationMinutes: number;
  status: "ongoing" | "synced" | "completed";
  // For ongoing sessions without AI summary - recent files being worked on
  recentFiles?: string[];
}

/**
 * Common context passed to all personality agents
 */
export interface PersonalityContext {
  userName?: string;
  todayMinutes: number;
  yesterdayMinutes: number;
  sessions: SessionContext[]; // Real session data for narrative
  isCurrentlyActive: boolean;
}

/**
 * Result from any personality agent
 */
export interface PersonalityResult {
  headline: string;
  subtext: string;
}
