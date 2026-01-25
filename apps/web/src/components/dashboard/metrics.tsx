"use client";

import { useDateRange } from "@/hooks/use-date-range";
import { api } from "@/lib/api";
import {
  Clock01Icon,
  DashboardCircleIcon,
  FlashIcon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { formatCodingTime } from "@turbo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@turbo/ui/card";
import { ScrollArea } from "@turbo/ui/scroll-area";
import { Skeleton } from "@turbo/ui/skeleton";

import { DailyInsights } from "./daily-insights";
import { FlowGauge } from "./flow-gauge";

interface MetricsData {
  heartbeats: number;
  sessions: number;
  flows: number;
  codingTimeMinutes: number;
  codingTimeSeconds: number;
  flowTimeSeconds: number;
  flowEfficiency: number;
  dateRange: {
    start: string;
    end: string;
  };
}

const fetchMetrics = async (
  startDate: string,
  endDate: string,
): Promise<MetricsData> => {
  const res = await api.metrics.$get({
    query: {
      startDate,
      endDate,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch metrics");
  }
  return res.json();
};

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  dataTour,
}: {
  title: string;
  value: string | number;
  icon: typeof Clock01Icon;
  description?: string;
  dataTour?: string;
}) => (
  <Card data-tour={dataTour}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <HugeiconsIcon
        icon={Icon}
        className="text-muted-foreground size-4"
        strokeWidth={2}
      />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </CardContent>
  </Card>
);

const MetricsSkeleton = () => (
  <div className="order-1 space-y-5 overflow-y-auto p-1 md:order-2 xl:col-span-2">
    <h3>Metrics</h3>
    <Skeleton className="mx-auto h-[23%] w-full" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  </div>
);

export const Metrics = () => {
  const { startDate, endDate } = useDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => fetchMetrics(startDate.toISOString(), endDate.toISOString()),
    refetchInterval: 60 * 1000,
  });

  if (isLoading) {
    return <MetricsSkeleton />;
  }

  return (
    <div
      className="order-1 flex min-h-0 flex-col md:order-2 xl:col-span-2"
      data-tour="metrics"
    >
      <h3 className="shrink-0 pb-5">Today's Snapshot</h3>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-1">
          {/* Flow Efficiency Gauge */}
          <Card className="py-4" data-tour="flow-gauge">
            <CardContent className="flex flex-col items-center">
              <FlowGauge value={data?.flowEfficiency ?? 0} />
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Time in deep focus (20+ min blocks)
              </p>
            </CardContent>
          </Card>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Coding Time"
              value={formatCodingTime(data?.codingTimeSeconds ?? 0)}
              icon={Clock01Icon}
              description="Active coding"
              dataTour="metric-coding-time"
            />
            <MetricCard
              title="Sessions"
              value={data?.sessions ?? 0}
              icon={Rocket01Icon}
              description="Work sessions"
              dataTour="metric-sessions"
            />
            <MetricCard
              title="Flow States"
              value={data?.flows ?? 0}
              icon={FlashIcon}
              description="Deep focus periods"
              dataTour="metric-flow-states"
            />
            <MetricCard
              title="Heartbeats"
              value={data?.heartbeats ?? 0}
              icon={DashboardCircleIcon}
              description="Activity signals"
              dataTour="metric-heartbeats"
            />
          </div>

          {/* AI Daily Insights */}
          <DailyInsights />
        </div>
      </ScrollArea>
    </div>
  );
};
