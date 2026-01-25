import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { Hono } from "hono";

import { codingSession, heartbeat, userSettings } from "@turbo/db/schema";
import { calculateAllMetrics } from "@turbo/shared";

import type { AppContext } from "../context";
import { authMiddleware } from "../middleware/auth";

/**
 * Valid period types for insights
 */
type InsightsPeriod = "week" | "month" | "all-time";

/**
 * Get date range for a period
 */
const getDateRangeForPeriod = (period: InsightsPeriod) => {
  const now = new Date();
  const end = new Date(now);

  let start: Date;

  switch (period) {
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case "all-time":
      // Set to a far past date
      start = new Date("2020-01-01");
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
  }

  // Normalize to start of day
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

/**
 * Insights router - provides period-based stats for Developer Wrapped experience
 */
const app = new Hono<AppContext>()
  /**
   * GET /insights/:period - Get aggregated insights for a period
   * Periods: week, month, all-time
   */
  .get("/:period", authMiddleware, async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const period = c.req.param("period") as InsightsPeriod;

    // Validate period
    if (!["week", "month", "all-time"].includes(period)) {
      return c.json(
        { error: "Invalid period. Use: week, month, all-time" },
        400,
      );
    }

    const { start, end } = getDateRangeForPeriod(period);

    // Fetch user settings for timeout
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
      columns: { sessionTimeoutMinutes: true },
    });

    const timeoutOptions = settings?.sessionTimeoutMinutes
      ? { keystrokeTimeoutSeconds: settings.sessionTimeoutMinutes * 60 }
      : undefined;

    // Parallel queries for all insights data
    const [heartbeats, sessions, languageStats, projectStats, dailyStats] =
      await Promise.all([
        // All heartbeats for metrics calculation
        db
          .select({
            timestamp: heartbeat.timestamp,
            isWrite: heartbeat.isWrite,
          })
          .from(heartbeat)
          .where(
            and(
              eq(heartbeat.userId, userId),
              gte(heartbeat.timestamp, start),
              lt(heartbeat.timestamp, end),
            ),
          )
          .orderBy(heartbeat.timestamp),

        // Completed sessions for session-based stats
        db
          .select({
            id: codingSession.id,
            startedAt: codingSession.startedAt,
            endedAt: codingSession.endedAt,
            mainLanguage: codingSession.mainLanguage,
            mainProject: codingSession.mainProject,
            linesAdded: codingSession.linesAdded,
            linesDeleted: codingSession.linesDeleted,
          })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lt(codingSession.startedAt, end),
            ),
          )
          .orderBy(desc(codingSession.startedAt)),

        // Language breakdown from sessions (using session duration as proxy)
        db
          .select({
            language: codingSession.mainLanguage,
            sessionCount: count(),
          })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lt(codingSession.startedAt, end),
            ),
          )
          .groupBy(codingSession.mainLanguage)
          .orderBy(desc(count()))
          .limit(10),

        // Project breakdown from sessions
        db
          .select({
            project: codingSession.mainProject,
            sessionCount: count(),
          })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lt(codingSession.startedAt, end),
            ),
          )
          .groupBy(codingSession.mainProject)
          .orderBy(desc(count()))
          .limit(10),

        // Daily activity
        db
          .select({
            date: sql<string>`DATE(${codingSession.startedAt})`,
            sessionCount: count(),
          })
          .from(codingSession)
          .where(
            and(
              eq(codingSession.userId, userId),
              eq(codingSession.status, "completed"),
              gte(codingSession.startedAt, start),
              lt(codingSession.startedAt, end),
            ),
          )
          .groupBy(sql`DATE(${codingSession.startedAt})`)
          .orderBy(sql`DATE(${codingSession.startedAt})`),
      ]);

    // Calculate core metrics from heartbeats (most accurate for coding time)
    const metrics = calculateAllMetrics(heartbeats, timeoutOptions);
    const totalMinutes = Math.round(metrics.codingTimeSeconds / 60);

    // Calculate days in period for daily average
    const daysInPeriod = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const avgDailyMinutes = Math.round(totalMinutes / daysInPeriod);

    // Calculate time per language from sessions
    const languageTimeMap = new Map<string, number>();
    for (const session of sessions) {
      if (session.mainLanguage) {
        const durationMinutes = Math.round(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
        );
        languageTimeMap.set(
          session.mainLanguage,
          (languageTimeMap.get(session.mainLanguage) ?? 0) + durationMinutes,
        );
      }
    }

    // Calculate time per project from sessions
    const projectTimeMap = new Map<string, number>();
    for (const session of sessions) {
      if (session.mainProject) {
        const durationMinutes = Math.round(
          (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
        );
        projectTimeMap.set(
          session.mainProject,
          (projectTimeMap.get(session.mainProject) ?? 0) + durationMinutes,
        );
      }
    }

    // Find top language
    let topLanguage: {
      name: string;
      minutes: number;
      percentage: number;
    } | null = null;
    let maxLangMinutes = 0;
    for (const [lang, minutes] of languageTimeMap) {
      if (minutes > maxLangMinutes) {
        maxLangMinutes = minutes;
        topLanguage = {
          name: lang,
          minutes,
          percentage:
            totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        };
      }
    }

    // Find top project
    let topProject: { name: string; minutes: number } | null = null;
    let maxProjMinutes = 0;
    for (const [proj, minutes] of projectTimeMap) {
      if (minutes > maxProjMinutes) {
        maxProjMinutes = minutes;
        topProject = { name: proj, minutes };
      }
    }

    // Find longest session
    let longestSession: { minutes: number; date: string } | null = null;
    for (const session of sessions) {
      const durationMinutes = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
      );
      if (!longestSession || durationMinutes > longestSession.minutes) {
        const dateStr = session.startedAt.toISOString().split("T")[0];
        longestSession = {
          minutes: durationMinutes,
          date: dateStr ?? "",
        };
      }
    }

    // Calculate most active day of week
    const dayOfWeekCounts: Record<string, { total: number; count: number }> =
      {};
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    for (const session of sessions) {
      const dayName = dayNames[session.startedAt.getDay()] ?? "Unknown";
      const durationMinutes = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
      );
      dayOfWeekCounts[dayName] ??= { total: 0, count: 0 };
      dayOfWeekCounts[dayName].total += durationMinutes;
      dayOfWeekCounts[dayName].count += 1;
    }

    let mostActiveDay: { dayOfWeek: string; avgMinutes: number } | null = null;
    let maxAvg = 0;
    for (const [dayName, data] of Object.entries(dayOfWeekCounts)) {
      const avg = data.count > 0 ? data.total / data.count : 0;
      if (avg > maxAvg) {
        maxAvg = avg;
        mostActiveDay = { dayOfWeek: dayName, avgMinutes: Math.round(avg) };
      }
    }

    // Build language breakdown with percentages
    const languageBreakdown = languageStats
      .filter((l): l is typeof l & { language: string } => l.language !== null)
      .map((l) => {
        const minutes = languageTimeMap.get(l.language) ?? 0;
        return {
          name: l.language,
          minutes,
          percentage:
            totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);

    // Build project breakdown with percentages
    const projectBreakdown = projectStats
      .filter((p): p is typeof p & { project: string } => p.project !== null)
      .map((p) => {
        const minutes = projectTimeMap.get(p.project) ?? 0;
        return {
          name: p.project,
          minutes,
          percentage:
            totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);

    // Build daily activity array (calculate from sessions)
    const dailyMinutesMap = new Map<string, number>();
    for (const session of sessions) {
      const dateStr = session.startedAt.toISOString().split("T")[0];
      const date = dateStr ?? "";
      const durationMinutes = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
      );
      dailyMinutesMap.set(
        date,
        (dailyMinutesMap.get(date) ?? 0) + durationMinutes,
      );
    }

    const dailyActivity = dailyStats.map((d) => ({
      date: d.date,
      minutes: dailyMinutesMap.get(d.date) ?? 0,
    }));

    return c.json({
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },

      // Core metrics
      totalMinutes,
      avgDailyMinutes,
      flowCount: metrics.flows,
      sessionCount: sessions.length,

      // Highlights
      topLanguage,
      topProject,
      longestSession,
      mostActiveDay,

      // Breakdowns
      languageBreakdown,
      projectBreakdown,
      dailyActivity,
    });
  });

export default app;
