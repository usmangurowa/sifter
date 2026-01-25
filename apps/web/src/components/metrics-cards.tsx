"use client";

import {
  ActivityIcon,
  Clock01Icon,
  FlashIcon,
  HeartCheckIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { intervalToDuration } from "date-fns";

import { Skeleton } from "@turbo/ui/skeleton";

interface MetricsData {
  heartbeats: number;
  sessions: number;
  flows: number;
  codingTimeMinutes: number;
}

interface MetricsCardsProps {
  data?: MetricsData;
  isLoading?: boolean;
}

interface MetricCardProps {
  icon: typeof ActivityIcon;
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

interface TimeUnit {
  value: number | string;
  unit: string;
}

interface FormattedTime {
  hours: TimeUnit | null;
  mins: TimeUnit | null;
}

/**
 * Format minutes into a human-readable time object with hours and mins
 * @example
 * formatTime(65) // { hours: { value: 1, unit: "hr" }, mins: { value: 5, unit: "mins" } }
 * formatTime(45) // { hours: null, mins: { value: 45, unit: "mins" } }
 */
const formatTime = (minutes: number): FormattedTime => {
  if (minutes === 0) return { hours: null, mins: { value: 0, unit: "m" } };
  if (minutes < 1) return { hours: null, mins: { value: "<1", unit: "m" } };

  const duration = intervalToDuration({ start: 0, end: minutes * 60 * 1000 });
  const hours = duration.hours ?? 0;
  const mins = duration.minutes ?? 0;

  return {
    hours:
      hours > 0 ? { value: hours, unit: hours === 1 ? "hr" : "hrs" } : null,
    mins: mins > 0 ? { value: mins, unit: mins === 1 ? "min" : "mins" } : null,
  };
};

const MetricCard = ({ icon, label, value, isLoading }: MetricCardProps) => (
  <div className="bg-card ring-foreground/10 flex flex-col items-center gap-2 rounded-2xl p-6 text-center ring-1">
    <HugeiconsIcon
      icon={icon}
      className="text-muted-foreground size-5"
      strokeWidth={1.5}
    />
    {isLoading ? (
      <Skeleton className="h-9 w-16" />
    ) : (
      <div className="text-xl font-bold text-nowrap tabular-nums">{value}</div>
    )}
    <div className="text-muted-foreground text-sm">{label}</div>
  </div>
);

/**
 * Grid of metric cards showing coding time, sessions, heartbeats, and flow count
 */
export const MetricsCards = ({ data, isLoading }: MetricsCardsProps) => {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-4">
      <MetricCard
        icon={Clock01Icon}
        label="Coding Time"
        value={(() => {
          const time = formatTime(data?.codingTimeMinutes ?? 0);
          return (
            <>
              {time.hours && (
                <>
                  {time.hours.value}
                  <span className="text-sm font-medium">
                    {time.hours.unit}
                  </span>{" "}
                </>
              )}
              {time.mins && (
                <>
                  {time.mins.value}
                  <span className="text-sm font-medium">{time.mins.unit}</span>
                </>
              )}
            </>
          );
        })()}
        isLoading={isLoading}
      />
      <MetricCard
        icon={ActivityIcon}
        label="Sessions"
        value={data?.sessions.toLocaleString() ?? 0}
        isLoading={isLoading}
      />
      <MetricCard
        icon={HeartCheckIcon}
        label="Heartbeats"
        value={data?.heartbeats.toLocaleString() ?? 0}
        isLoading={isLoading}
      />
      <MetricCard
        icon={FlashIcon}
        label="Flow States"
        value={data?.flows.toLocaleString() ?? 0}
        isLoading={isLoading}
      />
    </div>
  );
};
