/**
 * Vibe System for AI Coach
 *
 * Determines the "personality" of the coach message based on context.
 * Uses weighted randomness with hard triggers for specific situations.
 */

// =============================================================================
// Types
// =============================================================================

export const VIBES = [
  "analyst",
  "project_manager",
  "wellness_guard",
  "hype_man",
  "strategist",
] as const;

export type Vibe = (typeof VIBES)[number];

/**
 * Comparison mode for Analyst vibe (time-aware)
 */
export type AnalystMode = "daily" | "weekly" | "monthly";

/**
 * Stats used to determine vibe
 */
export interface VibeStats {
  /** Total coding hours today */
  todayHours: number;
  /** Current streak in days */
  streakDays?: number;
  /** Size of recent commit (lines) */
  recentCommitSize?: number;
  /** Whether user is currently active */
  isCurrentlyActive: boolean;
}

/**
 * Output from vibe determination
 */
export interface VibeResult {
  vibe: Vibe;
  analystMode?: AnalystMode;
  reason: string;
}

// =============================================================================
// Time-Aware Logic
// =============================================================================

/**
 * Check if it's appropriate to do time comparisons (Analyst mode).
 * Only compare after 6 PM OR on weekends OR end of month.
 */
export const isComparisonTime = (now: Date = new Date()): boolean => {
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  // End of month (last 3 days) - always ok
  if (dayOfMonth > daysInMonth - 3) return true;

  // Weekend (Fri evening, Sat, Sun) - ok to compare weeks
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  if (dayOfWeek === 5 && hour >= 17) return true; // Friday after 5 PM

  // After 6 PM on weekdays - ok to compare days
  if (hour >= 18) return true;

  // Otherwise - too early, don't compare!
  return false;
};

/**
 * Determine the comparison mode for Analyst based on current time.
 */
export const getAnalystMode = (now: Date = new Date()): AnalystMode => {
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  // Last 3 days of month → monthly comparison
  if (dayOfMonth > daysInMonth - 3) {
    return "monthly";
  }

  // Weekend (Sat, Sun) → weekly comparison
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "weekly";
  }

  // Friday evening (after 5 PM) → weekly comparison
  if (dayOfWeek === 5 && hour >= 17) {
    return "weekly";
  }

  // Default (after 6 PM on weekdays) → daily
  return "daily";
};

// =============================================================================
// Vibe Weights (Percentages)
// =============================================================================

/**
 * Get vibe weights based on time of day.
 * Analyst is excluded before 6 PM - its weight goes to hype_man.
 */
const getVibeWeights = (now: Date = new Date()): Record<Vibe, number> => {
  const canCompare = isComparisonTime(now);

  if (canCompare) {
    // Normal weights when comparisons are appropriate
    return {
      analyst: 0.15,
      project_manager: 0.3,
      wellness_guard: 0.1,
      hype_man: 0.2,
      strategist: 0.25,
    };
  } else {
    // Before 6 PM: No analyst, boost hype_man instead
    return {
      analyst: 0, // BLOCKED
      project_manager: 0.35,
      wellness_guard: 0.1,
      hype_man: 0.3, // Boosted - motivate early in day!
      strategist: 0.25,
    };
  }
};

// =============================================================================
// Vibe Determination
// =============================================================================

/**
 * Determine the message vibe based on stats and timing.
 *
 * Priority:
 * 1. Hard triggers (force specific vibe)
 * 2. Cooldown check (prevent same vibe within 4h)
 * 3. Time-aware weighted randomness
 */
export const determineVibe = (
  stats: VibeStats,
  lastVibe?: Vibe,
  lastVibeTime?: Date,
  now: Date = new Date(),
): VibeResult => {
  // =========================================================================
  // 1. HARD TRIGGERS (bypass cooldowns intentionally)
  //
  // Hard triggers always fire regardless of cooldown because they represent
  // important situations that warrant their specific vibe:
  // - Burnout protection is a safety feature
  // - Big commits deserve recognition
  // - Streaks should be celebrated
  // =========================================================================

  // Burnout protection: 10+ hours → force wellness (ALWAYS - safety first!)
  if (stats.todayHours >= 10) {
    return {
      vibe: "wellness_guard",
      reason: "Hard trigger: 10+ hours of coding today (bypasses cooldown)",
    };
  }

  // TODO: Big commit trigger is inactive until GitHub integration provides recentCommitSize.
  // The condition safely short-circuits when recentCommitSize is undefined.
  if (stats.recentCommitSize && stats.recentCommitSize > 500) {
    return {
      vibe: "project_manager",
      reason: "Hard trigger: large commit detected (bypasses cooldown)",
    };
  }

  // TODO: Streak trigger is inactive until streak tracking provides streakDays.
  // The condition safely short-circuits when streakDays is undefined.
  if (stats.streakDays && stats.streakDays >= 5) {
    return {
      vibe: "hype_man",
      reason: `Hard trigger: ${stats.streakDays} day streak (bypasses cooldown)`,
    };
  }

  // ===================
  // 2. COOLDOWN CHECK
  // ===================

  const cooldownMs = 4 * 60 * 60 * 1000; // 4 hours
  const vibeOnCooldown =
    lastVibe &&
    lastVibeTime &&
    now.getTime() - lastVibeTime.getTime() < cooldownMs
      ? lastVibe
      : undefined;

  // ===================
  // 3. TIME-AWARE WEIGHTED RANDOM
  // ===================

  const weights = getVibeWeights(now);

  // Build weighted pool excluding cooldown vibe and zero-weight vibes
  let totalWeight = 0;
  const availableVibes: { vibe: Vibe; weight: number }[] = [];

  for (const vibe of VIBES) {
    if (vibe === vibeOnCooldown) continue;
    const weight = weights[vibe];
    if (weight === 0) continue; // Skip blocked vibes
    availableVibes.push({ vibe, weight });
    totalWeight += weight;
  }

  // Safeguard: If no vibes available (all on cooldown or zero weight),
  // return a safe default. This shouldn't happen with current logic,
  // but protects against future changes.
  if (availableVibes.length === 0 || totalWeight === 0) {
    return {
      vibe: "hype_man",
      reason: "Fallback: no vibes available after filtering",
    };
  }

  // Normalize and pick
  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const { vibe, weight } of availableVibes) {
    cumulative += weight;
    if (roll <= cumulative) {
      const result: VibeResult = {
        vibe,
        reason: "Weighted random selection",
      };

      // Add analyst mode if analyst was selected
      if (vibe === "analyst") {
        result.analystMode = getAnalystMode(now);
      }

      return result;
    }
  }

  // Fallback (should never reach due to above check)
  return {
    vibe: "hype_man",
    reason: "Fallback: weighted selection failed",
  };
};

// =============================================================================
// Vibe Prompt Snippets
// =============================================================================

/**
 * Get the system prompt snippet for a given vibe.
 * Rich prompts with GOAL, INSTRUCTIONS, and contextual examples.
 */
export const getVibePrompt = (
  vibe: Vibe,
  analystMode?: AnalystMode,
): string => {
  switch (vibe) {
    case "analyst": {
      const timeFrame =
        analystMode === "monthly"
          ? "this month vs last month"
          : analystMode === "weekly"
            ? "this week vs last week"
            : "today vs yesterday";

      return `VIBE: The Data Scientist (Analyst Mode)
GOAL: Contextualize the user's velocity. Don't just list numbers; explain the trend.
INSTRUCTIONS:
- Compare ${timeFrame}.
- If the trend is down, check if intensity/complexity was high (quality over quantity).
- Use neutral, professional language.
EXAMPLE: "Velocity Check: 4h today vs 8h average. You're trending lower on time, but high churn suggests a complex debugging session."`;
    }

    case "project_manager":
      return `VIBE: The Agile Coach (Project Context)
GOAL: Translate technical activity into product progress.
INSTRUCTIONS:
- Ignore the "time spent". Focus purely on the "Action Tags" and "Project Names".
- Abstract file paths into feature names (e.g., 'auth.ts' -> 'Authentication Module').
- Highlight what is being BUILT or STABILIZED.
EXAMPLE: "Deep Work on Checkout: You spent the morning stabilizing the Payment API. Solid focus on reducing technical debt in the transaction flow."`;

    case "wellness_guard":
      return `VIBE: The Performance Coach (Wellness)
GOAL: Protect the user's cognitive resources.
INSTRUCTIONS:
- Trigger this if intensity is high or session is long (>4h).
- Be empathetic but authoritative.
- Focus on "Cognitive Load" rather than just "Time".
EXAMPLE: "Cognitive Load Alert: You've been in High Intensity flow for 4 hours straight. Diminishing returns are setting in—schedule a disconnect soon."`;

    case "hype_man":
      return `VIBE: The Supportive Peer (Momentum)
GOAL: Celebrate consistency and flow states.
INSTRUCTIONS:
- Focus on streaks, commit volume, or "Deep Work" blocks.
- Avoid cringey generic praise ("You are a rockstar!").
- Validate the *effort*.
EXAMPLE: "Momentum Building: That's your 3rd deep work session today. You're shipping consistency, not just code. Keep the rhythm."`;

    case "strategist":
      return `VIBE: The Senior Architect (Forward-Looking)
GOAL: Help the user plan their energy and goals.
INSTRUCTIONS:
- Look at the "Goal Deficit" (time remaining vs goal).
- Suggest a tactical plan (e.g., "Push now" vs "Defer to tomorrow").
- Be pragmatic.
EXAMPLE: "Pacing Update: You're 2 hours behind the daily goal. Recommendation: Don't force a late night. Bank 1 hour now and front-load the rest tomorrow morning."`;
  }
};
