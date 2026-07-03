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
] as const;

const DOCTORS = [
  { name: "Dr. Michael Chen", email: "mchen.doctor@pulse.com" },
  { name: "Dr. Lisa Patel", email: "lpatel.doctor@pulse.com" },
  { name: "Dr. James Wilson", email: "jwilson.doctor@pulse.com" },
  { name: "Dr. Anna Rivera", email: "arivera.doctor@pulse.com" },
  { name: "Dr. Robert Hayes", email: "rhayes.doctor@pulse.com" },
  { name: "Dr. Karen Mitchell", email: "kmitchell.doctor@pulse.com" },
] as const;

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];
const STATUSES: PatientStatus[] = ["ACTIVE", "WAITING", "DISCHARGED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const PATIENT_COUNT = 50;

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

async function seedUsers() {
  const nurses: User[] = [];
  const doctors: User[] = [];

  for (const nurse of NURSES) {
    nurses.push(
      await prisma.user.upsert({
        where: { email: nurse.email },
        update: { name: nurse.name, role: "NURSE" },
        create: { name: nurse.name, email: nurse.email, role: "NURSE" },
      }),
    );
  }

  for (const doctor of DOCTORS) {
    doctors.push(
      await prisma.user.upsert({
        where: { email: doctor.email },
        update: { name: doctor.name, role: "DOCTOR" },
        create: { name: doctor.name, email: doctor.email, role: "DOCTOR" },
      }),
    );
  }

  return { nurses, doctors };
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

async function main(): Promise<void> {
  console.log("[pulse-backend] Seeding database...");

  const departments = await seedDepartments();
  const { nurses, doctors } = await seedUsers();
  const patientResult = await seedPatients(
    departments.map((department) => department.id),
    nurses.map((nurse) => nurse.id),
    doctors.map((doctor) => doctor.id),
  );

  const totalPatients = await prisma.patient.count({
    where: { deletedAt: null },
  });

  console.log("[pulse-backend] Seed complete:");
  console.log({
    departments: departments.length,
    nurses: nurses.length,
    doctors: doctors.length,
    patientsCreated: patientResult.created,
    patientsUpdated: patientResult.updated,
    totalActivePatients: totalPatients,
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
