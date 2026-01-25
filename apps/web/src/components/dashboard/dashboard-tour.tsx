"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { QuestionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { driver } from "driver.js";

import type { UserSettings } from "@turbo/validators";
import { Button } from "@turbo/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

import "driver.js/dist/driver.css";
import "./tour-styles.css";

/**
 * Tour steps configuration for the dashboard
 */
const tourSteps = [
  {
    element: '[data-tour="pulse-header"]',
    popover: {
      title: "Welcome to Your Dashboard! 👋",
      description:
        "This is your personalized greeting powered by AI. It updates based on your coding activity to give you relevant insights.",
    },
  },
  {
    element: '[data-tour="standup-button"]',
    popover: {
      title: "Generate Standups",
      description:
        "Click here to generate AI-powered standup reports from your coding sessions. Perfect for daily standups or weekly reviews.",
    },
  },
  {
    element: '[data-tour="session-feed"]',
    popover: {
      title: "Session Feed",
      description:
        "Your coding sessions appear here with details like duration, language, branch, and activity patterns. Filter them by project, branch, or action type.",
    },
  },
  {
    element: '[data-tour="metrics"]',
    popover: {
      title: "Today's Snapshot",
      description:
        "Track your daily coding metrics at a glance. Let's walk through each one!",
    },
  },
  {
    element: '[data-tour="flow-gauge"]',
    popover: {
      title: "Flow Efficiency",
      description:
        "This gauge shows how much of your coding time was spent in deep focus (20+ minute blocks). Higher percentage means more productive, uninterrupted work!",
    },
  },
  {
    element: '[data-tour="metric-coding-time"]',
    popover: {
      title: "Coding Time",
      description:
        "Total time you've spent actively coding today. This counts only active editing time, not idle time with your editor open.",
    },
  },
  {
    element: '[data-tour="metric-sessions"]',
    popover: {
      title: "Sessions",
      description:
        "Number of coding sessions today. A new session starts after 15+ minutes of inactivity. Think of each session as a focused work block.",
    },
  },
  {
    element: '[data-tour="metric-flow-states"]',
    popover: {
      title: "Flow States",
      description:
        "Count of times you achieved deep focus (20+ minutes of continuous coding). Flow states are your most productive periods!",
    },
  },
  {
    element: '[data-tour="metric-heartbeats"]',
    popover: {
      title: "Heartbeats",
      description:
        "Activity signals sent by your IDE. Each heartbeat represents a moment of coding activity like typing, saving, or switching files.",
    },
  },
];

/**
 * Fetch user settings including tour state
 */
const fetchSettings = async (): Promise<UserSettings> => {
  const res = await api.settings.web.$get();
  if (!res.ok) {
    throw new Error("Failed to fetch settings");
  }
  return res.json();
};

interface DashboardTourProps {
  /**
   * If true, auto-start the tour for first-time users
   */
  autoStart?: boolean;
}

/**
 * Dashboard Tour Component
 *
 * Provides an interactive guided tour of the dashboard using driver.js.
 * Tour completion is persisted in the database for cross-device sync.
 */
export const DashboardTour = ({ autoStart = true }: DashboardTourProps) => {
  const queryClient = useQueryClient();
  const hasInitializedRef = useRef(false);

  // Fetch user settings to check tour state
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "web"],
    queryFn: fetchSettings,
  });

  // Mutation to mark tour as completed
  const completeTourMutation = useMutation({
    mutationFn: async (): Promise<UserSettings> => {
      const res = await api.settings.web.$put({
        json: { hasSeenDashboardTour: true },
      });
      if (!res.ok) {
        throw new Error("Failed to update tour state");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings", "web"] });
    },
  });

  /**
   * Start the dashboard tour
   */
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      popoverClass: "kodo-tour-popover",
      steps: tourSteps,
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      onDestroyStarted: () => {
        // Mark tour as completed when user finishes or closes
        if (!settings?.hasSeenDashboardTour) {
          completeTourMutation.mutate();
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [completeTourMutation, settings?.hasSeenDashboardTour]);

  // Auto-start tour for first-time users
  useEffect(() => {
    if (
      autoStart &&
      !isLoading &&
      settings &&
      !settings.hasSeenDashboardTour &&
      !hasInitializedRef.current
    ) {
      hasInitializedRef.current = true;
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isLoading, settings, startTour]);

  return (
    <Tooltip delayDuration={750}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={startTour}
          aria-label="Start dashboard tour"
        >
          <HugeiconsIcon icon={QuestionIcon} className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Take a tour of the dashboard</TooltipContent>
    </Tooltip>
  );
};
