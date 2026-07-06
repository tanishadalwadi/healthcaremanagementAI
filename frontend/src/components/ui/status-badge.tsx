/**
 * StatusBadge — blocked and critical ONLY.
 *
 * Hard rule: blocked / critical are ONLY ever this solid badge with square corners.
 * Never a bare dot. Never used for on-track / delayed.
 *
 * Visual: solid tint background + matching text, borderRadius: 0 (square corners),
 * 2px left-border accent in the status color. The parent PatientCard adds its own
 * matching left border — that's the card's responsibility, not this component's.
 *
 * Background and text use explicit Tailwind token classes (not inline styles)
 * to ensure they're always applied regardless of specificity context.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusDot, type DotStatus } from "./status-dot";
import type { PatientStatus } from "@/types";

type BadgeStatus = "blocked" | "critical";

// Tailwind classes — using our tint-* and badge-text-* tokens from tailwind.config.ts
const BADGE_CLASSES: Record<BadgeStatus, { wrapper: string; border: string; label: string }> = {
  blocked: {
    wrapper: "bg-tint-blocked text-badge-text-blocked",
    border: "border-l-[2px] border-l-status-blocked",
    label: "Blocked",
  },
  critical: {
    wrapper: "bg-tint-critical text-badge-text-critical",
    border: "border-l-[2px] border-l-status-critical",
    label: "Critical",
  },
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  /** Override the label text (e.g. "2 of 5 complete") */
  label?: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const { wrapper, border, label: defaultLabel } = BADGE_CLASSES[status];
  const displayLabel = label ?? defaultLabel;

  return (
    <span
      className={cn(
        // Layout
        "inline-flex items-center",
        "px-2 py-[3px]",
        // Square corners — hard rule for blocked/critical
        "rounded-none",
        // Typography — explicit atomics instead of text-caption to avoid
        // twMerge dropping it when combined with text-{color} classes.
        "text-[10px] font-semibold uppercase tracking-[0.14em] leading-none",
        // Solid tint background + text via Tailwind token classes
        wrapper,
        // Left-border accent
        border,
        className,
      )}
      role="status"
      aria-label={displayLabel}
    >
      {displayLabel}
    </span>
  );
};

StatusBadge.displayName = "StatusBadge";

// ─── StatusIndicator ─────────────────────────────────────────────────────────
// Convenience wrapper: routes any PatientStatus to the correct primitive.
// Use this instead of branching between StatusDot / StatusBadge manually.

export interface StatusIndicatorProps {
  status: PatientStatus;
  showLabel?: boolean;
  /** Custom label for badge statuses */
  badgeLabel?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = true,
  badgeLabel,
  className,
}) => {
  if (status === "ontrack" || status === "delayed") {
    return (
      <StatusDot status={status as DotStatus} showLabel={showLabel} className={className} />
    );
  }
  return (
    <StatusBadge status={status as BadgeStatus} label={badgeLabel} className={className} />
  );
};

StatusIndicator.displayName = "StatusIndicator";

export { StatusBadge, StatusIndicator, type BadgeStatus };
