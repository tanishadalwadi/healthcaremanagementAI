/**
 * Toggle — pill switch, Pulse design spec.
 *
 * Track: #EFEBEF (off) → #7C5FAE (on)
 * Thumb: white circle
 * Transition: 150ms
 * No box-shadow (hard rule).
 * Always paired with a visible label (clinical stakes of icon-only).
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Label position relative to the switch */
  labelPosition?: "left" | "right";
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  labelPosition = "right",
  disabled = false,
  className,
  id,
}) => {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  const track = (
    <button
      role="switch"
      id={switchId}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        // Track
        "relative inline-flex shrink-0 items-center",
        "w-10 h-6 rounded-full",
        "border-2 border-transparent",
        "transition-colors duration-150",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-surface-alt",
      )}
    >
      {/* Thumb */}
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-surface",
          "transform transition-transform duration-150",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );

  const labelEl = (
    <label
      htmlFor={switchId}
      className={cn(
        "text-body text-text-primary cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {label}
    </label>
  );

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {labelPosition === "left" && labelEl}
      {track}
      {labelPosition === "right" && labelEl}
    </div>
  );
};

Toggle.displayName = "Toggle";

export { Toggle };
