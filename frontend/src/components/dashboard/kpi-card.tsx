/**
 * KpiCard — single stat card in the KPI row.
 *
 * Spec:
 *   background:#fff, border-radius:14px, padding:16px 18px
 *   Icon chip: 32×32px, radius:9px
 *   Value: 28px/700/letter-spacing:-0.02em, accent color
 *   Label: 12px/500, #6B6474
 *
 * Optional props (Phase 10):
 *   href  — wraps the entire card in a Next.js <Link> (client-side nav only,
 *            never a plain <a>) with a subtle hover tint
 *   badge     — small pill shown top-right (e.g. "+2 new") for unread indicators
 *   chartData — array of {label, value} for the bottom mini bar chart;
 *               bars are proportional to the max value in the set, CSS only
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: number;
  /** Tabler icon class name e.g. "ti-users" */
  icon: string;
  /** CSS color for value text and icon */
  accent: string;
  /** CSS color for icon chip background */
  tint: string;
  /** If provided, wraps the card in a Next.js Link for client-side navigation */
  href?: string;
  /** If provided, shows a small badge top-right (e.g. "+2 new") */
  badge?: string;
  /** Mini bar chart data rendered at card bottom — purely CSS, no library */
  chartData?: Array<{ label: string; value: number }>;
}

export function KpiCard({ label, value, icon, accent, tint, href, badge, chartData }: KpiCardProps) {
  const inner = (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px 18px",
        position: "relative",
        cursor: href ? "pointer" : undefined,
        transition: href ? "background 0.12s" : undefined,
      }}
      className={href ? "kpi-card-clickable" : undefined}
    >
      {/* "New since last viewed" badge */}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: accent,
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.04em",
            borderRadius: 999,
            padding: "2px 7px",
            lineHeight: 1.6,
          }}
        >
          {badge}
        </div>
      )}

      {/* Icon chip */}
      <div
        className="flex items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 9, background: tint }}
      >
        <span
          className={cn("ti", icon)}
          style={{ fontSize: 17, color: accent, lineHeight: 1 }}
          aria-hidden="true"
        />
      </div>

      {/* Big number */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent,
          marginTop: 12,
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div
        style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", marginTop: 5 }}
      >
        {label}
      </div>

      {/* Mini bar chart */}
      {chartData && chartData.length > 0 && (() => {
        const max = Math.max(...chartData.map((d) => d.value), 1);
        const BAR_MAX_H = 24; // px
        return (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
              marginTop: 14,
              height: BAR_MAX_H,
              // leave room for the arrow in the bottom-right
              paddingRight: href ? 18 : 0,
            }}
          >
            {chartData.map((d, i) => (
              <div
                key={i}
                title={`${d.label}: ${d.value}`}
                style={{
                  flex: 1,
                  height: d.value === 0
                    ? 3
                    : Math.max(4, Math.round((d.value / max) * BAR_MAX_H)),
                  background: accent,
                  opacity: 0.45,
                  borderRadius: 2,
                  transition: "height 0.2s",
                }}
              />
            ))}
          </div>
        );
      })()}

      {/* Clickable indicator arrow */}
      {href && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            fontSize: 12,
            color: accent,
            opacity: 0.5,
          }}
          aria-hidden="true"
        >
          <span className="ti ti-arrow-right" />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block", borderRadius: 14 }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
