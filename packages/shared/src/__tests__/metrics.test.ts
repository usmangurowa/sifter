import { describe, expect, it } from "vitest";

import { FLOW_GAP_MS, FLOW_THRESHOLD_MS, SESSION_GAP_MS } from "../constants";
import { calculateAllMetrics } from "../metrics";

// =============================================================================
// SPECIFICATION: Threshold Constants
// =============================================================================

describe("SPEC: Threshold Constants", () => {
  it("SESSION_GAP should be 15 minutes", () => {
    expect(SESSION_GAP_MS).toBe(15 * 60 * 1000);
  });

  it("FLOW_THRESHOLD should be 20 minutes", () => {
    expect(FLOW_THRESHOLD_MS).toBe(20 * 60 * 1000);
  });

  it("FLOW_GAP should be 5 minutes", () => {
    expect(FLOW_GAP_MS).toBe(5 * 60 * 1000);
  });
});

// =============================================================================
// SPECIFICATION: Metrics Calculation (wakatime Algorithm)
// =============================================================================

describe("SPEC: Metrics Calculation", () => {
  const createHeartbeat = (timestamp: Date | string) => ({
    timestamp:
      typeof timestamp === "string" ? timestamp : timestamp.toISOString(),
    // Optional props not needed for core calc but might be required by type
    project: "test",
    branch: "main",
    file: "test.ts",
    editor: "vscode",
    language: "ts",
    os: "mac",
    isWrite: false,
  });

  describe("calculateAllMetrics", () => {
    it("basic coding time: 3 heartbeats 5 seconds apart = 10 seconds", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        createHeartbeat(new Date(baseTime.getTime() + 5000)),
        createHeartbeat(new Date(baseTime.getTime() + 10000)),
      ];

      const result = calculateAllMetrics(heartbeats);
      expect(result.codingTimeSeconds).toBe(10);
      expect(result.sessions).toBe(1);
    });

    it("15 min gap counts as full coding time (within timeout)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        createHeartbeat(new Date(baseTime.getTime() + 15 * 60 * 1000)),
      ];

      const result = calculateAllMetrics(heartbeats);
      // With 15-min timeout, a 15-min gap counts as full coding time
      expect(result.codingTimeSeconds).toBe(15 * 60);
      expect(result.sessions).toBe(1); // Gap <= SESSION_GAP_MS (15m) so still 1 session
    });

    it("2 minute gap counts as coding time", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        createHeartbeat(new Date(baseTime.getTime() + 2 * 60 * 1000)),
      ];

      const result = calculateAllMetrics(heartbeats);
      expect(result.codingTimeSeconds).toBe(120);
      expect(result.sessions).toBe(1);
    });

    it(">15 min gap credits 0 seconds (user was AFK)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        // 16 minutes (just outside timeout)
        createHeartbeat(new Date(baseTime.getTime() + 16 * 60 * 1000)),
      ];

      const result = calculateAllMetrics(heartbeats);
      // Matches Wakatime: gaps exceeding timeout credit 0 seconds
      expect(result.codingTimeSeconds).toBe(0);
      expect(result.sessions).toBe(2); // Gap > SESSION_GAP_MS so new session
    });

    it("Latency tolerance: 2m 1s gap IS counted as coding time", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        // 2m + 1s (typical latency scenario)
        createHeartbeat(new Date(baseTime.getTime() + 2 * 60 * 1000 + 1000)),
      ];

      const result = calculateAllMetrics(heartbeats);
      // Should count the full duration including the gap
      expect(result.codingTimeSeconds).toBeCloseTo(121, 0);
      expect(result.sessions).toBe(1);
    });

    it(">15 min gap starts new session and credits 0 seconds", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(baseTime),
        createHeartbeat(new Date(baseTime.getTime() + 15 * 60 * 1000 + 1000)), // 15m 1s
      ];

      const result = calculateAllMetrics(heartbeats);
      // Matches Wakatime: gaps exceeding timeout credit 0 seconds
      expect(result.codingTimeSeconds).toBe(0);
      expect(result.sessions).toBe(2);
    });

    it("Flow: <20 min continuous work = 0 flows", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      // 19 mins of heartbeats
      const heartbeats = Array.from({ length: 20 }).map((_, i) =>
        createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
      );
      // t=0 to t=19min

      const result = calculateAllMetrics(heartbeats);
      expect(result.flows).toBe(0);
    });

    it("Flow: 20 min continuous work = 1 flow", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      // 21 heartbeats = 20 intervals of 1 min = 20 mins total
      const heartbeats = Array.from({ length: 21 }).map((_, i) =>
        createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
      );

      const result = calculateAllMetrics(heartbeats);
      expect(result.flows).toBe(1);
    });

    it("Flow: broken by 5min gap", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      // 15 mins work
      const period1 = Array.from({ length: 16 }).map((_, i) =>
        createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
      );

      // Gap of 5 min + 1ms (exceeds FLOW_GAP_MS)
      const gapStart = baseTime.getTime() + 15 * 60000;
      const period2Start = gapStart + 5 * 60000 + 1;

      // 15 mins work
      const period2 = Array.from({ length: 16 }).map((_, i) =>
        createHeartbeat(new Date(period2Start + i * 60000)),
      );

      const result = calculateAllMetrics([...period1, ...period2]);
      expect(result.flows).toBe(0);
    });
  });
});
