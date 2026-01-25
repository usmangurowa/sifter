"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@turbo/ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@turbo/ui/carousel";
import { NumberTicker } from "@turbo/ui/number-ticker";

import { WrappedSlide } from "./wrapped-slide";

interface InsightsData {
  period: string;
  dateRange: { start: string; end: string };
  totalMinutes: number;
  avgDailyMinutes: number;
  flowCount: number;
  sessionCount: number;
  topLanguage: { name: string; minutes: number; percentage: number } | null;
  topProject: { name: string; minutes: number } | null;
  longestSession: { minutes: number; date: string } | null;
  mostActiveDay: { dayOfWeek: string; avgMinutes: number } | null;
  languageBreakdown: { name: string; minutes: number; percentage: number }[];
  projectBreakdown: { name: string; minutes: number; percentage: number }[];
  dailyActivity: { date: string; minutes: number }[];
}

interface WrappedCarouselProps {
  /** Period to fetch insights for */
  period: "week" | "month" | "all-time";
  /** Optional CSS class */
  className?: string;
}

/**
 * Keyboard navigation hook for vertical carousel
 */
const KeyboardNavigator = () => {
  const { scrollPrev, scrollNext } = useCarousel();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollPrev, scrollNext]);

  return null;
};

/**
 * Format minutes to hours and minutes display
 */
const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * WrappedCarousel - Main wrapped experience with vertical slides
 */
export const WrappedCarousel = ({
  period,
  className,
}: WrappedCarouselProps) => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", period],
    queryFn: async () => {
      const res = await fetch(`/api/insights/${period}`);
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json() as Promise<InsightsData>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Loading your wrapped...
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">
          No data available for this period.
        </div>
      </div>
    );
  }

  const periodLabel =
    period === "week"
      ? "This week"
      : period === "month"
        ? "This month"
        : "All time";

  return (
    <Carousel
      orientation="vertical"
      opts={{
        align: "start",
        containScroll: "trimSnaps",
        dragFree: false,
      }}
      className={cn("h-screen w-full", className)}
    >
      <KeyboardNavigator />
      <CarouselContent className="-mt-1 h-screen">
        {/* Slide 1: Total Time */}
        <CarouselItem className="h-screen pt-1">
          <WrappedSlide
            title={`${periodLabel} you coded for...`}
            gradient="from-primary-900/20 to-background"
          >
            <div className="text-center">
              <div className="text-7xl font-bold tracking-tighter md:text-9xl">
                <NumberTicker value={insights.totalMinutes} duration={2000} />
              </div>
              <div className="text-muted-foreground mt-2 text-2xl">
                minutes ({formatTime(insights.totalMinutes)})
              </div>
            </div>
          </WrappedSlide>
        </CarouselItem>

        {/* Slide 2: Top Language */}
        {insights.topLanguage && (
          <CarouselItem className="h-screen pt-1">
            <WrappedSlide
              title="Your favorite language was..."
              gradient="from-chart-1/20 to-background"
            >
              <div className="text-center">
                <div className="text-6xl font-bold md:text-8xl">
                  {insights.topLanguage.name}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="bg-muted h-3 w-48 overflow-hidden rounded-full">
                    <div
                      className="bg-chart-1 h-full transition-all duration-1000"
                      style={{ width: `${insights.topLanguage.percentage}%` }}
                    />
                  </div>
                  <span className="text-lg font-medium">
                    {insights.topLanguage.percentage}%
                  </span>
                </div>
              </div>
            </WrappedSlide>
          </CarouselItem>
        )}

        {/* Slide 3: Flow States */}
        <CarouselItem className="h-screen pt-1">
          <WrappedSlide
            title={`You hit flow state ${insights.flowCount} times...`}
            gradient="from-chart-2/20 to-background"
          >
            <div className="text-center">
              <div className="text-8xl md:text-[10rem]">🔥</div>
              <div className="text-muted-foreground mt-4 text-xl">
                {insights.flowCount > 10
                  ? "You're on fire!"
                  : insights.flowCount > 5
                    ? "Nice focus!"
                    : "Keep building momentum!"}
              </div>
            </div>
          </WrappedSlide>
        </CarouselItem>

        {/* Slide 4: Most Active Day */}
        {insights.mostActiveDay && (
          <CarouselItem className="h-screen pt-1">
            <WrappedSlide
              title="You were most productive on..."
              gradient="from-chart-3/20 to-background"
            >
              <div className="text-center">
                <div className="text-6xl font-bold md:text-8xl">
                  {insights.mostActiveDay.dayOfWeek}
                </div>
                <div className="text-muted-foreground mt-4 text-xl">
                  averaging {formatTime(insights.mostActiveDay.avgMinutes)} per
                  session
                </div>
              </div>
            </WrappedSlide>
          </CarouselItem>
        )}

        {/* Slide 5: Projects */}
        {insights.projectBreakdown.length > 0 && (
          <CarouselItem className="h-screen pt-1">
            <WrappedSlide
              title={`You worked on ${insights.projectBreakdown.length} project${insights.projectBreakdown.length > 1 ? "s" : ""}...`}
              gradient="from-chart-4/20 to-background"
            >
              <div className="flex w-full max-w-md flex-col gap-3">
                {insights.projectBreakdown.slice(0, 5).map((project, i) => (
                  <div key={project.name} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-right">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-muted-foreground">
                          {formatTime(project.minutes)}
                        </span>
                      </div>
                      <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-chart-4 h-full transition-all duration-1000"
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </WrappedSlide>
          </CarouselItem>
        )}

        {/* Slide 6: Summary */}
        <CarouselItem className="h-screen pt-1">
          <WrappedSlide
            title={`Your ${period === "week" ? "week" : period === "month" ? "month" : "journey"} in review`}
            gradient="from-primary-500/20 to-background"
          >
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold md:text-5xl">
                  {formatTime(insights.totalMinutes)}
                </div>
                <div className="text-muted-foreground text-sm">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold md:text-5xl">
                  {insights.sessionCount}
                </div>
                <div className="text-muted-foreground text-sm">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold md:text-5xl">
                  {insights.flowCount}
                </div>
                <div className="text-muted-foreground text-sm">Flow States</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold md:text-5xl">
                  {formatTime(insights.avgDailyMinutes)}
                </div>
                <div className="text-muted-foreground text-sm">Daily Avg</div>
              </div>
            </div>
          </WrappedSlide>
        </CarouselItem>
      </CarouselContent>

      {/* Navigation arrows */}
      <div className="fixed top-1/2 right-8 flex -translate-y-1/2 flex-col gap-2">
        <CarouselPrevious className="relative top-0 left-0 translate-x-0 translate-y-0 rotate-90" />
        <CarouselNext className="relative top-0 left-0 translate-x-0 translate-y-0 rotate-90" />
      </div>
    </Carousel>
  );
};

export default WrappedCarousel;
