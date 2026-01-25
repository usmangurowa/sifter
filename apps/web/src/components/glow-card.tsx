"use client";

import type React from "react";

import { cn } from "@turbo/ui";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error";
}

export function GlowCard({
  className,
  variant = "default",
  children,
  ...props
}: GlowCardProps) {
  const variantStyles = {
    default: "from-primary-500/20 to-primary-500/0 shadow-primary-500/10",
    success: "from-emerald-500/20 to-emerald-500/0 shadow-emerald-500/10",
    warning: "from-amber-500/20 to-amber-500/0 shadow-amber-500/10",
    error: "from-red-500/20 to-red-500/0 shadow-red-500/10",
  };

  const borderStyles = {
    default: "bg-primary-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "bg-card/50 relative overflow-hidden rounded-xl border border-white/5 p-6 backdrop-blur-3xl transition-all duration-500 hover:border-white/10",
        // Glow effect
        `shadow-[0_0_40px_-10px] ${variantStyles[variant]}`,
        className,
      )}
      {...props}
    >
      {/* Top Gradient Line */}
      <div
        className={cn(
          "absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50",
          // We can use a pseudo-element or a child for the specific top glow if needed,
          // but for now, let's try a subtle gradient overlay
        )}
      />

      {/* Dynamic Border/Glow Blob */}
      <div
        className={cn(
          "pointer-events-none absolute -top-20 right-0 left-0 mx-auto h-40 w-3/4 opacity-20 blur-[60px]",
          borderStyles[variant],
        )}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
