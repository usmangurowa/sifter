"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import type { ChartConfig } from "@turbo/ui/chart";
import { ChartContainer } from "@turbo/ui/chart";

/**
 * FlowGauge - Semi-circle radial chart showing Flow Efficiency percentage
 *
 * Visual representation of time spent in deep focus (20+ min uninterrupted blocks)
 * vs total coding time. Higher percentage = more productive, focused work.
 */

interface FlowGaugeProps {
  /** Flow efficiency percentage (0-100) */
  value: number;
}

/**
 * Get quality label based on efficiency value
 */
const getQualityLabel = (value: number): string => {
  if (value >= 80) return "Excellent Focus";
  if (value >= 60) return "Good Focus";
  if (value >= 40) return "Moderate Focus";
  if (value >= 20) return "Fragmented";
  return "Highly Fragmented";
};

export const FlowGauge = ({ value }: FlowGaugeProps) => {
  // Clamp value between 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  const remaining = 100 - clampedValue;

  const chartData = [{ flowTime: clampedValue, remaining }];

  const qualityLabel = getQualityLabel(clampedValue);

  const chartConfig = {
    flowTime: {
      label: "Flow Time",
      color: "var(--primary)",
    },
    remaining: {
      label: "Other Time",
      color: "var(--primary-100)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-auto h-[120px] w-full max-w-[280px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={180}
        endAngle={0}
        innerRadius={80}
        outerRadius={130}
        cx="50%"
        cy="80%"
      >
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 12}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {clampedValue}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 12}
                      className="fill-muted-foreground text-sm"
                    >
                      {qualityLabel}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="flowTime"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-flowTime)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="remaining"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-remaining)"
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  );
};
