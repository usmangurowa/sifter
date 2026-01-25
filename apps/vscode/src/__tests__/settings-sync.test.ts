/**
 * Settings Sync Tests
 *
 * These tests verify the bi-directional settings sync between the VS Code
 * extension and the server, ensuring no push-back loops occur.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthManager } from "../api/auth";
import type { SyncableSettings } from "../api/settings";
import { createSettingsSync } from "../api/settings";

// Mock vscode
vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      update: vi.fn().mockResolvedValue(undefined),
    })),
  },
  ConfigurationTarget: {
    Global: 1,
  },
}));

// Mock config - use let so we can reassign values
const mockConfig: {
  enabled: boolean;
  privacyMode: "normal" | "stealth";
  breakReminderMinutes: number;
  sessionTimeoutMinutes: number;
  enableTelemetry: boolean;
  captureSymbols: boolean;
  captureCommits: boolean;
  apiEndpoint: string;
} = {
  enabled: true,
  privacyMode: "normal",
  breakReminderMinutes: 90,
  sessionTimeoutMinutes: 15,
  enableTelemetry: false,
  captureSymbols: false,
  captureCommits: true,
  apiEndpoint: "https://api.example.com",
};

vi.mock("../config", () => ({
  getConfig: vi.fn(() => mockConfig),
}));

// Mock auth manager - cast to AuthManager to satisfy type checker
const createMockAuthManager = (apiKey: string | null = "test-api-key") =>
  ({
    getApiKey: vi.fn().mockResolvedValue(apiKey),
    hasApiKey: vi.fn().mockResolvedValue(apiKey !== null),
    setApiKey: vi.fn().mockResolvedValue(undefined),
    clearApiKey: vi.fn().mockResolvedValue(undefined),
  }) as unknown as AuthManager;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Settings Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockConfig to defaults
    mockConfig.enabled = true;
    mockConfig.privacyMode = "normal";
    mockConfig.breakReminderMinutes = 90;
    mockConfig.sessionTimeoutMinutes = 15;
    mockConfig.enableTelemetry = false;
    mockConfig.captureSymbols = false;
  });

  describe("pull()", () => {
    it("should fetch settings from server and return them", async () => {
      const serverSettings: SyncableSettings = {
        enabled: true,
        privacyMode: "stealth",
        breakReminderMinutes: 60,
        sessionTimeoutMinutes: 20,
        enableTelemetry: true,
        captureSymbols: true,
        captureCommits: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverSettings),
      });

      const authManager = createMockAuthManager();
      const settingsSync = createSettingsSync(authManager);

      const result = await settingsSync.pull();

      expect(result).toEqual(serverSettings);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/settings",
        expect.objectContaining({
          headers: { "x-api-key": "test-api-key" },
        }),
      );
    });

    it("should return null when no API key", async () => {
      const authManager = createMockAuthManager(null);
      const settingsSync = createSettingsSync(authManager);

      const result = await settingsSync.pull();

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("push()", () => {
    it("should push settings to server when they differ from last known", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const authManager = createMockAuthManager();
      const settingsSync = createSettingsSync(authManager);

      // First push - no previous state, should push
      const result = await settingsSync.push();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/settings",
        expect.objectContaining({
          method: "PUT",
          headers: {
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
          },
        }),
      );
    });

    it("should skip push when settings match last known server state", async () => {
      const serverSettings: SyncableSettings = {
        enabled: true,
        privacyMode: "normal",
        breakReminderMinutes: 90,
        sessionTimeoutMinutes: 15,
        enableTelemetry: false,
        captureSymbols: false,
        captureCommits: true,
      };

      // Mock pull response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverSettings),
      });

      const authManager = createMockAuthManager();
      const settingsSync = createSettingsSync(authManager);

      // First, pull settings from server
      await settingsSync.pull();

      // Clear mock to track subsequent calls
      mockFetch.mockClear();

      // Now push - should be skipped since config matches what we just pulled
      const result = await settingsSync.push();

      expect(result).toBe(true);
      // Fetch should NOT have been called - push was skipped
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should push when settings actually changed after pull", async () => {
      const serverSettings: SyncableSettings = {
        enabled: true,
        privacyMode: "normal",
        breakReminderMinutes: 90,
        sessionTimeoutMinutes: 15,
        enableTelemetry: false,
        captureSymbols: false,
        captureCommits: true,
      };

      // Mock pull response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverSettings),
      });

      const authManager = createMockAuthManager();
      const settingsSync = createSettingsSync(authManager);

      // First, pull settings from server
      await settingsSync.pull();

      // Now simulate user changing a setting locally
      mockConfig.sessionTimeoutMinutes = 20; // Changed from 15 to 20

      // Clear mock to track subsequent calls
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // Now push - should happen since setting actually changed
      const result = await settingsSync.push();

      expect(result).toBe(true);
      // Fetch SHOULD have been called - push happened
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/settings",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"sessionTimeoutMinutes":20'),
        }),
      );
    });
  });

  describe("race condition prevention", () => {
    it("should not push back settings immediately after pulling them", async () => {
      // This tests the core race condition fix:
      // 1. Web UI changes settings
      // 2. Extension pulls new settings
      // 3. Config change listener fires and tries to push
      // 4. Push should be SKIPPED because settings match what we just pulled

      const webUISettings: SyncableSettings = {
        enabled: true,
        privacyMode: "stealth", // Changed on web UI
        breakReminderMinutes: 60, // Changed on web UI
        sessionTimeoutMinutes: 20, // Changed on web UI
        enableTelemetry: false,
        captureSymbols: false,
        captureCommits: true,
      };

      // Step 1: Mock server returning settings changed from web UI
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webUISettings),
      });

      const authManager = createMockAuthManager();
      const settingsSync = createSettingsSync(authManager);

      // Step 2: Extension pulls settings (simulating window focus)
      await settingsSync.pull();

      // Update mockConfig to reflect what was applied (simulating VS Code applying settings)
      mockConfig.privacyMode = "stealth";
      mockConfig.breakReminderMinutes = 60;
      mockConfig.sessionTimeoutMinutes = 20;

      // Clear fetch mock to track push call
      mockFetch.mockClear();

      // Step 3: Config change listener fires and calls push
      // This is what would cause the race condition without our fix
      const pushResult = await settingsSync.push();

      // Step 4: Verify push was SKIPPED
      expect(pushResult).toBe(true); // Returns true (success, but skipped)
      expect(mockFetch).not.toHaveBeenCalled(); // No actual fetch = push was skipped
    });
  });
});
