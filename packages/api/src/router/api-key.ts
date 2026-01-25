import { and, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";

import { apikey, heartbeat } from "@turbo/db/schema";
import { KNOWN_EDITORS } from "@turbo/shared";

import type { AppContext } from "../context";
import { authMiddleware } from "../middleware/auth";

/**
 * API Key router - handles listing and management of API keys.
 * All routes require session authentication.
 */
const app = new Hono<AppContext>()
  /**
   * GET /apikeys - List all API keys for the current user
   * Includes connected editors queried from heartbeats (optimized to 2 queries)
   */
  .get("/", authMiddleware, async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const userId = session.user.id;

    // Query 1: Fetch all API keys for the user
    const keys = await db
      .select({
        id: apikey.id,
        name: apikey.name,
        start: apikey.start,
        enabled: apikey.enabled,
        lastRequest: apikey.lastRequest,
        createdAt: apikey.createdAt,
      })
      .from(apikey)
      .where(eq(apikey.userId, userId))
      .orderBy(desc(apikey.createdAt));

    if (keys.length === 0) {
      return c.json({ keys: [] });
    }

    const keyIds = keys.map((k) => k.id);

    // Query 2: Single query to get distinct editors for ALL keys at once
    // Filter by known editors and only return one row per (apiKeyId, editor) combo
    const editorRows = await db
      .selectDistinct({
        apiKeyId: heartbeat.apiKeyId,
        editor: heartbeat.editor,
      })
      .from(heartbeat)
      .where(
        and(
          inArray(heartbeat.apiKeyId, keyIds),
          inArray(heartbeat.editor, [...KNOWN_EDITORS]),
        ),
      );

    // Group editors by apiKeyId
    const editorsByKey = new Map<string, string[]>();
    for (const row of editorRows) {
      if (row.apiKeyId) {
        const existing = editorsByKey.get(row.apiKeyId) ?? [];
        existing.push(row.editor);
        editorsByKey.set(row.apiKeyId, existing);
      }
    }

    // Merge editors into keys
    const keysWithEditors = keys.map((key) => ({
      ...key,
      connectedEditors: editorsByKey.get(key.id) ?? [],
    }));

    return c.json({ keys: keysWithEditors });
  });

export default app;
