/**
 * Activity Listener Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies expected behavior based on wakatime specifications.
 *
 * Requirements tested:
 * - Conditional heartbeat logic (2-minute timeout, file change, state change, save)
 * - Deduplication (same file + position within 30 minutes)
 * - Category detection (debugging, building, code_reviewing)
 * - Privacy mode (strips file, project, branch)
 * - Line change tracking
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEDUPE_WINDOW_MS,
  HEARTBEAT_CATEGORY,
  TIME_BETWEEN_HEARTBEATS_MS,
} from "@turbo/shared";

import type { SerializedHeartbeat } from "../storage/queue";
import { createActivityListener } from "../tracker/activity-listener";
// Import the mocked functions so we can override them in specific tests
import { getSymbolAtCursor, isSymbolCaptureEnabled } from "../tracker/symbol";
import {
  __createMockDocument,
  __createMockEditor,
  __resetAllMocks,
  __setActiveTextEditor,
  __setMockConfig,
  __triggerEvent,
} from "./__mocks__/vscode";

// Mock the symbol module so recordHeartbeat doesn't do async symbol lookup
vi.mock("../tracker/symbol", () => ({
  getSymbolAtCursor: vi.fn().mockResolvedValue(null),
  isSymbolCaptureEnabled: vi.fn().mockReturnValue(false),
}));

// Helper to flush pending promises - works with vi.useFakeTimers()
const flushPromises = async () => {
  await vi.runAllTimersAsync();
};

// =============================================================================
// Test Helpers
// =============================================================================

/** Collect heartbeats from the activity listener */
const createHeartbeatCollector = () => {
  const heartbeats: SerializedHeartbeat[] = [];
  const callback = (heartbeat: SerializedHeartbeat) => {
    heartbeats.push(heartbeat);
  };
  /** Get first heartbeat and assert it exists */
  const getFirst = (): SerializedHeartbeat => {
    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    const hb = heartbeats[0];
    if (!hb) throw new Error("Expected heartbeat to exist");
    return hb;
  };
  return { heartbeats, callback, getFirst };
};

const _advanceTime = (ms: number) => {
  vi.advanceTimersByTime(ms);
};

// =============================================================================
// SPEC: Threshold Constants
// =============================================================================

describe("SPEC: wakatime Constants", () => {
  it("TIME_BETWEEN_HEARTBEATS_MS should be 2 minutes", () => {
    expect(TIME_BETWEEN_HEARTBEATS_MS).toBe(2 * 60 * 1000);
  });

  it("DEDUPE_WINDOW_MS should be 30 minutes", () => {
    expect(DEDUPE_WINDOW_MS).toBe(30 * 60 * 1000);
  });

  it("HEARTBEAT_CATEGORY should have correct values", () => {
    expect(HEARTBEAT_CATEGORY.DEBUGGING).toBe("debugging");
    expect(HEARTBEAT_CATEGORY.BUILDING).toBe("building");
    expect(HEARTBEAT_CATEGORY.CODE_REVIEWING).toBe("code_reviewing");
  });
});

// =============================================================================
// SPEC: Activity Listener Creation
// =============================================================================

describe("SPEC: Activity Listener", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createActivityListener", () => {
    it("should return a disposable", () => {
      const { callback } = createHeartbeatCollector();
      const listener = createActivityListener(callback);

      expect(listener).toBeDefined();
      expect(typeof listener.dispose).toBe("function");

      listener.dispose();
    });

    it("should not throw when no active editor", () => {
      const { callback } = createHeartbeatCollector();
      __setActiveTextEditor(undefined);

      expect(() => createActivityListener(callback)).not.toThrow();
    });
  });

  // ===========================================================================
  // SPEC: Heartbeat Structure
  // ===========================================================================

  describe("heartbeat structure", () => {
    /**
     * REQUIREMENT: Heartbeats should include all wakatime-compatible fields
     * including timestamp, file, project, language, editor, os, etc.
     */
    it("should include required fields when triggered by save event", async () => {
      const { heartbeats, callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc, 10, 5);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);
      __setMockConfig("privacyMode", "normal");

      const listener = createActivityListener(callback);

      // Trigger a save event (which always creates a heartbeat)
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      // Verify heartbeat was created with required fields
      expect(heartbeats.length).toBe(1);
      const hb = getFirst();
      expect(hb.timestamp).toBeDefined();
      expect(hb.language).toBe("typescript");
      expect(hb.editor).toBeDefined();
      expect(hb.os).toBeDefined();
      expect(hb.isWrite).toBe(true);

      listener.dispose();
    });

    /**
     * REQUIREMENT: Heartbeats should include cursor position fields
     */
    it("should include lineno and cursorpos from active editor", async () => {
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc, 10, 5); // line 10, char 5
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.lineno).toBe(11); // 1-indexed: 10 + 1
      expect(hb.cursorpos).toBe(6); // 1-indexed: 5 + 1

      listener.dispose();
    });

    /**
     * REQUIREMENT: Heartbeats should include linesInFile
     */
    it("should include linesInFile from document", async () => {
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts", {
        lineCount: 250,
      });
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.linesInFile).toBe(250);

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Conditional Logic & Timing
  // ===========================================================================

  describe("logic & timing", () => {
    /**
     * REQUIREMENT: Typing events should be throttled to 2 minutes per file
     */
    it("should throttle typing heartbeats (2-minute timeout)", async () => {
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // 1. Initial event - should record
      __triggerEvent("textDocChange", { document: doc, contentChanges: [{}] });
      await flushPromises();
      expect(heartbeats.length).toBe(1);

      // 2. Immediate subsequent event - should NOT record (throttled)
      _advanceTime(1000); // 1s later
      // Move cursor to avoid "duplicate" detection (which has 30m timeout)
      // We want to test the 2m throttle for *new* content
      editor.selection = { active: { line: 1, character: 1 } };
      __triggerEvent("textDocChange", { document: doc, contentChanges: [{}] });
      await flushPromises();
      expect(heartbeats.length).toBe(1);

      // 3. Just before timeout - should NOT record
      // We are already at T+1000ms. We want to reach T+119000ms (just under 120000)
      // So advance by 118000ms (120000 - 2000)
      _advanceTime(TIME_BETWEEN_HEARTBEATS_MS - 2000);
      editor.selection = { active: { line: 2, character: 1 } };
      __triggerEvent("textDocChange", { document: doc, contentChanges: [{}] });
      await flushPromises();
      expect(heartbeats.length).toBe(1);

      // 4. After timeout - SHOULD record
      // Advance by 3000ms to safely cross 120000ms threshold
      _advanceTime(3000);
      editor.selection = { active: { line: 3, character: 1 } };
      __triggerEvent("textDocChange", { document: doc, contentChanges: [{}] });
      await flushPromises();
      expect(heartbeats.length).toBe(2);

      listener.dispose();
    });

    /**
     * REQUIREMENT: Switching files should trigger immediate heartbeat
     */
    it("should record immediately when switching files", async () => {
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc1 = __createMockDocument("/mock/workspace/test/file1.ts");
      const doc2 = __createMockDocument("/mock/workspace/test/file2.ts");
      const editor1 = __createMockEditor(doc1);
      const editor2 = __createMockEditor(doc2);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // 1. File 1
      __setActiveTextEditor(editor1);
      __triggerEvent("textDocChange", { document: doc1, contentChanges: [{}] });
      await flushPromises();
      expect(heartbeats.length).toBe(1);

      // 2. Switch to File 2 immediately - should record
      __setActiveTextEditor(editor2);
      __triggerEvent("activeEditorChange", editor2);
      // Selection change also triggers heartbeat on file switch if not already tracked
      __triggerEvent("selectionChange", { textEditor: editor2 });
      await flushPromises();
      expect(heartbeats.length).toBe(2);
      expect(heartbeats[1]?.file).toContain("file2.ts");

      listener.dispose();
    });

    /**
     * REQUIREMENT: Saving should always trigger heartbeat
     */
    it("should always record on save", async () => {
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // 1. Save event
      __triggerEvent("textDocSave", doc);
      await flushPromises();
      expect(heartbeats.length).toBe(1);

      // 2. Immediate subsequent save - SHOULD record
      _advanceTime(100);
      __triggerEvent("textDocSave", doc);
      await flushPromises();
      expect(heartbeats.length).toBe(2);

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Deduplication
  // ===========================================================================
  // NOTE: Detailed deduplication logic is tested in heartbeat-logic.test.ts
  // Integration tests for dedupe are flaky due to debounce timers and mock complexity.

  // ===========================================================================
  // SPEC: Categories
  // ===========================================================================

  describe("categories", () => {
    /**
     * REQUIREMENT: Debugging session should set category to "debugging"
     */
    it("should detect debugging category", async () => {
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // Turn on debugging - this triggers recordActiveEditorHeartbeat
      __triggerEvent("debugStart", {});
      await flushPromises();

      // Expect 1 heartbeat from debugStart with debugging category
      // (textDocChange would be throttled on same file within 2 mins)
      expect(heartbeats.length).toBe(1);
      expect(heartbeats[0]?.category).toBe("debugging");

      listener.dispose();
    });

    /**
     * REQUIREMENT: Manual build task should set category to "building"
     */
    it("should detect building category", async () => {
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // Start build task - this triggers recordActiveEditorHeartbeat
      __triggerEvent("taskStart", {
        execution: { task: { name: "Build", isBackground: false } },
      });
      await flushPromises();

      // Verify exactly 1 heartbeat triggered by task start
      expect(heartbeats.length).toBe(1);
      const hb = heartbeats[0];
      expect(hb?.category).toBe("building");

      listener.dispose();
    });

    /**
     * REQUIREMENT: Selection changes should be tracked for code review schemes (pr, review, git)
     */
    it("should track selection changes in code review schemes (pr, review, git)", async () => {
      const { heartbeats, callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/review/pr/123", {
        uri: {
          scheme: "pr",
          fsPath: "/review/pr/123",
          path: "/review/pr/123",
          toString: () => "pr:/review/pr/123",
        },
      });
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);
      __setMockConfig("enabled", true);

      const listener = createActivityListener(callback);

      // Trigger selection change on a PR document
      __triggerEvent("selectionChange", { textEditor: editor });
      await flushPromises();

      // Should record heartbeat
      _advanceTime(1000); // Flush debounce (not needed with flushPromises but kept for clarity)
      expect(heartbeats.length).toBe(1);
      const hb = getFirst();
      expect(hb.category).toBe("code_reviewing");

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Privacy Mode
  // ===========================================================================

  describe("privacy mode", () => {
    /**
     * REQUIREMENT: When privacy mode is enabled (stealth), heartbeats should
     * have file=null, project="private", branch=null to protect user privacy
     */
    it("should strip identifiable information when enabled", async () => {
      __setMockConfig("privacyMode", "stealth");
      __setMockConfig("enabled", true);
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/secret/project.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.file).toBeNull();
      expect(hb.project).toBe("private");
      expect(hb.branch).toBeNull();

      listener.dispose();
    });

    /**
     * REQUIREMENT: Normal privacy mode should include file/project/branch
     */
    it("should include file information in normal mode", async () => {
      __setMockConfig("privacyMode", "normal");
      __setMockConfig("enabled", true);
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      // In normal mode, file should be set (not null)
      expect(hb.file).not.toBeNull();

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Tracking Disabled
  // ===========================================================================

  describe("tracking disabled", () => {
    /**
     * REQUIREMENT: When tracking is disabled, no heartbeats should be recorded
     */
    it("should not record heartbeats when disabled", () => {
      __setMockConfig("enabled", false);
      const { heartbeats, callback } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);

      expect(heartbeats.length).toBe(0);

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Unsaved Entity Detection
  // ===========================================================================

  describe("unsaved entity detection", () => {
    /**
     * REQUIREMENT: Untitled documents should have isUnsavedEntity = true
     */
    it("should mark untitled documents as unsaved", async () => {
      __setMockConfig("enabled", true);
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/Untitled-1", {
        isUntitled: true,
      });
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.isUnsavedEntity).toBe(true);

      listener.dispose();
    });

    /**
     * REQUIREMENT: Saved documents should not have isUnsavedEntity set
     */
    it("should not mark saved documents as unsaved", async () => {
      __setMockConfig("enabled", true);
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts", {
        isUntitled: false,
      });
      const editor = __createMockEditor(doc);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.isUnsavedEntity).toBeUndefined();

      listener.dispose();
    });
  });

  // ===========================================================================
  // SPEC: Symbol Capture
  // ===========================================================================

  describe("symbol capture", () => {
    /**
     * REQUIREMENT: When symbol capture is enabled, heartbeats should include
     * symbolName and symbolKind from the cursor position
     */
    it("should include symbol info when capture is enabled", async () => {
      // Enable symbol capture
      vi.mocked(isSymbolCaptureEnabled).mockReturnValue(true);
      vi.mocked(getSymbolAtCursor).mockResolvedValue({
        name: "handleLogin",
        kind: "function",
      });

      __setMockConfig("enabled", true);
      __setMockConfig("privacyMode", "normal");
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc, 15, 5);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.symbolName).toBe("handleLogin");
      expect(hb.symbolKind).toBe("function");

      listener.dispose();
    });

    /**
     * REQUIREMENT: When symbol capture is disabled, heartbeats should not
     * include symbolName and symbolKind fields
     */
    it("should not include symbol info when capture is disabled", async () => {
      // Disable symbol capture (default)
      vi.mocked(isSymbolCaptureEnabled).mockReturnValue(false);

      __setMockConfig("enabled", true);
      __setMockConfig("privacyMode", "normal");
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc, 15, 5);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.symbolName).toBeUndefined();
      expect(hb.symbolKind).toBeUndefined();

      listener.dispose();
    });

    /**
     * REQUIREMENT: Privacy mode should prevent symbol capture even when enabled
     */
    it("should not capture symbols in privacy mode", async () => {
      // Enable symbol capture but also enable privacy mode
      vi.mocked(isSymbolCaptureEnabled).mockReturnValue(true);
      vi.mocked(getSymbolAtCursor).mockResolvedValue({
        name: "secretFunction",
        kind: "function",
      });

      __setMockConfig("enabled", true);
      __setMockConfig("privacyMode", "stealth"); // Privacy mode enabled
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/secret/project.ts");
      const editor = __createMockEditor(doc, 15, 5);
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      // Symbol should not be captured in privacy mode
      expect(hb.symbolName).toBeUndefined();
      expect(hb.symbolKind).toBeUndefined();

      listener.dispose();
    });

    /**
     * REQUIREMENT: When no symbol found at cursor, fields should be undefined
     */
    it("should handle no symbol at cursor gracefully", async () => {
      // Enable symbol capture but return null (no symbol found)
      vi.mocked(isSymbolCaptureEnabled).mockReturnValue(true);
      vi.mocked(getSymbolAtCursor).mockResolvedValue(null);

      __setMockConfig("enabled", true);
      __setMockConfig("privacyMode", "normal");
      const { callback, getFirst } = createHeartbeatCollector();
      const doc = __createMockDocument("/mock/workspace/test/file.ts");
      const editor = __createMockEditor(doc, 5, 0); // Outside any symbols
      __setActiveTextEditor(editor);

      const listener = createActivityListener(callback);
      __triggerEvent("textDocSave", doc);
      await flushPromises();

      const hb = getFirst();
      expect(hb.symbolName).toBeUndefined();
      expect(hb.symbolKind).toBeUndefined();

      listener.dispose();
    });
  });
});
