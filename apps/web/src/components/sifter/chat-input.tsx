"use client";

import { useRef, useState } from "react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@turbo/ui";
import { Button } from "@turbo/ui/button";
import { Textarea } from "@turbo/ui/textarea";

interface ChatInputProps {
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
  onSubmit: (message: string) => void;
}

export const ChatInput = ({
  compact = false,
  disabled = false,
  placeholder = "What are you looking for?",
  onSubmit,
}: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  };

  const submit = () => {
    const message = value.trim();
    if (!message) {
      setInvalid(true);
      window.setTimeout(() => setInvalid(false), 350);
      return;
    }

    onSubmit(message);
    setValue("");
    window.setTimeout(resize);
  };

  return (
    <div
      data-slot="sifter-chat-input"
      className={cn(
        "group relative flex items-center gap-2 overflow-hidden rounded-[2rem] border border-white/10 bg-white/85 p-2 shadow-[0_24px_90px_-44px_rgba(15,23,42,0.8)] ring-1 ring-slate-950/5 backdrop-blur-2xl transition duration-300 dark:border-white/10 dark:bg-zinc-900/82 dark:shadow-[0_28px_100px_-54px_rgba(37,99,235,0.85)] dark:ring-white/10",
        "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent dark:before:via-white/20",
        "focus-within:border-blue-400/40 focus-within:ring-4 focus-within:ring-blue-500/15",
        "w-full max-w-full min-w-0",
        compact ? "rounded-[1.75rem] shadow-xl" : "",
        invalid
          ? "animate-shake border-destructive/60 ring-destructive/30"
          : "",
      )}
    >
      <Textarea
        ref={textareaRef}
        aria-label="Shopping request"
        maxLength={500}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          resize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        className={cn(
          "placeholder:text-muted-foreground/75 relative z-10 max-h-32 flex-1 resize-none border-0 bg-transparent px-4 text-base shadow-none ring-0 focus-visible:ring-0",
          "min-w-0",
          compact ? "min-h-12 py-3.5" : "min-h-16 py-5",
        )}
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        onClick={submit}
        className={cn(
          "relative z-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:scale-[1.03] hover:from-blue-400 hover:to-indigo-500 dark:shadow-blue-500/20",
          "self-center",
          compact ? "size-11" : "size-12",
        )}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
};
