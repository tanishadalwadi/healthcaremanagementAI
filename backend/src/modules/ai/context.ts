import type { PatientContextRecord } from "./repository.js";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapPatientStatus(status: string, priority: string): string {
  if (priority === "CRITICAL") return "critical";
  if (status === "WAITING") return "blocked";
  if (priority === "HIGH") return "delayed";
  return "ontrack";
}

export function serializePatientContext(patient: PatientContextRecord) {
  const latestVital = patient.vitalSigns[0];
  const openTasks = patient.tasks.filter((task) => task.status !== "COMPLETED");
  const incompleteConditions = patient.dischargeConditions.filter(
    (condition) => condition.status === "INCOMPLETE",
  );
  const blockedWorkflow = patient.workflowEvents.filter(
    (event) => event.status === "BLOCKED",
  );
  const activeWorkflow = patient.workflowEvents.filter(
    (event) => event.status === "IN_PROGRESS" || event.status === "PENDING",
  );

  return {
    id: patient.id,
    name: `${patient.firstName} ${patient.lastName}`,
    diagnosis: patient.diagnosis ?? "Assessment pending",
    department: patient.department.name,
    room: patient.room,
    status: mapPatientStatus(patient.status, patient.priority),
    priority: patient.priority.toLowerCase(),
    assignedDoctor: patient.assignedDoctor?.name ?? null,
    assignedNurse: patient.assignedNurse?.name ?? null,
    latestVitals: latestVital
      ? {
          bloodPressure: latestVital.bloodPressure,
          pulse: latestVital.pulse,
          temperature: latestVital.temperature,
          respRate: latestVital.respRate,
          o2Saturation: latestVital.o2Saturation,
          recordedAt: formatTime(latestVital.recordedAt),
        }
      : null,
    openTasks: openTasks.slice(0, 5).map((task) => ({
      title: task.title,
      status: task.status,
      dueAt: task.dueAt?.toISOString() ?? null,
    })),
    workflowBlocked: blockedWorkflow.map((event) => event.title),
    workflowActive: activeWorkflow.slice(0, 3).map((event) => event.title),
    dischargeConditionsIncomplete: incompleteConditions.map(
      (condition) => `${condition.condition} (${condition.owningDepartment})`,
    ),
    dischargeRequestedAt: patient.dischargeRequestedAt
      ? formatTime(patient.dischargeRequestedAt)
      : null,
  };
}

export function buildRuleBasedSummary(patient: PatientContextRecord): string {
  const name = `${patient.firstName} ${patient.lastName}`;
  const department = patient.department.name;
  const diagnosis = patient.diagnosis ?? "Assessment pending";
  const roomNote = patient.room ? `, room ${patient.room}` : "";
  const parts: string[] = [];

  parts.push(
    `${name} — ${diagnosis}. Admitted to ${department}${roomNote}. Priority: ${patient.priority.toLowerCase()}.`,
  );

  const latestVital = patient.vitalSigns[0];
  if (latestVital) {
    const recordedAt = formatTime(latestVital.recordedAt);
    parts.push(
      `Latest vitals at ${recordedAt}: BP ${latestVital.bloodPressure}, pulse ${latestVital.pulse} bpm, temp ${latestVital.temperature.toFixed(1)}°F, resp ${latestVital.respRate}/min, O₂ ${latestVital.o2Saturation}%.`,
    );
  }

  const careTeam: string[] = [];
  if (patient.assignedDoctor) {
    careTeam.push(`Dr. ${patient.assignedDoctor.name.replace(/^Dr\.\s*/i, "")}`);
  }
  if (patient.assignedNurse) {
    careTeam.push(`nurse ${patient.assignedNurse.name}`);
  }
  if (careTeam.length > 0) {
    parts.push(`Care team: ${careTeam.join(" and ")}.`);
  }

  const activeWorkflow = patient.workflowEvents.filter(
    (event) => event.status === "IN_PROGRESS" || event.status === "PENDING",
  );
  const blockedWorkflow = patient.workflowEvents.filter(
    (event) => event.status === "BLOCKED",
  );

  if (blockedWorkflow.length > 0) {
    const blockedTitles = blockedWorkflow.map((event) => event.title).join(", ");
    parts.push(`Workflow blocked on: ${blockedTitles}.`);
  } else if (activeWorkflow.length > 0) {
    const activeTitles = activeWorkflow
      .slice(0, 3)
      .map((event) => event.title)
      .join(", ");
    parts.push(`Active workflow steps: ${activeTitles}.`);
  }

  const openTasks = patient.tasks.filter((task) => task.status !== "COMPLETED");
  if (openTasks.length > 0) {
    const taskTitles = openTasks
      .slice(0, 3)
      .map((task) => task.title)
      .join(", ");
    parts.push(
      `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}: ${taskTitles}.`,
    );
  }

  const incompleteConditions = patient.dischargeConditions.filter(
    (condition) => condition.status === "INCOMPLETE",
  );
  if (incompleteConditions.length > 0) {
    const conditions = incompleteConditions
      .map((condition) => `${condition.condition} (${condition.owningDepartment})`)
      .join(", ");
    parts.push(`Discharge pending: ${conditions}.`);
  } else if (patient.dischargeConditions.length > 0) {
    parts.push("All discharge conditions are complete.");
  }

  if (patient.dischargeRequestedAt) {
    parts.push(
      `Discharge requested at ${formatTime(patient.dischargeRequestedAt)}.`,
    );
  }

  if (patient.priority === "CRITICAL" && latestVital) {
    if (latestVital.o2Saturation < 92) {
      parts.push(
        `Critical alert: O₂ saturation ${latestVital.o2Saturation}% below threshold.`,
      );
    } else if (latestVital.pulse > 120) {
      parts.push(
        `Critical alert: elevated pulse ${latestVital.pulse} bpm recorded at ${formatTime(latestVital.recordedAt)}.`,
      );
    }
  }

  return parts.join(" ");
}

type WorkflowPhase = "intake" | "inpatient" | "discharge";

const EVENT_TO_PHASE: Record<string, WorkflowPhase> = {
  ADMISSION: "intake",
  TRIAGE: "intake",
  CONSULTATION: "intake",
  IMAGING_ORDERED: "intake",
  IMAGING_COMPLETED: "intake",
  LAB_ORDERED: "inpatient",
  LAB_COMPLETED: "inpatient",
  MEDICATION: "inpatient",
  TREATMENT: "inpatient",
  BLOCKED: "inpatient",
  DISCHARGE_PLANNING: "discharge",
  INSURANCE_REVIEW: "discharge",
  DISCHARGE_READY: "discharge",
  DISCHARGE: "discharge",
};

export function mapEventPhase(eventType: string): WorkflowPhase {
  return EVENT_TO_PHASE[eventType] ?? "inpatient";
}

export function buildStepNarration(
  event: PatientContextRecord["workflowEvents"][number],
  patient: PatientContextRecord,
): string {
  const name = `${patient.firstName} ${patient.lastName}`;
  const time = formatTime(event.occurredAt);
  const detail = event.description ? ` ${event.description}` : "";
  const statusNote =
    event.status === "BLOCKED"
      ? " This step is currently blocked."
      : event.status === "IN_PROGRESS"
        ? " In progress."
        : event.status === "COMPLETED"
          ? " Completed."
          : "";

  return `At ${time}, ${name}: ${event.title}.${detail}${statusNote}`;
}
