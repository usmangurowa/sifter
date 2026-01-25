"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SessionActivityChart } from "@/components/session/session-activity-chart";
import { SessionCommits } from "@/components/session/session-commits";
import { SessionInsights } from "@/components/session/session-insights-drawer";
import { actionTagConfig } from "@/lib/action-tag-config";
import { api } from "@/lib/api";
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  CodeIcon,
  FolderOpenIcon,
  GitBranchIcon,
  GitCommitIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import type { CodingSession } from "@turbo/db/schema";
import { formatCodingTime } from "@turbo/shared";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";
import { Progress } from "@turbo/ui/progress";
import { ScrollArea } from "@turbo/ui/scroll-area";
import { Separator } from "@turbo/ui/separator";
import { Skeleton } from "@turbo/ui/skeleton";

/** API response type - dates are serialized as strings */
interface SessionDetailResponse {
  session: Omit<CodingSession, "startedAt" | "endedAt" | "createdAt"> & {
    startedAt: string;
    endedAt: string;
    createdAt: string;
  };
  activity: number[];
  topFiles: { file: string; count: number }[];
  languageBreakdown: { language: string; count: number }[];
  commits: {
    sha: string;
    message: string;
    filesChanged: number;
    insertions: number;
    deletions: number;
    timestamp: string;
  }[];
  timeline: {
    time: string;
    type: "file_switch" | "commit" | "activity_spike";
    description: string;
  }[];
  stats: {
    totalHeartbeats: number;
    uniqueFiles: number;
    uniqueLanguages: number;
    totalCommits: number;
  };
}

const fetchSessionDetail = async (
  id: string,
): Promise<SessionDetailResponse> => {
  const res = await api.sessions[":id"].$get({
    param: { id },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch session");
  }
  return res.json() as Promise<SessionDetailResponse>;
};

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const router = useRouter();

  // Need to use React.use() for params in Next.js 15
  const { id } = React.use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["session-detail", id],
    queryFn: () => fetchSessionDetail(id),
  });

  if (isLoading) {
    return (
      <main className="container flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Session not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 size-4" />
          Go Back
        </Button>
      </main>
    );
  }

  const { session, activity, topFiles, languageBreakdown, commits, stats } =
    data;
  const startedAt = new Date(session.startedAt);
  const endedAt = new Date(session.endedAt);
  const durationSeconds = Math.floor(
    (endedAt.getTime() - startedAt.getTime()) / 1000,
  );
  const actionTag = session.actionTag
    ? actionTagConfig[session.actionTag]
    : null;

  return (
    <ScrollArea className="min-h-0 flex-1">
      <main className="container flex flex-col gap-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {session.title ?? "Coding Session"}
              </h1>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
                {format(startedAt, "EEEE, MMM d")}
                <span className="mx-1">•</span>
                {format(startedAt, "h:mm a")} - {format(endedAt, "h:mm a")}
              </div>
            </div>
          </div>

          {/* AI Insights Button + Drawer */}
          <SessionInsights
            sessionId={id}
            sessionTitle={session.title ?? "Coding Session"}
          />
        </div>

        {/* Summary */}
        {session.summary && (
          <Card>
            <CardContent className="">
              <p className="text-muted-foreground leading-relaxed">
                {session.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            {formatCodingTime(durationSeconds)}
          </Badge>
          {session.mainProject && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <HugeiconsIcon icon={FolderOpenIcon} className="size-4" />
              {session.mainProject}
            </Badge>
          )}
          {session.mainBranch && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <HugeiconsIcon icon={GitBranchIcon} className="size-4" />
              {session.mainBranch}
            </Badge>
          )}
          {session.mainLanguage && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <HugeiconsIcon icon={CodeIcon} className="size-4" />
              {session.mainLanguage}
            </Badge>
          )}
          {actionTag && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <HugeiconsIcon icon={actionTag.icon} className="size-4" />
              {actionTag.label}
            </Badge>
          )}
          {commits.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <HugeiconsIcon icon={GitCommitIcon} className="size-4" />
              {commits.length} commit{commits.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Activity Chart */}
        <SessionActivityChart
          activity={activity}
          startedAt={startedAt}
          endedAt={endedAt}
        />

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Files</CardTitle>
              <CardDescription>
                Most active files during this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topFiles.length > 0 ? (
                <div className="space-y-2">
                  {topFiles.map(({ file, count }) => (
                    <div
                      key={file}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate font-mono">
                        {file}
                      </span>
                      <Badge
                        variant="outline"
                        className="size-7 shrink-0 text-xs"
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No file activity recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Language Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Languages</CardTitle>
              <CardDescription>Programming languages used</CardDescription>
            </CardHeader>
            <CardContent>
              {languageBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {languageBreakdown.map(({ language, count }) => {
                    const total = stats.totalHeartbeats;
                    const percentage =
                      total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={language} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{language}</span>
                          <span className="text-muted-foreground">
                            {percentage}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" animate />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No language data recorded
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Commits Section */}
        {commits.length > 0 && (
          <>
            <Separator />
            <SessionCommits commits={commits} />
          </>
        )}
      </main>
    </ScrollArea>
  );
}
