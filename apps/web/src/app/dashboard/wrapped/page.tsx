"use client";

import { useState } from "react";
import { WrappedCarousel } from "@/components/wrapped/wrapped-carousel";
import { env } from "@/env";

import { Kbd } from "@turbo/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbo/ui/select";

type Period = "week" | "month" | "all-time";

const is_prod = env.NODE_ENV === "production";

/**
 * Developer Wrapped page - Spotify Wrapped style experience for coding stats
 */
export default function WrappedPage() {
  const [period, setPeriod] = useState<Period>("week");

  if (is_prod) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1>Coming Soon</h1>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Period selector - fixed at top */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="bg-background/80 w-40 backdrop-blur">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Keyboard hint - fixed at bottom */}
      <div className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2">
        <div className="bg-muted/80 text-muted-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm backdrop-blur">
          <span>Use</span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>to navigate</span>
        </div>
      </div>

      {/* Main carousel */}
      <WrappedCarousel period={period} />
    </div>
  );
}
