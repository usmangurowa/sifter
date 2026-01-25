/**
 * MetricsStorage Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies expected behavior based on documented specifications.
 *
 * Requirements:
 * - Metrics should persist across IDE restarts
 * - Metrics should reset at the start of a new day
 * - Metrics should track coding time and heartbeat count
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalStorage } from "../storage/local";
import type { PersistedMetrics } from "../storage/metrics";
import { MetricsStorage } from "../storage/metrics";

// =============================================================================
// Test Helpers
// =============================================================================

/** Mock storage interface for testing (subset of LocalStorage) */
interface MockStorage {
  data: Record<string, unknown>;
  get<T>(key: string, defaultValue: T): T;
  set(key: string, value: unknown): Promise<void>;
}

/** Create a mock storage for testing */
const createMockStorage = (): MockStorage => {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: <T>(key: string, defaultValue: T): T => {
      const stored = data[key];
      return (stored !== undefined ? stored : defaultValue) as T;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    set: async (key: string, value: unknown): Promise<void> => {
      data[key] = value;
    },
  };
};

// =============================================================================
// SPECIFICATION: Metrics Persistence
// =============================================================================

describe("SPEC: MetricsStorage Persistence", () => {
  let storage: MockStorage;
  let metrics: MetricsStorage;

  beforeEach(() => {
    storage = createMockStorage();
    metrics = new MetricsStorage(storage as unknown as LocalStorage);
    // Mock Date to control "today"
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-30T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("load should return stored metrics for same day", () => {
    it("should return stored metrics if lastActiveDate matches today", () => {
      // Pre-populate storage with today's metrics
      storage.data["kodo.persistedMetrics"] = {
        todayCodingTimeSeconds: 3600,
        todayHeartbeatCount: 100,
        lastActiveDate: "2025-12-30",
      };

      const loaded = metrics.load();

      expect(loaded.todayCodingTimeSeconds).toBe(3600);
      expect(loaded.todayHeartbeatCount).toBe(100);
      expect(loaded.lastActiveDate).toBe("2025-12-30");
    });
  });

  describe("load should return fresh metrics for new day", () => {
    /**
     * REQUIREMENT: Metrics should reset at the start of a new day
     * This ensures daily tracking accuracy
     */

    it("should return zero metrics if storage is empty", () => {
      const loaded = metrics.load();

      expect(loaded.todayCodingTimeSeconds).toBe(0);
      expect(loaded.todayHeartbeatCount).toBe(0);
      expect(loaded.lastActiveDate).toBe("2025-12-30");
    });

    it("should return zero metrics if lastActiveDate is a different day", () => {
      // Pre-populate storage with yesterday's metrics
      storage.data["kodo.persistedMetrics"] = {
        todayCodingTimeSeconds: 7200,
        todayHeartbeatCount: 200,
        lastActiveDate: "2025-12-29", // Yesterday
      };

      const loaded = metrics.load();

      expect(loaded.todayCodingTimeSeconds).toBe(0);
      expect(loaded.todayHeartbeatCount).toBe(0);
      expect(loaded.lastActiveDate).toBe("2025-12-30");
    });

    it("should return zero metrics if lastActiveDate is from last week", () => {
      storage.data["kodo.persistedMetrics"] = {
        todayCodingTimeSeconds: 10000,
        todayHeartbeatCount: 500,
        lastActiveDate: "2025-12-23", // A week ago
      };

      const loaded = metrics.load();

      expect(loaded.todayCodingTimeSeconds).toBe(0);
      expect(loaded.todayHeartbeatCount).toBe(0);
    });
  });

  describe("save should persist metrics with current date", () => {
    it("should store metrics in storage", async () => {
      const metricsToSave: PersistedMetrics = {
        todayCodingTimeSeconds: 1800,
        todayHeartbeatCount: 50,
        lastActiveDate: "2025-12-30",
      };

      await metrics.save(metricsToSave);

      const stored = storage.data["kodo.persistedMetrics"] as PersistedMetrics;
      expect(stored.todayCodingTimeSeconds).toBe(1800);
      expect(stored.todayHeartbeatCount).toBe(50);
    });

    it("save should set lastActiveDate to current date", async () => {
      const metricsToSave: PersistedMetrics = {
        todayCodingTimeSeconds: 100,
        todayHeartbeatCount: 5,
        lastActiveDate: "old-date", // Should be overwritten
      };

      await metrics.save(metricsToSave);

      const stored = storage.data["kodo.persistedMetrics"] as PersistedMetrics;
      expect(stored.lastActiveDate).toBe("2025-12-30");
    });
  });

  describe("update should persist new values", () => {
    it("should update coding time and heartbeat count", async () => {
      await metrics.update(5400, 150);

      const stored = storage.data["kodo.persistedMetrics"] as PersistedMetrics;
      expect(stored.todayCodingTimeSeconds).toBe(5400);
      expect(stored.todayHeartbeatCount).toBe(150);
      expect(stored.lastActiveDate).toBe("2025-12-30");
    });
  });
});

// =============================================================================
// SPECIFICATION: Day Boundary Behavior
// =============================================================================

describe("SPEC: Day Boundary Behavior", () => {
  let storage: MockStorage;
  let metrics: MetricsStorage;

  beforeEach(() => {
    storage = createMockStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("metrics should reset when crossing midnight", async () => {
    // Set time to 11:59 PM on Dec 30
    vi.setSystemTime(new Date("2025-12-30T23:59:00Z"));
    metrics = new MetricsStorage(storage as unknown as LocalStorage);

    // Save some metrics
    await metrics.update(7200, 200);

    // Verify metrics are saved for Dec 30
    let loaded = metrics.load();
    expect(loaded.todayCodingTimeSeconds).toBe(7200);
    expect(loaded.lastActiveDate).toBe("2025-12-30");

    // Time advances to just after midnight on Dec 31
    vi.setSystemTime(new Date("2025-12-31T00:01:00Z"));
    metrics = new MetricsStorage(storage as unknown as LocalStorage);

    // Load should return fresh metrics for the new day
    loaded = metrics.load();
    expect(loaded.todayCodingTimeSeconds).toBe(0);
    expect(loaded.todayHeartbeatCount).toBe(0);
    expect(loaded.lastActiveDate).toBe("2025-12-31");
  });

  it("same day should retain metrics across reloads", async () => {
    vi.setSystemTime(new Date("2025-12-30T10:00:00Z"));
    metrics = new MetricsStorage(storage as unknown as LocalStorage);

    // Save metrics at 10 AM
    await metrics.update(3600, 100);

    // "Restart" the metrics at 3 PM same day
    vi.setSystemTime(new Date("2025-12-30T15:00:00Z"));
    metrics = new MetricsStorage(storage as unknown as LocalStorage);

    const loaded = metrics.load();
    expect(loaded.todayCodingTimeSeconds).toBe(3600);
    expect(loaded.todayHeartbeatCount).toBe(100);
  });
});
