/**
 * DischargeReadinessChecklist
 *
 * Replaces the single "blocked reason" field. Multi-condition checklist:
 *   Physician approval / Medication prepared / Transportation /
 *   Patient education / Insurance approval
 *
 * Each condition is independently:
 *   complete   → teal check icon, normal text
 *   incomplete → slate X, left-border accent, elapsed time, owning dept
 *
 * Always shows "X of Y complete" count, rendered as a StatusBadge if
 * overall status is blocked.
 *
 * This component is display-only — status changes come through lib/api.ts.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DischargeCondition } from "@/types";

export interface DischargeChecklistProps {
  conditions: DischargeCondition[];
  /** Overall patient status — used to decide whether to show Blocked badge */
  patientStatus: "ontrack" | "delayed" | "blocked" | "critical";
  className?: string;
}

export const DischargeReadinessChecklist: React.FC<DischargeChecklistProps> = ({
  conditions,
  patientStatus,
  className,
}) => {
  const complete = conditions.filter((c) => c.status === "complete");
  const incomplete = conditions.filter((c) => c.status === "incomplete");
  const isBlocked = patientStatus === "blocked";

  return (
    <div className={cn("space-y-1", className)}>
      {/* Header: section label + count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-caption text-text-muted">Discharge readiness</span>
        <div className="flex items-center gap-2">
          <span className="text-meta text-text-muted">
            <span className="font-mono font-[600] text-text-secondary">
              {complete.length}
            </span>
            {" of "}
            <span className="font-mono">{conditions.length}</span>
            {" complete"}
          </span>
          {isBlocked && <StatusBadge status="blocked" />}
        </div>
      </div>

      {/* Condition rows */}
      {conditions.map((condition) => {
        const isDone = condition.status === "complete";
        return (
          <div
            key={condition.id}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-[8px]",
              isDone ? "bg-surface-alt" : "bg-surface",
              // Incomplete gets a left-border accent (slate color)
              !isDone && "border border-[#EEE8EF]",
            )}
            style={
              !isDone
                ? { borderLeft: "2.5px solid #4A4458" }
                : undefined
            }
          >
            {/* Check / X icon */}
            <span
              className={cn(
                "shrink-0 mt-0.5",
                isDone ? "ti ti-circle-check" : "ti ti-circle-x",
              )}
              style={{
                fontSize: 15,
                color: isDone ? "#4FB5A8" : "#4A4458",
              }}
              aria-hidden="true"
            />

            {/* Condition name + metadata */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-[500] leading-tight",
                  isDone ? "text-text-muted" : "text-text-secondary",
                )}
                style={{ fontSize: 12 }}
              >
                {condition.condition}
              </p>

              {/* Owning dept + elapsed time for incomplete conditions */}
              {!isDone && (
                <p className="text-micro text-text-muted mt-0.5">
                  {condition.owningDepartment}
                  {condition.elapsedDisplay && (
                    <>
                      {" · "}
                      <span className="font-mono">{condition.elapsedDisplay}</span>
                      {" elapsed"}
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Done timestamp */}
            {isDone && (
              <span className="shrink-0 text-micro text-text-muted font-mono">
                Done
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

DischargeReadinessChecklist.displayName = "DischargeReadinessChecklist";
