"use client";

/**
 * PatientDetailView — tabbed patient detail layout.
 *
 * Phase 11A restructure:
 *   Left column → 6-tab card: Overview · Journey · Tasks · AI Panels · Vitals · Discharge
 *   Right sidebar → always visible, never a tab (same panels as Phase 5 design)
 *
 * Tab contents:
 *   Overview  — status, next action, current blocker, key stats
 *   Journey   — WorkflowTimeline unchanged (3-phase grouped, tap-to-expand)
 *   Tasks     — TreatmentPlanItem (doctor) / NursingTask (nurse); enriched in 11C
 *   AI Panels — split titled panels built in 11D (placeholder here)
 *   Vitals    — charts built in 11B (placeholder here)
 *   Discharge — DischargeReadinessChecklist + mark-ready action (relocated from header)
 *
 * Critical constraint: right sidebar NEVER changes regardless of active tab.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConfirmationModal }          from "@/components/ui/confirmation-modal";
import { cn }                         from "@/lib/utils";
import { WorkflowTimeline }           from "@/components/patient/workflow-timeline";
import { WorkflowReplayPlayer }       from "@/components/patient/workflow-replay";
import { AISummaryCard }              from "@/components/patient/ai-summary-card";
import { DischargeReadinessChecklist } from "@/components/patient/discharge-checklist";
import { VitalsTab }                  from "@/components/patient/vitals-tab";
import { NursingTaskActionButton }    from "@/components/shared/nursing-task-action-button";
import { timeOfDay, shortDate }       from "@/lib/format";
import {
  requestDischarge,
  updateTreatmentItem,
  updateNursingTaskStatus,
  type Consultation,
} from "@/lib/api";
import type {
  PatientDetail,
  PatientStatus,
  TreatmentPlanItem,
  WorkflowStep,
  NursingTask,
} from "@/types";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type DetailTab = "overview" | "journey" | "tasks" | "ai" | "vitals" | "discharge";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "overview",  label: "Overview"   },
  { id: "journey",   label: "Journey"    },
  { id: "tasks",     label: "Tasks"      },
  { id: "ai",        label: "AI Panels"  },
  { id: "vitals",    label: "Vitals"     },
  { id: "discharge", label: "Discharge"  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PatientStatus, string> = {
  ontrack:  "#4FB5A8",
  delayed:  "#E08A4F",
  blocked:  "#8A8394",
  critical: "#DC2626",
};

const STATUS_BG: Record<PatientStatus, string> = {
  ontrack:  "#E1F3F0",
  delayed:  "#FBE9DA",
  blocked:  "#EFEBEF",
  critical: "#F8DFDB",
};

const STATUS_LABEL: Record<PatientStatus, string> = {
  ontrack:  "On track",
  delayed:  "Delayed",
  blocked:  "Blocked",
  critical: "Critical",
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getNextAction(patient: PatientDetail): string | null {
  const next = [...patient.treatmentPlan]
    .filter((t) => !t.completed)
    .sort((a, b) => a.order - b.order)[0];
  return next?.description ?? null;
}

function getCurrentBlocker(
  patient: PatientDetail
): { step: WorkflowStep; groupLabel: string } | null {
  if (patient.status === "ontrack" || patient.status === "critical") return null;
  for (const group of patient.workflowGroups) {
    const flagged = group.steps.find((s) => s.flagged && !s.completedAt);
    if (flagged) return { step: flagged, groupLabel: group.label };
    const problem = group.steps.find(
      (s) => (s.status === "blocked" || s.status === "delayed") && !s.completedAt
    );
    if (problem) return { step: problem, groupLabel: group.label };
  }
  return null;
}

function getNextMed(steps: WorkflowStep[]): string {
  const pending = steps
    .filter((s) => s.name === "Medications" && !s.completedAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  if (!pending.length) return "None scheduled";
  const next = pending[0];
  const when = new Date(next.scheduledAt);
  return new Date().toDateString() === when.toDateString()
    ? timeOfDay(next.scheduledAt)
    : shortDate(next.scheduledAt);
}

function getLastRound(steps: WorkflowStep[]): string {
  const done = steps
    .filter((s) => s.name === "Rounds" && s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  if (!done.length) return "Not yet today";
  return timeOfDay(done[0].completedAt!);
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SidePanel({
  label,
  labelMarginBottom = 14,
  children,
}: {
  label: string;
  labelMarginBottom?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px" }}>
      <div
        style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#8A8394",
          marginBottom: labelMarginBottom,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <span className={cn("ti", icon)} style={{ fontSize: 14, color: "#8A8394" }} aria-hidden="true" />
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474" }}>
        <span style={{ fontWeight: 600, color: "#1D1B2E" }}>{value}</span>
        {" · "}
        {label}
      </span>
    </div>
  );
}

// ─── Tab content: Overview ────────────────────────────────────────────────────

function OverviewTab({
  patient,
  roleView,
  allSteps,
  consultations = [],
}: {
  patient: PatientDetail;
  roleView: "doctor" | "nurse";
  allSteps: WorkflowStep[];
  consultations?: Consultation[];
}) {
  const nextAction  = getNextAction(patient);
  const blocker     = getCurrentBlocker(patient);
  const isBad       = patient.status === "blocked" || patient.status === "delayed" || patient.status === "critical";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Status + key stats row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 14px", borderRadius: 8,
            background: STATUS_BG[patient.status],
            color: STATUS_COLOR[patient.status],
            fontSize: 13, fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: STATUS_COLOR[patient.status],
            }}
            aria-hidden="true"
          />
          {STATUS_LABEL[patient.status]}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#8A8394" }}>
          Day {patient.dayOfStay} of stay · {patient.room} · {patient.departmentId}
        </span>
      </div>

      {/* Blocker callout — only when blocked/delayed */}
      {isBad && blocker && (
        <div
          style={{
            background: patient.status === "critical" ? "#FDF1EF" : "#FBF4EC",
            borderRadius: 10,
            padding: "14px 16px",
            borderLeft: `3px solid ${STATUS_COLOR[patient.status]}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: STATUS_COLOR[patient.status], marginBottom: 5 }}>
            {patient.status === "critical" ? "Critical alert" : "Current blocker"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E", marginBottom: 3 }}>
            {blocker.step.name}
            <span style={{ fontWeight: 500, color: "#6B6474" }}>
              {" — "}{blocker.groupLabel}
            </span>
          </div>
          {blocker.step.note && (
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", marginTop: 4, lineHeight: 1.5 }}>
              {blocker.step.note}
            </div>
          )}
        </div>
      )}

      {/* Next action */}
      {nextAction && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8394", marginBottom: 8 }}>
            Next action
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1B2E", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span className="ti ti-arrow-right shrink-0" style={{ fontSize: 16, color: "#4FB5A8", marginTop: 1 }} aria-hidden="true" />
            {nextAction}
          </div>
        </div>
      )}

      {/* Nurse-specific quick stats */}
      {roleView === "nurse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8394", marginBottom: 2 }}>
            Shift snapshot
          </div>
          <StatChip icon="ti-pill"       label="Next med due"  value={getNextMed(allSteps)} />
          <StatChip icon="ti-stethoscope" label="Last round"   value={getLastRound(allSteps)} />
        </div>
      )}

      {/* Consultations */}
      {consultations.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8394", marginBottom: 8 }}>
            Consultations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                style={{
                  background: "#F8F5FD",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E" }}>
                  {consultation.reason}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 3 }}>
                  {consultation.doctorName} · {consultation.status.replace(/_/g, " ")}
                  {consultation.scheduledAt
                    ? ` · ${shortDate(consultation.scheduledAt)}`
                    : ""}
                </div>
                {consultation.notes && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#6B6474", marginTop: 4, lineHeight: 1.45 }}>
                    {consultation.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient demographics */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8394", marginBottom: 8 }}>
          Patient info
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <StatChip icon="ti-user"           label="Age / Sex"    value={`${patient.age} · ${patient.sex}`} />
          <StatChip icon="ti-stethoscope"    label="Diagnosis"    value={patient.diagnosis} />
          <StatChip icon="ti-calendar"       label="Admitted"     value={shortDate(patient.admittedAt)} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab content: Tasks ───────────────────────────────────────────────────────

function TasksTab({
  patient,
  roleView,
  nursingTasks,
  onDataChange,
}: {
  patient: PatientDetail;
  roleView: "doctor" | "nurse";
  nursingTasks: NursingTask[];
  onDataChange?: () => void | Promise<void>;
}) {
  // ── Local state for optimistic updates ────────────────────────────────────
  const [localPlan, setLocalPlan] = useState<TreatmentPlanItem[]>(
    () => [...patient.treatmentPlan].sort((a, b) => a.order - b.order)
  );
  const [localTasks, setLocalTasks] = useState<NursingTask[]>(nursingTasks);
  // Set of IDs currently being saved — disables buttons while in flight
  const [saving, setSaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalPlan([...patient.treatmentPlan].sort((a, b) => a.order - b.order));
  }, [patient.treatmentPlan]);

  useEffect(() => {
    setLocalTasks(nursingTasks);
  }, [nursingTasks]);

  // ── Task status display config ─────────────────────────────────────────────
  const TASK_STATUS_CFG: Record<NursingTask["status"], { bg: string; text: string; label: string }> = {
    active:  { bg: "#E1F3F0", text: "#2D7A72", label: "Active"  },
    pending: { bg: "#FBE9DA", text: "#9A6435", label: "Pending" },
    done:    { bg: "#EFEBEF", text: "#6B6474", label: "Done"    },
  };

  // ── Treatment plan action ─────────────────────────────────────────────────
  function handleCompleteItem(itemId: string) {
    // Optimistic update
    setLocalPlan((prev) =>
      prev.map((t) =>
        t.id === itemId
          ? { ...t, completed: true, completedAt: new Date().toISOString() }
          : t
      )
    );
    setSaving((prev) => new Set(prev).add(itemId));
    updateTreatmentItem(patient.id, itemId, true).finally(() => {
      setSaving((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
      void onDataChange?.();
    });
  }

  // ── Nursing task action ───────────────────────────────────────────────────
  function handleTaskTransition(taskId: string, nextStatus: NursingTask["status"]) {
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: nextStatus } : t)
    );
    setSaving((prev) => new Set(prev).add(taskId));
    updateNursingTaskStatus(taskId, nextStatus).finally(() => {
      setSaving((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
      void onDataChange?.();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOCTOR VIEW — treatment plan with dependency chain
  // ─────────────────────────────────────────────────────────────────────────
  if (roleView === "doctor") {
    const doneCount = localPlan.filter((t) => t.completed).length;

    // Build a lookup of order → completed for dependency detection
    const completedByOrder = new Map(localPlan.map((t) => [t.order, t.completed]));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Progress header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8A8394" }}>
            {doneCount} of {localPlan.length} complete
          </span>
          {/* Simple progress bar */}
          <div style={{ width: 80, height: 4, borderRadius: 2, background: "#EFE7F7" }}>
            <div style={{
              height: "100%", borderRadius: 2, background: "#7C5FAE",
              width: `${localPlan.length > 0 ? (doneCount / localPlan.length) * 100 : 0}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        {localPlan.map((item) => {
          const prevIncomplete =
            item.order > 1 && completedByOrder.get(item.order - 1) === false;
          // Find the previous item's description for the dependency note
          const prevItem = localPlan.find((t) => t.order === item.order - 1);
          const isSaving = saving.has(item.id);

          return (
            <div
              key={item.id}
              style={{
                padding: "12px 14px", borderRadius: 10,
                background: item.completed ? "#FAFAFA" : "#fff",
                border: `1.5px solid ${item.completed ? "#F3EFF4" : "#E7E0E9"}`,
                opacity: isSaving ? 0.65 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Top row: checkbox + description + order badge */}
              <div className="flex items-start" style={{ gap: 10 }}>
                {/* Checkbox */}
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 20, height: 20, borderRadius: 6, marginTop: 1,
                    background: item.completed ? "#EFE7F7" : "transparent",
                    border: item.completed ? "none" : "1.5px solid #D9D2DC",
                    color: "#7C5FAE",
                  }}
                  aria-hidden="true"
                >
                  {item.completed && (
                    <span className="ti ti-check" style={{ fontSize: 11 }} />
                  )}
                </span>

                {/* Description */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: item.completed ? "#8A8394" : "#1D1B2E",
                    textDecoration: item.completed ? "line-through" : "none",
                    lineHeight: 1.4,
                  }}>
                    {item.description}
                  </div>
                  {item.completedAt && (
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
                      Completed {shortDate(item.completedAt)}
                    </div>
                  )}
                </div>

                {/* Order badge */}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
                  background: item.completed ? "#EFE7F7" : "#F8F5FD",
                  color: item.completed ? "#7C5FAE" : "#9B7CCC",
                  flexShrink: 0, alignSelf: "flex-start",
                }}>
                  {item.completed ? "Done" : `#${item.order}`}
                </span>
              </div>

              {/* Dependency indicator — only when previous step is still pending */}
              {!item.completed && prevIncomplete && prevItem && (
                <div
                  className="flex items-center"
                  style={{
                    marginTop: 8, marginLeft: 30, gap: 5,
                    fontSize: 10, fontWeight: 600, color: "#9A6435",
                  }}
                >
                  <span className="ti ti-arrow-up shrink-0" style={{ fontSize: 10 }} aria-hidden="true" />
                  <span>Requires: {prevItem.description}</span>
                </div>
              )}

              {/* Action button — only for pending items */}
              {!item.completed && (
                <div style={{ marginTop: 10, marginLeft: 30 }}>
                  <button
                    onClick={() => handleCompleteItem(item.id)}
                    disabled={isSaving}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 12px",
                      borderRadius: 6, border: "1.5px solid #D4C8E8",
                      background: "#F8F5FD", color: "#7C5FAE",
                      cursor: isSaving ? "default" : "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) (e.currentTarget as HTMLButtonElement).style.background = "#EFE7F7";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#F8F5FD";
                    }}
                  >
                    {isSaving ? "Saving…" : "Mark Complete"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NURSE VIEW — nursing tasks with Start / Complete action buttons
  // ─────────────────────────────────────────────────────────────────────────
  if (localTasks.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        No nursing tasks assigned to this patient.
      </div>
    );
  }

  const remaining = localTasks.filter((t) => t.status !== "done").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Progress header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#8A8394" }}>
          {remaining} of {localTasks.length} remaining
        </span>
        <div style={{ width: 80, height: 4, borderRadius: 2, background: "#E1F3F0" }}>
          <div style={{
            height: "100%", borderRadius: 2, background: "#4FB5A8",
            width: `${localTasks.length > 0 ? ((localTasks.length - remaining) / localTasks.length) * 100 : 0}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {localTasks.map((task) => {
        const cfg = TASK_STATUS_CFG[task.status];
        const isSaving = saving.has(task.id);

        return (
          <div
            key={task.id}
            style={{
              padding: "12px 14px", borderRadius: 10,
              background: task.status === "done" ? "#FAFAFA" : "#fff",
              border: `1.5px solid ${task.status === "done" ? "#F3EFF4" : "#E7E0E9"}`,
              opacity: isSaving ? 0.65 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {/* Title row */}
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: task.status === "done" ? "#8A8394" : "#1D1B2E",
                textDecoration: task.status === "done" ? "line-through" : "none",
              }}>
                {task.title}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                background: cfg.bg, color: cfg.text, flexShrink: 0,
              }}>
                {cfg.label}
              </span>
            </div>

            {/* Due context */}
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
              {task.dueContext}
            </div>

            {/* Action button — shared NursingTaskActionButton */}
            {task.status !== "done" && (
              <div style={{ marginTop: 10 }}>
                <NursingTaskActionButton
                  status={task.status}
                  isSaving={isSaving}
                  onClick={() =>
                    handleTaskTransition(
                      task.id,
                      task.status === "pending" ? "active" : "done"
                    )
                  }
                />
              </div>
            )}

            {/* Done checkmark */}
            {task.status === "done" && (
              <div
                className="flex items-center"
                style={{ marginTop: 6, gap: 4, fontSize: 10, fontWeight: 600, color: "#8A8394" }}
              >
                <span className="ti ti-circle-check" style={{ fontSize: 12 }} aria-hidden="true" />
                Completed this shift
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab content: AI Panels ──────────────────────────────────────────────────

/**
 * AIPanelsTab — 6 titled panels, each grounded in real patient data.
 *
 * Panels:
 *   1. Admission Context       — aiSummary (cites specific data point) + intake timeline
 *   2. Care Team & Progress    — attending, consultants, nurse, treatment plan completion
 *   3. Next Recommended Action — first pending treatment item + scheduled med/lab steps
 *   4. Status Explanation      — only when not ontrack; cites specific flagged step + note
 *   5. Discharge Readiness     — all 5 conditions with owners, request status
 *   6. Bottleneck Insight      — worst workflow group by friction score, specific step names
 *
 * Hard rule: no generic filler text — every sentence cites a specific field value.
 */

/** "Xh Ym overdue" relative to a past ISO timestamp. */
function overdueHHMM(isoScheduled: string): string {
  const ms = Date.now() - new Date(isoScheduled).getTime();
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Small icon + text row used inside panels. */
function AiDataRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center" style={{ gap: 7 }}>
      <span
        className={`ti ${icon} shrink-0`}
        style={{ fontSize: 12, color: "#8A8394" }}
        aria-hidden="true"
      />
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", lineHeight: 1.45 }}>
        {label}
      </span>
    </div>
  );
}

/** Panel card: purple header strip + white body. Alert variant tints header with status color. */
function AiPanelCard({
  title,
  icon = "ti-sparkles",
  alert = false,
  alertColor,
  children,
}: {
  title: string;
  icon?: string;
  alert?: boolean;
  alertColor?: string;
  children: React.ReactNode;
}) {
  const headerBg   = alert && alertColor ? `${alertColor}18` : "#EFE7F7"; // ~9% opacity
  const titleColor = alert && alertColor ? alertColor : "#7C5FAE";
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #F0ECF4" }}>
      <div style={{
        background: headerBg, padding: "9px 14px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span
          className={`ti ${icon} shrink-0`}
          style={{ fontSize: 12, color: titleColor }}
          aria-hidden="true"
        />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: titleColor,
        }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "13px 14px", background: "#fff" }}>
        {children}
      </div>
    </div>
  );
}

function AIPanelsTab({
  patient,
  allSteps,
}: {
  patient: PatientDetail;
  allSteps: WorkflowStep[];
}) {
  // ── Panel 1 data ──────────────────────────────────────────────────────────
  const intakeGroup    = patient.workflowGroups.find((g) => g.phase === "intake");
  const registeredStep = intakeGroup?.steps.find((s) => s.name === "Registered");
  const assessedStep   = intakeGroup?.steps.find((s) => s.name === "Doctor assessment");

  // ── Panel 2 data ──────────────────────────────────────────────────────────
  const attending   = patient.careTeam.find((ct) => ct.doctor?.role === "Attending")?.doctor;
  const consultants = patient.careTeam
    .filter((ct) => ct.doctor && ct.doctor.role !== "Attending")
    .map((ct) => ct.doctor!);
  const nurse       = patient.careTeam.find((ct) => ct.nurse)?.nurse;
  const doneItems   = patient.treatmentPlan.filter((t) => t.completed).length;
  const totalItems  = patient.treatmentPlan.length;

  // ── Panel 3 data ──────────────────────────────────────────────────────────
  const nextItem = [...patient.treatmentPlan]
    .filter((t) => !t.completed)
    .sort((a, b) => a.order - b.order)[0] ?? null;

  const nextMedStep = allSteps
    .filter((s) => s.name === "Medications" && !s.completedAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;

  const nextLabStep = allSteps
    .filter((s) => s.name === "Labs" && !s.completedAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;

  // ── Panel 4 data ──────────────────────────────────────────────────────────
  const isOnTrack   = patient.status === "ontrack";
  const blocker     = getCurrentBlocker(patient);
  const allBadSteps = allSteps.filter(
    (s) => (s.flagged || s.status === "blocked" || s.status === "delayed") && !s.completedAt
  );

  // ── Panel 5 data ──────────────────────────────────────────────────────────
  const completedConds  = patient.dischargeConditions.filter((c) => c.status === "complete");
  const incompleteConds = patient.dischargeConditions.filter((c) => c.status === "incomplete");

  // ── Panel 6 data ──────────────────────────────────────────────────────────
  const groupFriction = patient.workflowGroups.map((g) => ({
    label:     g.label,
    flagged:   g.steps.filter((s) => s.flagged && !s.completedAt).length,
    bad:       g.steps.filter((s) => (s.status === "blocked" || s.status === "delayed") && !s.completedAt).length,
    pending:   g.steps.filter((s) => !s.completedAt).length,
    done:      g.steps.filter((s) => s.completedAt).length,
    total:     g.steps.length,
    flagNames: g.steps.filter((s) => s.flagged && !s.completedAt).map((s) => s.name),
  }));

  const worstGroup = [...groupFriction].sort(
    (a, b) => (b.flagged * 3 + b.bad * 2 + b.pending) - (a.flagged * 3 + a.bad * 2 + a.pending)
  )[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── 1: Admission Context ─────────────────────────────────────────── */}
      <AiPanelCard title="Admission Context">
        <p style={{ fontSize: 12, fontWeight: 500, color: "#4A4458", margin: "0 0 10px", lineHeight: 1.55 }}>
          {patient.aiSummary}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <AiDataRow icon="ti-calendar"          label={`Admitted ${shortDate(patient.admittedAt)} · Day ${patient.dayOfStay} of stay`} />
          <AiDataRow icon="ti-building-hospital" label={`${patient.departmentId} · Room ${patient.room}`} />
          {registeredStep?.completedAt && (
            <AiDataRow icon="ti-clipboard-check" label={`Registered ${shortDate(registeredStep.completedAt)}`} />
          )}
          {assessedStep?.completedAt && (
            <AiDataRow icon="ti-stethoscope"     label={`Doctor assessment completed ${shortDate(assessedStep.completedAt)}`} />
          )}
          {assessedStep && !assessedStep.completedAt && (
            <AiDataRow icon="ti-stethoscope"     label="Doctor assessment not yet completed" />
          )}
        </div>
      </AiPanelCard>

      {/* ── 2: Care Team & Progress ──────────────────────────────────────── */}
      <AiPanelCard title="Care Team & Progress" icon="ti-users">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {attending && (
            <AiDataRow icon="ti-user-circle" label={`Attending: ${attending.name} (${attending.specialty})`} />
          )}
          {consultants.map((c) => (
            <AiDataRow key={c.id} icon="ti-user" label={`Consulting: ${c.name} (${c.specialty})`} />
          ))}
          {nurse && (
            <AiDataRow icon="ti-nurse" label={`Nurse: ${nurse.name} · ${nurse.shift} shift`} />
          )}
          <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px solid #F3EFF4" }}>
            <AiDataRow
              icon="ti-checklist"
              label={
                totalItems === 0
                  ? "No treatment plan items recorded"
                  : doneItems === totalItems
                  ? `All ${totalItems} treatment steps complete`
                  : `${doneItems} of ${totalItems} treatment steps complete`
              }
            />
          </div>
        </div>
      </AiPanelCard>

      {/* ── 3: Next Recommended Action ───────────────────────────────────── */}
      <AiPanelCard title="Next Recommended Action" icon="ti-arrow-right">
        {nextItem ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E", lineHeight: 1.4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9B7CCC", marginRight: 6 }}>
                #{nextItem.order}
              </span>
              {nextItem.description}
            </div>
            {nextMedStep && (
              <AiDataRow
                icon="ti-pill"
                label={`Medications scheduled ${timeOfDay(nextMedStep.scheduledAt)}${nextMedStep.note ? ` — ${nextMedStep.note}` : ""}`}
              />
            )}
            {nextLabStep && (
              <AiDataRow
                icon="ti-test-pipe"
                label={`Labs scheduled ${timeOfDay(nextLabStep.scheduledAt)}${nextLabStep.note ? ` — ${nextLabStep.note}` : ""}`}
              />
            )}
            {!nextMedStep && !nextLabStep && (
              <AiDataRow icon="ti-clock" label="No further medications or labs scheduled" />
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, fontWeight: 500, color: "#4FB5A8", margin: 0 }}>
            All {totalItems} treatment steps are complete.
          </p>
        )}
      </AiPanelCard>

      {/* ── 4: Status Explanation (only when not ontrack) ────────────────── */}
      {!isOnTrack && (
        <AiPanelCard
          title={
            patient.status === "critical"
              ? "Critical Alert"
              : patient.status === "blocked"
              ? "Blocker Detail"
              : "Delay Explanation"
          }
          icon={patient.status === "critical" ? "ti-alert-triangle" : "ti-clock-exclamation"}
          alert
          alertColor={STATUS_COLOR[patient.status]}
        >
          {blocker ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E", lineHeight: 1.4 }}>
                {blocker.step.name}
                <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474" }}>
                  {" — "}{blocker.groupLabel}
                </span>
              </div>
              {blocker.step.note && (
                <p style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", margin: "2px 0 0", lineHeight: 1.5 }}>
                  {blocker.step.note}
                </p>
              )}
              {new Date(blocker.step.scheduledAt) < new Date() && !blocker.step.completedAt && (
                <AiDataRow
                  icon="ti-clock"
                  label={`Overdue by ${overdueHHMM(blocker.step.scheduledAt)} (scheduled ${timeOfDay(blocker.step.scheduledAt)})`}
                />
              )}
              {allBadSteps.length > 1 && (
                <AiDataRow
                  icon="ti-alert-circle"
                  label={`${allBadSteps.length} steps total affected across workflow`}
                />
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", margin: 0 }}>
              {STATUS_LABEL[patient.status]} status — no specific step flagged yet.
            </p>
          )}
        </AiPanelCard>
      )}

      {/* ── 5: Discharge Readiness ───────────────────────────────────────── */}
      <AiPanelCard title="Discharge Readiness" icon="ti-home-check">
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {/* Progress bar */}
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E" }}>
              {completedConds.length} of {patient.dischargeConditions.length} conditions met
            </span>
            <div style={{ width: 64, height: 4, borderRadius: 2, background: "#EFE7F7" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: "#7C5FAE",
                width: `${patient.dischargeConditions.length > 0
                  ? (completedConds.length / patient.dischargeConditions.length) * 100
                  : 0}%`,
              }} />
            </div>
          </div>

          {/* Incomplete first */}
          {incompleteConds.map((c) => (
            <div key={c.id} className="flex items-start" style={{ gap: 7 }}>
              <span className="ti ti-circle shrink-0" style={{ fontSize: 13, color: "#C9BBDF", marginTop: 1 }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", flex: 1 }}>
                {c.condition}
                <span style={{ color: "#8A8394" }}> · {c.owningDepartment}</span>
              </span>
            </div>
          ))}

          {/* Complete */}
          {completedConds.map((c) => (
            <div key={c.id} className="flex items-start" style={{ gap: 7 }}>
              <span className="ti ti-circle-check-filled shrink-0" style={{ fontSize: 13, color: "#4FB5A8", marginTop: 1 }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", flex: 1, textDecoration: "line-through" }}>
                {c.condition}
              </span>
            </div>
          ))}

          {/* Request status */}
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #F3EFF4" }}>
            {patient.dischargeRequested && patient.dischargeRequestedAt ? (
              <AiDataRow
                icon="ti-send"
                label={`Discharge requested ${shortDate(patient.dischargeRequestedAt)} — awaiting admin approval`}
              />
            ) : (
              <AiDataRow icon="ti-clock-pause" label="No discharge request submitted yet" />
            )}
          </div>
        </div>
      </AiPanelCard>

      {/* ── 6: Bottleneck Insight ────────────────────────────────────────── */}
      <AiPanelCard title="Bottleneck Insight" icon="ti-chart-bar">
        {worstGroup && (worstGroup.flagged > 0 || worstGroup.bad > 0 || worstGroup.pending > 0) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E" }}>
              {worstGroup.label}
              {worstGroup.flagged > 0 && (
                <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLOR.delayed }}>
                  {" · "}{worstGroup.flagged} flagged
                </span>
              )}
            </div>
            {worstGroup.flagNames.length > 0 && (
              <p style={{ fontSize: 12, fontWeight: 500, color: "#6B6474", margin: 0, lineHeight: 1.5 }}>
                Flagged: {worstGroup.flagNames.join(", ")}.
              </p>
            )}
            <AiDataRow
              icon="ti-progress"
              label={`${worstGroup.done} of ${worstGroup.total} steps complete in this phase`}
            />
            {/* Other groups at a glance */}
            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #F3EFF4", display: "flex", flexDirection: "column", gap: 3 }}>
              {groupFriction
                .filter((g) => g.label !== worstGroup.label)
                .map((g) => (
                  <div key={g.label} style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
                    {g.label}: {g.done}/{g.total} complete
                    {g.flagged > 0 ? ` · ${g.flagged} flagged` : ""}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, fontWeight: 500, color: "#4FB5A8", margin: 0 }}>
            No significant bottlenecks detected across workflow phases.
          </p>
        )}
      </AiPanelCard>

    </div>
  );
}

// ─── Tab content: Discharge ───────────────────────────────────────────────────

function DischargeTab({
  patient,
  roleView,
  requested,
  onMarkReady,
}: {
  patient: PatientDetail;
  roleView: "doctor" | "nurse";
  requested: boolean;
  onMarkReady: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Discharge readiness checklist */}
      <DischargeReadinessChecklist
        conditions={patient.dischargeConditions}
        patientStatus={patient.status}
      />

      {/* Doctor-only: discharge request action */}
      {roleView === "doctor" && (
        <div
          style={{
            background: "#F8F5FD", borderRadius: 12, padding: "16px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1B2E", marginBottom: 2 }}>
              {requested ? "Discharge request submitted" : "Request discharge"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
              {requested
                ? "Admin has been notified and will review the checklist above."
                : "Sends this patient to the admin discharge approval queue."}
            </div>
          </div>

          {requested ? (
            <span className="flex items-center shrink-0" style={{ gap: 6, fontSize: 12, fontWeight: 600, color: "#E08A4F" }}>
              <span className="ti ti-clock-check" style={{ fontSize: 16 }} aria-hidden="true" />
              Pending approval
            </span>
          ) : (
            <button
              type="button"
              onClick={onMarkReady}
              style={{
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 600,
                padding: "10px 18px", borderRadius: 10,
                border: "1px solid #E08A4F",
                background: "#E08A4F", color: "#fff",
                flexShrink: 0,
              }}
            >
              Mark ready for discharge…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PatientDetailView ────────────────────────────────────────────────────────

type RoleView = "doctor" | "nurse";

export interface PatientDetailViewProps {
  patient: PatientDetail;
  /** Default view — nurse dashboard links set "nurse", doctor links set "doctor" */
  defaultRole?: RoleView;
  /** Nursing tasks for the Tasks tab nurse view — fetched by the page component */
  nursingTasks?: NursingTask[];
  consultations?: Consultation[];
  /** Refetch patient + tasks after mutations */
  onDataChange?: () => void | Promise<void>;
}

export function PatientDetailView({
  patient,
  defaultRole = "doctor",
  nursingTasks = [],
  consultations = [],
  onDataChange,
}: PatientDetailViewProps) {
  const [roleView,  setRoleView]  = useState<RoleView>(defaultRole);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [requested, setRequested] = useState(patient.dischargeRequested || false);

  useEffect(() => {
    setRequested(patient.dischargeRequested || false);
  }, [patient.dischargeRequested]);

  const allSteps      = patient.workflowGroups.flatMap((g) => g.steps);
  const pendingOrders = [...patient.treatmentPlan]
    .filter((t) => !t.completed)
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: 28 }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center" style={{ gap: 16, marginBottom: 20 }}>
        <Link
          href="/doctor"
          className="flex items-center justify-center shrink-0"
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#fff", border: "1px solid #E7E0E9",
            color: "#6B6474", textDecoration: "none",
          }}
          aria-label="Back to patient list"
        >
          <span className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
        </Link>

        <span
          className="flex items-center justify-center font-bold shrink-0"
          style={{
            width: 46, height: 46, borderRadius: 13,
            background: "#EFE7F7", color: "#7C5FAE", fontSize: 16,
          }}
          aria-hidden="true"
        >
          {patient.initials}
        </span>

        <div style={{ flex: 1 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {patient.name}
            </span>
            {/* Status inline badge */}
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 5,
                background: STATUS_BG[patient.status],
                color: STATUS_COLOR[patient.status],
                fontSize: 11, fontWeight: 700,
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[patient.status] }}
                aria-hidden="true"
              />
              {STATUS_LABEL[patient.status]}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#8A8394", marginTop: 3 }}>
            {patient.room} · {patient.departmentId} · Day {patient.dayOfStay} of stay
          </div>
        </div>

        {/* Doctor / Nurse view toggle */}
        <div className="flex shrink-0" style={{ gap: 4, background: "#EFEBEF", padding: 4, borderRadius: 11 }}>
          {(["doctor", "nurse"] as RoleView[]).map((role) => {
            const active = roleView === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleView(role)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: "7px 14px", borderRadius: 9, border: "none",
                  background: active ? "#7C5FAE" : "transparent",
                  color: active ? "#ffffff" : "#6B6474",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                {role === "doctor" ? "Doctor view" : "Nurse view"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 336px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── Left: tabbed card ─────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ borderBottom: "1.5px solid #F3EFF4", padding: "0 26px" }}>
            <div style={{ display: "flex" }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                // Show orange dot on Discharge tab when request is pending
                const showDot = tab.id === "discharge" && requested;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      position: "relative",
                      padding: "15px 4px",
                      marginRight: 22,
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      color: active ? "#1D1B2E" : "#8A8394",
                      background: "none",
                      border: "none",
                      borderBottom: active ? "2px solid #7C5FAE" : "2px solid transparent",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      transition: "color 0.1s",
                    }}
                  >
                    {tab.label}
                    {showDot && (
                      <span
                        style={{
                          position: "absolute", top: 10, right: -4,
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#E08A4F",
                        }}
                        aria-label="pending"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: "24px 26px" }}>
            {activeTab === "overview" && (
              <OverviewTab
                patient={patient}
                roleView={roleView}
                allSteps={allSteps}
                consultations={consultations}
              />
            )}

            {activeTab === "journey" && (
              <>
                <WorkflowReplayPlayer patientId={patient.id} />
                <WorkflowTimeline
                  workflowGroups={patient.workflowGroups}
                  dischargeConditions={patient.dischargeConditions}
                  patientStatus={patient.status}
                />
              </>
            )}

            {activeTab === "tasks" && (
              <TasksTab
                patient={patient}
                roleView={roleView}
                nursingTasks={nursingTasks}
                onDataChange={onDataChange}
              />
            )}

            {activeTab === "ai" && (
              <AIPanelsTab patient={patient} allSteps={allSteps} />
            )}

            {activeTab === "vitals" && (
              <VitalsTab patientId={patient.id} />
            )}

            {activeTab === "discharge" && (
              <DischargeTab
                patient={patient}
                roleView={roleView}
                requested={requested}
                onMarkReady={() => setModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* ── Right: sidebar — always visible, never tabbed ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI summary — always shown */}
          <AISummaryCard summary={patient.aiSummary} />

          {roleView === "doctor" ? (
            <>
              {/* Diagnosis */}
              <SidePanel label="Diagnosis" labelMarginBottom={8}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                  {patient.diagnosis}
                </div>
              </SidePanel>

              {/* Care team */}
              <SidePanel label="Care team" labelMarginBottom={14}>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {patient.careTeam.map((assignment, i) => {
                    const member = assignment.doctor ?? assignment.nurse;
                    if (!member) return null;
                    const roleLabel = assignment.doctor
                      ? `${assignment.doctor.role} · ${assignment.doctor.specialty}`
                      : `Nurse · ${assignment.nurse!.shift} shift`;
                    return (
                      <div key={i} className="flex items-center" style={{ gap: 11 }}>
                        <span
                          className="flex items-center justify-center shrink-0 font-bold"
                          style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: "#EFE7F7", color: "#7C5FAE", fontSize: 12,
                          }}
                          aria-hidden="true"
                        >
                          {member.initials}
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{member.name}</div>
                          <div style={{ fontSize: 10, fontWeight: 500, color: "#8A8394", marginTop: 1 }}>
                            {roleLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SidePanel>

              {/* Treatment plan summary */}
              <SidePanel label="Treatment plan" labelMarginBottom={10}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[...patient.treatmentPlan]
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center"
                        style={{ gap: 10, padding: "8px 0", borderTop: "1px solid #F3EFF4" }}
                      >
                        {item.completed ? (
                          <span
                            className="flex items-center justify-center shrink-0"
                            style={{ width: 19, height: 19, borderRadius: 6, background: "#EFE7F7", color: "#7C5FAE" }}
                            aria-label="Completed"
                          >
                            <span className="ti ti-check" style={{ fontSize: 13 }} aria-hidden="true" />
                          </span>
                        ) : (
                          <span
                            className="shrink-0"
                            style={{ width: 19, height: 19, borderRadius: 6, border: "1.5px solid #D9D2DC", display: "inline-block" }}
                            aria-label="Pending"
                          />
                        )}
                        <span
                          style={{
                            fontSize: 12, fontWeight: 500,
                            color: item.completed ? "#8A8394" : "#1D1B2E",
                            textDecoration: item.completed ? "line-through" : "none",
                          }}
                        >
                          {item.description}
                        </span>
                      </div>
                    ))}
                </div>
              </SidePanel>
            </>
          ) : (
            <>
              {/* Nurse view: Tasks & workflow notes */}
              <SidePanel label="Tasks & workflow notes" labelMarginBottom={12}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="flex items-start" style={{ gap: 11 }}>
                    <span className="flex items-center justify-center shrink-0"
                      style={{ width: 32, height: 32, borderRadius: 9, background: "#FBE9DA", color: "#9A6435" }}>
                      <span className="ti ti-pill" style={{ fontSize: 16 }} aria-hidden="true" />
                    </span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8394" }}>
                        Next med due
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getNextMed(allSteps)}</div>
                    </div>
                  </div>
                  <div className="flex items-start" style={{ gap: 11 }}>
                    <span className="flex items-center justify-center shrink-0"
                      style={{ width: 32, height: 32, borderRadius: 9, background: "#E1F3F0", color: "#327A70" }}>
                      <span className="ti ti-stethoscope" style={{ fontSize: 16 }} aria-hidden="true" />
                    </span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8394" }}>
                        Last round
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{getLastRound(allSteps)}</div>
                    </div>
                  </div>
                </div>
              </SidePanel>

              {/* Pending orders */}
              <SidePanel label="Pending orders" labelMarginBottom={10}>
                {pendingOrders.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#8A8394", fontWeight: 500 }}>All orders complete</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {pendingOrders.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center"
                        style={{ gap: 10, padding: "9px 0", borderTop: "1px solid #F3EFF4" }}
                      >
                        <span
                          className="shrink-0"
                          style={{ width: 19, height: 19, borderRadius: 6, border: "1.5px solid #D9D2DC", display: "inline-block" }}
                          aria-label="Pending"
                        />
                        <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SidePanel>
            </>
          )}
        </div>
      </div>

      {/* Mark-ready confirmation modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        patientName={patient.name}
        pendingItemCount={patient.treatmentPlan.filter((t) => !t.completed).length}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false);
          setRequested(true);
          const doctorName =
            patient.careTeam.find((m) => m.doctor)?.doctor?.name ?? "Attending physician";
          requestDischarge(patient.id, doctorName).then(() => onDataChange?.());
        }}
      />
    </div>
  );
}
