import { format, formatDuration, intervalToDuration } from "date-fns";
import * as vscode from "vscode";

import {
  FLOW_GAP_MS,
  FLOW_THRESHOLD_MS,
  PERSIST_INTERVAL_MS,
} from "@turbo/shared/constants";

import type { MetricsStorage } from "../storage/metrics";
import type { QueueStorage } from "../storage/queue";

const STATUS_BAR_ID = "kodo.statusBar";

/**
 * Get today's date as YYYY-MM-DD string
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0] ?? "";
};

/**
 * Status bar manager for displaying session info
 * - Server time is the source of truth for cross-IDE consistency
 * - Pending time is calculated from unsynced heartbeats in queue
 * - Total displayed = serverCodingTimeSeconds + pending from queue
 */
export class StatusBar {
  private readonly statusBarItem: vscode.StatusBarItem;
  private sessionStartTime: Date | null = null;
  private lastHeartbeatTime: Date | null = null;
  private heartbeatCount = 0;
  private flowStartTime: Date | null = null;

  /** Server-provided coding time (source of truth for cross-IDE consistency) */
  private serverCodingTimeSeconds = 0;
  /** Current date for day rollover detection */
  private currentDate: string = getTodayDate();

  private updateInterval: NodeJS.Timeout | null = null;
  private persistInterval: NodeJS.Timeout | null = null;
  private lastPersistedCodingTime = 0;

  /**
   * Get total coding time (server + pending from queue)
   * Pending time is calculated on-demand from unsynced heartbeats
   */
  private get totalCodingTimeSeconds(): number {
    const pendingFromQueue =
      this.queueStorage?.getPendingCodingTimeSeconds() ?? 0;
    const total = this.serverCodingTimeSeconds + pendingFromQueue;

    console.log(
      `[Kodo] [DEBUG]: Total time = server(${this.serverCodingTimeSeconds}s) + pending(${pendingFromQueue}s) = ${total}s`,
    );

    return total;
  }

  /**
   * Get the current session timeout in milliseconds from config
   */
  private getSessionGapMs(): number {
    const config = vscode.workspace.getConfiguration("kodo");
    const minutes = config.get<number>("sessionTimeoutMinutes") ?? 15;
    return minutes * 60 * 1000;
  }

  /**
   * Get pending coding time from queue (convenience wrapper with null safety)
   */
  private getPendingCodingTimeSeconds(): number {
    const config = vscode.workspace.getConfiguration("kodo");
    const minutes = config.get<number>("sessionTimeoutMinutes");
    return this.queueStorage?.getPendingCodingTimeSeconds(minutes) ?? 0;
  }

  /**
   * Format duration in seconds to a human-readable string
   */
  private formatDurationStr(seconds: number): string {
    if (seconds < 60) {
      return "--:--";
    }
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, {
      format: ["hours", "minutes"],
      zero: false,
      delimiter: " ",
    })
      .replace(" hours", " hrs")
      .replace(" hour", " hr")
      .replace(" minutes", " mins")
      .replace(" minute", " min");
  }

  /**
   * Check if it's a new day and reset metrics if needed
   */
  private checkDayRollover(): boolean {
    const today = getTodayDate();
    if (today !== this.currentDate) {
      console.log(
        `[Kodo]: Day rollover detected (${this.currentDate} -> ${today}), resetting metrics`,
      );
      this.currentDate = today;
      this.serverCodingTimeSeconds = 0;
      // Note: pending time from queue will be 0 after next sync
      // Queue persists across restarts, so unsynced heartbeats are not lost
      this.heartbeatCount = 0;
      this.sessionStartTime = null;
      this.lastHeartbeatTime = null;
      this.flowStartTime = null;
      this.lastPersistedCodingTime = 0;

      // Persist the reset
      if (this.metricsStorage) {
        void this.metricsStorage.update(0, 0);
      }

      return true;
    }
    return false;
  }

  constructor(
    private readonly metricsStorage?: MetricsStorage,
    private readonly queueStorage?: QueueStorage,
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      STATUS_BAR_ID,
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "kodo.showStatus";
    this.statusBarItem.tooltip = "Kodo - Deep Work Analytics";

    // Load persisted metrics if storage is available
    if (metricsStorage) {
      const persisted = metricsStorage.load();
      // Heartbeat count from persisted storage (pending time is now calculated from queue)
      this.heartbeatCount = persisted.todayHeartbeatCount;
      this.currentDate = persisted.lastActiveDate;
      this.lastPersistedCodingTime = persisted.todayCodingTimeSeconds;

      const pendingFromQueue = this.getPendingCodingTimeSeconds();
      console.log(
        `[Kodo]: Loaded persisted metrics - ${this.heartbeatCount} heartbeats, ${pendingFromQueue}s pending from queue`,
      );
    }

    // Check for day rollover on startup
    this.checkDayRollover();

    this.update();
    this.statusBarItem.show();

    // Update display every minute (also checks for day rollover)
    this.updateInterval = setInterval(() => {
      this.checkDayRollover();
      this.update();
    }, 60000);

    // Persist metrics every 30 seconds if there are changes
    if (metricsStorage) {
      this.persistInterval = setInterval(() => {
        void this.persistIfChanged();
      }, PERSIST_INTERVAL_MS);
    }
  }

  /**
   * Persist metrics if they have changed since last persist
   */
  private async persistIfChanged(): Promise<void> {
    if (!this.metricsStorage) return;

    const totalCodingTime = this.totalCodingTimeSeconds;
    if (totalCodingTime !== this.lastPersistedCodingTime) {
      await this.metricsStorage.update(totalCodingTime, this.heartbeatCount);
      this.lastPersistedCodingTime = totalCodingTime;
      console.log(
        `[Kodo]: Persisted metrics - ${totalCodingTime}s total coding time`,
      );
    }
  }

  /**
   * Update from server metrics after sync
   * Server is the source of truth - queue clears pending automatically
   */
  updateFromSync(serverMetrics: {
    codingTimeSeconds: number;
    heartbeatCount: number;
  }): void {
    // Check for day rollover first
    this.checkDayRollover();

    // Server time becomes the source of truth
    // Pending time will automatically be 0 or near-0 since queue was just cleared
    this.serverCodingTimeSeconds = serverMetrics.codingTimeSeconds;
    this.heartbeatCount = serverMetrics.heartbeatCount;

    const pendingFromQueue = this.getPendingCodingTimeSeconds();
    console.log(
      `[Kodo]: Updated from sync - server: ${this.serverCodingTimeSeconds}s, pending from queue: ${pendingFromQueue}s`,
    );

    this.update();
  }

  /**
   * Initialize with server metrics on startup (before any sync)
   * Used for initial load when extension starts
   */
  initializeFromServer(serverMetrics: {
    codingTimeSeconds: number;
    heartbeatCount: number;
  }): void {
    // Check for day rollover first
    this.checkDayRollover();

    // Server time is the source of truth
    // Pending time from queue is automatically calculated from unsynced heartbeats
    this.serverCodingTimeSeconds = serverMetrics.codingTimeSeconds;
    this.heartbeatCount = Math.max(
      this.heartbeatCount,
      serverMetrics.heartbeatCount,
    );

    const pendingFromQueue = this.getPendingCodingTimeSeconds();
    console.log(
      `[Kodo]: Initialized from server - server: ${this.serverCodingTimeSeconds}s, pending from queue: ${pendingFromQueue}s`,
    );

    this.update();
  }

  /**
   * Start a new session
   */
  startSession(): void {
    this.sessionStartTime = new Date();
    this.lastHeartbeatTime = new Date();
    // Don't reset heartbeatCount and codingTimeSeconds - they persist for the day
    this.flowStartTime = null;
    this.update();
  }

  /**
   * Pending time is calculated from queue, so we don't track it here
   */
  recordHeartbeat(): void {
    // Check for day rollover
    if (this.checkDayRollover()) {
      // If day rolled over, start fresh session
      this.startSession();
      return;
    }

    const now = new Date();

    // Check if session has timed out (>15 min gap)
    if (this.lastHeartbeatTime) {
      const gap = now.getTime() - this.lastHeartbeatTime.getTime();
      if (gap > this.getSessionGapMs()) {
        // Session ended, start a new one
        this.startSession();
        return;
      }

      // Check flow state - reset flow if gap too large
      if (gap > FLOW_GAP_MS) {
        this.flowStartTime = now;
      }
    }

    if (!this.sessionStartTime) {
      this.startSession();
      return;
    }

    // Start flow timer on first heartbeat of session
    this.flowStartTime ??= now;

    // Note: Pending coding time is calculated from the queue on-demand
    // No need to accumulate it here - the heartbeat was already added to queue

    this.lastHeartbeatTime = now;
    this.heartbeatCount++;
    this.update();
  }

  /**
   * Get coding time in minutes
   */
  getCodingTimeMinutes(): number {
    return Math.floor(this.totalCodingTimeSeconds / 60);
  }

  /**
   * Check if user is in flow state (20+ minutes of continuous activity)
   */
  isFlowing(): boolean {
    if (!this.flowStartTime || !this.lastHeartbeatTime) {
      return false;
    }

    // Check if the continuous coding streak is >= 20 minutes
    const flowDuration =
      this.lastHeartbeatTime.getTime() - this.flowStartTime.getTime();
    return flowDuration >= FLOW_THRESHOLD_MS;
  }

  /**
   * Check if session is still active (recent heartbeat within gap threshold)
   */
  isSessionActive(): boolean {
    if (!this.lastHeartbeatTime) {
      return false;
    }
    const gap = Date.now() - this.lastHeartbeatTime.getTime();
    return gap < this.getSessionGapMs();
  }

  /**
   * Update the status bar display
   */
  update(): void {
    // Check if session has timed out
    if (this.lastHeartbeatTime) {
      const gap = Date.now() - this.lastHeartbeatTime.getTime();
      if (gap > this.getSessionGapMs()) {
        // Session has ended
        this.sessionStartTime = null;
        this.lastHeartbeatTime = null;
        this.flowStartTime = null;
      } else if (gap > FLOW_GAP_MS) {
        // Flow broken, but session still active
        this.flowStartTime = null;
      }
    }

    const sessionMinutes = this.getSessionDurationMinutes();
    const flowing = this.isFlowing();
    const active = this.isSessionActive();

    if (!active) {
      // Show today's total even when no active session
      if (this.totalCodingTimeSeconds > 0) {
        const todayStr = this.formatDurationStr(this.totalCodingTimeSeconds);
        this.statusBarItem.text = `$(pulse) ${todayStr} today`;
      } else {
        this.statusBarItem.text = "$(pulse) Kodo";
      }
    } else {
      const codingStr = this.formatDurationStr(this.totalCodingTimeSeconds);
      const sessionStr = this.formatDurationStr(sessionMinutes * 60);
      const flowIcon = flowing ? "$(flame)" : "$(pulse)";
      this.statusBarItem.text = `${flowIcon} ${codingStr} | ${sessionStr}`;
    }

    this.statusBarItem.tooltip = this.getTooltip();
  }

  /**
   * Get the tooltip text
   */
  private getTooltip(): string {
    const active = this.isSessionActive();
    const lines = ["Kodo - Deep Work Analytics", ""];

    // Always show today's total
    const todayStr = this.formatDurationStr(this.totalCodingTimeSeconds);
    lines.push(`⌨️ Coding Time: ${todayStr}`);

    if (this.sessionStartTime && active) {
      const sessionStr = this.formatDurationStr(
        this.getSessionDurationMinutes() * 60,
      );
      lines.push(`⏱️ Session: ${sessionStr}`);
      lines.push(`💓 Heartbeats: ${this.heartbeatCount}`);

      if (this.isFlowing()) {
        lines.push("", "🔥 Flow State Active");
      }
    } else {
      lines.push("", "No active session");
      lines.push("Start typing to begin tracking");
    }

    lines.push("", "Click for detailed status");
    return lines.join("\n");
  }

  /**
   * Get session duration in minutes
   */
  getSessionDurationMinutes(): number {
    if (!this.sessionStartTime || !this.isSessionActive()) {
      return 0;
    }
    const durationMs = Date.now() - this.sessionStartTime.getTime();
    return Math.floor(durationMs / 60000);
  }

  /**
   * Get session start time formatted
   */
  getSessionStartTimeFormatted(): string | null {
    if (!this.sessionStartTime) {
      return null;
    }
    return format(this.sessionStartTime, "h:mm a");
  }

  /**
   * Get session stats for display
   */
  getStats(): {
    codingTimeMinutes: number;
    sessionDurationMinutes: number;
    sessionStartTime: string | null;
    heartbeats: number;
    flowing: boolean;
    active: boolean;
  } {
    return {
      codingTimeMinutes: this.getCodingTimeMinutes(),
      sessionDurationMinutes: this.getSessionDurationMinutes(),
      sessionStartTime: this.getSessionStartTimeFormatted(),
      heartbeats: this.heartbeatCount,
      flowing: this.isFlowing(),
      active: this.isSessionActive(),
    };
  }

  /**
   * Dispose of the status bar
   */
  dispose(): void {
    // Persist before disposing
    if (this.metricsStorage) {
      void this.metricsStorage.update(
        this.totalCodingTimeSeconds,
        this.heartbeatCount,
      );
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
    this.statusBarItem.dispose();
  }
}

/**
 * Create a StatusBar instance
 */
export const createStatusBar = (
  metricsStorage?: MetricsStorage,
  queueStorage?: QueueStorage,
): StatusBar => {
  return new StatusBar(metricsStorage, queueStorage);
};
