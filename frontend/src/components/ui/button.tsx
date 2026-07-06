/**
 * Button — 5 variants per Pulse design spec.
 *
 * Rules baked in:
 * - Primary:   #7C5FAE bg, hover #6E4FA3 (bg change allowed on filled buttons)
 * - Secondary: white bg, #C9BBDF border, hover border → #7C5FAE (border-only shift)
 * - Ghost:     transparent, hover border → #E0D8E4
 * - Danger:    #DC2626 bg, hover #C41F1F
 * - Disabled:  #EFEBEF bg, #B7B0BD text, cursor-not-allowed (use this variant, not
 *              the disabled HTML attribute, so you can still attach tooltips etc.)
 *
 * Loading state: shows a skeleton-shimmer span in place of content — never a spinner.
 * Max ONE Primary button per screen (enforced by convention, not by code).
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base — shared across all variants
  [
    "inline-flex items-center justify-center gap-2",
    "text-body font-sans font-[500]",        // 13px/500
    "rounded-button",                         // 10px
    "border transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
    "disabled:pointer-events-none",
    "select-none whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-white border-primary",
          "hover:bg-[#6E4FA3] hover:border-[#6E4FA3]",
        ].join(" "),

        secondary: [
          "bg-surface text-primary border-hover-tint",
          "hover:border-primary",
        ].join(" "),

        ghost: [
          "bg-transparent text-text-secondary border-transparent",
          "hover:border-[#E0D8E4]",
        ].join(" "),

        danger: [
          "bg-danger text-white border-danger",
          "hover:bg-danger-hover hover:border-danger-hover",
        ].join(" "),

        disabled: [
          "bg-disabled-bg text-disabled-text border-disabled-border",
          "cursor-not-allowed pointer-events-none",
        ].join(" "),
      },

      size: {
        default: "px-[18px] py-[10px]",
        sm: "px-3 py-2 text-[12px]",
        icon: "h-9 w-9 p-0",           // square icon button
      },
    },

    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || variant === "disabled" || loading;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          // Loading = skeleton shimmer block, never a spinner
          <span
            className="skeleton inline-block rounded-sm"
            style={{ width: "4.5rem", height: "0.75rem" }}
            aria-hidden="true"
          />
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
