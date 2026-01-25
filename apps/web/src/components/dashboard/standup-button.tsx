import { useState } from "react";
import { api } from "@/lib/api";
import {
  Copy01Icon,
  MagicWand01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import {
  endOfDay,
  endOfWeek,
  endOfYesterday,
  startOfDay,
  startOfWeek,
  startOfYesterday,
} from "date-fns";
import { toast } from "sonner";

import { cn } from "@turbo/ui";
import { Button } from "@turbo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@turbo/ui/dialog";
import { ScrollArea } from "@turbo/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbo/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

type DateRangeType = "Yesterday" | "Today" | "This Week" | "regenerate";

interface StandupButtonProps {
  className?: string;
}

export const StandupButton = ({ className }: StandupButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [generatedStandup, setGeneratedStandup] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentRange, setCurrentRange] = useState<DateRangeType>("Yesterday");
  const [selectedRange, setSelectedRange] = useState<string>("Yesterday");

  const generateMutation = useMutation({
    mutationFn: async (rangeType: DateRangeType) => {
      // Use cached range if regenerating
      const actualType = rangeType === "regenerate" ? currentRange : rangeType;

      // Update state if not regenerating
      if (rangeType !== "regenerate") {
        setCurrentRange(rangeType);
      }

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (actualType === "Today") {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else if (actualType === "This Week") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        // Default to yesterday
        startDate = startOfYesterday();
        endDate = endOfYesterday();
      }

      const res = await api.sessions.standup.$post({
        json: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dateRangeLabel: actualType,
          forceRefresh: rangeType === "regenerate",
        },
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Daily limit reached (2/day)");
        }
        throw new Error("Failed to generate standup");
      }

      const data = (await res.json()) as { standup: string };
      return data.standup;
    },
    onSuccess: (data) => {
      setGeneratedStandup(data);
      setIsOpen(true);
      setCopied(false);
      toast.success("Standup generated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate standup");
    },
  });

  const handleGenerate = (type: DateRangeType) => {
    generateMutation.mutate(type);
  };

  const handleCopy = async () => {
    if (generatedStandup) {
      await navigator.clipboard.writeText(generatedStandup);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPending = generateMutation.isPending;

  return (
    <>
      <Tooltip delayDuration={750}>
        <TooltipTrigger asChild>
          <Button
            variant="gradient"
            size="sm"
            className={cn("gap-2", className)}
            onClick={() => handleGenerate("Yesterday")}
            disabled={isPending}
            loading={isPending}
            data-tour="standup-button"
          >
            <HugeiconsIcon icon={MagicWand01Icon} className="size-4" />
            Standup
          </Button>
        </TooltipTrigger>
        <TooltipContent>Generate standup for yesterday</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate Standup</DialogTitle>
            <DialogDescription>
              Create a narrative standup report from your sessions.
            </DialogDescription>
          </DialogHeader>

          {!generatedStandup ? (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Select Range</label>
                <Select
                  value={selectedRange}
                  onValueChange={(val) => setSelectedRange(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yesterday">Yesterday</SelectItem>
                    <SelectItem value="Today">Today</SelectItem>
                    <SelectItem value="This Week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleGenerate(selectedRange as DateRangeType)}
                disabled={isPending}
                loading={isPending}
              >
                {isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border p-4">
                <ScrollArea className="h-[300px] w-full">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {generatedStandup}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleGenerate("regenerate")}
                  disabled={isPending}
                  loading={isPending}
                  size={"sm"}
                >
                  Regenerate
                </Button>
                <Button onClick={handleCopy} disabled={isPending} size={"sm"}>
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    altIcon={Tick02Icon}
                    showAlt={copied}
                  />
                  Copy
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
