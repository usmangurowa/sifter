/**
 * Activity Listener Pure Logic
 *
 * These functions contain the pure logic for heartbeat decisions,
 * extracted for testability. The main activity-listener.ts uses these.
 *
 * @see wakatime spec: https://github.com/wakatime/vscode-wakatime
 */

import { DEDUPE_WINDOW_MS, TIME_BETWEEN_HEARTBEATS_MS } from "@turbo/shared";

// =============================================================================
// Types
// =============================================================================

export interface HeartbeatState {
  lastHeartbeatTime: number;
  lastFile: string | null;
  lastDebug: boolean;
  lastCompile: boolean;
  isDebugging: boolean;
  isCompiling: boolean;
}

export interface DedupeEntry {
  line: number;
  char: number;
  time: number;
}

// =============================================================================
// Conditional Heartbeat Logic
// =============================================================================

/**
 * wakatime's conditional heartbeat logic.
 *
 * REQUIREMENT: Only send a new heartbeat when:
 * 1. File saved (isWrite = true)
 * 2. 2+ minutes passed since last heartbeat
 * 3. File changed
 * 4. Debug or compile state changed
 *
 * @see https://github.com/wakatime/vscode-wakatime/blob/master/src/wakatime.ts
 */
export const shouldRecordHeartbeat = (
  state: HeartbeatState,
  file: string | null,
  isWrite: boolean,
  now: number,
): boolean => {
  // Always send on file save
  if (isWrite) return true;

  // Send if 2+ minutes passed
  if (now - state.lastHeartbeatTime >= TIME_BETWEEN_HEARTBEATS_MS) return true;

  // Send if file changed
  if (state.lastFile !== file) return true;

  // Send if debug state changed
  if (state.lastDebug !== state.isDebugging) return true;

  // Send if compile state changed
  if (state.lastCompile !== state.isCompiling) return true;

  return false;
};

// =============================================================================
// Deduplication Logic
// =============================================================================

/**
 * Check if this is a duplicate heartbeat.
 *
 * REQUIREMENT: Skip heartbeats if same file AND exact same cursor position
 * within the deduplication window (30 minutes).
 *
 * This prevents sending duplicate heartbeats when the user hasn't
 * actually moved their cursor.
 */
export const isDuplicateHeartbeat = (
  dedupe: Record<string, DedupeEntry>,
  file: string,
  line: number,
  char: number,
  now: number,
): boolean => {
  const prev = dedupe[file];

  if (
    prev &&
    now - prev.time < DEDUPE_WINDOW_MS &&
    prev.line === line &&
    prev.char === char
  ) {
    return true;
  }

  return false;
};

/**
 * Update the dedupe map with new position.
 * Should be called after isDuplicateHeartbeat returns false.
 */
export const updateDedupeEntry = (
  dedupe: Record<string, DedupeEntry>,
  file: string,
  line: number,
  char: number,
  now: number,
): void => {
  dedupe[file] = { line, char, time: now };
};
