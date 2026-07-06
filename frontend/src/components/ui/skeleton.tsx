/**
 * Skeleton — layout-matched shimmer blocks. NEVER a spinner.
 *
 * Shapes:
 *   text     — thin horizontal bar (matches a line of text)
 *   circle   — square with avatar radius (rounded-square like Avatar)
 *   card     — tall rounded-card block
 *   custom   — pass explicit width/height
 *
 * The shimmer animation is defined in globals.css (.skeleton class).
 * These components just give you convenient preset shapes.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Base Skeleton ──────────────────────────────────────────────────────────

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, style }) => (
  <div className={cn("skeleton", className)} style={style} aria-hidden="true" />
);

Skeleton.displayName = "Skeleton";

// ─── Skeleton text line ──────────────────────────────────────────────────────

export interface SkeletonTextProps {
  /** Width as a Tailwind class or CSS value. Defaults to "100%". */
  width?: string;
  className?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({ width, className }) => (
  <Skeleton
    className={cn("h-3 rounded-sm", className)}
    style={{ width: width ?? "100%" }}
  />
);

SkeletonText.displayName = "SkeletonText";

// ─── Skeleton avatar (rounded-square) ───────────────────────────────────────

export interface SkeletonAvatarProps {
  size?: number; // px, default 38
}

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 38 }) => (
  <Skeleton
    style={{
      width: size,
      height: size,
      borderRadius: 12,
      flexShrink: 0,
    }}
  />
);

SkeletonAvatar.displayName = "SkeletonAvatar";

// ─── Skeleton card ────────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  height?: number; // px, default 80
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 80,
  className,
}) => (
  <Skeleton
    className={cn("w-full rounded-card", className)}
    style={{ height }}
  />
);

SkeletonCard.displayName = "SkeletonCard";

// ─── PatientCard skeleton (matches real card layout) ─────────────────────────

const SkeletonPatientCard: React.FC = () => (
  <div
    className="flex items-center gap-3 p-3 bg-surface border border-[#EEE8EF] rounded-card"
    aria-hidden="true"
  >
    <SkeletonAvatar size={38} />
    <div className="flex-1 min-w-0 space-y-2">
      <SkeletonText width="55%" />
      <SkeletonText width="40%" className="h-2.5" />
    </div>
    <SkeletonAvatar size={8} />
  </div>
);

SkeletonPatientCard.displayName = "SkeletonPatientCard";

// ─── Empty state ─────────────────────────────────────────────────────────────
// Invitation tone — names the space, no apology.

export interface EmptyStateProps {
  message: string;
  detail?: string;
  icon?: string; // Tabler icon class
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  detail,
  icon,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-2 py-10 text-center",
      className,
    )}
    role="status"
  >
    {icon && (
      <span
        className={cn("text-text-muted", icon)}
        style={{ fontSize: 22 }}
        aria-hidden="true"
      />
    )}
    <p className="text-body text-text-secondary">{message}</p>
    {detail && (
      <p className="text-meta text-text-muted">{detail}</p>
    )}
  </div>
);

EmptyState.displayName = "EmptyState";

// ─── Error state ─────────────────────────────────────────────────────────────
// Dashed border — used ONLY for errors, never anywhere else.

export interface ErrorStateProps {
  message?: string;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong. Please try again.",
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-2 p-6 text-center rounded-card",
      "border-error", // 1.5px dashed #C9BBDF — defined in globals.css
      className,
    )}
    role="alert"
  >
    <span
      className="ti ti-alert-triangle text-text-muted"
      style={{ fontSize: 20 }}
      aria-hidden="true"
    />
    <p className="text-body-sm text-text-secondary">{message}</p>
  </div>
);

ErrorState.displayName = "ErrorState";

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonPatientCard,
  EmptyState,
  ErrorState,
};
