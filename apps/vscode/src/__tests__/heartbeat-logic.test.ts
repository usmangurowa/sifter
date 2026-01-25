/**
 * Heartbeat Logic Tests
 *
 * These tests are REQUIREMENT-DRIVEN based on wakatime specifications.
 * Each test verifies expected behavior based on documented requirements,
 * NOT what the current implementation does.
 *
 * Requirements documented in:
 * - @turbo/shared constants.ts
 * - wakatime source: https://github.com/wakatime/vscode-wakatime
 */

import { beforeEach, describe, expect, it } from "vitest";

import { DEDUPE_WINDOW_MS, TIME_BETWEEN_HEARTBEATS_MS } from "@turbo/shared";

import type { DedupeEntry, HeartbeatState } from "../tracker/heartbeat-logic";
import {
  isDuplicateHeartbeat,
  shouldRecordHeartbeat,
  updateDedupeEntry,
} from "../tracker/heartbeat-logic";

// =============================================================================
// Test Helpers
// =============================================================================

/** Create a default heartbeat state for testing */
const createDefaultState = (): HeartbeatState => ({
  lastHeartbeatTime: 0,
  lastFile: null,
  lastDebug: false,
  lastCompile: false,
  isDebugging: false,
  isCompiling: false,
});

// =============================================================================
// SPEC: Conditional Heartbeat Logic
// Based on wakatime's algorithm for deciding when to send heartbeats
// =============================================================================

describe("SPEC: Conditional Heartbeat Logic", () => {
  /**
   * REQUIREMENT: "Always send heartbeat on file save"
   * This is the most reliable signal of activity - the user explicitly saved.
   */
  describe("should ALWAYS send heartbeat on file save (isWrite=true)", () => {
    it("even if less than 2 minutes passed", () => {
      const state = createDefaultState();
      state.lastHeartbeatTime = Date.now() - 30 * 1000; // 30 seconds ago
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(
        state,
        "same/file.ts",
        true, // isWrite
        Date.now(),
      );

      expect(result).toBe(true);
    });

    it("even if same file and position", () => {
      const state = createDefaultState();
      state.lastHeartbeatTime = Date.now() - 10 * 1000; // 10 seconds ago
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(
        state,
        "same/file.ts",
        true, // isWrite
        Date.now(),
      );

      expect(result).toBe(true);
    });
  });

  /**
   * REQUIREMENT: "Send heartbeat if 2+ minutes passed since last"
   * This is wakatime's TIME_BETWEEN_HEARTBEATS_MS constant.
   */
  describe("should send heartbeat if 2+ minutes passed", () => {
    it("exactly at 2 minutes SHOULD send", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - TIME_BETWEEN_HEARTBEATS_MS; // exactly 2 min ago
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });

    it("1ms before 2 minutes should NOT send", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - TIME_BETWEEN_HEARTBEATS_MS + 1; // 1ms before 2 min
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(false);
    });

    it("3 minutes should definitely send", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 3 * 60 * 1000; // 3 minutes ago
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });
  });

  /**
   * REQUIREMENT: "Send heartbeat when file changes"
   * Switching files is significant activity that should be tracked.
   */
  describe("should send heartbeat when file changes", () => {
    it("different file should trigger heartbeat", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // 10 seconds ago (under threshold)
      state.lastFile = "old/file.ts";

      const result = shouldRecordHeartbeat(state, "new/file.ts", false, now);

      expect(result).toBe(true);
    });

    it("same file should NOT trigger if under 2 minutes", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // 10 seconds ago
      state.lastFile = "same/file.ts";

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(false);
    });

    it("first heartbeat (lastFile = null) should always send", () => {
      const state = createDefaultState();
      state.lastFile = null;

      const result = shouldRecordHeartbeat(
        state,
        "first/file.ts",
        false,
        Date.now(),
      );

      expect(result).toBe(true);
    });
  });

  /**
   * REQUIREMENT: "Send heartbeat when debug state changes"
   * Starting/stopping a debug session is significant activity.
   */
  describe("should send heartbeat when debug state changes", () => {
    it("entering debug mode should trigger heartbeat", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // recent
      state.lastFile = "same/file.ts";
      state.lastDebug = false;
      state.isDebugging = true; // Just started debugging

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });

    it("exiting debug mode should trigger heartbeat", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // recent
      state.lastFile = "same/file.ts";
      state.lastDebug = true;
      state.isDebugging = false; // Just stopped debugging

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });
  });

  /**
   * REQUIREMENT: "Send heartbeat when compile state changes"
   * Starting/stopping a build task is significant activity.
   */
  describe("should send heartbeat when compile state changes", () => {
    it("starting build should trigger heartbeat", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // recent
      state.lastFile = "same/file.ts";
      state.lastCompile = false;
      state.isCompiling = true; // Just started compiling

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });

    it("ending build should trigger heartbeat", () => {
      const state = createDefaultState();
      const now = Date.now();
      state.lastHeartbeatTime = now - 10 * 1000; // recent
      state.lastFile = "same/file.ts";
      state.lastCompile = true;
      state.isCompiling = false; // Just stopped compiling

      const result = shouldRecordHeartbeat(state, "same/file.ts", false, now);

      expect(result).toBe(true);
    });
  });
});

// =============================================================================
// SPEC: Deduplication Logic
// Prevents sending duplicate heartbeats for static cursor positions
// =============================================================================

describe("SPEC: Deduplication Logic", () => {
  let dedupe: Record<string, DedupeEntry>;

  beforeEach(() => {
    dedupe = {};
  });

  /**
   * REQUIREMENT: "Skip heartbeats if same file + exact position within 30 min"
   */
  describe("should skip duplicate heartbeats within window", () => {
    it("same file + same position within 30 min is duplicate", () => {
      const now = Date.now();
      dedupe["test/file.ts"] = { line: 10, char: 5, time: now - 1000 }; // 1 sec ago

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 10, 5, now);

      expect(result).toBe(true);
    });

    it("same file + different line is NOT duplicate", () => {
      const now = Date.now();
      dedupe["test/file.ts"] = { line: 10, char: 5, time: now - 1000 };

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 11, 5, now);

      expect(result).toBe(false);
    });

    it("same file + different char is NOT duplicate", () => {
      const now = Date.now();
      dedupe["test/file.ts"] = { line: 10, char: 5, time: now - 1000 };

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 10, 6, now);

      expect(result).toBe(false);
    });

    it("different file is NOT duplicate", () => {
      const now = Date.now();
      dedupe["test/file.ts"] = { line: 10, char: 5, time: now - 1000 };

      const result = isDuplicateHeartbeat(dedupe, "other/file.ts", 10, 5, now);

      expect(result).toBe(false);
    });
  });

  /**
   * REQUIREMENT: "Deduplication window is 30 minutes"
   */
  describe("deduplication window boundaries", () => {
    it("within 30 min window is duplicate", () => {
      const now = Date.now();
      const withinWindow = now - (DEDUPE_WINDOW_MS - 1000); // 1 sec before window expires
      dedupe["test/file.ts"] = { line: 10, char: 5, time: withinWindow };

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 10, 5, now);

      expect(result).toBe(true);
    });

    it("exactly at 30 min boundary is NOT duplicate", () => {
      const now = Date.now();
      const atBoundary = now - DEDUPE_WINDOW_MS; // exactly 30 min ago
      dedupe["test/file.ts"] = { line: 10, char: 5, time: atBoundary };

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 10, 5, now);

      expect(result).toBe(false);
    });

    it("after 30 min window is NOT duplicate", () => {
      const now = Date.now();
      const afterWindow = now - DEDUPE_WINDOW_MS - 1000; // 1 sec after window expired
      dedupe["test/file.ts"] = { line: 10, char: 5, time: afterWindow };

      const result = isDuplicateHeartbeat(dedupe, "test/file.ts", 10, 5, now);

      expect(result).toBe(false);
    });
  });

  /**
   * REQUIREMENT: "First heartbeat for a file should never be duplicate"
   */
  describe("should NOT be duplicate for new files", () => {
    it("file not in dedupe map is never duplicate", () => {
      const now = Date.now();
      // dedupe is empty

      const result = isDuplicateHeartbeat(dedupe, "new/file.ts", 10, 5, now);

      expect(result).toBe(false);
    });
  });

  /**
   * Test updateDedupeEntry helper
   */
  describe("updateDedupeEntry", () => {
    it("should update the dedupe map", () => {
      const now = Date.now();

      updateDedupeEntry(dedupe, "test/file.ts", 10, 5, now);

      expect(dedupe["test/file.ts"]).toEqual({
        line: 10,
        char: 5,
        time: now,
      });
    });

    it("should overwrite existing entry", () => {
      const now = Date.now();
      dedupe["test/file.ts"] = { line: 1, char: 1, time: now - 1000 };

      updateDedupeEntry(dedupe, "test/file.ts", 20, 10, now);

      expect(dedupe["test/file.ts"]).toEqual({
        line: 20,
        char: 10,
        time: now,
      });
    });
  });
});
