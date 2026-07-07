import type {
  Prisma,
  PrismaClient,
  WorkflowEventStatus,
} from "@prisma/client";
import type {
  CreateWorkflowEventInput,
  UpdateWorkflowEventInput,
  UpdateWorkflowEventStatusInput,
  WorkflowEventListQuery,
} from "./types.js";

const workflowEventSummarySelect = {
  id: true,
  patientId: true,
  title: true,
  description: true,
  eventType: true,
  status: true,
  sequence: true,
  createdBy: true,
  occurredAt: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkflowEventSelect;

const workflowEventDetailInclude = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      firstName: true,
      lastName: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.WorkflowEventInclude;

export type WorkflowEventSummaryRecord = Prisma.WorkflowEventGetPayload<{
  select: typeof workflowEventSummarySelect;
}>;

export type WorkflowEventDetailRecord = Prisma.WorkflowEventGetPayload<{
  include: typeof workflowEventDetailInclude;
}>;

export class WorkflowEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: WorkflowEventListQuery) {
    const { page, limit, search, patientId, status, eventType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkflowEventWhereInput = {
      ...(patientId ? { patientId } : {}),
      ...(status ? { status } : {}),
      ...(eventType ? { eventType } : {}),
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
      this.db.workflowEvent.findMany({
        where,
        select: workflowEventSummarySelect,
        skip,
        take: limit,
        orderBy: [{ sequence: "asc" }, { occurredAt: "desc" }],
      }),
      this.db.workflowEvent.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<WorkflowEventDetailRecord | null> {
    return this.db.workflowEvent.findUnique({
      where: { id },
      include: workflowEventDetailInclude,
    });
  }

  async findByPatientSequence(patientId: string, sequence: number) {
    return this.db.workflowEvent.findUnique({
      where: {
        patientId_sequence: { patientId, sequence },
      },
      select: { id: true },
    });
  }

  async create(
    data: CreateWorkflowEventInput,
  ): Promise<WorkflowEventSummaryRecord> {
    return this.db.workflowEvent.create({
      data: {
        patientId: data.patientId,
        title: data.title,
        description: data.description ?? null,
        eventType: data.eventType,
        status: data.status,
        sequence: data.sequence,
        createdBy: data.createdBy ?? null,
        occurredAt: data.occurredAt ?? new Date(),
        ...(data.status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
        ...(data.status === "COMPLETED"
          ? { startedAt: new Date(), completedAt: new Date() }
          : {}),
      },
      select: workflowEventSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdateWorkflowEventInput,
  ): Promise<WorkflowEventSummaryRecord | null> {
    const existing = await this.db.workflowEvent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.workflowEvent.update({
      where: { id },
      data: {
        ...(data.patientId !== undefined ? { patientId: data.patientId } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.eventType !== undefined ? { eventType: data.eventType } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.sequence !== undefined ? { sequence: data.sequence } : {}),
        ...(data.createdBy !== undefined ? { createdBy: data.createdBy } : {}),
        ...(data.occurredAt !== undefined ? { occurredAt: data.occurredAt } : {}),
      },
      select: workflowEventSummarySelect,
    });
  }

  async updateStatus(
    id: string,
    data: UpdateWorkflowEventStatusInput,
  ): Promise<WorkflowEventSummaryRecord | null> {
    const existing = await this.db.workflowEvent.findUnique({
      where: { id },
      select: { id: true, startedAt: true, completedAt: true },
    });

    if (!existing) {
      return null;
    }

    const timestamps = this.buildStatusTimestamps(
      data.status,
      existing.startedAt,
      existing.completedAt,
    );

    return this.db.workflowEvent.update({
      where: { id },
      data: {
        status: data.status,
        ...timestamps,
      },
      select: workflowEventSummarySelect,
    });
  }

  private buildStatusTimestamps(
    status: WorkflowEventStatus,
    startedAt: Date | null,
    completedAt: Date | null,
  ): Pick<Prisma.WorkflowEventUpdateInput, "startedAt" | "completedAt"> {
    if (status === "IN_PROGRESS" && !startedAt) {
      return { startedAt: new Date() };
    }

    if (status === "COMPLETED") {
      return {
        startedAt: startedAt ?? new Date(),
        completedAt: completedAt ?? new Date(),
      };
    }

    return {};
  }

  async patientExists(id: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async userExists(id: string): Promise<boolean> {
    const count = await this.db.user.count({
      where: { id, active: true },
    });
    return count > 0;
  }
}
