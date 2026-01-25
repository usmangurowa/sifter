"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

import type { CodingSession } from "@turbo/db/schema";

/** API response type - dates are serialized as strings */
export type ApiCodingSession = Omit<
  CodingSession,
  "startedAt" | "endedAt" | "createdAt"
> & {
  startedAt: string;
  endedAt: string;
  createdAt: string;
  activity: number[];
};

interface SessionFilters {
  project?: string[];
  branch?: string[];
  action?: string[];
}

interface UseGetSessionsOptionsBase {
  /** Enable/disable the query */
  enabled?: boolean;
}

interface UseGetSessionsHistoryOptions extends UseGetSessionsOptionsBase {
  /** Fetch completed session history */
  mode: "history";
  /** Start date (ISO string) */
  startDate: string;
  /** End date (ISO string) */
  endDate: string;
  /** Optional filters */
  filters?: SessionFilters;
}

interface UseGetSessionsActiveOptions extends UseGetSessionsOptionsBase {
  /** Fetch only the current active session */
  mode: "active";
  /** Refresh interval in milliseconds (default: 30000) */
  refetchInterval?: number;
}

export type UseGetSessionsOptions =
  | UseGetSessionsHistoryOptions
  | UseGetSessionsActiveOptions;

/** Fetch session history with filters */
const fetchSessionHistory = async (
  startDate: string,
  endDate: string,
  filters?: SessionFilters,
) => {
  const res = await api.sessions.$get({
    query: {
      startDate,
      endDate,
      project: filters?.project?.join(",") ?? "",
      branch: filters?.branch?.join(",") ?? "",
      action: filters?.action?.join(",") ?? "",
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return res.json();
};

/** Fetch current active session */
const fetchActiveSession = async () => {
  const res = await api.sessions.current.$get();
  if (!res.ok) {
    throw new Error("Failed to fetch current session");
  }
  return res.json();
};

/**
 * Hook for fetching coding sessions.
 * Supports two modes:
 * - "history": Fetch completed sessions with filters and date range
 * - "active": Fetch only the current active session with auto-refresh
 *
 * @example History mode
 * ```tsx
 * const { sessions, isLoading } = useGetSessions({
 *   mode: "history",
 *   startDate: startDate.toISOString(),
 *   endDate: endDate.toISOString(),
 *   filters: { project: ["my-project"] },
 * });
 * ```
 *
 * @example Active session mode
 * ```tsx
 * const { currentSession, isLoading } = useGetSessions({
 *   mode: "active",
 *   refetchInterval: 30_000,
 * });
 * ```
 */
export const useGetSessions = (options: UseGetSessionsOptions) => {
  const isHistoryMode = options.mode === "history";

  // History mode query
  const historyQuery = useQuery({
    queryKey: isHistoryMode
      ? ["sessions", options.startDate, options.endDate, options.filters]
      : ["sessions-disabled"],
    queryFn: () =>
      isHistoryMode
        ? fetchSessionHistory(
            options.startDate,
            options.endDate,
            options.filters,
          )
        : Promise.resolve({ sessions: [] }),
    enabled: isHistoryMode && (options.enabled ?? true),
  });

  // Active session mode query
  const activeQuery = useQuery({
    queryKey: !isHistoryMode
      ? ["current-session"]
      : ["current-session-disabled"],
    queryFn: fetchActiveSession,
    enabled: !isHistoryMode && (options.enabled ?? true),
    refetchInterval: !isHistoryMode
      ? (options.refetchInterval ?? 30_000)
      : false,
  });

  if (isHistoryMode) {
    return {
      sessions: (historyQuery.data?.sessions ?? []) as ApiCodingSession[],
      currentSession: null,
      isLoading: historyQuery.isLoading,
      isError: historyQuery.isError,
      error: historyQuery.error,
      refetch: historyQuery.refetch,
    };
  }

  return {
    sessions: [] as ApiCodingSession[],
    currentSession: activeQuery.data?.session ?? null,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
  };
};
