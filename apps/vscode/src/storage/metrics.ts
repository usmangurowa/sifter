import type { LocalStorage } from "./local";

const METRICS_KEY = "kodo.persistedMetrics";

/**
 * Persisted metrics that survive IDE restarts
 */
export interface PersistedMetrics {
  /** Coding time in seconds for today */
  todayCodingTimeSeconds: number;
  /** Number of heartbeats recorded today */
  todayHeartbeatCount: number;
  /** ISO date string (YYYY-MM-DD) for when these metrics were recorded */
  lastActiveDate: string;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0] ?? "";
};

/**
 * Metrics storage for persisting daily coding stats
 */
export class MetricsStorage {
  constructor(private readonly storage: LocalStorage) {}

  /**
   * Load persisted metrics, resetting if it's a new day
   */
  load(): PersistedMetrics {
    const stored = this.storage.get<PersistedMetrics | null>(METRICS_KEY, null);
    const today = getTodayDate();

    // If no stored metrics or it's a new day, return fresh metrics
    if (stored?.lastActiveDate !== today) {
      return {
        todayCodingTimeSeconds: 0,
        todayHeartbeatCount: 0,
        lastActiveDate: today,
      };
    }

    return stored;
  }

  /**
   * Save metrics to persistent storage
   */
  async save(metrics: PersistedMetrics): Promise<void> {
    await this.storage.set(METRICS_KEY, {
      ...metrics,
      lastActiveDate: getTodayDate(),
    });
  }

  /**
   * Update metrics with new values and persist
   */
  async update(
    codingTimeSeconds: number,
    heartbeatCount: number,
  ): Promise<void> {
    await this.save({
      todayCodingTimeSeconds: codingTimeSeconds,
      todayHeartbeatCount: heartbeatCount,
      lastActiveDate: getTodayDate(),
    });
  }
}

/**
 * Create a MetricsStorage instance
 */
export const createMetricsStorage = (storage: LocalStorage): MetricsStorage => {
  return new MetricsStorage(storage);
};
