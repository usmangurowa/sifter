/**
 * Coach Orchestrator Tests
 *
 * Tests for the main coach orchestrator that routes to personality agents.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Vibe } from "@turbo/shared";

import type { CoachContext } from "../agent/coach";
import { generateCoachMessage } from "../agent/coach";

// Mock AI generation for all personalities
vi.mock("../agent/personalities", () => ({
  generateAnalystMessage: vi.fn(),
  generateHypeMessage: vi.fn(),
  generatePMMessage: vi.fn(),
  generateWellnessMessage: vi.fn(),
  generateStrategistMessage: vi.fn(),
}));

// Mock analytics
vi.mock("@turbo/analytics/server", () => ({
  trackServerEvent: vi.fn(),
}));

const mockContext: CoachContext = {
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

describe("Coach Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Vibe Routing
  // ===========================================================================

  describe("Vibe Routing", () => {
    it("routes analyst vibe to generateAnalystMessage", async () => {
      const { generateAnalystMessage } = await import("../agent/personalities");
      (
        generateAnalystMessage as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        headline: "Velocity: Up 33%",
        subtext: "2h today vs 1.5h yesterday.",
      });

      const result = await generateCoachMessage(
        mockContext,
        "analyst",
        "daily",
      );

      expect(generateAnalystMessage).toHaveBeenCalledWith(
        expect.objectContaining({ todayMinutes: 120 }),
        "daily",
        undefined,
      );
      expect(result.vibe).toBe("analyst");
      expect(result.headline).toBe("Velocity: Up 33%");
    });

    it("routes hype_man vibe to generateHypeMessage", async () => {
      const { generateHypeMessage } = await import("../agent/personalities");
      (generateHypeMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        headline: "Shipped It!",
        subtext: "3 sessions of focused work.",
      });

      const result = await generateCoachMessage(mockContext, "hype_man");

      expect(generateHypeMessage).toHaveBeenCalledWith(
        expect.objectContaining({ sessions: expect.any(Array) }),
      );
      expect(result.vibe).toBe("hype_man");
    });

    it("routes wellness_guard vibe to generateWellnessMessage", async () => {
      const { generateWellnessMessage } = await import(
        "../agent/personalities"
      );
      (
        generateWellnessMessage as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        headline: "Time for a Break",
        subtext: "10+ hours today. Step away.",
      });

      const result = await generateCoachMessage(mockContext, "wellness_guard");

      expect(generateWellnessMessage).toHaveBeenCalled();
      expect(result.vibe).toBe("wellness_guard");
    });

    it("routes project_manager vibe to generatePMMessage", async () => {
      const { generatePMMessage } = await import("../agent/personalities");
      (generatePMMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        headline: "Building my-app",
        subtext: "5 sessions this week.",
      });

      const result = await generateCoachMessage(mockContext, "project_manager");

      expect(generatePMMessage).toHaveBeenCalled();
      expect(result.vibe).toBe("project_manager");
    });

    it("routes strategist vibe to generateStrategistMessage", async () => {
      const { generateStrategistMessage } = await import(
        "../agent/personalities"
      );
      (
        generateStrategistMessage as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        headline: "Weekly Focus",
        subtext: "API work taking most time.",
      });

      const result = await generateCoachMessage(mockContext, "strategist");

      expect(generateStrategistMessage).toHaveBeenCalled();
      expect(result.vibe).toBe("strategist");
    });

    it("falls back to hype_man for unknown vibes", async () => {
      const { generateHypeMessage } = await import("../agent/personalities");
      (generateHypeMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        headline: "Nice Work!",
        subtext: "Keep the momentum.",
      });

      const result = await generateCoachMessage(
        mockContext,
        "unknown_vibe" as Vibe,
      );

      expect(generateHypeMessage).toHaveBeenCalled();
      expect(result.headline).toBe("Nice Work!");
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("Error Handling", () => {
    it("returns fallback message when personality agent fails", async () => {
      const { generateHypeMessage } = await import("../agent/personalities");
      (generateHypeMessage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("AI rate limit"),
      );

      const result = await generateCoachMessage(mockContext, "hype_man");

      // Should return time-based fallback
      expect(result.headline).toBe("2 hrs");
      expect(result.subtext).toBe("Solid work.");
      expect(result.vibe).toBe("hype_man");
    });

    it("tracks failure analytics on error", async () => {
      const { generateHypeMessage } = await import("../agent/personalities");
      const { trackServerEvent } = await import("@turbo/analytics/server");

      (generateHypeMessage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("API Error"),
      );

      await generateCoachMessage(mockContext, "hype_man");

      expect(trackServerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining("failed"),
        }),
      );
    });
  });

  // ===========================================================================
  // Analytics
  // ===========================================================================

  describe("Analytics", () => {
    it("tracks success event on successful generation", async () => {
      const { generateHypeMessage } = await import("../agent/personalities");
      const { trackServerEvent } = await import("@turbo/analytics/server");

      (generateHypeMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        headline: "Nice!",
        subtext: "Great work.",
      });

      await generateCoachMessage(mockContext, "hype_man");

      expect(trackServerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining("success"),
          properties: expect.objectContaining({ vibe: "hype_man" }),
        }),
      );
    });
  });

  // ===========================================================================
  // Data Provider
  // ===========================================================================

  describe("Data Provider", () => {
    it("passes dataProvider to analyst personality", async () => {
      const { generateAnalystMessage } = await import("../agent/personalities");
      (
        generateAnalystMessage as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        headline: "Velocity trend",
        subtext: "Up this week.",
      });

      const mockProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn(),
      };

      await generateCoachMessage(
        mockContext,
        "analyst",
        "weekly",
        mockProvider,
      );

      expect(generateAnalystMessage).toHaveBeenCalledWith(
        expect.anything(),
        "weekly",
        mockProvider,
      );
    });

    it("passes dataProvider to project_manager personality", async () => {
      const { generatePMMessage } = await import("../agent/personalities");
      (generatePMMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        headline: "Project update",
        subtext: "Good progress.",
      });

      const mockProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn(),
      };

      await generateCoachMessage(
        mockContext,
        "project_manager",
        undefined,
        mockProvider,
      );

      expect(generatePMMessage).toHaveBeenCalledWith(
        expect.anything(),
        mockProvider,
      );
    });
  });
});
