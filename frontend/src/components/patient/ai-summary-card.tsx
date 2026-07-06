/**
 * AISummaryCard — inset panel, not a bordered card.
 *
 * Spec:
 *   background: #EFEBEF (surface-alt), border-radius: 12px
 *   NO border, NO shadow
 *   Sparkle icon + "AI summary" eyebrow in #7C5FAE
 *   One sentence body in #4A4458 (status-blocked color — slate, not muted)
 *
 * Hard rule: the summary prop MUST cite a specific logged data point and
 * timestamp — the generator enforces this in mock data; enforce by prop
 * naming convention here (not runtime validation).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AISummaryCardProps {
  /**
   * One sentence, must cite a specific data point + timestamp.
   * Example: "Troponin peaked at 2.1 ng/mL at 07:45 this morning; repeat ECG ordered."
   */
  summary: string;
  className?: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  summary,
  className,
}) => (
  <div
    className={cn("px-4 py-3.5", className)}
    style={{
      backgroundColor: "#EFEBEF",
      borderRadius: 12,
    }}
  >
    {/* Eyebrow: sparkle icon + "AI summary" label */}
    <div className="flex items-center gap-1.5 mb-2">
      <span
        className="ti ti-sparkles"
        style={{ fontSize: 13, color: "#7C5FAE" }}
        aria-hidden="true"
      />
      <span className="text-caption" style={{ color: "#7C5FAE" }}>
        AI summary
      </span>
    </div>

    {/* Body — one sentence, cites specific data */}
    <p
      className="leading-relaxed"
      style={{ fontSize: 12, color: "#4A4458", fontWeight: 500 }}
    >
      {summary}
    </p>
  </div>
);

AISummaryCard.displayName = "AISummaryCard";
