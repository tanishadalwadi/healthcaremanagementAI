import type {
  CareTeamAssignment,
  Department,
  DischargeCondition,
  DischargeConditionName,
  EventType,
  Patient,
  PatientDetail,
  PatientEvent,
  PatientStatus,
  Sex,
  TreatmentPlanItem,
  VitalsEntry,
  WorkflowGroup,
  WorkflowPhase,
  WorkflowStep,
  WorkflowStepName,
} from "@/types";

// ─── Backend DTO shapes (mirror backend/src/modules/patients/types.ts) ────────

export interface BackendPatientSummary {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  room: string | null;
  diagnosis: string | null;
  status: "ACTIVE" | "DISCHARGED" | "WAITING";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  departmentId: string;
  assignedNurseId: string | null;
  assignedDoctorId: string | null;
  dischargeRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendWorkflowEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  sequence: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  occurredAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BackendPatientEvent {
  id: string;
  eventType: string;
  description: string;
  createdBy: string;
  timestamp: string;
}

export interface BackendVitalSign {
  id: string;
  patientId: string;
  recordedById: string | null;
  bloodPressure: string;
  pulse: number;
  temperature: number;
  respRate: number;
  o2Saturation: number;
  recordedAt: string;
}

export interface BackendPatientDetail extends BackendPatientSummary {
  department: { id: string; name: string; status: string };
  assignedNurse: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  assignedDoctor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  workflowEvents: BackendWorkflowEvent[];
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    assignedTo: string;
    status: string;
    dueAt: string | null;
    completedAt: string | null;
  }>;
  events: BackendPatientEvent[];
}

// ─── Field mappers ────────────────────────────────────────────────────────────

const DEPARTMENT_ALIASES: Record<string, Department> = {
  "General Medicine": "General Medicine",
  "Internal Medicine": "General Medicine",
  Emergency: "General Medicine",
  Surgery: "General Medicine",
  Oncology: "General Medicine",
  Pediatrics: "General Medicine",
  Neurology: "General Medicine",
  Radiology: "Radiology",
  ICU: "ICU",
  Cardiology: "Cardiology",
  Orthopedics: "Orthopedics",
};

const EVENT_TO_STEP: Record<
  string,
  { phase: WorkflowPhase; name: WorkflowStepName }
> = {
  ADMISSION: { phase: "intake", name: "Registered" },
  TRIAGE: { phase: "intake", name: "Vitals" },
  CONSULTATION: { phase: "intake", name: "Doctor assessment" },
  IMAGING_ORDERED: { phase: "intake", name: "Scan ordered" },
  IMAGING_COMPLETED: { phase: "intake", name: "Scan results" },
  LAB_ORDERED: { phase: "inpatient", name: "Labs" },
  LAB_COMPLETED: { phase: "inpatient", name: "Labs" },
  MEDICATION: { phase: "inpatient", name: "Medications" },
  TREATMENT: { phase: "inpatient", name: "Rounds" },
  DISCHARGE_PLANNING: { phase: "discharge", name: "Discharge planning" },
  INSURANCE_REVIEW: { phase: "discharge", name: "Insurance approval" },
  DISCHARGE_READY: { phase: "discharge", name: "Transportation arranged" },
  DISCHARGE: { phase: "discharge", name: "Physician sign-off" },
  BLOCKED: { phase: "inpatient", name: "Rounds" },
};

const DISCHARGE_CONDITION_SOURCES: Array<{
  condition: DischargeConditionName;
  eventType: string;
  owner: Department | "Care Coordination" | "Pharmacy" | "Transport";
}> = [
  { condition: "Physician approval", eventType: "DISCHARGE", owner: "Care Coordination" },
  { condition: "Medication prepared", eventType: "MEDICATION", owner: "Pharmacy" },
  { condition: "Transportation", eventType: "DISCHARGE_READY", owner: "Transport" },
  { condition: "Patient education", eventType: "DISCHARGE_PLANNING", owner: "Care Coordination" },
  { condition: "Insurance approval", eventType: "INSURANCE_REVIEW", owner: "Care Coordination" },
];

const BACKEND_EVENT_TYPE_MAP: Record<string, EventType> = {
  PATIENT_ADMITTED: "admission",
  MEDICATION_ADMINISTERED: "medication",
  LAB_COMPLETED: "lab_result",
  MRI_COMPLETED: "scan_result",
  NEW_DOCTOR_ORDER: "note",
  INSURANCE_DELAY: "discharge_update",
  DISCHARGE_READY: "discharge_update",
  SHIFT_STARTED: "note",
  SHIFT_ENDED: "note",
};

export function mapDepartmentName(name: string): Department {
  return DEPARTMENT_ALIASES[name] ?? "General Medicine";
}

export function mapGender(gender: BackendPatientSummary["gender"]): Sex {
  if (gender === "MALE") return "M";
  if (gender === "FEMALE") return "F";
  return "Other";
}

export function mapPatientStatus(
  status: BackendPatientSummary["status"],
  priority: BackendPatientSummary["priority"],
): PatientStatus {
  if (priority === "CRITICAL") return "critical";
  if (status === "WAITING") return "blocked";
  if (priority === "HIGH") return "delayed";
  return "ontrack";
}

function mapWorkflowStepStatus(
  status: BackendWorkflowEvent["status"],
): PatientStatus {
  if (status === "BLOCKED") return "blocked";
  if (status === "IN_PROGRESS") return "delayed";
  if (status === "PENDING") return "ontrack";
  return "ontrack";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function dayOfStay(admittedAt: string): number {
  const ms = Date.now() - new Date(admittedAt).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function elapsedDisplay(updatedAt: string): string | null {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours < 1) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function groupStatus(steps: WorkflowStep[]): PatientStatus {
  if (steps.some((s) => s.status === "blocked" || s.status === "critical")) {
    return "blocked";
  }
  if (steps.some((s) => s.status === "delayed")) return "delayed";
  return "ontrack";
}

function emptyWorkflowGroups(): WorkflowGroup[] {
  return [
    { phase: "intake", label: "Intake & diagnosis", status: "ontrack", steps: [] },
    {
      phase: "inpatient",
      label: "Inpatient care",
      status: "ontrack",
      steps: [],
      eventCount: 0,
      flaggedCount: 0,
    },
    { phase: "discharge", label: "Discharge", status: "ontrack", steps: [] },
  ];
}

function mapWorkflowEventsToGroups(
  events: BackendWorkflowEvent[],
  patientId: string,
): WorkflowGroup[] {
  if (events.length === 0) return emptyWorkflowGroups();

  const phaseSteps: Record<WorkflowPhase, WorkflowStep[]> = {
    intake: [],
    inpatient: [],
    discharge: [],
  };

  const phaseOccurrence: Record<string, number> = {};

  for (const event of events) {
    const mapping = EVENT_TO_STEP[event.eventType] ?? {
      phase: "inpatient" as WorkflowPhase,
      name: "Rounds" as WorkflowStepName,
    };
    const key = `${mapping.phase}:${mapping.name}`;
    phaseOccurrence[key] = (phaseOccurrence[key] ?? 0) + 1;

    phaseSteps[mapping.phase].push({
      id: event.id,
      patientId,
      phase: mapping.phase,
      name: mapping.name,
      status: mapWorkflowStepStatus(event.status),
      scheduledAt: toIso(event.occurredAt),
      completedAt: event.completedAt ? toIso(event.completedAt) : null,
      note: event.description
        ? `${event.title}: ${event.description}`
        : event.title,
      flagged: event.status === "BLOCKED",
      occurrence: phaseOccurrence[key]!,
    });
  }

  const inpatientSteps = phaseSteps.inpatient;
  const flaggedCount = inpatientSteps.filter((s) => s.flagged).length;

  return [
    {
      phase: "intake",
      label: "Intake & diagnosis",
      status: groupStatus(phaseSteps.intake),
      steps: phaseSteps.intake,
    },
    {
      phase: "inpatient",
      label: "Inpatient care",
      status: groupStatus(inpatientSteps),
      steps: inpatientSteps,
      eventCount: inpatientSteps.length,
      flaggedCount,
    },
    {
      phase: "discharge",
      label: "Discharge",
      status: groupStatus(phaseSteps.discharge),
      steps: phaseSteps.discharge,
    },
  ];
}

function mapDischargeConditions(
  events: BackendWorkflowEvent[],
  patientId: string,
  department: Department,
): DischargeCondition[] {
  return DISCHARGE_CONDITION_SOURCES.map((source, index) => {
    const matches = events.filter((e) => e.eventType === source.eventType);
    const latest = matches[matches.length - 1];
    const complete = latest?.status === "COMPLETED";
    const updatedAt = latest ? toIso(latest.occurredAt) : new Date().toISOString();

    return {
      id: `${patientId}-dc-${index}`,
      patientId,
      condition: source.condition,
      status: complete ? "complete" : "incomplete",
      owningDepartment:
        source.owner === "Care Coordination" ? department : source.owner,
      updatedAt,
      elapsedDisplay: complete ? null : elapsedDisplay(updatedAt),
    };
  });
}

function mapBackendEvent(event: BackendPatientEvent, patientId: string): PatientEvent {
  return {
    id: event.id,
    patientId,
    type: BACKEND_EVENT_TYPE_MAP[event.eventType] ?? "note",
    timestamp: toIso(event.timestamp),
    actor: event.createdBy,
    summary: event.description,
    detail: event.eventType,
    flagged: event.eventType === "INSURANCE_DELAY",
  };
}

function mapTasksToTreatmentPlan(
  tasks: BackendPatientDetail["tasks"],
  patientId: string,
): TreatmentPlanItem[] {
  return tasks.map((task, index) => ({
    id: task.id,
    patientId,
    order: index + 1,
    description: task.title,
    completed: task.status === "COMPLETED",
    completedAt: task.completedAt ? toIso(task.completedAt) : null,
  }));
}

export function mapVitalSignToEntry(
  vital: BackendVitalSign,
  nurseId: string,
): VitalsEntry {
  return {
    patientId: vital.patientId,
    nurseId: vital.recordedById ?? nurseId,
    bp: vital.bloodPressure,
    pulse: vital.pulse,
    temp: vital.temperature,
    respRate: vital.respRate,
    o2Sat: vital.o2Saturation,
    recordedAt: toIso(vital.recordedAt),
  };
}

function buildAiSummary(
  patient: BackendPatientDetail,
  department: Department,
  vitals: VitalsEntry[],
): string {
  const latestVital = vitals[0];
  const vitalNote = latestVital
    ? ` Latest vitals: BP ${latestVital.bp}, pulse ${latestVital.pulse} bpm, O₂ ${latestVital.o2Sat}%.`
    : "";
  const diagnosis = patient.diagnosis ?? "Assessment pending";

  return `${patient.firstName} ${patient.lastName} — ${diagnosis}. Admitted to ${department}${
    patient.room ? `, room ${patient.room}` : ""
  }. Priority: ${patient.priority.toLowerCase()}.${vitalNote}`;
}

// ─── Public mappers ───────────────────────────────────────────────────────────

export function mapSummaryToPatient(
  patient: BackendPatientSummary,
  departmentName: string,
): Patient {
  const admittedAt = toIso(patient.createdAt);
  const dischargedAt =
    patient.status === "DISCHARGED" ? toIso(patient.updatedAt) : null;
  const dept = mapDepartmentName(departmentName);
  const diagnosis =
    patient.diagnosis ?? `${patient.patientNumber} · ${dept}`;

  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    name: `${patient.firstName} ${patient.lastName}`,
    initials: initialsFromName(`${patient.firstName} ${patient.lastName}`),
    age: patient.age,
    sex: mapGender(patient.gender),
    room: patient.room ?? "—",
    departmentId: dept,
    status: mapPatientStatus(patient.status, patient.priority),
    dayOfStay: dayOfStay(admittedAt),
    admittedAt,
    dischargedAt,
    diagnosis,
    aiSummary: `${patient.firstName} ${patient.lastName} admitted to ${dept}${
      patient.room ? `, room ${patient.room}` : ""
    }. Priority: ${patient.priority.toLowerCase()}.`,
  };
}

export interface BackendDischargeCondition {
  id: string;
  patientId: string;
  condition: string;
  status: "COMPLETE" | "INCOMPLETE";
  owningDepartment: string;
  updatedAt: string;
}

function mapApiDischargeCondition(
  record: BackendDischargeCondition,
): DischargeCondition {
  const updatedAt = toIso(record.updatedAt);
  return {
    id: record.id,
    patientId: record.patientId,
    condition: record.condition as DischargeConditionName,
    status: record.status === "COMPLETE" ? "complete" : "incomplete",
    owningDepartment:
      record.owningDepartment as DischargeCondition["owningDepartment"],
    updatedAt,
    elapsedDisplay:
      record.status === "COMPLETE" ? null : elapsedDisplay(updatedAt),
  };
}

export function mapDetailToPatientDetail(
  patient: BackendPatientDetail,
  vitals: VitalsEntry[] = [],
  options?: {
    dischargeConditions?: BackendDischargeCondition[];
    aiSummary?: string;
  },
): PatientDetail {
  const dept = mapDepartmentName(patient.department.name);
  const base = mapSummaryToPatient(patient, patient.department.name);
  const careTeam: CareTeamAssignment[] = [];

  if (patient.assignedDoctor) {
    careTeam.push({
      patientId: patient.id,
      doctor: {
        id: patient.assignedDoctor.id,
        name: patient.assignedDoctor.name,
        initials: initialsFromName(patient.assignedDoctor.name),
        specialty: patient.department.name,
        role: "Attending",
      },
    });
  }

  if (patient.assignedNurse) {
    careTeam.push({
      patientId: patient.id,
      nurse: {
        id: patient.assignedNurse.id,
        name: patient.assignedNurse.name,
        initials: initialsFromName(patient.assignedNurse.name),
        shift: "Day",
      },
    });
  }

  const workflowGroups = mapWorkflowEventsToGroups(
    patient.workflowEvents,
    patient.id,
  );

  const dischargeConditions =
    options?.dischargeConditions && options.dischargeConditions.length > 0
      ? options.dischargeConditions.map(mapApiDischargeCondition)
      : mapDischargeConditions(patient.workflowEvents, patient.id, dept);

  return {
    ...base,
    diagnosis: patient.diagnosis ?? base.diagnosis,
    aiSummary:
      options?.aiSummary?.trim() || buildAiSummary(patient, dept, vitals),
    careTeam,
    treatmentPlan: mapTasksToTreatmentPlan(patient.tasks, patient.id),
    dischargeConditions,
    workflowGroups,
    events: patient.events.map((e) => mapBackendEvent(e, patient.id)),
    vitalsHistory: vitals,
    dischargeRequested: patient.dischargeRequestedAt !== null,
    dischargeRequestedAt: patient.dischargeRequestedAt
      ? toIso(patient.dischargeRequestedAt)
      : null,
  };
}
