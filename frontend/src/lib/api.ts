/**
 * lib/api.ts — data access layer for Pulse frontend.
 *
 * All component data access goes through this file.
 * Reads and writes call the Fastify backend at NEXT_PUBLIC_API_URL.
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
  apiGet,
  apiPatch,
  apiPost,
  getDepartmentNameMap,
  resolveStaffId,
  ApiError,
  type Paginated,
} from "@/lib/api-client";
import { resolveDepartmentId } from "@/lib/departments";
import {
  mapDetailToPatientDetail,
  mapSummaryToPatient,
  mapDepartmentName,
  mapVitalSignToEntry,
  type BackendPatientDetail,
  type BackendPatientSummary,
  type BackendDischargeCondition,
  type BackendWorkflowEvent,
} from "@/lib/mappers/patient";
import {
  mapNursingStatusToTask,
  mapTaskToNursingTask,
  type BackendTaskSummary,
} from "@/lib/mappers/task";
import {
  mapUserToDoctor,
  type BackendUserSummary,
} from "@/lib/mappers/user";

const PATIENT_FETCH_LIMIT = "100";

const FE_DEPARTMENTS: Department[] = [
  "Cardiology",
  "General Medicine",
  "ICU",
  "Orthopedics",
  "Radiology",
];

const ROOM_PREFIX: Record<Department, string> = {
  Cardiology: "4A",
  "General Medicine": "2A",
  ICU: "ICU",
  Orthopedics: "5C",
  Radiology: "3A",
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchAndMapPatients(
  options: {
    query?: Record<string, string>;
    filter?: (patient: BackendPatientSummary) => boolean;
    path?: string;
  } = {},
): Promise<Patient[]> {
  const query = new URLSearchParams({
    limit: PATIENT_FETCH_LIMIT,
    page: "1",
    ...options.query,
  });

  const endpoint = options.path ?? `/patients?${query}`;

  const [data, deptMap] = await Promise.all([
    apiGet<Paginated<BackendPatientSummary>>(endpoint),
    getDepartmentNameMap(),
  ]);

  const filter = options.filter ?? (() => true);

  return data.items
    .filter(filter)
    .map((patient) =>
      mapSummaryToPatient(
        patient,
        deptMap.get(patient.departmentId) ?? "General Medicine",
      ),
    );
}

async function fetchPatientDetail(patientId: string): Promise<PatientDetail | null> {
  return getPatientById(patientId);
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "Unknown";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

function mapSexToGender(sex: "M" | "F" | "Other"): "MALE" | "FEMALE" | "OTHER" {
  if (sex === "M") return "MALE";
  if (sex === "F") return "FEMALE";
  return "OTHER";
}

async function buildBedInventory(): Promise<Bed[]> {
  const data = await apiGet<
    Paginated<{
      id: string;
      roomLabel: string;
      departmentName: string;
      status: "AVAILABLE" | "OCCUPIED";
      patientId: string | null;
    }>
  >("/beds?limit=100");

  return data.items.map((bed) => ({
    id: bed.id,
    roomLabel: bed.roomLabel,
    department: mapDepartmentName(bed.departmentName),
    status: bed.status === "AVAILABLE" ? "available" : "occupied",
    patientId: bed.patientId,
  }));
}

async function fetchDoctorsFromApi(): Promise<Doctor[]> {
  const data = await apiGet<Paginated<BackendUserSummary>>(
    "/users?role=DOCTOR&limit=100",
  );
  return data.items.filter((user) => user.active).map(mapUserToDoctor);
}

// ─── Patient list ─────────────────────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  return fetchAndMapPatients({
    filter: (p) => p.status !== "DISCHARGED",
  });
}

export async function getDischargedPatients(): Promise<Patient[]> {
  return fetchAndMapPatients({
    query: { status: "DISCHARGED" },
  });
}

export async function getPatientsByDepartment(
  dept: Department,
): Promise<Patient[]> {
  const patients = await fetchAndMapPatients({
    filter: (p) => p.status !== "DISCHARGED",
  });
  return patients.filter((p) => p.departmentId === dept);
}

export async function getPatientsByStatus(
  status: PatientStatus,
): Promise<Patient[]> {
  const patients = await fetchAndMapPatients({
    filter: (p) => p.status !== "DISCHARGED",
  });
  return patients.filter((p) => p.status === status);
}

// ─── Patient detail ───────────────────────────────────────────────────────────

export async function getPatientById(id: string): Promise<PatientDetail | null> {
  try {
    const [data, vitalsData, dischargeData, aiData] = await Promise.all([
      apiGet<BackendPatientDetail>(`/patients/${id}`),
      apiGet<Paginated<import("@/lib/mappers/patient").BackendVitalSign>>(
        `/patients/${id}/vitals?limit=50`,
      ).catch(() => ({ items: [] as import("@/lib/mappers/patient").BackendVitalSign[] })),
      apiGet<Paginated<BackendDischargeCondition>>(
        `/patients/${id}/discharge-conditions?limit=20`,
      ).catch(() => ({ items: [] as BackendDischargeCondition[] })),
      apiGet<{ summary: string }>(`/patients/${id}/ai-summary`).catch(() => ({
        summary: "",
      })),
    ]);

    const vitals = vitalsData.items.map((v) =>
      mapVitalSignToEntry(v, data.assignedNurseId ?? ""),
    );

    return mapDetailToPatientDetail(data, vitals, {
      dischargeConditions: dischargeData.items,
      aiSummary: aiData.summary,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export async function getWorkflow(patientId: string): Promise<WorkflowGroup[]> {
  const patient = await fetchPatientDetail(patientId);
  return patient?.workflowGroups ?? [];
}

// ─── Care team ────────────────────────────────────────────────────────────────

export async function getCareTeam(
  patientId: string,
): Promise<CareTeamAssignment[]> {
  const patient = await fetchPatientDetail(patientId);
  return patient?.careTeam ?? [];
}

// ─── Treatment plan ───────────────────────────────────────────────────────────

export async function getTreatmentPlan(
  patientId: string,
): Promise<TreatmentPlanItem[]> {
  const patient = await fetchPatientDetail(patientId);
  return patient?.treatmentPlan ?? [];
}

// ─── Discharge conditions ─────────────────────────────────────────────────────

export async function getDischargeConditions(
  patientId: string,
): Promise<DischargeCondition[]> {
  const data = await apiGet<Paginated<BackendDischargeCondition>>(
    `/patients/${patientId}/discharge-conditions?limit=20`,
  );
  return data.items.map(mapBackendDischargeCondition);
}

export async function updateDischargeCondition(
  conditionId: string,
  complete: boolean,
): Promise<void> {
  await apiPatch(`/discharge-conditions/${conditionId}`, {
    status: complete ? "COMPLETE" : "INCOMPLETE",
  });
}

function mapBackendDischargeCondition(
  record: BackendDischargeCondition,
): DischargeCondition {
  const updatedAt = new Date(record.updatedAt).toISOString();
  const ms = Date.now() - new Date(record.updatedAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  return {
    id: record.id,
    patientId: record.patientId,
    condition: record.condition as DischargeCondition["condition"],
    status: record.status === "COMPLETE" ? "complete" : "incomplete",
    owningDepartment: record.owningDepartment as DischargeCondition["owningDepartment"],
    updatedAt,
    elapsedDisplay:
      record.status === "COMPLETE"
        ? null
        : hours < 1
          ? `${minutes}m`
          : `${hours}h ${minutes}m`,
  };
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getPatientEvents(
  patientId: string,
): Promise<PatientEvent[]> {
  const patient = await fetchPatientDetail(patientId);
  return patient?.events ?? [];
}

// ─── Notifications ────────────────────────────────────────────────────────────

interface BackendNotification {
  id: string;
  patientId: string;
  userId: string | null;
  summary: string;
  read: boolean;
  createdAt: string;
  patientName: string;
  room: string | null;
  patientStatus: string;
  patientPriority: string;
}

function mapNotification(record: BackendNotification): Notification {
  const status =
    record.patientPriority === "CRITICAL"
      ? "critical"
      : record.patientStatus === "WAITING"
        ? "blocked"
        : record.patientPriority === "HIGH"
          ? "delayed"
          : "ontrack";

  return {
    id: record.id,
    patientId: record.patientId,
    patientName: record.patientName,
    room: record.room ?? "—",
    status,
    summary: record.summary,
    timestamp: new Date(record.createdAt).toISOString(),
    read: record.read,
  };
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await apiGet<Paginated<BackendNotification>>(
    "/notifications?limit=100",
  );
  return data.items.map(mapNotification);
}

export async function getNotificationsForNurse(
  nurseId: string,
): Promise<Notification[]> {
  const data = await apiGet<Paginated<BackendNotification>>(
    `/notifications?userId=${nurseId}&limit=100`,
  );
  return data.items.map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiPatch(`/notifications/${id}/read`, {});
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await apiGet<Paginated<BackendNotification>>(
    "/notifications?read=false&limit=100",
  );
  return data.pagination.total;
}

// ─── KPI aggregates ───────────────────────────────────────────────────────────

export interface DashboardKPIs {
  total: number;
  delayed: number;
  critical: number;
  dischargeReady: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const admitted = await getPatients();
  return {
    total: admitted.length,
    delayed: admitted.filter((p) => p.status === "delayed").length,
    critical: admitted.filter((p) => p.status === "critical").length,
    dischargeReady: admitted.filter((p) => p.status === "ontrack").length,
  };
}

// ─── Attention feed ───────────────────────────────────────────────────────────

export interface AttentionItem {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  status: PatientStatus;
  title: string;
  subtitle: string;
  relativeTime: string;
  icon: string;
}

export async function getAttentionFeed(): Promise<AttentionItem[]> {
  const admitted = await getPatients();
  const items: AttentionItem[] = [];

  for (const patient of admitted) {
    if (patient.status === "critical") {
      items.push({
        id: `crit-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        room: patient.room,
        status: "critical",
        title: "Critical status — immediate review needed",
        subtitle: patient.diagnosis,
        relativeTime: relativeTime(patient.admittedAt),
        icon: "ti-alert-circle",
      });
    }

    if (patient.status === "blocked") {
      items.push({
        id: `blocked-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        room: patient.room,
        status: "blocked",
        title: "Patient waiting — review required",
        subtitle: patient.aiSummary,
        relativeTime: relativeTime(patient.admittedAt),
        icon: "ti-circle-x",
      });
    }

    if (patient.status === "delayed") {
      items.push({
        id: `delayed-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        room: patient.room,
        status: "delayed",
        title: "Delayed care pathway",
        subtitle: patient.aiSummary,
        relativeTime: relativeTime(patient.admittedAt),
        icon: "ti-clock-exclamation",
      });
    }
  }

  const order: PatientStatus[] = ["critical", "blocked", "delayed", "ontrack"];
  return items.sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
  );
}

// ─── Doctor-scoped data ───────────────────────────────────────────────────────

export async function getPatientsForDoctor(doctorId: string): Promise<Patient[]> {
  const resolvedId = await resolveStaffId(doctorId, "DOCTOR");
  const query = new URLSearchParams({
    limit: PATIENT_FETCH_LIMIT,
    page: "1",
    excludeStatus: "DISCHARGED",
  });
  return fetchAndMapPatients({
    path: `/users/${resolvedId}/patients?${query}`,
  });
}

export async function getDischargedPatientsForDoctor(
  doctorId: string,
): Promise<Patient[]> {
  const resolvedId = await resolveStaffId(doctorId, "DOCTOR");
  const query = new URLSearchParams({
    limit: PATIENT_FETCH_LIMIT,
    page: "1",
    status: "DISCHARGED",
  });
  return fetchAndMapPatients({
    path: `/users/${resolvedId}/patients?${query}`,
  });
}

// ─── Nurse-scoped data ────────────────────────────────────────────────────────

export async function getPatientsForNurse(nurseId: string): Promise<Patient[]> {
  const resolvedId = await resolveStaffId(nurseId, "NURSE");
  const query = new URLSearchParams({
    limit: PATIENT_FETCH_LIMIT,
    page: "1",
    excludeStatus: "DISCHARGED",
  });
  return fetchAndMapPatients({
    path: `/users/${resolvedId}/patients?${query}`,
  });
}

export async function getNursingTasks(nurseId: string): Promise<NursingTask[]> {
  const resolvedId = await resolveStaffId(nurseId, "NURSE");
  const data = await apiGet<Paginated<BackendTaskSummary>>(
    `/users/${resolvedId}/tasks?limit=100`,
  );
  return data.items.map(mapTaskToNursingTask);
}

export async function getTasksForPatient(
  patientId: string,
): Promise<NursingTask[]> {
  const data = await apiGet<Paginated<BackendTaskSummary>>(
    `/patients/${patientId}/tasks?limit=100`,
  );
  return data.items.map(mapTaskToNursingTask);
}

export async function updateNursingTaskStatus(
  taskId: string,
  status: import("@/types").NursingTaskStatus,
): Promise<void> {
  await apiPatch(`/tasks/${taskId}/status`, {
    status: mapNursingStatusToTask(status),
  });
}

// ─── Vitals (no backend yet) ──────────────────────────────────────────────────

export async function getVitalsForPatient(
  patientId: string,
): Promise<VitalsEntry[]> {
  const data = await apiGet<
    Paginated<import("@/lib/mappers/patient").BackendVitalSign>
  >(`/patients/${patientId}/vitals?limit=50`);
  return data.items.map((v) => mapVitalSignToEntry(v, ""));
}

export async function postVitals(entry: VitalsEntry): Promise<void> {
  await apiPost(`/patients/${entry.patientId}/vitals`, {
    bloodPressure: entry.bp,
    pulse: entry.pulse,
    temperature: entry.temp,
    respRate: entry.respRate,
    o2Saturation: entry.o2Sat,
    recordedById: entry.nurseId || null,
  });
}

// ─── Visit mode writes ────────────────────────────────────────────────────────

export type LabPriority = "Routine" | "Urgent" | "STAT";

function dueContextForLab(priority: LabPriority): string {
  if (priority === "STAT") return "Due: STAT — collect immediately";
  if (priority === "Urgent") return "Due: Urgent";
  return "Due: Routine";
}

export async function updateTreatmentItem(
  patientId: string,
  itemId: string,
  completed: boolean,
): Promise<void> {
  await apiPatch(`/tasks/${itemId}/status`, {
    status: completed ? "COMPLETED" : "TODO",
  });
  void patientId;
}

export async function addTreatmentItem(
  patientId: string,
  description: string,
  _doctorName: string,
): Promise<TreatmentPlanItem> {
  const patient = await apiGet<BackendPatientDetail>(`/patients/${patientId}`);
  const assignee = patient.assignedNurseId ?? patient.assignedDoctorId;

  if (!assignee) {
    throw new Error("Patient has no assigned nurse or doctor for this task.");
  }

  const created = await apiPost<BackendTaskSummary>("/tasks", {
    patientId,
    title: description,
    description: null,
    assignedTo: assignee,
    status: "TODO",
  });

  return {
    id: created.id,
    patientId,
    order: 1,
    description: created.title,
    completed: false,
    completedAt: null,
  };
}

export async function addLabOrder(
  patientId: string,
  testName: string,
  priority: LabPriority,
  _doctorName: string,
): Promise<WorkflowStep> {
  const patient = await apiGet<BackendPatientDetail>(`/patients/${patientId}`);
  const sequence =
    patient.workflowEvents.reduce(
      (max, event) => Math.max(max, event.sequence),
      0,
    ) + 1;

  const created = await apiPost<BackendWorkflowEvent>("/workflow-events", {
    patientId,
    title: `Lab order — ${testName}`,
    description: `${testName} (${priority})`,
    eventType: "LAB_ORDERED",
    status: "PENDING",
    sequence,
  });

  const assignee = patient.assignedNurseId ?? patient.assignedDoctorId;
  if (assignee) {
    await apiPost<BackendTaskSummary>("/tasks", {
      patientId,
      title: `Collect sample — ${testName}`,
      description: dueContextForLab(priority),
      assignedTo: assignee,
      status: priority === "STAT" || priority === "Urgent" ? "IN_PROGRESS" : "TODO",
    });
  }

  return {
    id: created.id,
    patientId,
    phase: "inpatient",
    name: "Labs",
    status: "ontrack",
    scheduledAt: new Date(created.occurredAt).toISOString(),
    completedAt: null,
    note: `${testName} — ${priority}`,
    flagged: false,
    occurrence: created.sequence,
  };
}

// ─── Admin dashboard KPIs ────────────────────────────────────────────────────

export interface AdminKPIs {
  availableBeds: number;
  availableAmbulances: number;
  availableDoctors: number;
  dischargeReady: number;
  dischargeQueueCount: number;
  bedsByDept: Record<string, number>;
  dispatchedAmbulances: number;
  doctorsBySpecialty: Record<string, number>;
}

export async function getAdminKPIs(): Promise<AdminKPIs> {
  const [beds, doctors, admitted, dischargeQueueCount, ambulances] =
    await Promise.all([
      buildBedInventory(),
      fetchDoctorsFromApi(),
      getPatients(),
      getDischargeQueueCount(),
      getAllAmbulances(),
    ]);

  const bedsByDept = FE_DEPARTMENTS.reduce<Record<string, number>>(
    (acc, dept) => {
      acc[dept] = beds.filter(
        (bed) => bed.department === dept && bed.status === "available",
      ).length;
      return acc;
    },
    {},
  );

  const doctorsBySpecialty = doctors.reduce<Record<string, number>>(
    (acc, doctor) => {
      acc[doctor.specialty] = (acc[doctor.specialty] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const availableAmbulances = ambulances.filter(
    (unit) => unit.status === "available",
  ).length;

  return {
    availableBeds: beds.filter((bed) => bed.status === "available").length,
    availableAmbulances,
    availableDoctors: doctors.length,
    dischargeReady: admitted.filter((p) => p.status === "ontrack").length,
    dischargeQueueCount,
    bedsByDept,
    dispatchedAmbulances: ambulances.length - availableAmbulances,
    doctorsBySpecialty,
  };
}

export async function getAllPatients(): Promise<Patient[]> {
  return fetchAndMapPatients();
}

// ─── Doctor directory ─────────────────────────────────────────────────────────

export async function getDoctors(): Promise<Doctor[]> {
  return fetchDoctorsFromApi();
}

// ─── Bed inventory (derived from patients + departments) ────────────────────

export async function getAvailableBeds(department?: Department): Promise<Bed[]> {
  const beds = await buildBedInventory();
  const available = beds.filter((bed) => bed.status === "available");
  return department
    ? available.filter((bed) => bed.department === department)
    : available;
}

export async function getAllBeds(): Promise<Bed[]> {
  return buildBedInventory();
}

export interface BedWithPatient extends Bed {
  patientName: string | null;
  patientStatus: PatientStatus | null;
}

export async function getBedInventory(): Promise<BedWithPatient[]> {
  const [beds, patients] = await Promise.all([
    buildBedInventory(),
    getPatients(),
  ]);

  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  return beds.map((bed) => {
    const patient = bed.patientId ? patientById.get(bed.patientId) ?? null : null;
    return {
      ...bed,
      patientName: patient?.name ?? null,
      patientStatus: patient?.status ?? null,
    };
  });
}

export interface DoctorWithCount extends Doctor {
  patientCount: number;
}

export async function getDoctorsWithCounts(): Promise<DoctorWithCount[]> {
  const [doctors, raw] = await Promise.all([
    fetchDoctorsFromApi(),
    apiGet<Paginated<BackendPatientSummary>>(
      `/patients?limit=${PATIENT_FETCH_LIMIT}`,
    ),
  ]);

  const counts: Record<string, number> = {};
  for (const patient of raw.items) {
    if (patient.assignedDoctorId && patient.status !== "DISCHARGED") {
      counts[patient.assignedDoctorId] =
        (counts[patient.assignedDoctorId] ?? 0) + 1;
    }
  }

  return doctors.map((doctor) => ({
    ...doctor,
    patientCount: counts[doctor.id] ?? 0,
  }));
}

// ─── Ambulances ───────────────────────────────────────────────────────────────

export async function getAvailableAmbulances(): Promise<Ambulance[]> {
  const fleet = await getAllAmbulances();
  return fleet.filter((a) => a.status === "available");
}

export async function getAllAmbulances(): Promise<Ambulance[]> {
  const data = await apiGet<
    Paginated<{
      id: string;
      unitLabel: string;
      label: string;
      status: "AVAILABLE" | "DISPATCHED";
    }>
  >("/ambulances?limit=50");

  return data.items.map((unit) => ({
    id: unit.id,
    label: unit.label,
    status: unit.status === "AVAILABLE" ? "available" : "dispatched",
  }));
}

export async function updateAmbulanceStatus(
  ambulanceId: string,
  status: Ambulance["status"],
): Promise<void> {
  await apiPatch(`/ambulances/${ambulanceId}/status`, {
    status: status === "available" ? "AVAILABLE" : "DISPATCHED",
  });
}

// ─── Consultations ────────────────────────────────────────────────────────────

export interface Consultation {
  id: string;
  patientId: string;
  doctorName: string;
  reason: string;
  status: string;
  scheduledAt: string | null;
  notes: string | null;
}

export async function getConsultationsForPatient(
  patientId: string,
): Promise<Consultation[]> {
  const data = await apiGet<
    Paginated<{
      id: string;
      patientId: string;
      reason: string;
      notes: string | null;
      status: string;
      scheduledAt: string | null;
      doctor: { name: string } | null;
    }>
  >(`/patients/${patientId}/consultations?limit=20`);

  return data.items.map((item) => ({
    id: item.id,
    patientId: item.patientId,
    doctorName: item.doctor?.name ?? "Consulting physician",
    reason: item.reason,
    status: item.status,
    scheduledAt: item.scheduledAt,
    notes: item.notes,
  }));
}

export async function getAiSummary(patientId: string): Promise<string> {
  const data = await apiGet<{ summary: string }>(
    `/patients/${patientId}/ai-summary`,
  );
  return data.summary;
}

// ─── Bed assignment ───────────────────────────────────────────────────────────

export async function assignBed(patientId: string, bedId: string): Promise<void> {
  await apiPatch(`/beds/${bedId}/assign`, { patientId });
}

// ─── Discharge workflow ───────────────────────────────────────────────────────

export async function requestDischarge(
  patientId: string,
  _doctorName: string,
): Promise<void> {
  await apiPatch(`/patients/${patientId}`, {
    status: "WAITING",
    dischargeRequestedAt: new Date().toISOString(),
  });
}

export async function getDischargeQueueCount(): Promise<number> {
  const data = await apiGet<Paginated<BackendPatientSummary>>(
    "/patients?status=WAITING&limit=1&page=1",
  );
  return data.pagination.total;
}

export async function getWaitingPatients(): Promise<Patient[]> {
  return fetchAndMapPatients({ query: { status: "WAITING" } });
}

export async function getDischargeQueue(): Promise<PatientDetail[]> {
  const summaries = await fetchAndMapPatients({
    query: { status: "WAITING" },
  });

  const details = await Promise.all(
    summaries.map((patient) => getPatientById(patient.id)),
  );

  return details.filter((patient): patient is PatientDetail => patient !== null);
}

export async function finalizeDischarge(patientId: string): Promise<void> {
  const beds = await buildBedInventory();
  const bed = beds.find((item) => item.patientId === patientId);

  await apiPatch(`/patients/${patientId}`, { status: "DISCHARGED" });

  if (bed) {
    await apiPatch(`/beds/${bed.id}/release`, {}).catch(() => undefined);
  }
}

// ─── Billing (client-side from patient detail) ────────────────────────────────

export function generateBill(patient: PatientDetail): Bill {
  const now = new Date().toISOString();
  const days = Math.max(1, patient.dayOfStay);
  const lineItems: BillLineItem[] = [];
  let idSeq = 1;

  const li = (
    category: BillLineItem["category"],
    description: string,
    quantity: number,
    unitRate: number,
  ): BillLineItem => ({
    id: `bl-${idSeq++}`,
    category,
    description,
    quantity,
    unitRate,
    total: Math.round(quantity * unitRate * 100) / 100,
  });

  lineItems.push(
    li(
      "room",
      `Room & board — ${patient.room} (${days} day${days > 1 ? "s" : ""})`,
      days,
      1200,
    ),
  );
  lineItems.push(
    li("nursing", `Nursing care (${days} day${days > 1 ? "s" : ""})`, days, 320),
  );

  patient.careTeam.forEach((assignment) => {
    if (!assignment.doctor) return;
    const role = assignment.doctor.role === "Attending" ? "Attending" : "Consulting";
    const rate = role === "Attending" ? 450 : 300;
    lineItems.push(
      li("doctor", `${role} physician — ${assignment.doctor.name}`, 1, rate),
    );
  });

  const labOrders = patient.events.filter((event) => event.type === "lab_order");
  labOrders.forEach((event) => {
    const name = event.summary
      .replace(/^Lab ordered — /, "")
      .replace(/ \(\w+\)$/, "");
    lineItems.push(li("lab", `Lab — ${name}`, 1, 180));
  });

  const medEvents = patient.events.filter((event) => event.type === "medication");
  if (medEvents.length > 0) {
    lineItems.push(
      li(
        "medication",
        `Medication administrations (×${medEvents.length})`,
        medEvents.length,
        95,
      ),
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const total = Math.round(subtotal * 100) / 100;

  return {
    patientId: patient.id,
    patientName: patient.name,
    generatedAt: now,
    lineItems,
    subtotal,
    insuranceAdjustment: 0,
    total,
  };
}

// ─── Patient intake ───────────────────────────────────────────────────────────

export interface IntakeFormData {
  name: string;
  age: number;
  sex: "M" | "F" | "Other";
  department: Department;
  chiefComplaint: string;
  medications?: string;
  allergies?: string;
  needsAdmission: boolean;
  doctorId: string;
}

export async function createPatient(data: IntakeFormData): Promise<string> {
  const { firstName, lastName } = splitName(data.name);
  const departmentId = await resolveDepartmentId(data.department);
  const patientNumber = `P-${Date.now().toString().slice(-6)}`;

  const created = await apiPost<BackendPatientSummary>("/patients", {
    patientNumber,
    firstName,
    lastName,
    age: data.age,
    gender: mapSexToGender(data.sex),
    room: data.needsAdmission ? null : "Outpatient",
    departmentId,
    status: data.needsAdmission ? "WAITING" : "ACTIVE",
    priority: "MEDIUM",
    assignedDoctorId: data.doctorId,
    assignedNurseId: null,
  });

  await apiPost("/workflow-events", {
    patientId: created.id,
    title: "Patient registered",
    description: [
      `Chief complaint: ${data.chiefComplaint}`,
      data.medications ? `Medications: ${data.medications}` : null,
      data.allergies ? `Allergies: ${data.allergies}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    eventType: "ADMISSION",
    status: "COMPLETED",
    sequence: 1,
  });

  return created.id;
}

// ─── Departments ──────────────────────────────────────────────────────────────

export interface DepartmentWithStats {
  id: string;
  name: string;
  displayName: string;
  status: string;
  activePatients: number;
}

export async function getDepartmentsWithStats(): Promise<DepartmentWithStats[]> {
  const [departments, patients] = await Promise.all([
    apiGet<Paginated<{ id: string; name: string; status: string }>>(
      "/departments?limit=100",
    ),
    fetchAndMapPatients({ query: { excludeStatus: "DISCHARGED" } }),
  ]);

  const counts = patients.reduce<Record<string, number>>((acc, patient) => {
    acc[patient.departmentId] = (acc[patient.departmentId] ?? 0) + 1;
    return acc;
  }, {});

  return departments.items.map((department) => {
    const displayName = mapDepartmentName(department.name);
    return {
      id: department.id,
      name: department.name,
      displayName,
      status: department.status,
      activePatients: counts[displayName] ?? 0,
    };
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalPatients: number;
  activePatients: number;
  waitingPatients: number;
  dischargedPatients: number;
  urgentCount: number;
  byDepartment: Array<{ name: string; count: number }>;
  byPriority: Array<{ label: string; count: number }>;
}

export async function getAnalyticsSummary(options?: {
  nurseId?: string;
  doctorId?: string;
}): Promise<AnalyticsSummary> {
  let patients: Patient[];

  if (options?.nurseId) {
    const resolvedId = await resolveStaffId(options.nurseId, "NURSE");
    const query = new URLSearchParams({ limit: PATIENT_FETCH_LIMIT, page: "1" });
    patients = await fetchAndMapPatients({
      path: `/users/${resolvedId}/patients?${query}`,
    });
  } else if (options?.doctorId) {
    const resolvedId = await resolveStaffId(options.doctorId, "DOCTOR");
    const query = new URLSearchParams({ limit: PATIENT_FETCH_LIMIT, page: "1" });
    patients = await fetchAndMapPatients({
      path: `/users/${resolvedId}/patients?${query}`,
    });
  } else {
    patients = await getAllPatients();
  }

  const byDepartment = patients.reduce<Record<string, number>>((acc, patient) => {
    acc[patient.departmentId] = (acc[patient.departmentId] ?? 0) + 1;
    return acc;
  }, {});

  const byPriority = patients.reduce<Record<string, number>>((acc, patient) => {
    const label =
      patient.status === "critical"
        ? "Critical"
        : patient.status === "delayed"
          ? "High priority"
          : patient.status === "blocked"
            ? "Waiting"
            : "On track";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const activePatients = patients.filter(
    (p) => p.dischargedAt === null && p.status === "ontrack",
  ).length;
  const waitingPatients = patients.filter(
    (p) => p.dischargedAt === null && p.status === "blocked",
  ).length;
  const dischargedPatients = patients.filter((p) => p.dischargedAt !== null).length;

  return {
    totalPatients: patients.length,
    activePatients,
    waitingPatients,
    dischargedPatients,
    urgentCount: patients.filter(
      (p) => p.status === "critical" || p.status === "delayed",
    ).length,
    byDepartment: Object.entries(byDepartment)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byPriority: Object.entries(byPriority)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}
