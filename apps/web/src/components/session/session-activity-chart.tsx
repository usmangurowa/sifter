"use client";

import { Area, AreaChart, XAxis, YAxis } from "recharts";

import type { ChartConfig } from "@turbo/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@turbo/ui/chart";

interface SessionActivityChartProps {
  activity: number[];
  startedAt: Date;
  endedAt: Date;
}

const chartConfig = {
  activity: {
    label: "Activity",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export const SessionActivityChart = ({
  activity,
  startedAt,
  endedAt,
}: SessionActivityChartProps) => {
  const duration = endedAt.getTime() - startedAt.getTime();
  const bucketDuration = duration / activity.length;

  // Transform activity data for the chart
  const chartData = activity.map((count, index) => {
    const time = new Date(startedAt.getTime() + index * bucketDuration);
    return {
      time: time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      activity: count,
    };
  });

  const maxActivity = Math.max(...activity, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Timeline</CardTitle>
        <CardDescription>
          Coding intensity throughout the session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              tickFormatter={(value: string) => value}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={30}
              domain={[0, maxActivity]}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={{
                stroke: "var(--color-muted-foreground)",
                strokeOpacity: 0.3,
              }}
            />
            <Area
              type="monotone"
              dataKey="activity"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#activityGradient)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
