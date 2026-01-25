"use client";

import { motion } from "motion/react";

export const WellnessVisual = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      {/* Pulse Line */}
      <div className="relative w-full px-4">
        <svg
          viewBox="0 0 400 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-primary w-full drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
        >
          <motion.path
            d="M0 50 L100 50 L110 50 L120 20 L130 80 L140 50 L160 50 L170 30 L180 70 L190 50 L300 50"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0.5,
            }}
          />
          {/* Heartbeat Dot */}
          <motion.circle
            r="4"
            fill="currentColor"
            className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),1)]"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              cx: [0, 100, 110, 120, 130, 140, 160, 170, 180, 190, 300],
              cy: [50, 50, 50, 20, 80, 50, 50, 30, 70, 50, 50],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 0.5,
              times: [
                0, 0.222, 0.244, 0.315, 0.45, 0.52, 0.565, 0.614, 0.706, 0.756,
                1,
              ],
            }}
          />
        </svg>
      </div>

      {/* Status Overlay */}
      <div className="bg-background/80 border-border absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border px-4 py-1 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
            <span className="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
          </span>
          <span className="text-xs font-medium">In The Zone</span>
        </div>
      </div>
    </div>
  );
};
