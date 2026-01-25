"use client";

import type { DateRangePreset } from "@/hooks/use-date-range";
import { dateRanges, useDateRange } from "@/hooks/use-date-range";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbo/ui/select";

const DateRange = () => {
  const { setDateRange, preset } = useDateRange();
  return (
    <Select
      value={preset}
      onValueChange={(v) => setDateRange(v as DateRangePreset)}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        {dateRanges.map((range) => (
          <SelectItem key={range.preset} value={range.preset}>
            {range.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { DateRange };
