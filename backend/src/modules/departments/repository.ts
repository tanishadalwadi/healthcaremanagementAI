import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateDepartmentInput,
  DepartmentListQuery,
  UpdateDepartmentInput,
} from "./types.js";

const departmentSummarySelect = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

const activePatientFilter = {
  deletedAt: null,
} satisfies Prisma.PatientWhereInput;

export type DepartmentSummaryRecord = Prisma.DepartmentGetPayload<{
  select: typeof departmentSummarySelect;
}>;

export type DepartmentDetailRecord = DepartmentSummaryRecord & {
  _count: {
    patients: number;
  };
};

export class DepartmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: DepartmentListQuery) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.department.findMany({
        where,
        select: departmentSummarySelect,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.db.department.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<DepartmentDetailRecord | null> {
    const department = await this.db.department.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...departmentSummarySelect,
        _count: {
          select: {
            patients: {
              where: activePatientFilter,
            },
          },
        },
      },
    });

    if (!department) {
      return null;
    }

    return {
      id: department.id,
      name: department.name,
      status: department.status,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      _count: department._count,
    };
  }

  async findByName(name: string) {
    return this.db.department.findFirst({
      where: { name, deletedAt: null },
      select: { id: true },
    });
  }

  async create(data: CreateDepartmentInput): Promise<DepartmentSummaryRecord> {
    return this.db.department.create({
      data: {
        name: data.name,
        status: data.status,
      },
      select: departmentSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdateDepartmentInput,
  ): Promise<DepartmentSummaryRecord | null> {
    const existing = await this.db.department.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      select: departmentSummarySelect,
    });
  }

  async softDelete(id: string): Promise<DepartmentSummaryRecord | null> {
    const existing = await this.db.department.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.department.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: departmentSummarySelect,
    });
  }

  async countActivePatients(departmentId: string): Promise<number> {
    return this.db.patient.count({
      where: {
        departmentId,
        deletedAt: null,
      },
    });
  }
}
