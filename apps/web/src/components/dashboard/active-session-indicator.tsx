"use client";

import { useGetSessions } from "@/hooks/use-get-sessions";

import { formatRelativeTime } from "@turbo/shared";
import { Card, CardDescription, CardHeader, CardTitle } from "@turbo/ui/card";

export const ActiveSessionIndicator = () => {
  const { currentSession, isLoading } = useGetSessions({
    mode: "active",
    refetchInterval: 30_000,
  });

  if (isLoading || !currentSession) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 mb-4 border-dashed">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="relative flex size-3">
          <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-primary relative inline-flex size-3 rounded-full" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">Active Session</CardTitle>
          <CardDescription className="text-xs">
            {currentSession.mainProject ?? "Coding"} •{" "}
            {formatRelativeTime(new Date(currentSession.startedAt))}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};
