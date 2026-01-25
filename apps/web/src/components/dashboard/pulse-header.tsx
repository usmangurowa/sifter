"use client";

import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@turbo/ui/skeleton";

/**
 * Pulse header skeleton for loading state
 */
export const PulseHeaderSkeleton = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-8 w-72 rounded" />
    <Skeleton className="h-5 w-96 rounded" />
  </div>
);

/**
 * Fetch pulse state from the API
 */
const fetchPulse = async () => {
  const res = await api.sessions.pulse.$get();
  if (!res.ok) {
    throw new Error(`Failed to fetch pulse: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

/**
 * PulseHeader - Dynamic AI-generated header that shows personalized messages
 *
 * Displays contextual headline and subtext based on recent activity.
 * Messages are AI-generated and cached on the server based on the user's
 * pulseRefreshMinutes setting (default 15 minutes).
 */
export const PulseHeader = () => {
  const { data: sessionData } = useSession();

  const {
    data: pulse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pulse"],
    queryFn: fetchPulse,
    enabled: !!sessionData?.user,
    // Refresh every 15 minutes to align with server cache TTL (pulseRefreshMinutes default).
    // Server caches content, so refetching more frequently wastes round-trips.
    refetchInterval: 15 * 60 * 1000,
    // Don't refetch on window focus to avoid jarring updates
    refetchOnWindowFocus: false,
    // Retry once on failure
    retry: 1,
  });

  if (isLoading || !pulse) {
    return <PulseHeaderSkeleton />;
  }

  // Fallback for errors
  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Ready to code?</h2>
        <p className="text-muted-foreground">
          Your coding journey continues. Let&apos;s build something great.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1" data-tour="pulse-header">
      {/* Headline */}
      <h2 className="text-2xl font-bold tracking-tight">{pulse.headline}</h2>

      {/* Subtext */}
      <p className="text-muted-foreground">{pulse.subtext}</p>
    </div>
  );
};
