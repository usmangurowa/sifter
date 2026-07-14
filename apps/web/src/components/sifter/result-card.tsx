"use client";

import {
  ArrowRight01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { SifterCategory } from "@turbo/validators";
import { buildSheinSearchUrl, buildTemuSearchUrl } from "@turbo/shared/sifter";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { toast } from "@turbo/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success("Copied");
};

export const ResultCard = ({ category }: { category: SifterCategory }) => {
  const primaryTerm = category.searchTerms[0] ?? category.name;

  return (
    <section
      data-slot="sifter-result-card"
      className="border-border/70 space-y-4 border-b py-5 first:pt-0 last:border-b-0 last:pb-0"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 grid size-9 shrink-0 place-items-center rounded-md text-lg">
            {category.emoji}
          </span>
          <h3 className="text-base font-medium">{category.name}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-6">
          {category.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {category.searchTerms.map((term) => (
          <Tooltip key={term}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void copyText(term)}
                className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-[3px]"
              >
                <Badge
                  variant="outline"
                  className="hover:bg-primary/10 hover:text-foreground cursor-copy"
                >
                  {term}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy search term</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild>
          <a
            href={buildTemuSearchUrl(primaryTerm)}
            target="_blank"
            rel="noreferrer"
          >
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            Search Temu
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a
            href={buildSheinSearchUrl(primaryTerm)}
            target="_blank"
            rel="noreferrer"
          >
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            Search SHEIN
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </a>
        </Button>
      </div>

      {category.proTip || category.avoid ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {category.proTip ? (
            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                Pro tip
              </div>
              {category.proTip}
            </div>
          ) : null}

          {category.avoid ? (
            <div className="border-destructive/25 bg-destructive/10 text-destructive rounded-md border p-3 text-sm leading-6">
              <div className="mb-1 font-medium">Avoid</div>
              {category.avoid}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
