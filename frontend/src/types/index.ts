// ─── Pulse domain types ───────────────────────────────────────────────────────
// These match what the design has locked. When the backend is real,
// only lib/api.ts changes — these types remain the contract.

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type PatientStatus = "ontrack" | "delayed" | "blocked" | "critical";

export type Department =
  | "General Medicine"
  | "Radiology"
  | "ICU"
  | "Cardiology"
  | "Orthopedics";

export type Sex = "M" | "F" | "Other";

export type NurseShift = "Day" | "Night" | "Evening";

export type DoctorRole =
  | "Attending"
  | "Consulting"
  | "Resident"
  | "Fellow"
  | "Hospitalist";

// ─── Workflow ─────────────────────────────────────────────────────────────────

/** All possible named workflow steps across all phases */
export type WorkflowStepName =
  // Intake & diagnosis
  | "Registered"
  | "Vitals"
  | "Doctor assessment"
  | "Scan ordered"
  | "Scan results"
  | "Bed assigned"
  // Inpatient care (recurring — each occurrence is a separate WorkflowStep row)
  | "Medications"
  | "Labs"
  | "Rounds"
  // Discharge
  | "Discharge planning"
  | "Patient education"
  | "Medication prepared"
  | "Transportation arranged"
  | "Insurance approval"
  | "Physician sign-off";

export type WorkflowPhase = "intake" | "inpatient" | "discharge";

/**
 * A single occurrence of a workflow step.
 * Recurring steps (Medications, Labs, Rounds) each produce a separate row
 * per occurrence — not a single "latest status" field.
 */
export interface WorkflowStep {
  id: string;
  patientId: string;
  phase: WorkflowPhase;
  name: WorkflowStepName;
  status: PatientStatus;
  /** ISO timestamp when this step was scheduled/due */
  scheduledAt: string;
  /** ISO timestamp when completed; null if still pending */
  completedAt: string | null;
  /** Free-text note — e.g. "Metoprolol 2:00 PM overdue" */
  note: string | null;
  /** True if this step has been flagged for attention */
  flagged: boolean;
  /** Occurrence index for recurring steps (1-based) */
  occurrence: number;
}

// ─── Events (audit log) ───────────────────────────────────────────────────────

export type EventType =
  | "admission"
  | "vitals"
  | "medication"
  | "lab_order"
  | "lab_result"
  | "scan_order"
  | "scan_result"
  | "rounds"
  | "note"
  | "status_change"
  | "discharge_update"
  | "discharge";

/**
 * Append-only event log — never deleted, even post-discharge.
 * This is the source of truth for the WorkflowTimeline.
 */
export interface PatientEvent {
  id: string;
  patientId: string;
  type: EventType;
  timestamp: string; // ISO
  actor: string; // "Dr. Osei", "Nurse Rivera", "System"
  summary: string; // One-line description shown in timeline
  detail: string | null; // Optional expanded text
  flagged: boolean;
}

// ─── Care team ────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  initials: string;
  specialty: string;
}

export interface Nurse {
  id: string;
  name: string;
  initials: string;
  shift: NurseShift;
}

/** Many-to-many: a patient can have multiple doctors (attending + consulting) */
export interface CareTeamAssignment {
  patientId: string;
  doctor?: Doctor & { role: DoctorRole };
  nurse?: Nurse;
}

// ─── Treatment plan ───────────────────────────────────────────────────────────

export interface TreatmentPlanItem {
  id: string;
  patientId: string;
  order: number;
  description: string;
  completed: boolean;
  completedAt: string | null; // ISO
}

// ─── Discharge conditions ─────────────────────────────────────────────────────

export type DischargeConditionName =
  | "Physician approval"
  | "Medication prepared"
  | "Transportation"
  | "Patient education"
  | "Insurance approval";

export type DischargeConditionStatus = "complete" | "incomplete";

/**
 * Each discharge condition is independently tracked.
 * Replaces the single "blocked reason" field from older designs.
 */
export interface DischargeCondition {
  id: string;
  patientId: string;
  condition: DischargeConditionName;
  status: DischargeConditionStatus;
  owningDepartment: Department | "Care Coordination" | "Pharmacy" | "Transport";
  /** ISO timestamp of last status update */
  updatedAt: string;
  /** Elapsed time string for display, e.g. "2h 14m" — derived field */
  elapsedDisplay: string | null;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  /** Hospital MRN-style identifier, e.g. P-1001 */
  patientNumber: string;
  name: string;
  initials: string;
  age: number;
  sex: Sex;
  room: string;
  departmentId: Department;
  status: PatientStatus;
  dayOfStay: number;
  admittedAt: string; // ISO
  /** null while still admitted */
  dischargedAt: string | null;
  diagnosis: string;
  /** One-sentence AI summary — always cites a specific logged data point */
  aiSummary: string;
}

// ─── Nursing tasks ────────────────────────────────────────────────────────────

/**
 * Task states are deliberately separate from PatientStatus:
 *   active   = in progress right now
 *   pending  = not yet started / waiting on something
 *   done     = completed this shift
 *
 * These are shift-level operational tasks, not patient care status.
 */
export type NursingTaskStatus = "active" | "pending" | "done";

export interface NursingTask {
  id: string;
  patientId: string;
  nurseId: string;
  title: string;
  status: NursingTaskStatus;
  /** Short context string: "Due: Ongoing", "Due: After pharmacy", etc. */
  dueContext: string;
}

// ─── Bed inventory ────────────────────────────────────────────────────────────

export interface Bed {
  id: string;
  roomLabel: string;        // e.g. "4A-12" — matches Patient.room when occupied
  department: Department;
  status: "available" | "occupied";
  patientId: string | null; // null when available
}

// ─── Ambulance inventory ──────────────────────────────────────────────────────

export interface Ambulance {
  id: string;
  label: string;            // e.g. "Unit 3"
  status: "available" | "dispatched";
}

// ─── Vitals entry ─────────────────────────────────────────────────────────────

export interface VitalsEntry {
  patientId: string;
  nurseId: string;
  /** e.g. "118/76" */
  bp: string;
  /** beats per minute */
  pulse: number;
  /** °F */
  temp: number;
  /** breaths per minute */
  respRate: number;
  /** percentage 0-100 */
  o2Sat: number;
  recordedAt: string; // ISO
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  status: PatientStatus;
  summary: string;
  timestamp: string; // ISO
  read: boolean;
}

// ─── Aggregated view models (used by components) ──────────────────────────────

/** Collapsed status for a workflow group = worst status among child steps */
export function worstStatus(statuses: PatientStatus[]): PatientStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("delayed")) return "delayed";
  return "ontrack";
}

export interface WorkflowGroup {
  phase: WorkflowPhase;
  label: "Intake & diagnosis" | "Inpatient care" | "Discharge";
  status: PatientStatus; // derived: worst among child steps
  steps: WorkflowStep[];
  /** For inpatient only */
  eventCount?: number;
  flaggedCount?: number;
}

export interface PatientDetail extends Patient {
  careTeam: CareTeamAssignment[];
  treatmentPlan: TreatmentPlanItem[];
  dischargeConditions: DischargeCondition[];
  workflowGroups: WorkflowGroup[];
  events: PatientEvent[];
  /** Structured vitals history — seeded in generator, appended by postVitals(). */
  vitalsHistory: VitalsEntry[];
  /** Doctor has flagged this patient as ready for admin to discharge. */
  dischargeRequested: boolean;
  /** ISO timestamp when the discharge request was made. null if not requested. */
  dischargeRequestedAt: string | null;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface BillLineItem {
  id: string;
  category: "room" | "doctor" | "lab" | "medication" | "nursing" | "other";
  description: string;
  quantity: number;
  unitRate: number; // USD
  total: number;   // quantity × unitRate
}

export interface Bill {
  patientId: string;
  patientName: string;
  generatedAt: string; // ISO
  lineItems: BillLineItem[];
  subtotal: number;
  /** Insurance adjustment — negative value (discount) or 0 if not approved */
  insuranceAdjustment: number;
  total: number;
}
