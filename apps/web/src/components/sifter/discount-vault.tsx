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
      <Button variant="outline" size="sm">
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
                    className="border-border bg-card hover:bg-accent flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition"
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
                    <Badge variant="secondary">Copy</Badge>
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
                  className="rounded-full"
                >
                  <Badge variant="outline">{keyword}</Badge>
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
);
