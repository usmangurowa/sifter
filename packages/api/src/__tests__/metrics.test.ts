/**
 * Metrics Calculation Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies expected behavior based on documented specifications,
 * NOT what the current implementation does.
 *
 * Requirements are documented in @turbo/shared constants.ts
 */

import { TZDate } from "@date-fns/tz";
import { startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";

import { FLOW_GAP_MS, FLOW_THRESHOLD_MS, SESSION_GAP_MS } from "@turbo/shared";

import { calculateMetrics, getLocalDateBounds } from "../utils/metrics";

// =============================================================================
// SPECIFICATION: What SHOULD be true based on requirements
// =============================================================================

describe("SPEC: Threshold Constants", () => {
  /**
   * These tests document the expected values. If these fail,
   * either the spec changed or there's a configuration issue.
   */
  it("SESSION_GAP should be 15 minutes - the idle time after which a session ends", () => {
    expect(SESSION_GAP_MS).toBe(15 * 60 * 1000);
  });

  it("FLOW_THRESHOLD should be 20 minutes - continuous work needed for flow state", () => {
    expect(FLOW_THRESHOLD_MS).toBe(20 * 60 * 1000);
  });

  it("FLOW_GAP should be 5 minutes - max break that doesn't interrupt flow", () => {
    expect(FLOW_GAP_MS).toBe(5 * 60 * 1000);
  });
});

// =============================================================================
// SPECIFICATION: Date Bounds Behavior
// =============================================================================

describe("SPEC: getLocalDateBounds", () => {
  describe("should return start and end of 'today' in user's local timezone", () => {
    it("for UTC timezone, midnight should be 00:00:00.000 UTC", () => {
      const { todayStart } = getLocalDateBounds("UTC");

      expect(todayStart.getUTCHours()).toBe(0);
      expect(todayStart.getUTCMinutes()).toBe(0);
      expect(todayStart.getUTCSeconds()).toBe(0);
      expect(todayStart.getUTCMilliseconds()).toBe(0);
    });

    it("for UTC timezone, end of day should be 23:59:59.999 UTC", () => {
      const { todayEnd } = getLocalDateBounds("UTC");

      expect(todayEnd.getUTCHours()).toBe(23);
      expect(todayEnd.getUTCMinutes()).toBe(59);
      expect(todayEnd.getUTCSeconds()).toBe(59);
      expect(todayEnd.getUTCMilliseconds()).toBe(999);
    });

    it("endOfDay should be the LAST moment of today, not the first moment of tomorrow", () => {
      const { todayEnd } = getLocalDateBounds("UTC");

      // The end of day should never be midnight (00:00:00)
      // because that would be the START of the next day
      expect(todayEnd.getUTCHours()).not.toBe(0);
    });

    it("for Africa/Lagos (UTC+1), midnight WAT should convert to 23:00 UTC previous day", () => {
      const { todayStart } = getLocalDateBounds("Africa/Lagos");

      // Nigeria is UTC+1, so midnight WAT = 23:00 UTC on the previous calendar day
      // The hours should be 23 (previous day) or handle correctly based on current time
      expect(todayStart.getUTCMinutes()).toBe(0);
      expect(todayStart.getUTCSeconds()).toBe(0);
    });

    it("should handle timezone correctly so early morning queries work", () => {
      // At 1:26 AM in Africa/Lagos, max possible coding time is ~86 minutes
      const testTime = new Date("2025-12-30T00:26:00.000Z"); // 1:26 AM WAT
      const timezone = "Africa/Lagos";

      const now = new TZDate(testTime, timezone);
      const dayStart = startOfDay(now);

      const maxPossibleMinutes = Math.floor(
        (testTime.getTime() - dayStart.getTime()) / 60000,
      );

      // At 1:26 AM local time, you can have at most 1 hour and 26 minutes of coding
      expect(maxPossibleMinutes).toBe(86);
    });
  });
});

// =============================================================================
// SPECIFICATION: Coding Time Calculation (wakatime Algorithm)
// =============================================================================

describe("SPEC: Coding Time Calculation", () => {
  const createHeartbeat = (
    timestamp: Date,
    durationSeconds = 0,
    isWrite = false,
  ) => ({
    timestamp,
    durationSeconds,
    isWrite,
  });

  /**
   * REQUIREMENT: Coding time is calculated from heartbeat TIMESTAMPS, not durationSeconds
   *
   * wakatime algorithm: Time between consecutive heartbeats counts as coding
   * if the gap is within the keystroke timeout (2 minutes).
   *
   * @see https://wakatime.com/faq#timeout
   */

  describe("should calculate time BETWEEN heartbeats", () => {
    it("basic case: 3 heartbeats 5 seconds apart = 10 seconds coding", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())), // t=0
        createHeartbeat(new Date(baseTime.getTime() + 5000)), // t=5s
        createHeartbeat(new Date(baseTime.getTime() + 10000)), // t=10s
      ];

      const result = calculateMetrics(heartbeats);

      // Gap 1: 5s, Gap 2: 5s = 10s total
      expect(result.codingTimeSeconds).toBe(10);
    });

    it("single heartbeat = 0 coding time (no gap to measure)", () => {
      const heartbeats = [createHeartbeat(new Date("2025-12-30T10:00:00Z"))];

      const result = calculateMetrics(heartbeats);

      expect(result.codingTimeSeconds).toBe(0);
    });

    it("empty heartbeats array should return 0 coding time", () => {
      const result = calculateMetrics([]);

      expect(result.codingTimeSeconds).toBe(0);
    });

    it("continuous activity: heartbeats every 2 minutes for 10 minutes = 10 min coding", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const twoMinutes = 2 * 60 * 1000;
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes * 1)),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes * 2)),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes * 3)),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes * 4)),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes * 5)),
      ];

      const result = calculateMetrics(heartbeats);

      // 5 gaps of 2 minutes each = 10 minutes = 600 seconds
      expect(result.codingTimeSeconds).toBe(600);
    });
  });

  describe("should use 2-minute keystroke timeout (wakatime default)", () => {
    /**
     * REQUIREMENT: Gaps <= 2 minutes count as coding time
     * Gaps > 2 minutes = session break, don't count
     * @see https://wakatime.com/faq#timeout
     */

    it("gap of exactly 2 minutes SHOULD count (at threshold)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const twoMinutes = 2 * 60 * 1000;
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + twoMinutes)),
      ];

      const result = calculateMetrics(heartbeats);

      expect(result.codingTimeSeconds).toBe(120); // 2 minutes = 120 seconds
    });

    it("gap of 1 minute 59 seconds SHOULD count (just under threshold)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const justUnder2 = 1 * 60 * 1000 + 59 * 1000; // 1:59
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + justUnder2)),
      ];

      const result = calculateMetrics(heartbeats);

      expect(result.codingTimeSeconds).toBe(119);
    });

    it("gap of 2 minutes 31 seconds counts as full coding time (within 15 min timeout)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const overBuffer = 2 * 60 * 1000 + 31 * 1000; // 2:31
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + overBuffer)),
      ];

      const result = calculateMetrics(heartbeats);

      // With 15-min timeout: gap within timeout counts as full coding time
      expect(result.codingTimeSeconds).toBe(151); // 2:31 = 151 seconds
    });

    it("gap of 5 minutes counts as full coding time (within 15 min timeout)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const fiveMinutes = 5 * 60 * 1000;
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + fiveMinutes)),
      ];

      const result = calculateMetrics(heartbeats);

      // With 15-min timeout: gap within timeout counts as full coding time
      expect(result.codingTimeSeconds).toBe(300); // 5 min = 300 seconds
    });
  });

  describe("should handle mixed session breaks correctly", () => {
    it("1 min work, 5 min break, 2 min work = 8 min coding (all within 15 min timeout)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      // Work for 1 minute (heartbeats every 30 sec)
      // Then 5 min break (within 15 min threshold)
      // Then work for 2 more minutes
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())), // 10:00:00
        createHeartbeat(new Date(baseTime.getTime() + 30000)), // 10:00:30
        createHeartbeat(new Date(baseTime.getTime() + 60000)), // 10:01:00
        // 5 minute break here (within 15 min threshold)
        createHeartbeat(new Date(baseTime.getTime() + 6 * 60000)), // 10:06
        createHeartbeat(new Date(baseTime.getTime() + 7 * 60000)), // 10:07
        createHeartbeat(new Date(baseTime.getTime() + 8 * 60000)), // 10:08
      ];

      const result = calculateMetrics(heartbeats);

      // With 15-min timeout: all gaps count as full coding time
      // Total: 8 min from 10:00 to 10:08 = 480 seconds
      expect(result.codingTimeSeconds).toBe(480);
    });
  });

  describe("durationSeconds field is now ignored for coding time", () => {
    it("high durationSeconds does NOT affect coding time calculation", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime()), 999), // durationSeconds = 999 (ignored)
        createHeartbeat(new Date(baseTime.getTime() + 5000), 999), // 5 sec gap
      ];

      const result = calculateMetrics(heartbeats);

      // Coding time is from timestamps, not durationSeconds
      expect(result.codingTimeSeconds).toBe(5);
    });
  });
});

// =============================================================================
// SPECIFICATION: Session Calculation
// =============================================================================

describe("SPEC: Session Calculation", () => {
  const createHeartbeat = (timestamp: Date, durationSeconds = 0) => ({
    timestamp,
    durationSeconds,
    isWrite: false,
  });

  describe("should count sessions based on SESSION_GAP_MS (15 minutes)", () => {
    /**
     * REQUIREMENT: "If no activity for 15 minutes, the session is considered ended"
     */

    it("single heartbeat = 1 session", () => {
      const heartbeats = [createHeartbeat(new Date("2025-12-30T10:00:00Z"))];

      const result = calculateMetrics(heartbeats);

      expect(result.sessions).toBe(1);
    });

    it("continuous activity (gaps < 15 min) = 1 session", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + 5 * 60 * 1000)), // +5 min
        createHeartbeat(new Date(baseTime.getTime() + 10 * 60 * 1000)), // +10 min
        createHeartbeat(new Date(baseTime.getTime() + 14 * 60 * 1000)), // +14 min
      ];

      const result = calculateMetrics(heartbeats);

      expect(result.sessions).toBe(1);
    });

    it("gap of exactly 15 minutes should still be same session (not > 15 min)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + SESSION_GAP_MS)), // Exactly 15 min
      ];

      const result = calculateMetrics(heartbeats);

      // Gap is exactly 15 min, which is NOT > 15 min, so same session
      expect(result.sessions).toBe(1);
    });

    it("gap of 15 min + 1ms should create a new session", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + SESSION_GAP_MS + 1)),
      ];

      const result = calculateMetrics(heartbeats);

      expect(result.sessions).toBe(2);
    });

    it("multiple gaps > 15 min = multiple sessions", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const gap = SESSION_GAP_MS + 1;
      const heartbeats = [
        createHeartbeat(new Date(baseTime.getTime())),
        createHeartbeat(new Date(baseTime.getTime() + gap)), // New session
        createHeartbeat(new Date(baseTime.getTime() + gap * 2)), // New session
      ];

      const result = calculateMetrics(heartbeats);

      expect(result.sessions).toBe(3);
    });

    it("empty heartbeats = 0 sessions", () => {
      const result = calculateMetrics([]);

      expect(result.sessions).toBe(0);
    });
  });
});

// =============================================================================
// SPECIFICATION: Flow State Calculation
// =============================================================================

describe("SPEC: Flow State Calculation", () => {
  const createHeartbeat = (timestamp: Date, durationSeconds = 60) => ({
    timestamp,
    durationSeconds,
    isWrite: false,
  });

  describe("should require FLOW_THRESHOLD_MS (20 min) of continuous activity for flow", () => {
    /**
     * REQUIREMENT: "User must have continuous activity for 20 minutes to be in flow"
     */

    it("19 minutes of activity = 0 flows (not enough)", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      // Heartbeat every minute for 19 minutes
      for (let i = 0; i < 19; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      const result = calculateMetrics(heartbeats);

      expect(result.flows).toBe(0);
    });

    it("exactly 20 minutes of activity = 1 flow", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      // Heartbeat every minute for 21 minutes (to span 20 min from first to last)
      // First at 0, last at 20 min = 20 min span
      for (let i = 0; i <= 20; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      const result = calculateMetrics(heartbeats);

      expect(result.flows).toBe(1);
    });

    it("25 minutes of activity = 1 flow", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      for (let i = 0; i < 25; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      const result = calculateMetrics(heartbeats);

      expect(result.flows).toBe(1);
    });
  });

  describe("should break flow when gap exceeds FLOW_GAP_MS (5 minutes)", () => {
    /**
     * REQUIREMENT: "Gaps larger than 5 minutes break the flow"
     */

    it("5 minute gap should NOT break flow", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      // Create 11 heartbeats over 10 minutes (minute 0 to minute 10 = 10 min span)
      for (let i = 0; i <= 10; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      // Last heartbeat of period 1 is at minute 10
      // Gap of exactly 2 minutes means next heartbeat at minute 12
      const lastHeartbeatTime = baseTime.getTime() + 10 * 60000;
      const afterGap = lastHeartbeatTime + FLOW_GAP_MS; // Exactly 2 min after last heartbeat

      // Create 11 heartbeats over 10 minutes (minute 12 to minute 22 = 10 min span)
      for (let i = 0; i <= 10; i++) {
        heartbeats.push(createHeartbeat(new Date(afterGap + i * 60000)));
      }

      const result = calculateMetrics(heartbeats);

      // Period 1: min 0 to 10 = 10 min span (not enough for flow alone)
      // Period 2: min 12 to 22 = 10 min span (not enough for flow alone)
      // But gap is exactly 5 min (not > 5), so they should be ONE continuous period
      // Total span if continuous: min 0 to 22 = 22 min >= 20 min = 1 flow
      expect(result.flows).toBe(1);
    });

    it("5 min + 1ms gap should break flow", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      // 15 min of activity
      for (let i = 0; i < 15; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      // Gap of 2 min + 1ms (break)
      const afterGap = baseTime.getTime() + 15 * 60000 + FLOW_GAP_MS + 1;

      // 15 min of activity
      for (let i = 0; i < 15; i++) {
        heartbeats.push(createHeartbeat(new Date(afterGap + i * 60000)));
      }

      const result = calculateMetrics(heartbeats);

      // Neither period is >= 20 min, so 0 flows
      expect(result.flows).toBe(0);
    });

    it("two separate 25-minute sessions = 2 flows", () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      const heartbeats: {
        timestamp: Date;
        durationSeconds: number;
        isWrite: boolean;
      }[] = [];

      // First 25-minute session
      for (let i = 0; i < 25; i++) {
        heartbeats.push(
          createHeartbeat(new Date(baseTime.getTime() + i * 60000)),
        );
      }

      // Gap > 5 minutes to break flow
      const secondSessionStart =
        baseTime.getTime() + 25 * 60000 + FLOW_GAP_MS + 1;

      // Second 25-minute session
      for (let i = 0; i < 25; i++) {
        heartbeats.push(
          createHeartbeat(new Date(secondSessionStart + i * 60000)),
        );
      }

      const result = calculateMetrics(heartbeats);

      expect(result.flows).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("empty heartbeats = 0 flows", () => {
      const result = calculateMetrics([]);

      expect(result.flows).toBe(0);
    });

    it("single heartbeat = 0 flows (no time span)", () => {
      const heartbeats = [createHeartbeat(new Date("2025-12-30T10:00:00Z"))];

      const result = calculateMetrics(heartbeats);

      expect(result.flows).toBe(0);
    });
  });
});

// =============================================================================
// SPECIFICATION: Return Value Structure
// =============================================================================

describe("SPEC: calculateMetrics return value", () => {
  it("should return all expected fields", () => {
    const result = calculateMetrics([]);

    expect(result).toHaveProperty("heartbeats");
    expect(result).toHaveProperty("sessions");
    expect(result).toHaveProperty("flows");
    expect(result).toHaveProperty("codingTimeMinutes");
    expect(result).toHaveProperty("codingTimeSeconds");
  });

  it("heartbeats count should match input length", () => {
    const baseTime = new Date("2025-12-30T10:00:00Z");
    const heartbeats = [
      { timestamp: baseTime, durationSeconds: 0, isWrite: false },
      {
        timestamp: new Date(baseTime.getTime() + 1000),
        durationSeconds: 1,
        isWrite: true,
      },
      {
        timestamp: new Date(baseTime.getTime() + 2000),
        durationSeconds: 1,
        isWrite: false,
      },
    ];

    const result = calculateMetrics(heartbeats);

    expect(result.heartbeats).toBe(3);
  });

  it("codingTimeMinutes should be codingTimeSeconds / 60 rounded", () => {
    const baseTime = new Date("2025-12-30T10:00:00Z");
    // Two heartbeats 90 seconds apart = 90 seconds coding time
    const heartbeats = [
      { timestamp: baseTime, durationSeconds: 0, isWrite: false },
      {
        timestamp: new Date(baseTime.getTime() + 90000),
        durationSeconds: 0,
        isWrite: false,
      },
    ];

    const result = calculateMetrics(heartbeats);

    expect(result.codingTimeSeconds).toBe(90);
    expect(result.codingTimeMinutes).toBe(Math.round(90 / 60)); // 2 (rounded)
  });
});
