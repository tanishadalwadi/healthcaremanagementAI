"use client";

/**
 * WorkflowTimeline — vertical 3-phase timeline.
 *
 * One shared guideline (border-left: 2px solid #ECE6EE) connects all phases.
 * Each event has a small dot on the guideline.
 *
 * Intake & diagnosis:
 *   Every step shown fully and linearly — no collapsing.
 *
 * Inpatient care:
 *   Collapsed by default: shows event count + flagged exception row if any.
 *   "Show all" expands to full chronological event list (most recent first).
 *
 * Discharge:
 *   Status badge + discharge note. If blocked, states reason plainly.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusIndicator } from "@/components/ui/status-badge";
import { DischargeReadinessChecklist } from "@/components/patient/discharge-checklist";
import type { WorkflowGroup, WorkflowStep, PatientStatus, DischargeCondition } from "@/types";
import { timeOfDay, shortDate, relativeTime } from "@/lib/format";

// ─── Shared guideline dot ─────────────────────────────────────────────────────

const DOT_COLORS: Record<PatientStatus, string> = {
  ontrack: "#4FB5A8",
  delayed: "#E08A4F",
  blocked: "#4A4458",
  critical: "#DC2626",
};

interface TimelineDot {
  status: PatientStatus;
  completed: boolean;
}

const TimelineDot: React.FC<TimelineDot> = ({ status, completed }) => (
  <span
    className="shrink-0 rounded-full border-2 border-surface"
    style={{
      width: 10,
      height: 10,
      backgroundColor: completed ? DOT_COLORS[status] : "#D4CDD9",
      zIndex: 1,
    }}
    aria-hidden="true"
  />
);

// ─── Phase section header ─────────────────────────────────────────────────────

interface PhaseLabelProps {
  label: string;
  status: PatientStatus;
}

const PhaseLabel: React.FC<PhaseLabelProps> = ({ label, status }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-caption text-text-muted">{label}</span>
    <StatusIndicator status={status} showLabel={false} />
  </div>
);

// ─── Single step row in the timeline ─────────────────────────────────────────

interface TimelineStepRowProps {
  step: WorkflowStep;
  isLast?: boolean;
}

const TimelineStepRow: React.FC<TimelineStepRowProps> = ({ step, isLast }) => {
  const completed = !!step.completedAt;

  return (
    <div className="flex gap-3">
      {/* Guideline + dot */}
      <div className="flex flex-col items-center" style={{ width: 10 }}>
        <TimelineDot status={step.status} completed={completed} />
        {!isLast && (
          <div
            className="flex-1 mt-0.5"
            style={{ width: 2, backgroundColor: "#ECE6EE", minHeight: 20 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className={cn(
                "font-sans font-[500] leading-tight",
                completed ? "text-text-muted" : "text-text-secondary",
              )}
              style={{ fontSize: 12 }}
            >
              {step.name}
              {step.occurrence > 1 && (
                <span className="text-text-muted font-mono ml-1">
                  #{step.occurrence}
                </span>
              )}
            </span>
            {step.note && (
              <p
                className={cn(
                  "mt-0.5 leading-snug",
                  step.status === "delayed" ? "text-status-delayed" : "text-status-critical",
                )}
                style={{ fontSize: 11 }}
              >
                {step.note}
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            {/* Timestamp in monospace */}
            <span
              className="font-mono text-text-muted"
              style={{ fontSize: 10 }}
            >
              {completed && step.completedAt
                ? timeOfDay(step.completedAt)
                : timeOfDay(step.scheduledAt)}
            </span>
            {step.status !== "ontrack" && (
              <StatusIndicator status={step.status} showLabel={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Inpatient collapsed summary row ─────────────────────────────────────────

interface InpatientSummaryProps {
  group: WorkflowGroup;
  onExpand: () => void;
}

const InpatientSummary: React.FC<InpatientSummaryProps> = ({
  group,
  onExpand,
}) => {
  const flagged = group.steps.filter((s) => s.flagged);

  return (
    <div className="flex-1 pb-3 min-w-0 space-y-1.5">
      <p className="text-meta text-text-muted">
        <span className="font-mono">{group.eventCount}</span>
        {" events logged"}
        {flagged.length > 0 && (
          <span className="text-status-delayed">
            {" · "}
            <span className="font-mono">{flagged.length}</span>
            {" flagged"}
          </span>
        )}
      </p>

      {/* Flagged exception preview */}
      {flagged.map((step) => (
        <div
          key={step.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-[6px]"
          style={{ backgroundColor: "#FBE9DA" }}
        >
          <span
            className="ti ti-clock-exclamation text-status-delayed shrink-0"
            style={{ fontSize: 13 }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 11, color: "#9A6435" }}>
            {step.note ?? step.name}
          </span>
        </div>
      ))}

      <button
        type="button"
        onClick={onExpand}
        className="text-meta text-primary hover:underline focus-visible:outline-none"
      >
        Show all events
      </button>
    </div>
  );
};

// ─── WorkflowTimeline ────────────────────────────────────────────────────────

export interface WorkflowTimelineProps {
  workflowGroups: WorkflowGroup[];
  /** Required for the Discharge phase — renders the real checklist component */
  dischargeConditions: DischargeCondition[];
  patientStatus: PatientStatus;
  className?: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  workflowGroups,
  dischargeConditions,
  patientStatus,
  className,
}) => {
  const [inpatientExpanded, setInpatientExpanded] = React.useState(false);

  return (
    <div className={cn("space-y-6", className)}>
      {workflowGroups.map((group, gi) => {
        const isLast = gi === workflowGroups.length - 1;

        return (
          <div key={group.phase}>
            <PhaseLabel label={group.label} status={group.status} />

            {/* Intake — all steps, fully linear */}
            {group.phase === "intake" && (
              <div>
                {group.steps.map((step, i) => (
                  <TimelineStepRow
                    key={step.id}
                    step={step}
                    isLast={i === group.steps.length - 1 && isLast}
                  />
                ))}
              </div>
            )}

            {/* Inpatient — collapsed or expanded */}
            {group.phase === "inpatient" && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 10 }}>
                  <TimelineDot
                    status={group.status}
                    completed={group.status === "ontrack"}
                  />
                  <div
                    className="flex-1 mt-0.5"
                    style={{ width: 2, backgroundColor: "#ECE6EE", minHeight: 20 }}
                  />
                </div>

                {!inpatientExpanded ? (
                  <InpatientSummary
                    group={group}
                    onExpand={() => setInpatientExpanded(true)}
                  />
                ) : (
                  <div className="flex-1 min-w-0 pb-3 space-y-0">
                    {/* Chronological full list, most recent first */}
                    {[...group.steps]
                      .sort(
                        (a, b) =>
                          new Date(b.scheduledAt).getTime() -
                          new Date(a.scheduledAt).getTime(),
                      )
                      .map((step, i, arr) => (
                        <div key={step.id} className="flex gap-3">
                          <div
                            className="flex flex-col items-center"
                            style={{ width: 10 }}
                          >
                            <span
                              className="shrink-0 rounded-full"
                              style={{
                                width: 6,
                                height: 6,
                                backgroundColor: step.completedAt
                                  ? DOT_COLORS[step.status]
                                  : "#D4CDD9",
                                marginTop: 3,
                              }}
                              aria-hidden="true"
                            />
                            {i < arr.length - 1 && (
                              <div
                                className="flex-1"
                                style={{
                                  width: 2,
                                  backgroundColor: "#ECE6EE",
                                  minHeight: 16,
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 pb-2 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "font-[500]",
                                  step.completedAt
                                    ? "text-text-muted"
                                    : "text-text-secondary",
                                )}
                                style={{ fontSize: 11 }}
                              >
                                {step.name}
                              </span>
                              <span
                                className="font-mono text-text-muted shrink-0"
                                style={{ fontSize: 10 }}
                              >
                                {shortDate(step.scheduledAt)}{" "}
                                {timeOfDay(step.scheduledAt)}
                              </span>
                            </div>
                            {step.note && (
                              <p
                                className="text-status-delayed mt-0.5"
                                style={{ fontSize: 10 }}
                              >
                                {step.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    <button
                      type="button"
                      onClick={() => setInpatientExpanded(false)}
                      className="text-meta text-primary hover:underline focus-visible:outline-none mt-1"
                    >
                      Collapse
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Discharge — real checklist, not a text summary */}
            {group.phase === "discharge" && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center" style={{ width: 10 }}>
                  <TimelineDot
                    status={group.status}
                    completed={group.status === "ontrack"}
                  />
                </div>
                <div className="flex-1 pb-2 min-w-0">
                  <DischargeReadinessChecklist
                    conditions={dischargeConditions}
                    patientStatus={patientStatus}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

WorkflowTimeline.displayName = "WorkflowTimeline";
