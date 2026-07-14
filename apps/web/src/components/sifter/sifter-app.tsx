"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type {
  SifterChatApiResponse,
  SifterChatResponseData,
} from "@turbo/validators";
import { SIFTER_SUGGESTIONS } from "@turbo/shared/sifter";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { Separator } from "@turbo/ui/separator";

import { ChatInput } from "./chat-input";
import { DiscountVault } from "./discount-vault";
import { LoadingState } from "./loading-state";
import { ResultCard } from "./result-card";

type Status = "idle" | "loading" | "success" | "error";

export const SifterApp = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SifterChatResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const submit = async (message: string) => {
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

      if (!payload.success) {
        setError(payload.error);
        setStatus("error");
        return;
      }

      setResult(payload.data);
      setStatus("success");
    } catch {
      setError("Sifter could not connect. Check your network and try again.");
      setStatus("error");
    }
  };

  const hasResults = status === "success" && result;
  const isConversation = status !== "idle";

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="bg-background/80 sticky top-0 z-40 border-b supports-backdrop-filter:backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-2xl font-semibold">
              S
            </div>
            <div>
              <div className="text-sm font-semibold">Sifter</div>
              <div className="text-muted-foreground text-xs">
                Quality search for Temu and SHEIN
              </div>
            </div>
          </div>
          <DiscountVault />
        </div>
      </header>

      <div
        className={[
          "mx-auto flex w-full flex-col px-4 sm:px-6",
          isConversation
            ? "min-h-[calc(100vh-4rem)] max-w-3xl py-6"
            : "max-w-6xl gap-10 py-10 lg:py-14",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          {!isConversation ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-3xl flex-col items-center justify-center gap-6 text-center"
            >
              <div className="space-y-5">
                <Badge variant="secondary">AI-powered shopping assistant</Badge>
                <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-6xl">
                  Shop smarter on Temu and SHEIN.
                </h1>
                <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-7 sm:text-lg">
                  Tell me what you want to buy. I will turn it into
                  material-aware search terms that help avoid cheap-looking
                  products.
                </p>
              </div>

              <div className="w-full">
                <ChatInput onSubmit={submit} />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {SIFTER_SUGGESTIONS.map((suggestion) => (
                  <Button
                    type="button"
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => void submit(suggestion)}
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
              className="flex min-h-[calc(100vh-7rem)] flex-col gap-5"
            >
              {lastQuery ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground max-w-[85%] rounded-md px-4 py-3 text-sm leading-6 shadow-sm">
                    {lastQuery}
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground mt-1 grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold">
                  S
                </div>
                <div className="bg-card/75 border-border/80 min-w-0 flex-1 rounded-lg border p-5 shadow-sm sm:p-6">
                  {status === "loading" ? (
                    <div className="space-y-4">
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
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-medium">Try again</h2>
                        <p className="text-muted-foreground text-sm leading-6">
                          {error}
                        </p>
                      </div>
                      {lastQuery ? (
                        <Button onClick={() => void submit(lastQuery)}>
                          Run search again
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {hasResults ? (
                    <div className="space-y-5">
                      <p className="text-muted-foreground text-sm leading-6">
                        {result.greeting}
                      </p>

                      <div>
                        {result.categories.map((category, index) => (
                          <motion.div
                            key={`${category.name}-${index}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <ResultCard category={category} />
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-1">
                        <h3 className="text-base font-medium">Shopping tips</h3>
                        <ol className="grid gap-2 text-sm leading-6">
                          {result.shoppingTips.map((tip, index) => (
                            <li key={tip} className="flex gap-3">
                              <span className="text-primary font-medium">
                                {index + 1}.
                              </span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ol>
                        {result.discountCodes.length > 0 ? (
                          <>
                            <Separator className="my-4" />
                            <div className="flex flex-wrap gap-2">
                              {result.discountCodes.map((code) => (
                                <Badge key={code.code} variant="secondary">
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

              <div className="bg-background/90 sticky bottom-3 mt-auto pt-3 backdrop-blur">
                <ChatInput
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
