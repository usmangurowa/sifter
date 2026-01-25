"use client";

import type { ApiCodingSession } from "@/hooks/use-get-sessions";
import Link from "next/link";
import { useDateRange } from "@/hooks/use-date-range";
import { useGetSessions } from "@/hooks/use-get-sessions";
import { useSessionFilters } from "@/hooks/use-session-filters";
import { actionTagConfig } from "@/lib/action-tag-config";
import {
  Add01Icon,
  Clock01Icon,
  FolderOpenIcon,
  GitBranchIcon,
  Remove01Icon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { BadgeProps } from "@turbo/ui/badge";
import { formatCodingTime, formatRelativeTime } from "@turbo/shared";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@turbo/ui/empty";
import { Icon } from "@turbo/ui/icon";
import { ScrollArea } from "@turbo/ui/scroll-area";
import { Separator } from "@turbo/ui/separator";
import { Skeleton } from "@turbo/ui/skeleton";

import { ActiveSessionIndicator } from "./active-session-indicator";
import { SessionFilters } from "./session-filters";
import { Sparkline } from "./sparkline";

export const SessionFeed = () => {
  const { startDate, endDate } = useDateRange();
  const { filters } = useSessionFilters();

  return (
    <div
      className="order-2 flex min-h-0 flex-col overflow-hidden md:order-1 md:col-span-2 xl:col-span-3"
      data-tour="session-feed"
    >
      <div className="mb-5 flex shrink-0 items-center justify-between">
        <h3 className="">Session Feed</h3>
        <SessionFilters />
      </div>
      <SessionList
        startDate={startDate.toISOString()}
        endDate={endDate.toISOString()}
        filters={filters}
      />
    </div>
  );
};

interface SessionListProps {
  startDate: string;
  endDate: string;
  filters: ReturnType<typeof useSessionFilters>["filters"];
}

const SessionList = ({ startDate, endDate, filters }: SessionListProps) => {
  const { setFilters } = useSessionFilters();
  const { sessions, isLoading } = useGetSessions({
    mode: "history",
    startDate,
    endDate,
    filters,
  });

  // Check if any filters are active
  const hasActiveFilters =
    filters.project.length > 0 ||
    filters.branch.length > 0 ||
    filters.action.length > 0;

  const clearFilters = () => {
    void setFilters({
      project: [],
      branch: [],
      action: [],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-1 pb-4">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Empty className="bg-muted/30 min-h-0 flex-1 border border-solid">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon icon={Rocket01Icon} />
          </EmptyMedia>
          <EmptyTitle>
            {hasActiveFilters ? "No matching sessions" : "No sessions yet"}
          </EmptyTitle>
          <EmptyDescription className="max-w-xs text-pretty">
            {hasActiveFilters
              ? "No sessions match your current filters. Try adjusting them or selecting a different date range."
              : "Start coding and your first session will appear here automatically!"}
          </EmptyDescription>
        </EmptyHeader>
        {hasActiveFilters && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-4 p-1 pb-4">
        <ActiveSessionIndicator />
        {sessions.map((session: ApiCodingSession) => (
          <SessionCard session={session} key={session.id} />
        ))}
      </div>
    </ScrollArea>
  );
};

const SessionBadge = ({ children, ...props }: BadgeProps) => (
  <Badge variant="outline" className="gap-1" size={"sm"} {...props}>
    {children}
  </Badge>
);

const SessionCard = ({ session }: { session: ApiCodingSession }) => {
  const isSessionPending =
    session.status === "ongoing" || session.status === "synced";

  const title = isSessionPending ? "Ongoing Session" : session.title;

  const actionTag = session.actionTag
    ? actionTagConfig[session.actionTag]
    : null;

  const durationSeconds = Math.floor(
    (new Date(session.endedAt).getTime() -
      new Date(session.startedAt).getTime()) /
      1000,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>
            {formatRelativeTime(new Date(session.startedAt))} &bull;{" "}
            {session.mainLanguage ?? "Unknown"}
          </CardDescription>
        </div>
        {!isSessionPending && session.activity.length > 0 && (
          <Sparkline
            data={session.activity}
            width={80}
            height={24}
            className="text-primary"
          />
        )}
      </CardHeader>
      {!isSessionPending && (
        <>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {/* Duration badge */}
              <SessionBadge>
                <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                {formatCodingTime(durationSeconds)}
              </SessionBadge>
              {session.mainBranch && (
                <SessionBadge>
                  <HugeiconsIcon icon={GitBranchIcon} className="size-3" />
                  {session.mainBranch}
                </SessionBadge>
              )}
              {session.mainProject && (
                <SessionBadge>
                  <HugeiconsIcon icon={FolderOpenIcon} className="size-3" />
                  {session.mainProject}
                </SessionBadge>
              )}
              {session.linesAdded !== null && session.linesAdded > 0 && (
                <SessionBadge className="gap-1 text-green-600">
                  <HugeiconsIcon icon={Add01Icon} className="size-3" />
                  {session.linesAdded}
                </SessionBadge>
              )}
              {session.linesDeleted !== null && session.linesDeleted > 0 && (
                <SessionBadge className="gap-1 text-red-500">
                  <HugeiconsIcon icon={Remove01Icon} className="size-3" />
                  {session.linesDeleted}
                </SessionBadge>
              )}
              {actionTag && (
                <SessionBadge>
                  <HugeiconsIcon icon={actionTag.icon} className="size-3" />
                  {actionTag.label}
                </SessionBadge>
              )}
            </div>
          </CardContent>
          <Separator />
          <CardFooter>
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/session/${session.id}`}>
                View Session
              </Link>
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};
