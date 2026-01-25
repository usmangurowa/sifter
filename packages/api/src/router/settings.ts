import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import type { db as DbType } from "@turbo/db/client";
import type { UserSettings } from "@turbo/validators";
import { userSettings } from "@turbo/db/schema";
import { updateSettingsSchema, userSettingsSchema } from "@turbo/validators";

import type { AppContext } from "../context";
import { apiKeyMiddleware } from "../middleware/api-key";
import { authMiddleware } from "../middleware/auth";

/**
 * Default settings derived from schema - single source of truth
 */
const DEFAULT_SETTINGS: UserSettings = userSettingsSchema.parse({});

/**
 * Helper to get settings for a user
 */
const getUserSettings = async (db: typeof DbType, userId: string) => {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings) {
    return userSettingsSchema.parse({});
  }

  return {
    enabled: settings.enabled,
    privacyMode: settings.privacyMode,
    breakReminderMinutes: settings.breakReminderMinutes,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    enableTelemetry: settings.enableTelemetry,
    captureSymbols: settings.captureSymbols,
    captureCommits: settings.captureCommits,
    pulseRefreshMinutes: settings.pulseRefreshMinutes,
    hasSeenDashboardTour: settings.hasSeenDashboardTour,
  };
};

/**
 * Helper to upsert settings for a user.
 * IMPORTANT: Only updates the specific fields provided, doesn't reset other fields.
 */
const upsertUserSettings = async (
  db: typeof DbType,
  userId: string,
  updates: Partial<typeof DEFAULT_SETTINGS>,
) => {
  // Check if user has existing settings
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { id: true },
  });

  if (existing) {
    // UPDATE: Only update the fields that were explicitly provided
    await db
      .update(userSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));
  } else {
    // INSERT: Create new row with defaults + updates
    await db.insert(userSettings).values({
      userId,
      ...DEFAULT_SETTINGS,
      ...updates,
    });
  }

  return getUserSettings(db, userId);
};

/**
 * Settings router - handles syncing user settings between extension and web UI.
 * Supports both API key authentication (for extension) and session auth (for web).
 */
const app = new Hono<AppContext>()
  // =========================================================================
  // API Key authenticated routes (for VS Code extension)
  // =========================================================================

  /**
   * GET /settings - Fetch user settings (API key auth)
   * Returns default values if settings don't exist yet
   */
  .get("/", apiKeyMiddleware, async (c) => {
    const db = c.get("db");
    const userId = c.get("apiKeyUserId");
    const settings = await getUserSettings(db, userId);
    return c.json(settings);
  })

  /**
   * PUT /settings - Update user settings (API key auth)
   * Creates settings row if not exists (upsert)
   */
  .put(
    "/",
    apiKeyMiddleware,
    zValidator("json", updateSettingsSchema),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("apiKeyUserId");
      const updates = c.req.valid("json");
      const settings = await upsertUserSettings(db, userId, updates);
      return c.json(settings);
    },
  )

  // =========================================================================
  // Session authenticated routes (for web UI)
  // =========================================================================

  /**
   * GET /settings/web - Fetch user settings (session auth for web)
   */
  .get("/web", authMiddleware, async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const settings = await getUserSettings(db, session.user.id);
    return c.json(settings);
  })

  /**
   * PUT /settings/web - Update user settings (session auth for web)
   */
  .put(
    "/web",
    authMiddleware,
    zValidator("json", updateSettingsSchema),
    async (c) => {
      const db = c.get("db");
      const session = c.get("session");
      if (!session?.user) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const updates = c.req.valid("json");
      const settings = await upsertUserSettings(db, session.user.id, updates);
      return c.json(settings);
    },
  );

export default app;
