"use client";

import {
  Add01Icon,
  GitCommitIcon,
  Remove01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@turbo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";

interface Commit {
  sha: string;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  timestamp: string;
}

interface SessionCommitsProps {
  commits: Commit[];
}

export const SessionCommits = ({ commits }: SessionCommitsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Commits</CardTitle>
        <CardDescription>Git commits made during this session</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commits.map((commit) => {
            const time = new Date(commit.timestamp);
            return (
              <div
                key={commit.sha}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                  <HugeiconsIcon icon={GitCommitIcon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-tight font-medium">
                      {commit.message}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {time.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {commit.sha.slice(0, 7)}
                    </Badge>
                    {commit.filesChanged > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {commit.filesChanged} file
                        {commit.filesChanged !== 1 ? "s" : ""}
                      </span>
                    )}
                    {commit.insertions > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600">
                        <HugeiconsIcon icon={Add01Icon} className="size-3" />
                        {commit.insertions}
                      </span>
                    )}
                    {commit.deletions > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-red-500">
                        <HugeiconsIcon icon={Remove01Icon} className="size-3" />
                        {commit.deletions}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
