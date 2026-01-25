import * as vscode from "vscode";

import type { HeartbeatCategory } from "@turbo/shared";
import { HEARTBEAT_CATEGORY } from "@turbo/shared";

import type { SerializedHeartbeat } from "../storage/queue";
import type { DedupeEntry, HeartbeatState } from "./heartbeat-logic";
import { isPrivacyModeEnabled, isTrackingEnabled } from "../config";
import { getEditorName, getOS } from "../types/heartbeat";
import { getCurrentBranch, getProjectName } from "./git";
import {
  isDuplicateHeartbeat,
  shouldRecordHeartbeat,
  updateDedupeEntry,
} from "./heartbeat-logic";
import { getSymbolAtCursor, isSymbolCaptureEnabled } from "./symbol";

/**
 * wakatime-style activity listener state
 * @see https://github.com/wakatime/vscode-wakatime/blob/master/src/wakatime.ts
 */
interface ActivityListenerState {
  lastHeartbeatTime: number;
  disposables: vscode.Disposable[];
  lastFile: string | null;
  lastDebug: boolean;
  lastCompile: boolean;
  isDebugging: boolean;
  isCompiling: boolean;
  // Dedupe map: file -> last position (bounded by unique files)
  dedupe: Record<string, DedupeEntry>;
  // Line tracking (wakatime style) - bounded by unique files
  linesInFiles: Record<string, number>;
  // Line changes since last heartbeat - reset after each heartbeat
  lineChanges: {
    ai: Record<string, number>;
    human: Record<string, number>;
  };
}

/**
 * Get file path relative to workspace root
 */
const getRelativeFilePath = (
  absolutePath: string,
  workspaceFolder: string | undefined,
): string | null => {
  if (!workspaceFolder) return null;
  if (absolutePath.startsWith(workspaceFolder)) {
    const folderName = workspaceFolder.split("/").pop() ?? "";
    const relativePath = absolutePath
      .slice(workspaceFolder.length)
      .replace(/^\//, "");
    return `${folderName}/${relativePath}`;
  }
  return null;
};

/**
 * Callback type for when a heartbeat is recorded
 */
export type HeartbeatCallback = (heartbeat: SerializedHeartbeat) => void;

/**
 * Create and start the wakatime-style activity listener
 */
export const createActivityListener = (
  onHeartbeat: HeartbeatCallback,
): vscode.Disposable => {
  const state: ActivityListenerState = {
    lastHeartbeatTime: 0,
    disposables: [],
    lastFile: null,
    lastDebug: false,
    lastCompile: false,
    isDebugging: false,
    isCompiling: false,
    dedupe: {},
    linesInFiles: {},
    lineChanges: { ai: {}, human: {} },
  };

  // Lock to serialize async recordHeartbeat calls and prevent race conditions
  // Each call chains onto the previous to ensure sequential execution
  let recordLock: Promise<void> = Promise.resolve();

  /**
   * Get the current activity category based on state
   * @see https://github.com/wakatime/vscode-wakatime/blob/master/src/utils.ts#isPullRequest
   */
  const getCategory = (uri: vscode.Uri): HeartbeatCategory | undefined => {
    if (state.isDebugging) return HEARTBEAT_CATEGORY.DEBUGGING;
    if (state.isCompiling) return HEARTBEAT_CATEGORY.BUILDING;
    // Code review detection using VS Code-specific schemes
    // - "pr" = GitHub Pull Request extension
    // - "review" = Generic review scheme
    // - "git" = Git diff views
    if (
      uri.scheme === "pr" ||
      uri.scheme === "review" ||
      uri.scheme === "git"
    ) {
      return HEARTBEAT_CATEGORY.CODE_REVIEWING;
    }
    return undefined;
  };

  /**
   * Check if this is a duplicate heartbeat and update dedupe map
   */
  const isDuplicate = (file: string, line: number, char: number): boolean => {
    const now = Date.now();
    if (isDuplicateHeartbeat(state.dedupe, file, line, char, now)) {
      return true;
    }
    updateDedupeEntry(state.dedupe, file, line, char, now);
    return false;
  };

  /**
   * Check if we should record a heartbeat based on state
   */
  const shouldRecord = (file: string | null, isWrite: boolean): boolean => {
    const heartbeatState: HeartbeatState = {
      lastHeartbeatTime: state.lastHeartbeatTime,
      lastFile: state.lastFile,
      lastDebug: state.lastDebug,
      lastCompile: state.lastCompile,
      isDebugging: state.isDebugging,
      isCompiling: state.isCompiling,
    };
    return shouldRecordHeartbeat(heartbeatState, file, isWrite, Date.now());
  };

  /**
   * Update line numbers tracking (wakatime style)
   * Tracks the delta between previous and current line count
   * @see https://github.com/wakatime/vscode-wakatime/blob/master/src/wakatime.ts#updateLineNumbers
   */
  const updateLineNumbers = (): void => {
    const doc = vscode.window.activeTextEditor?.document;
    if (!doc) return;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri)?.uri
      .fsPath;
    const file =
      getRelativeFilePath(doc.uri.fsPath, workspaceFolder) ?? doc.uri.fsPath;

    const current = doc.lineCount;
    // Get prev BEFORE initializing to correctly track delta
    const prev = state.linesInFiles[file];

    // First time seeing this file: no delta to track
    // Subsequent times: calculate the difference
    const delta = prev !== undefined ? current - prev : 0;

    // For now, all changes are human (AI detection deferred)
    // wakatime uses isAICodeGenerating flag to distinguish
    const changes = state.lineChanges.human;
    if (delta !== 0) {
      changes[file] = (changes[file] ?? 0) + delta;
    }

    // Update the tracked line count
    state.linesInFiles[file] = current;
  };

  /**
   * Creates a heartbeat from the current editor state
   */
  const createHeartbeat = async (
    document: vscode.TextDocument,
    isWrite: boolean,
  ): Promise<SerializedHeartbeat> => {
    const privacyMode = isPrivacyModeEnabled();
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
      ?.uri.fsPath;
    const relativePath = getRelativeFilePath(
      document.uri.fsPath,
      workspaceFolder,
    );
    const editor = vscode.window.activeTextEditor;
    const file = relativePath ?? document.uri.fsPath;

    // Get line changes for this file
    const humanLineChanges = state.lineChanges.human[file];
    const aiLineChanges = state.lineChanges.ai[file];
    // Only delete this file's entries, preserve other files' tracked changes
    delete state.lineChanges.human[file];
    delete state.lineChanges.ai[file];

    // Capture symbol at cursor (opt-in, disabled by default for privacy)
    let symbolName: string | undefined;
    let symbolKind: string | undefined;
    if (!privacyMode && isSymbolCaptureEnabled() && editor) {
      const symbol = await getSymbolAtCursor(document, editor.selection.active);
      if (symbol) {
        symbolName = symbol.name;
        symbolKind = symbol.kind;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      // Privacy mode: strip all identifiable information (file, project, branch)
      file: privacyMode ? null : file,
      project: privacyMode ? "private" : getProjectName(workspaceFolder),
      branch: privacyMode ? null : getCurrentBranch(workspaceFolder),
      language: document.languageId,
      editor: getEditorName(),
      os: getOS(),
      isWrite,
      category: getCategory(document.uri),
      lineno: editor ? editor.selection.active.line + 1 : undefined,
      cursorpos: editor ? editor.selection.active.character + 1 : undefined,
      linesInFile: document.lineCount,
      humanLineChanges: humanLineChanges ?? undefined,
      aiLineChanges: aiLineChanges ?? undefined,
      isUnsavedEntity: document.isUntitled ? true : undefined,
      symbolName,
      symbolKind,
    };
  };

  /**
   * Record a heartbeat for the given document
   */
  const recordHeartbeat = async (
    document: vscode.TextDocument,
    isWrite: boolean,
  ): Promise<void> => {
    if (!isTrackingEnabled()) return;

    // Allow file scheme and review-related schemes (pr, review, git)
    const allowedSchemes = ["file", "pr", "review", "git"];
    if (!allowedSchemes.includes(document.uri.scheme)) return;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
      ?.uri.fsPath;
    const file = getRelativeFilePath(document.uri.fsPath, workspaceFolder);

    if (!shouldRecord(file, isWrite)) return;

    const editor = vscode.window.activeTextEditor;
    if (editor && file && !isWrite) {
      if (
        isDuplicate(
          file,
          editor.selection.active.line,
          editor.selection.active.character,
        )
      ) {
        return;
      }
    }

    const heartbeat = await createHeartbeat(document, isWrite);
    onHeartbeat(heartbeat);

    state.lastHeartbeatTime = Date.now();
    state.lastFile = file;
    state.lastDebug = state.isDebugging;
    state.lastCompile = state.isCompiling;
  };

  /**
   * Handle activity events (wakatime pattern: updateLineNumbers then record)
   * Uses lock to serialize async recordHeartbeat calls and prevent race conditions
   */
  const onEvent = (document: vscode.TextDocument, isWrite: boolean): void => {
    updateLineNumbers();
    // Chain onto the lock to serialize execution
    // Catch errors to prevent the chain from breaking
    recordLock = recordLock
      .then(() => recordHeartbeat(document, isWrite))
      .catch(() => {
        // Silently handle errors to prevent chain from breaking
        // Individual heartbeat failures shouldn't affect subsequent heartbeats
      });
  };

  /**
   * Helper to record heartbeat for the active editor
   * Reduces duplicate code across debug, task, and notebook listeners
   * Uses lock to serialize async recordHeartbeat calls and prevent race conditions
   */
  const recordActiveEditorHeartbeat = (isWrite: boolean): void => {
    updateLineNumbers();
    const editor = vscode.window.activeTextEditor;
    if (editor?.document) {
      // Chain onto the lock to serialize execution
      // Catch errors to prevent the chain from breaking
      recordLock = recordLock
        .then(() => recordHeartbeat(editor.document, isWrite))
        .catch(() => {
          // Silently handle errors to prevent chain from breaking
          // Individual heartbeat failures shouldn't affect subsequent heartbeats
        });
    }
  };

  // =========================================================================
  // Event Listeners
  // =========================================================================

  state.disposables.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      // NOTE: isWrite=false allows throttling mechanics to work (only 1 heartbeat per 2 mins).
      // If we set isWrite=true, every keystroke would force a heartbeat (see heartbeat-logic.ts).
      if (e.contentChanges.length > 0) onEvent(e.document, false);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document) onEvent(editor.document, false);
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => onEvent(doc, true)),
    vscode.window.onDidChangeTextEditorSelection((e) => {
      onEvent(e.textEditor.document, false);
    }),
    vscode.window.tabGroups.onDidChangeTabs(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor?.document) onEvent(editor.document, false);
    }),
    // Scroll / Visible Ranges (Passive Reading) - DISABLED to align with wakatime behavior
    // vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
    //   onEvent(e.textEditor.document, false);
    // }),
    // Debug
    vscode.debug.onDidStartDebugSession(() => {
      state.isDebugging = true;
      recordActiveEditorHeartbeat(false);
    }),
    vscode.debug.onDidTerminateDebugSession(() => {
      state.isDebugging = false;
      recordActiveEditorHeartbeat(false);
    }),
    vscode.debug.onDidChangeBreakpoints(() =>
      recordActiveEditorHeartbeat(false),
    ),
    // Tasks
    vscode.tasks.onDidStartTask((e) => {
      if (e.execution.task.isBackground) return;
      if (e.execution.task.name.toLowerCase().includes("watch")) return;
      state.isCompiling = true;
      recordActiveEditorHeartbeat(false);
    }),
    vscode.tasks.onDidEndTask(() => {
      state.isCompiling = false;
      recordActiveEditorHeartbeat(false);
    }),
    // Notebooks
    vscode.workspace.onDidChangeNotebookDocument(() =>
      recordActiveEditorHeartbeat(false),
    ),
    vscode.workspace.onDidSaveNotebookDocument(() =>
      recordActiveEditorHeartbeat(true),
    ),
  );

  // Create a disposable that clears state on dispose to prevent memory leaks
  const cleanup: vscode.Disposable = {
    dispose: () => {
      // Clear all event listener disposables
      for (const d of state.disposables) {
        d.dispose();
      }
      // Clear state maps to free memory
      state.dedupe = {};
      state.linesInFiles = {};
      state.lineChanges = { ai: {}, human: {} };
    },
  };

  return cleanup;
};
