"use client";

import { motion } from "motion/react";

import { cn } from "@turbo/ui";

const MEMBERS = [
  { name: "Alex", color: "bg-blue-500", initials: "AL" },
  { name: "Sarah", color: "bg-purple-500", initials: "SA" },
  { name: "Mike", color: "bg-orange-500", initials: "MI" },
  { name: "You", color: "bg-green-500", initials: "ME" },
];

export const SquadVisual = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-8">
      {/* Background Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />

      <div className="relative grid grid-cols-2 gap-4">
        {MEMBERS.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: i * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ring-2 ring-white/10",
                  member.color,
                )}
              >
                {member.initials}
              </div>
              <motion.div
                className={cn(
                  "border-background absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2",
                  i === 3 ? "bg-green-500" : "bg-gray-400",
                )}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: i === 3 ? Infinity : 0,
                  delay: i * 0.2,
                }}
              />
            </div>
          </motion.div>
        ))}

        {/* Connection Lines (CSS-only approximation for simplicity) */}
        <div className="bg-border/50 absolute top-1/2 left-1/2 -z-10 h-[1px] w-full -translate-x-1/2 -translate-y-1/2" />
        <div className="bg-border/50 absolute top-1/2 left-1/2 -z-10 h-full w-[1px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card/50 mt-8 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Squad Active Now
      </motion.div>
    </div>
  );
};
