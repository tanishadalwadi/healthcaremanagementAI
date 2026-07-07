import type { Prisma, PrismaClient } from "@prisma/client";
import type { AiScope } from "./types.js";

const patientContextInclude = {
  department: {
    select: {
      name: true,
    },
  },
  assignedNurse: {
    select: {
      name: true,
    },
  },
  assignedDoctor: {
    select: {
      name: true,
    },
  },
  workflowEvents: {
    orderBy: { sequence: "asc" as const },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      eventType: true,
      occurredAt: true,
      completedAt: true,
      sequence: true,
    },
  },
  tasks: {
    select: {
      title: true,
      status: true,
      dueAt: true,
    },
    orderBy: { dueAt: "asc" as const },
  },
  vitalSigns: {
    take: 1,
    orderBy: { recordedAt: "desc" as const },
    select: {
      bloodPressure: true,
      pulse: true,
      temperature: true,
      respRate: true,
      o2Saturation: true,
      recordedAt: true,
    },
  },
  dischargeConditions: {
    select: {
      condition: true,
      status: true,
      owningDepartment: true,
    },
  },
} satisfies Prisma.PatientInclude;

export type PatientContextRecord = Prisma.PatientGetPayload<{
  include: typeof patientContextInclude;
}>;

export interface HospitalStats {
  admittedCount: number;
  dischargedCount: number;
  waitingDischargeCount: number;
  availableBeds: number;
  availableAmbulances: number;
  dispatchedAmbulances: number;
  bedsByDepartment: Record<string, number>;
}

export class AiRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPatientContext(
    patientId: string,
  ): Promise<PatientContextRecord | null> {
    return this.db.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: patientContextInclude,
    });
  }

  async listPatientContextsForScope(
    scope: AiScope,
    userId: string | undefined,
    limit = 40,
  ): Promise<PatientContextRecord[]> {
    const where: Prisma.PatientWhereInput = { deletedAt: null };

    if (scope === "admin") {
      where.status = { not: "DISCHARGED" };
    } else if (scope === "doctor") {
      where.assignedDoctorId = userId;
      where.status = { not: "DISCHARGED" };
    } else {
      where.assignedNurseId = userId;
      where.status = { not: "DISCHARGED" };
    }

    return this.db.patient.findMany({
      where,
      include: patientContextInclude,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
  }

  async getHospitalStats(): Promise<HospitalStats> {
    const [
      admittedCount,
      dischargedCount,
      waitingDischargeCount,
      availableBeds,
      availableAmbulances,
      dispatchedAmbulances,
      beds,
    ] = await Promise.all([
      this.db.patient.count({
        where: { deletedAt: null, status: { not: "DISCHARGED" } },
      }),
      this.db.patient.count({
        where: { deletedAt: null, status: "DISCHARGED" },
      }),
      this.db.patient.count({
        where: { deletedAt: null, status: "WAITING" },
      }),
      this.db.bed.count({ where: { status: "AVAILABLE" } }),
      this.db.ambulance.count({ where: { status: "AVAILABLE" } }),
      this.db.ambulance.count({ where: { status: "DISPATCHED" } }),
      this.db.bed.findMany({
        where: { status: "AVAILABLE" },
        select: {
          department: { select: { name: true } },
        },
      }),
    ]);

    const bedsByDepartment = beds.reduce<Record<string, number>>(
      (acc, bed) => {
        const dept = bed.department.name;
        acc[dept] = (acc[dept] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return {
      admittedCount,
      dischargedCount,
      waitingDischargeCount,
      availableBeds,
      availableAmbulances,
      dispatchedAmbulances,
      bedsByDepartment,
    };
  }
}
