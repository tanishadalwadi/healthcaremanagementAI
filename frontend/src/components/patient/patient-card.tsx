"use client";

/**
 * PatientCard — compact + expandable variants.
 *
 * Compact:
 *   Avatar | Name (13/600) | Room · Dept · Day (11/400 muted) | StatusIndicator
 *   Left border: 3px solid status-color if blocked/critical, transparent otherwise.
 *   Border: 1px solid #EEE8EF, border-radius: 14px.
 *
 * Expandable:
 *   Same header (larger avatar 40×40) + three workflow-group chips.
 *   Each chip: label + worst-status indicator + chevron.
 *   Tap chip → inline step list expands beneath it.
 *
 * Names are the most prominent element on every card.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusIndicator } from "@/components/ui/status-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Patient, WorkflowGroup, PatientStatus, WorkflowStep } from "@/types";
import { relativeTime, dayOfStayLabel } from "@/lib/format";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BORDER: Record<PatientStatus, string> = {
  ontrack: "transparent",
  delayed: "transparent",
  blocked: "#4A4458",
  critical: "#DC2626",
};

function cardLeftBorder(status: PatientStatus): React.CSSProperties {
  return { borderLeft: `3px solid ${STATUS_BORDER[status]}` };
}

// ─── Compact PatientCard ──────────────────────────────────────────────────────

export interface PatientCardCompactProps {
  patient: Patient;
  onClick?: () => void;
  className?: string;
}

export const PatientCardCompact: React.FC<PatientCardCompactProps> = ({
  patient,
  onClick,
  className,
}) => {
  const { name, initials, room, departmentId, dayOfStay, status } = patient;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left",
        "flex items-center gap-3",
        "px-3 py-3",
        "bg-surface",
        "border border-[#EEE8EF] rounded-card",
        "transition-colors duration-150 hover:border-hover-tint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        className,
      )}
      style={cardLeftBorder(status)}
    >
      {/* Avatar */}
      <Avatar initials={initials} size="md" />

      {/* Name + metadata */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate font-sans font-semibold text-text-primary leading-tight"
          style={{ fontSize: 13 }}
        >
          {name}
        </p>
        <p className="text-meta text-text-muted mt-0.5 truncate">
          {room} · {departmentId} · {dayOfStayLabel(dayOfStay)}
        </p>
      </div>

      {/* Status — dot for on-track/delayed, badge for blocked/critical */}
      <div className="shrink-0">
        <StatusIndicator status={status} showLabel={false} />
      </div>
    </button>
  );
};

PatientCardCompact.displayName = "PatientCardCompact";

// ─── Workflow group chip ───────────────────────────────────────────────────────

interface GroupChipProps {
  group: WorkflowGroup;
  expanded: boolean;
  onToggle: () => void;
}

const GroupChip: React.FC<GroupChipProps> = ({ group, expanded, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      "w-full flex items-center justify-between gap-2",
      "px-3 py-2 rounded-[8px]",
      "bg-surface-alt",
      "transition-colors duration-150 hover:border hover:border-hover-tint",
      "border border-transparent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
    )}
  >
    <span className="text-body-sm text-text-secondary font-[500]">
      {group.label}
    </span>
    <span className="flex items-center gap-2">
      <StatusIndicator status={group.status} showLabel={false} />
      <span
        className={cn(
          "ti ti-chevron-down text-text-muted transition-transform duration-150",
          expanded && "rotate-180",
        )}
        style={{ fontSize: 13 }}
        aria-hidden="true"
      />
    </span>
  </button>
);

// ─── Step row (inside expanded chip) ─────────────────────────────────────────

interface StepRowProps {
  step: WorkflowStep;
}

const StepRow: React.FC<StepRowProps> = ({ step }) => (
  <div className="flex items-center justify-between gap-2 py-1.5 pl-3 pr-1">
    <div className="flex items-center gap-2 min-w-0">
      {/* Step completion dot */}
      <span
        className="shrink-0 rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor:
            step.completedAt ? "#4FB5A8" : step.status === "critical" ? "#DC2626" : step.status === "delayed" ? "#E08A4F" : "#D4CDD9",
        }}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-meta truncate",
          step.completedAt ? "text-text-muted" : "text-text-secondary",
        )}
      >
        {step.name}
        {step.occurrence > 1 && (
          <span className="text-text-muted ml-1 font-mono">×{step.occurrence}</span>
        )}
      </span>
    </div>
    <div className="shrink-0">
      <StatusIndicator status={step.status} showLabel={false} />
    </div>
  </div>
);

// ─── Expandable PatientCard ───────────────────────────────────────────────────

export interface PatientCardExpandableProps {
  patient: Patient;
  workflowGroups: WorkflowGroup[];
  onClick?: () => void;
  className?: string;
}

export const PatientCardExpandable: React.FC<PatientCardExpandableProps> = ({
  patient,
  workflowGroups,
  onClick,
  className,
}) => {
  const { name, initials, room, departmentId, dayOfStay, status, admittedAt } =
    patient;

  const [expandedPhase, setExpandedPhase] = React.useState<string | null>(null);

  const togglePhase = (phase: string) =>
    setExpandedPhase((prev) => (prev === phase ? null : phase));

  return (
    <div
      className={cn(
        "bg-surface",
        "border border-[#EEE8EF] rounded-card",
        "overflow-hidden",
        className,
      )}
      style={cardLeftBorder(status)}
    >
      {/* Header — clickable to navigate to detail */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full text-left",
          "flex items-start gap-3",
          "px-4 pt-4 pb-3",
          "transition-colors duration-150 hover:border-hover-tint",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        )}
      >
        <Avatar initials={initials} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className="truncate font-sans font-semibold text-text-primary leading-tight"
              style={{ fontSize: 14 }}
            >
              {name}
            </p>
            <StatusIndicator status={status} showLabel={false} />
          </div>
          <p className="text-meta text-text-muted mt-0.5">
            {room} · {departmentId} · {dayOfStayLabel(dayOfStay)}
          </p>
          <p className="text-micro text-text-muted mt-1 font-mono">
            Admitted {relativeTime(admittedAt)}
          </p>
        </div>
      </button>

      {/* Workflow group chips */}
      <div className="px-3 pb-3 space-y-1.5">
        {workflowGroups.map((group) => {
          const isExpanded = expandedPhase === group.phase;
          // For inpatient, de-duplicate recurring steps to show one row per name+occurrence
          const stepsToShow =
            group.phase === "inpatient"
              ? group.steps.slice(0, isExpanded ? undefined : 0)
              : group.steps;

          return (
            <div key={group.phase}>
              <GroupChip
                group={group}
                expanded={isExpanded}
                onToggle={() => togglePhase(group.phase)}
              />
              {isExpanded && (
                <div className="mt-1 divide-y divide-[#F2EDF3]">
                  {group.phase === "inpatient" && !isExpanded && (
                    // Collapsed summary row for inpatient
                    <p className="text-meta text-text-muted px-3 py-2">
                      {group.eventCount} events
                      {(group.flaggedCount ?? 0) > 0 && (
                        <span className="ml-1 text-status-delayed">
                          · {group.flaggedCount} flagged
                        </span>
                      )}
                    </p>
                  )}
                  {group.steps.map((step) => (
                    <StepRow key={step.id} step={step} />
                  ))}
                </div>
              )}
              {/* Inpatient collapsed summary */}
              {group.phase === "inpatient" && !isExpanded && (
                <p className="text-micro text-text-muted px-3 pt-1">
                  {group.eventCount} events
                  {(group.flaggedCount ?? 0) > 0 && (
                    <span className="text-status-delayed ml-1">
                      · {group.flaggedCount} flagged
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

PatientCardExpandable.displayName = "PatientCardExpandable";
