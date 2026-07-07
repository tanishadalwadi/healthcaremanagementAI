import { NotFoundError } from "../../errors/app-error.js";
import type { AiRepository, PatientContextRecord } from "./repository.js";
import type { AiSummaryDto } from "./types.js";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildSummary(patient: PatientContextRecord): string {
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

  const openTasks = patient.tasks.filter(
    (task) => task.status !== "COMPLETED",
  );
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

export class AiService {
  constructor(private readonly repository: AiRepository) {}

  async getPatientSummary(patientId: string): Promise<AiSummaryDto> {
    const patient = await this.repository.findPatientContext(patientId);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    return {
      patientId,
      summary: buildSummary(patient),
      generatedAt: new Date(),
    };
  }
}
