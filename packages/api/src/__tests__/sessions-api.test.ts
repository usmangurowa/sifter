/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../index";

// Mock AI generation
vi.mock("@turbo/ai", () => ({
  generateCoachMessage: vi.fn().mockResolvedValue({
    headline: "Test Headline",
    subtext: "Test subtext message",
    vibe: "hype_man",
  }),
}));

// Mock cache functions - must be defined before vi.mock
vi.mock("@turbo/db", () => {
  return {
    CACHE_KEYS: {
      pulse: (userId: string) => `pulse:${userId}`,
      vibeHistory: (userId: string) => `vibe-history:${userId}`,
    },
    cacheGet: vi.fn(),
    cacheSet: vi.fn(),
    cacheDelete: vi.fn(),
  };
});

// Helper to create chainable mock
const createChainableMock = (resolveValue: any = []) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve) => resolve(resolveValue)),
    catch: vi.fn().mockReturnThis(),
  };
  return chain;
};

// Mock database - inline to avoid hoisting issues
vi.mock("@turbo/db/client", () => {
  const createChainableInline = (resolveValue: any = []) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => resolve(resolveValue)),
      catch: vi.fn().mockReturnThis(),
    };
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockImplementation(() => createChainableInline([])),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      query: {
        userSettings: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    },
    schema: {},
  };
});

vi.mock("../middleware/analytics", () => ({
  trackApiEvent: vi.fn(),
}));

// Mock session user
const mockSessionUser = {
  user: {
    id: "user_123",
    email: "test@example.com",
    name: "Test User",
  },
};

// Mock Auth
const mockAuth = {
  api: {
    getSession: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signOut: vi.fn(),
    verifyApiKey: vi.fn().mockResolvedValue({ valid: false }),
  },
} as any;

// Response type for pulse API
interface PulseResponse {
  headline: string;
  subtext: string;
  vibe: string;
  cached?: boolean;
  error?: string;
}

describe("API: Sessions Router", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset select mock to return proper thenables
    const { db } = await import("@turbo/db/client");
    (db.select as any).mockImplementation(() => createChainableMock([]));
  });

  // ===========================================================================
  // Authentication
  // ===========================================================================

  describe("GET /sessions/pulse (Authentication)", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValueOnce(null);

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 if session has no user", async () => {
      mockAuth.api.getSession.mockResolvedValueOnce({});

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Cache Behavior
  // ===========================================================================

  describe("GET /sessions/pulse (Cache)", () => {
    it("should return cached content when available", async () => {
      const { db } = await import("@turbo/db/client");
      const { cacheGet } = await import("@turbo/db");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock settings with default pulseRefreshMinutes
      (db.query.userSettings.findFirst as any).mockResolvedValueOnce({
        sessionTimeoutMinutes: 15,
        pulseRefreshMinutes: 15,
      });

      // Mock cached pulse
      (cacheGet as any).mockResolvedValueOnce({
        headline: "Cached Headline",
        subtext: "Cached subtext",
        vibe: "analyst",
        lastVibe: "analyst",
        lastVibeTime: new Date().toISOString(),
      });

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as PulseResponse;
      expect(body.headline).toBe("Cached Headline");
      expect(body.cached).toBe(true);
    });

    it("should skip cache when pulseRefreshMinutes is 0", async () => {
      const { db } = await import("@turbo/db/client");
      const { cacheGet, cacheSet } = await import("@turbo/db");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock settings with pulseRefreshMinutes = 0 (always fresh)
      (db.query.userSettings.findFirst as any).mockResolvedValueOnce({
        sessionTimeoutMinutes: 15,
        pulseRefreshMinutes: 0,
      });

      // Mock vibe history (returned from parallel query)
      (cacheGet as any).mockResolvedValue(null);

      // Setup mocks for all 6 parallel queries
      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: // user name
            return createChainableMock([{ name: "Test User" }]);
          case 2: // today heartbeats
            return createChainableMock([]);
          case 3: // yesterday heartbeats
            return createChainableMock([]);
          case 4: // today sessions count
            return createChainableMock([{ count: 0 }]);
          case 5: // recent session
            return createChainableMock([]);
          case 6: // recent activity
            return createChainableMock([{ count: 0 }]);
          default:
            return createChainableMock([]);
        }
      });

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as PulseResponse;
      expect(body.headline).toBe("Test Headline");
      expect(body.cached).toBe(false);

      // Vibe history should still be cached even when pulseRefreshMinutes is 0
      expect(cacheSet).toHaveBeenCalled();
    });

    it("should generate fresh content on cache miss", async () => {
      const { db } = await import("@turbo/db/client");
      const { cacheGet, cacheSet } = await import("@turbo/db");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock settings
      (db.query.userSettings.findFirst as any).mockResolvedValueOnce({
        sessionTimeoutMinutes: 15,
        pulseRefreshMinutes: 15,
      });

      // Mock cache miss for pulse, null for vibeHistory
      (cacheGet as any).mockResolvedValue(null);

      // Setup mocks for all 6 parallel queries
      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: // user name
            return createChainableMock([{ name: "Test User" }]);
          case 2: // today heartbeats
            return createChainableMock([]);
          case 3: // yesterday heartbeats
            return createChainableMock([]);
          case 4: // today sessions count
            return createChainableMock([{ count: 0 }]);
          case 5: // recent session
            return createChainableMock([]);
          case 6: // recent activity
            return createChainableMock([{ count: 0 }]);
          default:
            return createChainableMock([]);
        }
      });

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as PulseResponse;
      expect(body.headline).toBe("Test Headline");
      expect(body.cached).toBe(false);

      // Should cache the result
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Cache Invalidation
  // ===========================================================================

  describe("DELETE /sessions/pulse/cache", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValueOnce(null);

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse/cache", {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("should delete cache for authenticated user", async () => {
      const { cacheDelete } = await import("@turbo/db");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse/cache", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
      expect(cacheDelete).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Response Format
  // ===========================================================================

  describe("GET /sessions/pulse (Response Format)", () => {
    it("should return headline, subtext, vibe, and cached flag", async () => {
      const { db } = await import("@turbo/db/client");
      const { cacheGet } = await import("@turbo/db");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock settings
      (db.query.userSettings.findFirst as any).mockResolvedValueOnce({
        sessionTimeoutMinutes: 15,
        pulseRefreshMinutes: 15,
      });

      // Mock cache miss for pulse, null for vibeHistory
      (cacheGet as any).mockResolvedValue(null);

      // Setup mocks for all 6 parallel queries
      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: // user name
            return createChainableMock([{ name: "Test User" }]);
          case 2: // today heartbeats
            return createChainableMock([]);
          case 3: // yesterday heartbeats
            return createChainableMock([]);
          case 4: // today sessions count
            return createChainableMock([{ count: 0 }]);
          case 5: // recent session
            return createChainableMock([]);
          case 6: // recent activity
            return createChainableMock([{ count: 0 }]);
          default:
            return createChainableMock([]);
        }
      });

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/pulse", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as PulseResponse;

      expect(body).toHaveProperty("cached");
      expect(typeof body.headline).toBe("string");
      expect(typeof body.subtext).toBe("string");
      expect(typeof body.vibe).toBe("string");
      expect(typeof body.cached).toBe("boolean");
    });
  });

  // ===========================================================================
  // Session History (GET /sessions)
  // ===========================================================================

  describe("GET /sessions", () => {
    it("should return 400 if startDate or endDate is missing", async () => {
      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      const app = createApp(mockAuth);
      const res = await app.request("/sessions", {
        method: "GET",
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("should return completed sessions with activity data", async () => {
      const { db } = await import("@turbo/db/client");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock sessions
      const mockSessions = [
        {
          id: "session_1",
          userId: "user_123",
          status: "completed",
          startedAt: new Date("2024-01-01T10:00:00Z"),
          endedAt: new Date("2024-01-01T11:00:00Z"), // 1 hour duration
        },
      ];

      // Mock heartbeats for session_1 (bucket calculation)
      // Session is 60 mins. Bucket size = 6 mins.
      // timestamp 10:05 -> 5 mins elapsed -> bucket 0
      // timestamp 10:55 -> 55 mins elapsed -> bucket 9
      const mockHeartbeats = [
        {
          sessionId: "session_1",
          timestamp: new Date("2024-01-01T10:05:00Z"),
        },
        {
          sessionId: "session_1",
          timestamp: new Date("2024-01-01T10:55:00Z"),
        },
      ];

      let callCount = 0;
      (db.select as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: // Fetch sessions
            return createChainableMock(mockSessions);
          case 2: // Fetch heartbeats
            return createChainableMock(mockHeartbeats);
          default:
            return createChainableMock([]);
        }
      });

      const app = createApp(mockAuth);
      const res = await app.request(
        "/sessions?startDate=2024-01-01T00:00:00Z&endDate=2024-01-02T00:00:00Z",
        {
          method: "GET",
        },
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.sessions).toHaveLength(1);
      expect(body.sessions[0].id).toBe("session_1");

      // Verify sparkline buckets
      // Should have 1 in bucket 0 and 1 in bucket 9
      const activity = body.sessions[0].activity;
      expect(activity).toHaveLength(10);
      expect(activity[0]).toBe(1);
      expect(activity[9]).toBe(1);
      expect(activity[5]).toBe(0);
    });
  });

  // ===========================================================================
  // Active Session (GET /sessions/current)
  // ===========================================================================

  describe("GET /sessions/current", () => {
    it("should return the active session if one exists", async () => {
      const { db } = await import("@turbo/db/client");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      const mockActiveSession = {
        id: "session_active",
        userId: "user_123",
        status: "ongoing",
        startedAt: new Date(),
      };

      // Mock findFirst query
      (db.query.userSettings.findFirst as any).mockResolvedValue(null); // Reset settings mock just in case
      (db.query as any).codingSession = {
        findFirst: vi.fn().mockResolvedValue(mockActiveSession),
      };

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/current", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.session).not.toBeNull();
      expect(body.session.id).toBe("session_active");
      expect(body.session.status).toBe("ongoing");
    });

    it("should return null if no session is active", async () => {
      const { db } = await import("@turbo/db/client");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock findFirst query returning null
      (db.query as any).codingSession = {
        findFirst: vi.fn().mockResolvedValue(null),
      };

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/current", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.session).toBeNull();
    });
  });

  // ===========================================================================
  // Session Detail (GET /sessions/:id)
  // ===========================================================================

  describe("GET /sessions/:id", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.api.getSession.mockResolvedValueOnce(null);

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/session_123", {
        method: "GET",
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 if session not found", async () => {
      const { db } = await import("@turbo/db/client");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      // Mock findFirst query returning null (session not found)
      (db.query as any).codingSession = {
        findFirst: vi.fn().mockResolvedValue(null),
      };

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/session_123", {
        method: "GET",
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as any;
      expect(body.error).toBe("Session not found");
    });

    it("should return session detail with activity and commits", async () => {
      const { db } = await import("@turbo/db/client");

      mockAuth.api.getSession.mockResolvedValueOnce(mockSessionUser);

      const mockSession = {
        id: "session_123",
        userId: "user_123",
        status: "completed",
        title: "Test Session",
        summary: "Working on tests",
        startedAt: new Date("2024-01-01T10:00:00Z"),
        endedAt: new Date("2024-01-01T11:00:00Z"),
        mainProject: "test-project",
        mainBranch: "main",
        mainLanguage: "TypeScript",
      };

      const mockHeartbeats = [
        {
          timestamp: new Date("2024-01-01T10:05:00Z"),
          file: "/src/index.ts",
          language: "TypeScript",
          category: null,
        },
        {
          timestamp: new Date("2024-01-01T10:30:00Z"),
          file: "/src/utils.ts",
          language: "TypeScript",
          category: "committing",
          commitSha: "abc1234",
          commitMessage: "Add utility functions",
          filesChanged: 2,
          insertions: 50,
          deletions: 10,
        },
      ];

      // Mock findFirst for session
      (db.query as any).codingSession = {
        findFirst: vi.fn().mockResolvedValue(mockSession),
      };

      // Mock select for heartbeats
      (db.select as any).mockImplementation(() =>
        createChainableMock(mockHeartbeats),
      );

      const app = createApp(mockAuth);
      const res = await app.request("/sessions/session_123", {
        method: "GET",
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;

      // Verify session data
      expect(body.session.id).toBe("session_123");
      expect(body.session.title).toBe("Test Session");

      // Verify activity buckets (20 buckets)
      expect(body.activity).toHaveLength(20);

      // Verify top files
      expect(body.topFiles).toBeDefined();

      // Verify language breakdown
      expect(body.languageBreakdown).toBeDefined();

      // Verify commits
      expect(body.commits).toHaveLength(1);
      expect(body.commits[0].sha).toBe("abc1234");
      expect(body.commits[0].message).toBe("Add utility functions");

      // Verify stats
      expect(body.stats.totalHeartbeats).toBe(2);
      expect(body.stats.totalCommits).toBe(1);
    });
  });
});
