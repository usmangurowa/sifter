"use client";

import { motion } from "framer-motion";

import { cn } from "@turbo/ui";
import { TypingAnimation } from "@turbo/ui/typing-animation";

interface WrappedSlideProps {
  /** Title text for the slide (typed animation) */
  title: string;
  /** Content to show after title animation */
  children: React.ReactNode;
  /** Optional CSS class */
  className?: string;
  /** Callback when title animation completes */
  onTitleComplete?: () => void;
  /** Background gradient class */
  gradient?: string;
}

/**
 * WrappedSlide - A full-height slide with typing title animation and reveal content.
 */
export const WrappedSlide = ({
  title,
  children,
  className,
  onTitleComplete,
  gradient = "from-background to-background",
}: WrappedSlideProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-8 bg-linear-to-b p-8",
        gradient,
        className,
      )}
    >
      <TypingAnimation
        className="text-center text-3xl font-bold tracking-tight md:text-5xl"
        typeSpeed={40}
        onComplete={onTitleComplete}
      >
        {title}
      </TypingAnimation>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: title.length * 0.04 + 0.3, duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default WrappedSlide;
