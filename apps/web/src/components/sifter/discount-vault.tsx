"use client";

import {
  SIFTER_DISCOUNT_CODE_GROUPS,
  SIFTER_SALE_KEYWORDS,
} from "@turbo/shared/sifter";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { ScrollArea } from "@turbo/ui/scroll-area";
import { Separator } from "@turbo/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@turbo/ui/sheet";
import { toast } from "@turbo/ui/toast";

const copyCode = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.success(`${value} copied`);
};

export const DiscountVault = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full border-slate-300/70 bg-white/60 px-4 shadow-sm backdrop-blur transition duration-300 hover:border-blue-300/70 hover:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
      >
        SHEIN Codes
      </Button>
    </SheetTrigger>
    <SheetContent className="w-full sm:max-w-md">
      <SheetHeader>
        <SheetTitle>SHEIN Discount Codes</SheetTitle>
      </SheetHeader>
      <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
        <div className="space-y-7">
          {SIFTER_DISCOUNT_CODE_GROUPS.map((group) => (
            <section key={group.title} className="space-y-3">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <div className="grid gap-2">
                {group.codes.map((code) => (
                  <button
                    type="button"
                    key={`${group.title}-${code.code}-${code.category ?? ""}`}
                    onClick={() => void copyCode(code.code)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-left shadow-sm transition duration-300 hover:border-blue-300/70 hover:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                  >
                    <span>
                      <span className="block font-mono text-sm font-semibold">
                        {code.code}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {code.discount}
                        {code.category ? ` - ${code.category}` : ""}
                      </span>
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-200"
                    >
                      Copy
                    </Badge>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <Separator />
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Sale Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {SIFTER_SALE_KEYWORDS.map((keyword) => (
                <button
                  type="button"
                  key={keyword}
                  onClick={() => void copyCode(keyword)}
                  className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/30"
                >
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-1.5 transition hover:border-blue-300/70 hover:bg-blue-500/10"
                  >
                    {keyword}
                  </Badge>
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
);
