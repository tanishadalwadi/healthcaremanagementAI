import type { Prisma, PrismaClient } from "@prisma/client";
import type { AmbulanceListQuery, UpdateAmbulanceStatusInput } from "./types.js";

const ambulanceSelect = {
  id: true,
  unitLabel: true,
  label: true,
  status: true,
} satisfies Prisma.AmbulanceSelect;

export type AmbulanceRecord = Prisma.AmbulanceGetPayload<{
  select: typeof ambulanceSelect;
}>;

export class AmbulanceRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: AmbulanceListQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AmbulanceWhereInput = {
      ...(status ? { status } : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.ambulance.findMany({
        where,
        select: ambulanceSelect,
        skip,
        take: limit,
        orderBy: { unitLabel: "asc" },
      }),
      this.db.ambulance.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<AmbulanceRecord | null> {
    return this.db.ambulance.findUnique({
      where: { id },
      select: ambulanceSelect,
    });
  }

  async updateStatus(
    id: string,
    input: UpdateAmbulanceStatusInput,
  ): Promise<AmbulanceRecord | null> {
    try {
      return await this.db.ambulance.update({
        where: { id },
        data: { status: input.status },
        select: ambulanceSelect,
      });
    } catch {
      return null;
    }
  }
}
