// ─── Pulse UI primitives — Phase 2 ───────────────────────────────────────────
// All components re-exported from here. Consumers import from "@/components/ui".

export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Select } from "./select";
export type { SelectProps, SelectOption } from "./select";

export { Toggle } from "./toggle";
export type { ToggleProps } from "./toggle";

export { StatusDot } from "./status-dot";
export type { StatusDotProps, DotStatus } from "./status-dot";

export { StatusBadge, StatusIndicator } from "./status-badge";
export type {
  StatusBadgeProps,
  StatusIndicatorProps,
  BadgeStatus,
} from "./status-badge";

export { Avatar } from "./avatar";
export type { AvatarProps, AvatarSize } from "./avatar";

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonPatientCard,
  EmptyState,
  ErrorState,
} from "./skeleton";
export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonAvatarProps,
  SkeletonCardProps,
  EmptyStateProps,
  ErrorStateProps,
} from "./skeleton";
