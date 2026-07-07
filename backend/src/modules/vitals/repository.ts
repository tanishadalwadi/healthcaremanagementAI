import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateVitalSignInput, VitalSignListQuery } from "./types.js";

const vitalSignSelect = {
  id: true,
  patientId: true,
  recordedById: true,
  bloodPressure: true,
  pulse: true,
  temperature: true,
  respRate: true,
  o2Saturation: true,
  recordedAt: true,
} satisfies Prisma.VitalSignSelect;

export type VitalSignRecord = Prisma.VitalSignGetPayload<{
  select: typeof vitalSignSelect;
}>;

export class VitalSignRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPatient(patientId: string, query: VitalSignListQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VitalSignWhereInput = { patientId };

    const [items, total] = await this.db.$transaction([
      this.db.vitalSign.findMany({
        where,
        select: vitalSignSelect,
        skip,
        take: limit,
        orderBy: { recordedAt: "desc" },
      }),
      this.db.vitalSign.count({ where }),
    ]);

    return { items, total };
  }

  async create(
    patientId: string,
    data: CreateVitalSignInput,
  ): Promise<VitalSignRecord> {
    return this.db.vitalSign.create({
      data: {
        patientId,
        bloodPressure: data.bloodPressure,
        pulse: data.pulse,
        temperature: data.temperature,
        respRate: data.respRate,
        o2Saturation: data.o2Saturation,
        recordedById: data.recordedById ?? null,
      },
      select: vitalSignSelect,
    });
  }

  async patientExists(patientId: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id: patientId, deletedAt: null },
    });
    return count > 0;
  }
}
