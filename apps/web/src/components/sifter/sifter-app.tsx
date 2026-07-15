"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ComputerIcon,
  MoonIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";

import type {
  SifterCategory,
  SifterChatApiResponse,
  SifterChatResponseData,
} from "@turbo/validators";
import {
  selectSifterMaterialDecoderGroups,
  SIFTER_SUGGESTIONS,
} from "@turbo/shared/sifter";
import { cn } from "@turbo/ui";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import { Separator } from "@turbo/ui/separator";
import { useTheme } from "@turbo/ui/theme";

import { ChatInput } from "./chat-input";
import { DiscountVault } from "./discount-vault";
import { LoadingState } from "./loading-state";
import { ResultCard } from "./result-card";
import { SifterLogoMark } from "./sifter-logo-mark";

type Status = "idle" | "loading" | "success" | "error";

const SIFTER_PROMPT_HISTORY_KEY = "sifter:prompt-history";
const SIFTER_PROMPT_HISTORY_EVENT = "sifter:prompt-history-updated";
const SIFTER_PROMPT_HISTORY_LIMIT = 6;
const SIFTER_LANDING_STARTERS = [
  {
    title: "Heavyweight cotton tee",
    prompt: "Find a thick black cotton T-shirt that is not see-through",
    detail: "Checks fabric weight, opacity, and wash risk.",
  },
  {
    title: "Phone case that protects",
    prompt: "Find a shock-absorbing Samsung S25 phone case",
    detail: "Checks TPU, silicone, thickness, and drop protection.",
  },
] as const;

const normalizePrompt = (prompt: string) =>
  prompt.trim().replace(/\s+/g, " ").slice(0, 500);

const mergePromptHistory = (prompt: string, history: string[]) => {
  const normalizedPrompt = normalizePrompt(prompt);
  if (!normalizedPrompt) {
    return history;
  }

  return [
    normalizedPrompt,
    ...history.filter(
      (item) => item.toLowerCase() !== normalizedPrompt.toLowerCase(),
    ),
  ].slice(0, SIFTER_PROMPT_HISTORY_LIMIT);
};

const parsePromptHistory = (value: string | null) => {
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalizePrompt)
      .filter(Boolean)
      .slice(0, SIFTER_PROMPT_HISTORY_LIMIT);
  } catch {
    return [];
  }
};

const readPromptHistory = () => {
  if (typeof window === "undefined") {
    return [];
  }

  return parsePromptHistory(
    window.localStorage.getItem(SIFTER_PROMPT_HISTORY_KEY),
  );
};

const getPromptHistorySnapshot = () => {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(SIFTER_PROMPT_HISTORY_KEY) ?? "[]";
};

const subscribePromptHistory = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = () => callback();

  window.addEventListener("storage", listener);
  window.addEventListener(SIFTER_PROMPT_HISTORY_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(SIFTER_PROMPT_HISTORY_EVENT, listener);
  };
};

const writePromptHistory = (history: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SIFTER_PROMPT_HISTORY_KEY,
      JSON.stringify(history),
    );
    window.dispatchEvent(new Event(SIFTER_PROMPT_HISTORY_EVENT));
  } catch {
    // Private browsing or storage limits should not block Sifter.
  }
};

const getCategoryDecoderContext = (category: SifterCategory) =>
  [
    category.name,
    category.description,
    ...category.searchTerms.flatMap((searchTerm) => [
      searchTerm.term,
      searchTerm.why,
    ]),
    ...category.verificationChecks,
    category.proTip,
    category.avoid,
  ]
    .filter(Boolean)
    .join(" ");

const ThemeCycleButton = () => {
  const { themeMode, toggleMode } = useTheme();
  const label =
    themeMode === "auto"
      ? "system theme"
      : themeMode === "dark"
        ? "dark theme"
        : "light theme";
  const icon =
    themeMode === "light"
      ? Sun01Icon
      : themeMode === "dark"
        ? MoonIcon
        : ComputerIcon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={`Using ${label}. Switch theme.`}
      title={`Using ${label}`}
      className="size-10 rounded-full bg-transparent p-0 text-blue-950 shadow-none hover:bg-transparent hover:text-blue-950 dark:text-blue-100 dark:hover:bg-transparent dark:hover:text-blue-100 [&_svg]:size-5"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Button>
  );
};

interface SifterAppProps {
  initialMessage?: string;
  mode?: "landing" | "chat";
}

export const SifterApp = ({
  initialMessage,
  mode = "landing",
}: SifterAppProps) => {
  const router = useRouter();
  const normalizedInitialMessage = initialMessage?.trim() ?? "";
  const [status, setStatus] = useState<Status>(
    mode === "chat" && normalizedInitialMessage ? "loading" : "idle",
  );
  const [result, setResult] = useState<SifterChatResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(
    mode === "chat" && normalizedInitialMessage
      ? normalizedInitialMessage
      : null,
  );
  const requestIdRef = useRef(0);
  const initialMessageRef = useRef<string | null>(null);
  const promptHistorySnapshot = useSyncExternalStore(
    subscribePromptHistory,
    getPromptHistorySnapshot,
    () => "[]",
  );
  const recentPrompts = useMemo(
    () => parsePromptHistory(promptHistorySnapshot),
    [promptHistorySnapshot],
  );

  const rememberPrompt = useCallback((message: string) => {
    const normalizedMessage = normalizePrompt(message);
    if (!normalizedMessage) {
      return;
    }

    const nextHistory = mergePromptHistory(
      normalizedMessage,
      readPromptHistory(),
    );
    writePromptHistory(nextHistory);
  }, []);

  const submit = useCallback(
    async (message: string) => {
      const normalizedMessage = normalizePrompt(message);
      if (!normalizedMessage) {
        return;
      }

      rememberPrompt(normalizedMessage);

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus("loading");
      setResult(null);
      setError(null);
      setLastQuery(normalizedMessage);

      try {
        const response = await fetch("/api/sifter/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: normalizedMessage }),
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
    },
    [rememberPrompt],
  );

  useEffect(() => {
    if (mode !== "chat" || !normalizedInitialMessage) {
      return;
    }

    if (initialMessageRef.current === normalizedInitialMessage) {
      return;
    }

    initialMessageRef.current = normalizedInitialMessage;
    void submit(normalizedInitialMessage);
  }, [mode, normalizedInitialMessage, submit]);

  const startChat = useCallback(
    (message: string) => {
      const normalizedMessage = normalizePrompt(message);
      if (!normalizedMessage) {
        return;
      }

      rememberPrompt(normalizedMessage);
      router.push(`/chat?q=${encodeURIComponent(normalizedMessage)}`);
    },
    [rememberPrompt, router],
  );

  const hasResults = status === "success" && result;
  const isConversation = mode === "chat";
  const handleSubmit = isConversation ? submit : startChat;
  const suggestionChips = useMemo(() => {
    const seen = new Set<string>();
    const starterPrompts = new Set(
      SIFTER_LANDING_STARTERS.map((starter) =>
        normalizePrompt(starter.prompt).toLowerCase(),
      ),
    );

    return [...recentPrompts, ...SIFTER_SUGGESTIONS]
      .map(normalizePrompt)
      .filter((suggestion) => {
        const key = suggestion.toLowerCase();
        if (!suggestion || seen.has(key) || starterPrompts.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [recentPrompts]);
  const materialDecoderGroups = useMemo(() => {
    if (!result) {
      return [];
    }

    return selectSifterMaterialDecoderGroups(
      [
        lastQuery,
        result.greeting,
        ...result.categories.map(getCategoryDecoderContext),
        ...result.shoppingTips,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }, [lastQuery, result]);

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
            <div className="flex items-center gap-2">
              <DiscountVault />
              <ThemeCycleButton />
            </div>
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
                <p className="mx-auto max-w-2xl text-base leading-7 text-slate-950/78 sm:text-lg dark:text-white/72">
                  Stop wasting money on clothes that fade, shrink, or look
                  cheap. Sifter turns what you want into material aware search
                  terms that help you find better products.
                </p>
              </div>

              <div className="w-full max-w-full min-w-0 p-2">
                <ChatInput
                  placeholder="Describe the exact item you want"
                  onSubmit={handleSubmit}
                />
              </div>

              <div className="w-full max-w-3xl space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {SIFTER_LANDING_STARTERS.map((starter) => (
                    <button
                      type="button"
                      key={starter.prompt}
                      onClick={() => void handleSubmit(starter.prompt)}
                      className="group min-w-0 rounded-xl border border-white/50 bg-white/68 p-4 text-left shadow-sm backdrop-blur transition duration-300 hover:border-blue-300/70 hover:bg-white/82 focus-visible:ring-[3px] focus-visible:ring-blue-500/25 focus-visible:outline-none dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.07]"
                    >
                      <span className="flex min-w-0 items-start justify-between gap-3">
                        <span className="min-w-0 space-y-1.5">
                          <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                            {starter.title}
                          </span>
                          <span className="block text-sm leading-5 text-slate-950/78 dark:text-white/76">
                            {starter.prompt}
                          </span>
                          <span className="block text-xs leading-5 text-slate-950/58 dark:text-white/52">
                            {starter.detail}
                          </span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition duration-300 group-hover:bg-blue-500">
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            strokeWidth={2}
                          />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 overflow-hidden py-1">
                  {suggestionChips.map((suggestion) => (
                    <Button
                      type="button"
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSubmit(suggestion)}
                      className="rounded-full border-slate-300/70 bg-white/56 px-4 shadow-sm backdrop-blur transition duration-300 hover:border-blue-300/70 hover:bg-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
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
              <div className="bg-background/92 sticky top-0 z-30 -mx-4 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
                <div className="mx-auto flex h-10 max-w-4xl items-center">
                  <Button
                    asChild
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted/70 hover:text-foreground h-9 rounded-full px-2.5 text-xs"
                  >
                    <Link href="/">
                      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                      Back
                    </Link>
                  </Button>
                </div>
              </div>

              {lastQuery ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-none sm:max-w-[72%]">
                    {lastQuery}
                  </div>
                </div>
              ) : null}

              <div className="min-w-0 space-y-3">
                <div className="flex min-w-0 items-center gap-2 px-1">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-none">
                    <SifterLogoMark className="h-5 w-4" />
                  </div>
                  <div className="truncate text-sm font-semibold">Sifter</div>
                </div>
                <div className="min-w-0">
                  {status === "idle" ? (
                    <div className="bg-muted/30 space-y-2 rounded-lg p-5 shadow-none sm:p-6">
                      <h2 className="text-base font-medium">
                        What should we sift?
                      </h2>
                      <p className="text-muted-foreground text-sm leading-6">
                        Ask for a product, material, or outfit and Sifter will
                        turn it into better marketplace search terms.
                      </p>
                    </div>
                  ) : null}

                  {status === "loading" ? (
                    <div className="bg-muted/30 space-y-4 rounded-lg p-5 shadow-none sm:p-6">
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
                    <div className="space-y-4 rounded-lg bg-red-500/[0.06] p-5 text-red-700 shadow-none sm:p-6 dark:text-red-300">
                      <div className="space-y-1">
                        <h2 className="text-base font-medium">Try again</h2>
                        <p className="text-muted-foreground text-sm leading-6">
                          {error}
                        </p>
                      </div>
                      {lastQuery ? (
                        <Button
                          onClick={() => void submit(lastQuery)}
                          className="rounded-lg bg-blue-600 text-white shadow-none hover:bg-blue-500"
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

                      <div className="border-t border-slate-200/70 pt-5 dark:border-white/10">
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

                      {materialDecoderGroups.length > 0 ? (
                        <div className="border-t border-slate-200/70 pt-5 dark:border-white/10">
                          <h3 className="text-base font-semibold">
                            Related material decoder
                          </h3>
                          <div className="mt-3 grid gap-5 sm:grid-cols-3">
                            {materialDecoderGroups.map((group) => (
                              <section key={group.title} className="min-w-0">
                                <h4 className="text-muted-foreground text-xs font-semibold tracking-normal">
                                  {group.title}
                                </h4>
                                <dl className="mt-2 grid gap-2.5 text-sm leading-6">
                                  {group.items.map((item) => (
                                    <div key={item.term} className="min-w-0">
                                      <dt className="font-medium break-words">
                                        {item.term}
                                      </dt>
                                      <dd className="text-muted-foreground text-xs leading-5 break-words">
                                        {item.meaning}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </section>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="sticky bottom-3 mt-auto pt-3">
                <ChatInput
                  compact
                  disabled={status === "loading"}
                  placeholder="Ask for another item or outfit"
                  onSubmit={handleSubmit}
                />
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
};
