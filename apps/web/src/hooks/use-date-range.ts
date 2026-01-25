"use client";

import { useCallback } from "react";
import {
  endOfDay,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { parseAsIsoDateTime, parseAsString, useQueryStates } from "nuqs";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last-week"
  | "last-month"
  | "last-six-months"
  | "last-year"
  | "custom";

interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

export const dateRanges = [
  {
    title: "Today",
    preset: "today",
  },
  {
    title: "Yesterday",
    preset: "yesterday",
  },
  {
    title: "Last Week",
    preset: "last-week",
  },
  {
    title: "Last Month",
    preset: "last-month",
  },
  {
    title: "Last 6 Months",
    preset: "last-six-months",
  },
  {
    title: "Last Year",
    preset: "last-year",
  },
  {
    title: "Custom",
    preset: "custom",
  },
];

/**
 * Calculate the start and end dates for a given preset
 */
const getPresetDates = (preset: Exclude<DateRangePreset, "custom">) => {
  const today = new Date();

  switch (preset) {
    case "today":
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(today),
        preset: "today",
      };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
        preset: "yesterday",
      };
    }
    case "last-week":
      return {
        startDate: startOfDay(subWeeks(today, 1)),
        endDate: endOfDay(today),
        preset: "last-week",
      };
    case "last-month":
      return {
        startDate: startOfDay(subMonths(today, 1)),
        endDate: endOfDay(today),
        preset: "last-month",
      };
    case "last-six-months":
      return {
        startDate: startOfDay(subMonths(today, 6)),
        endDate: endOfDay(today),
        preset: "last-six-months",
      };
    case "last-year":
      return {
        startDate: startOfDay(subYears(today, 1)),
        endDate: endOfDay(today),
        preset: "last-year",
      };
  }
};

/**
 * Hook for managing date range state via URL search params
 * @example
 * ```tsx
 * const { startDate, endDate, setDateRange } = useDateRange();
 *
 * // Set to a preset
 * setDateRange("last-week");
 *
 * // Set to a custom range
 * setDateRange("custom", { startDate: new Date(), endDate: new Date() });
 * ```
 */
export const useDateRange = () => {
  const [{ startDate, endDate, preset }, setQueryStates] = useQueryStates({
    startDate: parseAsIsoDateTime,
    endDate: parseAsIsoDateTime,
    preset: parseAsString.withDefault("today"),
  });

  // Derived state: calculate defaults on every render to ensure local timezone logic is used on client
  // This avoids SSR hydration mismatch (UTC vs Local) that happens with static defaults
  const defaults = getPresetDates("today");
  const effectiveStartDate = startDate ?? defaults.startDate;
  const effectiveEndDate = endDate ?? defaults.endDate;

  const setDateRange = useCallback(
    (preset: DateRangePreset, custom?: CustomDateRange) => {
      if (preset === "custom") {
        if (!custom) {
          throw new Error(
            "Custom date range requires startDate and endDate to be provided",
          );
        }
        return setQueryStates({
          startDate: custom.startDate,
          endDate: custom.endDate,
          preset: "custom",
        });
      }

      const dates = getPresetDates(preset);
      return setQueryStates(dates);
    },
    [setQueryStates],
  );

  return {
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    preset,
    setDateRange,
  };
};
