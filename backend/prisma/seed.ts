import {
  Gender,
  PatientStatus,
  Priority,
  PrismaClient,
  type User,
} from "@prisma/client";

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

const FIRST_NAMES = [
  "John",
  "Jane",
  "Michael",
  "Emily",
  "David",
  "Sarah",
  "James",
  "Olivia",
  "Robert",
  "Sophia",
  "William",
  "Ava",
  "Joseph",
  "Mia",
  "Daniel",
  "Charlotte",
  "Matthew",
  "Amelia",
  "Anthony",
  "Harper",
  "Mark",
  "Evelyn",
  "Donald",
  "Abigail",
  "Steven",
  "Elizabeth",
  "Paul",
  "Sofia",
  "Andrew",
  "Avery",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
];

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
  {
    title: "Patient Admission",
    eventType: "ADMISSION",
    status: "COMPLETED",
  },
  {
    title: "Triage Assessment",
    eventType: "TRIAGE",
    status: "COMPLETED",
  },
  {
    title: "Lab Work Ordered",
    eventType: "LAB_ORDERED",
    status: "IN_PROGRESS",
  },
  {
    title: "Physician Consultation",
    eventType: "CONSULTATION",
    status: "PENDING",
  },
  {
    title: "Discharge Planning",
    eventType: "DISCHARGE_PLANNING",
    status: "PENDING",
  },
] as const;

const WORKFLOW_PATIENT_COUNT = 20;
const TASK_COUNT = 40;

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

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function roomFor(index: number): string {
  const floor = (index % 5) + 2;
  const unit = String.fromCharCode(65 + (index % 4));
  const bed = (index % 9) + 1;
  return `${floor}${unit}${bed}`;
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
        },
        create: {
          name: nurse.name,
          email: nurse.email,
          role: "NURSE",
          departmentId: pick(departmentIds, index),
          active: true,
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
        },
        create: {
          name: doctor.name,
          email: doctor.email,
          role: "DOCTOR",
          departmentId: pick(departmentIds, index + 2),
          active: true,
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
        },
        create: {
          name: admin.name,
          email: admin.email,
          role: "ADMIN",
          active: true,
        },
      }),
    );
  }

  return { nurses, doctors, admins };
}

async function seedPatients(
  departmentIds: string[],
  nurseIds: string[],
  doctorIds: string[],
) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < PATIENT_COUNT; index += 1) {
    const patientNumber = `P-${String(1001 + index).padStart(4, "0")}`;
    const firstName = pick(FIRST_NAMES, index);
    const lastName = pick(LAST_NAMES, index * 3);
    const age = 18 + (index % 62);
    const gender = pick(GENDERS, index);
    const status = pick(STATUSES, index);
    const priority = pick(PRIORITIES, index * 2);
    const departmentId = pick(departmentIds, index);
    const assignedNurseId = pick(nurseIds, index);
    const assignedDoctorId = pick(doctorIds, index * 5);

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
        room: roomFor(index),
        status,
        priority,
        departmentId,
        assignedNurseId,
        assignedDoctorId,
        deletedAt: null,
      },
      create: {
        patientNumber,
        firstName,
        lastName,
        age,
        gender,
        room: roomFor(index),
        status,
        priority,
        departmentId,
        assignedNurseId,
        assignedDoctorId,
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
  const existingCount = await prisma.workflowEvent.count();

  if (existingCount > 0) {
    return { created: 0, total: existingCount };
  }

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: WORKFLOW_PATIENT_COUNT,
  });

  let created = 0;

  for (const [patientIndex, patient] of patients.entries()) {
    for (const [eventIndex, template] of WORKFLOW_EVENT_TEMPLATE.entries()) {
      const occurredAt = new Date(
        Date.now() - (patientIndex * 86_400_000 + eventIndex * 3_600_000),
      );
      const creatorId = pick(nurseIds, patientIndex + eventIndex);

      await prisma.workflowEvent.create({
        data: {
          patientId: patient.id,
          title: template.title,
          description: `${template.title} for patient workflow timeline`,
          eventType: template.eventType,
          status: template.status,
          sequence: eventIndex + 1,
          createdBy: creatorId,
          occurredAt,
          startedAt:
            template.status === "IN_PROGRESS" || template.status === "COMPLETED"
              ? new Date(occurredAt.getTime() + 900_000)
              : null,
          completedAt:
            template.status === "COMPLETED"
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
  const existingCount = await prisma.task.count();

  if (existingCount > 0) {
    return { created: 0, total: existingCount };
  }

  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: TASK_COUNT,
  });

  const staffIds = [...nurseIds, ...doctorIds];
  let created = 0;

  for (const [index, patient] of patients.entries()) {
    const status = pick(TASK_STATUSES, index);
    const dueAt = new Date(Date.now() + (index + 1) * 3_600_000);

    await prisma.task.create({
      data: {
        patientId: patient.id,
        title: pick(TASK_TITLES, index),
        description: "Routine care task generated for Pulse workflow testing",
        assignedTo: pick(staffIds, index),
        status,
        dueAt,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    created += 1;
  }

  return { created, total: await prisma.task.count() };
}

async function main(): Promise<void> {
  console.log("[pulse-backend] Seeding database...");

  const departments = await seedDepartments();
  const departmentIds = departments.map((department) => department.id);
  const { nurses, doctors, admins } = await seedUsers(departmentIds);
  const patientResult = await seedPatients(
    departmentIds,
    nurses.map((nurse) => nurse.id),
    doctors.map((doctor) => doctor.id),
  );
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
