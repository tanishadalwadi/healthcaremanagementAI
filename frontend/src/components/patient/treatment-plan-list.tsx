/**
 * TreatmentPlanList — ordered checklist.
 *
 * Done items:   filled purple-tint check chip + muted text (no strikethrough)
 * Pending items: empty outlined square + full-weight dark text
 *
 * Eyebrow caption header above the list.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TreatmentPlanItem } from "@/types";

export interface TreatmentPlanListProps {
  items: TreatmentPlanItem[];
  className?: string;
}

export const TreatmentPlanList: React.FC<TreatmentPlanListProps> = ({
  items,
  className,
}) => (
  <div className={cn("space-y-0.5", className)}>
    <p className="text-caption text-text-muted mb-3">Treatment plan</p>

    {[...items]
      .sort((a, b) => a.order - b.order)
      .map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2.5 py-1.5"
        >
          {/* Check chip (done) or outlined square (pending) */}
          {item.completed ? (
            <span
              className="shrink-0 inline-flex items-center justify-center mt-0.5"
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: "#EFE7F7", // primary-tint
              }}
              aria-label="Completed"
            >
              <span
                className="ti ti-check"
                style={{ fontSize: 10, color: "#7C5FAE" }}
                aria-hidden="true"
              />
            </span>
          ) : (
            <span
              className="shrink-0 inline-block mt-0.5"
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: "1.5px solid #C9BBDF",
              }}
              aria-label="Pending"
            />
          )}

          {/* Description */}
          <p
            className={cn(
              "leading-snug flex-1",
              item.completed
                ? "text-text-muted"   // muted, no strikethrough per spec
                : "text-text-secondary font-[500]",
            )}
            style={{ fontSize: 12 }}
          >
            {item.description}
          </p>
        </div>
      ))}
  </div>
);

TreatmentPlanList.displayName = "TreatmentPlanList";
