import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserListQuery,
} from "./types.js";

const activePatientFilter = {
  deletedAt: null,
} satisfies Prisma.PatientWhereInput;

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const userDetailInclude = {
  department: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  _count: {
    select: {
      assignedPatientsAsNurse: {
        where: activePatientFilter,
      },
      assignedPatientsAsDoctor: {
        where: activePatientFilter,
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserSummaryRecord = Prisma.UserGetPayload<{
  select: typeof userSummarySelect;
}>;

export type UserDetailRecord = Prisma.UserGetPayload<{
  include: typeof userDetailInclude;
}>;

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: UserListQuery) {
    const { page, limit, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.user.findMany({
        where,
        select: userSummarySelect,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.db.user.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<UserDetailRecord | null> {
    return this.db.user.findUnique({
      where: { id },
      include: userDetailInclude,
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
  }

  async create(data: CreateUserInput): Promise<UserSummaryRecord> {
    return this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId ?? null,
      },
      select: userSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdateUserInput,
  ): Promise<UserSummaryRecord | null> {
    const existing = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.departmentId !== undefined
          ? { departmentId: data.departmentId }
          : {}),
      },
      select: userSummarySelect,
    });
  }

  async updateStatus(
    id: string,
    data: UpdateUserStatusInput,
  ): Promise<UserSummaryRecord | null> {
    const existing = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.user.update({
      where: { id },
      data: { active: data.active },
      select: userSummarySelect,
    });
  }

  async departmentExists(id: string): Promise<boolean> {
    const count = await this.db.department.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }
}
