"use client";

/**
 * NursingTaskList — shift-level task tracker on the nurse dashboard.
 *
 * Stateful: owns localTasks + saving-Set so Start/Complete buttons update
 * immediately (optimistic) while updateNursingTaskStatus() runs in the background.
 *
 * Persistence note:
 *   updateNursingTaskStatus() mutates ALL_NURSING_TASKS at the module level.
 *   Status changes survive Next.js client-side navigation (Link) within the session.
 *   A full browser reload resets to seeded state — same as all other in-memory
 *   mutations in this app; this is expected behaviour until the real API is wired.
 *
 * Action buttons are rendered by the shared NursingTaskActionButton component,
 * which is the single definition reused here and in the Tasks tab on the patient
 * detail page (patient-detail-view.tsx).
 *
 * Visual spec:
 *   Container: bg #fff, radius 16, padding 20px 22px
 *   Each row: border-top 1px #F3EFF4; gap 10; padding 10px 0
 *   Status tag: radius 999, 10px/700/uppercase
 *     active  → bg #E1F3F0, color #2D7A72
 *     pending → bg #F6F1F1, color #6B6474
 *     done    → bg #F0EDF6, color #8A8394
 */

import { useState } from "react";
import { updateNursingTaskStatus } from "@/lib/api";
import { NursingTaskActionButton } from "@/components/shared/nursing-task-action-button";
import type { NursingTask, Patient } from "@/types";

interface NursingTaskListProps {
  tasks: NursingTask[];
  patients: Patient[];
}

const TAG_STYLE: Record<
  "active" | "pending" | "done",
  { background: string; color: string; label: string }
> = {
  active:  { background: "#E1F3F0", color: "#2D7A72", label: "Active"  },
  pending: { background: "#F6F1F1", color: "#6B6474", label: "Pending" },
  done:    { background: "#F0EDF6", color: "#8A8394", label: "Done"    },
};

export function NursingTaskList({ tasks, patients }: NursingTaskListProps) {
  // Local copy for optimistic updates — initialized from prop, never re-synced
  // from parent (same pattern as TasksTab in patient-detail-view.tsx)
  const [localTasks, setLocalTasks] = useState<NursingTask[]>(tasks);
  // IDs currently in-flight; disables button and dims row while saving
  const [saving, setSaving] = useState<Set<string>>(new Set());

  function handleTransition(taskId: string, next: NursingTask["status"]) {
    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: next } : t))
    );
    setSaving((prev) => new Set(prev).add(taskId));

    updateNursingTaskStatus(taskId, next).finally(() => {
      setSaving((prev) => {
        const s = new Set(prev);
        s.delete(taskId);
        return s;
      });
    });
  }

  // Sort: active first, pending second, done last — re-derived from localTasks
  const sorted = [...localTasks].sort((a, b) => {
    const order = { active: 0, pending: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  const remaining = localTasks.filter((t) => t.status !== "done").length;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 22px" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#8A8394", margin: 0,
        }}>
          My nursing tasks
        </p>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8394" }}>
          {remaining} remaining
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {sorted.map((task, i) => {
          const tag     = TAG_STYLE[task.status];
          const patient = patients.find((p) => p.id === task.patientId);
          const isDone  = task.status === "done";
          const isSaving = saving.has(task.id);

          return (
            <div
              key={task.id}
              style={{
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid #F3EFF4",
                opacity: isSaving ? 0.65 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Main row: icon + text + tag */}
              <div className="flex items-start" style={{ gap: 10 }}>
                {/* Done / pending circle icon */}
                <span
                  className={`ti shrink-0 ${isDone ? "ti-circle-check-filled" : "ti-circle"}`}
                  style={{
                    fontSize: 18,
                    color: isDone ? "#8A8394" : "#C9BBDF",
                    marginTop: 1,
                  }}
                  aria-hidden="true"
                />

                {/* Task text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: isDone ? "#8A8394" : "#1D1B2E",
                    textDecoration: isDone ? "line-through" : "none",
                    lineHeight: 1.3,
                  }}>
                    {task.title}
                  </div>
                  {patient && (
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 2 }}>
                      {patient.name} · {patient.room} · {task.dueContext}
                    </div>
                  )}
                </div>

                {/* Status tag */}
                <span style={{
                  flexShrink: 0, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "3px 8px", borderRadius: 999,
                  background: tag.background, color: tag.color,
                  whiteSpace: "nowrap",
                }}>
                  {tag.label}
                </span>
              </div>

              {/* Action button row — indented to align with text */}
              {!isDone && (
                <div style={{ paddingLeft: 28, marginTop: 8 }}>
                  <NursingTaskActionButton
                    status={task.status}
                    isSaving={isSaving}
                    onClick={() =>
                      handleTransition(
                        task.id,
                        task.status === "pending" ? "active" : "done"
                      )
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
