import { useId } from "react";

import { cn } from "@turbo/ui";

interface SparklineProps {
  /** Array of values to visualize (e.g., heartbeat counts per interval) */
  data: number[];
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Stroke color (CSS color or Tailwind class) */
  strokeColor?: string;
  /** Fill color with opacity for area under curve */
  fillColor?: string;
  /** Additional className for the container */
  className?: string;
}

/**
 * Sparkline - A minimal line chart for visualizing activity patterns
 *
 * @example
 * <Sparkline data={[1, 3, 8, 5, 2, 0, 4, 7]} height={24} />
 */
export const Sparkline = ({
  data,
  width = 120,
  height = 24,
  strokeColor = "currentColor",
  fillColor = "currentColor",
  className,
}: SparklineProps) => {
  const id = useId();

  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data, 1); // Avoid division by zero
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  // Normalize data to 0-1 range
  const normalizedData = data.map((value) => (value - min) / range);

  // Calculate points for the path
  const stepX = width / (data.length - 1 || 1);
  const padding = 2; // Small vertical padding

  const points = normalizedData.map((value, index) => ({
    x: index * stepX,
    y: height - padding - value * (height - padding * 2),
  }));

  // Create smooth curve path using line segments
  const createPath = () => {
    if (points.length < 2) {
      const p = points[0];
      return `M ${p?.x ?? 0} ${p?.y ?? height}`;
    }

    const first = points[0];
    let path = `M ${first?.x ?? 0} ${first?.y ?? height}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      if (current) {
        path += ` L ${current.x} ${current.y}`;
      }
    }

    return path;
  };

  // Create fill path (closed area under the line)
  const createFillPath = () => {
    const linePath = createPath();
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      {/* Gradient definition for fade effect */}
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area under the curve */}
      <path d={createFillPath()} fill={`url(#${id})`} />

      {/* Line stroke */}
      <path
        d={createPath()}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </svg>
  );
};
