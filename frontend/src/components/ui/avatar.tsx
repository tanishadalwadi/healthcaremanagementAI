/**
 * Avatar — rounded-square, NEVER circular.
 *
 * Spec:
 *   background: #EFE7F7 (primary-tint)
 *   text color:  #7C5FAE (primary)
 *   border-radius: 12px  (avatar token — deliberately not rounded-full)
 *   sizes: sm 32×32 / md 38×38 (default, PatientCard compact) / lg 40×40 (expandable) / xl 46×46 (detail header)
 *   font: initials, Hanken Grotesk, weight 600
 *
 * If an image src is provided it fills the avatar (still rounded-square).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { px: number; fontSize: string }> = {
  sm: { px: 32, fontSize: "11px" },
  md: { px: 38, fontSize: "13px" },
  lg: { px: 40, fontSize: "13px" },
  xl: { px: 46, fontSize: "15px" },
};

export interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  src?: string;
  alt?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  initials,
  size = "md",
  src,
  alt,
  className,
}) => {
  const { px, fontSize } = SIZE_MAP[size];

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden", className)}
      style={{
        width: px,
        height: px,
        borderRadius: 12,   // rounded-square — never rounded-full
        backgroundColor: "#EFE7F7",
        flexShrink: 0,
      }}
      aria-label={alt ?? initials}
      role="img"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? initials}
          className="w-full h-full object-cover"
          style={{ borderRadius: 12 }}
        />
      ) : (
        <span
          className="font-sans font-semibold select-none leading-none"
          style={{
            fontSize,
            color: "#7C5FAE",
            letterSpacing: "0.02em",
          }}
          aria-hidden="true"
        >
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
};

Avatar.displayName = "Avatar";

export { Avatar, type AvatarSize };
