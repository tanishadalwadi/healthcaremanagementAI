/**
 * Select — Pulse design spec.
 *
 * Same visual treatment as Input: 4px radius, border-tint hover, focus ring.
 * Built on a native <select> for accessibility; styled to match.
 * Chevron icon via Tabler (ti-chevron-down).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  loading?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, loading, ...props }, ref) => {
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
        <select
          ref={ref}
          className={cn(
            // Layout
            "w-full h-[38px] appearance-none bg-surface",
            "pl-3 pr-9",
            // Typography
            "text-body text-text-primary",
            // Border
            "border border-[#EEE8EF] rounded-input",
            // Transitions
            "transition-colors duration-150",
            // States
            "hover:border-hover-tint",
            "focus:outline-none focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // Cursor
            "cursor-pointer",
            // Error
            error && "border-error",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <span
          className="ti ti-chevron-down absolute right-3 text-text-muted pointer-events-none"
          style={{ fontSize: "14px", lineHeight: 1 }}
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
