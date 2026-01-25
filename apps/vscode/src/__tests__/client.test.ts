import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthManager } from "../api/auth";
import type { ApiClient } from "../api/client";
import { createApiClient } from "../api/client";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock the config module
vi.mock("../config", () => ({
  getConfig: () => ({
    apiEndpoint: "https://kodohq.app/api",
  }),
}));

// Mock the heartbeat types module
vi.mock("../types/heartbeat", () => ({
  getEditorName: () => "vscode",
  getOS: () => "macos",
}));

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let mockAuthManager: AuthManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthManager = {
      getApiKey: vi.fn().mockResolvedValue("kodo_test_key"),
      setApiKey: vi.fn().mockResolvedValue(undefined),
      clearApiKey: vi.fn().mockResolvedValue(undefined),
      hasApiKey: vi.fn().mockResolvedValue(true),
    } as unknown as AuthManager;

    apiClient = createApiClient(mockAuthManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendConnectionHeartbeat", () => {
    it("should send a minimal heartbeat with editor and OS info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            synced: 1,
            userId: "user_123",
            metrics: {
              codingTimeSeconds: 0,
              heartbeatCount: 1,
              sessions: 0,
              flows: 0,
            },
          }),
      });

      const result = await apiClient.sendConnectionHeartbeat();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.userId).toBe("user_123");

      // Verify the heartbeat structure
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];

      expect(url).toContain("https://kodohq.app/api/heartbeats");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/json",
        "x-api-key": "kodo_test_key",
      });

      const body = JSON.parse(options.body as string) as {
        heartbeats: {
          timestamp: string;
          file: string | null;
          project: string;
          branch: string | null;
          language: string;
          editor: string;
          os: string;
          isWrite: boolean;
        }[];
      };
      expect(body.heartbeats).toHaveLength(1);
      expect(body.heartbeats[0]).toBeDefined();

      const heartbeat = body.heartbeats[0] as {
        timestamp: string;
        file: string | null;
        project: string;
        branch: string | null;
        language: string;
        editor: string;
        os: string;
        isWrite: boolean;
      };
      expect(heartbeat.file).toBeNull();
      expect(heartbeat.project).toBe("");
      expect(heartbeat.branch).toBeNull();
      expect(heartbeat.language).toBe("");
      expect(heartbeat.editor).toBe("vscode");
      expect(heartbeat.os).toBe("macos");
      expect(heartbeat.isWrite).toBe(false);
      expect(heartbeat.timestamp).toBeDefined();
    });

    it("should return error when no API key is configured", async () => {
      // Re-create apiClient with a mock that returns undefined
      const noKeyAuthManager = {
        getApiKey: vi.fn().mockResolvedValue(undefined),
        setApiKey: vi.fn().mockResolvedValue(undefined),
        clearApiKey: vi.fn().mockResolvedValue(undefined),
        hasApiKey: vi.fn().mockResolvedValue(false),
      } as unknown as AuthManager;
      const noKeyClient = createApiClient(noKeyAuthManager);

      const result = await noKeyClient.sendConnectionHeartbeat();

      expect(result.success).toBe(false);
      expect(result.error).toBe("No API key configured");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      const result = await apiClient.sendConnectionHeartbeat();

      expect(result.success).toBe(false);
      expect(result.error).toContain("API error: 401");
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const result = await apiClient.sendConnectionHeartbeat();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network failure");
    });
  });

  describe("syncHeartbeats", () => {
    it("should sync provided heartbeats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            synced: 2,
            userId: "user_456",
            metrics: {
              codingTimeSeconds: 120,
              heartbeatCount: 10,
              sessions: 1,
              flows: 0,
            },
          }),
      });

      const heartbeats = [
        {
          timestamp: "2024-01-01T00:00:00Z",
          file: "test.ts",
          project: "my-project",
          branch: "main",
          language: "typescript",
          editor: "vscode",
          os: "macos" as const,
          isWrite: true,
        },
        {
          timestamp: "2024-01-01T00:01:00Z",
          file: "test2.ts",
          project: "my-project",
          branch: "main",
          language: "typescript",
          editor: "vscode",
          os: "macos" as const,
          isWrite: false,
        },
      ];

      const result = await apiClient.syncHeartbeats(heartbeats);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.userId).toBe("user_456");
      expect(result.metrics?.codingTimeSeconds).toBe(120);
    });

    it("should return success with synced=0 for empty heartbeats array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            synced: 0,
            userId: "user_789",
            metrics: {
              codingTimeSeconds: 0,
              heartbeatCount: 0,
              sessions: 0,
              flows: 0,
            },
          }),
      });

      const result = await apiClient.syncHeartbeats([]);

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
    });
  });
});
