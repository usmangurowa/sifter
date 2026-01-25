"use client";

import { useState } from "react";
import { useDateRange } from "@/hooks/use-date-range";
import { api } from "@/lib/api";
import {
  AiInnovation01Icon,
  ArrowDown01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { formatRelativeTime } from "@turbo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@turbo/ui/card";
import { Skeleton } from "@turbo/ui/skeleton";

interface DailyInsightsData {
  insights: {
    headline: string;
    summary: string;
    highlights: string[];
    recommendation?: string;
  };
  metrics: {
    heartbeats: number;
    codingTimeSeconds: number;
    sessions: number;
    flows: number;
    flowEfficiency: number;
  };
  generatedAt: string;
  cached: boolean;
}

const fetchDailyInsights = async (
  startDate: string,
  endDate: string,
): Promise<DailyInsightsData> => {
  const res = await api.metrics.insights.$get({
    query: {
      startDate,
      endDate,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch daily insights");
  }
  return res.json();
};

export const DailyInsights = () => {
  const { startDate, endDate } = useDateRange();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "daily-insights",
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: () =>
      fetchDailyInsights(startDate.toISOString(), endDate.toISOString()),
    refetchInterval: 5 * 60 * 60 * 1000, // 5 hours (matches cache TTL)
    staleTime: 5 * 60 * 60 * 1000, // Consider data fresh for 5 hours
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
          <Skeleton className="size-4 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error ?? !data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
          <HugeiconsIcon
            icon={AiInnovation01Icon}
            className="text-muted-foreground size-4"
            strokeWidth={2}
          />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Insights unavailable right now
          </p>
        </CardContent>
      </Card>
    );
  }

  const { insights } = data;

  return (
    <Card data-tour="daily-insights space-y-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <HugeiconsIcon
            icon={SparklesIcon}
            className="text-primary size-4"
            strokeWidth={2}
          />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Headline with chevron toggle */}
        <div
          className="flex cursor-pointer items-start gap-2 transition-colors hover:opacity-80"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4 className="flex-1 text-base leading-tight font-semibold">
            {insights.headline}
          </h4>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={`text-muted-foreground size-4 shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        </div>

        {/* Generation timestamp and cache indicator */}
        <p className="text-muted-foreground -mt-2 flex items-center gap-1.5 text-xs">
          Generated {formatRelativeTime(new Date(data.generatedAt))}
          {data.cached && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
              Cached
            </span>
          )}
        </p>

        {/* Summary - show 2 lines when collapsed, full when expanded */}
        <p
          className={`text-muted-foreground text-sm leading-relaxed ${
            !isExpanded ? "line-clamp-2" : ""
          }`}
        >
          {insights.summary}
        </p>

        {/* Expandable content - only show when expanded */}
        {isExpanded && (
          <>
            {/* Highlights */}
            {insights.highlights.length > 0 && (
              <ul className="space-y-1.5">
                {insights.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="text-foreground/80 flex items-start text-xs"
                  >
                    <span className="text-primary mt-0.5 mr-2 shrink-0">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Recommendation (if present) */}
            {insights.recommendation && (
              <div className="bg-primary/10 border-primary/20 rounded-lg border p-3">
                <p className="text-primary text-xs font-medium">
                  💡 {insights.recommendation}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
