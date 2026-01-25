"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";

import { cn } from "@turbo/ui";
import { Icon } from "@turbo/ui/icon";

const TOASTS = [
  { text: "Refactored auth system", time: "2m ago" },
  { text: "Fixed landing page header", time: "15m ago" },
  { text: "Updated user profile schema", time: "1h ago" },
];

export const ContextVisual = () => {
  return (
    <div className="relative h-full w-full overflow-hidden p-8">
      {/* Background Gradient Mesh */}
      <div className="from-primary/5 absolute top-1/2 right-0 bottom-0 left-0 bg-gradient-to-t to-transparent" />

      {/* Floating Toasts */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 pb-4">
        {TOASTS.map((toast, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1 - i * 0.3,
              y: i * -15,
              scale: 1 - i * 0.05,
            }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-md",
              "border-border/50 bg-card/80",
            )}
            style={{ zIndex: TOASTS.length - i }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <Icon icon={CheckmarkCircle02Icon} size={14} />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium">{toast.text}</span>
              <span className="text-muted-foreground text-xs">
                {toast.time}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
