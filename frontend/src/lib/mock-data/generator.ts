/**
 * Mock data generator — Phase 1
 *
 * Produces 25 synthetic patients across 5 departments.
 * Status mix: 14 on-track, 6 delayed, 3 blocked, 2 critical, 3 discharged.
 * (Discharged patients keep full event history — used for Doctor > History view.)
 *
 * This file is imported ONLY by lib/api.ts — never directly by components.
 */

import type {
  Patient,
  WorkflowStep,
  PatientEvent,
  CareTeamAssignment,
  TreatmentPlanItem,
  DischargeCondition,
  Department,
  PatientStatus,
  WorkflowPhase,
  WorkflowStepName,
  EventType,
  DischargeConditionName,
  PatientDetail,
  WorkflowGroup,
  Notification,
  NursingTask,
  Bed,
  Ambulance,
} from "@/types";
import { worstStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _seq = 1;
const uid = () => String(_seq++);

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}
function daysAgo(d: number): string {
  return hoursAgo(d * 24);
}
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function elapsed(isoTimestamp: string): string {
  const ms = Date.now() - new Date(isoTimestamp).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ─── Doctors & nurses pool ────────────────────────────────────────────────────

const DOCTORS = [
  { id: "d1", name: "Dr. Kwame Osei", initials: "KO", specialty: "Cardiology" },
  { id: "d2", name: "Dr. Priya Menon", initials: "PM", specialty: "General Medicine" },
  { id: "d3", name: "Dr. Sandra Reeves", initials: "SR", specialty: "Radiology" },
  { id: "d4", name: "Dr. Marcus Webb", initials: "MW", specialty: "Orthopedics" },
  { id: "d5", name: "Dr. Ling Zhao", initials: "LZ", specialty: "ICU / Critical Care" },
  { id: "d6", name: "Dr. Amara Diallo", initials: "AD", specialty: "Cardiology" },
  { id: "d7", name: "Dr. Tomás Herrera", initials: "TH", specialty: "General Medicine" },
  { id: "d8", name: "Dr. Fiona Nakamura", initials: "FN", specialty: "Orthopedics" },
] as const;

/**
 * Exported for api.ts to expose via getDoctors().
 * Spread to break the `as const` readonly constraint so callers get plain objects.
 */
export const ALL_DOCTORS = DOCTORS.map((d) => ({ ...d }));

const NURSES = [
  { id: "n1", name: "Green, R.", initials: "RG", shift: "Day" as const },
  { id: "n2", name: "Chen, M.", initials: "MC", shift: "Day" as const },
  { id: "n3", name: "Okafor, B.", initials: "BO", shift: "Night" as const },
  { id: "n4", name: "Singh, P.", initials: "PS", shift: "Evening" as const },
  { id: "n5", name: "Torres, A.", initials: "AT", shift: "Day" as const },
  { id: "n6", name: "Park, S.", initials: "SP", shift: "Night" as const },
] as const;

// ─── Step builders ────────────────────────────────────────────────────────────

function makeIntakeSteps(
  patientId: string,
  admittedAt: string,
  status: PatientStatus
): WorkflowStep[] {
  const base = new Date(admittedAt).getTime();
  const stepDefs: { name: WorkflowStepName; offsetH: number; st: PatientStatus }[] = [
    { name: "Registered", offsetH: 0, st: "ontrack" },
    { name: "Vitals", offsetH: 0.5, st: "ontrack" },
    { name: "Doctor assessment", offsetH: 1.5, st: status === "critical" ? "critical" : "ontrack" },
    { name: "Scan ordered", offsetH: 2, st: status === "delayed" || status === "blocked" ? "delayed" : "ontrack" },
    { name: "Scan results", offsetH: 5, st: status === "blocked" ? "delayed" : status === "critical" ? "critical" : "ontrack" },
    { name: "Bed assigned", offsetH: 6, st: "ontrack" },
  ];

  return stepDefs.map((def, i) => {
    const scheduled = new Date(base + def.offsetH * 3_600_000).toISOString();
    const done = def.offsetH < 4;
    return {
      id: uid(),
      patientId,
      phase: "intake" as WorkflowPhase,
      name: def.name,
      status: def.st,
      scheduledAt: scheduled,
      completedAt: done ? new Date(base + (def.offsetH + 0.25) * 3_600_000).toISOString() : null,
      note: def.name === "Scan results" && (status === "blocked" || status === "delayed")
        ? "CT ordered 3h20m ago, still awaiting results — queue backlog in radiology"
        : null,
      flagged: def.name === "Scan results" && status === "blocked",
      occurrence: i + 1,
    };
  });
}

function makeInpatientSteps(
  patientId: string,
  dayOfStay: number,
  status: PatientStatus
): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  const medsOverdue = status === "delayed" || status === "blocked";

  for (let day = 1; day <= Math.min(dayOfStay, 3); day++) {
    const base = daysAgo(dayOfStay - day);

    // Medications (twice daily)
    [8, 20].forEach((hour, i) => {
      const scheduled = new Date(base);
      scheduled.setHours(hour, 0, 0, 0);
      // Clamp: a scheduled time in the future means the wall-clock hour hasn't
      // passed yet today. Treat it as 30 minutes in the past so no step ever
      // produces a future (negative-elapsed) timestamp.
      if (scheduled.getTime() > Date.now()) {
        scheduled.setTime(Date.now() - 30 * 60_000);
      }
      const isOverdue = medsOverdue && day === Math.min(dayOfStay, 3) && hour === 20;
      steps.push({
        id: uid(),
        patientId,
        phase: "inpatient",
        name: "Medications",
        status: isOverdue ? "delayed" : "ontrack",
        scheduledAt: scheduled.toISOString(),
        completedAt: isOverdue ? null : new Date(scheduled.getTime() + 900_000).toISOString(),
        note: isOverdue ? "Metoprolol 8:00 PM overdue — nurse flagged" : null,
        flagged: isOverdue,
        occurrence: (day - 1) * 2 + i + 1,
      });
    });

    // Labs (once daily)
    const labScheduled = new Date(base);
    labScheduled.setHours(7, 30, 0, 0);
    if (labScheduled.getTime() > Date.now()) labScheduled.setTime(Date.now() - 30 * 60_000);
    steps.push({
      id: uid(),
      patientId,
      phase: "inpatient",
      name: "Labs",
      status: status === "critical" && day === Math.min(dayOfStay, 3) ? "critical" : "ontrack",
      scheduledAt: labScheduled.toISOString(),
      completedAt: new Date(labScheduled.getTime() + 5_400_000).toISOString(),
      note: status === "critical" && day === Math.min(dayOfStay, 3)
        ? "Troponin elevated — repeat ordered"
        : null,
      flagged: status === "critical" && day === Math.min(dayOfStay, 3),
      occurrence: day,
    });

    // Rounds (once daily)
    const roundsScheduled = new Date(base);
    roundsScheduled.setHours(9, 0, 0, 0);
    if (roundsScheduled.getTime() > Date.now()) roundsScheduled.setTime(Date.now() - 30 * 60_000);
    steps.push({
      id: uid(),
      patientId,
      phase: "inpatient",
      name: "Rounds",
      status: "ontrack",
      scheduledAt: roundsScheduled.toISOString(),
      completedAt: new Date(roundsScheduled.getTime() + 1_800_000).toISOString(),
      note: null,
      flagged: false,
      occurrence: day,
    });
  }

  return steps;
}

function makeDischargeSteps(
  patientId: string,
  status: PatientStatus,
  conditions: DischargeCondition[]
): WorkflowStep[] {
  const incomplete = conditions.filter((c) => c.status === "incomplete");
  const note =
    status === "blocked"
      ? `Blocked — ${incomplete.map((c) => c.condition.toLowerCase()).join(", ")} pending`
      : status === "delayed"
      ? "Discharge planning in progress — 1 condition outstanding"
      : "All discharge conditions met";

  return [
    {
      id: uid(),
      patientId,
      phase: "discharge" as WorkflowPhase,
      name: "Discharge planning",
      status,
      scheduledAt: hoursFromNow(2),
      completedAt: status === "ontrack" ? hoursAgo(1) : null,
      note,
      flagged: status === "blocked" || status === "critical",
      occurrence: 1,
    },
  ];
}

// ─── Event builders ───────────────────────────────────────────────────────────

function makeEvents(
  patientId: string,
  admittedAt: string,
  dayOfStay: number,
  status: PatientStatus,
  diagnosis: string,
  dischargedAt: string | null
): PatientEvent[] {
  const events: PatientEvent[] = [];
  const base = new Date(admittedAt).getTime();

  const push = (
    type: EventType,
    offsetH: number,
    actor: string,
    summary: string,
    detail: string | null = null,
    flagged = false
  ) => {
    events.push({
      id: uid(),
      patientId,
      type,
      timestamp: new Date(base + offsetH * 3_600_000).toISOString(),
      actor,
      summary,
      detail,
      flagged,
    });
  };

  push("admission", 0, "System", `Admitted — ${diagnosis}`, null, false);
  push("vitals", 0.5, "Nurse Rivera", "Vitals recorded — BP 138/88, HR 76");
  push("rounds", 1.5, "Dr. Osei", "Initial assessment completed");
  push("scan_order", 2, "Dr. Osei", "CT scan ordered");

  for (let day = 1; day < dayOfStay; day++) {
    push("lab_order", day * 24 + 7.5, "System", `Day ${day} labs drawn`);
    push("lab_result", day * 24 + 10, "System", `Day ${day} lab results received`);
    push("medication", day * 24 + 8, "Nurse Chen", `Day ${day} AM medications administered`);
    push("rounds", day * 24 + 9, "Dr. Osei", `Day ${day} rounds completed`);
  }

  if (status === "delayed" || status === "blocked") {
    push(
      "scan_result",
      5,
      "Dr. Reeves",
      "CT results delayed — radiology backlog",
      "Queue backlog in radiology; expected within 2h",
      true
    );
  } else {
    push("scan_result", 5, "Dr. Reeves", "CT results received — reviewed");
  }

  if (status === "critical") {
    push(
      "status_change",
      dayOfStay * 24 - 2,
      "Dr. Zhao",
      "Status escalated to critical — troponin elevated",
      "Troponin 2.1 ng/mL (ref < 0.04). Repeat ECG ordered.",
      true
    );
  }

  if (dischargedAt) {
    const dischargeOffset =
      (new Date(dischargedAt).getTime() - base) / 3_600_000;
    push("discharge", dischargeOffset, "System", "Patient discharged");
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// ─── Discharge conditions builder ─────────────────────────────────────────────

function makeDischargeConditions(
  patientId: string,
  status: PatientStatus,
  blockedOn?: DischargeConditionName[]
): DischargeCondition[] {
  const all: DischargeConditionName[] = [
    "Physician approval",
    "Medication prepared",
    "Transportation",
    "Patient education",
    "Insurance approval",
  ];

  return all.map((condition) => {
    const isIncomplete =
      status === "blocked"
        ? (blockedOn ?? ["Transportation"]).includes(condition)
        : status === "delayed"
        ? condition === "Insurance approval"
        : false;

    const updatedAt = isIncomplete ? hoursAgo(2 + Math.random() * 4) : hoursAgo(0.5);
    return {
      id: uid(),
      patientId,
      condition,
      status: isIncomplete ? "incomplete" : "complete",
      owningDepartment:
        condition === "Physician approval"
          ? ("General Medicine" as const)
          : condition === "Medication prepared"
          ? ("Pharmacy" as const)
          : condition === "Transportation"
          ? ("Transport" as const)
          : condition === "Insurance approval"
          ? ("Care Coordination" as const)
          : ("Care Coordination" as const),
      updatedAt,
      elapsedDisplay: isIncomplete ? elapsed(updatedAt) : null,
    };
  });
}

// ─── Patient builder ──────────────────────────────────────────────────────────

interface PatientSpec {
  name: string;
  age: number;
  sex: "M" | "F" | "Other";
  room: string;
  dept: Department;
  status: PatientStatus;
  dayOfStay: number;
  diagnosis: string;
  aiSummary: string;
  discharged?: boolean;
  blockedOn?: DischargeConditionName[];
  doctorIds: string[];
  nurseId: string;
}

function buildPatient(spec: PatientSpec): PatientDetail {
  const pid = uid();
  const admittedAt = daysAgo(spec.dayOfStay);
  const dischargedAt = spec.discharged
    ? daysAgo(Math.max(0, spec.dayOfStay - 1))
    : null;

  const patient: Patient = {
    id: pid,
    name: spec.name,
    initials: initials(spec.name),
    age: spec.age,
    sex: spec.sex,
    room: spec.room,
    departmentId: spec.dept,
    status: spec.discharged ? "ontrack" : spec.status,
    dayOfStay: spec.dayOfStay,
    admittedAt,
    dischargedAt,
    diagnosis: spec.diagnosis,
    aiSummary: spec.aiSummary,
  };

  const dischargeConditions = makeDischargeConditions(pid, spec.status, spec.blockedOn);

  const intakeSteps = makeIntakeSteps(pid, admittedAt, spec.status);
  const inpatientSteps = makeInpatientSteps(pid, spec.dayOfStay, spec.status);
  const dischargeSteps = makeDischargeSteps(pid, spec.status, dischargeConditions);

  const allSteps = [...intakeSteps, ...inpatientSteps, ...dischargeSteps];

  const workflowGroups: WorkflowGroup[] = [
    {
      phase: "intake",
      label: "Intake & diagnosis",
      status: worstStatus(intakeSteps.map((s) => s.status)),
      steps: intakeSteps,
    },
    {
      phase: "inpatient",
      label: "Inpatient care",
      status: worstStatus(inpatientSteps.map((s) => s.status)),
      steps: inpatientSteps,
      eventCount: inpatientSteps.length,
      flaggedCount: inpatientSteps.filter((s) => s.flagged).length,
    },
    {
      phase: "discharge",
      label: "Discharge",
      status: worstStatus(dischargeSteps.map((s) => s.status)),
      steps: dischargeSteps,
    },
  ];

  const careTeam: CareTeamAssignment[] = [
    ...spec.doctorIds.map((did, i) => ({
      patientId: pid,
      doctor: {
        ...(DOCTORS.find((d) => d.id === did) ?? DOCTORS[0]),
        role: (i === 0 ? "Attending" : "Consulting") as
          | "Attending"
          | "Consulting",
      },
    })),
    {
      patientId: pid,
      nurse: NURSES.find((n) => n.id === spec.nurseId) ?? NURSES[0],
    },
  ];

  const treatmentPlan: TreatmentPlanItem[] = [
    {
      id: uid(),
      patientId: pid,
      order: 1,
      description: "Complete diagnostic imaging",
      completed: true,
      completedAt: hoursAgo(spec.dayOfStay * 24 - 6),
    },
    {
      id: uid(),
      patientId: pid,
      order: 2,
      description: `Initiate treatment for ${spec.diagnosis}`,
      completed: spec.dayOfStay > 1,
      completedAt: spec.dayOfStay > 1 ? hoursAgo(spec.dayOfStay * 24 - 20) : null,
    },
    {
      id: uid(),
      patientId: pid,
      order: 3,
      description: "Monitor vitals every 4 hours",
      completed: false,
      completedAt: null,
    },
    {
      id: uid(),
      patientId: pid,
      order: 4,
      description: "Discharge planning and patient education",
      completed: spec.status === "ontrack" && spec.dayOfStay > 2,
      completedAt:
        spec.status === "ontrack" && spec.dayOfStay > 2 ? hoursAgo(4) : null,
    },
  ];

  const events = makeEvents(
    pid,
    admittedAt,
    spec.dayOfStay,
    spec.status,
    spec.diagnosis,
    dischargedAt
  );

  const vitalsHistory = makeVitalsHistory(pid, spec.nurseId, spec.dayOfStay, spec.status);

  return {
    ...patient,
    careTeam,
    treatmentPlan,
    dischargeConditions,
    workflowGroups,
    events,
    vitalsHistory,
    dischargeRequested: false,
    dischargeRequestedAt: null,
  };
}

// ─── The 25 patients ──────────────────────────────────────────────────────────

const SPECS: PatientSpec[] = [
  // ── Cardiology (5) ──────────────────────────────────────────────────────────
  {
    name: "Margaret Okonkwo",
    age: 67, sex: "F", room: "4A-12", dept: "Cardiology",
    status: "ontrack", dayOfStay: 3,
    diagnosis: "Unstable angina",
    aiSummary: "Troponin trending down since 09:14 this morning — last reading 0.3 ng/mL, within target range.",
    doctorIds: ["d1", "d6"], nurseId: "n1",
  },
  {
    name: "Bernard Calloway",
    age: 74, sex: "M", room: "4A-08", dept: "Cardiology",
    status: "delayed", dayOfStay: 5,
    diagnosis: "Heart failure exacerbation",
    aiSummary: "Echo ordered 4h ago still pending — cardiology imaging queue showing 6-hour backlog as of 11:30.",
    doctorIds: ["d1"], nurseId: "n2",
  },
  {
    name: "Yuki Tanaka",
    age: 58, sex: "F", room: "4B-03", dept: "Cardiology",
    status: "critical", dayOfStay: 2,
    diagnosis: "STEMI — post-PCI",
    aiSummary: "Troponin peaked at 2.1 ng/mL at 07:45 this morning; repeat ECG ordered by Dr. Zhao at 08:10.",
    doctorIds: ["d1", "d5"], nurseId: "n3",
  },
  {
    name: "Desmond Achebe",
    age: 62, sex: "M", room: "4B-07", dept: "Cardiology",
    status: "ontrack", dayOfStay: 4,
    diagnosis: "Atrial fibrillation",
    aiSummary: "Rate now controlled at 78 bpm since 14:00 yesterday; anticoagulation initiated on day 2.",
    doctorIds: ["d6"], nurseId: "n1",
  },
  {
    name: "Claudette Moreau",
    age: 71, sex: "F", room: "4A-15", dept: "Cardiology",
    status: "blocked", dayOfStay: 6,
    diagnosis: "Valvular heart disease",
    aiSummary: "All clinical criteria met for discharge since 10:00 yesterday — sole blocker is transportation arrangement outstanding since 08:30.",
    blockedOn: ["Transportation"],
    doctorIds: ["d1", "d6"], nurseId: "n2",
  },

  // ── General Medicine (6) ─────────────────────────────────────────────────────
  {
    name: "Obinna Eze",
    age: 45, sex: "M", room: "2C-11", dept: "General Medicine",
    status: "ontrack", dayOfStay: 2,
    diagnosis: "Community-acquired pneumonia",
    aiSummary: "Fever resolved at 06:30 this morning; O2 sat 97% on room air since yesterday evening.",
    doctorIds: ["d2"], nurseId: "n4",
  },
  {
    name: "Fatima Al-Hassan",
    age: 39, sex: "F", room: "2C-04", dept: "General Medicine",
    status: "ontrack", dayOfStay: 1,
    diagnosis: "Acute appendicitis — post-op day 1",
    aiSummary: "Post-op vitals stable; surgical site assessed at 07:00 with no signs of infection.",
    doctorIds: ["d2", "d7"], nurseId: "n5",
  },
  {
    name: "Howard Lipschitz",
    age: 82, sex: "M", room: "2D-02", dept: "General Medicine",
    status: "delayed", dayOfStay: 7,
    diagnosis: "Urinary tract infection with delirium",
    aiSummary: "Confusion persisting as of this morning's assessment — last MMSE score 18/30, down from 22 on admission.",
    doctorIds: ["d7"], nurseId: "n3",
  },
  {
    name: "Priscilla Ng",
    age: 54, sex: "F", room: "2C-09", dept: "General Medicine",
    status: "ontrack", dayOfStay: 3,
    diagnosis: "Type 2 diabetes — poorly controlled",
    aiSummary: "Morning glucose 148 mg/dL, down from 312 on admission — insulin regimen adjusted at 09:00 yesterday.",
    doctorIds: ["d2"], nurseId: "n4",
  },
  {
    name: "Emeka Jolaoso",
    age: 29, sex: "M", room: "2D-06", dept: "General Medicine",
    status: "ontrack", dayOfStay: 1,
    diagnosis: "Cellulitis — left lower leg",
    aiSummary: "Erythema border marked at admission 09:15; no spread noted at 15:00 check — IV antibiotics on schedule.",
    doctorIds: ["d7"], nurseId: "n5",
  },
  {
    name: "Ruth Osei-Bonsu",
    age: 60, sex: "F", room: "2C-14", dept: "General Medicine",
    status: "blocked", dayOfStay: 8,
    diagnosis: "COPD exacerbation",
    aiSummary: "O2 requirement down to 2L nasal cannula since yesterday — only blocker is insurance pre-authorization for home oxygen, submitted 14h ago.",
    blockedOn: ["Insurance approval", "Transportation"],
    doctorIds: ["d2", "d7"], nurseId: "n1",
  },

  // ── ICU (4) ──────────────────────────────────────────────────────────────────
  {
    name: "Victor Strauss",
    age: 77, sex: "M", room: "ICU-03", dept: "ICU",
    status: "critical", dayOfStay: 4,
    diagnosis: "Septic shock — GI source",
    aiSummary: "Vasopressor dose titrated up at 04:30 this morning — MAP holding at 68 mmHg; lactate 3.2 mmol/L on 06:00 draw.",
    doctorIds: ["d5", "d2"], nurseId: "n3",
  },
  {
    name: "Anika Petrov",
    age: 65, sex: "F", room: "ICU-07", dept: "ICU",
    status: "delayed", dayOfStay: 6,
    diagnosis: "Post-operative respiratory failure",
    aiSummary: "Weaning trial attempted at 10:00 — failed after 35 minutes; RSBI 112, repeat attempt planned for 14:00.",
    doctorIds: ["d5"], nurseId: "n6",
  },
  {
    name: "James Whitfield",
    age: 55, sex: "M", room: "ICU-02", dept: "ICU",
    status: "ontrack", dayOfStay: 3,
    diagnosis: "Traumatic brain injury — moderate",
    aiSummary: "GCS improved to 12 as of 08:00 rounds — neurology noted meaningful response to commands for first time.",
    doctorIds: ["d5", "d1"], nurseId: "n3",
  },
  {
    name: "Leila Farrokhzad",
    age: 49, sex: "F", room: "ICU-05", dept: "ICU",
    status: "ontrack", dayOfStay: 2,
    diagnosis: "Diabetic ketoacidosis",
    aiSummary: "Anion gap closed at 11:00 this morning — bicarb 20 mEq/L; insulin drip being tapered per protocol.",
    doctorIds: ["d5"], nurseId: "n6",
  },

  // ── Radiology (4) ───────────────────────────────────────────────────────────
  {
    name: "Curtis Bourne",
    age: 43, sex: "M", room: "3A-01", dept: "Radiology",
    status: "ontrack", dayOfStay: 1,
    diagnosis: "Suspected pulmonary embolism",
    aiSummary: "CTPA completed at 11:45 — Dr. Reeves preliminary read: bilateral subsegmental PE, no right heart strain.",
    doctorIds: ["d3", "d2"], nurseId: "n4",
  },
  {
    name: "Ingrid Svensson",
    age: 68, sex: "F", room: "3A-06", dept: "Radiology",
    status: "delayed", dayOfStay: 3,
    diagnosis: "Abdominal mass — workup",
    aiSummary: "MRI abdomen ordered 27 hours ago — still in queue; Dr. Reeves flagged urgency to scheduling at 09:00.",
    doctorIds: ["d3"], nurseId: "n5",
  },
  {
    name: "Kwame Darko",
    age: 52, sex: "M", room: "3B-04", dept: "Radiology",
    status: "ontrack", dayOfStay: 2,
    diagnosis: "Liver lesion characterisation",
    aiSummary: "Contrast MRI completed — Dr. Reeves read at 13:30: lesion consistent with benign haemangioma, no intervention required.",
    doctorIds: ["d3", "d7"], nurseId: "n2",
  },
  {
    name: "Mei-Lin Chou",
    age: 37, sex: "F", room: "3A-09", dept: "Radiology",
    status: "blocked", dayOfStay: 5,
    diagnosis: "Spinal cord compression workup",
    aiSummary: "MRI confirmed C5-C6 compression — neurosurgery consult requested at 14:00 yesterday; no response logged yet.",
    blockedOn: ["Physician approval", "Insurance approval"],
    doctorIds: ["d3", "d5"], nurseId: "n6",
  },

  // ── Orthopedics (6, including 3 discharged) ──────────────────────────────────
  {
    name: "Thomas Brennan",
    age: 70, sex: "M", room: "5C-02", dept: "Orthopedics",
    status: "delayed", dayOfStay: 2,
    diagnosis: "Total knee replacement — post-op day 2",
    aiSummary: "Morning PT session missed — patient reported pain 8/10 at 09:00; Dr. Webb notified, analgesia review pending.",
    doctorIds: ["d4"], nurseId: "n1",
  },
  {
    name: "Sonia Ramirez",
    age: 56, sex: "F", room: "5C-05", dept: "Orthopedics",
    status: "delayed", dayOfStay: 4,
    diagnosis: "Hip fracture — ORIF",
    aiSummary: "Day 3 PT goal not met — patient declined morning session citing pain 7/10; analgesia reviewed by Dr. Webb at 11:00.",
    doctorIds: ["d4", "d8"], nurseId: "n2",
  },
  {
    name: "Paul Nkemdirim",
    age: 48, sex: "M", room: "5D-01", dept: "Orthopedics",
    status: "ontrack", dayOfStay: 1,
    diagnosis: "Tibial plateau fracture — post-op day 1",
    aiSummary: "NV checks every 2h normal since surgery 18:00 yesterday; compartment syndrome screen negative at 06:00.",
    doctorIds: ["d4"], nurseId: "n5",
  },
  // Discharged patients (retain full history)
  {
    name: "Eleanor Vance",
    age: 63, sex: "F", room: "5C-08", dept: "Orthopedics",
    status: "ontrack", dayOfStay: 4,
    diagnosis: "Rotator cuff repair",
    aiSummary: "Discharged in good condition — all discharge criteria met and documented at 11:00.",
    discharged: true,
    doctorIds: ["d8"], nurseId: "n1",
  },
  {
    name: "George Adeyemi",
    age: 58, sex: "M", room: "5D-04", dept: "Orthopedics",
    status: "ontrack", dayOfStay: 5,
    diagnosis: "Lumbar spinal stenosis — post-decompression",
    aiSummary: "Discharged day 5 — VAS pain score 2/10 at discharge, outpatient PT arranged for day 14.",
    discharged: true,
    doctorIds: ["d4", "d8"], nurseId: "n4",
  },
  {
    name: "Nadia Korowski",
    age: 44, sex: "F", room: "5C-11", dept: "Orthopedics",
    status: "ontrack", dayOfStay: 3,
    diagnosis: "ACL reconstruction",
    aiSummary: "Discharged day 3 — crutch-walking independently, ice/elevation instructions provided and confirmed understood.",
    discharged: true,
    doctorIds: ["d8"], nurseId: "n5",
  },
  // Discharged Cardiology patients — Dr. Kwame Osei (d1) history
  {
    name: "Samuel Oduya",
    age: 61, sex: "M", room: "4A-03", dept: "Cardiology",
    status: "ontrack", dayOfStay: 4,
    diagnosis: "Hypertensive urgency",
    aiSummary: "Discharged after 4 days — BP stabilised at 138/84 on dual therapy; follow-up with outpatient cardiology in 2 weeks.",
    discharged: true,
    doctorIds: ["d1", "d6"], nurseId: "n2",
  },
  {
    name: "Vera Holmberg",
    age: 55, sex: "F", room: "4B-11", dept: "Cardiology",
    status: "ontrack", dayOfStay: 6,
    diagnosis: "Paroxysmal supraventricular tachycardia",
    aiSummary: "Discharged day 6 following successful cardioversion on day 2; Holter monitor arranged for 30-day follow-up.",
    discharged: true,
    doctorIds: ["d1"], nurseId: "n3",
  },
];

// ─── Build all patients ───────────────────────────────────────────────────────

export const ALL_PATIENTS: PatientDetail[] = SPECS.map(buildPatient);

// ─── Notifications ────────────────────────────────────────────────────────────

export const ALL_NOTIFICATIONS: Notification[] = [
  {
    id: uid(), patientId: ALL_PATIENTS[2].id,
    patientName: ALL_PATIENTS[2].name, room: ALL_PATIENTS[2].room,
    status: "critical",
    summary: "Troponin elevated — repeat ECG ordered, Dr. Zhao notified",
    timestamp: hoursAgo(0.5), read: false,
  },
  {
    id: uid(), patientId: ALL_PATIENTS[11].id,
    patientName: ALL_PATIENTS[11].name, room: ALL_PATIENTS[11].room,
    status: "critical",
    summary: "Vasopressor dose increased — MAP below target at 04:30",
    timestamp: hoursAgo(2), read: false,
  },
  {
    id: uid(), patientId: ALL_PATIENTS[4].id,
    patientName: ALL_PATIENTS[4].name, room: ALL_PATIENTS[4].room,
    status: "blocked",
    summary: "Transportation not arranged — discharge blocked since 08:30",
    timestamp: hoursAgo(3), read: false,
  },
  {
    id: uid(), patientId: ALL_PATIENTS[10].id,
    patientName: ALL_PATIENTS[10].name, room: ALL_PATIENTS[10].room,
    status: "blocked",
    summary: "Insurance pre-auth pending 14h — home oxygen discharge blocked",
    timestamp: hoursAgo(4), read: true,
  },
  {
    id: uid(), patientId: ALL_PATIENTS[1].id,
    patientName: ALL_PATIENTS[1].name, room: ALL_PATIENTS[1].room,
    status: "delayed",
    summary: "Echo still pending — cardiology imaging queue backlog",
    timestamp: hoursAgo(5), read: true,
  },
  {
    id: uid(), patientId: ALL_PATIENTS[6].id,
    patientName: ALL_PATIENTS[6].name, room: ALL_PATIENTS[6].room,
    status: "delayed",
    summary: "Confusion persisting — MMSE declined since admission",
    timestamp: hoursAgo(6), read: true,
  },
  // Notifications for Rachel Green's (n1) patients
  {
    id: uid(), patientId: ALL_PATIENTS[19].id,
    patientName: ALL_PATIENTS[19].name, room: ALL_PATIENTS[19].room,
    status: "delayed",
    summary: "Morning PT missed — pain 8/10 reported; analgesia review pending",
    timestamp: hoursAgo(1.5), read: false,
  },
];

// ─── Nursing tasks (n1 = Rachel Green) ───────────────────────────────────────
// Two or three tasks per assigned active patient — realistic shift-level work.

const n1Patients = ALL_PATIENTS.filter(
  (p) => p.dischargedAt === null && p.careTeam.some((a) => a.nurse?.id === "n1")
);

export const ALL_NURSING_TASKS: NursingTask[] = [
  // Margaret Okonkwo — ontrack, Cardiology (Unstable angina)
  {
    id: uid(), patientId: n1Patients[0].id, nurseId: "n1",
    title: "Vital signs monitoring q4h",
    status: "active",
    dueContext: "Due: Ongoing",
  },
  {
    id: uid(), patientId: n1Patients[0].id, nurseId: "n1",
    title: "Administer Metoprolol 50 mg PO",
    status: "pending",
    dueContext: "Due: 20:00",
  },

  // Desmond Achebe — ontrack, Cardiology (Atrial fibrillation)
  {
    id: uid(), patientId: n1Patients[1].id, nurseId: "n1",
    title: "Anticoagulation teaching session",
    status: "done",
    dueContext: "Completed this shift",
  },
  {
    id: uid(), patientId: n1Patients[1].id, nurseId: "n1",
    title: "Telemetry review with charge",
    status: "pending",
    dueContext: "Due: Before handoff",
  },

  // Ruth Osei-Bonsu — blocked, General Medicine (COPD)
  {
    id: uid(), patientId: n1Patients[2].id, nurseId: "n1",
    title: "Follow up on insurance pre-auth status",
    status: "active",
    dueContext: "Due: ASAP — blocks discharge",
  },
  {
    id: uid(), patientId: n1Patients[2].id, nurseId: "n1",
    title: "Home oxygen education for patient & family",
    status: "pending",
    dueContext: "Due: After pharmacy confirms",
  },

  // Thomas Brennan — delayed, Orthopedics (TKR post-op)
  {
    id: uid(), patientId: n1Patients[3].id, nurseId: "n1",
    title: "Pain reassessment after analgesia adjustment",
    status: "active",
    dueContext: "Due: Within 1 hour",
  },
  {
    id: uid(), patientId: n1Patients[3].id, nurseId: "n1",
    title: "Reschedule PT session with physiotherapy",
    status: "pending",
    dueContext: "Due: This afternoon",
  },
  {
    id: uid(), patientId: n1Patients[3].id, nurseId: "n1",
    title: "Document reason for missed morning PT",
    status: "done",
    dueContext: "Completed this shift",
  },
];

// ─── Vitals history seeder ────────────────────────────────────────────────────
//
// Produces 1 reading per 6 hours of admission, capped at 12 readings.
// Vital ranges are status-aware so critical/delayed patients show real variance.

function makeVitalsHistory(
  patientId: string,
  nurseId: string,
  dayOfStay: number,
  status: PatientStatus
): import("@/types").VitalsEntry[] {
  const readingCount = Math.min(12, Math.max(2, dayOfStay * 4));
  const intervalH    = (dayOfStay * 24) / readingCount;

  // Base ranges vary by status
  const baseSystolic  = status === "critical" ? 168 : status === "delayed" ? 148 : 128;
  const baseDiastolic = status === "critical" ? 105 : status === "delayed" ? 92  : 82;
  const basePulse     = status === "critical" ? 104 : status === "delayed" ? 94  : 78;
  const baseTemp      = status === "critical" ? 101.8 : status === "delayed" ? 99.4 : 98.6;
  const baseO2        = status === "critical" ? 91  : status === "delayed" ? 95  : 98;
  const baseRR        = status === "critical" ? 22  : status === "delayed" ? 18  : 16;

  // Simple deterministic variance: oscillate gently so the trend is real
  return Array.from({ length: readingCount }, (_, i) => {
    const hoursBack = (readingCount - 1 - i) * intervalH;
    const t = i / Math.max(readingCount - 1, 1); // 0→1 over time
    // Slight improvement trend for ontrack, slight worsening for critical
    const trend = status === "ontrack" ? -t * 10 : status === "critical" ? t * 8 : t * 3;
    const wave  = Math.sin(i * 1.2) * 4; // gentle oscillation

    const systolic  = Math.round(baseSystolic  + trend + wave);
    const diastolic = Math.round(baseDiastolic + trend * 0.5 + wave * 0.5);
    const pulse     = Math.round(basePulse     + trend + Math.sin(i * 0.9) * 3);
    const temp      = Math.round((baseTemp     + (trend > 0 ? 0.3 : -0.2) + Math.sin(i) * 0.15) * 10) / 10;
    const o2        = Math.min(100, Math.round(baseO2 - trend * 0.2 + Math.sin(i * 0.7) * 0.5));
    const rr        = Math.round(baseRR + trend * 0.1 + Math.sin(i * 1.1));

    return {
      patientId,
      nurseId,
      bp:        `${systolic}/${diastolic}`,
      pulse:     Math.max(50, pulse),
      temp:      Math.max(96, temp),
      respRate:  Math.max(10, rr),
      o2Sat:     Math.min(100, Math.max(85, o2)),
      recordedAt: new Date(Date.now() - hoursBack * 3_600_000).toISOString(),
    };
  });
}

// ─── Bed inventory ────────────────────────────────────────────────────────────
//
// Reconciliation rule: every admitted (non-discharged) patient owns exactly one
// occupied bed whose roomLabel === patient.room. Beds are derived from
// ALL_PATIENTS so they stay in sync with any future writes that mutate that
// array (assignBed updates both the bed record and the patient's room field).
//
// Available beds = discharged patients' now-vacated rooms + fresh rooms whose
// numbers don't appear in any SPECS entry. Confirmed non-conflicting against
// all 27 room strings in the generator.

const _occupiedBeds: Bed[] = ALL_PATIENTS
  .filter((p) => p.dischargedAt === null)
  .map((p) => ({
    id:         `bed-${p.id}`,
    roomLabel:  p.room,
    department: p.departmentId,
    status:     "occupied" as const,
    patientId:  p.id,
  }));

const _availableBeds: Bed[] = [
  // ── Cardiology — discharged rooms now vacant ──────────────────────────────
  { id: "bed-a-c1", roomLabel: "4A-03", department: "Cardiology",      status: "available", patientId: null },
  { id: "bed-a-c2", roomLabel: "4B-11", department: "Cardiology",      status: "available", patientId: null },
  // ── Cardiology — fresh rooms ──────────────────────────────────────────────
  { id: "bed-a-c3", roomLabel: "4A-04", department: "Cardiology",      status: "available", patientId: null },
  { id: "bed-a-c4", roomLabel: "4B-01", department: "Cardiology",      status: "available", patientId: null },
  // ── General Medicine — fresh rooms ────────────────────────────────────────
  { id: "bed-a-g1", roomLabel: "2A-01", department: "General Medicine", status: "available", patientId: null },
  { id: "bed-a-g2", roomLabel: "2B-03", department: "General Medicine", status: "available", patientId: null },
  // ── ICU — fresh rooms ─────────────────────────────────────────────────────
  { id: "bed-a-i1", roomLabel: "ICU-01", department: "ICU",             status: "available", patientId: null },
  { id: "bed-a-i2", roomLabel: "ICU-06", department: "ICU",             status: "available", patientId: null },
  // ── Radiology — fresh rooms ───────────────────────────────────────────────
  { id: "bed-a-r1", roomLabel: "3A-03", department: "Radiology",        status: "available", patientId: null },
  { id: "bed-a-r2", roomLabel: "3B-01", department: "Radiology",        status: "available", patientId: null },
  // ── Orthopedics — discharged rooms now vacant ─────────────────────────────
  { id: "bed-a-o1", roomLabel: "5C-08", department: "Orthopedics",      status: "available", patientId: null },
  { id: "bed-a-o2", roomLabel: "5D-04", department: "Orthopedics",      status: "available", patientId: null },
  { id: "bed-a-o3", roomLabel: "5C-11", department: "Orthopedics",      status: "available", patientId: null },
  // ── Orthopedics — fresh room ──────────────────────────────────────────────
  { id: "bed-a-o4", roomLabel: "5D-03", department: "Orthopedics",      status: "available", patientId: null },
];

/** Mutable bed inventory. assignBed() mutates records in place. */
export const ALL_BEDS: Bed[] = [..._occupiedBeds, ..._availableBeds];

// ─── Ambulance fleet ──────────────────────────────────────────────────────────

export const ALL_AMBULANCES: Ambulance[] = [
  { id: "amb-01", label: "Unit 1", status: "available"  },
  { id: "amb-02", label: "Unit 2", status: "dispatched" },
  { id: "amb-03", label: "Unit 3", status: "available"  },
  { id: "amb-04", label: "Unit 4", status: "available"  },
  { id: "amb-05", label: "Unit 5", status: "dispatched" },
  { id: "amb-06", label: "Unit 6", status: "available"  },
  { id: "amb-07", label: "Unit 7", status: "available"  },
];
