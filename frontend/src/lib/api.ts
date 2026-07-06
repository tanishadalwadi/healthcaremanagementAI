/**
 * lib/api.ts — THE SWAP SEAM
 *
 * All component data access goes through this file — no component
 * imports from mock-data/generator.ts directly.
 *
 * When the backend is ready: replace each function body with a fetch()
 * call to the real endpoint. Zero component changes required.
 */

import type {
  Patient,
  PatientDetail,
  WorkflowStep,
  WorkflowGroup,
  CareTeamAssignment,
  TreatmentPlanItem,
  DischargeCondition,
  PatientEvent,
  Notification,
  NursingTask,
  NurseShift,
  VitalsEntry,
  Department,
  PatientStatus,
  Doctor,
  Bed,
  Ambulance,
  Bill,
  BillLineItem,
} from "@/types";
import {
  ALL_PATIENTS,
  ALL_NOTIFICATIONS,
  ALL_NURSING_TASKS,
  ALL_DOCTORS,
  ALL_BEDS,
  ALL_AMBULANCES,
} from "@/lib/mock-data/generator";

// ─── Simulated async delay (remove when swapping to real API) ─────────────────
const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Patient list ─────────────────────────────────────────────────────────────

/** Returns all current (non-discharged) patients. */
export async function getPatients(): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter((p) => p.dischargedAt === null).map(toPatient);
}

/** Returns only discharged patients — used in Doctor > History view. */
export async function getDischargedPatients(): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter((p) => p.dischargedAt !== null).map(toPatient);
}

/** Filter admitted patients by department. */
export async function getPatientsByDepartment(
  dept: Department
): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) => p.departmentId === dept && p.dischargedAt === null
  ).map(toPatient);
}

/** Filter admitted patients by status. */
export async function getPatientsByStatus(
  status: PatientStatus
): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) => p.status === status && p.dischargedAt === null
  ).map(toPatient);
}

// ─── Patient detail ───────────────────────────────────────────────────────────

/** Returns full PatientDetail (includes careTeam, workflow, events, etc.). */
export async function getPatientById(id: string): Promise<PatientDetail | null> {
  await delay();
  return ALL_PATIENTS.find((p) => p.id === id) ?? null;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export async function getWorkflow(patientId: string): Promise<WorkflowGroup[]> {
  await delay();
  const p = ALL_PATIENTS.find((pt) => pt.id === patientId);
  return p?.workflowGroups ?? [];
}

// ─── Care team ────────────────────────────────────────────────────────────────

export async function getCareTeam(
  patientId: string
): Promise<CareTeamAssignment[]> {
  await delay();
  const p = ALL_PATIENTS.find((pt) => pt.id === patientId);
  return p?.careTeam ?? [];
}

// ─── Treatment plan ───────────────────────────────────────────────────────────

export async function getTreatmentPlan(
  patientId: string
): Promise<TreatmentPlanItem[]> {
  await delay();
  const p = ALL_PATIENTS.find((pt) => pt.id === patientId);
  return p?.treatmentPlan ?? [];
}

// ─── Discharge conditions ─────────────────────────────────────────────────────

export async function getDischargeConditions(
  patientId: string
): Promise<DischargeCondition[]> {
  await delay();
  const p = ALL_PATIENTS.find((pt) => pt.id === patientId);
  return p?.dischargeConditions ?? [];
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getPatientEvents(
  patientId: string
): Promise<PatientEvent[]> {
  await delay();
  const p = ALL_PATIENTS.find((pt) => pt.id === patientId);
  return p?.events ?? [];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  await delay();
  return ALL_NOTIFICATIONS;
}

export async function getUnreadNotificationCount(): Promise<number> {
  await delay();
  return ALL_NOTIFICATIONS.filter((n) => !n.read).length;
}

// ─── KPI aggregates (Nurse dashboard) ────────────────────────────────────────

export interface DashboardKPIs {
  total: number;
  delayed: number;
  critical: number;
  dischargeReady: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  await delay();
  const admitted = ALL_PATIENTS.filter((p) => p.dischargedAt === null);
  return {
    total: admitted.length,
    delayed: admitted.filter((p) => p.status === "delayed").length,
    critical: admitted.filter((p) => p.status === "critical").length,
    dischargeReady: admitted.filter(
      (p) =>
        p.status === "ontrack" &&
        p.dischargeConditions.every((c) => c.status === "complete")
    ).length,
  };
}

// ─── "Needs your attention" feed ─────────────────────────────────────────────

export interface AttentionItem {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  status: PatientStatus;
  title: string;
  subtitle: string;
  relativeTime: string;
  /** icon name from Tabler Icons, e.g. "ti-alert-triangle" */
  icon: string;
}

export async function getAttentionFeed(): Promise<AttentionItem[]> {
  await delay();
  const items: AttentionItem[] = [];

  for (const p of ALL_PATIENTS.filter((pt) => pt.dischargedAt === null)) {
    if (p.status === "critical") {
      items.push({
        id: uid(),
        patientId: p.id,
        patientName: p.name,
        room: p.room,
        status: "critical",
        title: "Critical status — immediate review needed",
        subtitle: p.diagnosis,
        relativeTime: relativeTime(p.admittedAt),
        icon: "ti-alert-circle",
      });
    }

    if (p.status === "blocked") {
      const incomplete = p.dischargeConditions.filter(
        (c) => c.status === "incomplete"
      );
      items.push({
        id: uid(),
        patientId: p.id,
        patientName: p.name,
        room: p.room,
        status: "blocked",
        title: `Discharge blocked — ${incomplete[0]?.condition ?? "pending"}`,
        subtitle: `${incomplete.length} of 5 conditions outstanding`,
        relativeTime: relativeTime(incomplete[0]?.updatedAt ?? p.admittedAt),
        icon: "ti-circle-x",
      });
    }

    const flaggedStep = p.workflowGroups
      .flatMap((g) => g.steps)
      .find((s) => s.flagged);
    if (flaggedStep && p.status === "delayed") {
      items.push({
        id: uid(),
        patientId: p.id,
        patientName: p.name,
        room: p.room,
        status: "delayed",
        title: `${flaggedStep.name} overdue`,
        subtitle: flaggedStep.note ?? p.diagnosis,
        relativeTime: relativeTime(flaggedStep.scheduledAt),
        icon: "ti-clock-exclamation",
      });
    }
  }

  // Sort: critical first, then blocked, then delayed
  const order: PatientStatus[] = ["critical", "blocked", "delayed", "ontrack"];
  return items.sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
  );
}

// ─── Doctor-scoped data ───────────────────────────────────────────────────────

/**
 * Returns active (non-discharged) patients where this doctor appears
 * in CareTeamAssignment as attending or consulting.
 */
export async function getPatientsForDoctor(doctorId: string): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) =>
      p.dischargedAt === null &&
      p.careTeam.some((a) => a.doctor?.id === doctorId)
  ).map(toPatient);
}

/**
 * Returns discharged patients where this doctor appeared in care team.
 * Used in the doctor Morning Rounds History tab.
 */
export async function getDischargedPatientsForDoctor(
  doctorId: string
): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) =>
      p.dischargedAt !== null &&
      p.careTeam.some((a) => a.doctor?.id === doctorId)
  ).map(toPatient);
}

// ─── Nurse-scoped data ────────────────────────────────────────────────────────

/**
 * Returns active (non-discharged) patients assigned to a specific nurse,
 * identified by the nurseId on their CareTeamAssignment.
 */
export async function getPatientsForNurse(nurseId: string): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) =>
      p.dischargedAt === null &&
      p.careTeam.some((a) => a.nurse?.id === nurseId)
  ).map(toPatient);
}

/**
 * Returns notifications scoped to a nurse's assigned patients.
 * Admin callers should use getNotifications() for the full list.
 */
export async function getNotificationsForNurse(
  nurseId: string
): Promise<Notification[]> {
  await delay();
  const assignedIds = new Set(
    ALL_PATIENTS.filter(
      (p) => p.dischargedAt === null && p.careTeam.some((a) => a.nurse?.id === nurseId)
    ).map((p) => p.id)
  );
  return ALL_NOTIFICATIONS.filter((n) => assignedIds.has(n.patientId));
}

/** Returns all nursing tasks for a given nurse. */
export async function getNursingTasks(nurseId: string): Promise<NursingTask[]> {
  await delay();
  return ALL_NURSING_TASKS.filter((t) => t.nurseId === nurseId);
}

/** Returns all nursing tasks for a specific patient (across all nurses). */
export async function getTasksForPatient(patientId: string): Promise<NursingTask[]> {
  await delay();
  return ALL_NURSING_TASKS.filter((t) => t.patientId === patientId);
}

/**
 * Update a nursing task's status in-memory.
 * Called from the Tasks tab action buttons (11C).
 */
export async function updateNursingTaskStatus(
  taskId: string,
  status: import("@/types").NursingTaskStatus
): Promise<void> {
  await delay(60);
  const task = ALL_NURSING_TASKS.find((t) => t.id === taskId);
  if (task) task.status = status;
}

/**
 * Write seam for vitals submission.
 * Currently appends to an in-memory log so it reflects in the same session;
 * swap the body for a POST fetch when the backend is ready.
 */
const _vitalsLog: VitalsEntry[] = [];

/**
 * Returns all vitals for a patient: seeded history (from generator) merged
 * with any readings posted in the current session via postVitals().
 * Sorted oldest-first so chart data flows left→right.
 */
export async function getVitalsForPatient(patientId: string): Promise<VitalsEntry[]> {
  await delay();
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  const seeded  = patient?.vitalsHistory ?? [];
  const session = _vitalsLog.filter((v) => v.patientId === patientId);
  return [...seeded, ...session].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
}

export async function postVitals(entry: VitalsEntry): Promise<void> {
  await delay(200);
  const stamped = { ...entry, recordedAt: new Date().toISOString() };
  _vitalsLog.push(stamped);
  // Also push into the patient's vitalsHistory so getVitalsForPatient() sees
  // it immediately without re-merging from _vitalsLog on every call.
  const patient = ALL_PATIENTS.find((p) => p.id === entry.patientId);
  if (patient) patient.vitalsHistory.push(stamped);
  // Surface the submission as a new PatientEvent so it shows in WorkflowTimeline.
  if (patient) {
    patient.events.unshift({
      id: String(Date.now()),
      patientId: entry.patientId,
      type: "vitals",
      timestamp: new Date().toISOString(),
      actor: "Green, R.",
      summary: `Vitals recorded — BP ${entry.bp}, Pulse ${entry.pulse} bpm, Temp ${entry.temp}°F, O₂ ${entry.o2Sat}%`,
      detail: `RR ${entry.respRate} breaths/min`,
      flagged: false,
    });
  }
}

// ─── Visit mode writes ────────────────────────────────────────────────────────

export type LabPriority = "Routine" | "Urgent" | "STAT";

/**
 * Toggle an existing treatment plan item's completed state.
 * Mutates in-memory so PatientDetailView reflects it immediately.
 */
export async function updateTreatmentItem(
  patientId: string,
  itemId: string,
  completed: boolean
): Promise<void> {
  await delay(80);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  if (!patient) return;
  const item = patient.treatmentPlan.find((t) => t.id === itemId);
  if (!item) return;
  item.completed  = completed;
  item.completedAt = completed ? new Date().toISOString() : null;
}

/**
 * Append a new treatment plan item. Returns the created item so the
 * caller can update local state without a re-fetch.
 */
export async function addTreatmentItem(
  patientId: string,
  description: string,
  doctorName: string
): Promise<TreatmentPlanItem> {
  await delay(120);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  const maxOrder = patient
    ? Math.max(0, ...patient.treatmentPlan.map((t) => t.order))
    : 0;
  const newItem: TreatmentPlanItem = {
    id:          String(Date.now()),
    patientId,
    order:       maxOrder + 1,
    description,
    completed:   false,
    completedAt: null,
  };
  patient?.treatmentPlan.push(newItem);
  // Surface in event log
  patient?.events.unshift({
    id:        String(Date.now() + 1),
    patientId,
    type:      "note",
    timestamp: new Date().toISOString(),
    actor:     doctorName,
    summary:   `Treatment plan updated — added: "${description}"`,
    detail:    null,
    flagged:   false,
  });
  // Route a nursing task to the shift-appropriate nurse so the action
  // surfaces on the nurse dashboard immediately in the same session.
  createNursingTaskFromVisit(
    patientId,
    `Follow up: ${description}`,
    "Due: After doctor rounds"
  );
  return newItem;
}

/**
 * Add a lab/test order as a WorkflowStep in the inpatient phase.
 * Also surfaces as a PatientEvent and a NursingTask for the assigned nurse.
 */
export async function addLabOrder(
  patientId: string,
  testName: string,
  priority: LabPriority,
  doctorName: string
): Promise<WorkflowStep> {
  await delay(120);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);

  const step: WorkflowStep = {
    id:          String(Date.now()),
    patientId,
    phase:       "inpatient",
    name:        "Labs",
    status:      "ontrack",
    scheduledAt: new Date().toISOString(),
    completedAt: null,
    note:        `${testName} — ${priority}`,
    flagged:     false,
    occurrence:  999, // sentinel for doctor-ordered labs
  };

  // Add to the inpatient workflow group
  const inpatient = patient?.workflowGroups.find((g) => g.phase === "inpatient");
  if (inpatient) inpatient.steps.push(step);

  // Surface in event log
  patient?.events.unshift({
    id:        String(Date.now() + 1),
    patientId,
    type:      "lab_order",
    timestamp: new Date().toISOString(),
    actor:     doctorName,
    summary:   `Lab ordered — ${testName} (${priority})`,
    detail:    null,
    flagged:   false,
  });

  // Route a nursing task: STAT/Urgent surface as active, Routine as pending.
  // dueContext mirrors the priority label so the nurse sees urgency at a glance.
  const LAB_DUE: Record<LabPriority, string> = {
    STAT:    "Due: STAT — collect immediately",
    Urgent:  "Due: Urgent",
    Routine: "Due: Routine",
  };
  const labTask = createNursingTaskFromVisit(
    patientId,
    `Collect sample — ${testName}`,
    LAB_DUE[priority]
  );
  // Upgrade STAT/Urgent tasks to "active" so they sort first on the nurse dashboard.
  if (labTask && (priority === "STAT" || priority === "Urgent")) {
    labTask.status = "active";
  }

  return step;
}

// ─── Admin dashboard KPIs ────────────────────────────────────────────────────

export interface AdminKPIs {
  availableBeds:        number;
  availableAmbulances:  number;
  availableDoctors:     number;
  dischargeReady:       number;
  dischargeQueueCount:  number;
  /** Available bed count per department — used for the beds mini-chart. */
  bedsByDept:           Record<string, number>;
  /** Number of ambulances currently dispatched — pair with availableAmbulances for chart. */
  dispatchedAmbulances: number;
  /** Doctor count per specialty — used for the doctors mini-chart. */
  doctorsBySpecialty:   Record<string, number>;
}

const DEPARTMENTS: Department[] = [
  "Cardiology", "General Medicine", "ICU", "Orthopedics", "Radiology",
];

/** KPIs for the redesigned Admin dashboard (Phase 9C / 9D / 10C). */
export async function getAdminKPIs(): Promise<AdminKPIs> {
  await delay();
  const admitted = ALL_PATIENTS.filter((p) => p.dischargedAt === null);

  const bedsByDept = DEPARTMENTS.reduce<Record<string, number>>((acc, dept) => {
    acc[dept] = ALL_BEDS.filter((b) => b.department === dept && b.status === "available").length;
    return acc;
  }, {});

  const doctorsBySpecialty = ALL_DOCTORS.reduce<Record<string, number>>((acc, d) => {
    acc[d.specialty] = (acc[d.specialty] ?? 0) + 1;
    return acc;
  }, {});

  return {
    availableBeds:        ALL_BEDS.filter((b) => b.status === "available").length,
    availableAmbulances:  ALL_AMBULANCES.filter((a) => a.status === "available").length,
    availableDoctors:     ALL_DOCTORS.length,
    dischargeReady:       admitted.filter(
      (p) => p.status === "ontrack" && p.dischargeConditions.every((c) => c.status === "complete")
    ).length,
    dischargeQueueCount:  admitted.filter((p) => p.dischargeRequested).length,
    bedsByDept,
    dispatchedAmbulances: ALL_AMBULANCES.filter((a) => a.status === "dispatched").length,
    doctorsBySpecialty,
  };
}

/** All patients including discharged — used by the admin calendar. */
export async function getAllPatients(): Promise<Patient[]> {
  await delay();
  return ALL_PATIENTS.map(toPatient);
}

// ─── Doctor directory ─────────────────────────────────────────────────────────

/** Returns the full doctor pool for dropdowns/selectors. */
export async function getDoctors(): Promise<Doctor[]> {
  await delay();
  return ALL_DOCTORS.map((d) => ({ ...d }));
}

// ─── Bed & ambulance inventory ────────────────────────────────────────────────

/**
 * Returns available beds, optionally filtered by department.
 * Reads from ALL_BEDS which is mutated in place by assignBed(), so any beds
 * assigned during this session are already marked occupied here.
 */
export async function getAvailableBeds(department?: Department): Promise<Bed[]> {
  await delay();
  const available = ALL_BEDS.filter((b) => b.status === "available");
  return department ? available.filter((b) => b.department === department) : available;
}

/** Returns all beds (available + occupied) for inventory overview. */
export async function getAllBeds(): Promise<Bed[]> {
  await delay();
  return [...ALL_BEDS];
}

/** Bed record enriched with the occupying patient's name (if occupied). */
export interface BedWithPatient extends Bed {
  patientName: string | null;
  patientStatus: PatientStatus | null;
}

/** Returns full bed inventory joined with patient names, grouped-ready. */
export async function getBedInventory(): Promise<BedWithPatient[]> {
  await delay();
  return ALL_BEDS.map((bed) => {
    const patient = bed.patientId
      ? ALL_PATIENTS.find((p) => p.id === bed.patientId) ?? null
      : null;
    return {
      ...bed,
      patientName:   patient?.name ?? null,
      patientStatus: patient?.status ?? null,
    };
  });
}

/** Doctor enriched with their current (admitted) patient count. */
export interface DoctorWithCount extends Doctor {
  patientCount: number;
}

/**
 * Returns all doctors with their current admitted-patient count.
 * Derived by scanning careTeam assignments on all non-discharged patients.
 */
export async function getDoctorsWithCounts(): Promise<DoctorWithCount[]> {
  await delay();
  const admitted = ALL_PATIENTS.filter((p) => p.dischargedAt === null);
  // Build a map: doctorId → count
  const countMap: Record<string, number> = {};
  for (const patient of admitted) {
    for (const assignment of patient.careTeam) {
      if (assignment.doctor) {
        const id = assignment.doctor.id;
        countMap[id] = (countMap[id] ?? 0) + 1;
      }
    }
  }
  return ALL_DOCTORS.map((d) => ({ ...d, patientCount: countMap[d.id] ?? 0 }));
}

/** Returns all available ambulances. */
export async function getAvailableAmbulances(): Promise<Ambulance[]> {
  await delay();
  return ALL_AMBULANCES.filter((a) => a.status === "available");
}

/** Returns the full ambulance fleet. */
export async function getAllAmbulances(): Promise<Ambulance[]> {
  await delay();
  return [...ALL_AMBULANCES];
}

/**
 * Assign a bed to a patient.
 *
 * Mutates in-memory (same pattern as all other writes):
 *  1. Bed record → status "occupied", patientId set
 *  2. Patient.room → bed.roomLabel (reconciles room label with bed inventory)
 *  3. "Bed assigned" workflow step → marked complete if present in intake group
 *  4. PatientEvent appended to audit log
 *
 * Every consumer — getPatients(), getPatientsForDoctor(), getPatientById(),
 * getAllBeds(), getAvailableBeds() — reads from the same in-memory objects,
 * so the assignment is immediately visible across all views in the same session.
 */
export async function assignBed(patientId: string, bedId: string): Promise<void> {
  await delay(120);

  const bed     = ALL_BEDS.find((b) => b.id === bedId);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  if (!bed || !patient) return;

  // Update bed record
  bed.status    = "occupied";
  bed.patientId = patientId;

  // Reconcile patient room label
  patient.room = bed.roomLabel;

  // Complete the "Bed assigned" intake step if it exists
  const intakeGroup = patient.workflowGroups.find((g) => g.phase === "intake");
  if (intakeGroup) {
    const bedStep = intakeGroup.steps.find((s) => s.name === "Bed assigned");
    if (bedStep) {
      bedStep.status      = "ontrack";
      bedStep.completedAt = new Date().toISOString();
    }
  }

  // Append to event log
  patient.events.unshift({
    id:        `ev-bed-${Date.now()}`,
    patientId,
    type:      "admission",
    timestamp: new Date().toISOString(),
    actor:     "System",
    summary:   `Bed assigned — ${bed.roomLabel} (${bed.department})`,
    detail:    null,
    flagged:   false,
  });
}

// ─── Discharge request queue ──────────────────────────────────────────────────

/**
 * Doctor marks a patient as ready for discharge.
 * Sets dischargeRequested = true, appends an event. Does NOT change
 * patient status or free the bed — that happens in finalizeDischarge().
 */
export async function requestDischarge(
  patientId: string,
  doctorName: string
): Promise<void> {
  await delay(100);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  if (!patient) return;
  patient.dischargeRequested   = true;
  patient.dischargeRequestedAt = new Date().toISOString();
  patient.events.unshift({
    id:        `ev-dr-${Date.now()}`,
    patientId,
    type:      "discharge_update",
    timestamp: new Date().toISOString(),
    actor:     doctorName,
    summary:   `Discharge requested by ${doctorName} — pending admin approval`,
    detail:    null,
    flagged:   false,
  });
}

/**
 * Returns full PatientDetail for all patients where the doctor has
 * requested discharge (dischargeRequested = true, not yet discharged).
 */
export async function getDischargeQueue(): Promise<PatientDetail[]> {
  await delay();
  return ALL_PATIENTS.filter(
    (p) => p.dischargeRequested && p.dischargedAt === null
  );
}

/**
 * Finalize a discharge after admin reviews PDF + bill.
 *
 * Mutates in place (same pattern as all other writes):
 *   1. patient.dischargedAt → now
 *   2. patient.dischargeRequested → false
 *   3. Bed freed — finds bed in ALL_BEDS where patientId matches,
 *      sets status "available", clears patientId
 *   4. Appends discharge event to audit log
 *
 * This is the trigger that reconciles 9-Front's bed inventory:
 * getAdminKPIs().availableBeds will increment in the next read.
 */
export async function finalizeDischarge(patientId: string): Promise<void> {
  await delay(150);
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  if (!patient) return;

  const now = new Date().toISOString();

  // Mark discharged
  patient.dischargedAt         = now;
  patient.dischargeRequested   = false;
  patient.dischargeRequestedAt = null;

  // Free the bed
  const bed = ALL_BEDS.find(
    (b) => b.patientId === patientId && b.status === "occupied"
  );
  if (bed) {
    bed.status    = "available";
    bed.patientId = null;
  }

  // Audit event
  patient.events.unshift({
    id:        `ev-dc-${Date.now()}`,
    patientId,
    type:      "discharge",
    timestamp: now,
    actor:     "Admin",
    summary:   "Patient discharged — discharge summary and bill generated",
    detail:    bed ? `Bed ${bed.roomLabel} released` : null,
    flagged:   false,
  });
}

/**
 * Generate an itemized bill from the patient's existing data.
 * All line items are derived from real patient state — no synthetic values.
 *
 * Rate card (approximate US inpatient rates):
 *   Room & board:        $1,200 / day
 *   Doctor consultation: $450   / attending, $300 / consulting
 *   Lab order:           $180   / order
 *   Medication event:    $95    / administration
 *   Nursing care:        $320   / day
 *   Insurance discount:  −20 %  of subtotal (when insurance condition is complete)
 */
export function generateBill(patient: PatientDetail): Bill {
  const now     = new Date().toISOString();
  const days    = Math.max(1, patient.dayOfStay);
  const lineItems: BillLineItem[] = [];
  let   idSeq   = 1;
  const li = (
    category: BillLineItem["category"],
    description: string,
    quantity: number,
    unitRate: number
  ): BillLineItem => ({
    id:          `bl-${idSeq++}`,
    category,
    description,
    quantity,
    unitRate,
    total: Math.round(quantity * unitRate * 100) / 100,
  });

  // Room & board
  lineItems.push(li("room", `Room & board — ${patient.room} (${days} day${days > 1 ? "s" : ""})`, days, 1200));

  // Nursing care
  lineItems.push(li("nursing", `Nursing care (${days} day${days > 1 ? "s" : ""})`, days, 320));

  // Attending + consulting doctors
  patient.careTeam.forEach((ct) => {
    if (!ct.doctor) return;
    const role = ct.doctor.role === "Attending" ? "Attending" : "Consulting";
    const rate = role === "Attending" ? 450 : 300;
    lineItems.push(li("doctor", `${role} physician — ${ct.doctor.name}`, 1, rate));
  });

  // Lab orders (from events where type === "lab_order")
  const labOrders = patient.events.filter((e) => e.type === "lab_order");
  labOrders.forEach((e) => {
    // extract test name from summary like "Lab ordered — CBC (Routine)"
    const name = e.summary.replace(/^Lab ordered — /, "").replace(/ \(\w+\)$/, "");
    lineItems.push(li("lab", `Lab — ${name}`, 1, 180));
  });
  // Also pick up any legacy day-N labs from generator events
  const legacyLabs = patient.events.filter(
    (e) => e.type === "lab_order" && e.actor === "System" && e.summary.match(/Day \d+ labs drawn/)
  );
  // Already counted above — no double-counting needed since we filtered by type

  // Medication events (from events where type === "medication")
  const medEvents = patient.events.filter((e) => e.type === "medication");
  if (medEvents.length > 0) {
    lineItems.push(li("medication", `Medication administrations (×${medEvents.length})`, medEvents.length, 95));
  }

  const subtotal = lineItems.reduce((sum, l) => sum + l.total, 0);

  // Insurance adjustment — 20 % discount if insurance condition is complete
  const insuranceCondition = patient.dischargeConditions.find(
    (c) => c.condition === "Insurance approval"
  );
  const hasInsurance = insuranceCondition?.status === "complete";
  const insuranceAdjustment = hasInsurance
    ? -Math.round(subtotal * 0.2 * 100) / 100
    : 0;

  const total = Math.round((subtotal + insuranceAdjustment) * 100) / 100;

  return {
    patientId:           patient.id,
    patientName:         patient.name,
    generatedAt:         now,
    lineItems,
    subtotal,
    insuranceAdjustment,
    total,
  };
}

// ─── Patient intake (create) ──────────────────────────────────────────────────

export interface IntakeFormData {
  name:            string;
  age:             number;
  sex:             "M" | "F" | "Other";
  department:      Department;
  chiefComplaint:  string;
  medications?:    string;
  allergies?:      string;
  needsAdmission:  boolean;
  doctorId:        string;
}

/**
 * Create a brand-new patient from the intake form and push them into
 * ALL_PATIENTS so every read function (getPatients, getPatientsForDoctor,
 * getPatientById, getDashboardKPIs, getAttentionFeed) sees them immediately
 * in the same browser session — same in-memory mutation pattern as
 * postVitals / addTreatmentItem / addLabOrder.
 *
 * Returns the new patient's id so callers can link to their detail page
 * or proceed to bed assignment.
 */
export async function createPatient(data: IntakeFormData): Promise<string> {
  await delay(150);

  const now = new Date().toISOString();
  const pid = `p-${Date.now()}`;

  // ── Care team ────────────────────────────────────────────────────────────────
  const doctor = ALL_DOCTORS.find((d) => d.id === data.doctorId);
  const careTeam: CareTeamAssignment[] = doctor
    ? [{ patientId: pid, doctor: { ...doctor, role: "Attending" as const } }]
    : [];

  // ── Workflow — intake phase only; inpatient/discharge start empty ────────────
  const intakeSteps: WorkflowStep[] = [
    {
      id: `${pid}-s1`, patientId: pid, phase: "intake",
      name: "Registered", status: "ontrack", occurrence: 1,
      scheduledAt: now, completedAt: now,
      note: `Chief complaint: ${data.chiefComplaint}`, flagged: false,
    },
    {
      id: `${pid}-s2`, patientId: pid, phase: "intake",
      name: "Vitals", status: "ontrack", occurrence: 1,
      scheduledAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      completedAt: null, note: null, flagged: false,
    },
    {
      id: `${pid}-s3`, patientId: pid, phase: "intake",
      name: "Doctor assessment", status: "ontrack", occurrence: 1,
      scheduledAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      completedAt: null, note: null, flagged: false,
    },
    ...(data.needsAdmission
      ? [{
          id: `${pid}-s4`, patientId: pid, phase: "intake" as const,
          name: "Bed assigned" as const, status: "ontrack" as const, occurrence: 1,
          scheduledAt: new Date(Date.now() + 90 * 60_000).toISOString(),
          completedAt: null, note: null, flagged: false,
        }]
      : []),
  ];

  const workflowGroups: WorkflowGroup[] = [
    {
      phase: "intake",
      label: "Intake & diagnosis",
      status: "ontrack",
      steps: intakeSteps,
    },
    {
      phase: "inpatient",
      label: "Inpatient care",
      status: "ontrack",
      steps: [],
      eventCount: 0,
      flaggedCount: 0,
    },
    {
      phase: "discharge",
      label: "Discharge",
      status: "ontrack",
      steps: [],
    },
  ];

  // ── Discharge conditions — all incomplete for a fresh admission ───────────────
  const CONDITION_OWNERS: Record<string, DischargeCondition["owningDepartment"]> = {
    "Physician approval":   "General Medicine",
    "Medication prepared":  "Pharmacy",
    "Transportation":       "Transport",
    "Patient education":    "Care Coordination",
    "Insurance approval":   "Care Coordination",
  };
  const dischargeConditions: DischargeCondition[] = (
    ["Physician approval", "Medication prepared", "Transportation",
     "Patient education", "Insurance approval"] as const
  ).map((condition, i) => ({
    id: `${pid}-dc${i}`,
    patientId: pid,
    condition,
    status: "incomplete" as const,
    owningDepartment: CONDITION_OWNERS[condition] as DischargeCondition["owningDepartment"],
    updatedAt: now,
    elapsedDisplay: null,
  }));

  // ── Treatment plan — single starter item ─────────────────────────────────────
  const treatmentPlan: TreatmentPlanItem[] = [
    {
      id: `${pid}-tp1`,
      patientId: pid,
      order: 1,
      description: "Initial assessment and care plan",
      completed: false,
      completedAt: null,
    },
  ];

  // ── Events ───────────────────────────────────────────────────────────────────
  const initials = data.name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const events: PatientEvent[] = [
    {
      id: `${pid}-e1`,
      patientId: pid,
      type: "admission",
      timestamp: now,
      actor: "System",
      summary: `Patient admitted — chief complaint: ${data.chiefComplaint}`,
      detail: [
        data.medications ? `Medications: ${data.medications}` : null,
        data.allergies   ? `Allergies: ${data.allergies}`     : null,
      ].filter(Boolean).join(" · ") || null,
      flagged: false,
    },
  ];

  // ── Assemble PatientDetail ────────────────────────────────────────────────────
  const newPatient: PatientDetail = {
    id:           pid,
    name:         data.name,
    initials,
    age:          data.age,
    sex:          data.sex,
    room:         data.needsAdmission ? "Unassigned" : "Outpatient",
    departmentId: data.department,
    status:       "ontrack",
    dayOfStay:    0,
    admittedAt:   now,
    dischargedAt: null,
    diagnosis:    data.chiefComplaint,
    aiSummary:    `Presenting with ${data.chiefComplaint.toLowerCase()}. Intake assessment in progress.`,
    careTeam,
    treatmentPlan,
    dischargeConditions,
    workflowGroups,
    events,
    vitalsHistory:        [], // populated as nurse posts vitals via postVitals()
    dischargeRequested:   false,
    dischargeRequestedAt: null,
  };

  ALL_PATIENTS.push(newPatient);
  return pid;
}

// ─── Shift-aware task routing ─────────────────────────────────────────────────

/**
 * Determine which nurse shift is currently active.
 *   Day     06:00 – 13:59
 *   Evening 14:00 – 21:59
 *   Night   22:00 – 05:59
 */
function currentNurseShift(): NurseShift {
  const h = new Date().getHours();
  if (h >= 6  && h < 14) return "Day";
  if (h >= 14 && h < 22) return "Evening";
  return "Night";
}

/**
 * Create a NursingTask routed to the nurse currently on shift for this patient.
 *
 * Routing priority:
 *   1. Nurse in CareTeamAssignment whose shift matches the current time slot
 *   2. Any nurse assigned to this patient (if no shift match)
 *   3. No task created (patient has no assigned nurse)
 *
 * Pushes directly to ALL_NURSING_TASKS so getNursingTasks() returns it
 * in the same browser session — same in-memory pattern as postVitals /
 * addTreatmentItem / addLabOrder.
 *
 * Called from addTreatmentItem and addLabOrder; callers don't need the return
 * value (fire-and-forget from the doctor's perspective).
 */
export function createNursingTaskFromVisit(
  patientId: string,
  title: string,
  dueContext: string
): NursingTask | null {
  const patient = ALL_PATIENTS.find((p) => p.id === patientId);
  if (!patient) return null;

  // Collect unique nurses from care team assignments
  const seenIds = new Set<string>();
  const nurses = patient.careTeam
    .map((a) => a.nurse)
    .filter((n): n is NonNullable<typeof n> => n != null)
    .filter((n) => {
      if (seenIds.has(n.id)) return false;
      seenIds.add(n.id);
      return true;
    });

  if (nurses.length === 0) return null;

  const shift = currentNurseShift();

  // Prefer shift match; fall back to first assigned nurse
  const target = nurses.find((n) => n.shift === shift) ?? nurses[0];

  const task: NursingTask = {
    id:         `task-${Date.now()}`,
    patientId,
    nurseId:    target.id,
    title,
    status:     "pending",
    dueContext,
  };

  ALL_NURSING_TASKS.push(task);
  return task;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

let _uidCounter = 10_000;
function uid() {
  return String(_uidCounter++);
}

function toPatient(p: PatientDetail): Patient {
  const {
    careTeam: _ct,
    treatmentPlan: _tp,
    dischargeConditions: _dc,
    workflowGroups: _wg,
    events: _ev,
    ...patient
  } = p;
  return patient;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  // Guard: future timestamps (e.g. scheduled steps that haven't passed yet)
  // should never render as negative elapsed time.
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
