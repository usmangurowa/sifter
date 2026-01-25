import { formatDuration, intervalToDuration } from "date-fns";
import * as vscode from "vscode";

import { ANALYTICS_EVENTS } from "@turbo/analytics/events";
import { SYNC_INTERVAL_MS } from "@turbo/shared/constants";

import { createAuthManager, promptForApiKey } from "./api/auth";
import { createApiClient } from "./api/client";
import { createSettingsSync } from "./api/settings";
import { getConfig } from "./config";
import { createLocalStorage } from "./storage/local";
import { createMetricsStorage } from "./storage/metrics";
import { createQueueStorage } from "./storage/queue";
import {
  identifyUser,
  initTelemetry,
  shutdownTelemetry,
  trackEvent,
} from "./telemetry";
import { createActivityListener } from "./tracker/activity-listener";
import { createCommitListener } from "./tracker/commit-listener";
import { createStatusBar } from "./ui/status-bar";

/**
 * Called when the extension is activated.
 * Activation happens on VS Code startup (onStartupFinished).
 */
export const activate = (context: vscode.ExtensionContext) => {
  console.log("[Kodo]: Extension activated");

  // Initialize telemetry (opt-in)
  initTelemetry(context);
  trackEvent(ANALYTICS_EVENTS.EXTENSION_ACTIVATED);

  // Initialize modules
  const localStorage = createLocalStorage(context);
  const queueStorage = createQueueStorage(localStorage);
  const metricsStorage = createMetricsStorage(localStorage);
  const authManager = createAuthManager(context);
  const apiClient = createApiClient(authManager);
  const statusBar = createStatusBar(metricsStorage, queueStorage);

  // Track sync interval
  let syncInterval: NodeJS.Timeout | null = null;

  // Create settings sync client
  const settingsSync = createSettingsSync(authManager);

  /**
   * Sync queued heartbeats to the API
   * Uses metrics returned from sync to update status bar (server as source of truth)
   */
  const syncHeartbeats = async () => {
    const hasKey = await authManager.hasApiKey();
    if (!hasKey) {
      console.log("[Kodo]: Skipping sync - no API key");
      return;
    }

    const batch = queueStorage.getBatch(50);
    console.log(`[Kodo]: Syncing ${batch.length} heartbeats...`);

    const result = await apiClient.syncHeartbeats(batch);
    if (result.success) {
      if (batch.length > 0) {
        await queueStorage.dequeue(result.synced);
        console.log(
          `[Kodo]: ✅ Synced ${result.synced} heartbeats, ${queueStorage.size()} remaining`,
        );
      }

      // Update status bar with metrics from server (source of truth)
      if (result.metrics) {
        statusBar.updateFromSync({
          codingTimeSeconds: result.metrics.codingTimeSeconds,
          heartbeatCount: result.metrics.heartbeatCount,
        });
      }

      // Identify user for cross-platform analytics
      if (result.userId) {
        identifyUser(result.userId);
      }
    } else {
      console.error(`[Kodo]: ❌ Sync failed: ${result.error}`);

      // Track sync errors in analytics for monitoring
      trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_type: "sync_failed",
        error_message: result.error,
        heartbeat_count: batch.length,
      });
    }
  };

  /**
   * Start the sync interval
   */
  const startSyncInterval = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    syncInterval = setInterval(() => {
      void syncHeartbeats();
    }, SYNC_INTERVAL_MS);
    // Initial sync
    void syncHeartbeats();
  };

  /**
   * Fetch today's metrics from server and update status bar
   */
  const fetchServerMetrics = async () => {
    const hasKey = await authManager.hasApiKey();
    if (!hasKey) {
      console.log("[Kodo]: Skipping server fetch - no API key");
      return;
    }

    console.log("[Kodo]: Fetching today's metrics from server...");
    const result = await apiClient.fetchTodayMetrics();
    if (result.success && result.data) {
      statusBar.initializeFromServer({
        codingTimeSeconds: result.data.codingTimeSeconds,
        heartbeatCount: result.data.heartbeatCount,
      });
      console.log(
        `[Kodo]: ✅ Loaded server metrics - ${result.data.codingTimeSeconds}s coding time`,
      );
    } else {
      console.log(`[Kodo]: ⚠️ Could not fetch server metrics: ${result.error}`);
    }
  };

  // Set up activity listener
  const activityListener = createActivityListener((heartbeat) => {
    void queueStorage.enqueue(heartbeat);
    statusBar.recordHeartbeat();
  });

  // Set up commit listener (tracks git commits as heartbeats)
  // Uses localStorage to persist last known commit SHA across restarts
  const commitListener = createCommitListener((heartbeat) => {
    void queueStorage.enqueue(heartbeat);
    statusBar.recordHeartbeat();
  }, localStorage);

  // Fetch server metrics on startup (two-way sync)
  void fetchServerMetrics();

  // Start sync interval
  startSyncInterval();

  // Sync settings from server on startup
  void settingsSync.pull().then((settings) => {
    if (settings) {
      console.log("[Kodo]: ✅ Settings synced from server");
    }
  });

  // Sync settings when window gains focus (catches web UI changes)
  const windowStateListener = vscode.window.onDidChangeWindowState((state) => {
    if (state.focused) {
      console.log("[Kodo]: Window focused, syncing settings...");
      void settingsSync.pull();
    }
  });

  const showStatusCommand = vscode.commands.registerCommand(
    "kodo.showStatus",
    () => {
      const stats = statusBar.getStats();

      if (!stats.active) {
        const codingStr =
          stats.codingTimeMinutes > 0 ? `${stats.codingTimeMinutes}m` : "0m";
        vscode.window.showInformationMessage(
          `Kodo Status:\n• ⌨️ Coding Time: ${codingStr}\n• No active session\n\nStart typing to begin a session!`,
        );
        return;
      }

      const formatTime = (mins: number) => {
        if (mins < 1) return "--:--";
        const duration = intervalToDuration({
          start: 0,
          end: mins * 60 * 1000,
        });
        return formatDuration(duration, {
          format: ["hours", "minutes"],
          delimiter: " ",
        })
          .replace(" hours", " hrs")
          .replace(" hour", " hr")
          .replace(" minutes", " mins")
          .replace(" minute", " min");
      };

      const codingStr = formatTime(stats.codingTimeMinutes);
      const sessionStr = formatTime(stats.sessionDurationMinutes);
      const flowStatus = stats.flowing ? "🔥 In the flow!" : "";
      const startTime = stats.sessionStartTime
        ? ` (started ${stats.sessionStartTime})`
        : "";

      const lines = [
        "Kodo Status:",
        `• ⌨️ Coding Time: ${codingStr}`,
        `• ⏱️ Session: ${sessionStr}${startTime}`,
        `• 💓 Heartbeats: ${stats.heartbeats}`,
      ];

      if (flowStatus) {
        lines.push(`• ${flowStatus}`);
      }

      vscode.window.showInformationMessage(lines.join("\n"));
    },
  );

  const togglePrivacyCommand = vscode.commands.registerCommand(
    "kodo.togglePrivacy",
    async () => {
      const config = getConfig();
      const newMode = config.privacyMode === "normal" ? "stealth" : "normal";
      await vscode.workspace
        .getConfiguration("kodo")
        .update("privacyMode", newMode, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Kodo: Privacy mode set to ${newMode}`,
      );
    },
  );

  const setApiKeyCommand = vscode.commands.registerCommand(
    "kodo.setApiKey",
    async () => {
      const success = await promptForApiKey(authManager);
      if (success) {
        // If there are queued heartbeats, sync them for instant feedback
        // Otherwise, send a minimal connection heartbeat
        const hasQueuedHeartbeats = queueStorage.size() > 0;

        if (hasQueuedHeartbeats) {
          console.log("[Kodo]: Syncing queued heartbeats after API key set");
          await syncHeartbeats();
        } else {
          console.log(
            "[Kodo]: No queued heartbeats, sending connection heartbeat",
          );
          const result = await apiClient.sendConnectionHeartbeat();
          if (result.success) {
            console.log("[Kodo]: ✅ Connection heartbeat sent");
            if (result.userId) {
              identifyUser(result.userId);
            }
          } else {
            console.error(
              "[Kodo]: ❌ Connection heartbeat failed:",
              result.error,
            );
          }
        }
      }
    },
  );

  const clearApiKeyCommand = vscode.commands.registerCommand(
    "kodo.clearApiKey",
    async () => {
      await authManager.clearApiKey();
      vscode.window.showInformationMessage("Kodo: API key cleared");
    },
  );

  // Debounce timer for settings sync
  let settingsPushTimer: NodeJS.Timeout | null = null;

  // Listen for config changes - push to server when settings change locally (debounced)
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("kodo")) {
        // Clear existing timer and set new one (debounce 2 seconds)
        if (settingsPushTimer) {
          clearTimeout(settingsPushTimer);
        }
        settingsPushTimer = setTimeout(() => {
          console.log("[Kodo]: Config changed, pushing settings to server");
          void settingsSync.push();
          settingsPushTimer = null;
        }, 2000);
      }
    },
  );

  // Manual settings sync command
  const syncSettingsCommand = vscode.commands.registerCommand(
    "kodo.syncSettings",
    async () => {
      const settings = await settingsSync.pull();
      if (settings) {
        vscode.window.showInformationMessage(
          "Kodo: Settings synced from server",
        );
      } else {
        vscode.window.showErrorMessage(
          "Kodo: Failed to sync settings. Check your API key.",
        );
      }
    },
  );

  // Register disposables
  context.subscriptions.push(
    activityListener,
    commitListener,
    statusBar,
    showStatusCommand,
    togglePrivacyCommand,
    setApiKeyCommand,
    clearApiKeyCommand,
    syncSettingsCommand,
    configChangeListener,
    windowStateListener,
    {
      dispose: () => {
        if (syncInterval) {
          clearInterval(syncInterval);
        }
        if (settingsPushTimer) {
          clearTimeout(settingsPushTimer);
        }
      },
    },
  );

  // Check if API key is configured
  void authManager.hasApiKey().then((hasKey) => {
    if (!hasKey) {
      vscode.window
        .showInformationMessage(
          "Kodo: Set your API key to sync activity",
          "Set API Key",
        )
        .then((selection) => {
          if (selection === "Set API Key") {
            void vscode.commands.executeCommand("kodo.setApiKey");
          }
        });
    }
  });
};

/**
 * Called when the extension is deactivated.
 */
export const deactivate = async () => {
  console.log("[Kodo]: Extension deactivated");
  trackEvent(ANALYTICS_EVENTS.EXTENSION_DEACTIVATED);
  await shutdownTelemetry();
};
