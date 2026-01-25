"use client";

import { addDays, formatISO, startOfDay } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbo/ui/select";

export type DateRange = "today" | "yesterday" | "7days" | "30days";

interface DateFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7days": "Last 7 Days",
  "30days": "Last 30 Days",
};

/**
 * Get start and end dates for a given date range as ISO strings with timezone
 * Uses formatISO to embed the local timezone offset in the date string
 */
export const getDateRange = (
  range: DateRange,
): { startDate: string; endDate: string } => {
  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);

  switch (range) {
    case "today":
      return { startDate: formatISO(todayStart), endDate: formatISO(todayEnd) };
    case "yesterday":
      return {
        startDate: formatISO(addDays(todayStart, -1)),
        endDate: formatISO(todayStart),
      };
    case "7days":
      return {
        startDate: formatISO(addDays(todayStart, -7)),
        endDate: formatISO(todayEnd),
      };
    case "30days":
      return {
        startDate: formatISO(addDays(todayStart, -30)),
        endDate: formatISO(todayEnd),
      };
  }
};

/**
 * Date range filter dropdown for dashboard metrics
 */
export const DateFilter = ({ value, onChange }: DateFilterProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateRange)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
          <SelectItem key={range} value={range}>
            {DATE_RANGE_LABELS[range]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
