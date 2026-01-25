import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { apikey, user } from "./auth-schema";

// =============================================================================
// Session Schema - "Strava Run" equivalent for coding
// =============================================================================

/**
 * Session status enum - tracks the lifecycle of a coding session.
 * ongoing → synced → completed
 */
export const sessionStatusEnum = pgEnum("session_status", [
  "ongoing", // Actively receiving heartbeats
  "synced", // Session closed, stats computed, awaiting AI summary
  "completed", // Has AI-generated title & summary
]);

/**
 * Action tag enum - describes what kind of work happened in a session.
 * AI selects the most fitting tag based on session context.
 */
export const actionTagEnum = pgEnum("action_tag", [
  "building", // Creating new features/code
  "refactoring", // Restructuring existing code
  "debugging", // Fixing issues
  "testing", // Writing/running tests
  "reviewing", // Reading/exploring code
  "configuring", // Setup/config work
]);

/**
 * Coding session table - groups heartbeats into meaningful coding "runs".
 * A new session starts after 15+ minutes of inactivity.
 * Named 'codingSession' to avoid collision with Better Auth's 'session' table.
 */
export const codingSession = pgTable(
  "coding_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at").notNull(),
    // AI-generated metadata
    title: text("title"), // e.g., "Auth System Refactor"
    summary: text("summary"), // AI-generated description
    actionTag: actionTagEnum("action_tag"), // AI-selected action tag
    // Derived stats - most frequent values (computed on session close)
    mainLanguage: text("main_language"), // Most used language
    mainProject: text("main_project"), // Primary project
    mainBranch: text("main_branch"), // Primary branch
    linesAdded: integer("lines_added").default(0),
    linesDeleted: integer("lines_deleted").default(0),
    // Git integration
    commitId: text("commit_id"), // Optional: linked git commit SHA
    // Lifecycle
    status: sessionStatusEnum("status").notNull().default("ongoing"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("coding_session_user_idx").on(table.userId),
    index("coding_session_user_status_idx").on(table.userId, table.status),
    index("coding_session_started_at_idx").on(table.startedAt),
  ],
);

/** Inferred type for a coding session row */
export type CodingSession = typeof codingSession.$inferSelect;

export const codingSessionRelations = relations(
  codingSession,
  ({ one, many }) => ({
    user: one(user, {
      fields: [codingSession.userId],
      references: [user.id],
    }),
    heartbeats: many(heartbeat),
  }),
);

// =============================================================================
// Heartbeat Schema
// =============================================================================

/**
 * Heartbeat table - stores individual coding activity signals from the extension.
 * Each heartbeat represents a moment of activity (typing, file switch, etc.)
 */
export const heartbeat = pgTable(
  "heartbeat",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => codingSession.id, {
      onDelete: "set null",
    }),
    apiKeyId: text("api_key_id").references(() => apikey.id, {
      onDelete: "set null",
    }), // Track which API key was used
    timestamp: timestamp("timestamp").notNull(),
    file: text("file"), // null in stealth/privacy mode
    project: text("project").notNull(),
    language: text("language").notNull(),
    branch: text("branch"),
    editor: text("editor").notNull().default("vscode"),
    os: text("os").notNull(), // "macos", "windows", "linux"
    isWrite: boolean("is_write").notNull().default(false),
    // wakatime-style activity tracking fields
    category: text("category"), // "debugging" | "building" | "code_reviewing"
    lineno: integer("lineno"), // cursor line number (1-indexed)
    cursorpos: integer("cursorpos"), // cursor column position (1-indexed)
    linesInFile: integer("lines_in_file"), // total lines in the file
    aiLineChanges: integer("ai_line_changes"), // lines added/removed by AI
    humanLineChanges: integer("human_line_changes"), // lines added/removed by human
    isUnsavedEntity: boolean("is_unsaved_entity"), // true if file is untitled
    // Symbol context (opt-in for richer AI summaries)
    symbolName: text("symbol_name"), // e.g., "handleLogin", "AuthService.validate"
    symbolKind: text("symbol_kind"), // e.g., "function", "class", "method"
    // Git commit context (when category = "committing")
    commitSha: text("commit_sha"), // Short SHA (7 chars), e.g., "a1b2c3d"
    commitMessage: text("commit_message"), // First line of commit message
    filesChanged: integer("files_changed"), // Number of files in commit
    insertions: integer("insertions"), // Lines added
    deletions: integer("deletions"), // Lines removed
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("heartbeat_user_timestamp_idx").on(table.userId, table.timestamp),
    index("heartbeat_api_key_idx").on(table.apiKeyId),
    index("heartbeat_session_idx").on(table.sessionId),
  ],
);

export const heartbeatRelations = relations(heartbeat, ({ one }) => ({
  user: one(user, {
    fields: [heartbeat.userId],
    references: [user.id],
  }),
  codingSession: one(codingSession, {
    fields: [heartbeat.sessionId],
    references: [codingSession.id],
  }),
}));

// =============================================================================
// User Settings Schema - Synced between extension and web UI
// =============================================================================

/**
 * Privacy mode enum for tracking settings
 */
export const privacyModeEnum = pgEnum("privacy_mode", ["normal", "stealth"]);

/**
 * User settings table - stores synced settings between extension and web UI.
 * One row per user (unique constraint on userId).
 */
export const userSettings = pgTable(
  "user_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    // Synced settings (match VS Code extension settings)
    enabled: boolean("enabled").notNull().default(true),
    privacyMode: privacyModeEnum("privacy_mode").notNull().default("normal"),
    breakReminderMinutes: integer("break_reminder_minutes")
      .notNull()
      .default(90),
    sessionTimeoutMinutes: integer("session_timeout_minutes")
      .notNull()
      .default(15),
    enableTelemetry: boolean("enable_telemetry").notNull().default(false),
    captureSymbols: boolean("capture_symbols").notNull().default(false),
    captureCommits: boolean("capture_commits").notNull().default(true),
    // Web-only settings
    pulseRefreshMinutes: integer("pulse_refresh_minutes").notNull().default(15), // 0 = always fresh
    hasSeenDashboardTour: boolean("has_seen_dashboard_tour")
      .notNull()
      .default(false),
    // Metadata
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("user_settings_user_idx").on(table.userId)],
);

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

// =============================================================================
// KV Cache Schema - General-purpose key-value cache with TTL
// =============================================================================

/**
 * Key-value cache table for general caching with automatic expiry.
 * Used for pulse content, rate limiting, and other cacheable data.
 */
export const cache = pgTable(
  "cache",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    key: text("key").notNull().unique(), // e.g., "pulse:user_123"
    value: text("value").notNull(), // JSON stringified data
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cache_key_idx").on(table.key),
    index("cache_expires_at_idx").on(table.expiresAt),
  ],
);

// =============================================================================
// Zod Schemas for API Validation
// =============================================================================

export const osEnum = z.enum(["macos", "windows", "linux"]);
export const categoryEnum = z
  .enum(["debugging", "building", "code_reviewing", "committing"])
  .optional();

export const CreateHeartbeatSchema = createInsertSchema(heartbeat, {
  timestamp: z.coerce.date(),
  os: osEnum,
  category: categoryEnum,
  // 1-indexed cursor position fields
  lineno: z.number().int().min(1).optional(),
  cursorpos: z.number().int().min(1).optional(),
  // Non-negative file line count
  linesInFile: z.number().int().min(0).optional(),
  // Line changes can be positive (added) or negative (removed)
  aiLineChanges: z.number().int().optional(),
  humanLineChanges: z.number().int().optional(),
  // Symbol context (opt-in)
  symbolName: z.string().max(255).optional(),
  symbolKind: z.string().max(50).optional(),
  // Git commit context (when category = "committing")
  commitSha: z.string().max(40).optional(), // Short or full SHA
  commitMessage: z.string().max(2000).optional(), // Full commit message
  filesChanged: z.number().int().min(0).optional(),
  insertions: z.number().int().min(0).optional(),
  deletions: z.number().int().min(0).optional(),
}).omit({
  // Server-managed fields excluded from client input:
  id: true, // Auto-generated CUID
  createdAt: true, // Auto-set by database
  userId: true, // Extracted from API key authentication
  sessionId: true, // Assigned by session tracking system (findOrCreateSession)
});

export const SyncHeartbeatsSchema = z.object({
  heartbeats: z.array(CreateHeartbeatSchema),
});

export * from "./auth-schema";
