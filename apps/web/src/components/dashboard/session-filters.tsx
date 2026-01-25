"use client";

import type { DateRangePreset } from "@/hooks/use-date-range";
import type { IconSvgElement } from "@hugeicons/react";
import { useMemo } from "react";
import { dateRanges, useDateRange } from "@/hooks/use-date-range";
import { useSessionFilters } from "@/hooks/use-session-filters";
import { api } from "@/lib/api";
import {
  Activity01Icon,
  Calendar03Icon,
  FilterHorizontalIcon,
  FolderOpenIcon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@turbo/ui/dropdown-menu";

type FilterKey = "project" | "branch" | "action";

interface FilterItem {
  key: FilterKey;
  label: string;
  icon: IconSvgElement;
  subItems: string[];
}

export const SessionFilters = () => {
  const { filters, setFilters } = useSessionFilters();
  const { startDate, endDate, preset, setDateRange } = useDateRange();

  // Fetch facets
  const { data: facets } = useQuery({
    queryKey: [
      "session-facets",
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async () => {
      const res = await api.sessions.facets.$get({
        query: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch facets");
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Map facets to filter items
  const filterItems = useMemo<FilterItem[]>(() => {
    const projects = (facets?.projects ?? []).filter((p) => p !== null);
    const branches = (facets?.branches ?? []).filter((b) => b !== null);
    const actions = (facets?.actions ?? []).filter(
      (a) => a !== null,
    ) as string[];

    return [
      {
        key: "project",
        label: "Project",
        icon: FolderOpenIcon,
        subItems: projects,
      },
      {
        key: "branch",
        label: "Branch",
        icon: GitBranchIcon,
        subItems: branches,
      },
      {
        key: "action",
        label: "Action",
        icon: Activity01Icon,
        subItems: actions,
      },
    ];
  }, [facets]);

  const toggleFilter = (key: FilterKey, value: string) => {
    const current = filters[key];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    void setFilters({ [key]: newValues.length ? newValues : null });
  };

  const handleReset = () => {
    void setFilters({ project: null, branch: null, action: null });
  };

  const activeCount =
    filters.project.length + filters.branch.length + filters.action.length;

  // Get current date range label
  const currentDateLabel =
    dateRanges.find((r) => r.preset === preset)?.title ?? "Today";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
          <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" />
          {currentDateLabel}
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 shrink-0 rounded-full text-[10px]"
            >
              +{activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Date Range Section */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
            <span>Date Range</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={preset}
              onValueChange={(v) => setDateRange(v as DateRangePreset)}
            >
              {dateRanges
                .filter((r) => r.preset !== "custom")
                .map((range) => (
                  <DropdownMenuRadioItem
                    key={range.preset}
                    value={range.preset}
                  >
                    {range.title}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Filter Items */}
        {filterItems.map(({ key, label, icon, subItems }) => (
          <DropdownMenuSub key={key}>
            <DropdownMenuSubTrigger>
              <HugeiconsIcon icon={icon} className="size-4" />
              <span>{label}</span>
              {filters[key].length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 shrink-0 rounded-full text-[10px]"
                >
                  {filters[key].length}
                </Badge>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-[300px] w-56 overflow-y-auto">
              {subItems.length > 0 ? (
                subItems.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={filters[key].includes(option)}
                    onCheckedChange={() => toggleFilter(key, option)}
                    title={option}
                  >
                    <span className="truncate">{option}</span>
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <div className="text-muted-foreground p-2 text-center text-xs">
                  No {label.toLowerCase()}s available
                </div>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleReset}
              className="justify-center text-center font-medium"
            >
              Reset Filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
