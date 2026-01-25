/**
 * Schema Validation Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies the Zod validation constraints for heartbeat fields.
 *
 * Requirements:
 * - lineno: 1-indexed line number (must be >= 1)
 * - cursorpos: 1-indexed cursor position (must be >= 1)
 * - linesInFile: non-negative (must be >= 0)
 * - aiLineChanges / humanLineChanges: can be any integer (positive or negative)
 */

import { describe, expect, it } from "vitest";

import { CreateHeartbeatSchema } from "@turbo/db/schema";

// =============================================================================
// Test Helpers
// =============================================================================

/** Create a valid heartbeat for testing */
const createValidHeartbeat = () => ({
  timestamp: new Date().toISOString(),
  file: "test/file.ts",
  project: "test-project",
  language: "typescript",
  branch: "main",
  editor: "vscode",
  os: "macos" as const,
  isWrite: false,
});

// =============================================================================
// SPEC: Integer Field Validation
// =============================================================================

describe("SPEC: Schema Validation Constraints", () => {
  /**
   * REQUIREMENT: lineno should be 1-indexed (>= 1)
   */
  describe("lineno validation", () => {
    it("should accept lineno >= 1", () => {
      const heartbeat = { ...createValidHeartbeat(), lineno: 1 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept lineno = 100", () => {
      const heartbeat = { ...createValidHeartbeat(), lineno: 100 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should reject lineno = 0 (lines are 1-indexed)", () => {
      const heartbeat = { ...createValidHeartbeat(), lineno: 0 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });

    it("should reject negative lineno", () => {
      const heartbeat = { ...createValidHeartbeat(), lineno: -1 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });

    it("should allow undefined lineno", () => {
      const heartbeat = { ...createValidHeartbeat(), lineno: undefined };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });
  });

  /**
   * REQUIREMENT: cursorpos should be 1-indexed (>= 1)
   */
  describe("cursorpos validation", () => {
    it("should accept cursorpos >= 1", () => {
      const heartbeat = { ...createValidHeartbeat(), cursorpos: 1 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should reject cursorpos = 0 (positions are 1-indexed)", () => {
      const heartbeat = { ...createValidHeartbeat(), cursorpos: 0 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });

    it("should reject negative cursorpos", () => {
      const heartbeat = { ...createValidHeartbeat(), cursorpos: -5 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });

    it("should allow undefined cursorpos", () => {
      const heartbeat = { ...createValidHeartbeat(), cursorpos: undefined };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });
  });

  /**
   * REQUIREMENT: linesInFile should be non-negative (>= 0)
   */
  describe("linesInFile validation", () => {
    it("should accept linesInFile = 0 (empty file)", () => {
      const heartbeat = { ...createValidHeartbeat(), linesInFile: 0 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept linesInFile > 0", () => {
      const heartbeat = { ...createValidHeartbeat(), linesInFile: 1000 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should reject negative linesInFile", () => {
      const heartbeat = { ...createValidHeartbeat(), linesInFile: -1 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });
  });

  /**
   * REQUIREMENT: line changes can be positive (added) or negative (removed)
   */
  describe("line changes validation", () => {
    it("should accept positive humanLineChanges (lines added)", () => {
      const heartbeat = { ...createValidHeartbeat(), humanLineChanges: 10 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept negative humanLineChanges (lines removed)", () => {
      const heartbeat = { ...createValidHeartbeat(), humanLineChanges: -5 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept zero humanLineChanges (no change)", () => {
      const heartbeat = { ...createValidHeartbeat(), humanLineChanges: 0 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept positive aiLineChanges", () => {
      const heartbeat = { ...createValidHeartbeat(), aiLineChanges: 50 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept negative aiLineChanges", () => {
      const heartbeat = { ...createValidHeartbeat(), aiLineChanges: -20 };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });
  });

  /**
   * REQUIREMENT: category should only accept valid values
   */
  describe("category validation", () => {
    it("should accept 'debugging' category", () => {
      const heartbeat = { ...createValidHeartbeat(), category: "debugging" };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept 'building' category", () => {
      const heartbeat = { ...createValidHeartbeat(), category: "building" };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should accept 'code_reviewing' category", () => {
      const heartbeat = {
        ...createValidHeartbeat(),
        category: "code_reviewing",
      };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const heartbeat = { ...createValidHeartbeat(), category: "invalid" };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(false);
    });

    it("should allow undefined category (coding is default)", () => {
      const heartbeat = { ...createValidHeartbeat(), category: undefined };
      const result = CreateHeartbeatSchema.safeParse(heartbeat);
      expect(result.success).toBe(true);
    });
  });
});
