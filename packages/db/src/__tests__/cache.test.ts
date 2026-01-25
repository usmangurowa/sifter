/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, it, vi } from "vitest";

import {
  CACHE_KEYS,
  CACHE_TTL,
  cacheCleanup,
  cacheDelete,
  cacheGet,
  cacheSet,
} from "../cache";

// =============================================================================
// Mock Database
// =============================================================================

// Helper to create a chainable mock with custom resolve value
const createQueryMock = (resolveValue: unknown[] = []) => {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolveValue),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(resolveValue),
  };
};

// =============================================================================
// SPEC: Cache Key Helpers
// =============================================================================

describe("SPEC: Cache Key Helpers", () => {
  it("CACHE_KEYS.pulse generates correct key format", () => {
    const key = CACHE_KEYS.pulse("user_123");
    expect(key).toBe("pulse:user_123");
  });

  it("CACHE_TTL.PULSE is 15 minutes", () => {
    expect(CACHE_TTL.PULSE).toBe(15 * 60 * 1000);
  });
});

// =============================================================================
// SPEC: cacheGet
// =============================================================================

describe("SPEC: cacheGet", () => {
  it("returns null when key does not exist", async () => {
    const db = createQueryMock([]);
    const result = await cacheGet(db as any, "nonexistent");
    expect(result).toBeNull();
  });

  it("returns parsed JSON when key exists and not expired", async () => {
    const futureDate = new Date(Date.now() + 60000); // 1 minute in future
    const db = createQueryMock([
      { value: JSON.stringify({ foo: "bar" }), expiresAt: futureDate },
    ]);

    const result = await cacheGet<{ foo: string }>(db as any, "test-key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null and deletes when key is expired", async () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    const deleteMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([
                { value: JSON.stringify({ foo: "bar" }), expiresAt: pastDate },
              ]),
          }),
        }),
      }),
      delete: deleteMock,
    };

    const result = await cacheGet<{ foo: string }>(db as any, "expired-key");

    expect(result).toBeNull();
    expect(deleteMock).toHaveBeenCalled();
  });

  it("returns null on JSON parse error", async () => {
    const futureDate = new Date(Date.now() + 60000);
    const db = createQueryMock([
      { value: "not-valid-json{{{", expiresAt: futureDate },
    ]);

    const result = await cacheGet<{ foo: string }>(db as any, "invalid-json");
    expect(result).toBeNull();
  });

  it("handles complex nested objects", async () => {
    const futureDate = new Date(Date.now() + 60000);
    const complexData = {
      headline: "Test",
      subtext: "Subtext",
      vibe: "hype_man",
      metadata: {
        nested: { deep: { value: 123 } },
      },
    };
    const db = createQueryMock([
      { value: JSON.stringify(complexData), expiresAt: futureDate },
    ]);

    const result = await cacheGet<typeof complexData>(db as any, "complex-key");
    expect(result).toEqual(complexData);
  });
});

// =============================================================================
// SPEC: cacheSet
// =============================================================================

describe("SPEC: cacheSet", () => {
  it("inserts new cache entry with correct TTL", async () => {
    const valuesMock = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

    const db = {
      insert: insertMock,
    };

    const testData = { headline: "Test", subtext: "Subtext" };
    const ttlMs = 5 * 60 * 1000; // 5 minutes

    const beforeSet = Date.now();
    await cacheSet(db as any, "new-key", testData, ttlMs);
    const afterSet = Date.now();

    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalled();

    // Verify the values passed
    const callArgs = valuesMock.mock.calls[0]?.[0] as {
      key: string;
      value: string;
      expiresAt: Date;
    };
    expect(callArgs.key).toBe("new-key");
    expect(callArgs.value).toBe(JSON.stringify(testData));

    // Verify expiration is within expected range
    const expiresAt = callArgs.expiresAt.getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(beforeSet + ttlMs);
    expect(expiresAt).toBeLessThanOrEqual(afterSet + ttlMs);
  });

  it("upserts when key already exists", async () => {
    const onConflictDoUpdateMock = vi.fn().mockResolvedValue(undefined);
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: onConflictDoUpdateMock,
        }),
      }),
    };

    await cacheSet(db as any, "existing-key", { data: "new" }, 60000);

    expect(onConflictDoUpdateMock).toHaveBeenCalled();
    const conflictArgs = onConflictDoUpdateMock.mock.calls[0]?.[0] as {
      set: { value: string };
    };
    expect(conflictArgs.set.value).toBe(JSON.stringify({ data: "new" }));
  });

  it("serializes arrays correctly", async () => {
    const valuesMock = vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    });
    const db = {
      insert: vi.fn().mockReturnValue({ values: valuesMock }),
    };

    const arrayData = [1, 2, 3, "four", { five: 5 }];
    await cacheSet(db as any, "array-key", arrayData, 60000);

    const callArgs = valuesMock.mock.calls[0]?.[0] as { value: string };
    expect(callArgs.value).toBe(JSON.stringify(arrayData));
  });
});

// =============================================================================
// SPEC: cacheDelete
// =============================================================================

describe("SPEC: cacheDelete", () => {
  it("deletes cache entry by key", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

    const db = { delete: deleteMock };

    await cacheDelete(db as any, "key-to-delete");

    expect(deleteMock).toHaveBeenCalled();
    expect(whereMock).toHaveBeenCalled();
  });

  it("does not throw when key does not exist", async () => {
    const db = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };

    // Should not throw
    await expect(
      cacheDelete(db as any, "nonexistent"),
    ).resolves.toBeUndefined();
  });
});

// =============================================================================
// SPEC: cacheCleanup
// =============================================================================

describe("SPEC: cacheCleanup", () => {
  it("returns count of deleted expired entries", async () => {
    const deletedEntries = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const db = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(deletedEntries),
        }),
      }),
    };

    const count = await cacheCleanup(db as any);

    expect(count).toBe(3);
  });

  it("returns 0 when no expired entries exist", async () => {
    const db = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    const count = await cacheCleanup(db as any);

    expect(count).toBe(0);
  });

  it("uses current time for expiration comparison", async () => {
    const whereMock = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    });
    const db = {
      delete: vi.fn().mockReturnValue({ where: whereMock }),
    };

    await cacheCleanup(db as any);

    expect(whereMock).toHaveBeenCalled();
    // The where clause should have been called (we can't easily inspect drizzle's lt condition)
  });
});

// =============================================================================
// SPEC: TTL Behavior
// =============================================================================

describe("SPEC: TTL Behavior", () => {
  it("entry expires exactly at TTL boundary", async () => {
    // Use fake timers to control time precisely
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);

    // Set cache with 1 second TTL
    const ttlMs = 1000;
    let storedExpiresAt: Date | undefined;

    const setDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((data: { expiresAt: Date }) => {
          storedExpiresAt = data.expiresAt;
          return { onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) };
        }),
      }),
    };

    await cacheSet(setDb as any, "ttl-test", { data: "test" }, ttlMs);

    // Verify expiration was set correctly
    expect(storedExpiresAt).toBeDefined();
    expect(storedExpiresAt?.getTime()).toBe(now + ttlMs);

    vi.useRealTimers();
  });
});
