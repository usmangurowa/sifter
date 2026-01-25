/**
 * QueueStorage Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies expected behavior based on documented specifications.
 *
 * Requirements:
 * - Queue should persist heartbeats for offline sync
 * - Queue should cap at MAX_QUEUE_SIZE (1000) to prevent memory issues
 * - Pending coding time uses wakatime algorithm (time between timestamps)
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { LocalStorage } from "../storage/local";
import type { SerializedHeartbeat } from "../storage/queue";
import { QueueStorage } from "../storage/queue";

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

/** Create a test heartbeat */
const createHeartbeat = (
  timestamp = new Date().toISOString(),
): SerializedHeartbeat => ({
  timestamp,
  file: "test/file.ts",
  project: "test-project",
  language: "typescript",
  branch: "main",
  editor: "VS Code",
  os: "macos",
  isWrite: false,
});

// =============================================================================
// SPECIFICATION: Queue Basic Operations
// =============================================================================

describe("SPEC: QueueStorage Basic Operations", () => {
  let storage: MockStorage;
  let queue: QueueStorage;

  beforeEach(() => {
    storage = createMockStorage();
    queue = new QueueStorage(storage as unknown as LocalStorage);
  });

  describe("enqueue should add heartbeats to the queue", () => {
    it("first heartbeat should increase queue size to 1", async () => {
      await queue.enqueue(createHeartbeat());

      expect(queue.size()).toBe(1);
    });

    it("multiple heartbeats should accumulate in queue", async () => {
      await queue.enqueue(createHeartbeat());
      await queue.enqueue(createHeartbeat());
      await queue.enqueue(createHeartbeat());

      expect(queue.size()).toBe(3);
    });

    it("heartbeats should be retrievable in order", async () => {
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:01Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:02Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:03Z"));

      const queued = queue.getQueue();
      expect(queued[0]?.timestamp).toBe("2023-01-01T10:00:01Z");
      expect(queued[1]?.timestamp).toBe("2023-01-01T10:00:02Z");
      expect(queued[2]?.timestamp).toBe("2023-01-01T10:00:03Z");
    });
  });

  describe("dequeue should remove heartbeats from front", () => {
    it("dequeue(1) should remove first heartbeat", async () => {
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:01Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:02Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:03Z"));

      await queue.dequeue(1);

      const queued = queue.getQueue();
      expect(queue.size()).toBe(2);
      expect(queued[0]?.timestamp).toBe("2023-01-01T10:00:02Z");
    });

    it("dequeue(2) should remove first two heartbeats", async () => {
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:01Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:02Z"));
      await queue.enqueue(createHeartbeat("2023-01-01T10:00:03Z"));

      await queue.dequeue(2);

      const queued = queue.getQueue();
      expect(queue.size()).toBe(1);
      expect(queued[0]?.timestamp).toBe("2023-01-01T10:00:03Z");
    });
  });

  describe("clear should empty the queue", () => {
    it("clear should remove all heartbeats", async () => {
      await queue.enqueue(createHeartbeat());
      await queue.enqueue(createHeartbeat());

      await queue.clear();

      expect(queue.size()).toBe(0);
    });
  });

  describe("getBatch should return subset without removing", () => {
    it("getBatch should return first N heartbeats", async () => {
      for (let i = 1; i <= 10; i++) {
        await queue.enqueue(createHeartbeat(new Date(i * 1000).toISOString()));
      }

      const batch = queue.getBatch(3);

      expect(batch.length).toBe(3);
      // Queue should still have all 10
      expect(queue.size()).toBe(10);
    });

    it("getBatch with default size (50) should return up to 50", async () => {
      for (let i = 1; i <= 10; i++) {
        await queue.enqueue(createHeartbeat());
      }

      const batch = queue.getBatch();

      expect(batch.length).toBe(10); // All 10, since less than 50
    });
  });
});

// =============================================================================
// SPECIFICATION: Queue Size Limit
// =============================================================================

describe("SPEC: Queue Size Limit (MAX_QUEUE_SIZE = 1000)", () => {
  let storage: MockStorage;
  let queue: QueueStorage;

  beforeEach(() => {
    storage = createMockStorage();
    queue = new QueueStorage(storage as unknown as LocalStorage);
  });

  /**
   * REQUIREMENT: Queue should cap at 1000 heartbeats to prevent unbounded memory growth
   * When exceeding limit, oldest heartbeats should be dropped
   */

  it("queue should cap at 1000 heartbeats", async () => {
    // Add 1001 heartbeats
    for (let i = 1; i <= 1001; i++) {
      await queue.enqueue(createHeartbeat());
    }

    expect(queue.size()).toBe(1000);
  });

  it("when over limit, oldest heartbeats should be dropped (keep newest)", async () => {
    // Add 1001 heartbeats (1 to 1001)
    for (let i = 1; i <= 1001; i++) {
      await queue.enqueue(createHeartbeat(new Date(i * 1000).toISOString()));
    }

    const queued = queue.getQueue();

    // Oldest (1) should be dropped, newest (1001) should be kept
    expect(queued[0]?.timestamp).toBe(new Date(2 * 1000).toISOString()); // First one now is 2
    expect(queued[999]?.timestamp).toBe(new Date(1001 * 1000).toISOString()); // Last one is 1001
  });
});

// =============================================================================
// SPECIFICATION: Pending Coding Time Calculation (wakatime Algorithm)
// =============================================================================

describe("SPEC: getPendingCodingTimeSeconds", () => {
  let storage: MockStorage;
  let queue: QueueStorage;

  beforeEach(() => {
    storage = createMockStorage();
    queue = new QueueStorage(storage as unknown as LocalStorage);
  });

  /**
   * REQUIREMENT: Pending coding time uses wakatime algorithm
   * - Time BETWEEN consecutive heartbeats counts as coding time
   * - Gaps <= 15 minutes count as coding time (KEYSTROKE_TIMEOUT_SECONDS)
   * - Gaps > 15 minutes = session break, credit timeout value
   * @see https://wakatime.com/faq#timeout
   */

  /** Helper to create heartbeat with specific timestamp */
  const createHeartbeatWithTime = (timestamp: string): SerializedHeartbeat => ({
    timestamp,
    file: "test/file.ts",
    project: "test-project",
    language: "typescript",
    branch: "main",
    editor: "VS Code",
    os: "macos",
    isWrite: false,
  });

  describe("should calculate time BETWEEN heartbeats", () => {
    it("basic case: 3 heartbeats 1 minute apart = 2 minutes coding", async () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      await queue.enqueue(createHeartbeatWithTime(baseTime.toISOString()));
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 1 * 60 * 1000).toISOString(),
        ),
      );
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 2 * 60 * 1000).toISOString(),
        ),
      );

      const pendingTime = queue.getPendingCodingTimeSeconds();

      // Two gaps of 1 minute = 2 minutes = 120 seconds
      expect(pendingTime).toBe(120);
    });

    it("single heartbeat = 0 coding time (no gap to measure)", async () => {
      await queue.enqueue(createHeartbeatWithTime("2025-12-30T10:00:00Z"));

      const pendingTime = queue.getPendingCodingTimeSeconds();

      expect(pendingTime).toBe(0);
    });

    it("empty queue should return 0", () => {
      const pendingTime = queue.getPendingCodingTimeSeconds();

      expect(pendingTime).toBe(0);
    });
  });

  describe("should use 15-minute keystroke timeout (wakatime default)", () => {
    it("gap of 1 minute SHOULD count", async () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      await queue.enqueue(createHeartbeatWithTime(baseTime.toISOString()));
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 1 * 60 * 1000).toISOString(),
        ),
      );

      const pendingTime = queue.getPendingCodingTimeSeconds();

      expect(pendingTime).toBe(60); // 60 seconds
    });

    it("gap of exactly 2 minutes SHOULD count (within threshold)", async () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      await queue.enqueue(createHeartbeatWithTime(baseTime.toISOString()));
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 2 * 60 * 1000).toISOString(),
        ),
      );

      const pendingTime = queue.getPendingCodingTimeSeconds();

      expect(pendingTime).toBe(120); // 120 seconds
    });

    it("gap of 3 minutes counts as full gap (within 15 min timeout)", async () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      await queue.enqueue(createHeartbeatWithTime(baseTime.toISOString()));
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 3 * 60 * 1000).toISOString(),
        ),
      );

      const pendingTime = queue.getPendingCodingTimeSeconds();

      // With 15-min timeout: 3 min gap counts as full coding time
      expect(pendingTime).toBe(180); // 3 minutes = 180 seconds
    });
  });

  describe("should handle mixed session breaks", () => {
    it("1 min work, 5 min break, 2 min work = 8 min coding (all within 15 min timeout)", async () => {
      const baseTime = new Date("2025-12-30T10:00:00Z");
      // First session: 1 minute
      await queue.enqueue(createHeartbeatWithTime(baseTime.toISOString()));
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 1 * 60 * 1000).toISOString(),
        ),
      );
      // 5 minute break (within 15 min threshold, counts as full gap)
      // Second session: 2 minutes (two 1-min gaps)
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 6 * 60 * 1000).toISOString(),
        ),
      );
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 7 * 60 * 1000).toISOString(),
        ),
      );
      await queue.enqueue(
        createHeartbeatWithTime(
          new Date(baseTime.getTime() + 8 * 60 * 1000).toISOString(),
        ),
      );

      const pendingTime = queue.getPendingCodingTimeSeconds();

      // With 15-min timeout: all gaps count as full coding time
      // Total: 8 min from 10:00 to 10:08 = 480 seconds
      expect(pendingTime).toBe(480);
    });
  });
});
