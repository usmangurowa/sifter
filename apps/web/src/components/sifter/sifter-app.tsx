"use client";

import { useRef, useState } from "react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";

import type {
  SifterChatApiResponse,
  SifterChatResponseData,
} from "@turbo/validators";
import { SIFTER_SUGGESTIONS } from "@turbo/shared/sifter";
import { cn } from "@turbo/ui";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { Separator } from "@turbo/ui/separator";

import { ChatInput } from "./chat-input";
import { DiscountVault } from "./discount-vault";
import { LoadingState } from "./loading-state";
import { ResultCard } from "./result-card";
import { SifterLogoMark } from "./sifter-logo-mark";

type Status = "idle" | "loading" | "success" | "error";

export const SifterApp = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SifterChatResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const submit = async (message: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");
    setResult(null);
    setError(null);
    setLastQuery(message);

    try {
      const response = await fetch("/api/sifter/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json()) as SifterChatApiResponse;

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!payload.success) {
        setError(payload.error);
        setStatus("error");
        return;
      }

      setResult(payload.data);
      setStatus("success");
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setError("Sifter could not connect. Check your network and try again.");
      setStatus("error");
    }
  };

  const returnToLanding = () => {
    requestIdRef.current += 1;
    setStatus("idle");
    setResult(null);
    setError(null);
    setLastQuery(null);
  };

  const hasResults = status === "success" && result;
  const isConversation = status !== "idle";

  return (
    <main
      className={cn(
        "text-foreground relative min-h-screen overflow-x-hidden",
        isConversation
          ? "bg-background"
          : "from-background via-background to-background bg-gradient-to-b",
      )}
    >
      {!isConversation ? (
        <>
          <div
            aria-hidden="true"
            className="sifter-ambient pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="sifter-grid pointer-events-none absolute inset-0 opacity-[0.16] dark:opacity-[0.08]"
          />
        </>
      ) : null}

      {!isConversation ? (
        <header className="absolute inset-x-0 top-0 z-40">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 text-blue-950">
              <SifterLogoMark className="h-8 w-6 shrink-0" />
              <span className="min-w-0 text-2xl font-black tracking-tight">
                Sifter
              </span>
            </div>
            <DiscountVault />
          </div>
        </header>
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto flex w-full flex-col px-4 sm:px-6",
          isConversation
            ? "min-h-screen max-w-4xl py-6"
            : "max-w-6xl gap-10 overflow-x-hidden pt-16 pb-10 lg:pb-14",
        )}
      >
        <AnimatePresence mode="wait">
          {!isConversation ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col items-center justify-center gap-7 overflow-x-hidden text-center"
            >
              <div className="w-full max-w-full space-y-5">
                <Badge
                  variant="secondary"
                  className="border border-white/10 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur dark:bg-white/10"
                >
                  AI-powered shopping assistant
                </Badge>
                <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-normal text-balance sm:text-6xl">
                  Shop smarter on Temu and SHEIN.
                </h1>
                <p className="mx-auto max-w-2xl text-base leading-7 text-white/80 text-shadow-sm sm:text-lg dark:text-white/72">
                  Tell me what you want to buy. I will turn it into
                  material-aware search terms that help avoid cheap-looking
                  products.
                </p>
              </div>

              <div className="w-full max-w-full min-w-0 p-2">
                <ChatInput onSubmit={submit} />
              </div>

              <div className="flex w-full max-w-3xl flex-wrap justify-center gap-2.5 overflow-hidden py-2">
                {SIFTER_SUGGESTIONS.map((suggestion) => (
                  <Button
                    type="button"
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => void submit(suggestion)}
                    className="rounded-full border-slate-300/70 bg-white/60 px-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/70 hover:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.section>
          ) : null}

          {isConversation ? (
            <motion.section
              key="conversation"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-[calc(100vh-3rem)] flex-col gap-5"
            >
              {lastQuery ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-[1.4rem] rounded-br-md bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-blue-600/20 sm:max-w-[72%]">
                    {lastQuery}
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid size-8 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
                      <SifterLogoMark className="h-5 w-4" />
                    </div>
                    <div className="truncate text-sm font-semibold">Sifter</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={returnToLanding}
                    className="text-muted-foreground hover:bg-muted/70 hover:text-foreground h-8 rounded-full px-2.5 text-xs"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                    Back
                  </Button>
                </div>
                <div className="bg-muted/20 min-w-0 rounded-[1.5rem] border border-slate-200/70 p-2.5 sm:rounded-[2rem] sm:p-4 dark:border-white/10 dark:bg-white/[0.02]">
                  {status === "loading" ? (
                    <div className="bg-background space-y-4 rounded-[1.5rem] border border-slate-200/80 p-5 shadow-sm sm:p-6 dark:border-white/10">
                      <div className="space-y-1">
                        <h2 className="text-base font-medium">
                          Sifting better search terms
                        </h2>
                        <p className="text-muted-foreground text-sm leading-6">
                          Checking material, construction, and shopping signals
                          before I suggest where to search.
                        </p>
                      </div>
                      <LoadingState />
                    </div>
                  ) : null}

                  {status === "error" ? (
                    <div className="space-y-4 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-5 shadow-sm sm:p-6">
                      <div className="space-y-1">
                        <h2 className="text-base font-medium">Try again</h2>
                        <p className="text-muted-foreground text-sm leading-6">
                          {error}
                        </p>
                      </div>
                      {lastQuery ? (
                        <Button
                          onClick={() => void submit(lastQuery)}
                          className="rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                        >
                          Run search again
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {hasResults ? (
                    <div className="min-w-0 space-y-5">
                      <p className="text-muted-foreground max-w-2xl text-sm leading-6 break-words">
                        {result.greeting}
                      </p>

                      <div className="grid min-w-0 gap-4">
                        {result.categories.map((category, index) => (
                          <motion.div
                            key={`${category.name}-${index}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="min-w-0"
                          >
                            <ResultCard category={category} />
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-background rounded-3xl border border-slate-200/80 p-4 shadow-sm sm:p-5 dark:border-white/10">
                        <h3 className="text-base font-semibold">
                          Shopping tips
                        </h3>
                        <ol className="mt-3 grid gap-2.5 text-sm leading-6">
                          {result.shoppingTips.map((tip, index) => (
                            <li key={tip} className="flex gap-3">
                              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-300">
                                {index + 1}.
                              </span>
                              <span className="pt-0.5">{tip}</span>
                            </li>
                          ))}
                        </ol>
                        {result.discountCodes.length > 0 ? (
                          <>
                            <Separator className="my-4" />
                            <div className="flex flex-wrap gap-2">
                              {result.discountCodes.map((code) => (
                                <Badge
                                  key={code.code}
                                  variant="secondary"
                                  className="h-auto max-w-full rounded-full px-3 py-1 text-left whitespace-normal"
                                >
                                  {code.code}: {code.description}
                                </Badge>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sticky bottom-3 mt-auto pt-3">
                <ChatInput
                  compact
                  disabled={status === "loading"}
                  placeholder="Ask for another item or outfit"
                  onSubmit={submit}
                />
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
};
