import { Suspense } from "react";
import { SessionFilters } from "@/components/dashboard/session-filters";
import { SessionsTable } from "@/components/dashboard/sessions-table";

export default function SessionsPage() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            View and analyze your coding sessions. Track your progress, review
            activity patterns, and dive into detailed session metrics.
          </p>
        </div>
        <Suspense fallback={null}>
          <SessionFilters />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <SessionsTable />
      </Suspense>
    </div>
  );
}
