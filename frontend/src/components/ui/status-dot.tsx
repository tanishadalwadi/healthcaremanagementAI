/**
 * StatusDot — on-track and delayed ONLY.
 *
 * Hard rule: on-track / delayed are ONLY ever this small quiet dot.
 * Never a badge. Never used for blocked / critical.
 *
 * Always paired with a text label (never dot-only — clinical stakes).
 * Size: 8px diameter.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type DotStatus = "ontrack" | "delayed";

const DOT_COLORS: Record<DotStatus, string> = {
  ontrack: "#4FB5A8",
  delayed: "#E08A4F",
};

const DOT_LABELS: Record<DotStatus, string> = {
  ontrack: "On track",
  delayed: "Delayed",
};

export interface StatusDotProps {
  status: DotStatus;
  /** Whether to show the text label alongside the dot. Default: true. */
  showLabel?: boolean;
  className?: string;
}

const StatusDot: React.FC<StatusDotProps> = ({
  status,
  showLabel = true,
  className,
}) => {
  const color = DOT_COLORS[status];
  const label = DOT_LABELS[status];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="status"
      aria-label={label}
    >
      {/* The dot itself */}
      <span
        className="shrink-0 rounded-full"
        style={{
          width: 8,
          height: 8,
          backgroundColor: color,
        }}
        aria-hidden="true"
      />
      {showLabel && (
        <span
          className="text-meta"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </span>
  );
};

StatusDot.displayName = "StatusDot";

export { StatusDot, type DotStatus };
