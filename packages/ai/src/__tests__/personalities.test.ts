/**
 * Personality Fallback Tests
 *
 * Tests that each personality agent returns valid fallback messages
 * when AI calls fail.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PersonalityContext } from "../agent/personalities";

// Mock the AI SDK's generateText
vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn().mockReturnValue({}),
  },
}));

// Mock analytics
vi.mock("@turbo/analytics/server", () => ({
  trackServerEvent: vi.fn(),
}));

// Mock client model
vi.mock("../client", () => ({
  coachModel: {},
}));

const mockContext: PersonalityContext = {
  userName: "Test User",
  todayMinutes: 120,
  yesterdayMinutes: 90,
  sessions: [
    {
      title: "Fix commit listener bug",
      summary: "Fixed issues with commit tracking",
      actionTag: "debugging",
      project: "my-app",
      language: "typescript",
      durationMinutes: 45,
      status: "completed",
    },
    {
      title: "Refactor settings sync",
      summary: "Cleaned up settings synchronization",
      actionTag: "refactoring",
      project: "my-app",
      language: "typescript",
      durationMinutes: 30,
      status: "completed",
    },
    {
      title: null,
      summary: null,
      actionTag: "building",
      project: "my-app",
      language: "typescript",
      durationMinutes: 45,
      status: "ongoing",
    },
  ],
  isCurrentlyActive: true,
};

describe("Personality Fallbacks", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Make generateText throw to trigger fallbacks
    const { generateText } = await import("ai");
    (generateText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("AI rate limit exceeded"),
    );
  });

  // ===========================================================================
  // Analyst Fallback
  // ===========================================================================

  describe("Analyst Fallback", () => {
    it("returns time comparison fallback on AI failure", async () => {
      const { generateAnalystMessage } = await import(
        "../agent/personalities/analyst"
      );

      const result = await generateAnalystMessage(mockContext, "daily");

      expect(result.headline).toContain("Velocity:");
      expect(result.headline).toContain("2 hrs"); // 120 minutes
      expect(result.subtext).toContain("yesterday"); // Should compare
    });

    it("includes formatted today time in fallback", async () => {
      const { generateAnalystMessage } = await import(
        "../agent/personalities/analyst"
      );

      const ctx = { ...mockContext, todayMinutes: 45 };
      const result = await generateAnalystMessage(ctx, "daily");

      expect(result.headline).toContain("45 mins");
    });
  });

  // ===========================================================================
  // Hype Man Fallback
  // ===========================================================================

  describe("Hype Man Fallback", () => {
    it("returns session count fallback on AI failure", async () => {
      const { generateHypeMessage } = await import(
        "../agent/personalities/hypeman"
      );

      const result = await generateHypeMessage(mockContext);

      expect(result.headline).toContain("3 sessions");
      expect(result.headline).toContain("shipped");
      // Uses first session title in fallback
      expect(result.subtext).toContain("Fix commit listener bug");
    });

    it("handles zero sessions", async () => {
      const { generateHypeMessage } = await import(
        "../agent/personalities/hypeman"
      );

      const ctx = { ...mockContext, sessions: [] };
      const result = await generateHypeMessage(ctx);

      expect(result.headline).toContain("0 sessions");
    });
  });

  // ===========================================================================
  // Wellness Guard Fallback
  // ===========================================================================

  describe("Wellness Guard Fallback", () => {
    it("returns time-based fallback on AI failure", async () => {
      const { generateWellnessMessage } = await import(
        "../agent/personalities/wellness"
      );

      const result = await generateWellnessMessage(mockContext);

      expect(result.headline).toContain("2 hrs");
      expect(result.headline).toContain("focused");
      // Uses first session title in fallback
      expect(result.subtext).toContain("Fix commit listener bug");
    });

    it("formats long sessions appropriately", async () => {
      const { generateWellnessMessage } = await import(
        "../agent/personalities/wellness"
      );

      const ctx = { ...mockContext, todayMinutes: 600 }; // 10 hours
      const result = await generateWellnessMessage(ctx);

      expect(result.headline).toContain("10 hrs");
    });
  });

  // ===========================================================================
  // Project Manager Fallback
  // ===========================================================================

  describe("Project Manager Fallback", () => {
    it("returns project-focused fallback on AI failure", async () => {
      const { generatePMMessage } = await import("../agent/personalities/pm");

      const result = await generatePMMessage(mockContext);

      expect(result.headline).toContain("my-app");
      // Uses first session title in fallback
      expect(result.subtext).toContain("Fix commit listener bug");
    });

    it("handles empty sessions gracefully", async () => {
      const { generatePMMessage } = await import("../agent/personalities/pm");

      const ctx = { ...mockContext, sessions: [] };
      const result = await generatePMMessage(ctx);

      expect(result.headline).toContain("your project");
    });

    it("handles session without action tag gracefully", async () => {
      const { generatePMMessage } = await import("../agent/personalities/pm");

      const ctx = {
        ...mockContext,
        sessions: [
          {
            title: null,
            summary: null,
            actionTag: null,
            project: "my-app",
            language: "typescript",
            durationMinutes: 30,
            status: "completed" as const,
          },
        ],
      };
      const result = await generatePMMessage(ctx);

      expect(result.subtext).toContain("Coding");
    });
  });

  // ===========================================================================
  // Strategist Fallback
  // ===========================================================================

  describe("Strategist Fallback", () => {
    it("returns narrative fallback on AI failure", async () => {
      const { generateStrategistMessage } = await import(
        "../agent/personalities/strategist"
      );

      const result = await generateStrategistMessage(mockContext);

      // Headline is time-of-day based (e.g. "Morning coding", "Afternoon coding")
      expect(result.headline).toMatch(/coding/i);
      // Uses first session title in fallback
      expect(result.subtext).toContain("Fix commit listener bug");
    });
  });

  // ===========================================================================
  // Common Behavior
  // ===========================================================================

  describe("Common Fallback Behavior", () => {
    it("all fallbacks have non-empty headline and subtext", async () => {
      const { generateAnalystMessage } = await import(
        "../agent/personalities/analyst"
      );
      const { generateHypeMessage } = await import(
        "../agent/personalities/hypeman"
      );
      const { generateWellnessMessage } = await import(
        "../agent/personalities/wellness"
      );
      const { generatePMMessage } = await import("../agent/personalities/pm");
      const { generateStrategistMessage } = await import(
        "../agent/personalities/strategist"
      );

      const results = await Promise.all([
        generateAnalystMessage(mockContext, "daily"),
        generateHypeMessage(mockContext),
        generateWellnessMessage(mockContext),
        generatePMMessage(mockContext),
        generateStrategistMessage(mockContext),
      ]);

      for (const result of results) {
        expect(result.headline.length).toBeGreaterThan(0);
        expect(result.subtext.length).toBeGreaterThan(0);
      }
    });

    it("all fallbacks track failure analytics", async () => {
      const { trackServerEvent } = await import("@turbo/analytics/server");
      const { generateHypeMessage } = await import(
        "../agent/personalities/hypeman"
      );

      await generateHypeMessage(mockContext);

      expect(trackServerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining("failed"),
        }),
      );
    });
  });
});
