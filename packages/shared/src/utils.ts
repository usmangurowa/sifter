/**
 * General utility functions used across apps and packages.
 */

import { formatDuration, intervalToDuration } from "date-fns";

/**
 * Get the most frequent item from an array.
 * Returns undefined if the array is empty.
 *
 * @example
 * ```ts
 * getMostFrequent(["a", "b", "a", "c", "a"]); // "a"
 * getMostFrequent([]); // undefined
 * ```
 */
export const getMostFrequent = <T>(arr: T[]): T | undefined => {
  if (arr.length === 0) return undefined;

  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  let maxCount = 0;
  let mostFrequent: T | undefined;
  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  }

  return mostFrequent;
};

/**
 * Input type for line change calculation.
 */
export interface HeartbeatLineChanges {
  aiLineChanges?: number | null;
  humanLineChanges?: number | null;
}

/**
 * Output type for line change calculation.
 */
export interface LineChangeStats {
  linesAdded: number;
  linesDeleted: number;
}

/**
 * Calculate total lines added and deleted from heartbeat line changes.
 * Positive values = lines added, negative values = lines deleted.
 *
 * @example
 * ```ts
 * calculateLineChanges([
 *   { aiLineChanges: 10, humanLineChanges: 5 },  // +15
 *   { aiLineChanges: -5, humanLineChanges: 0 },  // -5
 * ]);
 * // { linesAdded: 15, linesDeleted: 5 }
 * ```
 */
export const calculateLineChanges = (
  heartbeats: HeartbeatLineChanges[],
): LineChangeStats => {
  let linesAdded = 0;
  let linesDeleted = 0;

  for (const hb of heartbeats) {
    const aiChanges = hb.aiLineChanges ?? 0;
    const humanChanges = hb.humanLineChanges ?? 0;
    const totalChanges = aiChanges + humanChanges;

    if (totalChanges > 0) {
      linesAdded += totalChanges;
    } else {
      linesDeleted += Math.abs(totalChanges);
    }
  }

  return { linesAdded, linesDeleted };
};

/**
 * Format seconds as a human-readable duration string.
 * Uses date-fns for proper pluralization.
 *
 * @example
 * ```ts
 * formatCodingTime(3661); // "1 hr 1 min"
 * formatCodingTime(7200); // "2 hrs"
 * formatCodingTime(45);   // "< 1 min"
 * ```
 */
export const formatCodingTime = (seconds: number): string => {
  // Less than 1 minute
  if (seconds < 60) {
    return "< 1 min";
  }

  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

  return (
    formatDuration(duration, {
      format: ["hours", "minutes"],
      locale: {
        formatDistance: (token, count) => {
          switch (token) {
            case "xHours":
              return `${count} ${count === 1 ? "hr" : "hrs"}`;
            case "xMinutes":
              return `${count} ${count === 1 ? "min" : "mins"}`;
            default:
              return "";
          }
        },
      },
    }) || "< 1 min"
  );
};

/**
 * Format minutes as a human-readable duration string.
 *
 * @example
 * ```ts
 * formatCodingTimeMinutes(90); // "1 hr 30 mins"
 * formatCodingTimeMinutes(120); // "2 hrs"
 * ```
 */
export const formatCodingTimeMinutes = (minutes: number): string => {
  return formatCodingTime(minutes * 60);
};

/**
 * Format a date as a human-readable relative time string.
 * Returns strings like "Just now", "5 mins ago", "2 hours ago", "3 days ago".
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date()); // "Just now"
 * formatRelativeTime(new Date(Date.now() - 5 * 60000)); // "5 mins ago"
 * formatRelativeTime(new Date(Date.now() - 2 * 3600000)); // "2 hours ago"
 * formatRelativeTime(new Date(Date.now() - 3 * 86400000)); // "3 days ago"
 * ```
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};
