"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  Copy01Icon,
  Edit02Icon,
  NoteAddIcon,
  SparklesIcon,
  TextIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@turbo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@turbo/ui/dropdown-menu";
import { ScrollArea } from "@turbo/ui/scroll-area";
import { Separator } from "@turbo/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@turbo/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

interface SessionInsightsOutput {
  story: string;
  proofBullets: string[];
  patterns: string[];
  titleSuggestions: string[];
}

interface SessionInsightsProps {
  sessionId: string;
  sessionTitle: string;
  onRenameSession?: (newTitle: string) => void;
}

/**
 * AI Insights button + drawer component.
 *
 * Clicking the button generates insights first, then opens the drawer
 * once the insights are available.
 */
export const SessionInsights = ({
  sessionId,
  sessionTitle,
  onRenameSession,
}: SessionInsightsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState<SessionInsightsOutput | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedPlaintext, setCopiedPlaintext] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.sessions[":id"].insights.$post({
        param: { id: sessionId },
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limit exceeded (5/hour)");
        }
        throw new Error("Failed to generate insights");
      }

      return res.json() as Promise<SessionInsightsOutput>;
    },
    onSuccess: (data) => {
      setInsights(data);
      // Open the drawer once insights are ready
      setIsOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate insights");
    },
  });

  const handleGenerateClick = () => {
    // If we already have insights, just open the drawer
    if (insights) {
      setIsOpen(true);
      return;
    }
    // Otherwise, generate insights (drawer will open on success)
    generateMutation.mutate();
  };

  const formatAsMarkdown = () => {
    if (!insights) return "";

    const lines = [
      `## ${sessionTitle}`,
      "",
      insights.story,
      "",
      "### Key Facts",
      ...insights.proofBullets.map((b) => `- ${b}`),
      "",
      "### Patterns",
      ...insights.patterns.map((p) => `- ${p}`),
    ];

    return lines.join("\n");
  };

  const formatAsPlaintext = () => {
    if (!insights) return "";

    const lines = [
      sessionTitle,
      "",
      insights.story,
      "",
      "Key Facts:",
      ...insights.proofBullets.map((b) => `• ${b}`),
      "",
      "Patterns:",
      ...insights.patterns.map((p) => `• ${p}`),
    ];

    return lines.join("\n");
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(formatAsMarkdown());
    setCopiedMarkdown(true);
    toast.success("Copied as Markdown");
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyPlaintext = async () => {
    await navigator.clipboard.writeText(formatAsPlaintext());
    setCopiedPlaintext(true);
    toast.success("Copied as plain text");
    setTimeout(() => setCopiedPlaintext(false), 2000);
  };

  const handleRenameSession = (newTitle: string) => {
    onRenameSession?.(newTitle);
    toast.success(`Session renamed to "${newTitle}"`);
  };

  const isPending = generateMutation.isPending;

  return (
    <>
      {/* AI Insights Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="gradient"
            onClick={handleGenerateClick}
            disabled={isPending}
            loading={isPending}
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            AI Insights
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Generate AI insights for this session</p>
        </TooltipContent>
      </Tooltip>

      {/* Insights Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={SparklesIcon}
                className="text-primary size-5"
              />
              AI Insights
            </SheetTitle>
            <SheetDescription>
              AI-generated narrative and patterns for this session
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1 px-5">
            {insights && (
              <div className="space-y-6 py-4">
                {/* Story */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Session Story</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {insights.story}
                    </p>
                  </div>
                </div>

                {/* Proof Bullets */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">What Changed</h3>
                  <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {insights.proofBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1.5 size-1.5 shrink-0 rounded-full bg-current" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Patterns */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Patterns Detected</h3>
                  <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {insights.patterns.map((pattern, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          className="text-primary mt-0.5 size-4 shrink-0"
                        />
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </ScrollArea>

          {insights && (
            <>
              <Separator />
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                {/* Copy buttons */}
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCopyMarkdown}
                  >
                    <HugeiconsIcon
                      icon={Copy01Icon}
                      altIcon={Tick02Icon}
                      showAlt={copiedMarkdown}
                      className="size-4"
                    />
                    Copy Markdown
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCopyPlaintext}
                  >
                    <HugeiconsIcon
                      icon={TextIcon}
                      altIcon={Tick02Icon}
                      showAlt={copiedPlaintext}
                      className="size-4"
                    />
                    Copy Text
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex w-full gap-2">
                  {onRenameSession && insights.titleSuggestions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                          Rename Session
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        {insights.titleSuggestions.map((title, i) => (
                          <DropdownMenuItem
                            key={i}
                            onClick={() => handleRenameSession(title)}
                          >
                            {title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    <HugeiconsIcon icon={NoteAddIcon} className="size-4" />
                    Add to Standup (coming soon)
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
