"use client";

import { useRef, useState } from "react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@turbo/ui/button";
import { Textarea } from "@turbo/ui/textarea";

interface ChatInputProps {
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (message: string) => void;
}

export const ChatInput = ({
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
      className={[
        "bg-background/80 ring-border/70 focus-within:ring-primary/50 flex items-end gap-2 rounded-3xl p-2 shadow-2xl ring-1 backdrop-blur",
        invalid ? "animate-shake ring-destructive/60" : "",
      ].join(" ")}
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
        className="max-h-32 min-h-14 flex-1 border-0 bg-transparent px-4 py-4 text-base shadow-none ring-0 focus-visible:ring-0"
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        onClick={submit}
        className="size-12 rounded-full"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
};
