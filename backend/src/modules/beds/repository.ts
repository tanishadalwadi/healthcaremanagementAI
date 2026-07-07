import type { Prisma, PrismaClient } from "@prisma/client";
import type { BedListQuery } from "./types.js";

const bedSelect = {
  id: true,
  roomLabel: true,
  departmentId: true,
  status: true,
  patientId: true,
  department: {
    select: {
      name: true,
    },
  },
  patient: {
    select: {
      firstName: true,
      lastName: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.BedSelect;

export type BedRecord = Prisma.BedGetPayload<{
  select: typeof bedSelect;
}>;

export class BedRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: BedListQuery) {
    const { page, limit, departmentId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BedWhereInput = {
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.bed.findMany({
        where,
        select: bedSelect,
        skip,
        take: limit,
        orderBy: [{ department: { name: "asc" } }, { roomLabel: "asc" }],
      }),
      this.db.bed.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<BedRecord | null> {
    return this.db.bed.findUnique({
      where: { id },
      select: bedSelect,
    });
  }

  async findByPatientId(patientId: string): Promise<BedRecord | null> {
    return this.db.bed.findFirst({
      where: { patientId },
      select: bedSelect,
    });
  }

  async patientExists(patientId: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id: patientId, deletedAt: null },
    });
    return count > 0;
  }

  async assignBed(bedId: string, patientId: string, roomLabel: string) {
    return this.db.$transaction(async (tx) => {
      const existingBed = await tx.bed.findFirst({
        where: { patientId },
        select: { id: true },
      });

      if (existingBed && existingBed.id !== bedId) {
        await tx.bed.update({
          where: { id: existingBed.id },
          data: { patientId: null, status: "AVAILABLE" },
        });
      }

      const bed = await tx.bed.update({
        where: { id: bedId },
        data: {
          patientId,
          status: "OCCUPIED",
        },
        select: bedSelect,
      });

      await tx.patient.update({
        where: { id: patientId },
        data: { room: roomLabel },
      });

      return bed;
    });
  }

  async releaseBed(bedId: string) {
    return this.db.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({
        where: { id: bedId },
        select: { patientId: true, roomLabel: true },
      });

      if (!bed) {
        return null;
      }

      if (bed.patientId) {
        await tx.patient.update({
          where: { id: bed.patientId },
          data: { room: null },
        });
      }

      return tx.bed.update({
        where: { id: bedId },
        data: {
          patientId: null,
          status: "AVAILABLE",
        },
        select: bedSelect,
      });
    });
  }
}
