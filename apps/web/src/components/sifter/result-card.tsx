"use client";

import {
  ArrowRight01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { SifterCategory } from "@turbo/validators";
import {
  buildSheinSearchUrl,
  buildTemuSearchUrl,
  SIFTER_TEMU_FIRST_ORDER_CODE,
} from "@turbo/shared/sifter";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { toast } from "@turbo/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success("Copied");
};

const copyTemuOfferCode = async () => {
  try {
    await navigator.clipboard.writeText(SIFTER_TEMU_FIRST_ORDER_CODE);
    toast.success(
      `Temu code ${SIFTER_TEMU_FIRST_ORDER_CODE} copied. Sifter may earn from this link.`,
    );
  } catch {
    toast.message(
      `Temu code: ${SIFTER_TEMU_FIRST_ORDER_CODE}. Sifter may earn from this link.`,
    );
  }
};

export const ResultCard = ({ category }: { category: SifterCategory }) => {
  const primaryTerm = category.searchTerms[0] ?? category.name;

  return (
    <section
      data-slot="sifter-result-card"
      className="max-w-full min-w-0 border-b border-slate-200/70 py-5 last:border-b-0 dark:border-white/10"
    >
      <div className="space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center text-lg">
            {category.emoji}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold tracking-normal text-balance break-words sm:text-lg">
              {category.name}
            </h3>
            <p className="text-muted-foreground text-sm leading-6 break-words">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex max-w-full flex-wrap gap-2">
        {category.searchTerms.map((term) => (
          <Tooltip key={term}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void copyText(term)}
                className="group/chip max-w-full rounded-full text-left outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/30"
              >
                <Badge
                  variant="outline"
                  className="text-foreground/85 group-hover/chip:text-foreground h-auto min-h-8 max-w-full cursor-copy justify-start border-transparent bg-slate-950/[0.04] px-3 py-1.5 text-left text-[0.8125rem] leading-5 font-medium break-words whitespace-normal transition group-hover/chip:bg-blue-500/10 dark:bg-white/[0.06]"
                >
                  {term}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy search term</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-white/10">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
          Verify before buying
        </div>
        <ul className="text-foreground/82 dark:text-foreground/78 grid gap-2.5 text-sm leading-6">
          {category.verificationChecks.map((check) => (
            <li key={check} className="flex gap-2.5">
              <span className="text-muted-foreground mt-1 grid size-4 shrink-0 place-items-center rounded-full">
                <HugeiconsIcon icon={Tick02Icon} className="size-3" />
              </span>
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          className="h-12 rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-none transition duration-300 hover:from-blue-400 hover:to-indigo-500"
          asChild
        >
          <a
            href={buildTemuSearchUrl(primaryTerm)}
            target="_blank"
            rel="noreferrer"
            onClick={() => void copyTemuOfferCode()}
          >
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            Search Temu
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </a>
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-lg border-transparent bg-slate-950/[0.04] shadow-none transition duration-300 hover:bg-blue-500/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
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
        <div className="mt-5 grid gap-5 border-t border-slate-200/70 pt-4 sm:grid-cols-2 dark:border-white/10">
          {category.proTip ? (
            <div className="text-foreground/82 dark:text-foreground/78 text-sm leading-6">
              <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                Pro tip
              </div>
              {category.proTip}
            </div>
          ) : null}

          {category.avoid ? (
            <div className="text-foreground/82 dark:text-foreground/78 text-sm leading-6">
              <div className="mb-2 font-semibold text-red-700 dark:text-red-300">
                Avoid
              </div>
              {category.avoid}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
