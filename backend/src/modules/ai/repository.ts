import type { Prisma, PrismaClient } from "@prisma/client";

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
      title: true,
      status: true,
      eventType: true,
      occurredAt: true,
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
}
