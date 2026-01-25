"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "..";

interface NumberTickerProps {
  /** Target value to count to */
  value: number;
  /** Starting value (defaults to 0) */
  startValue?: number;
  /** Duration of animation in milliseconds */
  duration?: number;
  /** Number of decimal places */
  decimalPlaces?: number;
  /** Optional CSS class */
  className?: string;
  /** Whether to start animation when element comes into view */
  startOnView?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * NumberTicker - Animated counter that counts from startValue to value.
 *
 * @example
 * ```tsx
 * <NumberTicker value={1234} className="text-4xl font-bold" />
 * ```
 */
export const NumberTicker = ({
  value,
  startValue = 0,
  duration = 1500,
  decimalPlaces = 0,
  className,
  startOnView = true,
  onComplete,
}: NumberTickerProps) => {
  const [displayValue, setDisplayValue] = useState(startValue);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);

  // Start animation when in view
  useEffect(() => {
    if (!startOnView || hasStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  // Run counting animation
  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const difference = value - startValue;
    let animationId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
        onComplete?.();
      }
    };

    animationId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationId);
  }, [hasStarted, value, startValue, duration, onComplete]);

  const formattedValue = displayValue.toFixed(decimalPlaces);

  return (
    <span
      ref={ref}
      className={cn("tabular-nums", className)}
      aria-label={value.toString()}
    >
      {formattedValue}
    </span>
  );
};
