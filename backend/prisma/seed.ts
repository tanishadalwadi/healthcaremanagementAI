import {
  Gender,
  PatientStatus,
  Priority,
  PrismaClient,
  type User,
  type UserRole,
} from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  "Emergency",
  "Cardiology",
  "Oncology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "ICU",
  "Radiology",
  "Surgery",
  "Internal Medicine",
] as const;

/** Curated patient roster — 50 unique full names (P-1001 … P-1050). */
const PATIENT_FULL_NAMES = [
  "Ariadne Sinclair",
  "Atticus Finch",
  "Aurelia Thorne",
  "Balthazar Hayes",
  "Calliope Hayes",
  "Caspian Vance",
  "Cassian Wright",
  "Daphne Sterling",
  "Desmond Cole",
  "Elio Vance",
  "Elodie Brooks",
  "Endellion Roux",
  "Evander Brooks",
  "Ezra Montgomery",
  "Felix Hawthorne",
  "Freya Sterling",
  "Gideon Holt",
  "Giselle Locke",
  "Helena Sterling",
  "Henley Beckett",
  "Indigo Rivers",
  "Isidore Finch",
  "Juno Sinclair",
  "Kaelen Cross",
  "Kai Montgomery",
  "Lysander Scott",
  "Maren Brooks",
  "Marlowe Hayes",
  "Nathaniel Thorne",
  "Octavia Sterling",
  "Odette Roux",
  "Olympia Finch",
  "Orion Vance",
  "Pandora Roux",
  "Peregrine Thorne",
  "Persephone Holt",
  "Phineas Hayes",
  "Rowan Beckett",
  "Sabina Locke",
  "Seraphina Roux",
  "Silas Montgomery",
  "Sloane Sterling",
  "Thaddeus Cross",
  "Theodore Thorne",
  "Torin Brooks",
  "Vesper Sinclair",
  "Victor Locke",
  "Xanthe Hayes",
  "Zephyr Montgomery",
  "Zuri Finch",
] as const;

const NURSES = [
  { name: "Sarah Johnson", email: "sarah.nurse@pulse.com" },
  { name: "Emily Carter", email: "emily.nurse@pulse.com" },
  { name: "Jessica Lee", email: "jessica.nurse@pulse.com" },
  { name: "Amanda Brooks", email: "amanda.nurse@pulse.com" },
  { name: "Rachel Kim", email: "rachel.nurse@pulse.com" },
  { name: "Nicole Turner", email: "nicole.nurse@pulse.com" },
  { name: "Lauren Scott", email: "lauren.nurse@pulse.com" },
  { name: "Megan Foster", email: "megan.nurse@pulse.com" },
  { name: "Ashley Reed", email: "ashley.nurse@pulse.com" },
  { name: "Brittany Cole", email: "brittany.nurse@pulse.com" },
] as const;

const DOCTORS = [
  { name: "Dr. Michael Chen", email: "mchen.doctor@pulse.com" },
  { name: "Dr. Lisa Patel", email: "lpatel.doctor@pulse.com" },
  { name: "Dr. James Wilson", email: "jwilson.doctor@pulse.com" },
  { name: "Dr. Anna Rivera", email: "arivera.doctor@pulse.com" },
  { name: "Dr. Robert Hayes", email: "rhayes.doctor@pulse.com" },
] as const;

const ADMINS = [
  { name: "Alex Morgan", email: "alex.admin@pulse.com" },
  { name: "Jordan Blake", email: "jordan.admin@pulse.com" },
  { name: "Taylor Reed", email: "taylor.admin@pulse.com" },
] as const;

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];
const STATUSES: PatientStatus[] = ["ACTIVE", "WAITING", "DISCHARGED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const PATIENT_COUNT = 50;
const CONSULTATION_COUNT = 30;

const CONSULTATION_REASONS = [
  "Chest pain evaluation",
  "Post-operative follow-up",
  "Medication review",
  "Lab results discussion",
  "Discharge planning",
  "Symptom assessment",
  "Specialist referral review",
  "Care plan update",
  "Pre-surgery consultation",
  "Chronic condition management",
] as const;

const CONSULTATION_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const WORKFLOW_EVENT_TEMPLATE = [
  { title: "Patient Admission", eventType: "ADMISSION", status: "COMPLETED" },
  { title: "Triage Vitals", eventType: "TRIAGE", status: "COMPLETED" },
  { title: "Physician Consultation", eventType: "CONSULTATION", status: "COMPLETED" },
  { title: "Imaging Ordered", eventType: "IMAGING_ORDERED", status: "COMPLETED" },
  { title: "Morning Medications", eventType: "MEDICATION", status: "IN_PROGRESS" },
  { title: "Lab Panel", eventType: "LAB_ORDERED", status: "IN_PROGRESS" },
  { title: "Physician Rounds", eventType: "TREATMENT", status: "COMPLETED" },
  { title: "Discharge Planning", eventType: "DISCHARGE_PLANNING", status: "PENDING" },
  { title: "Insurance Review", eventType: "INSURANCE_REVIEW", status: "PENDING" },
  { title: "Medication Prepared", eventType: "MEDICATION", status: "PENDING" },
  { title: "Transport Scheduled", eventType: "DISCHARGE_READY", status: "PENDING" },
  { title: "Physician Sign-off", eventType: "DISCHARGE", status: "PENDING" },
] as const;

const DIAGNOSES = [
  "Acute coronary syndrome",
  "Community-acquired pneumonia",
  "Hip fracture post-fall",
  "COPD exacerbation",
  "Diabetic ketoacidosis",
  "Sepsis secondary to UTI",
  "Atrial fibrillation with RVR",
  "Acute appendicitis",
  "Stroke — ischemic, left MCA",
  "CHF exacerbation",
  "Acute kidney injury",
  "Pulmonary embolism",
  "GI bleed — upper",
  "Cellulitis, lower extremity",
  "Syncope workup",
  "Hypertensive emergency",
  "Acute pancreatitis",
  "Bowel obstruction",
  "DVT — left femoral",
  "Chest pain — rule out MI",
  "Asthma exacerbation",
  "Renal colic — nephrolithiasis",
  "Anemia — iron deficiency",
  "Meningitis rule-out",
  "Delirium — multifactorial",
  "Acute cholecystitis",
  "Hypoglycemia",
  "Hyperkalemia",
  "Pneumothorax — spontaneous",
  "Subdural hematoma",
  "Rheumatoid flare",
  "Lupus nephritis",
  "Endocarditis",
  "Pericarditis",
  "Thyroid storm",
  "Adrenal crisis",
  "Electrolyte imbalance",
  "Alcohol withdrawal",
  "Opioid overdose",
  "Anaphylaxis — resolved",
  "Heat exhaustion",
  "Hypothermia",
  "Burn injury — partial thickness",
  "Traumatic brain injury — mild",
  "Spinal cord compression",
  "Guillain-Barré syndrome",
  "Myasthenic crisis",
  "Status epilepticus — resolved",
  "ARDS — ventilated",
  "Post-op complication — wound infection",
] as const;

const TASK_TITLES = [
  "Review lab results",
  "Administer medication",
  "Update patient chart",
  "Prepare discharge paperwork",
  "Monitor vital signs",
  "Coordinate imaging appointment",
  "Follow up with family",
  "Complete nursing assessment",
] as const;

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const;

function passwordForRole(role: UserRole): string {
  if (role === "NURSE") return "nurse123";
  if (role === "DOCTOR") return "doctor123";
  return "admin123";
}

const DEPT_ROOM_PREFIX: Record<string, string> = {
  Emergency: "ER",
  Cardiology: "4A",
  Oncology: "3B",
  Pediatrics: "5A",
  Orthopedics: "5C",
  Neurology: "3C",
  ICU: "ICU",
  Radiology: "3A",
  Surgery: "4B",
  "Internal Medicine": "2A",
};

const DISCHARGE_CONDITION_NAMES = [
  "Physician approval",
  "Medication prepared",
  "Transportation",
  "Patient education",
  "Insurance approval",
] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function roomFor(departmentName: string, index: number): string {
  const prefix = DEPT_ROOM_PREFIX[departmentName] ?? "2A";
  return `${prefix}-${String((index % 8) + 1).padStart(2, "0")}`;
}

function patientName(index: number): { firstName: string; lastName: string } {
  const fullName = PATIENT_FULL_NAMES[index];
  if (!fullName) {
    throw new Error(`No patient name configured for index ${index}`);
  }
  const spaceIndex = fullName.indexOf(" ");
  return {
    firstName: fullName.slice(0, spaceIndex),
    lastName: fullName.slice(spaceIndex + 1),
  };
}

function assignNurseForDepartment(
  nurses: User[],
  departmentId: string,
  index: number,
): string {
  const nursesInDept = nurses.filter(
    (nurse) => nurse.departmentId === departmentId,
  );
  const pool = nursesInDept.length > 0 ? nursesInDept : nurses;
  return pick(pool, index).id;
}

function assignDoctorForDepartment(
  doctors: User[],
  departmentId: string,
  index: number,
): string {
  const doctorsInDept = doctors.filter(
    (doctor) => doctor.departmentId === departmentId,
  );
  const pool = doctorsInDept.length > 0 ? doctorsInDept : doctors;
  return pick(pool, index).id;
}

async function seedDepartments() {
  const departments = [];

  for (const name of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { name },
      update: { status: "ACTIVE" },
      create: { name, status: "ACTIVE" },
    });
    departments.push(department);
  }

  return departments;
}

async function seedUsers(departmentIds: string[]) {
  const nurses: User[] = [];
  const doctors: User[] = [];
  const admins: User[] = [];

  for (const [index, nurse] of NURSES.entries()) {
    nurses.push(
      await prisma.user.upsert({
        where: { email: nurse.email },
        update: {
          name: nurse.name,
          role: "NURSE",
          departmentId: pick(departmentIds, index),
          active: true,
          passwordHash: hashPassword(passwordForRole("NURSE")),
        },
        create: {
          name: nurse.name,
          email: nurse.email,
          role: "NURSE",
          departmentId: pick(departmentIds, index),
          active: true,
          passwordHash: hashPassword(passwordForRole("NURSE")),
        },
      }),
    );
  }

  for (const [index, doctor] of DOCTORS.entries()) {
    doctors.push(
      await prisma.user.upsert({
        where: { email: doctor.email },
        update: {
          name: doctor.name,
          role: "DOCTOR",
          departmentId: pick(departmentIds, index + 2),
          active: true,
          passwordHash: hashPassword(passwordForRole("DOCTOR")),
        },
        create: {
          name: doctor.name,
          email: doctor.email,
          role: "DOCTOR",
          departmentId: pick(departmentIds, index + 2),
          active: true,
          passwordHash: hashPassword(passwordForRole("DOCTOR")),
        },
      }),
    );
  }

  for (const admin of ADMINS) {
    admins.push(
      await prisma.user.upsert({
        where: { email: admin.email },
        update: {
          name: admin.name,
          role: "ADMIN",
          active: true,
          passwordHash: hashPassword(passwordForRole("ADMIN")),
        },
        create: {
          name: admin.name,
          email: admin.email,
          role: "ADMIN",
          active: true,
          passwordHash: hashPassword(passwordForRole("ADMIN")),
        },
      }),
    );
  }

  return { nurses, doctors, admins };
}

async function seedPatients(
  departments: Array<{ id: string; name: string }>,
  nurses: User[],
  doctors: User[],
) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < PATIENT_COUNT; index += 1) {
    const patientNumber = `P-${String(1001 + index).padStart(4, "0")}`;
    const { firstName, lastName } = patientName(index);
    const age = 18 + (index % 62);
    const gender = pick(GENDERS, index);
    const status = pick(STATUSES, index);
    const priority = pick(PRIORITIES, index * 2);
    const department = pick(departments, index);
    const departmentId = department.id;
    const assignedNurseId = assignNurseForDepartment(nurses, departmentId, index);
    const assignedDoctorId = assignDoctorForDepartment(
      doctors,
      departmentId,
      index,
    );

    const diagnosis = pick(DIAGNOSES, index);
    const dischargeRequestedAt =
      status === "WAITING"
        ? new Date(Date.now() - (index + 1) * 3_600_000)
        : null;
    const room =
      status === "DISCHARGED"
        ? null
        : roomFor(department.name, index);

    const existing = await prisma.patient.findUnique({
      where: { patientNumber },
      select: { id: true },
    });

    await prisma.patient.upsert({
      where: { patientNumber },
      update: {
        firstName,
        lastName,
        age,
        gender,
        room,
        diagnosis,
        status,
        priority,
        departmentId,
        assignedNurseId,
        assignedDoctorId,
        dischargeRequestedAt,
        deletedAt: null,
      },
      create: {
        patientNumber,
        firstName,
        lastName,
        age,
        gender,
        room,
        diagnosis,
        status,
        priority,
        departmentId,
        assignedNurseId,
        assignedDoctorId,
        dischargeRequestedAt,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated };
}

async function seedConsultations(
  doctorIds: string[],
  departmentIds: string[],
) {
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, departmentId: true },
    orderBy: { createdAt: "asc" },
    take: CONSULTATION_COUNT,
  });

  const existingCount = await prisma.consultation.count();
  let created = 0;

  for (let index = existingCount; index < patients.length; index += 1) {
    const patient = patients[index];
    if (!patient) {
      break;
    }

    const status = pick(CONSULTATION_STATUSES, index);
    const scheduledAt = new Date(Date.now() - index * 3_600_000);

    await prisma.consultation.create({
      data: {
        patientId: patient.id,
        doctorId: pick(doctorIds, index),
        departmentId: patient.departmentId ?? pick(departmentIds, index),
        reason: pick(CONSULTATION_REASONS, index),
        notes:
          status === "COMPLETED"
            ? "Consultation completed. Patient stable and care plan updated."
            : null,
        status,
        scheduledAt,
        startedAt:
          status === "IN_PROGRESS" || status === "COMPLETED"
            ? new Date(scheduledAt.getTime() + 1_800_000)
            : null,
        completedAt:
          status === "COMPLETED"
            ? new Date(scheduledAt.getTime() + 3_600_000)
            : null,
      },
    });

    created += 1;
  }

  return { created, total: await prisma.consultation.count() };
}

async function seedWorkflowEvents(nurseIds: string[], doctorIds: string[]) {
  await prisma.workflowEvent.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;

  for (const [patientIndex, patient] of patients.entries()) {
    for (const [eventIndex, template] of WORKFLOW_EVENT_TEMPLATE.entries()) {
      const occurredAt = new Date(
        Date.now() - (patientIndex * 86_400_000 + eventIndex * 3_600_000),
      );
      const creatorId = pick(nurseIds, patientIndex + eventIndex);

      let status = template.status;
      if (patient.status === "DISCHARGED") {
        status = "COMPLETED";
      } else if (
        patient.status === "WAITING" &&
        eventIndex >= WORKFLOW_EVENT_TEMPLATE.length - 4
      ) {
        status = eventIndex === WORKFLOW_EVENT_TEMPLATE.length - 1
          ? "BLOCKED"
          : pick(["PENDING", "IN_PROGRESS", "BLOCKED"] as const, patientIndex);
      }

      await prisma.workflowEvent.create({
        data: {
          patientId: patient.id,
          title: template.title,
          description: `${template.title} documented in patient journey`,
          eventType: template.eventType,
          status,
          sequence: eventIndex + 1,
          createdBy: creatorId,
          occurredAt,
          startedAt:
            status === "IN_PROGRESS" || status === "COMPLETED"
              ? new Date(occurredAt.getTime() + 900_000)
              : null,
          completedAt:
            status === "COMPLETED"
              ? new Date(occurredAt.getTime() + 1_800_000)
              : null,
        },
      });

      created += 1;
    }
  }

  return { created, total: await prisma.workflowEvent.count() };
}

async function seedTasks(nurseIds: string[], doctorIds: string[]) {
  await prisma.task.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, assignedNurseId: true, assignedDoctorId: true },
    orderBy: { createdAt: "asc" },
  });

  const staffIds = [...nurseIds, ...doctorIds];
  let created = 0;

  for (const [index, patient] of patients.entries()) {
    for (let taskOffset = 0; taskOffset < 3; taskOffset += 1) {
      const taskIndex = index * 3 + taskOffset;
      const status = pick(TASK_STATUSES, taskIndex);
      const dueAt = new Date(Date.now() + (taskIndex + 1) * 3_600_000);
      const assignedTo =
        taskOffset === 0
          ? (patient.assignedNurseId ?? pick(staffIds, taskIndex))
          : (patient.assignedDoctorId ?? pick(staffIds, taskIndex));

      await prisma.task.create({
        data: {
          patientId: patient.id,
          title: pick(TASK_TITLES, taskIndex),
          description: "Care task linked to patient treatment plan",
          assignedTo,
          status,
          dueAt,
          completedAt: status === "COMPLETED" ? new Date() : null,
        },
      });

      created += 1;
    }
  }

  return { created, total: await prisma.task.count() };
}

async function seedPatientEvents(
  nurses: User[],
  doctors: User[],
) {
  await prisma.patientEvent.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: "asc" },
  });

  const EVENT_TYPES = [
    "PATIENT_ADMITTED",
    "MEDICATION_ADMINISTERED",
    "LAB_COMPLETED",
    "NEW_DOCTOR_ORDER",
    "DISCHARGE_READY",
  ] as const;

  let created = 0;

  for (const [index, patient] of patients.entries()) {
    const actor = pick(nurses, index).name;
    const eventsForPatient = Math.min(3, EVENT_TYPES.length);

    for (let eventIndex = 0; eventIndex < eventsForPatient; eventIndex += 1) {
      const eventType = EVENT_TYPES[eventIndex]!;
      const timestamp = new Date(
        Date.now() - (index * 43_200_000 + eventIndex * 7_200_000),
      );

      await prisma.patientEvent.create({
        data: {
          patientId: patient.id,
          eventType,
          description: `${eventType.replaceAll("_", " ").toLowerCase()} for ${patient.firstName} ${patient.lastName}`,
          createdBy: eventIndex % 2 === 0 ? actor : pick(doctors, index).name,
          timestamp,
        },
      });

      created += 1;
    }
  }

  return { created, total: await prisma.patientEvent.count() };
}

async function seedVitalSigns(nurses: User[]) {
  await prisma.vitalSign.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;

  for (const [index, patient] of patients.entries()) {
    const readings = 2 + (index % 2);
    for (let reading = 0; reading < readings; reading += 1) {
      const recordedAt = new Date(
        Date.now() - (index * 28_800_000 + reading * 14_400_000),
      );

      await prisma.vitalSign.create({
        data: {
          patientId: patient.id,
          recordedById: pick(nurses, index + reading).id,
          bloodPressure: pick(["118/76", "120/80", "128/84", "110/70"] as const, index + reading),
          pulse: 68 + ((index + reading) % 18),
          temperature: 98.2 + ((index + reading) % 5) * 0.2,
          respRate: 14 + ((index + reading) % 6),
          o2Saturation: 95 + ((index + reading) % 5),
          recordedAt,
        },
      });

      created += 1;
    }
  }

  return { created, total: await prisma.vitalSign.count() };
}

async function seedBeds(departments: Array<{ id: string; name: string }>) {
  await prisma.bed.deleteMany({});

  let created = 0;

  for (const department of departments) {
    const prefix = DEPT_ROOM_PREFIX[department.name] ?? "2A";
    for (let i = 1; i <= 8; i += 1) {
      const roomLabel = `${prefix}-${String(i).padStart(2, "0")}`;
      await prisma.bed.create({
        data: {
          roomLabel,
          departmentId: department.id,
          status: "AVAILABLE",
        },
      });
      created += 1;
    }
  }

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null, room: { not: null } },
    select: { id: true, room: true },
  });

  for (const patient of patients) {
    if (!patient.room) continue;
    await prisma.bed.updateMany({
      where: { roomLabel: patient.room },
      data: { status: "OCCUPIED", patientId: patient.id },
    });
  }

  return { created, total: await prisma.bed.count() };
}

async function seedAmbulances() {
  await prisma.ambulance.deleteMany({});

  const units = [
    { unitLabel: "AMB-01", label: "Unit 1 — Downtown" },
    { unitLabel: "AMB-02", label: "Unit 2 — North campus" },
    { unitLabel: "AMB-03", label: "Unit 3 — South campus" },
    { unitLabel: "AMB-04", label: "Unit 4 — ICU transfer" },
    { unitLabel: "AMB-05", label: "Unit 5 — Emergency" },
    { unitLabel: "AMB-06", label: "Unit 6 — Pediatrics" },
  ];

  for (const [index, unit] of units.entries()) {
    await prisma.ambulance.create({
      data: {
        unitLabel: unit.unitLabel,
        label: unit.label,
        status: index < 4 ? "AVAILABLE" : "DISPATCHED",
      },
    });
  }

  return { created: units.length, total: await prisma.ambulance.count() };
}

async function seedDischargeConditions() {
  await prisma.dischargeCondition.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, status: true, department: { select: { name: true } } },
  });

  let created = 0;

  for (const patient of patients) {
    for (const [index, condition] of DISCHARGE_CONDITION_NAMES.entries()) {
      const complete =
        patient.status === "DISCHARGED" ||
        (patient.status === "ACTIVE" && index < 2);

      await prisma.dischargeCondition.create({
        data: {
          patientId: patient.id,
          condition,
          status: complete ? "COMPLETE" : "INCOMPLETE",
          owningDepartment:
            condition === "Medication prepared"
              ? "Pharmacy"
              : condition === "Transportation"
                ? "Transport"
                : patient.department.name,
        },
      });
      created += 1;
    }
  }

  return { created, total: await prisma.dischargeCondition.count() };
}

async function seedNotifications(nurses: User[], doctors: User[]) {
  await prisma.notification.deleteMany({});

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null, status: { not: "DISCHARGED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      priority: true,
      assignedNurseId: true,
      assignedDoctorId: true,
    },
    take: 30,
  });

  let created = 0;

  for (const [index, patient] of patients.entries()) {
    const summary =
      patient.priority === "CRITICAL" || patient.priority === "HIGH"
        ? `${patient.firstName} ${patient.lastName} needs urgent review`
        : `${patient.firstName} ${patient.lastName} has an updated care plan`;

    await prisma.notification.create({
      data: {
        patientId: patient.id,
        userId: patient.assignedNurseId,
        summary,
        read: index % 4 === 0,
      },
    });
    created += 1;

    if (patient.assignedDoctorId && index % 2 === 0) {
      await prisma.notification.create({
        data: {
          patientId: patient.id,
          userId: patient.assignedDoctorId,
          summary: `Lab results ready for ${patient.firstName} ${patient.lastName}`,
          read: false,
        },
      });
      created += 1;
    }
  }

  void nurses;
  void doctors;

  return { created, total: await prisma.notification.count() };
}

async function main(): Promise<void> {
  console.log("[pulse-backend] Seeding database...");

  const departments = await seedDepartments();
  const departmentIds = departments.map((department) => department.id);
  const { nurses, doctors, admins } = await seedUsers(departmentIds);
  const patientResult = await seedPatients(
    departments,
    nurses,
    doctors,
  );
  const bedResult = await seedBeds(departments);
  const ambulanceResult = await seedAmbulances();
  const dischargeConditionResult = await seedDischargeConditions();
  const notificationResult = await seedNotifications(nurses, doctors);
  const consultationResult = await seedConsultations(
    doctors.map((doctor) => doctor.id),
    departmentIds,
  );
  const workflowEventResult = await seedWorkflowEvents(
    nurses.map((nurse) => nurse.id),
    doctors.map((doctor) => doctor.id),
  );
  const taskResult = await seedTasks(
    nurses.map((nurse) => nurse.id),
    doctors.map((doctor) => doctor.id),
  );
  const patientEventResult = await seedPatientEvents(nurses, doctors);
  const vitalSignResult = await seedVitalSigns(nurses);

  const totalPatients = await prisma.patient.count({
    where: { deletedAt: null },
  });

  const totalUsers = await prisma.user.count();

  console.log("[pulse-backend] Seed complete:");
  console.log({
    departments: departments.length,
    nurses: nurses.length,
    doctors: doctors.length,
    admins: admins.length,
    totalUsers,
    patientsCreated: patientResult.created,
    patientsUpdated: patientResult.updated,
    totalActivePatients: totalPatients,
    consultationsCreated: consultationResult.created,
    totalConsultations: consultationResult.total,
    workflowEventsCreated: workflowEventResult.created,
    totalWorkflowEvents: workflowEventResult.total,
    tasksCreated: taskResult.created,
    totalTasks: taskResult.total,
    patientEventsCreated: patientEventResult.created,
    totalPatientEvents: patientEventResult.total,
    vitalSignsCreated: vitalSignResult.created,
    totalVitalSigns: vitalSignResult.total,
    bedsCreated: bedResult.created,
    totalBeds: bedResult.total,
    ambulancesCreated: ambulanceResult.created,
    totalAmbulances: ambulanceResult.total,
    dischargeConditionsCreated: dischargeConditionResult.created,
    totalDischargeConditions: dischargeConditionResult.total,
    notificationsCreated: notificationResult.created,
    totalNotifications: notificationResult.total,
  });
}

main()
  .catch((error: unknown) => {
    console.error("[pulse-backend] Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
