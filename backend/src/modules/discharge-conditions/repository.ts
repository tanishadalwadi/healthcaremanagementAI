import type { Prisma, PrismaClient } from "@prisma/client";
import type { UpdateDischargeConditionInput } from "./types.js";

const dischargeConditionSelect = {
  id: true,
  patientId: true,
  condition: true,
  status: true,
  owningDepartment: true,
  updatedAt: true,
} satisfies Prisma.DischargeConditionSelect;

export type DischargeConditionRecord = Prisma.DischargeConditionGetPayload<{
  select: typeof dischargeConditionSelect;
}>;

export class DischargeConditionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByPatient(patientId: string): Promise<DischargeConditionRecord[]> {
    return this.db.dischargeCondition.findMany({
      where: { patientId },
      select: dischargeConditionSelect,
      orderBy: { condition: "asc" },
    });
  }

  async findById(id: string): Promise<DischargeConditionRecord | null> {
    return this.db.dischargeCondition.findUnique({
      where: { id },
      select: dischargeConditionSelect,
    });
  }

  async patientExists(patientId: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id: patientId, deletedAt: null },
    });
    return count > 0;
  }

  async updateStatus(
    id: string,
    input: UpdateDischargeConditionInput,
  ): Promise<DischargeConditionRecord | null> {
    try {
      return await this.db.dischargeCondition.update({
        where: { id },
        data: { status: input.status },
        select: dischargeConditionSelect,
      });
    } catch {
      return null;
    }
  }
}
