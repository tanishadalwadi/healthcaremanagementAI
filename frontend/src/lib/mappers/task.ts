import type { NursingTask, NursingTaskStatus } from "@/types";

export interface BackendTaskSummary {
  id: string;
  patientId: string;
  title: string;
  description: string | null;
  assignedTo: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  dueAt: string | null;
  completedAt: string | null;
}

export function mapTaskStatusToNursing(
  status: BackendTaskSummary["status"],
): NursingTaskStatus {
  if (status === "IN_PROGRESS") return "active";
  if (status === "COMPLETED") return "done";
  return "pending";
}

export function mapNursingStatusToTask(
  status: NursingTaskStatus,
): BackendTaskSummary["status"] {
  if (status === "active") return "IN_PROGRESS";
  if (status === "done") return "COMPLETED";
  return "TODO";
}

function formatDueContext(task: BackendTaskSummary): string {
  if (task.status === "COMPLETED") return "Completed";
  if (task.status === "BLOCKED") return "Blocked — needs attention";
  if (task.dueAt) {
    const due = new Date(task.dueAt);
    const diffMs = due.getTime() - Date.now();
    if (diffMs < 0) return "Overdue";
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 24) return `Due in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Due in ${days}d`;
  }
  return task.description?.trim() || "Due: Ongoing";
}

export function mapTaskToNursingTask(task: BackendTaskSummary): NursingTask {
  return {
    id: task.id,
    patientId: task.patientId,
    nurseId: task.assignedTo,
    title: task.title,
    status: mapTaskStatusToNursing(task.status),
    dueContext: formatDueContext(task),
  };
}
