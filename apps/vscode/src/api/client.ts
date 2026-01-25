import type { SerializedHeartbeat } from "../storage/queue";
import type { AuthManager } from "./auth";
import { getConfig } from "../config";
import { getEditorName, getOS } from "../types/heartbeat";

interface SyncMetrics {
  codingTimeSeconds: number;
  heartbeatCount: number;
  sessions: number;
  flows: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  /** User ID returned from the server for identification */
  userId?: string;
  /** Updated metrics returned from the server after sync */
  metrics?: SyncMetrics;
  error?: string;
}

interface TodayMetricsResult {
  success: boolean;
  data?: {
    codingTimeSeconds: number;
    heartbeatCount: number;
    sessions: number;
    flows: number;
  };
  error?: string;
}

/**
 * API client for syncing heartbeats to the Kodo backend
 */
export class ApiClient {
  constructor(private readonly authManager: AuthManager) {}

  /**
   * Get the user's IANA timezone name (e.g., "Africa/Lagos", "America/New_York")
   */
  private getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Sync a batch of heartbeats to the API
   * Returns updated today's metrics for efficiency (1 request instead of 2)
   */
  async syncHeartbeats(heartbeats: SerializedHeartbeat[]): Promise<SyncResult> {
    const apiKey = await this.authManager.getApiKey();
    if (!apiKey) {
      return { success: false, synced: 0, error: "No API key configured" };
    }

    const config = getConfig();
    const timezone = this.getTimezone();
    const endpoint = `${config.apiEndpoint}/heartbeats?timezone=${encodeURIComponent(timezone)}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ heartbeats }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          synced: 0,
          error: `API error: ${response.status} - ${errorBody}`,
        };
      }

      const data = (await response.json()) as {
        synced: number;
        userId: string;
        metrics: SyncMetrics;
      };
      return {
        success: true,
        synced: data.synced,
        userId: data.userId,
        metrics: data.metrics,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, synced: 0, error: message };
    }
  }

  /**
   * Send a connection heartbeat immediately when API key is set.
   * This bypasses the queue to provide instant feedback to the web UI.
   */
  async sendConnectionHeartbeat(): Promise<SyncResult> {
    const heartbeat: SerializedHeartbeat = {
      timestamp: new Date().toISOString(),
      file: null,
      project: "",
      branch: null,
      language: "",
      editor: getEditorName(),
      os: getOS(),
      isWrite: false,
    };

    return this.syncHeartbeats([heartbeat]);
  }

  /**
   * Validate the API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    const apiKey = await this.authManager.getApiKey();
    if (!apiKey) {
      return false;
    }

    // Send an empty heartbeats array to validate the key
    const result = await this.syncHeartbeats([]);
    return result.success;
  }

  /**
   * Fetch today's metrics from the server (for two-way sync)
   */
  async fetchTodayMetrics(): Promise<TodayMetricsResult> {
    const apiKey = await this.authManager.getApiKey();
    if (!apiKey) {
      return { success: false, error: "No API key configured" };
    }

    const config = getConfig();
    const timezone = this.getTimezone();
    const endpoint = `${config.apiEndpoint}/metrics/today?timezone=${encodeURIComponent(timezone)}`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          error: `API error: ${response.status} - ${errorBody}`,
        };
      }

      const data = (await response.json()) as {
        codingTimeSeconds: number;
        heartbeats: number;
        sessions: number;
        flows: number;
      };

      return {
        success: true,
        data: {
          codingTimeSeconds: data.codingTimeSeconds,
          heartbeatCount: data.heartbeats,
          sessions: data.sessions,
          flows: data.flows,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  }
}

/**
 * Create an ApiClient instance
 */
export const createApiClient = (authManager: AuthManager): ApiClient => {
  return new ApiClient(authManager);
};
