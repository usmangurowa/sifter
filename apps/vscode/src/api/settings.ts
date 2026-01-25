import * as vscode from "vscode";

import type { AuthManager } from "./auth";
import { getConfig } from "../config";

/**
 * Syncable settings - matches the VS Code extension settings that can be synced
 * with the server. These settings are stored both locally and remotely.
 */
export interface SyncableSettings {
  enabled: boolean;
  privacyMode: "normal" | "stealth";
  breakReminderMinutes: number;
  sessionTimeoutMinutes: number;
  enableTelemetry: boolean;
  captureSymbols: boolean;
  captureCommits: boolean;
}

/**
 * Deep compare two settings objects
 */
const settingsEqual = (a: SyncableSettings, b: SyncableSettings): boolean => {
  return (
    a.enabled === b.enabled &&
    a.privacyMode === b.privacyMode &&
    a.breakReminderMinutes === b.breakReminderMinutes &&
    a.sessionTimeoutMinutes === b.sessionTimeoutMinutes &&
    a.enableTelemetry === b.enableTelemetry &&
    a.captureSymbols === b.captureSymbols &&
    a.captureCommits === b.captureCommits
  );
};

/**
 * Settings sync client - handles bi-directional sync between extension and server.
 *
 * Strategy: Server is the source of truth
 * - On startup: Pull settings from server and apply locally
 * - On local change: Push settings to server (only if actually different)
 * - Periodically: Pull settings from server (in case changed from web UI)
 */
export const createSettingsSync = (authManager: AuthManager) => {
  // Store the last known server settings to detect actual changes
  let lastKnownServerSettings: SyncableSettings | null = null;

  // Flag to prevent push() from running while pull() is applying settings
  // This fixes the race condition where config changes from pull() trigger
  // the change listener which tries to push stale data back to the server
  let isPulling = false;

  /**
   * Fetch settings from server and apply to VS Code configuration
   * @returns The fetched settings, or null if fetch failed
   */
  const pull = async (): Promise<SyncableSettings | null> => {
    const apiKey = await authManager.getApiKey();
    if (!apiKey) {
      console.log("[Kodo]: Settings sync skipped - no API key");
      return null;
    }

    const { apiEndpoint } = getConfig();

    // Set flag before making any changes to prevent push() during apply
    isPulling = true;

    try {
      const response = await fetch(`${apiEndpoint}/settings`, {
        headers: { "x-api-key": apiKey },
      });

      if (!response.ok) {
        console.error(`[Kodo]: Settings fetch failed: ${response.status}`);
        isPulling = false;
        return null;
      }

      const settings = (await response.json()) as SyncableSettings;

      // Store what we received from server BEFORE applying
      // This way, when the config change listener fires, push() will see
      // the current config matches lastKnownServerSettings and skip the push
      lastKnownServerSettings = { ...settings };

      // Apply settings to VS Code
      const config = vscode.workspace.getConfiguration("kodo");
      for (const [key, value] of Object.entries(settings)) {
        await config.update(key, value, vscode.ConfigurationTarget.Global);
      }

      return settings;
    } catch (error) {
      console.error("[Kodo]: Settings sync error:", error);
      return null;
    } finally {
      // Always clear the flag, even on error
      isPulling = false;
    }
  };

  /**
   * Get current settings from VS Code config
   */
  const getCurrentSettings = (): SyncableSettings => {
    const config = getConfig();
    return {
      enabled: config.enabled,
      privacyMode: config.privacyMode,
      breakReminderMinutes: config.breakReminderMinutes,
      sessionTimeoutMinutes: config.sessionTimeoutMinutes,
      enableTelemetry: config.enableTelemetry,
      captureSymbols: config.captureSymbols,
      captureCommits: config.captureCommits,
    };
  };

  /**
   * Push local settings to server
   * Only pushes if settings are actually different from last known server state
   * @returns true if push was successful (or skipped because no change)
   */
  const push = async (): Promise<boolean> => {
    // Skip push if we're currently pulling settings from server
    // This prevents race conditions where stale config values get pushed back
    if (isPulling) {
      console.log("[Kodo]: Settings push skipped - pull in progress");
      return true;
    }

    const apiKey = await authManager.getApiKey();
    if (!apiKey) {
      console.log("[Kodo]: Settings push skipped - no API key");
      return false;
    }

    const currentSettings = getCurrentSettings();

    // Skip push if settings match what we last received from server
    // This prevents push-back loops when pull() applies server settings
    if (
      lastKnownServerSettings &&
      settingsEqual(currentSettings, lastKnownServerSettings)
    ) {
      console.log("[Kodo]: Settings unchanged from server, skipping push");
      return true;
    }

    const config = getConfig();

    try {
      const response = await fetch(`${config.apiEndpoint}/settings`, {
        method: "PUT",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentSettings),
      });

      if (!response.ok) {
        console.error(`[Kodo]: Settings push failed: ${response.status}`);
        return false;
      }

      // Update last known state after successful push
      lastKnownServerSettings = { ...currentSettings };

      console.log("[Kodo]: Settings pushed to server");
      return true;
    } catch (error) {
      console.error("[Kodo]: Settings push error:", error);
      return false;
    }
  };

  return { pull, push };
};

export type SettingsSync = ReturnType<typeof createSettingsSync>;
