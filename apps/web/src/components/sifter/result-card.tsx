"use client";

import {
  ArrowRight01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { SifterCategory } from "@turbo/validators";
import { buildSheinSearchUrl, buildTemuSearchUrl } from "@turbo/shared/sifter";
import { cn } from "@turbo/ui";
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
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/82 p-4 shadow-[0_18px_70px_-48px_rgba(15,23,42,0.75)] ring-1 ring-slate-950/[0.03] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/50 hover:shadow-[0_26px_90px_-52px_rgba(37,99,235,0.55)] sm:p-5 dark:border-white/10 dark:bg-zinc-950/58 dark:ring-white/5"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-blue-500/10 bg-blue-500/10 text-lg shadow-inner shadow-white/50 dark:border-blue-300/10 dark:bg-blue-400/10 dark:shadow-none">
            {category.emoji}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold tracking-normal text-balance sm:text-lg">
              {category.name}
            </h3>
            <p className="text-muted-foreground text-sm leading-6">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {category.searchTerms.map((term) => (
          <Tooltip key={term}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void copyText(term)}
                className="group/chip rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/30"
              >
                <Badge
                  variant="outline"
                  className="text-foreground/85 group-hover/chip:text-foreground cursor-copy border-slate-200/80 bg-slate-950/[0.03] px-3 py-1.5 text-[0.8125rem] font-medium transition group-hover/chip:border-blue-300/60 group-hover/chip:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  {term}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy search term</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          className="h-12 rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:from-blue-400 hover:to-indigo-500"
          asChild
        >
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
        <Button
          variant="outline"
          className="h-12 rounded-2xl border-slate-300/80 bg-white/70 shadow-sm transition duration-300 hover:border-blue-300/70 hover:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          asChild
        >
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {category.proTip ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-950 shadow-inner shadow-white/30 dark:text-emerald-100 dark:shadow-none">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                Pro tip
              </div>
              {category.proTip}
            </div>
          ) : null}

          {category.avoid ? (
            <div
              className={cn(
                "rounded-2xl border p-4 text-sm leading-6 shadow-inner shadow-white/20 dark:shadow-none",
                "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
              )}
            >
              <div className="mb-2 font-semibold">Avoid</div>
              {category.avoid}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
