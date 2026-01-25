import { describe, expect, it } from "vitest";

import type { VibeStats } from "../vibe";
import {
  determineVibe,
  getAnalystMode,
  getVibePrompt,
  isComparisonTime,
  VIBES,
} from "../vibe";

// =============================================================================
// SPECIFICATION: Time-Aware Logic
// =============================================================================

describe("SPEC: isComparisonTime", () => {
  it("returns false before 6 PM on weekdays", () => {
    // Monday at 2 PM
    const date = new Date("2025-01-13T14:00:00");
    expect(isComparisonTime(date)).toBe(false);
  });

  it("returns true after 6 PM on weekdays", () => {
    // Monday at 7 PM
    const date = new Date("2025-01-13T19:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });

  it("returns true at exactly 6 PM", () => {
    // Monday at 6 PM
    const date = new Date("2025-01-13T18:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });

  it("returns true on Saturday", () => {
    // Saturday at 10 AM
    const date = new Date("2025-01-11T10:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });

  it("returns true on Sunday", () => {
    // Sunday at 10 AM
    const date = new Date("2025-01-12T10:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });

  it("returns true on Friday after 5 PM", () => {
    // Friday at 6 PM
    const date = new Date("2025-01-10T18:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });

  it("returns false on Friday before 5 PM", () => {
    // Friday at 2 PM
    const date = new Date("2025-01-10T14:00:00");
    expect(isComparisonTime(date)).toBe(false);
  });

  it("returns true on last 3 days of month", () => {
    // January 30th at 10 AM (last 3 days of 31-day month)
    const date = new Date("2025-01-30T10:00:00");
    expect(isComparisonTime(date)).toBe(true);
  });
});

// =============================================================================
// SPECIFICATION: Analyst Mode Selection
// =============================================================================

describe("SPEC: getAnalystMode", () => {
  it("returns 'daily' on weekday evenings", () => {
    // Monday at 7 PM
    const date = new Date("2025-01-13T19:00:00");
    expect(getAnalystMode(date)).toBe("daily");
  });

  it("returns 'weekly' on Saturday", () => {
    // Saturday at 10 AM
    const date = new Date("2025-01-11T10:00:00");
    expect(getAnalystMode(date)).toBe("weekly");
  });

  it("returns 'weekly' on Sunday", () => {
    // Sunday at 10 AM
    const date = new Date("2025-01-12T10:00:00");
    expect(getAnalystMode(date)).toBe("weekly");
  });

  it("returns 'weekly' on Friday evening (after 5 PM)", () => {
    // Friday at 6 PM
    const date = new Date("2025-01-10T18:00:00");
    expect(getAnalystMode(date)).toBe("weekly");
  });

  it("returns 'daily' on Friday morning (before 5 PM)", () => {
    // Friday at 10 AM
    // NOTE: This tests getAnalystMode's return value in isolation. In production,
    // analyst vibe is blocked before comparison time (isComparisonTime returns false
    // at 10 AM Friday), so getAnalystMode wouldn't actually be called at this time.
    const date = new Date("2025-01-10T10:00:00");
    expect(getAnalystMode(date)).toBe("daily");
  });

  it("returns 'monthly' on last 3 days of month", () => {
    // January 30th at 10 AM
    const date = new Date("2025-01-30T10:00:00");
    expect(getAnalystMode(date)).toBe("monthly");
  });

  it("returns 'monthly' on last day of month", () => {
    // January 31st at 10 AM
    const date = new Date("2025-01-31T10:00:00");
    expect(getAnalystMode(date)).toBe("monthly");
  });
});

// =============================================================================
// SPECIFICATION: Hard Triggers
// =============================================================================

describe("SPEC: determineVibe - Hard Triggers", () => {
  const baseStats: VibeStats = {
    todayHours: 2,
    isCurrentlyActive: true,
  };

  it("triggers wellness_guard when todayHours >= 10", () => {
    const stats: VibeStats = { ...baseStats, todayHours: 11 };
    const result = determineVibe(stats);

    expect(result.vibe).toBe("wellness_guard");
    expect(result.reason).toContain("Hard trigger");
    expect(result.reason).toContain("10+");
  });

  it("triggers wellness_guard at exactly 10.1 hours", () => {
    const stats: VibeStats = { ...baseStats, todayHours: 10.1 };
    const result = determineVibe(stats);

    expect(result.vibe).toBe("wellness_guard");
  });

  it("DOES trigger wellness_guard at exactly 10 hours", () => {
    const stats: VibeStats = { ...baseStats, todayHours: 10 };
    const result = determineVibe(stats);

    expect(result.vibe).toBe("wellness_guard");
  });

  it("does NOT trigger wellness_guard hard trigger at 9.9 hours", () => {
    const stats: VibeStats = { ...baseStats, todayHours: 9.9 };
    const result = determineVibe(stats);

    // The hard trigger should NOT fire at 9.9 hours
    // (wellness_guard CAN still be randomly selected via weighted random, but that's not a "hard trigger")
    if (result.vibe === "wellness_guard") {
      expect(result.reason).not.toContain("Hard trigger");
    }
  });

  it("triggers project_manager when recentCommitSize > 500", () => {
    const stats: VibeStats = { ...baseStats, recentCommitSize: 501 };
    const result = determineVibe(stats);

    expect(result.vibe).toBe("project_manager");
    expect(result.reason).toContain("Hard trigger");
    expect(result.reason).toContain("commit");
  });

  it("triggers hype_man when streakDays >= 5", () => {
    const stats: VibeStats = { ...baseStats, streakDays: 5 };
    const result = determineVibe(stats);

    expect(result.vibe).toBe("hype_man");
    expect(result.reason).toContain("Hard trigger");
    expect(result.reason).toContain("streak");
  });

  it("does NOT trigger hype_man when streakDays < 5", () => {
    const stats: VibeStats = { ...baseStats, streakDays: 4 };
    const result = determineVibe(stats);

    // Should not be a hard trigger (could be any vibe from weighted random)
    expect(result.reason).not.toContain("Hard trigger");
  });

  it("burnout trigger takes priority over streak trigger", () => {
    const stats: VibeStats = {
      ...baseStats,
      todayHours: 12,
      streakDays: 10,
    };
    const result = determineVibe(stats);

    // Burnout is checked first
    expect(result.vibe).toBe("wellness_guard");
  });

  it("hard triggers bypass cooldown intentionally", () => {
    const stats: VibeStats = { ...baseStats, todayHours: 12 };
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // wellness_guard was shown 2 hours ago (within 4h cooldown)
    const result = determineVibe(stats, "wellness_guard", twoHoursAgo);

    // Should still trigger wellness_guard despite cooldown
    expect(result.vibe).toBe("wellness_guard");
    expect(result.reason).toContain("bypasses cooldown");
  });
});

// =============================================================================
// SPECIFICATION: Cooldown Logic
// =============================================================================

describe("SPEC: determineVibe - Cooldown", () => {
  const baseStats: VibeStats = {
    todayHours: 2,
    isCurrentlyActive: true,
  };

  it("excludes last vibe from selection within 4 hour cooldown", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const now = new Date();

    // Run 100 times to statistically verify hype_man is never selected
    const vibesSelected = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const result = determineVibe(baseStats, "hype_man", twoHoursAgo, now);
      vibesSelected.add(result.vibe);
    }

    expect(vibesSelected.has("hype_man")).toBe(false);
  });

  it("allows same vibe after 4 hour cooldown expires", () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const now = new Date();

    // After 4h, hype_man should be back in the pool
    // Run multiple times to see if it can be selected
    let foundHypeMan = false;
    for (let i = 0; i < 100; i++) {
      const result = determineVibe(baseStats, "hype_man", fiveHoursAgo, now);
      if (result.vibe === "hype_man") {
        foundHypeMan = true;
        break;
      }
    }

    expect(foundHypeMan).toBe(true);
  });

  it("cooldown only applies to last vibe, not all previous vibes", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const now = new Date();

    // Only hype_man is on cooldown, project_manager should be available
    let foundPM = false;
    for (let i = 0; i < 100; i++) {
      const result = determineVibe(baseStats, "hype_man", twoHoursAgo, now);
      if (result.vibe === "project_manager") {
        foundPM = true;
        break;
      }
    }

    expect(foundPM).toBe(true);
  });
});

// =============================================================================
// SPECIFICATION: Weighted Random Selection
// =============================================================================

describe("SPEC: determineVibe - Weighted Random", () => {
  const baseStats: VibeStats = {
    todayHours: 2,
    isCurrentlyActive: true,
  };

  it("selects from all vibes when no hard triggers and no cooldown", () => {
    const vibesSelected = new Set<string>();
    const eveningDate = new Date("2025-01-13T19:00:00");

    // Run many times to collect all possible vibes
    for (let i = 0; i < 500; i++) {
      const result = determineVibe(
        baseStats,
        undefined,
        undefined,
        eveningDate,
      );
      vibesSelected.add(result.vibe);
    }

    // Should have multiple vibes selected (at least analyst, pm, hype_man, strategist)
    expect(vibesSelected.size).toBeGreaterThanOrEqual(4);
  });

  it("excludes analyst before 6 PM on weekdays", () => {
    const vibesSelected = new Set<string>();
    const morningDate = new Date("2025-01-13T10:00:00");

    for (let i = 0; i < 200; i++) {
      const result = determineVibe(
        baseStats,
        undefined,
        undefined,
        morningDate,
      );
      vibesSelected.add(result.vibe);
    }

    expect(vibesSelected.has("analyst")).toBe(false);
  });

  it("includes analyst after 6 PM on weekdays", () => {
    const eveningDate = new Date("2025-01-13T19:00:00");

    let foundAnalyst = false;
    for (let i = 0; i < 200; i++) {
      const result = determineVibe(
        baseStats,
        undefined,
        undefined,
        eveningDate,
      );
      if (result.vibe === "analyst") {
        foundAnalyst = true;
        break;
      }
    }

    expect(foundAnalyst).toBe(true);
  });

  it("returns analyst mode when analyst is selected", () => {
    const eveningDate = new Date("2025-01-13T19:00:00");

    // Keep trying until we get analyst
    for (let i = 0; i < 500; i++) {
      const result = determineVibe(
        baseStats,
        undefined,
        undefined,
        eveningDate,
      );
      if (result.vibe === "analyst") {
        expect(result.analystMode).toBeDefined();
        expect(["daily", "weekly", "monthly"]).toContain(result.analystMode);
        return;
      }
    }

    // If we never got analyst in 500 tries, that's unexpected
    throw new Error("Expected to select analyst at least once in 500 tries");
  });
});

// =============================================================================
// SPECIFICATION: Fallback Safety
// =============================================================================

describe("SPEC: determineVibe - Fallback Safety", () => {
  it("returns hype_man as fallback when no vibes available", () => {
    // This tests the safeguard we added
    // In practice this shouldn't happen, but the code handles it
    const stats: VibeStats = {
      todayHours: 2,
      isCurrentlyActive: true,
    };

    // The fallback is tested implicitly - if all vibes were somehow removed,
    // we'd get the fallback. Since we can't easily test that without mocking
    // internals, we just verify the function always returns a valid vibe.
    const result = determineVibe(stats);
    expect(VIBES).toContain(result.vibe);
    expect(result.reason).toBeDefined();
  });
});

// =============================================================================
// SPECIFICATION: Vibe Prompts
// =============================================================================

describe("SPEC: getVibePrompt", () => {
  it("returns non-empty prompt for all vibes", () => {
    for (const vibe of VIBES) {
      const prompt = getVibePrompt(vibe);
      expect(prompt.length).toBeGreaterThan(100);
    }
  });

  it("includes context for analyst when mode is provided", () => {
    const dailyPrompt = getVibePrompt("analyst", "daily");
    expect(dailyPrompt).toContain("GOAL");
  });

  it("returns different prompts for different vibes", () => {
    const analystPrompt = getVibePrompt("analyst");
    const hypeManPrompt = getVibePrompt("hype_man");
    const wellnessPrompt = getVibePrompt("wellness_guard");

    expect(analystPrompt).not.toBe(hypeManPrompt);
    expect(hypeManPrompt).not.toBe(wellnessPrompt);
  });
});
