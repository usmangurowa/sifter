import type { HeartbeatCategory } from "@turbo/shared";
import { calculateAllMetrics } from "@turbo/shared";

import type { LocalStorage } from "./local";

const QUEUE_KEY = "kodo.heartbeatQueue";
const MAX_QUEUE_SIZE = 1000;

/**
 * Serialized heartbeat for storage
 */
export interface SerializedHeartbeat {
  timestamp: string;
  file: string | null;
  project: string;
  language: string;
  branch: string | null;
  editor: string;
  os: "macos" | "windows" | "linux";
  isWrite: boolean;
  // wakatime-style activity tracking fields
  category?: HeartbeatCategory;
  lineno?: number;
  cursorpos?: number;
  linesInFile?: number;
  aiLineChanges?: number;
  humanLineChanges?: number;
  isUnsavedEntity?: boolean;
  // Symbol context (opt-in)
  symbolName?: string;
  symbolKind?: string;
  // Git commit context (when category = "committing")
  commitSha?: string;
  commitMessage?: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
}

/**
 * Queue storage for offline heartbeats
 * Persists heartbeats until they can be synced to the API
 */
export class QueueStorage {
  constructor(private readonly storage: LocalStorage) {}

  /**
   * Add a heartbeat to the queue
   */
  async enqueue(heartbeat: SerializedHeartbeat): Promise<void> {
    const queue = this.getQueue();
    queue.push(heartbeat);

    // Trim queue if it exceeds max size (keep newest)
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    await this.storage.set(QUEUE_KEY, queue);
  }

  /**
   * Get all queued heartbeats
   */
  getQueue(): SerializedHeartbeat[] {
    return this.storage.get<SerializedHeartbeat[]>(QUEUE_KEY, []);
  }

  /**
   * Get the number of queued heartbeats
   */
  size(): number {
    return this.getQueue().length;
  }

  /**
   * Clear the queue (after successful sync)
   */
  async clear(): Promise<void> {
    await this.storage.set(QUEUE_KEY, []);
  }

  /**
   * Remove specific heartbeats from the queue (partial sync)
   */
  async dequeue(count: number): Promise<void> {
    const queue = this.getQueue();
    queue.splice(0, count);
    await this.storage.set(QUEUE_KEY, queue);
  }

  /**
   * Calculate pending coding time in seconds from unsynced heartbeats.
   * This is the time from heartbeats that haven't been synced to the server yet.
   * Uses the same shared algorithm as the server-side calculation.
   * @param timeoutMinutes Optional user-configured session timeout in minutes
   */
  getPendingCodingTimeSeconds(timeoutMinutes?: number): number {
    const queue = this.getQueue();

    // Use shared coding time calculation (wakatime algorithm)
    // Heartbeats are already sorted chronologically in the queue
    const options = timeoutMinutes
      ? { keystrokeTimeoutSeconds: timeoutMinutes * 60 }
      : undefined;

    return calculateAllMetrics(queue, options).codingTimeSeconds;
  }

  /**
   * Get heartbeats for syncing (batch)
   */
  getBatch(batchSize = 50): SerializedHeartbeat[] {
    return this.getQueue().slice(0, batchSize);
  }
}

/**
 * Create a QueueStorage instance
 */
export const createQueueStorage = (storage: LocalStorage): QueueStorage => {
  return new QueueStorage(storage);
};
