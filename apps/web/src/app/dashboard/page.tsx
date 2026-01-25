"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardTour } from "@/components/dashboard/dashboard-tour";
import { Metrics } from "@/components/dashboard/metrics";
import {
  PulseHeader,
  PulseHeaderSkeleton,
} from "@/components/dashboard/pulse-header";
import { SessionFeed } from "@/components/dashboard/session-feed";
import { StandupButton } from "@/components/dashboard/standup-button";
import { useApiKeys } from "@/hooks/use-api-keys";

import { Skeleton } from "@turbo/ui/skeleton";

/**
 * Dashboard page with empty state detection.
 * Redirects to /dashboard/connect if user needs onboarding.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { keys, isLoading } = useApiKeys();

  // Determine if user needs onboarding
  // User needs onboarding if:
  // 1. They have no API keys, OR
  // 2. They have API keys but no connected editors (no heartbeats received)
  const hasApiKeys = keys.length > 0;
  const hasConnectedEditor = keys.some(
    (key) => key.connectedEditors.length > 0,
  );
  const needsOnboarding = !isLoading && (!hasApiKeys || !hasConnectedEditor);

  // Handle redirect in useEffect to avoid calling router.replace during render
  useEffect(() => {
    if (needsOnboarding) {
      router.replace("/dashboard/connect");
    }
  }, [needsOnboarding, router]);

  // Show loading state or while redirecting
  if (isLoading || needsOnboarding) {
    return (
      <main className="relative container flex min-h-0 flex-1 flex-col gap-8 overflow-hidden pb-5">
        <div className="flex items-center justify-between gap-x-5">
          <PulseHeaderSkeleton />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <Skeleton className="min-h-0 w-full flex-1 rounded-2xl" />
      </main>
    );
  }

  // Regular dashboard
  return (
    <main className="relative container flex min-h-0 flex-1 flex-col gap-8 overflow-hidden pb-5">
      <div className="flex items-center justify-between gap-x-5">
        {/* Smart Pulse Header - Dynamic state-based messaging */}
        <PulseHeader />
        <div className="flex items-center gap-2">
          <DashboardTour />
          <StandupButton />
        </div>
      </div>

      <section className="bg-card/50 grid min-h-0 w-full flex-1 grid-cols-1 gap-5 overflow-hidden rounded-2xl p-6 md:grid-cols-3 xl:grid-cols-5">
        <Suspense fallback={null}>
          <SessionFeed />
        </Suspense>
        <Suspense fallback={null}>
          <Metrics />
        </Suspense>
      </section>
    </main>
  );
}
