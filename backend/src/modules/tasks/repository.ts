import type { Prisma, PrismaClient, TaskStatus } from "@prisma/client";
import type {
  CreateTaskInput,
  TaskListQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./types.js";

const taskSummarySelect = {
  id: true,
  patientId: true,
  title: true,
  description: true,
  assignedTo: true,
  status: true,
  dueAt: true,
  completedAt: true,
} satisfies Prisma.TaskSelect;

const taskDetailInclude = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      firstName: true,
      lastName: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskSummaryRecord = Prisma.TaskGetPayload<{
  select: typeof taskSummarySelect;
}>;

export type TaskDetailRecord = Prisma.TaskGetPayload<{
  include: typeof taskDetailInclude;
}>;

export class TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: TaskListQuery) {
    const { page, limit, search, patientId, assignedTo, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      ...(patientId ? { patientId } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              {
                patient: {
                  firstName: { contains: search, mode: "insensitive" },
                },
              },
              {
                patient: {
                  lastName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.task.findMany({
        where,
        select: taskSummarySelect,
        skip,
        take: limit,
        orderBy: [{ dueAt: "asc" }, { title: "asc" }],
      }),
      this.db.task.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<TaskDetailRecord | null> {
    return this.db.task.findUnique({
      where: { id },
      include: taskDetailInclude,
    });
  }

  async create(data: CreateTaskInput): Promise<TaskSummaryRecord> {
    return this.db.task.create({
      data: {
        patientId: data.patientId,
        title: data.title,
        description: data.description ?? null,
        assignedTo: data.assignedTo,
        status: data.status,
        dueAt: data.dueAt ?? null,
        ...(data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
      select: taskSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdateTaskInput,
  ): Promise<TaskSummaryRecord | null> {
    const existing = await this.db.task.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.task.update({
      where: { id },
      data: {
        ...(data.patientId !== undefined ? { patientId: data.patientId } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
      },
      select: taskSummarySelect,
    });
  }

  async updateStatus(
    id: string,
    data: UpdateTaskStatusInput,
  ): Promise<TaskSummaryRecord | null> {
    const existing = await this.db.task.findUnique({
      where: { id },
      select: { id: true, completedAt: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.task.update({
      where: { id },
      data: {
        status: data.status,
        ...this.buildStatusTimestamps(data.status, existing.completedAt),
      },
      select: taskSummarySelect,
    });
  }

  private buildStatusTimestamps(
    status: TaskStatus,
    completedAt: Date | null,
  ): Pick<Prisma.TaskUpdateInput, "completedAt"> {
    if (status === "COMPLETED" && !completedAt) {
      return { completedAt: new Date() };
    }

    if (status !== "COMPLETED") {
      return { completedAt: null };
    }

    return {};
  }

  async patientExists(id: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async assigneeExists(id: string): Promise<boolean> {
    const count = await this.db.user.count({
      where: { id, active: true },
    });
    return count > 0;
  }
}
