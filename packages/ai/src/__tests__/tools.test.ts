/**
 * Coach Tools Tests
 *
 * Tests for the data fetching tools used by personality agents.
 */
import { describe, expect, it, vi } from "vitest";

import type { CoachDataProvider, CoachTools } from "../agent/tools";
import { createCoachTools } from "../agent/tools";

/**
 * Helper to get the execute function from a tool with proper typing.
 * The AI SDK types execute as optional, but our tools always define it.
 */
interface DateRangeInput {
  startDate: string;
  endDate: string;
}
type ToolExecute = (input: DateRangeInput) => Promise<string>;

const getExecute = (tool: CoachTools[keyof CoachTools]): ToolExecute => {
  if (!tool.execute) {
    throw new Error("Tool execute function is undefined");
  }
  return tool.execute as ToolExecute;
};

describe("Coach Tools", () => {
  // ===========================================================================
  // getHeartbeats Tool
  // ===========================================================================

  describe("getHeartbeats", () => {
    it("returns formatted string with hours, sessions, and project", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn().mockResolvedValue({
          totalMinutes: 180,
          sessionCount: 5,
          topProject: "my-app",
        }),
        getSessions: vi.fn(),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getHeartbeats)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toBe("Coding: 3h | Sessions: 5 | Top Project: my-app");
    });

    it("rounds hours to 1 decimal place", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn().mockResolvedValue({
          totalMinutes: 95, // 1.583... hours
          sessionCount: 2,
          topProject: "test",
        }),
        getSessions: vi.fn(),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getHeartbeats)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toBe("Coding: 1.6h | Sessions: 2 | Top Project: test");
    });

    it("shows 'None' when no top project", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn().mockResolvedValue({
          totalMinutes: 60,
          sessionCount: 1,
          topProject: null,
        }),
        getSessions: vi.fn(),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getHeartbeats)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toContain("Top Project: None");
    });

    it("parses date strings correctly", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn().mockResolvedValue({
          totalMinutes: 0,
          sessionCount: 0,
          topProject: null,
        }),
        getSessions: vi.fn(),
      };

      const tools = createCoachTools(mockProvider);
      await getExecute(tools.getHeartbeats)({
        startDate: "2025-01-15T00:00:00Z",
        endDate: "2025-01-16T23:59:59Z",
      });

      expect(mockProvider.getHeartbeats).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );

      const [start, end] = (
        mockProvider.getHeartbeats as ReturnType<typeof vi.fn>
      ).mock.calls[0] as [Date, Date];
      expect(start.toISOString()).toContain("2025-01-15");
      expect(end.toISOString()).toContain("2025-01-16");
    });
  });

  // ===========================================================================
  // getSessions Tool
  // ===========================================================================

  describe("getSessions", () => {
    it("returns markdown list of sessions", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn().mockResolvedValue({
          sessions: [
            { title: "Auth Module", actionTag: "building", project: "app" },
            { title: "Bug Fix", actionTag: "debugging", project: "app" },
          ],
        }),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getSessions)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toContain("- Auth Module (building)");
      expect(result).toContain("- Bug Fix (debugging)");
    });

    it("returns 'No sessions' message when empty", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn().mockResolvedValue({ sessions: [] }),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getSessions)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toBe("No sessions in this period.");
    });

    it("limits to 5 sessions with count for more", async () => {
      const sessions = Array.from({ length: 8 }, (_, i) => ({
        title: `Session ${i + 1}`,
        actionTag: "coding",
        project: "app",
      }));

      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn().mockResolvedValue({ sessions }),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getSessions)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toContain("Session 1");
      expect(result).toContain("Session 5");
      expect(result).not.toContain("Session 6");
      expect(result).toContain("...and 3 more");
    });

    it("uses 'Untitled' for null title", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn().mockResolvedValue({
          sessions: [{ title: null, actionTag: "building", project: "app" }],
        }),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getSessions)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toContain("Untitled");
    });

    it("uses 'coding' for null actionTag", async () => {
      const mockProvider: CoachDataProvider = {
        getHeartbeats: vi.fn(),
        getSessions: vi.fn().mockResolvedValue({
          sessions: [{ title: "My Session", actionTag: null, project: "app" }],
        }),
      };

      const tools = createCoachTools(mockProvider);
      const result = await getExecute(tools.getSessions)({
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      });

      expect(result).toContain("(coding)");
    });
  });
});
