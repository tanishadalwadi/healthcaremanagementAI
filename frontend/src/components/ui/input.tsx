/**
 * Input — Pulse design spec.
 *
 * Radius: 4px (rounded-input)
 * Border: 1px solid #EEE8EF default → #C9BBDF on hover → #7C5FAE on focus
 * Error state: 1.5px dashed #C9BBDF (applies .border-error class)
 * Loading: skeleton shimmer block replacing the input
 * No background change on hover — border-tint shift only.
 *
 * Supports optional leading icon slot (e.g. search icon).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Tabler icon class name, e.g. "ti-search". Renders left of the input text. */
  icon?: string;
  error?: boolean;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, loading, type, ...props }, ref) => {
    if (loading) {
      return (
        <div
          className="skeleton rounded-input"
          style={{ height: "38px", width: "100%" }}
          aria-hidden="true"
        />
      );
    }

    return (
      <div className="relative flex items-center">
        {icon && (
          <span
            className={cn(
              "absolute left-3 text-text-muted pointer-events-none",
              icon,
            )}
            style={{ fontSize: "15px", lineHeight: 1 }}
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          type={type ?? "text"}
          className={cn(
            // Layout
            "w-full h-[38px] bg-surface",
            icon ? "pl-9 pr-3" : "px-3",
            // Typography
            "text-body text-text-primary placeholder:text-text-muted",
            // Border
            "border border-[#EEE8EF] rounded-input",
            // Transitions
            "transition-colors duration-150",
            // States
            "hover:border-hover-tint",
            "focus:outline-none focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // Error — dashed border, used exclusively for errors
            error && "border-error",
            className,
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
